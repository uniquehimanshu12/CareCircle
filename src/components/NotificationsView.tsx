import { useEffect, useState, type FormEvent } from 'react';
import {
  Bell,
  Check,
  CheckCircle2,
  Mail,
  MessageCircle,
  RefreshCw,
  Send,
  ShieldAlert,
} from 'lucide-react';
import type {
  Appointment,
  CareCircle,
  CircleMember,
  CircleRole,
  DoseLog,
  Medication,
  MedicationRefillInfo,
  NotificationItem,
  NotificationType,
  ReminderRunResult,
  SmtpStatus,
  WhatsAppPreferences,
  WhatsAppStatus,
} from '../types';
import {
  buildScheduleForDate,
  computeRefillEstimate,
  getAppointmentReminderWindow,
  getLocalDateKey,
  getUpcomingAppointments,
  isValidE164Phone,
} from '../utils/schedule';
import {
  fetchNotificationStatus,
  fetchWhatsAppPreferences,
  fetchWhatsAppStatus,
  runScheduledRemindersNow,
  saveWhatsAppPreferences,
  sendBackendEmailNotification,
  sendTestEmail,
  syncCircleNotificationSchedule,
} from '../services/apiService';
import {
  createNotificationRecord,
  logCircleActivity,
  markNotificationRead,
} from '../services/careCircleService';
import { useLanguage } from '../i18n/LanguageContext';
import {
  formatDateFriendlyLocalized,
  formatEmailStatusLabel,
  formatNumberLocalized,
  formatTime12hLocalized,
} from '../i18n/locales';
import { SpeechControls } from './SpeechControls';

interface NotificationsViewProps {
  circle: CareCircle;
  currentRole: CircleRole;
  currentUserId: string;
  currentUserName: string;
  members: CircleMember[];
  medications: Medication[];
  doseLogs: DoseLog[];
  appointments: Appointment[];
  notifications: NotificationItem[];
  refills: Record<string, MedicationRefillInfo>;
}

interface PendingAlertCandidate {
  targetKey: string;
  type: NotificationType;
  title: string;
  message: string;
}

export function NotificationsView({
  circle,
  currentRole,
  currentUserId,
  currentUserName,
  members,
  medications,
  doseLogs,
  appointments,
  notifications,
  refills,
}: NotificationsViewProps) {
  const { lang, t } = useLanguage();
  const canManage = currentRole === 'primary_caregiver' || currentRole === 'caretaker';
  const currentMember = members.find((m) => m.userId === currentUserId);
  const [smtpStatus, setSmtpStatus] = useState<SmtpStatus | null>(null);
  const [checkingSmtp, setCheckingSmtp] = useState(false);

  const [testEmailRecipient, setTestEmailRecipient] = useState(currentMember?.email || '');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<string>('');

  const [runningScheduleCheck, setRunningScheduleCheck] = useState(false);
  const [reminderRunResult, setReminderRunResult] = useState<ReminderRunResult | null>(null);

  const [browserPerm, setBrowserPerm] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [sendingKey, setSendingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  // Official Meta WhatsApp Cloud API state
  const [waStatus, setWaStatus] = useState<WhatsAppStatus | null>(null);
  const [waPrefs, setWaPrefs] = useState<WhatsAppPreferences>({
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
  });
  const [savingWa, setSavingWa] = useState(false);
  const [waFeedback, setWaFeedback] = useState('');
  const [waError, setWaError] = useState('');

  const loadSmtpStatus = async () => {
    setCheckingSmtp(true);
    try {
      const s = await fetchNotificationStatus();
      setSmtpStatus(s);
    } catch {
      setSmtpStatus(null);
    } finally {
      setCheckingSmtp(false);
    }
  };

  useEffect(() => {
    void loadSmtpStatus();
  }, []);

  useEffect(() => {
    void fetchWhatsAppStatus()
      .then(setWaStatus)
      .catch(() => setWaStatus(null));
    void fetchWhatsAppPreferences(circle.id)
      .then(setWaPrefs)
      .catch(() => {});
  }, [circle.id]);

  useEffect(() => {
    if (!testEmailRecipient && currentMember?.email) {
      setTestEmailRecipient(currentMember.email);
    }
  }, [currentMember?.email, testEmailRecipient]);

  // Keep backend scheduled reminder engine synced with active circle data (managers only)
  useEffect(() => {
    if (!canManage) return;

    const takenSlotKeys = doseLogs
      .filter((l) => l.status === 'taken' || l.status === 'skipped')
      .map((l) => l.id);
    const missedSlotKeys = doseLogs
      .filter((l) => l.status === 'missed')
      .map((l) => l.id);

    void syncCircleNotificationSchedule({
      circleId: circle.id,
      circleName: circle.name,
      elderName: circle.elderName,
      timezone: circle.timezone,
      recipients: members.map((m) => ({
        email: m.email,
        notifyEmail: m.notifyEmail,
        notifyUpcomingMed: m.notifyUpcomingMed,
        notifyMissedDose: m.notifyMissedDose,
        notifyAppointments: m.notifyAppointments,
      })),
      medications: medications.map((m) => ({
        id: m.id,
        name: m.name,
        dosage: m.dosage,
        scheduledTimes: m.scheduledTimes,
        startDate: m.startDate,
        endDate: m.endDate,
        active: m.active,
      })),
      appointments: appointments.map((a) => ({
        id: a.id,
        doctorName: a.doctorName,
        clinicName: a.clinicName,
        appointmentDate: a.appointmentDate,
        appointmentTime: a.appointmentTime,
        status: a.status,
      })),
      takenSlotKeys,
      missedSlotKeys,
    }).catch(() => {});
  }, [canManage, circle, members, medications, appointments, doseLogs]);

  const now = new Date();
  const todayKey = getLocalDateKey(now, circle.timezone);
  const todaySlots = buildScheduleForDate({
    medications,
    doseLogs,
    dateKey: todayKey,
    timeZone: circle.timezone,
    now,
  });

  const upcomingAppts = getUpcomingAppointments(appointments, circle.timezone, now);

  // Build real live alert candidates
  const candidates: PendingAlertCandidate[] = [];
  for (const slot of todaySlots) {
    const timeFormatted = formatTime12hLocalized(slot.scheduledTime, lang);
    if (slot.state === 'due_now') {
      candidates.push({
        targetKey: `upcoming_${slot.slotKey}`,
        type: 'upcoming_medication',
        title:
          lang === 'hi'
            ? `दवाई का समय: ${slot.medication.name} (${slot.medication.dosage})`
            : `Upcoming Dose: ${slot.medication.name} (${slot.medication.dosage})`,
        message:
          lang === 'hi'
            ? `${circle.elderName} के लिए ${timeFormatted} (${circle.timezone}) की खुराक लेनी है।`
            : `Due at ${timeFormatted} (${circle.timezone}) for ${circle.elderName}.`,
      });
    } else if (slot.state === 'unconfirmed') {
      candidates.push({
        targetKey: `unconfirmed_${slot.slotKey}`,
        type: 'unconfirmed_dose',
        title:
          lang === 'hi'
            ? `पुष्टि बाकी खुराक: ${slot.medication.name} (${slot.medication.dosage})`
            : `Unconfirmed Dose: ${slot.medication.name} (${slot.medication.dosage})`,
        message:
          lang === 'hi'
            ? `आज ${timeFormatted} का समय बीत चुका है। ${circle.elderName} या केयरटेकर से पुष्टि बाकी है।`
            : `Scheduled at ${timeFormatted} today. Awaiting check-in from ${circle.elderName} or a caretaker.`,
      });
    } else if (slot.state === 'missed') {
      candidates.push({
        targetKey: `missed_${slot.slotKey}`,
        type: 'missed_dose',
        title:
          lang === 'hi'
            ? `छूटी हुई पक्की खुराक: ${slot.medication.name}`
            : `Confirmed Missed Dose: ${slot.medication.name}`,
        message:
          lang === 'hi'
            ? `${formatDateFriendlyLocalized(slot.dateKey, lang)} को ${timeFormatted} की खुराक (${slot.medication.dosage}) छूटी हुई दर्ज हुई।`
            : `The ${timeFormatted} dose (${slot.medication.dosage}) on ${formatDateFriendlyLocalized(slot.dateKey, lang)} was confirmed missed.`,
      });
    }
  }

  for (const appt of upcomingAppts) {
    const win = getAppointmentReminderWindow(appt, circle.timezone, now);
    if (win === 'today' || win === 'tomorrow') {
      const whenLabel = win === 'today' ? t.dashboard.todayBadge : t.dashboard.tomorrowBadge;
      candidates.push({
        targetKey: `appt_${appt.id}_${appt.appointmentDate}`,
        type: 'upcoming_appointment',
        title:
          lang === 'hi'
            ? `डॉक्टर विज़िट (${whenLabel}): ${appt.doctorName}`
            : `Appointment ${whenLabel}: ${appt.doctorName}`,
        message: `${appt.clinicName} · ${formatDateFriendlyLocalized(appt.appointmentDate, lang)} · ${formatTime12hLocalized(appt.appointmentTime, lang)}`,
      });
    }
  }

  // Add refill reminder alert candidates
  for (const med of medications) {
    const estimate = computeRefillEstimate({
      medication: med,
      refillInfo: refills[med.id],
      timeZone: circle.timezone,
      now,
    });
    if (
      estimate?.status === 'estimated' &&
      estimate.isLow &&
      estimate.daysRemaining !== null &&
      estimate.estimatedRunOutDateKey
    ) {
      candidates.push({
        targetKey: `refill_${med.id}_${todayKey}`,
        type: 'circle_update',
        title: `${t.notifications.refillAlertTitle} ${med.name} (${med.dosage})`,
        message: `${t.notifications.refillAlertMessage} (~${formatNumberLocalized(
          estimate.daysRemaining,
          lang
        )} ${t.medications.refillDaysRemaining}, ${formatDateFriendlyLocalized(
          estimate.estimatedRunOutDateKey,
          lang
        )})`,
      });
    }
  }

  const getEligibleRecipients = (type: NotificationType): string[] => {
    return members
      .filter((m) => {
        if (!m.notifyEmail || !m.email) return false;
        if (type === 'upcoming_medication') return m.notifyUpcomingMed;
        if (type === 'unconfirmed_dose' || type === 'missed_dose') return m.notifyMissedDose;
        if (type === 'upcoming_appointment') return m.notifyAppointments;
        return true;
      })
      .map((m) => m.email);
  };

  const handleRequestBrowserPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const perm = await Notification.requestPermission();
    setBrowserPerm(perm);
    if (perm === 'granted') {
      new Notification(t.notifications.browserEnabledTitle, {
        body: `${t.notifications.browserEnabledBody} (${circle.elderName})`,
      });
    }
  };

  const handleSendTestEmail = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setTestEmailResult('');
    setSendingTestEmail(true);
    try {
      const res = await sendTestEmail({
        recipientEmail: testEmailRecipient.trim(),
        elderName: circle.elderName,
        circleName: circle.name,
      });
      setTestEmailResult(res.details);
      await loadSmtpStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.notifications.errTestEmail);
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleRunRemindersNow = async () => {
    setError('');
    setReminderRunResult(null);
    setRunningScheduleCheck(true);
    try {
      const result = await runScheduledRemindersNow(circle.id);
      setReminderRunResult(result);
      await loadSmtpStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.notifications.errRunCheck);
    } finally {
      setRunningScheduleCheck(false);
    }
  };

  const handleDispatchNotification = async (
    candidate: PendingAlertCandidate,
    sendEmail: boolean
  ) => {
    setError('');
    setFeedback('');
    setSendingKey(candidate.targetKey);

    try {
      const recipients = sendEmail ? getEligibleRecipients(candidate.type) : [];
      let emailStatus: NotificationItem['emailStatus'] = 'not_requested';
      let emailDetails = 'Logged as in-app notification.';

      if (sendEmail) {
        if (recipients.length === 0) {
          emailStatus = 'not_requested';
          emailDetails = 'No CareCircle members have email alerts enabled for this alert type.';
        } else {
          const emailRes = await sendBackendEmailNotification({
            circleId: circle.id,
            recipients,
            subject: `CareCircle Alert: ${candidate.title}`,
            title: candidate.title,
            message: candidate.message,
            elderName: circle.elderName,
            circleName: circle.name,
          });
          emailStatus = emailRes.status;
          emailDetails = emailRes.details;
        }
      }

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(candidate.title, { body: candidate.message });
      }

      await createNotificationRecord({
        circleId: circle.id,
        type: candidate.type,
        title: candidate.title,
        message: candidate.message,
        targetKey: candidate.targetKey,
        emailStatus,
        emailRecipients: recipients,
        emailDetails,
        actorId: currentUserId,
      });

      await logCircleActivity({
        circleId: circle.id,
        actorId: currentUserId,
        actorName: currentUserName,
        actorRole: currentRole,
        category: 'notification',
        summary: `Triggered alert "${candidate.title}" (${emailDetails}).`,
      });

      setFeedback(emailDetails);
      await loadSmtpStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.notifications.errDispatch);
    } finally {
      setSendingKey(null);
    }
  };

  const handleSaveWhatsAppPrefs = async (e: FormEvent) => {
    e.preventDefault();
    setWaError('');
    setWaFeedback('');

    const trimmedPhone = waPrefs.phoneNumber.trim();
    if ((waPrefs.consentGiven || waPrefs.enabled || trimmedPhone.length > 0) && !isValidE164Phone(trimmedPhone)) {
      setWaError(t.notifications.whatsappErrPhoneRequired);
      return;
    }

    setSavingWa(true);
    try {
      const saved = await saveWhatsAppPreferences(circle.id, {
        ...waPrefs,
        phoneNumber: trimmedPhone,
        optedOut: false,
        categories: {
          ...waPrefs.categories,
          missedDoseAlerts: canManage ? waPrefs.categories.missedDoseAlerts : false,
        },
      });
      setWaPrefs(saved);
      setWaFeedback(t.notifications.whatsappPrefsSaved);
    } catch (err) {
      setWaError(err instanceof Error ? err.message : t.notifications.errWhatsapp);
    } finally {
      setSavingWa(false);
    }
  };

  const handleOptOutWhatsApp = async () => {
    setWaError('');
    setWaFeedback('');
    setSavingWa(true);
    try {
      const saved = await saveWhatsAppPreferences(circle.id, {
        ...waPrefs,
        enabled: false,
        consentGiven: false,
        optedOut: true,
      });
      setWaPrefs(saved);
      setWaFeedback(t.notifications.whatsappOptedOutMsg);
    } catch (err) {
      setWaError(err instanceof Error ? err.message : t.notifications.errWhatsapp);
    } finally {
      setSavingWa(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#10233D]">{t.notifications.title}</h1>
          <p className="mt-1 text-base text-[#334E68]">{t.notifications.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {typeof Notification !== 'undefined' && (
            <button
              type="button"
              onClick={() => void handleRequestBrowserPermission()}
              className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#E4DFD5] bg-white hover:bg-[#FAF8F5] text-sm font-semibold text-[#10233D] cursor-pointer"
            >
              <Bell className="h-4 w-4 text-[#1E6F5C]" aria-hidden="true" />
              <span>
                {browserPerm === 'granted'
                  ? t.notifications.browserEnabled
                  : t.notifications.enableBrowser}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Truthful SMTP Email Backend Verification & Test Email */}
      <section className="rounded-xl border border-[#E4DFD5] bg-white p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4DFD5] pb-3">
          <div className="flex items-center gap-2">
            {smtpStatus?.smtpVerified ? (
              <CheckCircle2 className="h-5 w-5 text-[#1E6F5C]" aria-hidden="true" />
            ) : (
              <Mail className="h-5 w-5 text-[#334E68]" aria-hidden="true" />
            )}
            <h2 className="font-display text-lg font-bold text-[#10233D]">
              {t.notifications.emailPipelineTitle}
            </h2>
          </div>

          <button
            type="button"
            disabled={checkingSmtp}
            onClick={() => void loadSmtpStatus()}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] hover:bg-[#F3EFE8] text-xs font-semibold text-[#10233D] cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${checkingSmtp ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>{t.notifications.reverifySmtp}</span>
          </button>
        </div>

        {smtpStatus ? (
          <div className="space-y-4">
            <div
              className={`rounded-lg border px-4 py-3 text-sm flex items-start gap-2.5 ${
                smtpStatus.smtpVerified
                  ? 'border-[#CBE5DB] bg-[#EBF5F1] text-[#1E6F5C]'
                  : 'border-[#F6D3BA] bg-[#FDF2EA] text-[#B54708]'
              }`}
            >
              {smtpStatus.smtpVerified ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              ) : (
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              )}
              <div>
                <div className="font-semibold">
                  {smtpStatus.smtpVerified
                    ? t.notifications.smtpVerifiedMsg
                    : smtpStatus.smtpConfigured
                      ? `${t.notifications.smtpFailedMsg} ${smtpStatus.smtpError}`
                      : t.notifications.smtpUnconfiguredMsg}
                </div>
                <div className="mt-1 text-xs font-mono-code">
                  {t.notifications.envDetectedLabel} HOST: {smtpStatus.envPresence.SMTP_HOST ? t.common.yes : t.common.no} · PORT:{' '}
                  {smtpStatus.envPresence.SMTP_PORT ? t.common.yes : t.notifications.envDefaultPort} · USER:{' '}
                  {smtpStatus.envPresence.SMTP_USER ? t.common.yes : t.common.no} · PASS:{' '}
                  {smtpStatus.envPresence.SMTP_PASS ? t.common.yes : t.common.no} · FROM:{' '}
                  {smtpStatus.envPresence.SMTP_FROM ? t.common.yes : t.notifications.envDefaultFrom}
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSendTestEmail}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
            >
              <input
                type="email"
                required
                aria-label={t.notifications.testEmailPlaceholder}
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
                placeholder={t.notifications.testEmailPlaceholder}
                className="flex-1 min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2 text-sm text-[#10233D]"
              />
              <button
                type="submit"
                disabled={sendingTestEmail || !smtpStatus.smtpVerified}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-[#1E6F5C] hover:bg-[#175849] text-white text-sm font-semibold disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                <span>{sendingTestEmail ? t.notifications.sendingTest : t.notifications.sendTestEmail}</span>
              </button>
              <button
                type="button"
                disabled={runningScheduleCheck || !smtpStatus.smtpVerified}
                onClick={() => void handleRunRemindersNow()}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[#E4DFD5] bg-white hover:bg-[#FAF8F5] text-sm font-semibold text-[#10233D] disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>
                  {runningScheduleCheck
                    ? t.notifications.checkingReminders
                    : t.notifications.runReminderCheck}
                </span>
              </button>
            </form>

            {testEmailResult && (
              <div className="rounded-lg border border-[#CBE5DB] bg-[#EBF5F1] px-4 py-3 text-sm text-[#1E6F5C]">
                {testEmailResult}
              </div>
            )}

            {reminderRunResult && (
              <div className="rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] p-4 text-sm space-y-1.5">
                <div className="font-semibold text-[#10233D]">
                  {t.notifications.reminderEvalSummary}{' '}
                  {formatNumberLocalized(reminderRunResult.evaluated, lang)} ·{' '}
                  {formatNumberLocalized(reminderRunResult.sent, lang)} ·{' '}
                  {formatNumberLocalized(reminderRunResult.skipped, lang)}
                </div>
                {reminderRunResult.results.map((r) => (
                  <div key={r.key} className="text-xs text-[#334E68]">
                    [{r.type}] {r.title} — <strong>{r.status}</strong> ({r.details})
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-[#5B728A]">{t.notifications.checkingSmtp}</p>
        )}
      </section>

      {/* Official Meta WhatsApp Cloud API Assessment & Preferences */}
      <section className="rounded-xl border border-[#E4DFD5] bg-white p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4DFD5] pb-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[#1E6F5C]" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold text-[#10233D]">
              {t.notifications.whatsappTitle}
            </h2>
          </div>

          <span
            className={`px-3 py-1 rounded-md border text-xs font-bold ${
              waStatus?.dispatchEnabled
                ? 'border-[#CBE5DB] bg-[#EBF5F1] text-[#1E6F5C]'
                : 'border-[#F6D3BA] bg-[#FDF2EA] text-[#B54708]'
            }`}
          >
            {waStatus?.dispatchEnabled
              ? t.notifications.whatsappBadgeConfigured
              : t.notifications.whatsappBadgeNotConfigured}
          </span>
        </div>

        {(!waStatus?.configured || waStatus?.dispatchEnabled === false) && (
          <div className="rounded-lg border border-[#F6D3BA] bg-[#FDF2EA] p-4 space-y-2.5 text-sm text-[#334E68]">
            <p className="font-semibold text-[#B54708]">
              {waStatus?.dispatchEnabled === false && waStatus?.configured
                ? t.notifications.whatsappDisabledNotice
                : t.notifications.whatsappNotConfiguredDesc}
            </p>
            {waStatus?.dispatchEnabled === false && !waStatus?.configured && (
              <p className="text-xs sm:text-sm text-[#334E68]">{t.notifications.whatsappDisabledNotice}</p>
            )}
            {!waStatus?.configured && (
              <div>
                <div className="font-semibold text-[#10233D]">
                  {t.notifications.whatsappConfigChecklistTitle}
                </div>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-xs sm:text-sm">
                  {t.notifications.whatsappRequirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <p className="text-xs sm:text-sm text-[#5B728A] bg-[#FAF8F5] border border-[#E4DFD5] rounded-lg px-3.5 py-2.5">
          {t.notifications.whatsappPrivacyNote}
        </p>

        {waPrefs.optedOut && (
          <div className="rounded-lg border border-[#FECDCA] bg-[#FEF3F2] px-4 py-3 text-sm font-medium text-[#B42318]">
            {t.notifications.whatsappOptedOutBanner}
          </div>
        )}

        {waFeedback && (
          <div className="rounded-lg border border-[#CBE5DB] bg-[#EBF5F1] px-4 py-3 text-sm font-medium text-[#1E6F5C]">
            {waFeedback}
          </div>
        )}

        {waError && (
          <div
            role="alert"
            className="rounded-lg border border-[#FECDCA] bg-[#FEF3F2] px-4 py-3 text-sm text-[#B42318]"
          >
            {waError}
          </div>
        )}

        <form onSubmit={handleSaveWhatsAppPrefs} className="space-y-4">
          <div>
            <label htmlFor="wa-phone-input" className="block text-sm font-semibold text-[#10233D] mb-1.5">
              {t.notifications.whatsappPhoneLabel}
            </label>
            <input
              id="wa-phone-input"
              type="tel"
              value={waPrefs.phoneNumber}
              onChange={(e) => setWaPrefs((p) => ({ ...p, phoneNumber: e.target.value }))}
              placeholder={t.notifications.whatsappPhonePlaceholder}
              className="w-full max-w-md min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2 text-base font-mono-code text-[#10233D]"
            />
          </div>

          <div className="space-y-2.5">
            <label className="flex items-start gap-2.5 text-sm text-[#10233D] cursor-pointer">
              <input
                type="checkbox"
                checked={waPrefs.consentGiven}
                onChange={(e) =>
                  setWaPrefs((p) => ({
                    ...p,
                    consentGiven: e.target.checked,
                    optedOut: e.target.checked ? false : p.optedOut,
                    enabled: e.target.checked ? p.enabled : false,
                  }))
                }
                className="h-5 w-5 mt-0.5 accent-[#1E6F5C]"
              />
              <span>{t.notifications.whatsappConsentLabel}</span>
            </label>

            <label className="flex items-center gap-2.5 text-sm font-semibold text-[#10233D] cursor-pointer">
              <input
                type="checkbox"
                disabled={!waPrefs.consentGiven}
                checked={waPrefs.enabled && waPrefs.consentGiven && !waPrefs.optedOut}
                onChange={(e) =>
                  setWaPrefs((p) => ({ ...p, enabled: e.target.checked, optedOut: false }))
                }
                className="h-5 w-5 accent-[#1E6F5C] disabled:opacity-50"
              />
              <span>{t.notifications.whatsappEnableToggle}</span>
            </label>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#E4DFD5]">
            <div className="text-sm font-semibold text-[#10233D]">
              {t.notifications.whatsappCategoriesTitle}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-[#334E68]">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={waPrefs.categories.medicationReminders}
                  onChange={(e) =>
                    setWaPrefs((p) => ({
                      ...p,
                      categories: { ...p.categories, medicationReminders: e.target.checked },
                    }))
                  }
                  className="h-4 w-4 accent-[#1E6F5C]"
                />
                <span>{t.notifications.whatsappCatMed}</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={waPrefs.categories.appointmentReminders}
                  onChange={(e) =>
                    setWaPrefs((p) => ({
                      ...p,
                      categories: { ...p.categories, appointmentReminders: e.target.checked },
                    }))
                  }
                  className="h-4 w-4 accent-[#1E6F5C]"
                />
                <span>{t.notifications.whatsappCatAppt}</span>
              </label>

              {canManage && (
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={waPrefs.categories.missedDoseAlerts}
                    onChange={(e) =>
                      setWaPrefs((p) => ({
                        ...p,
                        categories: { ...p.categories, missedDoseAlerts: e.target.checked },
                      }))
                    }
                    className="h-4 w-4 accent-[#1E6F5C]"
                  />
                  <span>{t.notifications.whatsappCatMissed}</span>
                </label>
              )}

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={waPrefs.categories.familyUpdates}
                  onChange={(e) =>
                    setWaPrefs((p) => ({
                      ...p,
                      categories: { ...p.categories, familyUpdates: e.target.checked },
                    }))
                  }
                  className="h-4 w-4 accent-[#1E6F5C]"
                />
                <span>{t.notifications.whatsappCatFamily}</span>
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={savingWa}
              className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#1E6F5C] hover:bg-[#175849] text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
            >
              {savingWa ? t.common.saving : t.notifications.whatsappSavePrefs}
            </button>

            <button
              type="button"
              disabled={savingWa}
              onClick={() => void handleOptOutWhatsApp()}
              className="min-h-[44px] px-4 py-2.5 rounded-lg border border-[#FECDCA] bg-[#FEF3F2] hover:bg-[#FDE6E4] text-sm font-semibold text-[#B42318] disabled:opacity-50 cursor-pointer"
            >
              {t.notifications.whatsappOptOutBtn}
            </button>
          </div>
        </form>
      </section>

      {feedback && (
        <div className="rounded-lg border border-[#E4DFD5] bg-white px-4 py-3 text-sm text-[#10233D]">
          {feedback}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-[#FECDCA] bg-[#FEF3F2] px-4 py-3 text-sm text-[#B42318]"
        >
          {error}
        </div>
      )}

      {/* Active Alert Candidates */}
      <section className="rounded-xl border border-[#E4DFD5] bg-white p-6 space-y-4">
        <div className="border-b border-[#E4DFD5] pb-3">
          <h2 className="font-display text-lg font-bold text-[#10233D]">
            {t.notifications.activeAlertsTitle} ({formatNumberLocalized(candidates.length, lang)})
          </h2>
          <p className="text-sm text-[#5B728A]">
            {t.notifications.activeAlertsSub} ({circle.elderName} · {circle.timezone})
          </p>
        </div>

        {candidates.length === 0 ? (
          <p className="py-6 text-sm text-[#5B728A]">{t.notifications.noActiveAlerts}</p>
        ) : (
          <div className="divide-y divide-[#E4DFD5]">
            {candidates.map((c) => {
              const recipients = getEligibleRecipients(c.type);
              const isSending = sendingKey === c.targetKey;
              return (
                <div
                  key={c.targetKey}
                  className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="font-semibold text-[#10233D]">{c.title}</div>
                    <p className="text-sm text-[#334E68]">{c.message}</p>
                    <p className="text-xs text-[#5B728A]">
                      {t.notifications.permittedRecipients} (
                      {formatNumberLocalized(recipients.length, lang)}):{' '}
                      {recipients.length > 0 ? recipients.join(', ') : t.notifications.noneOptedIn}
                    </p>
                    <SpeechControls
                      text={`${c.title}. ${c.message}`}
                      controlKey={`alert_${c.targetKey}`}
                      label={t.notifications.listenAlert}
                      compact
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isSending}
                      onClick={() => void handleDispatchNotification(c, false)}
                      className="min-h-[42px] px-3.5 py-2 rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] hover:bg-[#F3EFE8] text-sm font-medium text-[#10233D] cursor-pointer"
                    >
                      {t.notifications.saveInAppAlert}
                    </button>
                    {canManage && (
                      <button
                        type="button"
                        disabled={isSending || recipients.length === 0}
                        onClick={() => void handleDispatchNotification(c, true)}
                        className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1E6F5C] hover:bg-[#175849] text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
                      >
                        <Send className="h-4 w-4" aria-hidden="true" />
                        <span>
                          {isSending ? t.notifications.sending : t.notifications.sendFamilyEmail}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Persisted Notification History */}
      <section className="rounded-xl border border-[#E4DFD5] bg-white p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-[#10233D] border-b border-[#E4DFD5] pb-3">
          {t.notifications.historyTitle} ({formatNumberLocalized(notifications.length, lang)})
        </h2>

        {notifications.length === 0 ? (
          <p className="py-6 text-sm text-[#5B728A]">{t.notifications.noHistory}</p>
        ) : (
          <div className="divide-y divide-[#E4DFD5]">
            {notifications.map((n) => {
              const isRead = n.readBy.includes(currentUserId);
              return (
                <div
                  key={n.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-semibold text-[#10233D]">{n.title}</span>
                      {!isRead && (
                        <span className="text-xs font-semibold text-[#B54708]">
                          {t.notifications.unreadBadge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#334E68]">{n.message}</p>
                    <p className="text-xs text-[#5B728A]">
                      {t.notifications.emailStatusPrefix}{' '}
                      <strong>{formatEmailStatusLabel(n.emailStatus, lang)}</strong> ·{' '}
                      {n.emailDetails}
                    </p>
                  </div>

                  {!isRead && (
                    <button
                      type="button"
                      onClick={() =>
                        void markNotificationRead({
                          circleId: circle.id,
                          notif: n,
                          userId: currentUserId,
                        })
                      }
                      className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4DFD5] text-xs font-semibold text-[#10233D] hover:bg-[#FAF8F5] shrink-0 cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{t.notifications.markRead}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
