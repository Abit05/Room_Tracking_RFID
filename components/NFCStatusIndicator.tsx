import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NFCStatus } from '../context/types';

interface NFCStatusIndicatorProps {
  nfcStatus: NFCStatus;
}

export const NFCStatusIndicator: React.FC<NFCStatusIndicatorProps> = ({ nfcStatus }) => {
  const { hasNfc, enabled } = nfcStatus;

  return (
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
  );
};

const styles = StyleSheet.create({
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