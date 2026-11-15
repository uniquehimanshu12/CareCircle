import { useState, type FormEvent } from 'react';
import { Check, Edit3, Package, Pill, Plus, Trash2, X } from 'lucide-react';
import type {
  CareCircle,
  CircleRole,
  DoseLog,
  DoseStatus,
  Medication,
  MedicationRefillInfo,
} from '../types';
import {
  buildScheduleForDate,
  computeRefillEstimate,
  findDuplicateMedication,
  getLocalDateKey,
  getPastDateKeys,
} from '../utils/schedule';
import {
  deleteMedication,
  recordDoseStatus,
  saveMedication,
} from '../services/careCircleService';
import { saveMedicationRefill } from '../services/apiService';
import { useLanguage } from '../i18n/LanguageContext';
import {
  formatDateFriendlyLocalized,
  formatFrequencyLabelLocalized,
  formatNumberLocalized,
  formatTime12hLocalized,
} from '../i18n/locales';
import { StatusIndicator } from './StatusIndicator';
import { SpeechControls } from './SpeechControls';

interface MedicationsViewProps {
  circle: CareCircle;
  currentRole: CircleRole;
  currentUserId: string;
  currentUserName: string;
  medications: Medication[];
  doseLogs: DoseLog[];
  refills: Record<string, MedicationRefillInfo>;
  onRefillUpdated: (refill: MedicationRefillInfo) => void;
}

export function MedicationsView({
  circle,
  currentRole,
  currentUserId,
  currentUserName,
  medications,
  doseLogs,
  refills,
  onRefillUpdated,
}: MedicationsViewProps) {
  const { lang, t } = useLanguage();
  const canManage = currentRole === 'primary_caregiver' || currentRole === 'caretaker';
  const todayKey = getLocalDateKey(new Date(), circle.timezone);

  const [subTab, setSubTab] = useState<'list' | 'history'>('list');
  const [showForm, setShowForm] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  const [instructions, setInstructions] = useState('');
  const [startDate, setStartDate] = useState(todayKey);
  const [endDate, setEndDate] = useState('');
  const [times, setTimes] = useState<string[]>(['08:00']);
  const [active, setActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [historyDate, setHistoryDate] = useState(todayKey);
  const [doseNoteBySlot, setDoseNoteBySlot] = useState<Record<string, string>>({});

  // Refill editor state
  const [editingRefillMedId, setEditingRefillMedId] = useState<string | null>(null);
  const [refillQty, setRefillQty] = useState('30');
  const [refillPerIntake, setRefillPerIntake] = useState('1');
  const [refillAlertDays, setRefillAlertDays] = useState('5');
  const [savingRefill, setSavingRefill] = useState(false);

  const duplicateMatch = findDuplicateMedication(name, medications, editingMed?.id);

  const resetForm = () => {
    setEditingMed(null);
    setName('');
    setDosage('');
    setFrequency('Once daily');
    setInstructions('');
    setStartDate(todayKey);
    setEndDate('');
    setTimes(['08:00']);
    setActive(true);
    setError('');
  };

  const openEdit = (med: Medication) => {
    setEditingMed(med);
    setName(med.name);
    setDosage(med.dosage);
    setFrequency(med.frequency);
    setInstructions(med.instructions);
    setStartDate(med.startDate);
    setEndDate(med.endDate || '');
    setTimes(med.scheduledTimes.length > 0 ? [...med.scheduledTimes] : ['08:00']);
    setActive(med.active);
    setError('');
    setShowForm(true);
  };

  const openRefillEditor = (medId: string) => {
    const existing = refills[medId];
    setEditingRefillMedId(medId);
    setRefillQty(existing ? String(existing.availableQuantity) : '30');
    setRefillPerIntake(existing ? String(existing.dosesPerIntake) : '1');
    setRefillAlertDays(existing ? String(existing.alertDaysBefore) : '5');
    setError('');
  };

  const handleSaveRefill = async (medId: string) => {
    setError('');
    setStatusMessage('');
    setSavingRefill(true);
    try {
      const res = await saveMedicationRefill(circle.id, {
        medicationId: medId,
        availableQuantity: Number(refillQty),
        dosesPerIntake: Number(refillPerIntake),
        alertDaysBefore: Number(refillAlertDays),
      });
      onRefillUpdated(res.refill);
      setEditingRefillMedId(null);
      setStatusMessage(t.medications.refillSavedMsg);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.unknownError);
    } finally {
      setSavingRefill(false);
    }
  };

  const handleFrequencyChange = (freq: string) => {
    setFrequency(freq);
    if (!editingMed) {
      if (freq === 'Once daily') setTimes(['08:00']);
      else if (freq === 'Twice daily') setTimes(['08:00', '20:00']);
      else if (freq === 'Three times daily') setTimes(['08:00', '13:00', '20:00']);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');

    if (endDate && endDate < startDate) {
      setError(t.medications.errEndBeforeStart);
      return;
    }

    if (duplicateMatch) {
      setError(t.medications.errDuplicateSave);
      return;
    }

    setSaving(true);
    try {
      await saveMedication({
        circleId: circle.id,
        existingMeds: medications,
        editId: editingMed?.id,
        name,
        dosage,
        frequency,
        scheduledTimes: times,
        instructions,
        startDate,
        endDate,
        active,
        source: editingMed?.source || 'manual',
        verifiedBy: currentUserName,
        actorId: currentUserId,
        actorName: currentUserName,
        actorRole: currentRole,
      });
      setStatusMessage(
        editingMed
          ? `${t.medications.msgUpdated} ${name.trim()}`
          : `${t.medications.msgSaved} ${name.trim()}`
      );
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.medications.errSaveMed);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (med: Medication) => {
    setError('');
    try {
      await deleteMedication({
        circleId: circle.id,
        med,
        actorId: currentUserId,
        actorName: currentUserName,
        actorRole: currentRole,
      });
      setConfirmDeleteId(null);
      setStatusMessage(`${t.medications.msgDeleted} ${med.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.medications.errDeleteMed);
    }
  };

  const handleRecordDose = async (
    slot: ReturnType<typeof buildScheduleForDate>[number],
    status: DoseStatus
  ) => {
    setError('');
    try {
      await recordDoseStatus({
        circleId: circle.id,
        medication: slot.medication,
        dateKey: slot.dateKey,
        scheduledTime: slot.scheduledTime,
        status,
        notes: doseNoteBySlot[slot.slotKey] || '',
        actorId: currentUserId,
        actorName: currentUserName,
        actorRole: currentRole,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.medications.errLogDose);
    }
  };

  const past7Days = getPastDateKeys(7, circle.timezone).reverse();
  const dateSchedule = buildScheduleForDate({
    medications,
    doseLogs,
    dateKey: historyDate,
    timeZone: circle.timezone,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#10233D]">{t.medications.title}</h1>
          <p className="mt-1 text-base text-[#334E68]">
            {t.medications.subtitle} ({circle.elderName})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex flex-wrap p-1 rounded-lg bg-[#F3EFE8] border border-[#E4DFD5] gap-1">
            <button
              type="button"
              onClick={() => setSubTab('list')}
              className={`min-h-[42px] px-4 py-1.5 rounded-md text-sm font-semibold cursor-pointer ${
                subTab === 'list' ? 'bg-white text-[#10233D] shadow-sm' : 'text-[#5B728A]'
              }`}
            >
              {t.medications.tabList} ({formatNumberLocalized(medications.length, lang)})
            </button>
            <button
              type="button"
              onClick={() => setSubTab('history')}
              className={`min-h-[42px] px-4 py-1.5 rounded-md text-sm font-semibold cursor-pointer ${
                subTab === 'history' ? 'bg-white text-[#10233D] shadow-sm' : 'text-[#5B728A]'
              }`}
            >
              {t.medications.tabHistory}
            </button>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1E6F5C] hover:bg-[#175849] text-white text-sm font-semibold cursor-pointer"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>{t.medications.addBtn}</span>
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="rounded-lg border border-[#CBE5DB] bg-[#EBF5F1] px-4 py-3 text-sm font-medium text-[#1E6F5C]">
          {statusMessage}
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

      {showForm && canManage && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[#E4DFD5] bg-white p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-[#E4DFD5] pb-3">
            <h2 className="font-display text-lg font-bold text-[#10233D]">
              {editingMed
                ? `${t.medications.formEditTitle} ${editingMed.name}`
                : t.medications.formAddTitle}
            </h2>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="min-h-[42px] px-3 py-1.5 rounded-lg text-sm font-medium text-[#5B728A] hover:bg-[#FAF8F5] cursor-pointer"
            >
              {t.common.cancel}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label htmlFor="med-name-input" className="block text-sm font-semibold text-[#10233D] mb-1.5">
                {t.medications.nameLabel}
              </label>
              <input
                id="med-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.medications.namePlaceholder}
                className="w-full min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2 text-base text-[#10233D]"
              />
              {duplicateMatch && (
                <p className="mt-1.5 text-xs font-medium text-[#B54708]">
                  {t.medications.duplicateInline} ({duplicateMatch.name})
                </p>
              )}
            </div>

            <div>
              <label htmlFor="med-dosage-input" className="block text-sm font-semibold text-[#10233D] mb-1.5">
                {t.medications.dosageLabel}
              </label>
              <input
                id="med-dosage-input"
                type="text"
                required
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder={t.medications.dosagePlaceholder}
                className="w-full min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2 text-base text-[#10233D]"
              />
            </div>

            <div>
              <label htmlFor="med-frequency-select" className="block text-sm font-semibold text-[#10233D] mb-1.5">
                {t.medications.frequencyLabel}
              </label>
              <select
                id="med-frequency-select"
                value={frequency}
                onChange={(e) => handleFrequencyChange(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2 text-base text-[#10233D]"
              >
                <option value="Once daily">{t.medications.freqOnce}</option>
                <option value="Twice daily">{t.medications.freqTwice}</option>
                <option value="Three times daily">{t.medications.freqThree}</option>
                <option value="Weekly">{t.medications.freqWeekly}</option>
                <option value="As needed">{t.medications.freqAsNeeded}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label htmlFor="med-start-date" className="block text-sm font-semibold text-[#10233D] mb-1.5">
                {t.medications.startDateLabel}
              </label>
              <input
                id="med-start-date"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2 text-base text-[#10233D] font-mono-code"
              />
            </div>
            <div>
              <label htmlFor="med-end-date" className="block text-sm font-semibold text-[#10233D] mb-1.5">
                {t.medications.endDateLabel}
              </label>
              <input
                id="med-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2 text-base text-[#10233D] font-mono-code"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="inline-flex items-center gap-2.5 text-sm font-semibold text-[#10233D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-5 w-5 accent-[#1E6F5C]"
                />
                <span>{t.medications.activeCheckbox}</span>
              </label>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[#10233D]">
                {t.medications.scheduledTimesLabel} ({circle.timezone}) *
              </span>
              {times.length < 6 && (
                <button
                  type="button"
                  onClick={() => setTimes([...times, '12:00'])}
                  className="text-sm font-semibold text-[#1E6F5C] hover:underline cursor-pointer"
                >
                  {t.medications.addTimeSlot}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {times.map((tm, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <input
                    type="time"
                    required
                    aria-label={`${t.medications.scheduledTimesLabel} ${idx + 1}`}
                    value={tm}
                    onChange={(e) => {
                      const next = [...times];
                      next[idx] = e.target.value;
                      setTimes(next);
                    }}
                    className="min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3 py-2 text-base font-mono-code text-[#10233D]"
                  />
                  {times.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setTimes(times.filter((_, i) => i !== idx))}
                      aria-label={t.medications.removeTimeSlotAria}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-[#E4DFD5] text-[#5B728A] hover:text-[#B42318] cursor-pointer"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="med-instructions" className="block text-sm font-semibold text-[#10233D] mb-1.5">
              {t.medications.instructionsLabel}
            </label>
            <textarea
              id="med-instructions"
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={t.medications.instructionsPlaceholder}
              className="w-full rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2 text-base text-[#10233D]"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving || Boolean(duplicateMatch)}
              className="min-h-[46px] px-6 py-2.5 rounded-lg bg-[#1E6F5C] hover:bg-[#175849] text-white text-base font-semibold disabled:opacity-60 cursor-pointer"
            >
              {saving
                ? t.common.saving
                : editingMed
                  ? t.medications.saveChanges
                  : t.medications.saveMedication}
            </button>
          </div>
        </form>
      )}

      {subTab === 'list' ? (
        medications.length === 0 ? (
          <div className="rounded-xl border border-[#E4DFD5] bg-white p-12 text-center space-y-3">
            <Pill className="h-10 w-10 mx-auto text-[#5B728A]" aria-hidden="true" />
            <h2 className="font-display text-lg font-semibold text-[#10233D]">
              {t.medications.emptyTitle}
            </h2>
            <p className="text-base text-[#5B728A] max-w-md mx-auto">{t.medications.emptyDesc}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {medications.map((med) => {
              const refillInfo = refills[med.id];
              const estimate = computeRefillEstimate({
                medication: med,
                refillInfo,
                timeZone: circle.timezone,
              });
              const isEditingRefill = editingRefillMedId === med.id;
              const speechText = `${med.name}, ${med.dosage}, ${formatFrequencyLabelLocalized(
                med.frequency,
                lang
              )}, ${med.scheduledTimes.map((tm) => formatTime12hLocalized(tm, lang)).join(', ')}. ${
                med.instructions || ''
              }`;

              return (
                <div
                  key={med.id}
                  className="rounded-xl border border-[#E4DFD5] bg-white p-6 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-xl font-bold text-[#10233D]">{med.name}</h3>
                        <p className="text-sm text-[#5B728A] font-mono-code">
                          {med.dosage} · {formatFrequencyLabelLocalized(med.frequency, lang)} ·{' '}
                          {med.active ? t.common.active : t.common.paused}
                        </p>
                      </div>
                      {estimate?.isLow && (
                        <span className="px-2.5 py-1 rounded-md border border-[#F6D3BA] bg-[#FDF2EA] text-xs font-bold text-[#B54708] shrink-0">
                          {t.medications.refillLowBadge}
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-[#334E68]">
                      <strong>{t.medications.timesPrefix}</strong>{' '}
                      <span className="font-mono-code">
                        {med.scheduledTimes.map((tm) => formatTime12hLocalized(tm, lang)).join(', ')}
                      </span>
                    </div>

                    {med.instructions && (
                      <p className="text-sm text-[#334E68] leading-relaxed">{med.instructions}</p>
                    )}

                    <SpeechControls
                      text={speechText}
                      controlKey={`med_${med.id}`}
                      label={t.medications.listenInstructions}
                      compact
                    />

                    {/* Refill Status Summary */}
                    <div className="rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] p-3 text-sm space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[#10233D]">
                          <Package className="h-4 w-4 text-[#1E6F5C]" aria-hidden="true" />
                          <span>{t.medications.refillTitle}</span>
                        </span>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() =>
                              isEditingRefill ? setEditingRefillMedId(null) : openRefillEditor(med.id)
                            }
                            className="text-xs font-semibold text-[#1E6F5C] hover:underline cursor-pointer"
                          >
                            {isEditingRefill ? t.common.cancel : t.medications.refillSaveBtn}
                          </button>
                        )}
                      </div>

                      {refillInfo ? (
                        <div className="text-xs sm:text-sm text-[#334E68] space-y-0.5">
                          <div>
                            {t.medications.refillQtyLabel}:{' '}
                            <strong className="font-mono-code">
                              {formatNumberLocalized(refillInfo.availableQuantity, lang)}
                            </strong>
                            {estimate?.status === 'estimated' &&
                              estimate.estimatedRunOutDateKey &&
                              estimate.daysRemaining !== null && (
                                <>
                                  {' '}
                                  · {t.medications.refillEstimatedRunout}{' '}
                                  <strong className={estimate.isLow ? 'text-[#B54708]' : 'text-[#10233D]'}>
                                    {formatDateFriendlyLocalized(estimate.estimatedRunOutDateKey, lang)} (
                                    {formatNumberLocalized(estimate.daysRemaining, lang)}{' '}
                                    {t.medications.refillDaysRemaining})
                                  </strong>
                                </>
                              )}
                          </div>
                          {estimate?.status === 'manual_tracking_required' && (
                            <p className="text-xs font-medium text-[#5B728A]">
                              {t.medications.refillManualTrackingRequired}
                            </p>
                          )}
                          {estimate?.status === 'expired' && (
                            <p className="text-xs font-medium text-[#5B728A]">
                              {t.medications.refillExpiredNotice}
                            </p>
                          )}
                          {estimate?.status === 'estimated' && estimate.startsInFuture && (
                            <p className="text-xs font-medium text-[#5B728A]">
                              {t.medications.refillStartsFutureNotice}
                            </p>
                          )}
                          <p className="text-xs text-[#5B728A]">{t.medications.refillDisclaimer}</p>
                          <p className="text-[11px] text-[#5B728A] italic">{t.medications.refillStorageNote}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-[#5B728A]">{t.medications.refillNotSet}</p>
                      )}

                      {isEditingRefill && canManage && (
                        <div className="pt-2 mt-2 border-t border-[#E4DFD5] space-y-3">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label
                                htmlFor={`refill-qty-${med.id}`}
                                className="block text-xs font-semibold text-[#334E68] mb-1"
                              >
                                {t.medications.refillQtyLabel}
                              </label>
                              <input
                                id={`refill-qty-${med.id}`}
                                type="number"
                                min={0}
                                max={5000}
                                step="0.5"
                                value={refillQty}
                                onChange={(e) => setRefillQty(e.target.value)}
                                className="w-full min-h-[40px] rounded border border-[#E4DFD5] bg-white px-2.5 py-1 text-sm font-mono-code"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor={`refill-per-${med.id}`}
                                className="block text-xs font-semibold text-[#334E68] mb-1"
                              >
                                {t.medications.refillPerDoseLabel}
                              </label>
                              <input
                                id={`refill-per-${med.id}`}
                                type="number"
                                min={0.25}
                                max={20}
                                step="0.25"
                                value={refillPerIntake}
                                onChange={(e) => setRefillPerIntake(e.target.value)}
                                className="w-full min-h-[40px] rounded border border-[#E4DFD5] bg-white px-2.5 py-1 text-sm font-mono-code"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor={`refill-alert-${med.id}`}
                                className="block text-xs font-semibold text-[#334E68] mb-1"
                              >
                                {t.medications.refillAlertDaysLabel}
                              </label>
                              <input
                                id={`refill-alert-${med.id}`}
                                type="number"
                                min={1}
                                max={60}
                                value={refillAlertDays}
                                onChange={(e) => setRefillAlertDays(e.target.value)}
                                className="w-full min-h-[40px] rounded border border-[#E4DFD5] bg-white px-2.5 py-1 text-sm font-mono-code"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={savingRefill}
                            onClick={() => void handleSaveRefill(med.id)}
                            className="min-h-[40px] px-4 py-1.5 rounded-lg bg-[#1E6F5C] hover:bg-[#175849] text-white text-xs font-semibold disabled:opacity-60 cursor-pointer"
                          >
                            {savingRefill ? t.common.saving : t.medications.refillSaveBtn}
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-[#5B728A] font-mono-code">
                      {t.medications.startsPrefix} {formatDateFriendlyLocalized(med.startDate, lang)}
                      {med.endDate
                        ? ` · ${t.medications.endsPrefix} ${formatDateFriendlyLocalized(med.endDate, lang)}`
                        : ` · ${t.medications.ongoing}`}
                      {med.source === 'prescription_scan'
                        ? ` · ${t.medications.verifiedByPrefix} ${med.verifiedBy}`
                        : ''}
                    </p>
                  </div>

                  {canManage && (
                    <div className="flex flex-wrap items-center gap-2 border-t border-[#E4DFD5] pt-4">
                      <button
                        type="button"
                        onClick={() => openEdit(med)}
                        className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E4DFD5] text-sm font-medium text-[#10233D] hover:bg-[#FAF8F5] cursor-pointer"
                      >
                        <Edit3 className="h-4 w-4" aria-hidden="true" />
                        <span>{t.common.edit}</span>
                      </button>

                      {confirmDeleteId === med.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void handleDelete(med)}
                            className="min-h-[42px] px-3.5 py-2 rounded-lg bg-[#B42318] text-white text-sm font-semibold cursor-pointer"
                          >
                            {t.common.confirmDelete}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="min-h-[42px] px-3 py-2 rounded-lg border border-[#E4DFD5] text-sm text-[#5B728A] cursor-pointer"
                          >
                            {t.common.cancel}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(med.id)}
                          className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E4DFD5] text-sm font-medium text-[#B42318] hover:bg-[#FEF3F2] cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          <span>{t.common.delete}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="rounded-xl border border-[#E4DFD5] bg-white p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E4DFD5] pb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-[#10233D]">
                {t.medications.historyTitle}
              </h2>
              <p className="text-sm text-[#5B728A]">{t.medications.historySubtitle}</p>
            </div>
            <select
              aria-label={t.medications.historyTitle}
              value={historyDate}
              onChange={(e) => setHistoryDate(e.target.value)}
              className="min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2 text-sm font-medium text-[#10233D]"
            >
              {past7Days.map((dk) => (
                <option key={dk} value={dk}>
                  {dk === todayKey
                    ? `${t.medications.todayOptionPrefix} (${formatDateFriendlyLocalized(dk, lang)})`
                    : formatDateFriendlyLocalized(dk, lang)}
                </option>
              ))}
            </select>
          </div>

          {dateSchedule.length === 0 ? (
            <p className="py-8 text-center text-base text-[#5B728A]">
              {t.medications.noMedsScheduledForDate} {formatDateFriendlyLocalized(historyDate, lang)}.
            </p>
          ) : (
            <div className="divide-y divide-[#E4DFD5]">
              {dateSchedule.map((slot) => (
                <div
                  key={slot.slotKey}
                  className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono-code font-semibold text-[#10233D] tabular-nums">
                        {formatTime12hLocalized(slot.scheduledTime, lang)}
                      </span>
                      <span className="font-semibold text-[#10233D]">{slot.medication.name}</span>
                      <span className="text-sm text-[#5B728A] font-mono-code">
                        {slot.medication.dosage}
                      </span>
                      <StatusIndicator state={slot.state} compact />
                    </div>
                    {slot.log && (
                      <p className="text-xs text-[#5B728A]">
                        {t.medications.loggedBy} {slot.log.recordedByName}
                        {slot.log.notes ? ` · ${slot.log.notes}` : ''}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      aria-label={t.medications.noteInputPlaceholder}
                      value={doseNoteBySlot[slot.slotKey] || ''}
                      onChange={(e) =>
                        setDoseNoteBySlot((prev) => ({
                          ...prev,
                          [slot.slotKey]: e.target.value,
                        }))
                      }
                      placeholder={t.medications.noteInputPlaceholder}
                      className="min-h-[42px] w-48 rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3 py-1.5 text-sm text-[#10233D]"
                    />
                    <button
                      type="button"
                      onClick={() => void handleRecordDose(slot, 'taken')}
                      className="min-h-[42px] inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-[#1E6F5C] text-white text-sm font-semibold hover:bg-[#175849] cursor-pointer"
                    >
                      <Check className="h-4 w-4" aria-hidden="true" />
                      <span>{t.medications.btnTaken}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRecordDose(slot, 'unconfirmed')}
                      className="min-h-[42px] px-3.5 py-2 rounded-lg border border-[#F6D3BA] bg-[#FDF2EA] text-[#B54708] text-sm font-medium cursor-pointer"
                    >
                      {t.medications.btnUnconfirmed}
                    </button>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => void handleRecordDose(slot, 'missed')}
                        className="min-h-[42px] px-3.5 py-2 rounded-lg border border-[#FECDCA] bg-[#FEF3F2] text-[#B42318] text-sm font-medium cursor-pointer"
                      >
                        {t.medications.btnMissed}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleRecordDose(slot, 'skipped')}
                      className="min-h-[42px] px-3.5 py-2 rounded-lg border border-[#E4DFD5] bg-white text-[#5B728A] text-sm font-medium cursor-pointer"
                    >
                      {t.medications.btnSkipped}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
