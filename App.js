import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import HomeScreen from './src/screens/HomeScreen';
import EditAlarmScreen from './src/screens/EditAlarmScreen';
import AlarmRingingScreen from './src/screens/AlarmRingingScreen';
import {
  requestNotificationPermissions,
  setupNotificationChannel,
} from './src/utils/notifications';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    (async () => {
      await setupNotificationChannel();
      await requestNotificationPermissions();
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#0a0a0f' },
            headerTintColor: '#ffffff',
            headerTitleStyle: { fontWeight: '600', fontSize: 17 },
            headerBackTitleVisible: false,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: '#0a0a0f' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EditAlarm"
            component={EditAlarmScreen}
            options={({ navigation }) => ({
              title: 'שעון מעורר חדש',
              headerLeft: () => (
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={{ marginLeft: -4 }}
                >
                  <Ionicons name="chevron-back" size={28} color="#6c63ff" />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen
            name="AlarmRinging"
            component={AlarmRingingScreen}
            options={{
              headerShown: false,
              gestureEnabled: false,
              animation: 'fade',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
