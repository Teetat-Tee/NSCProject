// ============================================================
// theme.js — Design tokens พร้อม Dark Mode
// ใช้ useTheme() hook ในทุก screen แทนการ import colors ตรงๆ
// ============================================================
import { useColorScheme } from 'react-native';

// ============================================================
// Light Mode Colors
// ============================================================
const light = {
  bg:           '#FAF8F4',
  surface:      '#FFFFFF',
  surfaceMuted: '#F1EDE4',
  border:       '#E8E2D5',
  ink:          '#2B2B2E',
  inkMuted:     '#6B6B70',
  inkFaint:     '#A4A29C',
  onPrimary:    '#FFFFFF',
  primary:      '#5B7FA6',
  primarySoft:  '#E8EEF4',
  primaryDeep:  '#3D5A78',
  riskNormal:      '#4F9D69',
  riskNormalSoft:  '#E7F3EA',
  riskMild:        '#D6A23C',
  riskMildSoft:    '#FBF1DF',
  riskModerate:    '#D17A3D',
  riskModerateSoft:'#FAEEE1',
  riskSevere:      '#C1564E',
  riskSevereSoft:  '#F8E7E5',
  apnea:    '#C1564E',
  snore:    '#D6A23C',
  movement: '#5B7FA6',
  shadow:   'rgba(91, 74, 52, 0.08)',
  tabBar:       '#FFFFFF',
  tabBorder:    '#E8E2D5',
  tabActive:    '#5B7FA6',
  tabInactive:  '#A4A29C',
};

// ============================================================
// Dark Mode Colors
// ============================================================
const dark = {
  bg:           '#0F0F12',
  surface:      '#1C1C21',
  surfaceMuted: '#26262D',
  border:       '#35353D',
  ink:          '#F0EFF4',
  inkMuted:     '#9B9AA3',
  inkFaint:     '#5C5B63',
  onPrimary:    '#FFFFFF',
  primary:      '#7BA3C8',
  primarySoft:  '#1A2A38',
  primaryDeep:  '#9DBFDB',
  riskNormal:      '#5DBF7F',
  riskNormalSoft:  '#0D2B18',
  riskMild:        '#E0B050',
  riskMildSoft:    '#2B2010',
  riskModerate:    '#E08040',
  riskModerateSoft:'#2B1A0D',
  riskSevere:      '#D96B63',
  riskSevereSoft:  '#2B1210',
  apnea:    '#D96B63',
  snore:    '#E0B050',
  movement: '#7BA3C8',
  shadow:   'rgba(0, 0, 0, 0.3)',
  tabBar:       '#1C1C21',
  tabBorder:    '#35353D',
  tabActive:    '#7BA3C8',
  tabInactive:  '#5C5B63',
};

// ============================================================
// useTheme hook — ใช้ใน component
// ============================================================
export function useTheme() {
  const scheme = useColorScheme();
  const isDark  = scheme === 'dark';
  return { colors: isDark ? dark : light, isDark };
}

// ============================================================
// Static exports (สำหรับ StyleSheet.create ที่ต้องการค่าคงที่)
// ============================================================
export const colors = light; // default light (ใช้กับ StyleSheet.create)

export const radius = {
  sm:   12,
  md:   16,
  lg:   22,
  xl:   28,
  pill: 999,
};

export const shadow = {
  card: {
    shadowColor:   '#5B4A34',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius:  12,
    elevation:     2,
  },
  raised: {
    shadowColor:   '#5B4A34',
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius:  20,
    elevation:     4,
  },
  float: {
    shadowColor:   '#000000',
    shadowOffset:  { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius:  24,
    elevation:     12,
  },
};

export function riskTokens(label, isDark = false) {
  const c = isDark ? dark : light;
  switch (label) {
    case 'ปกติ':    return { color: c.riskNormal,   soft: c.riskNormalSoft };
    case 'เล็กน้อย': return { color: c.riskMild,     soft: c.riskMildSoft };
    case 'ปานกลาง': return { color: c.riskModerate,  soft: c.riskModerateSoft };
    case 'รุนแรง':  return { color: c.riskSevere,    soft: c.riskSevereSoft };
    default:        return { color: c.primary,       soft: c.primarySoft };
  }
}

export function eventColor(type, isDark = false) {
  const c = isDark ? dark : light;
  if (type === 'apnea')    return c.apnea;
  if (type === 'snore')    return c.snore;
  return c.movement;
}