import AsyncStorage from "@react-native-async-storage/async-storage";

const ALARMS_KEY = "@wakeup_alarms";

export const defaultAlarm = () => ({
  id: Date.now().toString(),
  label: "שעון מעורר",
  hour: 7,
  minute: 0,
  days: [], // 0=Sun,1=Mon,...,6=Sat — empty = one-time
  enabled: true,
  snoozeLimit: 5, // minutes
  snoozeCount: 3,
  ringDuration: 60, // seconds max ring time
  task: "math", // 'math' | 'word' | 'sequence' | 'none'
  tasks: ["math"],
  taskCount: 1,
  taskDifficulty: "medium", // 'easy' | 'medium' | 'hard'
  vibrate: true,
  sound: "tone1",
  soundLabel: "ברירת מחדל",
  createdAt: Date.now(),
});

export async function loadAlarms() {
  try {
    const raw = await AsyncStorage.getItem(ALARMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveAlarms(alarms) {
  try {
    await AsyncStorage.setItem(ALARMS_KEY, JSON.stringify(alarms));
  } catch (e) {
    console.error("Failed to save alarms", e);
  }
}

export async function addAlarm(alarm) {
  const alarms = await loadAlarms();
  alarms.push(alarm);
  await saveAlarms(alarms);
  return alarms;
}

export async function updateAlarm(id, updates) {
  const alarms = await loadAlarms();
  const idx = alarms.findIndex((a) => a.id === id);
  if (idx !== -1) {
    alarms[idx] = { ...alarms[idx], ...updates };
    await saveAlarms(alarms);
  }
  return alarms;
}

export async function deleteAlarm(id) {
  const alarms = await loadAlarms();
  const filtered = alarms.filter((a) => a.id !== id);
  await saveAlarms(filtered);
  return filtered;
}

export function formatAlarmTime(hour, minute) {
  const h = hour.toString().padStart(2, "0");
  const m = minute.toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function getNextAlarmMs(hour, minute, days) {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);

  if (days.length === 0) {
    // one-time: if time passed today, schedule tomorrow
    if (target < now) target.setDate(target.getDate() + 1);
    return target.getTime();
  }

  // recurring: find next matching day
  for (let i = 0; i <= 7; i++) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + i);
    candidate.setHours(hour, minute, 0, 0);
    const dayOfWeek = candidate.getDay();
    if (days.includes(dayOfWeek) && candidate > now) {
      return candidate.getTime();
    }
  }
  return null;
}

export const DAY_LABELS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
export const DAY_NAMES = [
  "ראשון",
  "שני",
  "שלישי",
  "רביעי",
  "חמישי",
  "שישי",
  "שבת",
];

const CUSTOM_RINGTONES_KEY = "@wakeup_custom_ringtones";

export async function loadCustomRingtones() {
  try {
    const raw = await AsyncStorage.getItem(CUSTOM_RINGTONES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveCustomRingtones(ringtones) {
  try {
    await AsyncStorage.setItem(CUSTOM_RINGTONES_KEY, JSON.stringify(ringtones));
  } catch (e) {
    console.error("Failed to save custom ringtones", e);
  }
}
