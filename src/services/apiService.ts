import { getAuthToken } from '../firebase';
import type {
  AppLanguage,
  MedicationRefillInfo,
  PrescriptionScanResult,
  ReminderRunResult,
  SmtpStatus,
  WhatsAppPreferences,
  WhatsAppStatus,
} from '../types';

async function authedFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${response.status})`);
  }
  return data as T;
}

export async function scanPrescriptionImage(params: {
  imageBase64: string;
  mimeType: string;
}): Promise<{ extracted: PrescriptionScanResult; requiresHumanVerification: boolean }> {
  return authedFetch('/api/ai/scan-prescription', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function askCareAssistant(params: {
  question: string;
  history: Array<{ role: 'user' | 'model'; text: string }>;
  circleContext: Record<string, unknown>;
  responseLanguage?: AppLanguage;
}): Promise<{ answer: string }> {
  return authedFetch('/api/ai/care-assistant', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function fetchNotificationStatus(): Promise<SmtpStatus> {
  return authedFetch('/api/notifications/status', {
    method: 'GET',
  });
}

export async function sendTestEmail(params: {
  recipientEmail: string;
  elderName?: string;
  circleName?: string;
}): Promise<{
  delivered: boolean;
  status: 'sent' | 'smtp_unconfigured' | 'failed';
  details: string;
  messageId?: string;
}> {
  return authedFetch('/api/notifications/test-email', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function sendBackendEmailNotification(params: {
  circleId: string;
  recipients: string[];
  subject: string;
  title: string;
  message: string;
  elderName: string;
  circleName: string;
}): Promise<{
  delivered: boolean;
  status: 'sent' | 'smtp_unconfigured' | 'failed';
  details: string;
  messageId?: string;
  missingEnvVars?: string[];
}> {
  return authedFetch('/api/notifications/send-email', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function syncCircleNotificationSchedule(payload: {
  circleId: string;
  circleName: string;
  elderName: string;
  timezone: string;
  recipients: Array<{
    email: string;
    notifyEmail: boolean;
    notifyUpcomingMed: boolean;
    notifyMissedDose: boolean;
    notifyAppointments: boolean;
  }>;
  medications: Array<{
    id: string;
    name: string;
    dosage: string;
    scheduledTimes: string[];
    startDate: string;
    endDate: string;
    active: boolean;
  }>;
  appointments: Array<{
    id: string;
    doctorName: string;
    clinicName: string;
    appointmentDate: string;
    appointmentTime: string;
    status: string;
  }>;
  takenSlotKeys: string[];
  missedSlotKeys: string[];
}): Promise<{ registered: boolean; smtpConfigured: boolean; missingEnvVars: string[] }> {
  return authedFetch('/api/notifications/sync-schedule', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function runScheduledRemindersNow(circleId: string): Promise<ReminderRunResult> {
  return authedFetch('/api/notifications/run-reminders', {
    method: 'POST',
    body: JSON.stringify({ circleId }),
  });
}

export async function fetchUserPreferences(): Promise<{
  preferredLanguage: AppLanguage | null;
  updatedAt: string | null;
}> {
  return authedFetch('/api/user/preferences', {
    method: 'GET',
  });
}

export async function saveUserPreferences(params: {
  preferredLanguage: AppLanguage;
}): Promise<{ preferredLanguage: AppLanguage; updatedAt: string }> {
  return authedFetch('/api/user/preferences', {
    method: 'PUT',
    body: JSON.stringify(params),
  });
}

export async function fetchWhatsAppStatus(): Promise<WhatsAppStatus> {
  return authedFetch('/api/notifications/whatsapp/status', {
    method: 'GET',
  });
}

export async function fetchWhatsAppPreferences(circleId: string): Promise<WhatsAppPreferences> {
  return authedFetch(`/api/notifications/whatsapp/preferences/${encodeURIComponent(circleId)}`, {
    method: 'GET',
  });
}

export async function saveWhatsAppPreferences(
  circleId: string,
  prefs: Partial<WhatsAppPreferences>
): Promise<WhatsAppPreferences> {
  return authedFetch(`/api/notifications/whatsapp/preferences/${encodeURIComponent(circleId)}`, {
    method: 'PUT',
    body: JSON.stringify(prefs),
  });
}

export async function fetchMedicationRefills(
  circleId: string
): Promise<{ refills: Record<string, MedicationRefillInfo> }> {
  return authedFetch(`/api/care/refills/${encodeURIComponent(circleId)}`, {
    method: 'GET',
  });
}

export async function saveMedicationRefill(
  circleId: string,
  params: {
    medicationId: string;
    availableQuantity: number;
    dosesPerIntake: number;
    alertDaysBefore: number;
  }
): Promise<{ refill: MedicationRefillInfo }> {
  return authedFetch(`/api/care/refills/${encodeURIComponent(circleId)}`, {
    method: 'PUT',
    body: JSON.stringify(params),
  });
}

