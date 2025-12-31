import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { Room, TapResponse, NFCStatus, RoomActivity, EmployeeInRoom } from '../context/types';
import { apiService } from '../services/apiService';
import { nfcService } from '../services/nfcService';

export const useRoomTracking = (navigation: any) => {
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showRoomSelector, setShowRoomSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [nfcStatus, setNfcStatus] = useState<NFCStatus>({ hasNfc: null, enabled: null });
  const [lastTap, setLastTap] = useState<TapResponse | null>(null);
  const [roomLogs, setRoomLogs] = useState<RoomActivity[]>([]);
  const [employeesInRoom, setEmployeesInRoom] = useState<EmployeeInRoom[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const handleRoomTap = async (uid: string) => {
    if (isLoading || !selectedRoom) return;
    
    setIsLoading(true);

    try {
      const tapData = await apiService.processTap(uid, selectedRoom.id);
      setLastTap(tapData);
      setCurrentRoom(tapData.room);
      
      await fetchAllData();
      
      const actionText = tapData.action === 'enter' ? 'entered' : 'exited';
      Alert.alert('Success', `${tapData.employee?.name || 'Employee'} ${actionText} ${selectedRoom.name}`);
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        Alert.alert('Timeout Error', 'Server took too long to process the tap.');
      } else if (error.message?.includes('not registered')) {
        Alert.alert(
          'Employee Not Registered',
          'This RFID card is not registered in the system.',
          [
            { text: 'OK' },
            { text: 'Register Now', onPress: () => navigation.navigate('Register', { uid }) }
          ]
        );
      } else if (error.message?.includes('Network request failed')) {
        Alert.alert('Connection Error', 'Cannot connect to server. Check your network connection.');
      } else {
        Alert.alert('Tap Failed', error.message || 'Unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startRFIDScan = async () => {
    if (!selectedRoom) {
      Alert.alert('No Room Selected', 'Please select a room first.');
      setShowRoomSelector(true);
      return;
    }

    const currentStatus = await nfcService.checkNfcStatus();
    setNfcStatus(currentStatus);
    
    if (!currentStatus.hasNfc) {
      Alert.alert('NFC Not Supported', 'NFC is not supported on this device.');
      return;
    }

    if (!currentStatus.enabled) {
      Alert.alert(
        'NFC Disabled', 
        'Please enable NFC in your device settings and try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Refresh Status', onPress: refreshNfcStatus }
        ]
      );
      return;
    }

    setIsScanning(true);
    
    try {
      await nfcService.startScanning(
        (uid) => {
          stopRFIDScan();
          handleRoomTap(uid);
        },
        () => setIsScanning(false)
      );

      setTimeout(() => {
        if (isScanning) {
          stopRFIDScan();
          Alert.alert('Scanning Timeout', 'No card detected. Tap "Scan RFID Card" to try again.');
        }
      }, 30000);

    } catch (error: any) {
      if (error.message === 'NFC is not enabled') {
        Alert.alert(
          'NFC Disabled', 
          'NFC was disabled during scanning. Please enable NFC and try again.',
          [
            { text: 'OK', style: 'cancel' },
            { text: 'Refresh Status', onPress: refreshNfcStatus }
          ]
        );
      } else {
        Alert.alert('Scan Error', 'Failed to start NFC scanning. Please try again.');
      }
      setIsScanning(false);
    }
  };

  const fetchRooms = useCallback(async () => {
    try {
      const response = await apiService.getRooms();
      setRooms(response.rooms);
      
      setSelectedRoom(current => current || response.rooms[0]);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to fetch available rooms');
    }
  }, []);

  const fetchRoomStatus = useCallback(async () => {
    if (!selectedRoom) return;
    
    try {
      const roomData = await apiService.getRoomStatus(selectedRoom.id);
      setCurrentRoom(roomData);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        Alert.alert('Timeout Error', 'Server took too long to respond. Please try again.');
      } else {
        Alert.alert('Connection Error', 'Cannot connect to server');
      }
    }
  }, [selectedRoom]);

  const fetchRoomLogs = useCallback(async () => {
    if (!selectedRoom) return;
    
    try {
      const response = await apiService.getRoomActivity(selectedRoom.id);
      setRoomLogs(response.activities);
    } catch (error: any) {
      console.error('Room logs error:', error);
    }
  }, [selectedRoom]);

  const fetchEmployeesInRoom = useCallback(async () => {
    if (!selectedRoom) return;
    
    try {
      const response = await apiService.getEmployeesInRoom(selectedRoom.id);
      
      const employeesWithDuration = response.employees.map(employee => ({
        ...employee,
        duration: calculateDuration(employee.entered_at)
      }));
      
      setEmployeesInRoom(employeesWithDuration);
    } catch (error: any) {
      setEmployeesInRoom([]);
    }
  }, [selectedRoom]);

  const calculateDuration = (enteredAt: string): string => {
    try {
      const enteredTime = new Date(enteredAt).getTime();
      const now = new Date().getTime();
      const diffMs = now - enteredTime;
      
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);
      
      return parts.join(' ');
    } catch (error) {
      return '0m';
    }
  };

  const fetchAllData = useCallback(async () => {
    try {
      setRefreshing(true);
      await fetchRooms();
      if (selectedRoom) {
        await Promise.all([
          fetchRoomStatus(),
          fetchRoomLogs(),
          fetchEmployeesInRoom()
        ]);
      }
    } catch (error) {
      console.error('Error fetching all data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchRooms, fetchRoomStatus, fetchRoomLogs, fetchEmployeesInRoom, selectedRoom]);

  const stopRFIDScan = async () => {
    try {
      await nfcService.stopScanning();
      setIsScanning(false);
    } catch (error) {
      setIsScanning(false);
    }
  };

  const refreshNfcStatus = async () => {
    try {
      setIsLoading(true);
      const status = await nfcService.checkNfcStatus();
      setNfcStatus(status);
      
      if (status.enabled) {
        Alert.alert('✅ NFC Enabled', 'NFC is now enabled and ready to use!');
      } else {
        Alert.alert('❌ NFC Disabled', 'NFC is still disabled. Please enable it in your device settings.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check NFC status');
    } finally {
      setIsLoading(false);
    }
  };

  const testServerConnection = async () => {
    try {
      const connected = await apiService.testConnection();
      if (connected) {
        Alert.alert('✅ Server Connected', 'Connection to server is successful!');
      } else {
        Alert.alert('❌ Server Error', 'Server responded with an error');
      }
    } catch (error: any) {
      Alert.alert('🚫 Connection Failed', 'Cannot reach server');
    }
  };

  const handleRoomSelect = async (room: Room) => {
    setSelectedRoom(room);
    try {
      await Promise.all([
        fetchRoomStatus(),
        fetchRoomLogs(),
        fetchEmployeesInRoom()
      ]);
    } catch (error) {
      console.error('Error refreshing room data:', error);
    }
  };

  const handleOpenRoomSelector = async () => {
    await fetchRooms();
    setShowRoomSelector(true);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedRoom) {
        fetchRoomStatus();
        fetchRooms();
        fetchEmployeesInRoom();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedRoom, fetchRoomStatus, fetchRooms, fetchEmployeesInRoom]);

  useEffect(() => {
    const initNfc = async () => {
      const status = await nfcService.initialize();
      setNfcStatus(status);
    };

    const initializeApp = async () => {
      await initNfc();
      await fetchAllData();
    };

    initializeApp();

    const removeNfcListener = nfcService.addNfcStateListener(setNfcStatus);
    const unsubscribe = navigation.addListener('focus', fetchAllData);

    return () => {
      removeNfcListener();
      unsubscribe();
      nfcService.cleanup();
    };
  }, [fetchAllData, navigation]);

  return {
    currentRoom, rooms, selectedRoom, showRoomSelector, isLoading, isScanning, nfcStatus, lastTap, roomLogs, employeesInRoom, refreshing, fetchAllData, 
    refreshNfcStatus, startRFIDScan, stopRFIDScan, testServerConnection, handleRoomSelect, handleOpenRoomSelector, setShowRoomSelector
  };
};