import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Text } from "react-native";
import { LinearGradient } from 'react-native-linear-gradient';
import { RoomStatusCard } from '../components/RoomStatusCard';
import { LastActivityCard } from '../components/LastActivityCard';
import { NFCSection } from '../components/NFCSection';
import { ActionButtons } from '../components/ActionButtons';
import { NFCStatusIndicator } from '../components/NFCStatusIndicator';
import { RoomSelector } from '../components/RoomSelector';
import { RoomSelectorButton } from '../components/RoomSelectorButton';
import { EmployeesInRoomSection } from '../components/EmployeesInRoomSection';
import { useRoomTracking } from '../hooks/useRoomTracking';

export default function RoomTrackingScreen({ navigation }: { navigation: any }) {
  const {
    currentRoom,
    rooms,
    selectedRoom,
    showRoomSelector,
    isLoading,
    isScanning,
    nfcStatus,
    lastTap,
    employeesInRoom,
    refreshing,
    fetchAllData,
    refreshNfcStatus,
    startRFIDScan,
    stopRFIDScan,
    testServerConnection,
    handleRoomSelect,
    handleOpenRoomSelector,
    setShowRoomSelector
  } = useRoomTracking(navigation);

  return (
    <View style={styles.container}>
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={['#ffbf00', '#ff8c00', '#04ded3', '#0463de', '#02b30e']}
          style={StyleSheet.absoluteFillObject}/>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchAllData}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
      >
        <Text style={styles.title}>Room Tracker</Text>
        
        <RoomSelectorButton 
          selectedRoom={selectedRoom}
          onPress={handleOpenRoomSelector}
        />
        <View style = {styles.containersplit}>
          <View style = {styles.statusCard}>
            <RoomStatusCard room={currentRoom} />
          </View>
          <View style = {styles.nfcContainer}>
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

        <ActionButtons
          isLoading={isLoading}
          onRefresh={fetchAllData}
          onRegisterTest={() => navigation.navigate('Register')}
          onTestConnection={testServerConnection}
        />

        <NFCStatusIndicator nfcStatus={nfcStatus} />
      </ScrollView>

      <RoomSelector
        rooms={rooms}
        selectedRoom={selectedRoom}
        onRoomSelect={handleRoomSelect}
        visible={showRoomSelector}
        onClose={() => setShowRoomSelector(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    flexDirection : 'row',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  containersplit: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom : 20,
  },
  statusCard: {
    flex:1,
    paddingLeft: 20,
    paddingRight : 5,
  },
  nfcContainer: {
    flex:1,
    paddingLeft: 5,
    paddingRight : 20,
  }
});