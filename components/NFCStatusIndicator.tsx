import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NFCStatus } from '../context/types';

interface NFCStatusIndicatorProps {
  nfcStatus: NFCStatus;
}

export const NFCStatusIndicator: React.FC<NFCStatusIndicatorProps> = ({ nfcStatus }) => {
  const { hasNfc, enabled } = nfcStatus;

  const getStatusMessage = () => {
    if (hasNfc === false) {
      return { text: 'NFC is not supported on this device', style: styles.error };
    }
    if (hasNfc && enabled === false) {
      return { text: 'Please enable NFC in your device settings', style: styles.warning };
    }
    if (hasNfc && enabled) {
      return { text: 'NFC is ready for scanning', style: styles.success };
    }
    return null;
  };

  const status = getStatusMessage();

  if (!status) return null;

  return (
    <View style={styles.container}>
      <Text style={status.style}>{status.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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