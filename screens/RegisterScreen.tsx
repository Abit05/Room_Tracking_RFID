import React, { useState, useEffect, useCallback } from 'react';
import {View, StyleSheet, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView,} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import NfcManager, { NfcEvents } from 'react-native-nfc-manager';
import { apiService } from '../services/apiService';

export default function RegisterScreen({ navigation, route }: { navigation: any; route?: any }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scannedUid, setScannedUid] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasNfc, setHasNfc] = useState<boolean | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [isCheckingCard, setIsCheckingCard] = useState(false);
  const [cardStatus, setCardStatus] = useState<'unknown' | 'available' | 'registered'>('unknown');

  // Move convertUidToString inside useCallback or make it stable
  const convertUidToString = useCallback((uid: any): string => {
    try {
      if (typeof uid === 'string') {
        return uid.replace(/[:\\s-]/g, '').toUpperCase();
      } else if (Array.isArray(uid)) {
        return uid.map(byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
      } else if (typeof uid === 'object' && uid.value) {
        // Recursive call but now it's stable due to useCallback
        return convertUidToString(uid.value);
      } else {
        return String(uid).replace(/[:\\s-]/g, '').toUpperCase();
      }
    } catch (error) {
      console.error('Error converting UID:', error);
      return 'unknown';
    }
  }, []);

    // Wrap checkCardRegistration in useCallback
  const checkCardRegistration = useCallback(async (uid: string) => {
    setIsCheckingCard(true);
    try {
      // Try to get all employees and check if this UID exists
      const response = await apiService.getEmployees();
      console.log('Employees response:', response); // Debug log
      
      // Check different possible response structures
      const employees = response.employees || response || [];
      
      console.log('Normalized UID to check:', convertUidToString(uid));
      console.log('Employees list:', employees);
      
      const isRegistered = employees.some((employee: any) => {
        if (!employee.uid) return false;
        const employeeUid = convertUidToString(employee.uid);
        const scannedUidNormalized = convertUidToString(uid);
        console.log(`Comparing: ${employeeUid} === ${scannedUidNormalized}`);
        return employeeUid === scannedUidNormalized;
      });

      if (isRegistered) {
        setCardStatus('registered');
        const existingEmployee = employees.find((emp: any) => 
          emp.uid && convertUidToString(emp.uid) === convertUidToString(uid)
        );
        Alert.alert(
          'Card Already Registered', 
          `This RFID card is already registered to:\n\n${existingEmployee?.first_name || 'Unknown'} ${existingEmployee?.last_name || ''}\n\nUID: ${uid}\n\nPlease use a different RFID card.`
        );
      } else {
        setCardStatus('available');
        Alert.alert(
          'Card Available', 
          `This RFID card is available for registration!\n\nUID: ${uid}\n\nPlease enter employee details to complete registration.`
        );
      }
    } catch (error: any) {
      console.error('Error checking card registration:', error);
      setCardStatus('unknown');
      
      // More specific error messages
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        Alert.alert('Server Error', 'Employees endpoint not found. Please check if the backend is running.');
      } else if (error.message?.includes('Network request failed')) {
        Alert.alert('Connection Error', 'Cannot connect to server. Please check your connection.');
      } else {
        Alert.alert('Check Failed', error.message || 'Could not verify card status. Please try again.');
      }
    } finally {
      setIsCheckingCard(false);
    }
  }, [convertUidToString]);

  useEffect(() => {
    if (route?.params?.uid) {
      setScannedUid(route.params.uid);
      checkCardRegistration(route.params.uid);
      Alert.alert('UID Received', `UID from tap: ${route.params.uid}\n\nPlease enter employee name to complete registration.`);
    }
  }, [route?.params?.uid, checkCardRegistration]);

  useEffect(() => {
    const checkNfc = async () => {
      try {
        const supported = await NfcManager.isSupported();
        setHasNfc(supported);
        
        if (supported) {
          await NfcManager.start();
          const nfcEnabled = await NfcManager.isEnabled();
          setEnabled(nfcEnabled);
        }
      } catch (error) {
        console.error('NFC check error:', error);
      }
    };

    checkNfc();

    return () => {
      NfcManager.cancelTechnologyRequest().catch(() => 0);
    };
  }, []);

  const startRFIDScan = async () => {
    if (!hasNfc) {
      Alert.alert('NFC Not Supported', 'NFC is not supported on this device.');
      return;
    }

    if (!enabled) {
      Alert.alert('NFC Disabled', 'Please enable NFC in your device settings.');
      return;
    }

    setIsScanning(true);
    setCardStatus('unknown');

    try {
      await NfcManager.start();
      NfcManager.setEventListener(NfcEvents.DiscoverTag, async (tag: any) => {
        if (tag.id) {
          const uid = convertUidToString(tag.id);
          setScannedUid(uid);
          setIsScanning(false);

          // Immediately check if card is already registered
          checkCardRegistration(uid);
          
          NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
          NfcManager.unregisterTagEvent().catch(() => 0);
        }
      });

      await NfcManager.registerTagEvent();

      setTimeout(() => {
        if (isScanning) {
          stopRFIDScan();
          Alert.alert('Scanning Timeout', 'No card detected. Please try again.');
        }
      }, 30000);

    } catch (error) {
      console.error('NFC scan error:', error);
      Alert.alert('Scan Error', 'Failed to start NFC scanning.');
      setIsScanning(false);
    }
  };

  const stopRFIDScan = async () => {
    try {
      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      await NfcManager.unregisterTagEvent().catch(() => 0);
      setIsScanning(false);
    } catch (error) {
      console.error('Error stopping NFC scan:', error);
      setIsScanning(false);
    }
  };

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'Please enter both first and last name');
      return;
    }

    if (firstName.trim().length < 2) {
      Alert.alert('Error', 'First name must be at least 2 characters long');
      return;
    }

    if (!scannedUid) {
      Alert.alert('Error', 'Please scan an RFID card for the employee');
      return;
    }

    // Double check if card is registered (in case status changed)
    if (cardStatus === 'registered') {
      Alert.alert('Card Registered', 'This card is already registered. Please use a different card.');
      return;
    }

    setIsLoading(true);

    try {
      await apiService.registerEmployee(scannedUid, firstName.trim(), lastName.trim());

      const fullName = `${firstName} ${lastName}`;
      Alert.alert(
        'Success', 
        `Employee "${fullName}" registered successfully!\n\nUID: ${scannedUid}\n\nThey can now use their RFID card to enter/exit the room.`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              setFirstName('');
              setLastName('');
              setScannedUid(null);
              setCardStatus('unknown');
              navigation.navigate('RoomTracking');
            }
          }
        ]
      );

    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.message?.includes('already registered')) {
        setCardStatus('registered');
        Alert.alert('Registration Failed', 'This RFID card is already registered to another employee.');
      } else if (error.message?.includes('Network request failed')) {
        Alert.alert('Connection Error', 'Cannot connect to server. Please check your connection.');
      } else {
        Alert.alert('Registration Failed', error.message || 'Failed to register employee. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getCardStatusText = () => {
    switch (cardStatus) {
      case 'available':
        return { text: '✓ Available for registration', color: '#34C759' };
      case 'registered':
        return { text: '✗ Already registered', color: '#FF3B30' };
      case 'unknown':
        return { text: 'Scan a card to check status', color: '#666' };
      default:
        return { text: 'Scan a card to check status', color: '#666' };
    }
  };

  const getCardStatusIcon = () => {
    switch (cardStatus) {
      case 'available':
        return '✓';
      case 'registered':
        return '✗';
      default:
        return '?';
    }
  };

  const isFormValid = firstName.trim().length >= 2 && 
                     lastName.trim().length >= 1 && 
                     scannedUid !== null && 
                     cardStatus === 'available';

  const statusInfo = getCardStatusText();

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#ffbf00', '#ff8c00', '#04ded3', '#0463de', '#02b30e']}
          style={StyleSheet.absoluteFillObject}/>
        
        <View style={styles.content}>
          <Text style={styles.title}>Register Employee</Text>
          <Text style={styles.subtitle}>Scan an RFID card and enter employee details to register for room access.</Text>

          {/* RFID Scan Section */}
          <View style={styles.section}>
            <Text style={styles.label}>Employee RFID Card *</Text>
            <Text style={styles.note}>Scan the RFID card that will be assigned to this employee.</Text>
            
            <TouchableOpacity
              style={[styles.button, isScanning && styles.disabled]}
              onPress={startRFIDScan}
              disabled={isScanning}
            >
              {isScanning ? (
                <View style={styles.scanning}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.buttonText}>Scanning...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>
                  {scannedUid ? 'Rescan RFID Card' : 'Scan Employee RFID Card'}
                </Text>
              )}
            </TouchableOpacity>

            {isScanning && (
              <TouchableOpacity style={styles.stopButton} onPress={stopRFIDScan}>
                <Text style={styles.buttonText}>Stop Scanning</Text>
              </TouchableOpacity>
            )}
            
            {scannedUid && (
              <View style={styles.uidDisplay}>
                <View style={styles.uidHeader}>
                  <Text style={styles.uidLabel}>Scanned UID: {scannedUid}</Text>
                  <Text style={[styles.statusIcon, { color: statusInfo.color }]}>
                    {getCardStatusIcon()}
                  </Text>
                </View>
                <Text style={[styles.uidStatus, { color: statusInfo.color }]}>
                  {isCheckingCard ? 'Checking registration...' : statusInfo.text}
                </Text>
                {isCheckingCard && (
                  <ActivityIndicator size="small" color={statusInfo.color} style={styles.checkingIndicator} />
                )}
              </View>
            )}
          </View>

          {/* Employee Information */}
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter employee first name"
            placeholderTextColor='#666'
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter employee last name"
            placeholderTextColor='#666'
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />

          {/* Action Buttons */}
          <TouchableOpacity
            style={[styles.registerButton, (!isFormValid || isLoading) && styles.disabled]}
            onPress={handleRegister}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {cardStatus === 'registered' ? 'Card Already Registered' : 'Register with RFID'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('RoomTracking')}>
            <Text style={styles.buttonText}>Back to Room Tracking</Text>
          </TouchableOpacity>

          {/* NFC Status */}
          <View style={styles.status}>
            {hasNfc === false && <Text style={styles.error}>NFC is not supported on this device</Text>}
            {hasNfc && enabled === false && <Text style={styles.warning}>Please enable NFC in your device settings</Text>}
            {hasNfc && enabled && <Text style={styles.success}>NFC is ready for scanning</Text>}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    backgroundColor: '#001dad',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#ffffff',
    padding: 25,
    borderRadius: 25,
    width: '100%',
    maxWidth: 400,
    borderRightWidth: 4,
    borderRightColor: '#fc0303',
    borderLeftWidth: 4,
    borderLeftColor: '#fc0303',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  scanning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  uidDisplay: {
    backgroundColor: '#e9ecef',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  uidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  uidLabel: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
    flex: 1,
  },
  statusIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  uidStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  checkingIndicator: {
    marginTop: 5,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  note: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: -5,
    marginBottom: 10,
    lineHeight: 16,
  },
  input: {
    borderWidth: 2,
    borderColor: '#000',
    color: '#333',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    backgroundColor: 'white',
    fontSize: 16,
  },
  registerButton: {
    backgroundColor: '#34C759',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  disabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  status: {
    marginTop: 10,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  warning: {
    color: '#FF9500',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  success: {
    color: '#34C759',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
});