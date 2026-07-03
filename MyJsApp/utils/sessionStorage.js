// ============================================================
// utils/sessionStorage.js — Sessions ผ่าน server API
// มี offline cache ด้วย AsyncStorage เผื่อ server ไม่ตอบ
// ============================================================
import { apiFetch } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateAHI, classifyRisk } from './modelHelper';

const CACHE_KEY    = 'osa_sessions_cache_v2';
const CACHE_EXPIRE = 5 * 60 * 1000; // 5 นาที

// ============================================================
// บันทึก session ใหม่
// ============================================================
export async function saveSession({ duration, events, survey }) {
  const apneaCount = events.filter(e => e.type === 'apnea').length;
  const snoreCount = events.filter(e => e.type === 'snore').length;
  const moveCount  = events.filter(e => e.type === 'movement').length;
  const ahi        = calculateAHI(apneaCount, duration);
  const risk       = classifyRisk(ahi);
  const today      = new Date().toISOString().split('T')[0];

  const payload = {
    date:        today,
    duration:    duration,
    ahi:         ahi,
    riskLabel:   risk.label,
    apneaCount,
    snoreCount,
    moveCount,
    engine:      'dsp',
    wellnessPct: survey?.wellnessPercent ?? 0,
    events:      events,
    survey:      survey,
  };

  try {
    const data = await apiFetch('/sessions', {
      method: 'POST',
      body:   JSON.stringify(payload),
    });

    // invalidate cache
    await AsyncStorage.removeItem(CACHE_KEY);

    return { id: data.sessionId, ...payload };
  } catch (err) {
    console.warn('saveSession server error:', err.message, '— saving locally');

    // fallback: บันทึกใน AsyncStorage
    const local = await getLocalSessions();
    const id    = `local_${Date.now()}`;
    local.unshift({ id, ...payload, timestamp: Date.now() });
    await AsyncStorage.setItem('osa_local_sessions', JSON.stringify(local));
    return { id, ...payload };
  }
}

// ============================================================
// ดึง sessions ทั้งหมด
// ============================================================
async function fetchSessions() {
  // เช็ค cache ก่อน
  const cached = await AsyncStorage.getItem(CACHE_KEY);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_EXPIRE) return data;
  }

  const result   = await apiFetch('/sessions');
  const sessions = (result.sessions || []).map(normalizeSession);

  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
    data: sessions, timestamp: Date.now()
  }));

  return sessions;
}

function normalizeSession(s) {
  return {
    id:          String(s.id),
    date:        s.date,
    duration:    s.duration_sec,
    ahi:         Number(s.ahi),
    riskLabel:   s.risk_label,
    apneaCount:  s.apnea_count,
    snoreCount:  s.snore_count,
    moveCount:   s.move_count,
    engine:      s.engine,
    wellnessPct: s.wellness_pct,
    events:      Array.isArray(s.events) ? s.events.filter(Boolean).map(e => ({
      type:      e.type,
      time:      e.time_str,
      timestamp: e.timestamp,
      msg:       e.msg,
      confidence:e.confidence,
    })) : [],
    timestamp:   new Date(s.created_at).getTime(),
    survey:      s.wellness_pct ? { wellnessPercent: s.wellness_pct } : null,
  };
}

async function getLocalSessions() {
  try {
    const raw = await AsyncStorage.getItem('osa_local_sessions');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// ============================================================
// Public API (ตรงกับ interface เดิมที่ทุก screen ใช้)
// ============================================================
export async function getAllSessions() {
  try {
    return await fetchSessions();
  } catch {
    return getLocalSessions();
  }
}

export async function getLatestSession() {
  const sessions = await getAllSessions();
  return sessions.length > 0 ? sessions[0] : null;
}

export async function getSessionById(id) {
  try {
    if (String(id).startsWith('local_')) {
      const local = await getLocalSessions();
      return local.find(s => s.id === id) || null;
    }
    const data = await apiFetch(`/sessions/${id}`);
    return normalizeSession(data.session);
  } catch {
    return null;
  }
}

export async function getSessionsByMonth(year, month) {
  const sessions = await getAllSessions();
  return sessions.filter(s => {
    const d = new Date(s.date + 'T00:00:00');
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
}

export async function getOverallStats() {
  try {
    const data = await apiFetch('/sessions/stats');
    return {
      totalNights:    Number(data.stats.total_nights)    || 0,
      avgSleepHours:  Number(data.stats.avg_sleep_hours) || 0,
      streak:         Number(data.stats.streak)          || 0,
    };
  } catch {
    // fallback: คำนวณจาก cache
    const sessions = await getAllSessions();
    if (sessions.length === 0) return { totalNights: 0, avgSleepHours: 0, streak: 0 };
    const avg = sessions.reduce((s, x) => s + x.duration, 0) / sessions.length / 3600;
    return {
      totalNights:   sessions.length,
      avgSleepHours: Math.round(avg * 10) / 10,
      streak:        0,
    };
  }
}