import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TapResponse } from '../context/types';

interface LastActivityCardProps {
  lastTap: TapResponse | null;
}

export const LastActivityCard: React.FC<LastActivityCardProps> = ({ lastTap }) => {
  if (!lastTap) return null;

  return (
    <View style={styles.lastTapCard}>
      <Text style={styles.lastTapTitle}>Last Activity</Text>
      <Text style={styles.lastTapText}>
        <Text style={styles.employeeName}>{lastTap.employee.name}</Text> 
        {' '}{lastTap.action === 'enter' ? 'entered' : 'exited'}{' '}
        <Text style={styles.roomName}>{lastTap.room.name}</Text>
      </Text>
      <Text style={styles.lastTapTime}>
        {new Date(lastTap.timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  lastTapCard: {
    backgroundColor: '#e8f4fd',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
    maxWidth: 300,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  lastTapTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  lastTapText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 3,
  },
  employeeName: {
    fontWeight: '600',
    color: '#007AFF',
  },
  roomName: {
    fontWeight: '600',
    color: '#FF6B35',
  },
  lastTapTime: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});