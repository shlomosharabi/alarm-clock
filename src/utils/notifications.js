import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function requestNotificationPermissions() {
  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  return status === "granted";
}

export async function setupNotificationChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("alarms", {
      name: "שעוני מעורר",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#6c63ff",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
      sound: "default",
    });
  }
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function scheduleAlarmNotification(alarm) {
  const { hour, minute, days, label, id } = alarm;

  // Cancel existing notifications for this alarm
  await cancelAlarmNotification(id);

  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);

  if (days.length === 0) {
    // One-time alarm
    if (target < now) target.setDate(target.getDate() + 1);
    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ " + label,
        body: "הגיע הזמן להתעורר!",
        sound: "default",
        data: { alarmId: id, type: "alarm" },
        priority: Notifications.AndroidNotificationPriority.MAX,
        categoryIdentifier: "alarm",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: target,
        channelId: "alarms",
      },
    });
    return [notifId];
  } else {
    // Recurring
    const notifIds = [];
    for (const day of days) {
      const notifId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "⏰ " + label,
          body: "הגיע הזמן להתעורר!",
          sound: "default",
          data: { alarmId: id, type: "alarm" },
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: day + 1, // Expo: 1=Sun
          hour,
          minute,
          channelId: "alarms",
        },
      });
      notifIds.push(notifId);
    }
    return notifIds;
  }
}

export async function cancelAlarmNotification(alarmId) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.alarmId === alarmId) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

export async function scheduleSnoozeNotification(alarm, minutes, snoozesUsed) {
  const date = new Date(Date.now() + minutes * 60000);
  const notifId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "⏰ " + alarm.label,
      body: "נודניק! הזמן להתעורר שוב.",
      sound: "default",
      data: { alarmId: alarm.id, type: "snooze", snoozesUsed },
      priority: Notifications.AndroidNotificationPriority.MAX,
      channelId: "alarms",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: "alarms",
    },
  });
  return notifId;
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
