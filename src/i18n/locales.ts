import type {
  ActivityCategory,
  AppLanguage,
  AppointmentStatus,
  CircleRole,
  ComputedDoseState,
  EmailDeliveryStatus,
} from '../types';

export function getIntlLocale(lang: AppLanguage): string {
  return lang === 'hi' ? 'hi-IN' : 'en-US';
}

export function formatNumberLocalized(value: number, lang: AppLanguage): string {
  try {
    return new Intl.NumberFormat(getIntlLocale(lang)).format(value);
  } catch {
    return String(value);
  }
}

export function formatPercentLocalized(value: number, lang: AppLanguage): string {
  return `${formatNumberLocalized(value, lang)}%`;
}

export function formatDateFriendlyLocalized(dateKey: string, lang: AppLanguage): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return dateKey;
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  try {
    return new Intl.DateTimeFormat(getIntlLocale(lang), {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(dt);
  } catch {
    return dateKey;
  }
}

export function formatDateFullLocalized(dateKey: string, lang: AppLanguage): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return dateKey;
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  try {
    return new Intl.DateTimeFormat(getIntlLocale(lang), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(dt);
  } catch {
    return dateKey;
  }
}

export function formatWeekdayShortLocalized(dateKey: string, lang: AppLanguage): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return dateKey;
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  try {
    return new Intl.DateTimeFormat(getIntlLocale(lang), {
      weekday: 'short',
      timeZone: 'UTC',
    }).format(dt);
  } catch {
    return dateKey;
  }
}

export function formatTime12hLocalized(hhmm: string, lang: AppLanguage): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const paddedMin = String(m).padStart(2, '0');
  const h12 = h % 12 === 0 ? 12 : h % 12;

  if (lang === 'hi') {
    let period = 'सुबह';
    if (h >= 12 && h < 16) period = 'दोपहर';
    else if (h >= 16 && h < 20) period = 'शाम';
    else if (h >= 20 || h < 4) period = 'रात';
    return `${period} ${h12}:${paddedMin}`;
  }

  const period = h >= 12 ? 'PM' : 'AM';
  return `${h12}:${paddedMin} ${period}`;
}

export function formatFirestoreTimestampLocalized(ts: unknown, lang: AppLanguage): string {
  if (!ts) return '';
  let date: Date | null = null;
  if (ts instanceof Date) {
    date = ts;
  } else if (typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function') {
    date = (ts as { toDate: () => Date }).toDate();
  } else if (typeof ts === 'string' || typeof ts === 'number') {
    const parsed = new Date(ts);
    if (!Number.isNaN(parsed.getTime())) date = parsed;
  }
  if (!date) return '';
  try {
    return new Intl.DateTimeFormat(getIntlLocale(lang), {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

export function formatRoleLabelLocalized(role: CircleRole | string, lang: AppLanguage): string {
  if (lang === 'hi') {
    switch (role) {
      case 'primary_caregiver':
        return 'मुख्य देखभालकर्ता';
      case 'caretaker':
        return 'केयरटेकर';
      case 'elder':
        return 'वरिष्ठ सदस्य (मरीज)';
      case 'family_member':
        return 'परिवार के सदस्य';
      default:
        return role;
    }
  }
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

export function formatDoseStateLabel(state: ComputedDoseState, lang: AppLanguage): string {
  if (lang === 'hi') {
    switch (state) {
      case 'taken':
        return 'ली जा चुकी';
      case 'due_now':
        return 'अभी लेनी है';
      case 'upcoming':
        return 'समय निर्धारित';
      case 'unconfirmed':
        return 'पुष्टि बाकी';
      case 'missed':
        return 'छूट गई';
      case 'skipped':
        return 'छोड़ी गई';
    }
  }
  switch (state) {
    case 'taken':
      return 'Taken';
    case 'due_now':
      return 'Due now';
    case 'upcoming':
      return 'Scheduled';
    case 'unconfirmed':
      return 'Unconfirmed';
    case 'missed':
      return 'Missed';
    case 'skipped':
      return 'Skipped';
  }
}

export function formatAppointmentStatusLabel(status: AppointmentStatus, lang: AppLanguage): string {
  if (lang === 'hi') {
    switch (status) {
      case 'upcoming':
        return 'आगामी';
      case 'completed':
        return 'पूर्ण';
      case 'cancelled':
        return 'रद्द';
    }
  }
  switch (status) {
    case 'upcoming':
      return 'Upcoming';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
  }
}

export function formatCategoryLabelLocalized(cat: ActivityCategory | string, lang: AppLanguage): string {
  if (lang === 'hi') {
    switch (cat) {
      case 'medication':
        return 'दवा';
      case 'dose':
        return 'खुराक';
      case 'appointment':
        return 'अपॉइंटमेंट';
      case 'circle':
        return 'केयर सर्कल';
      case 'prescription':
        return 'पर्चा';
      case 'notification':
        return 'सूचना';
      default:
        return cat;
    }
  }
  return cat;
}

export function formatEmailStatusLabel(status: EmailDeliveryStatus, lang: AppLanguage): string {
  if (lang === 'hi') {
    switch (status) {
      case 'not_requested':
        return 'ईमेल नहीं मांगा गया';
      case 'sent':
        return 'भेजा गया';
      case 'smtp_unconfigured':
        return 'ईमेल सेटअप अधूरा';
      case 'failed':
        return 'विफल';
    }
  }
  switch (status) {
    case 'not_requested':
      return 'In-app only';
    case 'sent':
      return 'Sent';
    case 'smtp_unconfigured':
      return 'SMTP unconfigured';
    case 'failed':
      return 'Failed';
  }
}

export function formatFrequencyLabelLocalized(freq: string, lang: AppLanguage): string {
  if (lang !== 'hi') return freq;
  switch (freq) {
    case 'Once daily':
      return 'दिन में एक बार';
    case 'Twice daily':
      return 'दिन में दो बार';
    case 'Three times daily':
      return 'दिन में तीन बार';
    case 'Weekly':
      return 'साप्ताहिक';
    case 'As needed':
      return 'आवश्यकता पड़ने पर';
    default:
      return freq;
  }
}
