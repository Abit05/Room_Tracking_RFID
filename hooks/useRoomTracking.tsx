import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { Room, TapResponse, NFCStatus, RoomActivity } from '../context/types';
import { EmployeeInRoom } from '../context/types';
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

  const fetchRooms = useCallback(async () => {
    try {
      console.log('🏢 Fetching available rooms...');
      const response = await apiService.getRooms();
      console.log('✅ Rooms fetched:', response.rooms.length, 'rooms');
      setRooms(response.rooms);
      
      setSelectedRoom(currentSelected => {
        if (!currentSelected && response.rooms.length > 0) {
          return response.rooms[0];
        }
        return currentSelected;
      });
    } catch (error: any) {
      console.error('❌ Rooms fetch error:', error);
      Alert.alert('Error', 'Failed to fetch available rooms');
    }
  }, []);

  const fetchRoomStatus = useCallback(async () => {
    if (!selectedRoom) return;
    
    try {
      console.log('🔄 Fetching room status for:', selectedRoom.name);
      const roomData = await apiService.getRoomStatus(selectedRoom.id);
      console.log('✅ Room status:', roomData);
      setCurrentRoom(roomData);
    } catch (error: any) {
      console.error('❌ Room status error:', error);
      
      if (error.name === 'AbortError') {
        Alert.alert('Timeout Error', 'Server took too long to respond. Please try again.');
      } else {
        Alert.alert(
          'Connection Error', 
          `Cannot connect to server\n\nMake sure:\n• Server is running\n• IP address is correct\n• Devices are on same network`
        );
      }
    }
  }, [selectedRoom]);

  const fetchRoomLogs = useCallback(async () => {
    if (!selectedRoom) return;
    
    try {
      console.log('📋 Fetching room logs for:', selectedRoom.name);
      const response = await apiService.getRoomActivity(selectedRoom.id);
      console.log('✅ Room logs fetched:', response.activities.length, 'items');
      setRoomLogs(response.activities);
    } catch (error: any) {
      console.error('❌ Room logs error:', error);
    }
  }, [selectedRoom]);

  const fetchEmployeesInRoom = useCallback(async () => {
    if (!selectedRoom) return;
    
    try {
      console.log('👥 Fetching employees in room:', selectedRoom.name);
      const response = await apiService.getEmployeesInRoom(selectedRoom.id);
      console.log('✅ Employees in room:', response.employees.length, 'people');
      
      const employeesWithDuration = response.employees.map(employee => ({
        ...employee,
        duration: calculateDuration(employee.entered_at)
      }));
      
      setEmployeesInRoom(employeesWithDuration);
    } catch (error: any) {
      console.error('❌ Employees in room fetch error:', error);
      setEmployeesInRoom([]);
    }
  }, [selectedRoom]);

  const calculateDuration = (enteredAt: string): string => {
    try {
      const enteredTime = new Date(enteredAt).getTime();
      const now = new Date().getTime();
      const diffMs = now - enteredTime;
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
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

  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedRoom) {
        console.log('🔄 Auto-refreshing room data...');
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

    const removeNfcListener = nfcService.addNfcStateListener((status) => {
      console.log('NFC status changed:', status);
      setNfcStatus(status);
    });

    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🔄 Screen focused, refreshing data...');
      fetchAllData();
    });

    return () => {
      removeNfcListener();
      unsubscribe();
      nfcService.cleanup();
    };
  }, [fetchAllData, navigation]);

  const handleRoomTap = async (uid: string) => {
    if (isLoading || !selectedRoom) return;
    
    setIsLoading(true);

    try {
      const tapData = await apiService.processTap(uid, selectedRoom.id);
      setLastTap(tapData);
      setCurrentRoom(tapData.room);
      
      await fetchAllData();
      
      Alert.alert(
        'Success', 
        `${tapData.employee.name} ${tapData.action === 'enter' ? 'entered' : 'exited'} ${selectedRoom.name}`
      );
      
    } catch (error: any) {
      console.error('Room tap error:', error);
      
      if (error.name === 'AbortError') {
        Alert.alert('Timeout Error', 'Server took too long to process the tap.');
      } else if (error.message?.includes('not registered')) {
        Alert.alert(
          'Employee Not Registered',
          'This RFID card is not registered in the system.',
          [
            { text: 'OK' },
            { 
              text: 'Register Now', 
              onPress: () => navigation.navigate('Register', { uid }) 
            }
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

  const refreshNfcStatus = async () => {
    try {
      setIsLoading(true);
      const status = await nfcService.checkNfcStatus();
      setNfcStatus(status);
      
      if (status.enabled) {
        Alert.alert('✅ NFC Enabled', 'NFC is now enabled and ready to use!');
      } else {
        Alert.alert(
          '❌ NFC Disabled', 
          'NFC is still disabled. Please enable it in your device settings.',
          [
            { text: 'OK', style: 'cancel' },
            { text: 'Refresh Again', onPress: refreshNfcStatus }
          ]
        );
      }
    } catch (error) {
      console.error('Error refreshing NFC status:', error);
      Alert.alert('Error', 'Failed to check NFC status');
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
          { 
            text: 'Refresh Status', 
            onPress: refreshNfcStatus
          }
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
        () => {
          setIsScanning(false);
        }
      );

      setTimeout(() => {
        if (isScanning) {
          stopRFIDScan();
          Alert.alert('Scanning Timeout', 'No card detected. Tap "Scan RFID Card" to try again.');
        }
      }, 30000);

    } catch (error: any) {
      console.error('NFC scan error:', error);
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

  const stopRFIDScan = async () => {
    try {
      await nfcService.stopScanning();
      setIsScanning(false);
    } catch (error) {
      console.error('Error stopping NFC scan:', error);
      setIsScanning(false);
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
      if (error.name === 'AbortError') {
        Alert.alert('⏰ Timeout', 'Server connection timed out.');
      } else {
        Alert.alert('🚫 Connection Failed', 'Cannot reach server');
      }
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
    console.log('🔄 Refreshing rooms list before opening selector...');
    await fetchRooms();
    setShowRoomSelector(true);
  };

  return {
    currentRoom,
    rooms,
    selectedRoom,
    showRoomSelector,
    isLoading,
    isScanning,
    nfcStatus,
    lastTap,
    roomLogs,
    employeesInRoom,
    refreshing,
    fetchRooms,
    fetchRoomStatus,
    fetchRoomLogs,
    fetchEmployeesInRoom,
    fetchAllData,
    refreshNfcStatus,
    handleRoomTap,
    startRFIDScan,
    stopRFIDScan,
    testServerConnection,
    handleRoomSelect,
    handleOpenRoomSelector,
    setShowRoomSelector
  };
};