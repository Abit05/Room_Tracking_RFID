import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Room } from '../context/types';

interface RoomSelectorButtonProps {
  selectedRoom: Room | null;
  onPress: () => void;
}

export const RoomSelectorButton: React.FC<RoomSelectorButtonProps> = ({
  selectedRoom,
  onPress
}) => {
  return (
    <TouchableOpacity 
      style={styles.roomSelectorButton}
      onPress={onPress}
    >
      <View style={styles.roomSelectorContent}>
        <Text style={styles.roomSelectorLabel}>Current Room:</Text>
        <Text style={styles.roomSelectorName}>
          {selectedRoom ? selectedRoom.name : 'Select a Room'}
        </Text>
        <Text style={styles.roomSelectorArrow}>▼</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  roomSelectorButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  roomSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomSelectorLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  roomSelectorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    flex: 1,
  },
  roomSelectorArrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
});