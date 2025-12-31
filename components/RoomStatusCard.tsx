import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Room } from '../context/types';

interface RoomStatusCardProps {
  room: Room | null;
}

export const RoomStatusCard: React.FC<RoomStatusCardProps> = ({ room }) => {
  const getStatusText = (count: number) => {
    if (count === 0) return 'Company is empty';
    if (count === 1) return 'Person in Company';
    return 'People in room';
  };

  return (
    <View style={styles.card}>
      {room ? (
        <>
          <Text style={styles.name}>Employee Attendance</Text>
          <Text style={styles.count}>{room.current_count}</Text>
          <Text style={styles.status}>{getStatusText(room.current_count)}</Text>
        </>
      ) : (
        <ActivityIndicator size="large" color="#007AFF" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 200,
    justifyContent: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  count: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  status: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});