import { Printer, X } from 'lucide-react';
import type {
  ActivityEvent,
  Appointment,
  CareCircle,
  CircleRole,
  DoseLog,
  Medication,
} from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import {
  formatDateFriendlyLocalized,
  formatDateFullLocalized,
  formatFirestoreTimestampLocalized,
  formatFrequencyLabelLocalized,
  formatNumberLocalized,
  formatPercentLocalized,
  formatTime12hLocalized,
} from '../i18n/locales';
import {
  computeWeeklyAdherence,
  getLocalDateKey,
  getUpcomingAppointments,
} from '../utils/schedule';
import { extractHandoverNotes } from '../services/careCircleService';

interface CareSummaryModalProps {
  open: boolean;
  onClose: () => void;
  circle: CareCircle;
  currentRole: CircleRole;
  medications: Medication[];
  doseLogs: DoseLog[];
  appointments: Appointment[];
  activities: ActivityEvent[];
}

export function CareSummaryModal({
  open,
  onClose,
  circle,
  currentRole,
  medications,
  doseLogs,
  appointments,
  activities,
}: CareSummaryModalProps) {
  const { lang, t } = useLanguage();

  if (!open) return null;

  const canManage = currentRole === 'primary_caregiver' || currentRole === 'caretaker';
  const now = new Date();
  const todayKey = getLocalDateKey(now, circle.timezone);
  const activeMeds = medications.filter((m) => m.active);
  const upcomingAppts = getUpcomingAppointments(appointments, circle.timezone, now);
  const weekly = computeWeeklyAdherence({
    medications,
    doseLogs,
    timeZone: circle.timezone,
    now,
  });
  const handovers = extractHandoverNotes(activities).slice(0, 5);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#10233D]/50 flex items-start justify-center overflow-y-auto p-4 sm:p-8 care-summary-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="care-summary-title"
    >
      <div className="w-full max-w-3xl rounded-2xl border border-[#E4DFD5] bg-white shadow-xl care-summary-print-root">
        {/* Top Action Bar (hidden when printing) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-[#E4DFD5] bg-[#FAF8F5] rounded-t-2xl">
          <div className="font-display text-lg font-bold text-[#10233D]">{t.summary.title}</div>
          <div className="flex items-center gap-2">
            {canManage && (
              <button
                type="button"
                onClick={() => window.print()}
                className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1E6F5C] hover:bg-[#175849] text-white text-sm font-semibold cursor-pointer"
              >
                <Printer className="h-4 w-4" aria-hidden="true" />
                <span>{t.summary.printBtn}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={t.common.close}
              className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E4DFD5] bg-white hover:bg-[#F3EFE8] text-sm font-semibold text-[#10233D] cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              <span>{t.common.close}</span>
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {!canManage ? (
            <div className="rounded-lg border border-[#F6D3BA] bg-[#FDF2EA] p-4 text-base text-[#B54708]">
              {t.summary.restrictedNotice}
            </div>
          ) : (
            <>
              {/* Document Header */}
              <div className="border-b border-[#E4DFD5] pb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#1E6F5C]">
                    {t.common.appName} · {circle.name}
                  </p>
                  <h2 id="care-summary-title" className="font-display text-2xl font-bold text-[#10233D] mt-1">
                    {t.summary.title}
                  </h2>
                  <p className="text-sm text-[#5B728A] mt-0.5">{t.summary.subtitle}</p>
                </div>
                <div className="text-sm text-[#334E68] text-right">
                  <div className="font-semibold">{t.summary.generatedOn}</div>
                  <div>{formatDateFullLocalized(todayKey, lang)}</div>
                </div>
              </div>

              {/* Patient & Emergency Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-[#E4DFD5] bg-[#FAF8F5] p-4 space-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-[#5B728A]">
                    {t.summary.patientInfo}
                  </h3>
                  <div className="text-lg font-bold text-[#10233D]">{circle.elderName}</div>
                  <div className="text-sm text-[#334E68]">
                    {formatNumberLocalized(circle.elderAge, lang)} {t.dashboard.yearsOld} ·{' '}
                    {circle.elderRelationship}
                  </div>
                  <div className="text-xs text-[#5B728A] font-mono-code">{circle.timezone}</div>
                </div>

                <div className="rounded-xl border border-[#E4DFD5] bg-[#FAF8F5] p-4 space-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-[#5B728A]">
                    {t.summary.emergencyContact}
                  </h3>
                  {circle.emergencyContactName || circle.emergencyContactPhone ? (
                    <>
                      <div className="text-base font-bold text-[#10233D]">
                        {circle.emergencyContactName || t.summary.emergencyContact}
                      </div>
                      <div className="text-base font-mono-code text-[#1E6F5C] font-semibold">
                        {circle.emergencyContactPhone || '—'}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-[#5B728A]">{t.dashboard.noEmergencyContact}</p>
                  )}
                </div>
              </div>

              {/* Current Medication Schedule */}
              <div className="space-y-2.5">
                <h3 className="font-display text-lg font-bold text-[#10233D] border-b border-[#E4DFD5] pb-2">
                  {t.summary.currentSchedule} ({formatNumberLocalized(activeMeds.length, lang)})
                </h3>
                {activeMeds.length === 0 ? (
                  <p className="text-sm text-[#5B728A]">{t.summary.noActiveMeds}</p>
                ) : (
                  <div className="divide-y divide-[#E4DFD5]">
                    {activeMeds.map((med) => (
                      <div key={med.id} className="py-2.5 space-y-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-semibold text-[#10233D]">
                            {med.name} — <span className="font-mono-code">{med.dosage}</span>
                          </span>
                          <span className="text-sm text-[#334E68]">
                            {formatFrequencyLabelLocalized(med.frequency, lang)} ·{' '}
                            {med.scheduledTimes.map((tm) => formatTime12hLocalized(tm, lang)).join(', ')}
                          </span>
                        </div>
                        {med.instructions && (
                          <p className="text-sm text-[#5B728A]">{med.instructions}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming Appointments */}
              <div className="space-y-2.5">
                <h3 className="font-display text-lg font-bold text-[#10233D] border-b border-[#E4DFD5] pb-2">
                  {t.summary.upcomingAppointments} ({formatNumberLocalized(upcomingAppts.length, lang)})
                </h3>
                {upcomingAppts.length === 0 ? (
                  <p className="text-sm text-[#5B728A]">{t.summary.noUpcomingAppts}</p>
                ) : (
                  <div className="divide-y divide-[#E4DFD5]">
                    {upcomingAppts.slice(0, 6).map((appt) => (
                      <div key={appt.id} className="py-2.5 space-y-0.5">
                        <div className="font-semibold text-[#10233D]">
                          {appt.doctorName}
                          {appt.specialty ? ` (${appt.specialty})` : ''} — {appt.clinicName}
                        </div>
                        <div className="text-sm text-[#334E68]">
                          {formatDateFriendlyLocalized(appt.appointmentDate, lang)} ·{' '}
                          {formatTime12hLocalized(appt.appointmentTime, lang)}
                        </div>
                        {appt.notes && <p className="text-sm text-[#5B728A]">{appt.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 7-Day Adherence Summary */}
              <div className="rounded-xl border border-[#E4DFD5] bg-[#FAF8F5] p-4 space-y-1.5">
                <h3 className="font-display text-base font-bold text-[#10233D]">
                  {t.summary.adherenceSection}
                </h3>
                <div className="text-2xl font-mono-code font-bold text-[#1E6F5C]">
                  {weekly.adherenceRatePct !== null
                    ? formatPercentLocalized(weekly.adherenceRatePct, lang)
                    : '—'}
                </div>
                <p className="text-sm text-[#334E68]">
                  {t.summary.adherenceStats}:{' '}
                  <strong className="font-mono-code">
                    {formatNumberLocalized(weekly.takenCount, lang)} /{' '}
                    {formatNumberLocalized(weekly.unconfirmedCount, lang)} /{' '}
                    {formatNumberLocalized(weekly.missedCount, lang)} /{' '}
                    {formatNumberLocalized(weekly.skippedCount, lang)}
                  </strong>
                </p>
              </div>

              {/* Recent Handover Notes */}
              <div className="space-y-2">
                <h3 className="font-display text-lg font-bold text-[#10233D] border-b border-[#E4DFD5] pb-2">
                  {t.summary.handoverNotesSection}
                </h3>
                {handovers.length === 0 ? (
                  <p className="text-sm text-[#5B728A]">{t.summary.noHandoverNotes}</p>
                ) : (
                  <div className="space-y-2">
                    {handovers.map((h) => (
                      <div key={h.id} className="text-sm text-[#10233D] border-l-2 border-[#1E6F5C] pl-3 py-1">
                        <p>{h.note}</p>
                        <p className="text-xs text-[#5B728A]">
                          {h.actorName}
                          {h.createdAt ? ` · ${formatFirestoreTimestampLocalized(h.createdAt, lang)}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Care Notes & Allergies */}
              <div className="space-y-1.5">
                <h3 className="font-display text-base font-bold text-[#10233D]">
                  {t.summary.conditionNotesSection}
                </h3>
                <p className="text-sm text-[#334E68] whitespace-pre-wrap">
                  {circle.primaryConditionNotes.trim() || t.summary.noConditionNotes}
                </p>
              </div>

              <p className="text-xs text-[#5B728A] border-t border-[#E4DFD5] pt-4">
                {t.summary.privacyFooter}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
