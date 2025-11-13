import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Room } from '../context/types';

interface RoomSelectorProps {
  rooms: Room[];
  selectedRoom: Room | null;
  onRoomSelect: (room: Room) => void;
  visible: boolean;
  onClose: () => void;
}

export const RoomSelector: React.FC<RoomSelectorProps> = ({
  rooms,
  selectedRoom,
  onRoomSelect,
  visible,
  onClose,
}) => {
  const renderRoomItem = ({ item }: { item: Room }) => (
    <TouchableOpacity
      style={[
        styles.roomItem,
        selectedRoom?.id === item.id && styles.selectedRoomItem
      ]}
      onPress={() => {
        onRoomSelect(item);
        onClose();
      }}
    >
      <View style={styles.roomInfo}>
        <Text style={styles.roomName}>{item.name}</Text>
        <Text style={styles.roomDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.roomCapacity}>
          Capacity: {item.current_count}/{item.max_capacity}
        </Text>
      </View>
      <View style={[
        styles.statusIndicator,
        item.current_count >= item.max_capacity ? styles.full : styles.available
      ]}>
        <Text style={styles.statusText}>
          {item.current_count >= item.max_capacity ? 'Full' : 'Available'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Select a Room</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={rooms}
          renderItem={renderRoomItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  roomItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedRoomItem: {
    borderColor: '#007AFF',
    borderWidth: 2,
    backgroundColor: '#f0f8ff',
  },
  roomInfo: {
    flex: 1,
    marginRight: 12,
  },
  roomName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  roomDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  roomCapacity: {
    fontSize: 12,
    color: '#888',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  available: {
    backgroundColor: '#e7f7ef',
  },
  full: {
    backgroundColor: '#ffeaea',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});