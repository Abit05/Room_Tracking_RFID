import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Text } from "react-native";
import { LinearGradient } from 'react-native-linear-gradient';
import { RoomStatusCard } from '../components/RoomStatusCard';
import { LastActivityCard } from '../components/LastActivityCard';
import { NFCSection } from '../components/NFCSection';
import { ActionButtons } from '../components/ActionButtons';
import { NFCStatusIndicator } from '../components/NFCStatusIndicator';
import { EmployeesInRoomSection } from '../components/EmployeesInRoomSection';
import { ActivityLogsButton } from '../components/ActivityLogsButton';
import { useRoomTracking } from '../hooks/useRoomTracking';

export default function RoomTrackingScreen({ navigation }: { navigation: any }) {
  const {currentRoom, selectedRoom, isLoading, isScanning, nfcStatus, lastTap, employeesInRoom, roomLogs, refreshing, fetchAllData, refreshNfcStatus, startRFIDScan, stopRFIDScan} = useRoomTracking(navigation);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#ffbf00', '#ff8c00', '#04ded3', '#0463de', '#02b30e']}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchAllData}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
      >
        <Text style={styles.title}>Employee Tracker</Text>
        <View style={styles.splitLayout}>
          <View style={styles.cardWrapper}>
            <RoomStatusCard room={currentRoom} />
          </View>
          <View style={styles.cardWrapper}>
            <NFCSection
              nfcStatus={nfcStatus}
              isScanning={isScanning}
              isLoading={isLoading}
              onStartScan={startRFIDScan}
              onStopScan={stopRFIDScan}
              onRefreshStatus={refreshNfcStatus}
            />
          </View>
        </View>

        <LastActivityCard lastTap={lastTap} />

        <EmployeesInRoomSection 
          employeesInRoom={employeesInRoom}
          selectedRoom={selectedRoom}
        />

        <ActivityLogsButton
          roomLogs={roomLogs}
          onPress={() => navigation.navigate('ActivityLogs', { 
            roomLogs
          })}
        />

        <ActionButtons
          isLoading={isLoading}
          onRefresh={fetchAllData}
          onRegisterTest={() => navigation.navigate('Register')}
        />

        <NFCStatusIndicator nfcStatus={nfcStatus} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  splitLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    gap: 12,
  },
  cardWrapper: {
    flex: 1,
    minHeight: 200,
  },
});