import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Room } from '../context/types';

interface RoomStatusCardProps {
  room: Room | null;
}

export const RoomStatusCard: React.FC<RoomStatusCardProps> = ({ room }) => {
  return (
    <View style={styles.roomCard}>
      {room ? (
        <>
          <Text style={styles.roomName}>{room.name}</Text>
          <Text style={styles.roomCount}>{room.current_count}</Text>
          <Text style={styles.roomStatus}>
            {room.current_count === 0 ? 'Room is empty' : 
             room.current_count === 1 ? 'Person in room' : 
             'People in room'}
          </Text>
        </>
      ) : (
        <ActivityIndicator size="large" color="#007AFF" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  roomCard: {
    backgroundColor: 'white',
    padding: 20, 
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 0,
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
  roomName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  roomCount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  roomStatus: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});