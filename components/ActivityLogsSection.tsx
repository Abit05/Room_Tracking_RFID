import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RoomActivity, Room } from '../context/types';

interface ActivityLogsSectionProps {
  roomLogs: RoomActivity[];
  selectedRoom: Room | null;
}

export const ActivityLogsSection: React.FC<ActivityLogsSectionProps> = ({
  roomLogs,
  selectedRoom
}) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const getActionColor = (action: string) => {
    return action === 'enter' ? '#34C759' : '#FF3B30';
  };

  const getActionText = (action: string) => {
    return action === 'enter' ? 'Entered' : 'Exited';
  };

  return (
    <View style={styles.logsSection}>
      <Text style={styles.logsTitle}>Recent Activity</Text>
      <Text style={styles.logsSubtitle}>
        {roomLogs.length} activities logged
        {selectedRoom && ` in ${selectedRoom.name}`}
      </Text>

      {roomLogs.length === 0 ? (
        <View style={styles.emptyLogs}>
          <Text style={styles.emptyText}>No activity logs yet</Text>
          <Text style={styles.emptySubtext}>
            Room entry/exit activities will appear here
          </Text>
        </View>
      ) : (
        <View style={styles.logsList}>
          {roomLogs.slice(0, 10).map((log) => (
            <View key={log.id} style={styles.logItem}>
              <View style={styles.logHeader}>
                <Text style={styles.employeeName}>{log.employee_name}</Text>
                <View style={[styles.actionBadge, { backgroundColor: getActionColor(log.action) }]}>
                  <Text style={styles.actionText}>{getActionText(log.action)}</Text>
                </View>
              </View>
              
              <View style={styles.logDetails}>
                <Text style={styles.uidText}>Card: {log.employee_uid}</Text>
                <Text style={styles.timeText}>{formatTime(log.timestamp)}</Text>
              </View>
              
              <Text style={styles.dateText}>{formatDate(log.timestamp)}</Text>
            </View>
          ))}
          
          {roomLogs.length > 10 && (
            <Text style={styles.moreText}>
              +{roomLogs.length - 10} more activities...
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  logsSection: {
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
  logsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  logsSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  emptyLogs: {
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
    textAlign: 'center',
  },
  logsList: {
    gap: 12,
  },
  logItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  actionText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  logDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  uidText: {
    fontSize: 12,
    color: '#666',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 11,
    color: '#999',
  },
  moreText: {
    fontSize: 12,
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});