import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import HomeScreen from "./src/screens/HomeScreen";
import EditAlarmScreen from "./src/screens/EditAlarmScreen";
import AlarmRingingScreen from "./src/screens/AlarmRingingScreen";
import {
  requestNotificationPermissions,
  setupNotificationChannel,
} from "./src/utils/notifications";
import * as Notifications from "expo-notifications";

const navigationRef = createNavigationContainerRef();

const Stack = createNativeStackNavigator();

export default function App() {
  const navigateToAlarm = (alarmId, snoozesUsed = 0) => {
    if (navigationRef.isReady()) {
      navigationRef.navigate("AlarmRinging", { alarmId, snoozesUsed });
    } else {
      const interval = setInterval(() => {
        if (navigationRef.isReady()) {
          navigationRef.navigate("AlarmRinging", { alarmId, snoozesUsed });
          clearInterval(interval);
        }
      }, 100);
    }
  };

  useEffect(() => {
    (async () => {
      await setupNotificationChannel();
      await requestNotificationPermissions();
    })();

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.alarmId) {
          navigateToAlarm(data.alarmId, data.snoozesUsed || 0);
        }
      });

    const receivedListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        const data = notification.request.content.data;
        if (data?.alarmId) {
          navigateToAlarm(data.alarmId, data.snoozesUsed || 0);
        }
      },
    );

    return () => {
      Notifications.removeNotificationSubscription(responseListener);
      Notifications.removeNotificationSubscription(receivedListener);
    };
  }, []);

  const handleInitialNotification = async () => {
    const response = await Notifications.getLastNotificationResponseAsync();
    const data = response?.notification?.request?.content?.data;
    if (data?.alarmId) {
      navigateToAlarm(data.alarmId, data.snoozesUsed || 0);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef} onReady={handleInitialNotification}>
        <StatusBar style="light" />
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: "#0a0a0f" },
            headerTintColor: "#ffffff",
            headerTitleStyle: { fontWeight: "600", fontSize: 17 },
            headerBackTitleVisible: false,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: "#0a0a0f" },
            animation: "slide_from_right",
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
              title: "שעון מעורר חדש",
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
              animation: "fade",
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
