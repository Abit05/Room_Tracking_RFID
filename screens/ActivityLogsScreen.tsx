import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RoomActivity, Room } from '../context/types';

type ActivityLogsScreenProps = {
  route?: RouteProp<{
    ActivityLogs: {
      roomLogs: RoomActivity[];
      selectedRoom: Room | null;
    };
  }, 'ActivityLogs'>;
};

const ActivityLogsScreen = ({ route }: ActivityLogsScreenProps) => {
  const { roomLogs = [], selectedRoom = null } = route?.params || {};

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getActionColor = (action: string) => action === 'enter' ? '#34C759' : '#FF3B30';
  const getActionText = (action: string) => action === 'enter' ? 'Entered' : 'Exited';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Activity Logs</Text>
          <Text style={styles.subtitle}>
            {roomLogs.length} activities logged
            {selectedRoom && ` in ${selectedRoom.name}`}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {roomLogs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No activity logs yet</Text>
            <Text style={styles.emptySubtext}>
              Room entry/exit activities will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.logsList}>
            {roomLogs.map((log) => (
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
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCC',
    textAlign: 'center',
  },
  logsList: {
    padding: 16,
    gap: 12,
  },
  logItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  uidText: {
    fontSize: 14,
    color: '#666',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
});

export default ActivityLogsScreen;