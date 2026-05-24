import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, StatusBar, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  addAlarm, updateAlarm, defaultAlarm, DAY_LABELS, DAY_NAMES,
} from '../store/alarmStore';
import {
  scheduleAlarmNotification, cancelAlarmNotification, requestNotificationPermissions,
} from '../utils/notifications';
import { TASK_TYPES, DIFFICULTY_LEVELS } from '../utils/taskGenerator';

function TimePicker({ hour, minute, onChange }) {
  const [editingHour, setEditingHour] = useState(false);
  const [editingMinute, setEditingMinute] = useState(false);

  const adjustHour = (delta) => {
    const newH = ((hour + delta) + 24) % 24;
    onChange(newH, minute);
  };
  const adjustMinute = (delta) => {
    const newM = ((minute + delta) + 60) % 60;
    onChange(hour, newM);
  };

  return (
    <View style={tp.container}>
      {/* Hour */}
      <View style={tp.unit}>
        <TouchableOpacity onPress={() => adjustHour(1)} style={tp.arrow}>
          <Ionicons name="chevron-up" size={28} color="#6c63ff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setEditingHour(true)} style={tp.numBox}>
          {editingHour ? (
            <TextInput
              style={tp.numInput}
              value={hour.toString()}
              keyboardType="number-pad"
              maxLength={2}
              autoFocus
              onChangeText={(v) => {
                const n = parseInt(v, 10);
                if (!isNaN(n) && n >= 0 && n <= 23) onChange(n, minute);
              }}
              onBlur={() => setEditingHour(false)}
            />
          ) : (
            <Text style={tp.num}>{hour.toString().padStart(2, '0')}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => adjustHour(-1)} style={tp.arrow}>
          <Ionicons name="chevron-down" size={28} color="#6c63ff" />
        </TouchableOpacity>
      </View>

      <Text style={tp.colon}>:</Text>

      {/* Minute */}
      <View style={tp.unit}>
        <TouchableOpacity onPress={() => adjustMinute(1)} style={tp.arrow}>
          <Ionicons name="chevron-up" size={28} color="#6c63ff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setEditingMinute(true)} style={tp.numBox}>
          {editingMinute ? (
            <TextInput
              style={tp.numInput}
              value={minute.toString()}
              keyboardType="number-pad"
              maxLength={2}
              autoFocus
              onChangeText={(v) => {
                const n = parseInt(v, 10);
                if (!isNaN(n) && n >= 0 && n <= 59) onChange(hour, n);
              }}
              onBlur={() => setEditingMinute(false)}
            />
          ) : (
            <Text style={tp.num}>{minute.toString().padStart(2, '0')}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => adjustMinute(-1)} style={tp.arrow}>
          <Ionicons name="chevron-down" size={28} color="#6c63ff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const tp = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  unit: { alignItems: 'center' },
  arrow: { padding: 8 },
  numBox: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    width: 100,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2a2a40',
  },
  num: {
    fontSize: 52,
    fontWeight: '200',
    color: '#ffffff',
    letterSpacing: -2,
  },
  numInput: {
    fontSize: 52,
    fontWeight: '200',
    color: '#6c63ff',
    letterSpacing: -2,
    width: 90,
    textAlign: 'center',
  },
  colon: {
    fontSize: 52,
    fontWeight: '100',
    color: '#6c63ff',
    marginHorizontal: 10,
    marginBottom: 8,
  },
});

function SectionLabel({ label, icon }) {
  return (
    <View style={styles.sectionLabel}>
      <Text style={styles.sectionIcon}>{icon}</Text>
      <Text style={styles.sectionText}>{label}</Text>
    </View>
  );
}

export default function EditAlarmScreen({ route, navigation }) {
  const existingAlarm = route.params?.alarm;
  const [alarm, setAlarm] = useState(existingAlarm || defaultAlarm());

  useEffect(() => {
    navigation.setOptions({
      title: existingAlarm ? 'עריכת שעון מעורר' : 'שעון מעורר חדש',
    });
  }, []);

  const update = (key, val) => setAlarm(a => ({ ...a, [key]: val }));

  const toggleDay = (day) => {
    const days = alarm.days.includes(day)
      ? alarm.days.filter(d => d !== day)
      : [...alarm.days, day];
    update('days', days);
  };

  const handleSave = async () => {
    const granted = await requestNotificationPermissions();
    if (!granted) {
      Alert.alert('הרשאות חסרות', 'יש לאשר הרשאות התראות כדי שהשעון יעבוד כראוי.');
    }

    if (existingAlarm) {
      await updateAlarm(alarm.id, alarm);
      if (alarm.enabled) {
        await cancelAlarmNotification(alarm.id);
        await scheduleAlarmNotification(alarm);
      }
    } else {
      await addAlarm(alarm);
      if (alarm.enabled) {
        await scheduleAlarmNotification(alarm);
      }
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />
      <LinearGradient
        colors={['#0a0a0f', '#0d0d1a', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Time Picker */}
        <LinearGradient
          colors={['#12122a', '#0f0f22']}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TimePicker
            hour={alarm.hour}
            minute={alarm.minute}
            onChange={(h, m) => setAlarm(a => ({ ...a, hour: h, minute: m }))}
          />
        </LinearGradient>

        {/* Label */}
        <View style={styles.card}>
          <SectionLabel label="שם השעון" icon="🏷️" />
          <TextInput
            style={styles.input}
            value={alarm.label}
            onChangeText={(v) => update('label', v)}
            placeholder="שם השעון..."
            placeholderTextColor="#33334a"
            maxLength={30}
          />
        </View>

        {/* Days */}
        <View style={styles.card}>
          <SectionLabel label="ימי חזרה" icon="📅" />
          <Text style={styles.hint}>ריק = פעם אחת</Text>
          <View style={styles.daysRow}>
            {DAY_LABELS.map((lbl, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => toggleDay(idx)}
                style={[
                  styles.dayBtn,
                  alarm.days.includes(idx) && styles.dayBtnActive,
                ]}
              >
                <Text style={[
                  styles.dayText,
                  alarm.days.includes(idx) && styles.dayTextActive,
                ]}>
                  {lbl}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Ring duration */}
        <View style={styles.card}>
          <SectionLabel label="משך צלצול מקסימלי" icon="⏱️" />
          <Text style={styles.hint}>השעון יפסיק לצלצל אוטומטית אחרי זמן זה</Text>
          <View style={styles.chipRow}>
            {[15, 30, 60, 120, 300].map(sec => (
              <TouchableOpacity
                key={sec}
                style={[styles.chip, alarm.ringDuration === sec && styles.chipActive]}
                onPress={() => update('ringDuration', sec)}
              >
                <Text style={[styles.chipText, alarm.ringDuration === sec && styles.chipTextActive]}>
                  {sec < 60 ? `${sec}ש` : `${sec / 60}ד`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Snooze */}
        <View style={styles.card}>
          <SectionLabel label="נודניק (Snooze)" icon="😴" />
          <View style={styles.chipRow}>
            {[0, 5, 10, 15, 20].map(min => (
              <TouchableOpacity
                key={min}
                style={[styles.chip, alarm.snoozeLimit === min && styles.chipActive]}
                onPress={() => update('snoozeLimit', min)}
              >
                <Text style={[styles.chipText, alarm.snoozeLimit === min && styles.chipTextActive]}>
                  {min === 0 ? 'כבוי' : `${min}ד`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Task type */}
        <View style={styles.card}>
          <SectionLabel label="משימת התעוררות" icon="🧠" />
          <Text style={styles.hint}>פתור כדי לכבות את השעון</Text>
          {TASK_TYPES.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.taskRow, alarm.task === t.key && styles.taskRowActive]}
              onPress={() => update('task', t.key)}
            >
              <Text style={styles.taskIcon}>{t.icon}</Text>
              <Text style={[styles.taskLabel, alarm.task === t.key && styles.taskLabelActive]}>
                {t.label}
              </Text>
              {alarm.task === t.key && (
                <Ionicons name="checkmark-circle" size={20} color="#6c63ff" style={{ marginLeft: 'auto' }} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Difficulty */}
        {alarm.task !== 'none' && (
          <View style={styles.card}>
            <SectionLabel label="רמת קושי" icon="💪" />
            <View style={styles.chipRow}>
              {DIFFICULTY_LEVELS.map(d => (
                <TouchableOpacity
                  key={d.key}
                  style={[
                    styles.chip,
                    alarm.taskDifficulty === d.key && { ...styles.chipActive, borderColor: d.color },
                  ]}
                  onPress={() => update('taskDifficulty', d.key)}
                >
                  <Text style={[
                    styles.chipText,
                    alarm.taskDifficulty === d.key && { color: d.color },
                  ]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity onPress={handleSave} activeOpacity={0.85} style={styles.saveWrapper}>
          <LinearGradient
            colors={['#6c63ff', '#9b5de5']}
            style={styles.saveBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="checkmark" size={22} color="#fff" />
            <Text style={styles.saveBtnText}>שמור שעון מעורר</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  scroll: { paddingHorizontal: 16, paddingTop: 16 },
  card: {
    backgroundColor: '#111120',
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e1e30',
  },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  sectionIcon: { fontSize: 18 },
  sectionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ccccdd',
    letterSpacing: 0.3,
  },
  hint: {
    fontSize: 12,
    color: '#44445a',
    marginBottom: 12,
    marginTop: -8,
  },
  input: {
    backgroundColor: '#0a0a18',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2a2a40',
    textAlign: 'right',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0a0a18',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2a2a40',
  },
  dayBtnActive: {
    backgroundColor: '#6c63ff',
    borderColor: '#6c63ff',
  },
  dayText: {
    fontSize: 13,
    color: '#55556a',
    fontWeight: '600',
  },
  dayTextActive: {
    color: '#fff',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0a0a18',
    borderWidth: 1,
    borderColor: '#2a2a40',
  },
  chipActive: {
    backgroundColor: '#1a1a30',
    borderColor: '#6c63ff',
  },
  chipText: {
    fontSize: 14,
    color: '#55556a',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#a89dff',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
    gap: 12,
    backgroundColor: '#0a0a18',
    borderWidth: 1,
    borderColor: '#1e1e30',
  },
  taskRowActive: {
    borderColor: '#6c63ff',
    backgroundColor: '#14142a',
  },
  taskIcon: { fontSize: 20 },
  taskLabel: {
    fontSize: 15,
    color: '#55556a',
    fontWeight: '500',
  },
  taskLabelActive: {
    color: '#ccccee',
  },
  saveWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 8,
    elevation: 10,
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  saveBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
});
