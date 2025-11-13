import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ActionButtonsProps {
  isLoading: boolean;
  onRefresh: () => void;
  onRegisterTest: () => void;
  onTestConnection: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  isLoading,
  onRefresh,
  onRegisterTest,
}) => {
  return (
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={onRefresh}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>Refresh Status</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.testButton}
        onPress={onRegisterTest}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>Register Employee</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 300,
    gap: 8,
    marginBottom: 20,
  },
  refreshButton: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  testButton: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#FF9500',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  connectionButton: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#5856D6',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});