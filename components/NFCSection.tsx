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
  nfcStatus,
  isScanning,
  isLoading,
  onStartScan,
  onStopScan,
  onRefreshStatus,
}) => {
  
  const canScan = nfcStatus.hasNfc && nfcStatus.enabled;

  const getSupportedColor = () => {
    if (nfcStatus.hasNfc === null) return '#666';
    return nfcStatus.hasNfc ? '#34C759' : '#FF3B30';
  };

  const getStatusColor = () => {
    if (nfcStatus.enabled === null) return '#666';
    return nfcStatus.enabled ? '#34C759' : '#FF3B30';
  };

  const getStatusText = () => {
    if (nfcStatus.enabled === null) return 'Checking...';
    return nfcStatus.enabled ? 'Enabled' : 'Disabled';
  };

  return (
    <View style={styles.scanSection}>

      {/* NFC Status with Colors */}
      <Text style={styles.statusLabel}>NFC Supported:</Text>
      <Text style={[styles.statusValue, { color: getSupportedColor() }]}>
        {nfcStatus.hasNfc === null ? 'Checking...' : nfcStatus.hasNfc ? 'Yes' : 'No'}
      </Text>
    
      <Text style={styles.statusLabel}>NFC Status:</Text>
      <Text style={[styles.statusValue, { color: getStatusColor()},styles.paddingsize]}>
        {getStatusText()}
      </Text>

      {(!nfcStatus.enabled || nfcStatus.hasNfc === null) && (
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefreshStatus}
          disabled={isLoading}
        >
          <Text style={styles.refreshButtonText}>
            {isLoading ? 'Checking...' : 'Refresh Status'}
          </Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity
        style={[styles.scanButton, (!canScan || isScanning || isLoading) && styles.buttonDisabled]}
        onPress={onStartScan}
        disabled={!canScan || isScanning || isLoading}
      >
        {isScanning ? (
          <View style={styles.scanningContainer}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.scanningText}>Scanning...</Text>
          </View>
        ) : (
          <Text style={styles.scanButtonText}>
            {isLoading ? 'Processing...' : 'Scan RFID'}
          </Text>
        )}
      </TouchableOpacity>

      {isScanning && (
        <TouchableOpacity
          style={styles.stopButton}
          onPress={onStopScan}
        >
          <Text style={styles.stopButtonText}>Stop Scanning</Text>
        </TouchableOpacity>
      )}

      {/* Help message when NFC is disabled */}
      {nfcStatus.hasNfc && !nfcStatus.enabled && (
        <Text style={styles.helpText}>
          💡 Please enable NFC in your device settings
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  scanSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    alignItems: 'flex-start',
    marginBottom: 0,
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

  statusLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  scanButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
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
    fontSize: 21,
    fontWeight: 'bold',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  stopButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  helpText: {
    fontSize: 12,
    color: '#FF9500',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  paddingsize :{
    paddingBottom :10,
  },
});