import 'dotenv/config';
import express, { type Request, type Response, type NextFunction, type Express } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface FirebaseAppletConfig {
  projectId: string;
  firestoreDatabaseId?: string;
}

function loadFirebaseConfig(): FirebaseAppletConfig {
  const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
  const raw = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(raw) as FirebaseAppletConfig;
}

const firebaseConfig = loadFirebaseConfig();
const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
const FIRESTORE_DATABASE_ID = firebaseConfig.firestoreDatabaseId || '(default)';
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

export type CircleRole = 'primary_caregiver' | 'caretaker' | 'elder' | 'family_member';

const VALID_CIRCLE_ROLES = new Set<CircleRole>([
  'primary_caregiver',
  'caretaker',
  'elder',
  'family_member',
]);
const MANAGER_ROLES = new Set<CircleRole>(['primary_caregiver', 'caretaker']);
const SAFE_ID_REGEX = /^[a-zA-Z0-9_\-]{1,128}$/;
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const ALLOWED_WA_CATEGORIES = new Set<keyof StoredWhatsAppPreferences['categories']>([
  'medicationReminders',
  'appointmentReminders',
  'missedDoseAlerts',
  'familyUpdates',
]);

// Server-controlled safe utility templates (client cannot supply arbitrary prompt text)
const SAFE_WHATSAPP_TEMPLATES: Record<keyof StoredWhatsAppPreferences['categories'], string> = {
  medicationReminders: 'You have a scheduled CareCircle medication reminder. Open CareCircle to review.',
  appointmentReminders: 'You have an upcoming CareCircle appointment reminder. Open CareCircle for details.',
  missedDoseAlerts: 'A CareCircle dose check-in requires caregiver attention. Open CareCircle to review.',
  familyUpdates: 'A new CareCircle family update has been posted. Open CareCircle to view.',
};

export function isSafeIdentifier(value: unknown): value is string {
  return typeof value === 'string' && SAFE_ID_REGEX.test(value) && !FORBIDDEN_KEYS.has(value);
}

export function isValidE164Phone(raw: unknown): boolean {
  if (typeof raw !== 'string') return false;
  const compact = raw.trim().replace(/[\s\-()]/g, '');
  return /^\+[1-9]\d{9,14}$/.test(compact);
}

function normalizePhoneDigits(raw: string): string {
  return raw.replace(/[^\d]/g, '');
}

export interface AuthedUser {
  uid: string;
  email: string;
  name: string;
  emailVerified: boolean;
  idToken: string;
}

interface AuthedRequest extends Request {
  user?: AuthedUser;
}

export interface MembershipLookupResult {
  active: boolean;
  role: CircleRole | null;
  lookupError?: boolean;
}

export interface MedicationLookupResult {
  exists: boolean;
  lookupError?: boolean;
}

export interface ServerDependencies {
  verifyToken?: (token: string) => Promise<AuthedUser>;
  lookupCircleMembership?: (params: {
    uid: string;
    circleId: string;
    idToken: string;
  }) => Promise<MembershipLookupResult>;
  lookupMedicationExists?: (params: {
    circleId: string;
    medicationId: string;
    idToken: string;
  }) => Promise<MedicationLookupResult>;
  runtimeStorePath?: string;
}

async function defaultVerifyToken(token: string): Promise<AuthedUser> {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    audience: FIREBASE_PROJECT_ID,
  });

  const uid = typeof payload.sub === 'string' ? payload.sub : '';
  const email = typeof payload.email === 'string' ? payload.email : '';
  const name = typeof payload.name === 'string' ? payload.name : email || 'CareCircle User';
  const emailVerified = payload.email_verified === true;

  if (!isSafeIdentifier(uid)) {
    throw new Error('Invalid Firebase user UID.');
  }

  return { uid, email, name, emailVerified, idToken: token };
}

async function defaultLookupCircleMembership(params: {
  uid: string;
  circleId: string;
  idToken: string;
}): Promise<MembershipLookupResult> {
  if (!isSafeIdentifier(params.uid) || !isSafeIdentifier(params.circleId) || !params.idToken) {
    return { active: false, role: null };
  }

  const docUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    FIREBASE_PROJECT_ID
  )}/databases/${encodeURIComponent(FIRESTORE_DATABASE_ID)}/documents/careCircles/${encodeURIComponent(
    params.circleId
  )}/members/${encodeURIComponent(params.uid)}`;

  try {
    const response = await fetch(docUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${params.idToken}`,
      },
    });

    if (response.status === 404 || response.status === 403 || response.status === 401) {
      return { active: false, role: null };
    }

    if (!response.ok) {
      return { active: false, role: null, lookupError: true };
    }

    const docJson = (await response.json()) as {
      fields?: {
        userId?: { stringValue?: string };
        circleId?: { stringValue?: string };
        role?: { stringValue?: string };
      };
    };

    const docUid = docJson.fields?.userId?.stringValue;
    const docCircleId = docJson.fields?.circleId?.stringValue;
    const role = docJson.fields?.role?.stringValue as CircleRole | undefined;

    if (
      docUid !== params.uid ||
      docCircleId !== params.circleId ||
      !role ||
      !VALID_CIRCLE_ROLES.has(role)
    ) {
      return { active: false, role: null };
    }

    return { active: true, role };
  } catch (err) {
    console.error('[AuthZ] Firestore membership lookup failed:', err);
    return { active: false, role: null, lookupError: true };
  }
}

async function defaultLookupMedicationExists(params: {
  circleId: string;
  medicationId: string;
  idToken: string;
}): Promise<MedicationLookupResult> {
  if (!isSafeIdentifier(params.circleId) || !isSafeIdentifier(params.medicationId) || !params.idToken) {
    return { exists: false };
  }

  const docUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
    FIREBASE_PROJECT_ID
  )}/databases/${encodeURIComponent(FIRESTORE_DATABASE_ID)}/documents/careCircles/${encodeURIComponent(
    params.circleId
  )}/medications/${encodeURIComponent(params.medicationId)}`;

  try {
    const response = await fetch(docUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${params.idToken}`,
      },
    });

    if (response.status === 404 || response.status === 403 || response.status === 401) {
      return { exists: false };
    }

    if (!response.ok) {
      return { exists: false, lookupError: true };
    }

    const docJson = (await response.json()) as {
      fields?: {
        id?: { stringValue?: string };
        circleId?: { stringValue?: string };
      };
    };

    const exists =
      docJson.fields?.id?.stringValue === params.medicationId &&
      docJson.fields?.circleId?.stringValue === params.circleId;

    return { exists };
  } catch (err) {
    console.error('[AuthZ] Firestore medication lookup failed:', err);
    return { exists: false, lookupError: true };
  }
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface SmtpEnvPresence {
  SMTP_HOST: boolean;
  SMTP_PORT: boolean;
  SMTP_SECURE: boolean;
  SMTP_USER: boolean;
  SMTP_PASS: boolean;
  SMTP_FROM: boolean;
}

interface SanitizedSmtpLog {
  timestamp: string;
  event: string;
  status: string;
  details: string;
}

const recentSmtpLogs: SanitizedSmtpLog[] = [];

function pushSmtpLog(event: string, status: string, details: string) {
  recentSmtpLogs.unshift({
    timestamp: new Date().toISOString(),
    event,
    status,
    details,
  });
  if (recentSmtpLogs.length > 30) {
    recentSmtpLogs.length = 30;
  }
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim() || '';
  const portRaw = process.env.SMTP_PORT?.trim() || '';
  const port = Number(portRaw || '587');
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER?.trim() || '';
  const pass = process.env.SMTP_PASS?.trim() || '';
  const fromRaw = process.env.SMTP_FROM?.trim() || '';
  const from = fromRaw || (user ? `CareCircle Alerts <${user}>` : '');

  const envPresence: SmtpEnvPresence = {
    SMTP_HOST: Boolean(host),
    SMTP_PORT: Boolean(portRaw),
    SMTP_SECURE: Boolean(process.env.SMTP_SECURE?.trim()),
    SMTP_USER: Boolean(user),
    SMTP_PASS: Boolean(pass),
    SMTP_FROM: Boolean(fromRaw),
  };

  const missingEnvVars: string[] = [];
  if (!host) missingEnvVars.push('SMTP_HOST');
  if (!user) missingEnvVars.push('SMTP_USER');
  if (!pass) missingEnvVars.push('SMTP_PASS');

  const configured = missingEnvVars.length === 0;
  return { configured, host, port, secure, user, pass, from, missingEnvVars, envPresence };
}

function sanitizeSmtpError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const smtp = getSmtpConfig();
  let safe = raw;
  if (smtp.pass) safe = safe.split(smtp.pass).join('[REDACTED]');
  if (smtp.user) safe = safe.split(smtp.user).join('[SMTP_USER]');
  if (smtp.host) safe = safe.split(smtp.host).join('[SMTP_HOST]');
  return safe;
}

function createSmtpTransport() {
  const smtp = getSmtpConfig();
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });
}

async function verifySmtpConnection(): Promise<{ verified: boolean; error: string | null }> {
  const smtp = getSmtpConfig();
  if (!smtp.configured) {
    return {
      verified: false,
      error: `Missing required SMTP variables: ${smtp.missingEnvVars.join(', ')}`,
    };
  }
  try {
    const transporter = createSmtpTransport();
    await transporter.verify();
    pushSmtpLog('smtp_verify', 'verified', `SMTP connection & authentication verified (port ${smtp.port}, tls=${smtp.secure}).`);
    return { verified: true, error: null };
  } catch (err) {
    const safeError = sanitizeSmtpError(err);
    console.error('[SMTP] Verification failed:', safeError);
    pushSmtpLog('smtp_verify', 'failed', safeError);
    return { verified: false, error: safeError };
  }
}

async function dispatchSmtpEmail(params: {
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
  acceptedCount?: number;
  rejectedCount?: number;
  missingEnvVars?: string[];
}> {
  const smtp = getSmtpConfig();
  if (!smtp.configured) {
    return {
      delivered: false,
      status: 'smtp_unconfigured',
      details: `SMTP credentials not configured (${smtp.missingEnvVars.join(', ')}).`,
      missingEnvVars: smtp.missingEnvVars,
    };
  }

  try {
    const transporter = createSmtpTransport();

    const htmlBody = `
      <div style="font-family: 'DM Sans', Arial, sans-serif; background-color: #FAF8F5; padding: 32px 16px; color: #10233D;">
        <div style="max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E4DFD5; border-radius: 12px; padding: 28px;">
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #1E6F5C; font-weight: 600;">
            CareCircle · ${escapeHtml(params.circleName)}
          </p>
          <h1 style="margin: 0 0 12px 0; font-size: 20px; color: #10233D;">
            ${escapeHtml(params.title)}
          </h1>
          <p style="margin: 0 0 18px 0; font-size: 15px; line-height: 1.6; color: #334E68;">
            ${escapeHtml(params.message)}
          </p>
          <div style="padding-top: 16px; border-top: 1px solid #E4DFD5; font-size: 13px; color: #5B728A;">
            Care profile: <strong>${escapeHtml(params.elderName)}</strong> · Better care. Together.
          </div>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: smtp.from,
      to: params.recipients.join(', '),
      subject: params.subject,
      text: `CareCircle (${params.circleName} - ${params.elderName})\n\n${params.title}\n${params.message}`,
      html: htmlBody,
    });

    const acceptedCount = Array.isArray(info.accepted) ? info.accepted.length : params.recipients.length;
    const rejectedCount = Array.isArray(info.rejected) ? info.rejected.length : 0;
    const detailMsg = `Email delivered to ${acceptedCount} recipient(s) (ID: ${info.messageId}).`;
    console.log(`[SMTP] ${detailMsg}`);
    pushSmtpLog('send_email', 'sent', detailMsg);

    return {
      delivered: acceptedCount > 0 && rejectedCount === 0,
      status: acceptedCount > 0 ? 'sent' : 'failed',
      details: detailMsg,
      messageId: info.messageId,
      acceptedCount,
      rejectedCount,
    };
  } catch (err) {
    const safeError = sanitizeSmtpError(err);
    console.error('[SMTP] Delivery failed:', safeError);
    pushSmtpLog('send_email', 'failed', safeError);
    return {
      delivered: false,
      status: 'failed',
      details: `SMTP delivery failed: ${safeError}`,
    };
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------
// Ephemeral Server Runtime Store (Non-Durable; /tmp only)
// NOTE: /tmp storage does NOT survive container restarts or scale-out across instances.
// Sensitive features requiring durable consent/opt-out persistence (live WhatsApp dispatch)
// remain disabled until consent records are stored in a durable database.
// ---------------------------------------------------------
const DEFAULT_RUNTIME_STORE_PATH = '/tmp/carecircle-runtime-prefs.json';

interface StoredWhatsAppPreferences {
  enabled: boolean;
  consentGiven: boolean;
  consentTimestamp: string | null;
  phoneNumber: string;
  optedOut: boolean;
  categories: {
    medicationReminders: boolean;
    appointmentReminders: boolean;
    missedDoseAlerts: boolean;
    familyUpdates: boolean;
  };
  updatedAt: string;
}

interface StoredMedicationRefillInfo {
  medicationId: string;
  availableQuantity: number;
  dosesPerIntake: number;
  alertDaysBefore: number;
  updatedAt: string;
  updatedBy: string;
}

interface RuntimeStoreData {
  userPrefs: Record<string, { preferredLanguage: 'en' | 'hi'; updatedAt: string }>;
  whatsappPrefs: Record<string, StoredWhatsAppPreferences>;
  refills: Record<string, Record<string, StoredMedicationRefillInfo>>;
}

function createSafeDict<T>(): Record<string, T> {
  return Object.create(null) as Record<string, T>;
}

function sanitizeRecordMap<T>(raw: unknown): Record<string, T> {
  const out = createSafeDict<T>();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const key of Object.keys(raw)) {
    if (FORBIDDEN_KEYS.has(key)) continue;
    out[key] = (raw as Record<string, T>)[key];
  }
  return out;
}

function sanitizeNestedRefills(raw: unknown): Record<string, Record<string, StoredMedicationRefillInfo>> {
  const out = createSafeDict<Record<string, StoredMedicationRefillInfo>>();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const circleId of Object.keys(raw)) {
    if (!isSafeIdentifier(circleId)) continue;
    const circleMap = (raw as Record<string, unknown>)[circleId];
    if (!circleMap || typeof circleMap !== 'object' || Array.isArray(circleMap)) continue;
    const safeCircleMap = createSafeDict<StoredMedicationRefillInfo>();
    for (const medId of Object.keys(circleMap)) {
      if (!isSafeIdentifier(medId)) continue;
      safeCircleMap[medId] = (circleMap as Record<string, StoredMedicationRefillInfo>)[medId];
    }
    out[circleId] = safeCircleMap;
  }
  return out;
}

function createRuntimeStoreManager(storePath: string) {
  let writeQueue: Promise<void> = Promise.resolve();
  let tmpSeq = 0;

  const readStore = (): RuntimeStoreData => {
    try {
      if (fs.existsSync(storePath)) {
        const parsed = JSON.parse(fs.readFileSync(storePath, 'utf-8')) as Partial<RuntimeStoreData>;
        return {
          userPrefs: sanitizeRecordMap(parsed.userPrefs),
          whatsappPrefs: sanitizeRecordMap(parsed.whatsappPrefs),
          refills: sanitizeNestedRefills(parsed.refills),
        };
      }
    } catch {
      // Fallback to clean store
    }
    return {
      userPrefs: createSafeDict(),
      whatsappPrefs: createSafeDict(),
      refills: createSafeDict(),
    };
  };

  const writeAtomic = (store: RuntimeStoreData): void => {
    const dir = path.dirname(storePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    tmpSeq += 1;
    const tmpPath = `${storePath}.${process.pid}.${tmpSeq}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(store, null, 2), 'utf-8');
    fs.renameSync(tmpPath, storePath);
  };

  const updateStore = <T>(mutator: (store: RuntimeStoreData) => T): Promise<T> => {
    const task = writeQueue.then(() => {
      const current = readStore();
      const result = mutator(current);
      writeAtomic(current);
      return result;
    });
    // Keep queue alive even if a single operation throws
    writeQueue = task.then(
      () => undefined,
      () => undefined
    );
    return task;
  };

  return { readStore, updateStore };
}

function getWhatsAppConfig() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim() || '';
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || '';
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME?.trim() || '';

  const missingRequirements: string[] = [];
  if (!phoneNumberId) missingRequirements.push('WHATSAPP_PHONE_NUMBER_ID');
  if (!accessToken) missingRequirements.push('WHATSAPP_ACCESS_TOKEN');
  if (!templateName) missingRequirements.push('WHATSAPP_TEMPLATE_NAME');

  const configured = missingRequirements.length === 0;
  return {
    configured,
    accessToken,
    phoneNumberId,
    templateName,
    missingRequirements,
    templateNameConfigured: Boolean(templateName),
  };
}

function defaultWhatsAppPrefs(): StoredWhatsAppPreferences {
  return {
    enabled: false,
    consentGiven: false,
    consentTimestamp: null,
    phoneNumber: '',
    optedOut: false,
    categories: {
      medicationReminders: true,
      appointmentReminders: true,
      missedDoseAlerts: false,
      familyUpdates: true,
    },
    updatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------
// In-Memory Scheduled Notification Registry (Backend Timer)
// ---------------------------------------------------------
interface RegisteredSchedule {
  circleId: string;
  circleName: string;
  elderName: string;
  timezone: string;
  ownerUid: string;
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
  missedSlotKeys?: string[];
  updatedAtMs: number;
}

const scheduledCircles = new Map<string, RegisteredSchedule>();
const dispatchedReminderKeys = new Set<string>();

function getLocalDateAndTime(date: Date, timeZone: string): { dateKey: string; hhmm: string } {
  try {
    const dateKey = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);

    const timeParts = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date);

    const hour = timeParts.find((p) => p.type === 'hour')?.value || '00';
    const minute = timeParts.find((p) => p.type === 'minute')?.value || '00';
    return { dateKey, hhmm: `${hour}:${minute}` };
  } catch {
    const iso = date.toISOString();
    return { dateKey: iso.slice(0, 10), hhmm: iso.slice(11, 16) };
  }
}

function getTomorrowDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return dateKey;
  const utc = new Date(Date.UTC(y, m - 1, d + 1, 12, 0, 0));
  return utc.toISOString().slice(0, 10);
}

function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

interface ReminderEvalItem {
  type: 'upcoming_medication' | 'unconfirmed_dose' | 'missed_dose' | 'upcoming_appointment';
  key: string;
  title: string;
  status: 'sent' | 'skipped_already_sent' | 'skipped_no_recipients' | 'smtp_unconfigured' | 'failed';
  details: string;
}

async function evaluateAndDispatchCircleReminders(
  circle: RegisteredSchedule,
  now = new Date()
): Promise<{ evaluated: number; sent: number; skipped: number; results: ReminderEvalItem[] }> {
  const smtp = getSmtpConfig();
  const { dateKey, hhmm } = getLocalDateAndTime(now, circle.timezone);
  const tomorrowKey = getTomorrowDateKey(dateKey);
  const nowMin = hhmmToMinutes(hhmm);

  const results: ReminderEvalItem[] = [];
  let sent = 0;
  let skipped = 0;

  const trySend = async (params: {
    type: ReminderEvalItem['type'];
    reminderKey: string;
    emails: string[];
    subject: string;
    title: string;
    message: string;
  }) => {
    if (dispatchedReminderKeys.has(params.reminderKey)) {
      skipped++;
      results.push({
        type: params.type,
        key: params.reminderKey,
        title: params.title,
        status: 'skipped_already_sent',
        details: 'Already dispatched during this schedule window.',
      });
      return;
    }

    if (params.emails.length === 0) {
      skipped++;
      results.push({
        type: params.type,
        key: params.reminderKey,
        title: params.title,
        status: 'skipped_no_recipients',
        details: 'No opted-in CareCircle recipients for this alert category.',
      });
      return;
    }

    if (!smtp.configured) {
      skipped++;
      results.push({
        type: params.type,
        key: params.reminderKey,
        title: params.title,
        status: 'smtp_unconfigured',
        details: 'SMTP credentials not configured.',
      });
      return;
    }

    const res = await dispatchSmtpEmail({
      recipients: params.emails,
      subject: params.subject,
      title: params.title,
      message: params.message,
      elderName: circle.elderName,
      circleName: circle.circleName,
    });

    if (res.delivered) {
      dispatchedReminderKeys.add(params.reminderKey);
      sent++;
      results.push({
        type: params.type,
        key: params.reminderKey,
        title: params.title,
        status: 'sent',
        details: res.details,
      });
    } else {
      results.push({
        type: params.type,
        key: params.reminderKey,
        title: params.title,
        status: 'failed',
        details: res.details,
      });
    }
  };

  // 1. Medication Reminders (Upcoming & Unconfirmed / Missed)
  for (const med of circle.medications) {
    if (!med.active) continue;
    if (dateKey < med.startDate) continue;
    if (med.endDate && dateKey > med.endDate) continue;

    for (const slot of med.scheduledTimes) {
      const slotKey = `${med.id}_${dateKey}_${slot.replace(':', '')}`;
      if (circle.takenSlotKeys.includes(slotKey)) continue;

      if (circle.missedSlotKeys?.includes(slotKey)) {
        await trySend({
          type: 'missed_dose',
          reminderKey: `missed_${circle.circleId}_${slotKey}`,
          emails: circle.recipients
            .filter((r) => r.notifyEmail && r.notifyMissedDose)
            .map((r) => r.email),
          subject: `CareCircle Alert: Confirmed Missed ${med.name} (${slot})`,
          title: `Confirmed Missed Dose: ${med.name} (${med.dosage})`,
          message: `The ${slot} dose (${circle.timezone}) for ${circle.elderName} was confirmed missed today.`,
        });
        continue;
      }

      const schedMin = hhmmToMinutes(slot);
      const diff = schedMin - nowMin;

      if (diff >= 0 && diff <= 15) {
        await trySend({
          type: 'upcoming_medication',
          reminderKey: `upcoming_${circle.circleId}_${slotKey}`,
          emails: circle.recipients
            .filter((r) => r.notifyEmail && r.notifyUpcomingMed)
            .map((r) => r.email),
          subject: `CareCircle Reminder: ${med.name} at ${slot} for ${circle.elderName}`,
          title: `Upcoming Medication: ${med.name} (${med.dosage})`,
          message: `Scheduled for ${slot} (${circle.timezone}) for ${circle.elderName}. Please verify and mark the dose once administered.`,
        });
      }

      if (nowMin - schedMin >= 20 && nowMin - schedMin <= 60) {
        await trySend({
          type: 'unconfirmed_dose',
          reminderKey: `unconfirmed_${circle.circleId}_${slotKey}`,
          emails: circle.recipients
            .filter((r) => r.notifyEmail && r.notifyMissedDose)
            .map((r) => r.email),
          subject: `CareCircle Attention: Unconfirmed ${med.name} dose (${slot})`,
          title: `Unconfirmed Dose: ${med.name} (${med.dosage})`,
          message: `The ${slot} dose for ${circle.elderName} has not been confirmed yet. It remains marked Unconfirmed until a family member or caretaker checks in.`,
        });
      }
    }
  }

  // 2. Upcoming Appointment Reminders (Today or Tomorrow)
  for (const appt of circle.appointments) {
    if (appt.status !== 'upcoming') continue;
    if (appt.appointmentDate !== dateKey && appt.appointmentDate !== tomorrowKey) continue;

    const whenLabel = appt.appointmentDate === dateKey ? 'Today' : 'Tomorrow';
    await trySend({
      type: 'upcoming_appointment',
      reminderKey: `appt_${circle.circleId}_${appt.id}_${appt.appointmentDate}`,
      emails: circle.recipients
        .filter((r) => r.notifyEmail && r.notifyAppointments)
        .map((r) => r.email),
      subject: `CareCircle Appointment ${whenLabel}: ${appt.doctorName} (${appt.appointmentTime})`,
      title: `Upcoming Appointment ${whenLabel}: ${appt.doctorName}`,
      message: `${circle.elderName} has an appointment with ${appt.doctorName} at ${appt.clinicName} on ${appt.appointmentDate} at ${appt.appointmentTime} (${circle.timezone}).`,
    });
  }

  return {
    evaluated: results.length,
    sent,
    skipped,
    results,
  };
}

async function runScheduledReminderTick() {
  const smtp = getSmtpConfig();
  if (!smtp.configured || scheduledCircles.size === 0) {
    return;
  }

  const now = new Date();
  for (const circle of scheduledCircles.values()) {
    await evaluateAndDispatchCircleReminders(circle, now);
  }
}

export function createCareCircleApp(deps: ServerDependencies = {}): Express {
  const verifyToken = deps.verifyToken ?? defaultVerifyToken;
  const lookupCircleMembership = deps.lookupCircleMembership ?? defaultLookupCircleMembership;
  const lookupMedicationExists = deps.lookupMedicationExists ?? defaultLookupMedicationExists;
  const storeManager = createRuntimeStoreManager(
    deps.runtimeStorePath ?? DEFAULT_RUNTIME_STORE_PATH
  );

  // Sliding-window WhatsApp rate limiter: max 5 requests per 60s per (uid, circleId)
  const waRateLimitBuckets = new Map<string, number[]>();
  const WA_RATE_LIMIT_MAX = 5;
  const WA_RATE_LIMIT_WINDOW_MS = 60_000;

  const checkWhatsAppRateLimit = (uid: string, circleId: string): boolean => {
    const key = `${uid}::${circleId}`;
    const nowMs = Date.now();
    const recent = (waRateLimitBuckets.get(key) || []).filter(
      (ts) => nowMs - ts < WA_RATE_LIMIT_WINDOW_MS
    );
    if (recent.length >= WA_RATE_LIMIT_MAX) {
      waRateLimitBuckets.set(key, recent);
      return false;
    }
    recent.push(nowMs);
    waRateLimitBuckets.set(key, recent);
    return true;
  };

  // Sliding-window test-email rate limiter: max 3 per 300s per uid
  const testEmailRateLimitBuckets = new Map<string, number[]>();
  const TEST_EMAIL_RATE_LIMIT_MAX = 3;
  const TEST_EMAIL_RATE_LIMIT_WINDOW_MS = 300_000;

  const checkTestEmailRateLimit = (uid: string): boolean => {
    const nowMs = Date.now();
    const recent = (testEmailRateLimitBuckets.get(uid) || []).filter(
      (ts) => nowMs - ts < TEST_EMAIL_RATE_LIMIT_WINDOW_MS
    );
    if (recent.length >= TEST_EMAIL_RATE_LIMIT_MAX) {
      testEmailRateLimitBuckets.set(uid, recent);
      return false;
    }
    recent.push(nowMs);
    testEmailRateLimitBuckets.set(uid, recent);
    return true;
  };

  // Sliding-window send-email rate limiter: max 10 per 600s per (uid, circleId)
  const sendEmailRateLimitBuckets = new Map<string, number[]>();
  const SEND_EMAIL_RATE_LIMIT_MAX = 10;
  const SEND_EMAIL_RATE_LIMIT_WINDOW_MS = 600_000;

  const checkSendEmailRateLimit = (uid: string, circleId: string): boolean => {
    const key = `${uid}::${circleId}`;
    const nowMs = Date.now();
    const recent = (sendEmailRateLimitBuckets.get(key) || []).filter(
      (ts) => nowMs - ts < SEND_EMAIL_RATE_LIMIT_WINDOW_MS
    );
    if (recent.length >= SEND_EMAIL_RATE_LIMIT_MAX) {
      sendEmailRateLimitBuckets.set(key, recent);
      return false;
    }
    recent.push(nowMs);
    sendEmailRateLimitBuckets.set(key, recent);
    return true;
  };

  const requireAuth = async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization || '';
      if (!authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing Authorization Bearer token.' });
        return;
      }
      const token = authHeader.slice(7).trim();
      if (!token) {
        res.status(401).json({ error: 'Empty authentication token.' });
        return;
      }
      const user = await verifyToken(token);
      if (!isSafeIdentifier(user.uid)) {
        res.status(401).json({ error: 'Invalid Firebase user token.' });
        return;
      }
      req.user = user;
      next();
    } catch (err) {
      console.error('Auth verification error:', err);
      res.status(401).json({ error: 'Invalid or expired authentication token.' });
    }
  };

  const verifyCircleMembership = async (
    req: AuthedRequest,
    res: Response,
    circleIdRaw: unknown,
    options: { requireVerifiedEmail?: boolean; allowedRoles?: Set<CircleRole> } = {}
  ): Promise<{ uid: string; role: CircleRole; emailVerified: boolean; idToken: string } | null> => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return null;
    }
    if (!isSafeIdentifier(circleIdRaw)) {
      res.status(400).json({ error: 'Invalid circleId parameter.' });
      return null;
    }
    if (options.requireVerifiedEmail && !user.emailVerified) {
      res.status(403).json({
        error: 'Verified email address is required for this CareCircle operation.',
      });
      return null;
    }

    const membership = await lookupCircleMembership({
      uid: user.uid,
      circleId: circleIdRaw,
      idToken: user.idToken,
    });

    if (membership.lookupError) {
      res.status(503).json({
        error: 'Unable to verify CareCircle membership right now. Please try again shortly.',
      });
      return null;
    }

    if (!membership.active || !membership.role) {
      res.status(403).json({
        error: 'Access denied: you are not an active member of this CareCircle.',
      });
      return null;
    }

    if (options.allowedRoles && !options.allowedRoles.has(membership.role)) {
      res.status(403).json({
        error: 'Access denied: your CareCircle role does not allow this action.',
      });
      return null;
    }

    return {
      uid: user.uid,
      role: membership.role,
      emailVerified: user.emailVerified,
      idToken: user.idToken,
    };
  };

  const app = express();
  app.use(express.json({ limit: '12mb' }));

  app.get('/api/health', async (req: Request, res: Response) => {
    const smtp = getSmtpConfig();
    if (req.query.verifySmtp === '1') {
      const check = await verifySmtpConnection();
      res.json({
        ok: true,
        service: 'carecircle-api',
        smtpConfigured: smtp.configured,
        envPresence: smtp.envPresence,
        smtpVerified: check.verified,
        smtpError: check.error,
      });
      return;
    }
    res.json({
      ok: true,
      service: 'carecircle-api',
      smtpConfigured: smtp.configured,
      envPresence: smtp.envPresence,
    });
  });

  // -------------------------------------------------------
  // AI Prescription Scanner (Gemini 4 Hydrogen)
  // -------------------------------------------------------
  app.post('/api/ai/scan-prescription', requireAuth, async (req: AuthedRequest, res: Response) => {
    try {
      const { imageBase64, mimeType } = req.body as {
        imageBase64?: string;
        mimeType?: string;
      };

      if (!imageBase64 || typeof imageBase64 !== 'string') {
        res.status(400).json({ error: 'Missing prescription image data.' });
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const normalizedMime = (mimeType || 'image/jpeg').toLowerCase();
      if (!allowedTypes.includes(normalizedMime)) {
        res.status(400).json({ error: 'Unsupported image format. Please upload JPEG, PNG, or WebP.' });
        return;
      }

      if (imageBase64.length > 10_000_000) {
        res.status(400).json({ error: 'Image is too large. Please upload an image under 7MB.' });
        return;
      }

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: normalizedMime === 'image/jpg' ? 'image/jpeg' : normalizedMime,
                data: imageBase64,
              },
            },
            {
              text: 'Extract every prescription medication entry visible in this image for human verification. Do not guess or invent missing details.',
            },
          ],
        },
        config: {
          systemInstruction:
            'You are a careful clinical prescription transcription assistant. Extract ONLY medication names, dosages, frequencies, and administration instructions clearly visible in the prescription image. NEVER invent, guess, or fabricate missing fields—use empty string "" when a field is illegible or absent, and explain uncertainty in confidenceNotes or warnings. Only suggest 24h HH:mm times when frequency is explicitly stated on the label (e.g. "once daily in the morning" -> ["08:00"], "twice daily" -> ["08:00", "20:00"]); otherwise return [].',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              prescriberName: { type: Type.STRING, description: 'Prescribing doctor name if visible, else empty string.' },
              prescriptionDate: { type: Type.STRING, description: 'Prescription date if visible, else empty string.' },
              warnings: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Any legibility warnings or missing fields that require human review.',
              },
              medications: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: 'Exact medicine name visible, or empty string if illegible.' },
                    dosage: { type: Type.STRING, description: 'Exact dosage/strength visible (e.g., 10 mg), or empty string.' },
                    frequency: { type: Type.STRING, description: 'Frequency visible (e.g., Once daily), or empty string.' },
                    instructions: { type: Type.STRING, description: 'Directions/instructions visible (e.g., Take with food), or empty string.' },
                    suggestedTimes: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'Optional HH:mm 24-hour times if clearly implied by schedule.',
                    },
                    confidenceNotes: { type: Type.STRING, description: 'Clarity/verification note for the human reviewer.' },
                  },
                  required: ['name', 'dosage', 'frequency', 'instructions', 'suggestedTimes', 'confidenceNotes'],
                },
              },
            },
            required: ['prescriberName', 'prescriptionDate', 'warnings', 'medications'],
          },
        },
      });

      const rawText = (response.text || '{}').trim();
      const parsed = JSON.parse(rawText);
      res.json({
        extracted: parsed,
        requiresHumanVerification: true,
      });
    } catch (err) {
      console.error('Prescription scan error:', err);
      const message = err instanceof Error ? err.message : 'Failed to analyze prescription image.';
      res.status(500).json({ error: message });
    }
  });

  // -------------------------------------------------------
  // Smart Care Assistant (Grounded in Real Firestore Records)
  // -------------------------------------------------------
  app.post('/api/ai/care-assistant', requireAuth, async (req: AuthedRequest, res: Response) => {
    try {
      const { question, history, circleContext, responseLanguage } = req.body as {
        question?: string;
        history?: Array<{ role: 'user' | 'model'; text: string }>;
        circleContext?: Record<string, unknown>;
        responseLanguage?: 'en' | 'hi';
      };

      if (!question || typeof question !== 'string' || question.trim().length === 0) {
        res.status(400).json({ error: 'Please enter a question.' });
        return;
      }

      if (question.length > 1500) {
        res.status(400).json({ error: 'Question is too long (max 1500 characters).' });
        return;
      }

      if (!circleContext || typeof circleContext !== 'object') {
        res.status(400).json({ error: 'Missing CareCircle records context.' });
        return;
      }

      const ai = getGeminiClient();
      const safeContextJson = JSON.stringify(circleContext).slice(0, 60_000);

      const recentHistoryText = Array.isArray(history)
        ? history
            .slice(-6)
            .map((h) => `${h.role === 'user' ? 'Care Team Member' : 'CareCircle Assistant'}: ${String(h.text).slice(0, 800)}`)
            .join('\n')
        : '';

      const languageRule =
        responseLanguage === 'hi'
          ? '6. Respond in simple, warm, clear Hindi (हिन्दी in Devanagari script) easy for elderly family members to read, keeping exact medicine names, dosages, dates, and times accurate.'
          : '6. Respond in clear, calm English.';

      const systemInstruction = [
        'You are the CareCircle Smart Care Assistant.',
        'You MUST answer questions STRICTLY and EXCLUSIVELY from the provided JSON healthcare records.',
        'Critical Safety & Integrity Rules:',
        '1. NEVER invent, assume, or fabricate medications, dosages, appointments, test results, or events not present in the provided records.',
        '2. If requested information is absent from the records, clearly say that it is not currently recorded in CareCircle.',
        '3. Always distinguish between "taken", "due_now", "scheduled" (upcoming), "unconfirmed" (time passed without check-in), and "missed" (explicitly confirmed missed). Never treat an unconfirmed dose as definitely missed.',
        '4. NEVER provide independent medical prescribing advice, diagnosis, or dosage changes. Recommend consulting the prescribing clinician for any medical decisions.',
        '5. Write clearly, calmly, and respectfully in plain language suitable for elderly users and family caretakers.',
        languageRule,
      ].join('\n');

      const prompt = [
        'CARE CIRCLE STORED RECORDS (JSON):',
        safeContextJson,
        recentHistoryText ? `\nRECENT CONVERSATION:\n${recentHistoryText}` : '',
        `\nUSER QUESTION:\n${question.trim()}`,
      ]
        .filter(Boolean)
        .join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      res.json({
        answer: response.text || 'I could not generate an answer from the current care records.',
      });
    } catch (err) {
      console.error('Care assistant error:', err);
      const message = err instanceof Error ? err.message : 'Smart Care Assistant encountered an error.';
      res.status(500).json({ error: message });
    }
  });

  // -------------------------------------------------------
  // Notification System & Real Backend SMTP Email Delivery
  // -------------------------------------------------------
  app.get('/api/notifications/status', requireAuth, async (_req: AuthedRequest, res: Response) => {
    const smtp = getSmtpConfig();
    const verification = await verifySmtpConnection();
    res.json({
      smtpConfigured: smtp.configured,
      smtpVerified: verification.verified,
      smtpError: verification.error,
      missingEnvVars: smtp.missingEnvVars,
      envPresence: smtp.envPresence,
      recentLogs: recentSmtpLogs.slice(0, 15),
    });
  });

  app.post('/api/notifications/test-email', requireAuth, async (req: AuthedRequest, res: Response) => {
    if (!req.user?.emailVerified) {
      res.status(403).json({ error: 'Verified email address is required to send test email.' });
      return;
    }

    const { recipientEmail, elderName, circleName } = req.body as {
      recipientEmail?: string;
      elderName?: string;
      circleName?: string;
    };

    const email = (recipientEmail || req.user?.email || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please provide a valid recipient email address.' });
      return;
    }

    if (!checkTestEmailRateLimit(req.user.uid)) {
      res.status(429).json({
        error: 'Too many test email requests. Please wait a few minutes before trying again.',
      });
      return;
    }

    const cleanElderName = typeof elderName === 'string' && elderName.trim()
      ? elderName.trim().slice(0, 120)
      : 'Care Profile';
    const cleanCircleName = typeof circleName === 'string' && circleName.trim()
      ? circleName.trim().slice(0, 120)
      : 'CareCircle';

    const result = await dispatchSmtpEmail({
      recipients: [email],
      subject: `CareCircle Test Email · ${cleanCircleName}`,
      title: 'CareCircle SMTP Email Verification',
      message:
        'This is a live verification email from CareCircle confirming that backend SMTP connectivity, authentication, and email delivery are working properly.',
      elderName: cleanElderName,
      circleName: cleanCircleName,
    });

    res.json(result);
  });

  app.post('/api/notifications/send-email', requireAuth, async (req: AuthedRequest, res: Response) => {
    const { circleId, recipients, subject, title, message, elderName, circleName } = req.body as {
      circleId?: unknown;
      recipients?: unknown;
      subject?: unknown;
      title?: unknown;
      message?: unknown;
      elderName?: unknown;
      circleName?: unknown;
    };

    const member = await verifyCircleMembership(req, res, circleId, {
      requireVerifiedEmail: true,
      allowedRoles: MANAGER_ROLES,
    });
    if (!member) return;

    if (!Array.isArray(recipients) || recipients.length === 0 || recipients.length > 10) {
      res.status(400).json({ error: 'Please provide between 1 and 10 recipient email addresses.' });
      return;
    }

    const validEmails = recipients
      .map((e) => (typeof e === 'string' ? e.trim() : ''))
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

    if (validEmails.length === 0) {
      res.status(400).json({ error: 'No valid email addresses provided.' });
      return;
    }

    const cleanTitle = typeof title === 'string' ? title.trim().slice(0, 140) : '';
    const cleanMessage = typeof message === 'string' ? message.trim().slice(0, 1000) : '';

    if (cleanTitle.length < 2 || cleanMessage.length < 2) {
      res.status(400).json({ error: 'Notification title and message must be at least 2 characters.' });
      return;
    }

    if (!checkSendEmailRateLimit(member.uid, circleId as string)) {
      res.status(429).json({
        error: 'Too many notification emails dispatched. Please wait a few minutes before sending more.',
      });
      return;
    }

    const cleanSubject = typeof subject === 'string' && subject.trim()
      ? subject.trim().slice(0, 200)
      : `CareCircle Alert: ${cleanTitle}`;

    const cleanElderName = typeof elderName === 'string' && elderName.trim()
      ? elderName.trim().slice(0, 120)
      : 'Care Recipient';

    const cleanCircleName = typeof circleName === 'string' && circleName.trim()
      ? circleName.trim().slice(0, 120)
      : 'CareCircle';

    const result = await dispatchSmtpEmail({
      recipients: validEmails,
      subject: cleanSubject,
      title: cleanTitle,
      message: cleanMessage,
      elderName: cleanElderName,
      circleName: cleanCircleName,
    });

    res.json(result);
  });

  app.post('/api/notifications/sync-schedule', requireAuth, async (req: AuthedRequest, res: Response) => {
    const body = req.body as Partial<RegisteredSchedule>;
    const member = await verifyCircleMembership(req, res, body?.circleId, {
      requireVerifiedEmail: true,
      allowedRoles: MANAGER_ROLES,
    });
    if (!member) return;

    if (
      typeof body.circleName !== 'string' ||
      typeof body.elderName !== 'string' ||
      typeof body.timezone !== 'string' ||
      !Array.isArray(body.recipients) ||
      !Array.isArray(body.medications) ||
      !Array.isArray(body.appointments) ||
      !Array.isArray(body.takenSlotKeys)
    ) {
      res.status(400).json({ error: 'Invalid schedule registration payload.' });
      return;
    }

    scheduledCircles.set(body.circleId as string, {
      circleId: body.circleId as string,
      circleName: body.circleName.slice(0, 120),
      elderName: body.elderName.slice(0, 120),
      timezone: body.timezone.slice(0, 80),
      ownerUid: member.uid,
      recipients: body.recipients.slice(0, 50),
      medications: body.medications.slice(0, 100),
      appointments: body.appointments.slice(0, 100),
      takenSlotKeys: body.takenSlotKeys.slice(0, 500),
      missedSlotKeys: Array.isArray(body.missedSlotKeys) ? body.missedSlotKeys.slice(0, 500) : [],
      updatedAtMs: Date.now(),
    });

    const smtp = getSmtpConfig();
    res.json({
      registered: true,
      smtpConfigured: smtp.configured,
      missingEnvVars: smtp.missingEnvVars,
    });
  });

  app.post('/api/notifications/run-reminders', requireAuth, async (req: AuthedRequest, res: Response) => {
    const { circleId } = req.body as { circleId?: string };
    const member = await verifyCircleMembership(req, res, circleId, {
      requireVerifiedEmail: true,
      allowedRoles: MANAGER_ROLES,
    });
    if (!member) return;

    const schedule = scheduledCircles.get(circleId as string);
    if (!schedule) {
      res.status(404).json({ error: 'No synced schedule found for this CareCircle.' });
      return;
    }
    const summary = await evaluateAndDispatchCircleReminders(schedule, new Date());
    res.json(summary);
  });

  // -------------------------------------------------------
  // User Preferences (Ephemeral Runtime Language Cache)
  // -------------------------------------------------------
  app.get('/api/user/preferences', requireAuth, (req: AuthedRequest, res: Response) => {
    const uid = req.user?.uid;
    if (!isSafeIdentifier(uid)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const store = storeManager.readStore();
    const pref = Object.hasOwn(store.userPrefs, uid) ? store.userPrefs[uid] : undefined;
    res.json({
      preferredLanguage: pref?.preferredLanguage || null,
      updatedAt: pref?.updatedAt || null,
    });
  });

  app.put('/api/user/preferences', requireAuth, async (req: AuthedRequest, res: Response) => {
    const uid = req.user?.uid;
    if (!isSafeIdentifier(uid)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { preferredLanguage } = req.body as { preferredLanguage?: unknown };
    if (preferredLanguage !== 'en' && preferredLanguage !== 'hi') {
      res.status(400).json({ error: 'preferredLanguage must be "en" or "hi".' });
      return;
    }

    const updatedAt = new Date().toISOString();
    await storeManager.updateStore((store) => {
      store.userPrefs[uid] = { preferredLanguage, updatedAt };
    });
    res.json({ preferredLanguage, updatedAt });
  });

  // -------------------------------------------------------
  // Official Meta WhatsApp Cloud API Status & Preferences
  // Live dispatch explicitly disabled until durable consent DB is deployed.
  // -------------------------------------------------------
  app.get('/api/notifications/whatsapp/status', requireAuth, (_req: AuthedRequest, res: Response) => {
    const cfg = getWhatsAppConfig();
    res.json({
      configured: cfg.configured,
      dispatchEnabled: false,
      durableConsentStore: false,
      status: 'disabled_ephemeral_storage',
      missingRequirements: cfg.missingRequirements,
      templateNameConfigured: cfg.templateNameConfigured,
      details:
        'WhatsApp dispatch is disabled on the backend until durable consent/opt-out persistence and official Meta WhatsApp Cloud API credentials are configured.',
    });
  });

  app.get(
    '/api/notifications/whatsapp/preferences/:circleId',
    requireAuth,
    async (req: AuthedRequest, res: Response) => {
      const { circleId } = req.params;
      const member = await verifyCircleMembership(req, res, circleId, {
        requireVerifiedEmail: false,
      });
      if (!member) return;

      const store = storeManager.readStore();
      const key = `${member.uid}::${circleId}`;
      const prefs = Object.hasOwn(store.whatsappPrefs, key)
        ? store.whatsappPrefs[key]
        : defaultWhatsAppPrefs();

      const sanitized: StoredWhatsAppPreferences = {
        ...prefs,
        categories: {
          ...prefs.categories,
          missedDoseAlerts: MANAGER_ROLES.has(member.role) ? prefs.categories.missedDoseAlerts : false,
        },
      };
      res.json(sanitized);
    }
  );

  app.put(
    '/api/notifications/whatsapp/preferences/:circleId',
    requireAuth,
    async (req: AuthedRequest, res: Response) => {
      const { circleId } = req.params;
      const member = await verifyCircleMembership(req, res, circleId, {
        requireVerifiedEmail: true,
      });
      if (!member) return;

      const body = req.body as Partial<StoredWhatsAppPreferences>;
      const cleanPhone = typeof body.phoneNumber === 'string' ? body.phoneNumber.trim().slice(0, 24) : '';
      const optedOut = Boolean(body.optedOut);
      const consentRequested = optedOut ? false : Boolean(body.consentGiven);
      const enabledRequested = optedOut ? false : Boolean(body.enabled) && consentRequested;

      if (cleanPhone && !isValidE164Phone(cleanPhone)) {
        res.status(400).json({
          error: 'Please enter a valid E.164 international mobile number (e.g., +91 98765 43210, 10–15 digits).',
        });
        return;
      }

      if ((consentRequested || enabledRequested) && !isValidE164Phone(cleanPhone)) {
        res.status(400).json({
          error: 'A valid E.164 WhatsApp phone number (e.g., +91 98765 43210) is required before giving consent.',
        });
        return;
      }

      const requestedMissedDoseAlerts = Boolean(body.categories?.missedDoseAlerts);
      if (requestedMissedDoseAlerts && !MANAGER_ROLES.has(member.role)) {
        res.status(403).json({
          error: 'Only primary caregivers and caretakers can enable missed-dose alerts.',
        });
        return;
      }

      const key = `${member.uid}::${circleId}`;
      const next = await storeManager.updateStore((store) => {
        const prev = Object.hasOwn(store.whatsappPrefs, key) ? store.whatsappPrefs[key] : undefined;
        const entry: StoredWhatsAppPreferences = {
          enabled: enabledRequested,
          consentGiven: consentRequested,
          consentTimestamp: consentRequested
            ? prev?.consentTimestamp || new Date().toISOString()
            : null,
          phoneNumber: cleanPhone,
          optedOut,
          categories: {
            medicationReminders: body.categories?.medicationReminders ?? true,
            appointmentReminders: body.categories?.appointmentReminders ?? true,
            missedDoseAlerts: MANAGER_ROLES.has(member.role) ? requestedMissedDoseAlerts : false,
            familyUpdates: body.categories?.familyUpdates ?? true,
          },
          updatedAt: new Date().toISOString(),
        };
        store.whatsappPrefs[key] = entry;
        return entry;
      });

      res.json(next);
    }
  );

  app.post('/api/notifications/whatsapp/send', requireAuth, async (req: AuthedRequest, res: Response) => {
    const { circleId, category } = req.body as {
      circleId?: unknown;
      category?: unknown;
    };

    const member = await verifyCircleMembership(req, res, circleId, {
      requireVerifiedEmail: true,
      allowedRoles: MANAGER_ROLES,
    });
    if (!member) return;

    if (!checkWhatsAppRateLimit(member.uid, circleId as string)) {
      res.status(429).json({
        delivered: false,
        status: 'rate_limited',
        details: 'Too many WhatsApp reminder requests. Please wait a minute before trying again.',
      });
      return;
    }

    if (
      typeof category !== 'string' ||
      !ALLOWED_WA_CATEGORIES.has(category as keyof StoredWhatsAppPreferences['categories'])
    ) {
      res.status(400).json({ error: 'Invalid WhatsApp notification category.' });
      return;
    }

    const typedCategory = category as keyof StoredWhatsAppPreferences['categories'];
    const store = storeManager.readStore();
    const key = `${member.uid}::${circleId as string}`;
    const prefs = Object.hasOwn(store.whatsappPrefs, key) ? store.whatsappPrefs[key] : undefined;

    if (!prefs || prefs.optedOut || !prefs.enabled || !prefs.consentGiven) {
      res.status(403).json({
        delivered: false,
        status: 'opted_out',
        details: 'WhatsApp alerts are disabled or user has not given explicit consent.',
      });
      return;
    }

    if (!prefs.categories[typedCategory]) {
      res.status(400).json({
        delivered: false,
        status: 'category_disabled',
        details: 'User has disabled this WhatsApp notification category.',
      });
      return;
    }

    if (!isValidE164Phone(prefs.phoneNumber)) {
      res.status(400).json({ error: 'Valid E.164 WhatsApp phone number is required.' });
      return;
    }

    // Server-controlled template text (kept here to document non-client-controlled contract)
    const _serverTemplateText = SAFE_WHATSAPP_TEMPLATES[typedCategory];
    const _recipientDigits = normalizePhoneDigits(prefs.phoneNumber);
    void _serverTemplateText;
    void _recipientDigits;

    // Live dispatch is explicitly disabled until consent & opt-out records are stored in a durable DB
    res.status(503).json({
      delivered: false,
      status: 'dispatch_disabled_ephemeral_storage',
      details:
        'WhatsApp dispatch is disabled on the backend until durable consent/opt-out storage and official Meta Cloud API credentials are configured.',
    });
  });

  // -------------------------------------------------------
  // Medication Refill Stock Tracking
  // -------------------------------------------------------
  app.get('/api/care/refills/:circleId', requireAuth, async (req: AuthedRequest, res: Response) => {
    const { circleId } = req.params;
    const member = await verifyCircleMembership(req, res, circleId, {
      requireVerifiedEmail: false,
    });
    if (!member) return;

    const store = storeManager.readStore();
    const circleRefills = Object.hasOwn(store.refills, circleId) ? store.refills[circleId] : {};
    res.json({ refills: circleRefills });
  });

  app.put('/api/care/refills/:circleId', requireAuth, async (req: AuthedRequest, res: Response) => {
    const { circleId } = req.params;
    const member = await verifyCircleMembership(req, res, circleId, {
      requireVerifiedEmail: true,
      allowedRoles: MANAGER_ROLES,
    });
    if (!member) return;

    const { medicationId, availableQuantity, dosesPerIntake, alertDaysBefore } = req.body as {
      medicationId?: unknown;
      availableQuantity?: unknown;
      dosesPerIntake?: unknown;
      alertDaysBefore?: unknown;
    };

    if (!isSafeIdentifier(medicationId)) {
      res.status(400).json({ error: 'Valid medicationId is required.' });
      return;
    }

    const medCheck = await lookupMedicationExists({
      circleId,
      medicationId,
      idToken: member.idToken,
    });

    if (medCheck.lookupError) {
      res.status(503).json({ error: 'Unable to verify medication record right now.' });
      return;
    }

    if (!medCheck.exists) {
      res.status(404).json({ error: 'Medication not found in this CareCircle.' });
      return;
    }

    const qty = Number(availableQuantity);
    const perIntake = Number(dosesPerIntake);
    const alertDays = Number(alertDaysBefore);

    if (
      Number.isNaN(qty) ||
      qty < 0 ||
      qty > 5000 ||
      Number.isNaN(perIntake) ||
      perIntake < 0.25 ||
      perIntake > 20 ||
      Number.isNaN(alertDays) ||
      alertDays < 1 ||
      alertDays > 60
    ) {
      res.status(400).json({ error: 'Please enter valid refill stock numbers.' });
      return;
    }

    const entry = await storeManager.updateStore((store) => {
      if (!Object.hasOwn(store.refills, circleId)) {
        store.refills[circleId] = createSafeDict<StoredMedicationRefillInfo>();
      }
      const nextEntry: StoredMedicationRefillInfo = {
        medicationId,
        availableQuantity: Math.round(qty * 100) / 100,
        dosesPerIntake: Math.round(perIntake * 100) / 100,
        alertDaysBefore: Math.round(alertDays),
        updatedAt: new Date().toISOString(),
        updatedBy: member.uid,
      };
      store.refills[circleId][medicationId] = nextEntry;
      return nextEntry;
    });

    res.json({ refill: entry });
  });

  return app;
}

async function startServer() {
  const app = createCareCircleApp();
  const PORT = 3000;

  setInterval(() => {
    void runScheduledReminderTick();
  }, 60 * 1000);

  // -------------------------------------------------------
  // Vite Dev Middleware or Static Production Serving
  // -------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CareCircle server listening on http://localhost:${PORT}`);
    void verifySmtpConnection();
  });
}

const isMainModule =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  Boolean(process.argv[1]) &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

if (isMainModule) {
  void startServer();
}
