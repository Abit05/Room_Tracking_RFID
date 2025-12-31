import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TapResponse } from '../context/types';

interface LastActivityCardProps {
  lastTap: TapResponse | null;
}

export const LastActivityCard: React.FC<LastActivityCardProps> = ({ lastTap }) => {
  if (!lastTap) return null;

  const { employee, action, room, timestamp } = lastTap;
  const actionText = action === 'enter' ? 'entered' : 'exited';

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Last Activity</Text>
      <Text style={styles.text}>
        <Text style={styles.employeeName}>{employee.name}</Text> 
        {' '}{actionText}{' '}
        <Text style={styles.roomName}>{room.name}</Text>
      </Text>
      <Text style={styles.time}>
        {new Date(timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#e8f4fd',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
    maxWidth: 300,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  text: {
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
  time: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});