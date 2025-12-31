import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { NFCStatus } from '../context/types';

interface NFCSectionProps {
  nfcStatus: NFCStatus;
  isScanning: boolean;
  isLoading: boolean;
  onStartScan: () => void;
  onStopScan: () => void;
  onRefreshStatus: () => void;
}

export const NFCSection: React.FC<NFCSectionProps> = ({
  nfcStatus, isScanning, isLoading, onStartScan, onStopScan, onRefreshStatus}) => {
  const canScan = nfcStatus.hasNfc && nfcStatus.enabled;

  const getColor = (condition: boolean | null) => {
    if (condition === null) return '#666';
    return condition ? '#34C759' : '#FF3B30';
  };

  const getStatusText = (condition: boolean | null, trueText: string, falseText: string) => {
    if (condition === null) return 'Checking...';
    return condition ? trueText : falseText;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>NFC Supported:
        <Text style={[styles.value, { color: getColor(nfcStatus.hasNfc) }]}>
        {getStatusText(nfcStatus.hasNfc, 'Yes', 'No')}
      </Text>
      </Text>
    
      <Text style={styles.label}>NFC Status:
        <Text style={[styles.value, { color: getColor(nfcStatus.enabled) }, styles.spacing]}>
          {getStatusText(nfcStatus.enabled, 'Enabled', 'Disabled')}
        </Text>
      </Text>

      {(!nfcStatus.enabled || nfcStatus.hasNfc === null) && (
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefreshStatus}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Checking...' : 'Refresh Status'}
          </Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity
        style={[styles.scanButton, (!canScan || isScanning || isLoading) && styles.disabled]}
        onPress={onStartScan}
        disabled={!canScan || isScanning || isLoading}
      >
        {isScanning ? (
          <View style={styles.scanning}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.buttonText}>Scanning...</Text>
          </View>
        ) : (
          <Text style={styles.scanText}>
            {isLoading ? 'Processing...' : 'Scan RFID'}
          </Text>
        )}
      </TouchableOpacity>

      {isScanning && (
        <TouchableOpacity style={styles.stopButton} onPress={onStopScan}>
          <Text style={styles.buttonText}>Stop Scanning</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    alignItems: 'flex-start',
    width: '100%',
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    minHeight: 200,
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
  },
  spacing: {
    paddingBottom: 10,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    width: '100%',
  },
  scanButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  scanning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  scanText: {
    color: 'white',
    fontSize: 21,
    fontWeight: 'bold',
  },
  disabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  help: {
    fontSize: 12,
    color: '#FF9500',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
});