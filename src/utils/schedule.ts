import type {
  Appointment,
  ComputedDoseState,
  DoseLog,
  Medication,
  ScheduledDoseSlot,
} from '../types';

export const COMMON_TIMEZONES = [
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export function detectBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';
  } catch {
    return 'America/Los_Angeles';
  }
}

export function getLocalDateKey(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function getLocalTimeHHmm(date: Date, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date);
    const hour = parts.find((p) => p.type === 'hour')?.value || '00';
    const minute = parts.find((p) => p.type === 'minute')?.value || '00';
    return `${hour}:${minute}`;
  } catch {
    return date.toISOString().slice(11, 16);
  }
}

export function formatTime12h(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatDateFriendly(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return dateKey;
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(dt);
}

export function getPastDateKeys(days: number, timeZone: string, now = new Date()): string[] {
  const todayKey = getLocalDateKey(now, timeZone);
  const [y, m, d] = todayKey.split('-').map(Number);
  const baseUtc = Date.UTC(y, m - 1, d, 12, 0, 0);
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const dt = new Date(baseUtc - i * 86400_000);
    keys.push(dt.toISOString().slice(0, 10));
  }
  return keys;
}

export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function makeDoseLogId(medId: string, dateKey: string, scheduledTime: string): string {
  return `${medId}_${dateKey}_${scheduledTime.replace(':', '')}`;
}

export function normalizeMedicationKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function findDuplicateMedication(
  name: string,
  medications: Medication[],
  excludeId?: string
): Medication | undefined {
  const target = normalizeMedicationKey(name);
  if (!target) return undefined;
  return medications.find(
    (m) => m.id !== excludeId && (m.nameKey === target || normalizeMedicationKey(m.name) === target)
  );
}

export function isMedicationScheduledOnDate(med: Medication, dateKey: string): boolean {
  if (!med.active) return false;
  if (dateKey < med.startDate) return false;
  if (med.endDate && dateKey > med.endDate) return false;
  return true;
}

export function computeDoseState(params: {
  dateKey: string;
  scheduledTime: string;
  log?: DoseLog;
  nowDateKey: string;
  nowHHmm: string;
}): ComputedDoseState {
  const { dateKey, scheduledTime, log, nowDateKey, nowHHmm } = params;
  if (log) {
    return log.status;
  }
  if (dateKey < nowDateKey) {
    // Critical CareCircle rule: past unlogged doses remain unconfirmed, never assumed missed
    return 'unconfirmed';
  }
  if (dateKey > nowDateKey) {
    return 'upcoming';
  }
  const nowMin = hhmmToMinutes(nowHHmm);
  const schedMin = hhmmToMinutes(scheduledTime);
  if (nowMin - schedMin > 15) {
    return 'unconfirmed';
  }
  if (schedMin - nowMin <= 30 && schedMin - nowMin >= -15) {
    return 'due_now';
  }
  return 'upcoming';
}

export function buildScheduleForDate(params: {
  medications: Medication[];
  doseLogs: DoseLog[];
  dateKey: string;
  timeZone: string;
  now?: Date;
}): ScheduledDoseSlot[] {
  const { medications, doseLogs, dateKey, timeZone, now = new Date() } = params;
  const nowDateKey = getLocalDateKey(now, timeZone);
  const nowHHmm = getLocalTimeHHmm(now, timeZone);
  const logMap = new Map<string, DoseLog>();
  for (const log of doseLogs) {
    logMap.set(log.id, log);
  }

  const slots: ScheduledDoseSlot[] = [];
  for (const med of medications) {
    if (!isMedicationScheduledOnDate(med, dateKey)) continue;
    for (const scheduledTime of med.scheduledTimes) {
      const slotKey = makeDoseLogId(med.id, dateKey, scheduledTime);
      const log = logMap.get(slotKey);
      const state = computeDoseState({
        dateKey,
        scheduledTime,
        log,
        nowDateKey,
        nowHHmm,
      });
      slots.push({
        slotKey,
        medication: med,
        dateKey,
        scheduledTime,
        state,
        log,
      });
    }
  }

  return slots.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
}

export interface DailyAdherencePoint {
  dateKey: string;
  label: string;
  taken: number;
  unconfirmed: number;
  missed: number;
  skipped: number;
  scheduled: number;
  totalDue: number;
  adherencePct: number | null;
}

export function computeWeeklyAdherence(params: {
  medications: Medication[];
  doseLogs: DoseLog[];
  timeZone: string;
  now?: Date;
}): {
  days: DailyAdherencePoint[];
  takenCount: number;
  unconfirmedCount: number;
  missedCount: number;
  skippedCount: number;
  totalCompletedOrDue: number;
  adherenceRatePct: number | null;
} {
  const { medications, doseLogs, timeZone, now = new Date() } = params;
  const dateKeys = getPastDateKeys(7, timeZone, now);
  let takenCount = 0;
  let unconfirmedCount = 0;
  let missedCount = 0;
  let skippedCount = 0;

  const days: DailyAdherencePoint[] = dateKeys.map((dateKey) => {
    const slots = buildScheduleForDate({ medications, doseLogs, dateKey, timeZone, now });
    let taken = 0;
    let unconfirmed = 0;
    let missed = 0;
    let skipped = 0;
    let scheduled = 0;

    for (const s of slots) {
      if (s.state === 'taken') taken++;
      else if (s.state === 'unconfirmed') unconfirmed++;
      else if (s.state === 'missed') missed++;
      else if (s.state === 'skipped') skipped++;
      else scheduled++;
    }

    takenCount += taken;
    unconfirmedCount += unconfirmed;
    missedCount += missed;
    skippedCount += skipped;

    const totalDue = taken + unconfirmed + missed;
    const adherencePct = totalDue > 0 ? Math.round((taken / totalDue) * 100) : null;

    const [y, m, d] = dateKey.split('-').map(Number);
    const label = new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(y, m - 1, d, 12, 0, 0)));

    return {
      dateKey,
      label,
      taken,
      unconfirmed,
      missed,
      skipped,
      scheduled,
      totalDue,
      adherencePct,
    };
  });

  const totalCompletedOrDue = takenCount + unconfirmedCount + missedCount;
  const adherenceRatePct =
    totalCompletedOrDue > 0 ? Math.round((takenCount / totalCompletedOrDue) * 100) : null;

  return {
    days,
    takenCount,
    unconfirmedCount,
    missedCount,
    skippedCount,
    totalCompletedOrDue,
    adherenceRatePct,
  };
}

export function getUpcomingAppointments(
  appointments: Appointment[],
  timeZone: string,
  now = new Date()
): Appointment[] {
  const todayKey = getLocalDateKey(now, timeZone);
  return appointments
    .filter((a) => a.status === 'upcoming' && a.appointmentDate >= todayKey)
    .sort((a, b) =>
      `${a.appointmentDate} ${a.appointmentTime}`.localeCompare(
        `${b.appointmentDate} ${b.appointmentTime}`
      )
    );
}

export function getAppointmentReminderWindow(
  appointment: Appointment,
  timeZone: string,
  now = new Date()
): 'today' | 'tomorrow' | 'this_week' | 'later' | 'past' {
  const todayKey = getLocalDateKey(now, timeZone);
  if (appointment.appointmentDate < todayKey) return 'past';
  if (appointment.appointmentDate === todayKey) return 'today';

  const [ty, tm, td] = todayKey.split('-').map(Number);
  const [ay, am, ad] = appointment.appointmentDate.split('-').map(Number);
  const todayUtc = Date.UTC(ty, tm - 1, td);
  const apptUtc = Date.UTC(ay, am - 1, ad);
  const diffDays = Math.round((apptUtc - todayUtc) / 86400_000);

  if (diffDays === 1) return 'tomorrow';
  if (diffDays <= 7) return 'this_week';
  return 'later';
}

export function generateSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36);
  return `${prefix}_${ts}_${rand}`.replace(/[^a-zA-Z0-9_\-]/g, '');
}

export function generateInvitePasscode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += chars[Math.floor(Math.random() * chars.length)];
    part2 += chars[Math.floor(Math.random() * chars.length)];
  }
  return `CC-${part1}-${part2}`;
}

export function formatRoleLabel(role: string): string {
  switch (role) {
    case 'primary_caregiver':
      return 'Primary Caregiver';
    case 'caretaker':
      return 'Caretaker';
    case 'elder':
      return 'Care Recipient';
    case 'family_member':
      return 'Family Member';
    default:
      return role;
  }
}

export type RefillEstimateStatus =
  | 'estimated'
  | 'paused'
  | 'expired'
  | 'manual_tracking_required';

export interface RefillEstimate {
  medicationId: string;
  status: RefillEstimateStatus;
  daysRemaining: number | null;
  estimatedRunOutDateKey: string | null;
  isLow: boolean;
  dailyUnitsUsed: number | null;
  startsInFuture?: boolean;
}

function addDaysToDateKey(dateKey: string, daysToAdd: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return dateKey;
  const utc = new Date(Date.UTC(y, m - 1, d + daysToAdd, 12, 0, 0));
  return utc.toISOString().slice(0, 10);
}

function diffCalendarDays(fromDateKey: string, toDateKey: string): number {
  const [fy, fm, fd] = fromDateKey.split('-').map(Number);
  const [ty, tm, td] = toDateKey.split('-').map(Number);
  if (!fy || !fm || !fd || !ty || !tm || !td) return 0;
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400_000);
}

export function isValidE164Phone(raw: string): boolean {
  const compact = raw.trim().replace(/[\s\-()]/g, '');
  return /^\+[1-9]\d{9,14}$/.test(compact);
}

export function computeRefillEstimate(params: {
  medication: Medication;
  refillInfo?: {
    availableQuantity: number;
    dosesPerIntake: number;
    alertDaysBefore: number;
  };
  timeZone: string;
  now?: Date;
}): RefillEstimate | null {
  const { medication, refillInfo, timeZone, now = new Date() } = params;
  if (!refillInfo) return null;

  if (!medication.active) {
    return {
      medicationId: medication.id,
      status: 'paused',
      daysRemaining: null,
      estimatedRunOutDateKey: null,
      isLow: false,
      dailyUnitsUsed: null,
    };
  }

  const todayKey = getLocalDateKey(now, timeZone);

  if (medication.endDate && todayKey > medication.endDate) {
    return {
      medicationId: medication.id,
      status: 'expired',
      daysRemaining: null,
      estimatedRunOutDateKey: null,
      isLow: false,
      dailyUnitsUsed: null,
    };
  }

  const freq = (medication.frequency || '').trim().toLowerCase();
  const slotCount = medication.scheduledTimes.length;
  let timesPerDay: number | null = null;

  if (freq === 'once daily' || freq === 'daily') {
    timesPerDay = slotCount > 0 ? slotCount : 1;
  } else if (freq === 'twice daily') {
    timesPerDay = slotCount > 0 ? slotCount : 2;
  } else if (freq === 'three times daily') {
    timesPerDay = slotCount > 0 ? slotCount : 3;
  } else if (freq === 'weekly') {
    timesPerDay = (slotCount > 0 ? slotCount : 1) / 7;
  } else {
    // 'As needed' or unknown/custom frequencies must never silently assume daily dosing
    return {
      medicationId: medication.id,
      status: 'manual_tracking_required',
      daysRemaining: null,
      estimatedRunOutDateKey: null,
      isLow: false,
      dailyUnitsUsed: null,
    };
  }

  const dailyUnitsUsed = timesPerDay * Math.max(0.25, refillInfo.dosesPerIntake);
  if (dailyUnitsUsed <= 0) {
    return {
      medicationId: medication.id,
      status: 'manual_tracking_required',
      daysRemaining: null,
      estimatedRunOutDateKey: null,
      isLow: false,
      dailyUnitsUsed: null,
    };
  }

  const activeSupplyDays = Math.max(0, Math.floor(refillInfo.availableQuantity / dailyUnitsUsed));
  const startsInFuture = Boolean(medication.startDate && medication.startDate > todayKey);
  const effectiveStartKey = startsInFuture ? medication.startDate : todayKey;
  const estimatedRunOutDateKey = addDaysToDateKey(effectiveStartKey, activeSupplyDays);
  const daysRemaining = Math.max(0, diffCalendarDays(todayKey, estimatedRunOutDateKey));
  const runsOutAfterEndDate = Boolean(
    medication.endDate && estimatedRunOutDateKey > medication.endDate
  );

  return {
    medicationId: medication.id,
    status: 'estimated',
    daysRemaining,
    estimatedRunOutDateKey,
    isLow: !runsOutAfterEndDate && daysRemaining <= refillInfo.alertDaysBefore,
    dailyUnitsUsed,
    startsInFuture,
  };
}

