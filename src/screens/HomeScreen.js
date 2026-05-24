import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Switch, Animated, Dimensions, StatusBar, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  loadAlarms, updateAlarm, deleteAlarm, formatAlarmTime, DAY_LABELS,
} from '../store/alarmStore';
import { scheduleAlarmNotification, cancelAlarmNotification } from '../utils/notifications';

const { width } = Dimensions.get('window');

function ClockWidget() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const h = time.getHours().toString().padStart(2, '0');
  const m = time.getMinutes().toString().padStart(2, '0');
  const s = time.getSeconds().toString().padStart(2, '0');

  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const monthNames = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

  return (
    <View style={styles.clockWidget}>
      <Text style={styles.clockTime}>{h}:{m}</Text>
      <Text style={styles.clockSeconds}>:{s}</Text>
      <Text style={styles.clockDate}>
        יום {dayNames[time.getDay()]}, {time.getDate()} {monthNames[time.getMonth()]} {time.getFullYear()}
      </Text>
    </View>
  );
}

function AlarmCard({ alarm, onToggle, onDelete, onEdit }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleLongPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      Alert.alert('מחיקת שעון מעורר', `למחוק את "${alarm.label}"?`, [
        { text: 'ביטול', style: 'cancel' },
        { text: 'מחק', style: 'destructive', onPress: () => onDelete(alarm.id) },
      ]);
    });
  };

  const taskIcons = { math: '🧮', word: '📝', sequence: '🔢', none: '' };
  const activeDays = alarm.days.map(d => DAY_LABELS[d]).join(' ');

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={() => onEdit(alarm)}
        onLongPress={handleLongPress}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={alarm.enabled ? ['#1a1a2e', '#16213e'] : ['#111118', '#0d0d15']}
          style={[styles.card, !alarm.enabled && styles.cardDisabled]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardLeft}>
            <View style={styles.timeRow}>
              <Text style={[styles.alarmTime, !alarm.enabled && styles.dimText]}>
                {formatAlarmTime(alarm.hour, alarm.minute)}
              </Text>
              {alarm.task !== 'none' && (
                <Text style={styles.taskBadge}>{taskIcons[alarm.task]}</Text>
              )}
            </View>
            <Text style={[styles.alarmLabel, !alarm.enabled && styles.dimText]}>{alarm.label}</Text>
            <View style={styles.metaRow}>
              {alarm.days.length > 0 ? (
                <Text style={styles.metaText}>{activeDays}</Text>
              ) : (
                <Text style={styles.metaText}>פעם אחת</Text>
              )}
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaText}>מקסימום {alarm.ringDuration}ש׳</Text>
              {alarm.snoozeLimit > 0 && (
                <>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaText}>נודניק {alarm.snoozeLimit}ד׳</Text>
                </>
              )}
            </View>
          </View>
          <View style={styles.cardRight}>
            <Switch
              value={alarm.enabled}
              onValueChange={() => onToggle(alarm.id, !alarm.enabled)}
              trackColor={{ false: '#2a2a3e', true: '#6c63ff' }}
              thumbColor={alarm.enabled ? '#a89dff' : '#555566'}
            />
          </View>
          {alarm.enabled && (
            <View style={styles.activeIndicator} />
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen({ navigation }) {
  const [alarms, setAlarms] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadAlarms().then(setAlarms);
    }, [])
  );

  const handleToggle = async (id, enabled) => {
    const updated = await updateAlarm(id, { enabled });
    setAlarms(updated);
    const alarm = updated.find(a => a.id === id);
    if (alarm) {
      if (enabled) {
        await scheduleAlarmNotification(alarm);
      } else {
        await cancelAlarmNotification(id);
      }
    }
  };

  const handleDelete = async (id) => {
    await cancelAlarmNotification(id);
    const updated = await deleteAlarm(id);
    setAlarms(updated);
  };

  const handleEdit = (alarm) => {
    navigation.navigate('EditAlarm', { alarm });
  };

  const activeCount = alarms.filter(a => a.enabled).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />
      <LinearGradient
        colors={['#0a0a0f', '#0d0d1a', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>WakeUp</Text>
          <Text style={styles.appSubtitle}>
            {activeCount > 0 ? `${activeCount} שעונים פעילים` : 'אין שעונים פעילים'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('EditAlarm', { alarm: null })}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#6c63ff', '#9b5de5']}
            style={styles.addButtonGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Clock */}
      <ClockWidget />

      {/* Alarm List */}
      {alarms.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>⏰</Text>
          <Text style={styles.emptyTitle}>אין שעוני מעורר</Text>
          <Text style={styles.emptySubtitle}>לחץ על + כדי להוסיף שעון מעורר חדש</Text>
        </View>
      ) : (
        <FlatList
          data={alarms.sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute))}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <AlarmCard
              alarm={item}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 8,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: '#6c63ff',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  addButton: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  addButtonGrad: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockWidget: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  clockTime: {
    fontSize: 72,
    fontWeight: '200',
    color: '#ffffff',
    letterSpacing: -2,
  },
  clockSeconds: {
    fontSize: 30,
    fontWeight: '200',
    color: '#6c63ff',
    marginTop: 28,
    letterSpacing: -1,
  },
  clockDate: {
    width: '100%',
    textAlign: 'center',
    fontSize: 14,
    color: '#55556a',
    marginTop: -4,
    letterSpacing: 0.5,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  cardWrapper: {
    marginBottom: 12,
    borderRadius: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e1e30',
    overflow: 'hidden',
  },
  cardDisabled: {
    opacity: 0.5,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 16,
    bottom: 16,
    width: 3,
    backgroundColor: '#6c63ff',
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  cardLeft: {
    flex: 1,
  },
  cardRight: {
    marginLeft: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alarmTime: {
    fontSize: 42,
    fontWeight: '300',
    color: '#ffffff',
    letterSpacing: -1,
  },
  taskBadge: {
    fontSize: 22,
    marginTop: 4,
  },
  dimText: {
    color: '#44445a',
  },
  alarmLabel: {
    fontSize: 14,
    color: '#8888aa',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 11,
    color: '#44445a',
    letterSpacing: 0.3,
  },
  metaDot: {
    fontSize: 11,
    color: '#33334a',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#44445a',
    textAlign: 'center',
  },
});
