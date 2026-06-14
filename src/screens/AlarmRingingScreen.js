import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Vibration,
  StatusBar,
  Dimensions,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { generateTask } from "../utils/taskGenerator";
import { updateAlarm, loadAlarms } from "../store/alarmStore";
import {
  cancelAlarmNotification,
  scheduleSnoozeNotification,
} from "../utils/notifications";

const MULTI_TASK_ICONS = { math: "🧮", word: "📝", sequence: "🔢" };

const BUILT_IN_SOUND_SOURCES = {
  tone1: require("../../assets/sounds/tone1.wav"),
  tone2: require("../../assets/sounds/tone2.wav"),
  tone3: require("../../assets/sounds/tone3.wav"),
};

const { width, height } = Dimensions.get("window");

const RING_PATTERN = [0, 500, 500];

export default function AlarmRingingScreen({ route, navigation }) {
  const { alarmId } = route.params || {};
  const [alarm, setAlarm] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [taskSolved, setTaskSolved] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [snoozesUsed, setSnoozesUsed] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const soundRef = useRef(null);
  const vibIntervalRef = useRef(null);
  const ringTimerRef = useRef(null);

  // Load alarm data
  useEffect(() => {
    loadAlarms().then((alarms) => {
      const found = alarms.find((a) => a.id === alarmId);
      if (found) {
        setAlarm(found);
        setSecondsLeft(found.ringDuration || 60);
        const taskKeys =
          found.tasks !== undefined
            ? found.tasks
            : found.task
              ? [found.task]
              : [];
        const filtered = taskKeys.filter((type) => type !== "none");
        const taskCount = found.taskCount || 1;
        if (filtered.length > 0) {
          const generated = Array.from({ length: taskCount }, (_, index) => {
            const type = filtered[index % filtered.length];
            return generateTask(type, found.taskDifficulty || "medium");
          });
          setTasks(generated);
        } else {
          setTasks([]);
        }
        setCurrentTaskIndex(0);
        setTaskSolved(false);
        setAttempts(0);
        setShowHint(false);
        setAnswer("");
        setSnoozesUsed(0);
      }
    });
  }, [alarmId]);

  // Pulsing animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Ring timer countdown
  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      stopAlarm();
      return;
    }
    ringTimerRef.current = setTimeout(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearTimeout(ringTimerRef.current);
  }, [secondsLeft]);

  // Vibration
  useEffect(() => {
    if (!alarm) return;
    if (alarm.vibrate) {
      Vibration.vibrate(RING_PATTERN, true);
    }
    return () => Vibration.cancel();
  }, [alarm]);

  // Audio playback for alarm
  useEffect(() => {
    if (!alarm) return;

    let mounted = true;
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          allowsRecordingIOS: false,
        });

        const soundSource =
          alarm.sound && alarm.sound !== "none"
            ? BUILT_IN_SOUND_SOURCES[alarm.sound] || { uri: alarm.sound }
            : null;

        if (soundSource) {
          const { sound } = await Audio.Sound.createAsync(soundSource, {
            shouldPlay: true,
            isLooping: true,
            volume: 1.0,
          });
          if (mounted) soundRef.current = sound;
        }
      } catch (e) {
        console.warn("Failed to play alarm sound", e);
      }
    };

    setupAudio();

    return () => {
      mounted = false;
      if (soundRef.current) {
        soundRef.current.stopAsync().catch(() => {});
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, [alarm]);

  const stopAlarm = useCallback(async () => {
    Vibration.cancel();
    clearTimeout(ringTimerRef.current);
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
    }
    if (alarm && !alarm.days.length) {
      // One-time alarm: disable it
      await updateAlarm(alarm.id, { enabled: false });
    }
    navigation.replace("Home");
  }, [alarm, navigation]);

  const handleSnooze = async () => {
    if (!alarm || !alarm.snoozeLimit) {
      Alert.alert("נודניק לא זמין", "נודניק אינו מוגדר לשעון זה.");
      return;
    }

    if (alarm.snoozeCount === 0 || snoozesUsed >= alarm.snoozeCount) {
      Alert.alert("אין יותר נודניקים", "הגעת למספר הנודניקים המקסימלי.");
      return;
    }

    const nextUsed = snoozesUsed + 1;
    Vibration.cancel();
    clearTimeout(ringTimerRef.current);
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }

    try {
      await scheduleSnoozeNotification(alarm, alarm.snoozeLimit);
    } catch (e) {
      console.warn("Failed to schedule snooze", e);
    }

    setSnoozesUsed(nextUsed);
    Alert.alert(
      "נודניק",
      `השעון יצלצל שוב בעוד ${alarm.snoozeLimit} דקות. נודניקים שנותרו: ${Math.max(
        alarm.snoozeCount - nextUsed,
        0,
      )}`,
      [{ text: "אוקי", onPress: () => navigation.replace("Home") }],
    );
  };

  const checkAnswer = () => {
    if (!tasks.length) return;
    const currentTask = tasks[currentTaskIndex];
    if (!currentTask) return;
    const userAns = answer.trim();
    const correct = currentTask.answer.toString().trim();

    if (userAns === correct) {
      if (currentTaskIndex + 1 < tasks.length) {
        setCurrentTaskIndex((idx) => idx + 1);
        setAnswer("");
        setAttempts(0);
        setShowHint(false);
      } else {
        setTaskSolved(true);
        setTimeout(() => stopAlarm(), 800);
      }
    } else {
      setAttempts((a) => a + 1);
      // Shake animation
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 8,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -8,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 60,
          useNativeDriver: true,
        }),
      ]).start();
      setAnswer("");
      if (attempts >= 4) setShowHint(true);
    }
  };

  const generateNewTask = () => {
    if (!alarm || !tasks.length) return;
    const taskKeys =
      alarm.tasks !== undefined ? alarm.tasks : alarm.task ? [alarm.task] : [];
    const currentTaskKey =
      taskKeys[currentTaskIndex] || tasks[currentTaskIndex]?.type;
    if (!currentTaskKey) return;
    setTasks((prev) =>
      prev.map((t, i) =>
        i === currentTaskIndex
          ? generateTask(currentTaskKey, alarm.taskDifficulty || "medium")
          : t,
      ),
    );
    setAnswer("");
    setAttempts(0);
    setShowHint(false);
  };

  const currentTask = tasks[currentTaskIndex];
  const selectedTaskTypes = alarm
    ? alarm.tasks !== undefined
      ? alarm.tasks.filter((t) => t !== "none")
      : alarm.task && alarm.task !== "none"
        ? [alarm.task]
        : []
    : [];
  const uniqueSelectedTaskTypes = Array.from(new Set(selectedTaskTypes));
  const remainingSnoozes = alarm
    ? Math.max(alarm.snoozeCount - snoozesUsed, 0)
    : 0;

  if (!alarm) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: "#fff", fontSize: 18 }}>טוען...</Text>
      </View>
    );
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050510" />
      <LinearGradient
        colors={["#050510", "#0a0520", "#050510"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Glow effect */}
      <Animated.View
        style={[styles.glow, { transform: [{ scale: pulseAnim }] }]}
      />

      {/* Ring timer */}
      {secondsLeft !== null && (
        <View style={styles.timerBadge}>
          <Ionicons name="timer-outline" size={14} color="#6c63ff" />
          <Text style={styles.timerText}>{formatTime(secondsLeft)}</Text>
        </View>
      )}

      {/* Clock display */}
      <View style={styles.topSection}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Text style={styles.ringEmoji}>⏰</Text>
        </Animated.View>
        <Text style={styles.alarmLabel}>{alarm.label}</Text>
        <Text style={styles.alarmTime}>
          {alarm.hour.toString().padStart(2, "0")}:
          {alarm.minute.toString().padStart(2, "0")}
        </Text>
      </View>

      {/* Task section or dismiss */}
      {currentTask && !taskSolved ? (
        <Animated.View
          style={[styles.taskCard, { transform: [{ translateX: shakeAnim }] }]}
        >
          <Text style={styles.taskTypeLabel}>{currentTask.typeLabel}</Text>
          {uniqueSelectedTaskTypes.length > 1 ? (
            <View style={styles.taskIconsRow}>
              {uniqueSelectedTaskTypes.map((type) => (
                <Text key={type} style={styles.taskIconsText}>
                  {MULTI_TASK_ICONS[type] || ""}
                </Text>
              ))}
            </View>
          ) : null}
          {tasks.length > 1 ? (
            <Text style={styles.taskCounter}>
              משימה {currentTaskIndex + 1} מתוך {tasks.length}
            </Text>
          ) : null}
          <Text style={styles.taskQuestion}>{currentTask.question}</Text>

          {showHint && (
            <View style={styles.hintBox}>
              <Text style={styles.hintText}>💡 {currentTask.hint}</Text>
            </View>
          )}

          <TextInput
            style={styles.answerInput}
            value={answer}
            onChangeText={setAnswer}
            placeholder="תשובה..."
            placeholderTextColor="#33334a"
            keyboardType={
              currentTask.type !== "word" ? "number-pad" : "default"
            }
            autoFocus
            returnKeyType="done"
            onSubmitEditing={checkAnswer}
          />

          {attempts > 0 && (
            <Text style={styles.attemptsText}>
              {attempts} ניסיון{attempts > 1 ? "ות" : ""} שגוי
              {attempts > 1 ? "ים" : ""}
            </Text>
          )}

          <View style={styles.taskActions}>
            <TouchableOpacity
              style={styles.checkBtn}
              onPress={checkAnswer}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#6c63ff", "#9b5de5"]}
                style={styles.checkBtnGrad}
              >
                <Text style={styles.checkBtnText}>בדוק ✓</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.newTaskBtn}
              onPress={generateNewTask}
            >
              <Text style={styles.newTaskText}>שאלה אחרת 🔄</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      ) : taskSolved ? (
        <View style={styles.solvedBox}>
          <Text style={styles.solvedEmoji}>🎉</Text>
          <Text style={styles.solvedText}>כל הכבוד! מתעורר...</Text>
        </View>
      ) : (
        /* No task */
        <View style={styles.noTaskSection}>
          <Text style={styles.noTaskText}>לחץ לעצור את השעון</Text>
        </View>
      )}

      {/* Bottom buttons */}
      <View style={styles.bottomActions}>
        {alarm.snoozeLimit > 0 && remainingSnoozes > 0 && (
          <TouchableOpacity style={styles.snoozeBtn} onPress={handleSnooze}>
            <Ionicons name="moon-outline" size={20} color="#8888aa" />
            <Text style={styles.snoozeBtnText}>
              נודניק {alarm.snoozeLimit}ד׳ • {remainingSnoozes} נשארו
            </Text>
          </TouchableOpacity>
        )}
        {(!currentTask || taskSolved) && (
          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={stopAlarm}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#f43f5e", "#e11d48"]}
              style={styles.dismissBtnGrad}
            >
              <Ionicons name="close" size={22} color="#fff" />
              <Text style={styles.dismissBtnText}>עצור שעון מעורר</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050510" },
  glow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#6c63ff",
    opacity: 0.08,
    top: height * 0.1,
    alignSelf: "center",
  },
  timerBadge: {
    position: "absolute",
    top: 56,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#1a1a2e",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2a2a40",
  },
  timerText: { fontSize: 13, color: "#6c63ff", fontWeight: "600" },
  topSection: {
    alignItems: "center",
    paddingTop: 80,
    paddingBottom: 20,
  },
  ringEmoji: { fontSize: 72 },
  alarmLabel: {
    fontSize: 16,
    color: "#8888aa",
    marginTop: 12,
    letterSpacing: 1,
  },
  alarmTime: {
    fontSize: 64,
    fontWeight: "200",
    color: "#ffffff",
    letterSpacing: -2,
    marginTop: 4,
  },
  taskCard: {
    marginHorizontal: 20,
    backgroundColor: "#111120",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#2a2a40",
  },
  taskTypeLabel: {
    fontSize: 13,
    color: "#6c63ff",
    letterSpacing: 1,
    marginBottom: 12,
    fontWeight: "600",
  },
  taskQuestion: {
    fontSize: 22,
    color: "#ffffff",
    fontWeight: "300",
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 16,
  },
  taskCounter: {
    fontSize: 14,
    color: "#8888aa",
    textAlign: "center",
    marginBottom: 8,
  },
  hintBox: {
    backgroundColor: "#0a0a20",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#facc15",
  },
  hintText: { fontSize: 13, color: "#facc15" },
  answerInput: {
    backgroundColor: "#0a0a18",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 22,
    color: "#ffffff",
    borderWidth: 1,
    borderColor: "#2a2a40",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 2,
  },
  attemptsText: {
    textAlign: "center",
    fontSize: 12,
    color: "#f87171",
    marginBottom: 8,
  },
  taskActions: {
    gap: 10,
    marginTop: 8,
  },
  checkBtn: { borderRadius: 14, overflow: "hidden" },
  checkBtnGrad: {
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 14,
  },
  checkBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  newTaskBtn: {
    paddingVertical: 10,
    alignItems: "center",
  },
  newTaskText: { fontSize: 14, color: "#44445a" },
  solvedBox: { alignItems: "center", padding: 32 },
  solvedEmoji: { fontSize: 64 },
  solvedText: {
    fontSize: 22,
    color: "#4ade80",
    marginTop: 12,
    fontWeight: "600",
  },
  noTaskSection: { flex: 1, alignItems: "center", justifyContent: "center" },
  noTaskText: { fontSize: 16, color: "#44445a" },
  bottomActions: {
    position: "absolute",
    bottom: 48,
    left: 20,
    right: 20,
    gap: 12,
  },
  snoozeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#111120",
    borderWidth: 1,
    borderColor: "#2a2a40",
    gap: 8,
  },
  snoozeBtnText: { fontSize: 15, color: "#8888aa", fontWeight: "500" },
  dismissBtn: { borderRadius: 16, overflow: "hidden" },
  dismissBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  dismissBtnText: { fontSize: 17, fontWeight: "700", color: "#fff" },
});
