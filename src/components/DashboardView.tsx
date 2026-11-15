import { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Calendar,
  Check,
  ClipboardList,
  Clock,
  PhoneCall,
  Plus,
  Printer,
  Stethoscope,
  Users,
  X,
} from 'lucide-react';
import type {
  ActivityEvent,
  Appointment,
  CareCircle,
  CircleMember,
  CircleRole,
  DoseLog,
  DoseStatus,
  Medication,
  MedicationRefillInfo,
} from '../types';
import {
  buildScheduleForDate,
  computeRefillEstimate,
  computeWeeklyAdherence,
  getAppointmentReminderWindow,
  getLocalDateKey,
  getLocalTimeHHmm,
  getUpcomingAppointments,
} from '../utils/schedule';
import { extractHandoverNotes, recordDoseStatus } from '../services/careCircleService';
import { useLanguage } from '../i18n/LanguageContext';
import {
  formatCategoryLabelLocalized,
  formatDateFriendlyLocalized,
  formatDoseStateLabel,
  formatFirestoreTimestampLocalized,
  formatNumberLocalized,
  formatPercentLocalized,
  formatRoleLabelLocalized,
  formatTime12hLocalized,
} from '../i18n/locales';
import { AdherenceChart } from './AdherenceChart';
import { StatusIndicator } from './StatusIndicator';
import { SpeechControls } from './SpeechControls';

interface DashboardViewProps {
  circle: CareCircle;
  currentRole: CircleRole;
  currentUserId: string;
  currentUserName: string;
  medications: Medication[];
  doseLogs: DoseLog[];
  appointments: Appointment[];
  activities: ActivityEvent[];
  members: CircleMember[];
  refills: Record<string, MedicationRefillInfo>;
  onOpenSummary: () => void;
  onNavigate: (
    tab: 'medications' | 'appointments' | 'circle' | 'scanner' | 'assistant' | 'notifications' | 'help'
  ) => void;
}

export function DashboardView({
  circle,
  currentRole,
  currentUserId,
  currentUserName,
  medications,
  doseLogs,
  appointments,
  activities,
  members,
  refills,
  onOpenSummary,
  onNavigate,
}: DashboardViewProps) {
  const { lang, t } = useLanguage();
  const [busySlot, setBusySlot] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const now = new Date();
  const todayKey = getLocalDateKey(now, circle.timezone);
  const currentHHmm = getLocalTimeHHmm(now, circle.timezone);
  const todaySlots = buildScheduleForDate({
    medications,
    doseLogs,
    dateKey: todayKey,
    timeZone: circle.timezone,
    now,
  });

  const weekly = computeWeeklyAdherence({
    medications,
    doseLogs,
    timeZone: circle.timezone,
    now,
  });

  const upcomingAppointments = getUpcomingAppointments(appointments, circle.timezone, now);
  const nextAppt = upcomingAppointments[0] || null;

  const takenToday = todaySlots.filter((s) => s.state === 'taken').length;
  const unconfirmedToday = todaySlots.filter((s) => s.state === 'unconfirmed').length;
  const canConfirmMissed = currentRole === 'primary_caregiver' || currentRole === 'caretaker';
  const canManage = currentRole === 'primary_caregiver' || currentRole === 'caretaker';

  const lowRefills = medications
    .map((med) => ({
      med,
      estimate: computeRefillEstimate({
        medication: med,
        refillInfo: refills[med.id],
        timeZone: circle.timezone,
        now,
      }),
    }))
    .filter(
      (
        item
      ): item is {
        med: Medication;
        estimate: NonNullable<typeof item.estimate> & {
          daysRemaining: number;
          estimatedRunOutDateKey: string;
        };
      } =>
        Boolean(
          item.estimate &&
            item.estimate.status === 'estimated' &&
            item.estimate.isLow &&
            item.estimate.daysRemaining !== null &&
            item.estimate.estimatedRunOutDateKey
        )
    );

  const handoverNotes = extractHandoverNotes(activities).slice(0, 3);

  const hourNum = Number(currentHHmm.slice(0, 2));
  const greetingText =
    hourNum < 12
      ? t.dashboard.greetingMorning
      : hourNum < 17
        ? t.dashboard.greetingAfternoon
        : t.dashboard.greetingEvening;

  const todaySpeechText =
    todaySlots.length > 0
      ? `${t.dashboard.todaySpeechPrefix} ${todaySlots
          .map(
            (s) =>
              `${formatTime12hLocalized(s.scheduledTime, lang)}, ${s.medication.name} ${s.medication.dosage}, ${formatDoseStateLabel(s.state, lang)}`
          )
          .join('. ')}`
      : '';

  const sanitizedTel = circle.emergencyContactPhone.replace(/[^\d+]/g, '');

  const handleMarkDose = async (slot: (typeof todaySlots)[number], status: DoseStatus) => {
    setActionError('');
    setBusySlot(slot.slotKey);
    try {
      await recordDoseStatus({
        circleId: circle.id,
        medication: slot.medication,
        dateKey: slot.dateKey,
        scheduledTime: slot.scheduledTime,
        status,
        actorId: currentUserId,
        actorName: currentUserName,
        actorRole: currentRole,
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t.dashboard.errUpdateDose);
    } finally {
      setBusySlot(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <section className="rounded-xl border border-[#E4DFD5] bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <p className="text-sm font-medium text-[#5B728A]">
              {circle.name} · {formatDateFriendlyLocalized(todayKey, lang)} · {t.dashboard.localTime}{' '}
              <span className="font-mono-code tabular-nums">
                {formatTime12hLocalized(currentHHmm, lang)}
              </span>{' '}
              ({circle.timezone})
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#10233D]">
              {greetingText}, {currentUserName}
            </h1>
            <p className="text-base text-[#334E68]">
              {t.dashboard.caringFor} <strong>{circle.elderName}</strong> (
              {formatNumberLocalized(circle.elderAge, lang)} {t.dashboard.yearsOld},{' '}
              {circle.elderRelationship}) · {t.dashboard.yourRole}:{' '}
              {formatRoleLabelLocalized(currentRole, lang)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {canManage && (
              <button
                type="button"
                onClick={() => onNavigate('medications')}
                className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1E6F5C] hover:bg-[#175849] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>{t.dashboard.addMedication}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('assistant')}
              className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] hover:bg-[#F3EFE8] text-[#10233D] text-sm font-semibold transition-colors cursor-pointer"
            >
              <span>{t.dashboard.askAssistant}</span>
            </button>
            {canManage && (
              <button
                type="button"
                onClick={onOpenSummary}
                className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#E4DFD5] bg-white hover:bg-[#FAF8F5] text-[#10233D] text-sm font-semibold transition-colors cursor-pointer"
              >
                <Printer className="h-4 w-4 text-[#1E6F5C]" aria-hidden="true" />
                <span>{t.dashboard.printSummary}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('help')}
              className="min-h-[44px] inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-[#E4DFD5] bg-white hover:bg-[#FAF8F5] text-[#334E68] text-sm font-semibold transition-colors cursor-pointer"
            >
              <BookOpen className="h-4 w-4 text-[#1E6F5C]" aria-hidden="true" />
              <span>{t.dashboard.helpGuideBtn}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Low Refill Warning Banner */}
      {lowRefills.length > 0 && (
        <section
          role="region"
          aria-label={t.dashboard.refillWarningTitle}
          className="rounded-xl border border-[#F6D3BA] bg-[#FDF2EA] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-[#B54708] shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <h2 className="text-base font-bold text-[#B54708]">{t.dashboard.refillWarningTitle}</h2>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-[#334E68]">
                {lowRefills.map(({ med, estimate }) => (
                  <span key={med.id}>
                    <strong>{med.name}</strong>:{' '}
                    <span className="font-mono-code font-semibold text-[#B54708]">
                      {formatNumberLocalized(estimate.daysRemaining, lang)} {t.dashboard.refillDaysLeft}
                    </span>{' '}
                    ({formatDateFriendlyLocalized(estimate.estimatedRunOutDateKey, lang)})
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('medications')}
            className="min-h-[42px] px-4 py-2 rounded-lg border border-[#F6D3BA] bg-white hover:bg-[#FAF8F5] text-sm font-semibold text-[#B54708] shrink-0 cursor-pointer"
          >
            {t.dashboard.manageAllMeds}
          </button>
        </section>
      )}

      {/* 4-Column Summary KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#E4DFD5] bg-white p-5">
          <div className="text-sm font-medium text-[#5B728A]">{t.dashboard.kpiTakenTitle}</div>
          <div className="mt-2 font-mono-code text-3xl font-semibold text-[#10233D] tabular-nums">
            {formatNumberLocalized(takenToday, lang)} / {formatNumberLocalized(todaySlots.length, lang)}
          </div>
          <div className="mt-1 text-sm text-[#1E6F5C] font-medium">
            {todaySlots.length === 0
              ? t.dashboard.kpiNoDosesToday
              : takenToday === todaySlots.length
                ? t.dashboard.kpiAllTaken
                : `${formatNumberLocalized(todaySlots.length - takenToday, lang)} ${t.dashboard.kpiRemainingToday}`}
          </div>
        </div>

        <div className="rounded-xl border border-[#E4DFD5] bg-white p-5">
          <div className="text-sm font-medium text-[#5B728A]">{t.dashboard.kpiUnconfirmedTitle}</div>
          <div className="mt-2 font-mono-code text-3xl font-semibold text-[#10233D] tabular-nums">
            {formatNumberLocalized(unconfirmedToday, lang)}
          </div>
          <div className="mt-1 text-sm text-[#B54708] font-medium">
            {unconfirmedToday > 0 ? t.dashboard.kpiAwaitingConfirm : t.dashboard.kpiNoUnconfirmed}
          </div>
        </div>

        <div className="rounded-xl border border-[#E4DFD5] bg-white p-5">
          <div className="text-sm font-medium text-[#5B728A]">{t.dashboard.kpiAdherenceTitle}</div>
          <div className="mt-2 font-mono-code text-3xl font-semibold text-[#10233D] tabular-nums">
            {weekly.adherenceRatePct !== null
              ? formatPercentLocalized(weekly.adherenceRatePct, lang)
              : '—'}
          </div>
          <div className="mt-1 text-sm text-[#5B728A]">
            {formatNumberLocalized(weekly.takenCount, lang)} {t.dashboard.kpiTakenLabel} ·{' '}
            {formatNumberLocalized(weekly.unconfirmedCount, lang)} {t.dashboard.kpiUnconfirmedLabel}
          </div>
        </div>

        <div className="rounded-xl border border-[#E4DFD5] bg-white p-5">
          <div className="text-sm font-medium text-[#5B728A]">{t.dashboard.kpiNextApptTitle}</div>
          <div className="mt-2 text-lg font-semibold text-[#10233D] truncate">
            {nextAppt ? nextAppt.doctorName : t.dashboard.kpiNoneScheduled}
          </div>
          <div className="mt-1 text-sm text-[#5B728A] font-mono-code tabular-nums">
            {nextAppt
              ? `${formatDateFriendlyLocalized(nextAppt.appointmentDate, lang)} · ${formatTime12hLocalized(nextAppt.appointmentTime, lang)}`
              : t.dashboard.kpiAddInAppts}
          </div>
        </div>
      </section>

      {actionError && (
        <div
          role="alert"
          className="rounded-lg border border-[#FECDCA] bg-[#FEF3F2] px-4 py-3 text-sm text-[#B42318]"
        >
          {actionError}
        </div>
      )}

      {/* Today's Medication Schedule */}
      <section className="rounded-xl border border-[#E4DFD5] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E4DFD5] pb-4">
          <div className="space-y-1 max-w-2xl">
            <h2 className="font-display text-xl font-bold text-[#10233D]">
              {t.dashboard.todayScheduleTitle}
            </h2>
            <p className="text-sm text-[#5B728A]">{t.dashboard.todayScheduleSubtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {todaySpeechText && (
              <SpeechControls
                text={todaySpeechText}
                controlKey="dashboard_today"
                label={t.dashboard.listenTodaySummary}
                compact
              />
            )}
            <button
              type="button"
              onClick={() => onNavigate('medications')}
              className="min-h-[42px] px-3.5 py-2 rounded-lg border border-[#E4DFD5] text-sm font-medium text-[#334E68] hover:bg-[#FAF8F5] cursor-pointer"
            >
              {t.dashboard.manageAllMeds}
            </button>
          </div>
        </div>

        {todaySlots.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <Clock className="h-9 w-9 mx-auto text-[#5B728A]" aria-hidden="true" />
            <p className="text-base font-medium text-[#10233D]">{t.dashboard.emptyScheduleTitle}</p>
            <p className="text-sm text-[#5B728A] max-w-md mx-auto">{t.dashboard.emptyScheduleDesc}</p>
            {canManage && (
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('medications')}
                  className="min-h-[44px] px-4 py-2 rounded-lg bg-[#1E6F5C] text-white text-sm font-semibold hover:bg-[#175849] cursor-pointer"
                >
                  {t.dashboard.addFirstMed}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('scanner')}
                  className="min-h-[44px] px-4 py-2 rounded-lg border border-[#E4DFD5] bg-white text-sm font-semibold text-[#10233D] hover:bg-[#FAF8F5] cursor-pointer"
                >
                  {t.dashboard.scanPrescription}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#E4DFD5]">
            {todaySlots.map((slot) => {
              const isBusy = busySlot === slot.slotKey;
              return (
                <div
                  key={slot.slotKey}
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="font-mono-code text-base font-semibold text-[#10233D] tabular-nums w-28 shrink-0 pt-0.5">
                      {formatTime12hLocalized(slot.scheduledTime, lang)}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-base font-semibold text-[#10233D]">
                          {slot.medication.name}
                        </span>
                        <span className="text-sm text-[#5B728A] font-mono-code">
                          {slot.medication.dosage}
                        </span>
                        <StatusIndicator state={slot.state} compact />
                      </div>
                      {slot.medication.instructions && (
                        <p className="text-sm text-[#334E68]">{slot.medication.instructions}</p>
                      )}
                      {slot.log && (
                        <p className="text-xs text-[#5B728A]">
                          {t.dashboard.updatedBy} {slot.log.recordedByName}
                          {slot.log.notes ? ` · ${t.dashboard.notePrefix}: ${slot.log.notes}` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {slot.state !== 'taken' && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleMarkDose(slot, 'taken')}
                        className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1E6F5C] hover:bg-[#175849] text-white text-sm font-semibold transition-colors disabled:opacity-60 cursor-pointer"
                      >
                        <Check className="h-4 w-4" aria-hidden="true" />
                        <span>{t.dashboard.markTaken}</span>
                      </button>
                    )}

                    {slot.state !== 'unconfirmed' && slot.state !== 'upcoming' && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleMarkDose(slot, 'unconfirmed')}
                        className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#F6D3BA] bg-[#FDF2EA] hover:bg-[#FBE7D8] text-[#B54708] text-sm font-medium transition-colors disabled:opacity-60 cursor-pointer"
                      >
                        <AlertCircle className="h-4 w-4" aria-hidden="true" />
                        <span>{t.dashboard.markUnconfirmed}</span>
                      </button>
                    )}

                    {canConfirmMissed && slot.state !== 'missed' && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleMarkDose(slot, 'missed')}
                        className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E4DFD5] bg-white hover:bg-[#FEF3F2] hover:text-[#B42318] text-[#334E68] text-sm font-medium transition-colors disabled:opacity-60 cursor-pointer"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                        <span>{t.dashboard.confirmMissed}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Emergency Contact & Latest Handover Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section className="lg:col-span-5 rounded-xl border border-[#E4DFD5] bg-white p-6 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 border-b border-[#E4DFD5] pb-3">
              <div className="flex items-center gap-2">
                <PhoneCall className="h-5 w-5 text-[#B42318]" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-[#10233D]">
                  {t.dashboard.emergencyCardTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('circle')}
                className="text-sm font-semibold text-[#1E6F5C] hover:underline cursor-pointer"
              >
                {t.dashboard.editContact}
              </button>
            </div>

            {circle.emergencyContactName || circle.emergencyContactPhone ? (
              <div className="pt-2 space-y-1">
                <div className="text-lg font-bold text-[#10233D]">
                  {circle.emergencyContactName || t.dashboard.emergencyCardTitle}
                </div>
                <div className="text-xl font-mono-code font-bold text-[#10233D] tabular-nums">
                  {circle.emergencyContactPhone || '—'}
                </div>
              </div>
            ) : (
              <p className="pt-2 text-sm text-[#5B728A]">{t.dashboard.noEmergencyContact}</p>
            )}
          </div>

          {sanitizedTel && (
            <a
              href={`tel:${sanitizedTel}`}
              className="min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#B42318] hover:bg-[#911B12] text-white text-sm font-semibold transition-colors"
            >
              <PhoneCall className="h-4 w-4" aria-hidden="true" />
              <span>
                {t.dashboard.callNow}: {circle.emergencyContactPhone}
              </span>
            </a>
          )}
        </section>

        <section className="lg:col-span-7 rounded-xl border border-[#E4DFD5] bg-white p-6 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 border-b border-[#E4DFD5] pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-[#1E6F5C]" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-[#10233D]">{t.dashboard.handoverTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('circle')}
                className="text-sm font-semibold text-[#1E6F5C] hover:underline cursor-pointer"
              >
                {t.dashboard.viewAllHandovers}
              </button>
            </div>

            {handoverNotes.length === 0 ? (
              <p className="py-3 text-sm text-[#5B728A]">{t.dashboard.noHandoverNotes}</p>
            ) : (
              <div className="divide-y divide-[#E4DFD5]">
                {handoverNotes.map((h) => (
                  <div key={h.id} className="py-2.5 space-y-1">
                    <p className="text-sm sm:text-base text-[#10233D]">{h.note}</p>
                    <p className="text-xs text-[#5B728A]">
                      {h.actorName} · {formatRoleLabelLocalized(h.actorRole, lang)}
                      {h.createdAt ? ` · ${formatFirestoreTimestampLocalized(h.createdAt, lang)}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Adherence Chart & Upcoming Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7">
          <AdherenceChart
            days={weekly.days}
            adherenceRatePct={weekly.adherenceRatePct}
            takenCount={weekly.takenCount}
            unconfirmedCount={weekly.unconfirmedCount}
            missedCount={weekly.missedCount}
          />
        </div>

        <div className="lg:col-span-5 rounded-xl border border-[#E4DFD5] bg-white p-6">
          <div className="flex items-center justify-between gap-3 border-b border-[#E4DFD5] pb-4">
            <h3 className="text-lg font-semibold text-[#10233D]">
              {t.dashboard.upcomingApptsTitle}
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('appointments')}
              className="text-sm font-semibold text-[#1E6F5C] hover:underline shrink-0 cursor-pointer"
            >
              {t.dashboard.viewAll}
            </button>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Stethoscope className="h-8 w-8 mx-auto text-[#5B728A]" aria-hidden="true" />
              <p className="text-sm text-[#334E68]">{t.dashboard.noUpcomingAppts}</p>
              <button
                type="button"
                onClick={() => onNavigate('appointments')}
                className="min-h-[42px] mt-2 px-4 py-2 rounded-lg border border-[#E4DFD5] text-sm font-semibold text-[#10233D] hover:bg-[#FAF8F5] cursor-pointer"
              >
                {t.dashboard.scheduleApptBtn}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#E4DFD5]">
              {upcomingAppointments.slice(0, 4).map((appt) => {
                const win = getAppointmentReminderWindow(appt, circle.timezone, now);
                return (
                  <div key={appt.id} className="py-4 space-y-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold text-base text-[#10233D]">
                        {appt.doctorName}
                      </span>
                      {(win === 'today' || win === 'tomorrow') && (
                        <span className="text-xs font-semibold text-[#B54708]">
                          {win === 'today' ? t.dashboard.todayBadge : t.dashboard.tomorrowBadge}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-[#334E68]">
                      {appt.clinicName}
                      {appt.specialty ? ` · ${appt.specialty}` : ''}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#5B728A] font-mono-code tabular-nums">
                      <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {formatDateFriendlyLocalized(appt.appointmentDate, lang)} ·{' '}
                        {formatTime12hLocalized(appt.appointmentTime, lang)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity & Family Care Updates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-7 rounded-xl border border-[#E4DFD5] bg-white p-6">
          <div className="flex items-center justify-between gap-3 border-b border-[#E4DFD5] pb-4">
            <h3 className="text-lg font-semibold text-[#10233D]">{t.dashboard.recentActivityTitle}</h3>
            <span className="text-xs text-[#5B728A]">{t.dashboard.recentActivitySub}</span>
          </div>

          {activities.length === 0 ? (
            <p className="py-6 text-sm text-[#5B728A]">{t.dashboard.emptyActivity}</p>
          ) : (
            <div className="divide-y divide-[#E4DFD5]">
              {activities.slice(0, 8).map((act) => (
                <div key={act.id} className="py-3.5 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-[#10233D]">{act.summary}</p>
                    <p className="text-xs text-[#5B728A]">
                      {act.actorName} · {formatRoleLabelLocalized(act.actorRole, lang)} ·{' '}
                      {formatCategoryLabelLocalized(act.category, lang)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="lg:col-span-5 rounded-xl border border-[#E4DFD5] bg-white p-6">
          <div className="flex items-center justify-between gap-3 border-b border-[#E4DFD5] pb-4">
            <h3 className="text-lg font-semibold text-[#10233D]">{t.dashboard.careTeamTitle}</h3>
            <button
              type="button"
              onClick={() => onNavigate('circle')}
              className="text-sm font-semibold text-[#1E6F5C] hover:underline shrink-0 cursor-pointer"
            >
              {t.dashboard.manageCircle}
            </button>
          </div>

          <div className="divide-y divide-[#E4DFD5]">
            {members.map((m) => (
              <div key={m.userId} className="py-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#10233D] truncate">
                    {m.displayName}
                  </div>
                  <div className="text-xs text-[#5B728A] truncate">
                    {formatRoleLabelLocalized(m.role, lang)} ·{' '}
                    {m.notifyEmail ? t.dashboard.emailAlertsOn : t.dashboard.emailAlertsOff}
                  </div>
                </div>
                <Users className="h-4 w-4 text-[#5B728A] shrink-0" aria-hidden="true" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
