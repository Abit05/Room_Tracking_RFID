import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import RoomTrackingScreen from './screens/RoomTrackingScreen';
import RegisterScreen from './screens/RegisterScreen';
import ActivityLogsScreen from './screens/ActivityLogsScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="RoomTracking"
        screenOptions={{
          headerStyle: { backgroundColor: '#007AFF' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen 
          name="RoomTracking" 
          component={RoomTrackingScreen}
          options={{ title: 'Room Tracker', headerShown: false }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{ title: 'Register Employee', headerShown: false }}
        />
        <Stack.Screen 
          name="ActivityLogs" 
          component={ActivityLogsScreen}
          options={{ title: 'Activity Logs', headerShown: true }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}