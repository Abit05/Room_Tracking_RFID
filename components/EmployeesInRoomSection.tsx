import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Room, EmployeeInRoom } from '../context/types';

interface EmployeesInRoomSectionProps {
  employeesInRoom: EmployeeInRoom[];
  selectedRoom: Room | null;
}

export const EmployeesInRoomSection: React.FC<EmployeesInRoomSectionProps> = ({
  employeesInRoom,
}) => {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {day : 'numeric', month : 'numeric', year : 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (duration: string): string => {
    if (!duration || duration.trim() === '') return '#34C759';

    // Match "Xd Yh Zm", "Xd", "Yh", etc.
    const daysMatch = duration.match(/(\d+)d/);
    const hoursMatch = duration.match(/(\d+)h/);

    const days = daysMatch ? parseInt(daysMatch[1], 10) : 0;
    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;

    const totalHours = days * 24 + hours;

    if (totalHours < 24) {
      return '#34C759'; // green (< 1 day)
    } else if (totalHours < 24 * 7) {
      return '#FF9500'; // orange (1–6 days)
    } else {
      return '#FF3B30'; // red (7 days or more)
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Employees in the Company</Text>

      {employeesInRoom.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No one in the Company</Text>
          <Text style={styles.emptySubtext}>The Company is currently empty</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {employeesInRoom.map((employee, index) => (
            <View key={`${employee.employee_id}-${index}`} style={styles.item}>
              <View style={styles.header}>
                <View style={styles.info}>
                  <Text style={styles.name}>{employee.employee_name}</Text>
                  <Text style={styles.id}>ID: {employee.employee_uid}</Text>
                </View>
                <View style={[styles.duration, { backgroundColor: getStatusColor(employee.duration || '0m') }]}>
                  <Text style={styles.durationText}>{employee.duration || '0m'}</Text>
                </View>
              </View>
              
              <Text style={styles.entered}>Entered at {formatTime(employee.entered_at)}</Text>
              
              {index < employeesInRoom.length - 1 && <View style={styles.separator} />}
            </View>
          ))}
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
  subtitleOver: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  fullWarning: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
    marginBottom: 12,
  },
  fullWarningText: {
    color: '#FF3B30',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  fullWarningSubtext: {
    color: '#FF3B30',
    fontSize: 12,
  },
  empty: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCC',
  },
  list: {
    gap: 0,
  },
  item: {
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  id: {
    fontSize: 12,
    color: '#666',
  },
  duration: {
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
  entered: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  capacity: {
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
  capacityTextOver: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  bar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  count: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  countOver: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  overText: {
    fontSize: 10,
    color: '#FF3B30',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});