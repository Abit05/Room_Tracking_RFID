import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Room } from '../context/types';
import { EmployeeInRoom } from '../context/types';

interface EmployeesInRoomSectionProps {
  employeesInRoom: EmployeeInRoom[];
  selectedRoom: Room | null;
}

export const EmployeesInRoomSection: React.FC<EmployeesInRoomSectionProps> = ({
  employeesInRoom,
  selectedRoom
}) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (duration: string) => {
    const hoursMatch = duration.match(/(\d+)h/);
    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    
    if (hours < 1) return '#34C759';
    if (hours < 2) return '#FF9500'; 
    return '#FF3B30'; 
  };

  const getCapacityBarColor = () => {
    if (!selectedRoom) return '#34C759';
    
    const occupancyRatio = selectedRoom.current_count / selectedRoom.max_capacity;
    
    if (occupancyRatio >= 1) return '#FF3B30';
    if (occupancyRatio >= 0.8) return '#FF9500'; 
    return '#34C759'; 
  };

  const hasDataDiscrepancy = selectedRoom && 
    selectedRoom.current_count > 0 && 
    employeesInRoom.length === 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Who's in the Room</Text>
      
      {hasDataDiscrepancy ? (
        <View style={styles.discrepancyWarning}>
          <Text style={styles.warningText}>⚠️ Data Sync Issue</Text>
          <Text style={styles.warningSubtext}>
            Room shows {selectedRoom.current_count} people but detailed information is unavailable
          </Text>
        </View>
      ) : (
        <Text style={styles.subtitle}>
          {employeesInRoom.length} {employeesInRoom.length === 1 ? 'person' : 'people'} currently
          {selectedRoom && ` in ${selectedRoom.name}`}
        </Text>
      )}

      {employeesInRoom.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {hasDataDiscrepancy ? 'Detailed occupancy data unavailable' : 'No one in the room'}
          </Text>
          <Text style={styles.emptySubtext}>
            {hasDataDiscrepancy 
              ? 'The room may have people but individual data is not available' 
              : 'The room is currently empty'
            }
          </Text>
        </View>
      ) : (
        <View style={styles.employeesList}>
          {employeesInRoom.map((employee, index) => (
            <View key={employee.id} style={styles.employeeItem}>
              <View style={styles.employeeHeader}>
                <View style={styles.employeeInfo}>
                  <Text style={styles.employeeName}>{employee.employee_name}</Text>
                  <Text style={styles.employeeId}>ID: {employee.employee_uid}</Text>
                </View>
                <View style={[styles.durationBadge, { backgroundColor: getStatusColor(employee.duration || '0m') }]}>
                  <Text style={styles.durationText}>{employee.duration}</Text>
                </View>
              </View>
              
              <View style={styles.employeeDetails}>
                <Text style={styles.enteredText}>
                  Entered at {formatTime(employee.entered_at)}
                </Text>
              </View>
              
              {index < employeesInRoom.length - 1 && <View style={styles.separator} />}
            </View>
          ))}
        </View>
      )}

      {/* Room Capacity Info - Use current_count from room status */}
    {selectedRoom && (
    <View style={styles.capacityInfo}>
        <Text style={styles.capacityText}>
        Room Capacity: {employeesInRoom.length} / {selectedRoom.max_capacity}
        </Text>
        <View style={styles.capacityBar}>
        <View 
            style={[
            styles.capacityFill, 
            { 
                width: `${Math.min((employeesInRoom.length / selectedRoom.max_capacity) * 100, 100)}%`,
                backgroundColor: getCapacityBarColor()
            }
            ]} 
        />
        </View>
        <Text style={styles.currentCount}>
        Current count: {employeesInRoom.length}
        {employeesInRoom.length !== selectedRoom.current_count && ' (accurate)'}
        </Text>
        {employeesInRoom.length !== selectedRoom.current_count && (
        <Text style={styles.syncNote}>
            Room status syncing... showing {employeesInRoom.length} people
        </Text>
        )}
  </View>
)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    width: '100%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  discrepancyWarning: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA000',
  },
  warningText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },
  warningSubtext: {
    fontSize: 12,
    color: '#856404',
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCC',
    textAlign: 'center',
  },
  employeesList: {
    gap: 0,
  },
  employeeItem: {
    paddingVertical: 12,
  },
  employeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  employeeInfo: {
    flex: 1,
    marginRight: 12,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  employeeId: {
    fontSize: 12,
    color: '#666',
  },
  durationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  durationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  employeeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  enteredText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  capacityInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  capacityText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  capacityBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  capacityFill: {
    height: '100%',
    borderRadius: 3,
  },
  currentCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  syncNote: {
    fontSize: 10,
    color: '#FFA000',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});