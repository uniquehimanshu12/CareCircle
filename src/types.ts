export type CircleRole = 'primary_caregiver' | 'caretaker' | 'elder' | 'family_member';

export type DoseStatus = 'taken' | 'unconfirmed' | 'missed' | 'skipped';

export type ComputedDoseState = DoseStatus | 'due_now' | 'upcoming';

export type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled';

export type ActivityCategory =
  | 'medication'
  | 'dose'
  | 'appointment'
  | 'circle'
  | 'prescription'
  | 'notification';

export type NotificationType =
  | 'upcoming_medication'
  | 'unconfirmed_dose'
  | 'missed_dose'
  | 'upcoming_appointment'
  | 'circle_update';

export type EmailDeliveryStatus = 'not_requested' | 'sent' | 'smtp_unconfigured' | 'failed';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  preferredLargeText: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserMembership {
  circleId: string;
  circleName: string;
  elderName: string;
  role: CircleRole;
  joinedAt?: unknown;
  updatedAt?: unknown;
}

export interface CareCircle {
  id: string;
  name: string;
  elderName: string;
  elderAge: number;
  elderRelationship: string;
  timezone: string;
  primaryConditionNotes: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  ownerId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CircleMember {
  userId: string;
  circleId: string;
  displayName: string;
  email: string;
  role: CircleRole;
  notifyEmail: boolean;
  notifyUpcomingMed: boolean;
  notifyMissedDose: boolean;
  notifyAppointments: boolean;
  inviteCode: string;
  joinedAt?: unknown;
  updatedAt?: unknown;
}

export interface InviteCode {
  code: string;
  circleId: string;
  circleName: string;
  elderName: string;
  role: CircleRole;
  createdBy: string;
  active: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Medication {
  id: string;
  circleId: string;
  name: string;
  nameKey: string;
  dosage: string;
  frequency: string;
  scheduledTimes: string[];
  instructions: string;
  startDate: string;
  endDate: string;
  active: boolean;
  source: 'manual' | 'prescription_scan';
  verifiedBy: string;
  createdBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface DoseLog {
  id: string;
  circleId: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  dateKey: string;
  scheduledTime: string;
  status: DoseStatus;
  recordedBy: string;
  recordedByName: string;
  notes: string;
  takenAt: unknown;
  auditEventId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Appointment {
  id: string;
  circleId: string;
  doctorName: string;
  specialty: string;
  clinicName: string;
  appointmentDate: string;
  appointmentTime: string;
  notes: string;
  status: AppointmentStatus;
  createdBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ActivityEvent {
  id: string;
  circleId: string;
  actorId: string;
  actorName: string;
  actorRole: CircleRole;
  category: ActivityCategory;
  summary: string;
  doseLogId?: string;
  previousStatus?: DoseStatus;
  newStatus?: DoseStatus;
  correctionReason?: string;
  createdAt?: unknown;
}

export interface NotificationItem {
  id: string;
  circleId: string;
  type: NotificationType;
  title: string;
  message: string;
  targetKey: string;
  emailStatus: EmailDeliveryStatus;
  emailRecipients: string[];
  emailDetails: string;
  readBy: string[];
  createdBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ScheduledDoseSlot {
  slotKey: string;
  medication: Medication;
  dateKey: string;
  scheduledTime: string;
  state: ComputedDoseState;
  log?: DoseLog;
}

export interface ExtractedPrescriptionMed {
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  suggestedTimes: string[];
  confidenceNotes: string;
}

export interface PrescriptionScanResult {
  prescriberName: string;
  prescriptionDate: string;
  warnings: string[];
  medications: ExtractedPrescriptionMed[];
}

export interface SmtpEnvPresence {
  SMTP_HOST: boolean;
  SMTP_PORT: boolean;
  SMTP_SECURE: boolean;
  SMTP_USER: boolean;
  SMTP_PASS: boolean;
  SMTP_FROM: boolean;
}

export interface SanitizedSmtpLog {
  timestamp: string;
  event: string;
  status: string;
  details: string;
}

export interface SmtpStatus {
  smtpConfigured: boolean;
  smtpVerified: boolean;
  smtpError: string | null;
  missingEnvVars: string[];
  envPresence: SmtpEnvPresence;
  recentLogs?: SanitizedSmtpLog[];
}

export interface ReminderRunResult {
  evaluated: number;
  sent: number;
  skipped: number;
  results: Array<{
    type: 'upcoming_medication' | 'unconfirmed_dose' | 'missed_dose' | 'upcoming_appointment';
    key: string;
    title: string;
    status: 'sent' | 'skipped_already_sent' | 'skipped_no_recipients' | 'smtp_unconfigured' | 'failed';
    details: string;
  }>;
}

export type AppLanguage = 'en' | 'hi';

export interface WhatsAppStatus {
  configured: boolean;
  dispatchEnabled?: boolean;
  durableConsentStore?: boolean;
  status: 'configured' | 'not_configured' | 'disabled_ephemeral_storage';
  missingRequirements: string[];
  templateNameConfigured: boolean;
  details: string;
}

export interface WhatsAppPreferences {
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
  updatedAt?: string;
}

export interface MedicationRefillInfo {
  medicationId: string;
  availableQuantity: number;
  dosesPerIntake: number;
  alertDaysBefore: number;
  updatedAt: string;
  updatedBy: string;
}
