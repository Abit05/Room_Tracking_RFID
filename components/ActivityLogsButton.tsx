import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { RoomActivity} from '../context/types';

interface ActivityLogsButtonProps {
  roomLogs: RoomActivity[];
  onPress: () => void;
}

export const ActivityLogsButton: React.FC<ActivityLogsButtonProps> = ({
  roomLogs,
  onPress
}) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Activity Logs</Text>
          <Text style={styles.subtitle}>
            {roomLogs.length} Employee Activities 
          </Text>
        </View>
        <View style={styles.rightSection}>
          <Text style={styles.arrow}>→</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
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
  },
  rightSection: {
    marginLeft: 12,
  },
  arrow: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});