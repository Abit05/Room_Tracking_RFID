import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import NfcManager, { NfcEvents } from 'react-native-nfc-manager';

const API_BASE_URL = 'http://192.168.137.1:3000';

export default function RegisterScreen({ navigation, route }: { navigation: any; route?: any }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scannedUid, setScannedUid] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasNfc, setHasNfc] = useState<boolean | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    if (route?.params?.uid) {
      setScannedUid(route.params.uid);
      Alert.alert(
        'UID Received',
        `UID from tap: ${route.params.uid}\n\nPlease enter employee name to complete registration.`
      );
    }
  }, [route?.params?.uid]);

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

  const convertUidToString = (uid: any): string => {
    try {
      if (typeof uid === 'string') {
        return uid.replace(/[:\\s-]/g, '').toUpperCase();
      } else if (Array.isArray(uid)) {
        return uid.map(byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
      } else if (typeof uid === 'object' && uid.value) {
        return convertUidToString(uid.value);
      } else {
        return String(uid).replace(/[:\\s-]/g, '').toUpperCase();
      }
    } catch (error) {
      console.error('Error converting UID:', error);
      return 'unknown';
    }
  };

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

    try {
      await NfcManager.start();
      NfcManager.setEventListener(NfcEvents.DiscoverTag, async (tag: any) => {
        if (tag.id) {
          const uid = convertUidToString(tag.id);
          setScannedUid(uid);
          setIsScanning(false);

          Alert.alert(
            'RFID Card Scanned',
            `UID: ${uid}\n\nThis card will be linked to the employee.`,
            [{ text: 'OK' }]
          );

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

    if (lastName.trim().length < 1) {
      Alert.alert('Error', 'Please enter last name');
      return;
    }

    if (!scannedUid) {
      Alert.alert('Error', 'Please scan an RFID card for the employee');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/employees/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          uid: scannedUid,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Registration failed';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || `Server error: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }

      const fullName = `${firstName} ${lastName}`;
      Alert.alert(
        'Success', 
        `Employee "${fullName}" registered successfully!\n\nUID: ${scannedUid}\n\nThey can now use their RFID card to enter/exit the room.`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              resetForm();
              navigation.navigate('RoomTracking');
            }
          }
        ]
      );

    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.message?.includes('already registered')) {
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

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setScannedUid(null);
  };

  const isFormValid = () => {
    return firstName.trim().length >= 2 && 
           lastName.trim().length >= 1 && 
           scannedUid !== null;
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.backgroundContainer}>
          <LinearGradient
            colors={['#ffbf00', '#ff8c00', '#04ded3', '#0463de', '#02b30e']}
            style={StyleSheet.absoluteFillObject}/>
        </View>
        
        <View style={styles.subcontainer}>
          <Text style={styles.title}>Register Employee</Text>

          <Text style={styles.registrationNote}>
            Scan an RFID card and enter employee details to register for room access.
          </Text>

          {/* RFID Scan Section */}
          <View style={styles.rfidSection}>
            <Text style={styles.label}>Employee RFID Card *</Text>
            <Text style={styles.note}>
              Scan the RFID card that will be assigned to this employee.
            </Text>
            
            <TouchableOpacity
              style={[styles.scanButton, isScanning && styles.buttonDisabled]}
              onPress={startRFIDScan}
              disabled={isScanning}
            >
              {isScanning ? (
                <View style={styles.scanningContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.scanningText}>Scanning...</Text>
                </View>
              ) : (
                <Text style={styles.scanButtonText}>
                  {scannedUid ? 'Rescan RFID Card' : 'Scan Employee RFID Card'}
                </Text>
              )}
            </TouchableOpacity>

            {isScanning && (
              <TouchableOpacity
                style={styles.stopButton}
                onPress={stopRFIDScan}
              >
                <Text style={styles.stopButtonText}>Stop Scanning</Text>
              </TouchableOpacity>
            )}
            
            {scannedUid && (
              <View style={styles.uidDisplay}>
                <Text style={styles.uidLabel}>Scanned UID: {scannedUid}</Text>
                <Text style={styles.uidStatus}>✓ Ready for registration</Text>
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
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.registerButton, (!isFormValid() || isLoading) && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={!isFormValid() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  Register with RFID
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.TrackButton}
            onPress={() => navigation.navigate('RoomTracking')}
          >
            <Text style={styles.buttonText}>
              Back to Room Tracking
            </Text>
          </TouchableOpacity>

          {/* NFC Status */}
          <View style={styles.statusContainer}>
            {hasNfc === false && (
              <Text style={styles.errorText}>
                NFC is not supported on this device
              </Text>
            )}

            {hasNfc && enabled === false && (
              <Text style={styles.warningText}>
                Please enable NFC in your device settings
              </Text>
            )}

            {hasNfc && enabled && (
              <Text style={styles.successText}>
                NFC is ready for scanning
              </Text>
            )}
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
  subcontainer: {
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
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  registrationNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  rfidSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  scanButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  scanningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scanningText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scanButtonText: {
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
  stopButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  uidDisplay: {
    backgroundColor: '#e9ecef',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  uidLabel: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
    flex: 1,
  },
  uidStatus: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
  clearButton: {
    padding: 5,
    marginLeft: 10,
  },
  clearButtonText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '600',
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
  actionButtons: {
    marginBottom: 15,
  },
  registerButton: {
    backgroundColor: '#34C759',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  TrackButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  statusContainer: {
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  warningText: {
    color: '#FF9500',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  successText: {
    color: '#34C759',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
});