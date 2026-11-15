import { useState, type ChangeEvent } from 'react';
import { AlertTriangle, CheckCircle2, FileImage, ScanLine, ShieldAlert, Upload } from 'lucide-react';
import type { CareCircle, CircleRole, Medication } from '../types';
import { scanPrescriptionImage } from '../services/apiService';
import { saveMedication } from '../services/careCircleService';
import { findDuplicateMedication, getLocalDateKey } from '../utils/schedule';
import { useLanguage } from '../i18n/LanguageContext';

interface PrescriptionScannerViewProps {
  circle: CareCircle;
  currentRole: CircleRole;
  currentUserId: string;
  currentUserName: string;
  medications: Medication[];
  onSaved: () => void;
}

interface DraftExtractedItem {
  key: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  scheduledTimes: string[];
  confidenceNotes: string;
  verified: boolean;
  saved: boolean;
}

export function PrescriptionScannerView({
  circle,
  currentRole,
  currentUserId,
  currentUserName,
  medications,
  onSaved,
}: PrescriptionScannerViewProps) {
  const { t } = useLanguage();
  const canManage = currentRole === 'primary_caregiver' || currentRole === 'caretaker';
  const todayKey = getLocalDateKey(new Date(), circle.timezone);

  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [imageBase64, setImageBase64] = useState<string>('');
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [guideImgFailed, setGuideImgFailed] = useState(false);

  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [prescriberName, setPrescriberName] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<DraftExtractedItem[]>([]);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState('');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setScanError('');
    setSaveFeedback('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setScanError(t.scanner.errInvalidType);
      return;
    }
    if (file.size > 7 * 1024 * 1024) {
      setScanError(t.scanner.errTooLarge);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setPreviewUrl(dataUrl);
      const commaIdx = dataUrl.indexOf(',');
      setImageBase64(commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl);
      setMimeType(file.type || 'image/jpeg');
      setDrafts([]);
      setWarnings([]);
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!imageBase64) return;
    setScanError('');
    setSaveFeedback('');
    setScanning(true);
    try {
      const { extracted } = await scanPrescriptionImage({ imageBase64, mimeType });
      setPrescriberName(extracted.prescriberName || '');
      setPrescriptionDate(extracted.prescriptionDate || '');
      setWarnings(Array.isArray(extracted.warnings) ? extracted.warnings : []);
      const items: DraftExtractedItem[] = (extracted.medications || []).map((m, idx) => ({
        key: `draft_${idx}_${Date.now()}`,
        name: m.name || '',
        dosage: m.dosage || '',
        frequency: m.frequency || 'Once daily',
        instructions: m.instructions || '',
        scheduledTimes:
          Array.isArray(m.suggestedTimes) && m.suggestedTimes.length > 0
            ? m.suggestedTimes.filter((tm) => /^[0-2][0-9]:[0-5][0-9]$/.test(tm)).slice(0, 6)
            : ['08:00'],
        confidenceNotes: m.confidenceNotes || '',
        verified: false,
        saved: false,
      }));
      setDrafts(items);
      if (items.length === 0) {
        setScanError(t.scanner.errNoMedsFound);
      }
    } catch (err) {
      setScanError(err instanceof Error ? err.message : t.scanner.errScanFailed);
    } finally {
      setScanning(false);
    }
  };

  const updateDraft = (key: string, patch: Partial<DraftExtractedItem>) => {
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  };

  const handleSaveDraft = async (draft: DraftExtractedItem) => {
    if (!draft.verified) return;
    setScanError('');
    setSaveFeedback('');
    setSavingKey(draft.key);
    try {
      await saveMedication({
        circleId: circle.id,
        existingMeds: medications,
        name: draft.name,
        dosage: draft.dosage,
        frequency: draft.frequency || 'Once daily',
        scheduledTimes: draft.scheduledTimes.length > 0 ? draft.scheduledTimes : ['08:00'],
        instructions: draft.instructions,
        startDate: todayKey,
        endDate: '',
        active: true,
        source: 'prescription_scan',
        verifiedBy: currentUserName,
        actorId: currentUserId,
        actorName: currentUserName,
        actorRole: currentRole,
      });
      updateDraft(draft.key, { saved: true });
      setSaveFeedback(`${t.scanner.msgSaved} ${draft.name} (${draft.dosage})`);
      onSaved();
    } catch (err) {
      setScanError(err instanceof Error ? err.message : t.scanner.errSaveFailed);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#10233D]">{t.scanner.title}</h1>
        <p className="mt-1 text-base text-[#334E68]">
          {t.scanner.subtitle} ({circle.elderName})
        </p>
      </div>

      {!canManage && (
        <div className="rounded-xl border border-[#F6D3BA] bg-[#FDF2EA] p-4 flex items-start gap-3 text-sm text-[#B54708]">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div>{t.scanner.viewOnlyNotice}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Upload & Preview Panel */}
        <div className="lg:col-span-5 rounded-xl border border-[#E4DFD5] bg-white p-6 space-y-5">
          <div className="aspect-[4/3] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] overflow-hidden flex items-center justify-center">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={t.scanner.previewAlt}
                className="w-full h-full object-contain"
              />
            ) : !guideImgFailed ? (
              <img
                src="/src/assets/images/carecircle_prescription_guide_1794720466408.jpg"
                alt={t.scanner.guideAlt}
                referrerPolicy="no-referrer"
                onError={() => setGuideImgFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="p-6 text-center space-y-2">
                <FileImage className="h-10 w-10 mx-auto text-[#5B728A]" aria-hidden="true" />
                <p className="text-sm text-[#5B728A]">{t.scanner.selectHint}</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label
              htmlFor="rx-file-upload"
              className="min-h-[46px] w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] hover:bg-[#F3EFE8] text-sm font-semibold text-[#10233D] cursor-pointer"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span>{previewUrl ? t.scanner.chooseAnother : t.scanner.uploadPhoto}</span>
              <input
                id="rx-file-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>

            <button
              type="button"
              disabled={!imageBase64 || scanning}
              onClick={() => void handleScan()}
              className="min-h-[48px] w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#1E6F5C] hover:bg-[#175849] text-white text-base font-semibold disabled:opacity-50 cursor-pointer"
            >
              <ScanLine className="h-5 w-5" aria-hidden="true" />
              <span>{scanning ? t.scanner.extracting : t.scanner.extractBtn}</span>
            </button>
          </div>

          <p className="text-xs text-[#5B728A] leading-relaxed">{t.scanner.safetyGuarantee}</p>
        </div>

        {/* Human Verification Review Panel */}
        <div className="lg:col-span-7 space-y-4">
          {scanError && (
            <div
              role="alert"
              className="rounded-lg border border-[#FECDCA] bg-[#FEF3F2] px-4 py-3 text-sm text-[#B42318]"
            >
              {scanError}
            </div>
          )}

          {saveFeedback && (
            <div className="rounded-lg border border-[#CBE5DB] bg-[#EBF5F1] px-4 py-3 text-sm font-medium text-[#1E6F5C]">
              {saveFeedback}
            </div>
          )}

          {drafts.length === 0 ? (
            <div className="rounded-xl border border-[#E4DFD5] bg-white p-10 text-center space-y-3">
              <ScanLine className="h-9 w-9 mx-auto text-[#5B728A]" aria-hidden="true" />
              <h2 className="font-display text-lg font-semibold text-[#10233D]">
                {t.scanner.waitingTitle}
              </h2>
              <p className="text-sm text-[#5B728A] max-w-md mx-auto">{t.scanner.waitingDesc}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(prescriberName || prescriptionDate || warnings.length > 0) && (
                <div className="rounded-xl border border-[#E4DFD5] bg-white p-5 space-y-2">
                  <div className="text-sm font-semibold text-[#10233D]">
                    {t.scanner.headerDetails}
                  </div>
                  <div className="text-sm text-[#334E68]">
                    {t.scanner.prescriberPrefix}{' '}
                    {prescriberName || t.scanner.notShown} · {t.scanner.datePrefix}{' '}
                    {prescriptionDate || t.scanner.notShown}
                  </div>
                  {warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-[#B54708]">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {drafts.map((draft) => {
                const duplicate = findDuplicateMedication(draft.name, medications);
                return (
                  <div
                    key={draft.key}
                    className="rounded-xl border border-[#E4DFD5] bg-white p-6 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E4DFD5] pb-3">
                      <span className="font-display text-lg font-bold text-[#10233D]">
                        {t.scanner.verifyHeading}
                      </span>
                      {draft.saved && (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#1E6F5C]">
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          <span>{t.scanner.savedBadge}</span>
                        </span>
                      )}
                    </div>

                    {draft.confidenceNotes && (
                      <p className="text-sm text-[#B54708] bg-[#FDF2EA] border border-[#F6D3BA] rounded-lg px-3.5 py-2">
                        {t.scanner.scannerNotePrefix} {draft.confidenceNotes}
                      </p>
                    )}

                    {duplicate && !draft.saved && (
                      <p className="text-sm text-[#B42318] bg-[#FEF3F2] border border-[#FECDCA] rounded-lg px-3.5 py-2">
                        {t.scanner.duplicateWarning} ({duplicate.name} — {duplicate.dosage})
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor={`scan-name-${draft.key}`}
                          className="block text-sm font-semibold text-[#10233D] mb-1"
                        >
                          {t.scanner.nameLabel}
                        </label>
                        <input
                          id={`scan-name-${draft.key}`}
                          type="text"
                          disabled={draft.saved}
                          value={draft.name}
                          onChange={(e) => updateDraft(draft.key, { name: e.target.value })}
                          placeholder={t.scanner.missingVerifyPlaceholder}
                          className="w-full min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3 py-2 text-base"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`scan-dosage-${draft.key}`}
                          className="block text-sm font-semibold text-[#10233D] mb-1"
                        >
                          {t.scanner.dosageLabel}
                        </label>
                        <input
                          id={`scan-dosage-${draft.key}`}
                          type="text"
                          disabled={draft.saved}
                          value={draft.dosage}
                          onChange={(e) => updateDraft(draft.key, { dosage: e.target.value })}
                          placeholder={t.scanner.missingVerifyPlaceholder}
                          className="w-full min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3 py-2 text-base"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor={`scan-freq-${draft.key}`}
                          className="block text-sm font-semibold text-[#10233D] mb-1"
                        >
                          {t.scanner.frequencyLabel}
                        </label>
                        <input
                          id={`scan-freq-${draft.key}`}
                          type="text"
                          disabled={draft.saved}
                          value={draft.frequency}
                          onChange={(e) => updateDraft(draft.key, { frequency: e.target.value })}
                          className="w-full min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3 py-2 text-base"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`scan-time-${draft.key}`}
                          className="block text-sm font-semibold text-[#10233D] mb-1"
                        >
                          {t.scanner.primaryTimeLabel}
                        </label>
                        <input
                          id={`scan-time-${draft.key}`}
                          type="time"
                          disabled={draft.saved}
                          value={draft.scheduledTimes[0] || '08:00'}
                          onChange={(e) =>
                            updateDraft(draft.key, {
                              scheduledTimes: [e.target.value, ...draft.scheduledTimes.slice(1)],
                            })
                          }
                          className="w-full min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3 py-2 text-base font-mono-code"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor={`scan-inst-${draft.key}`}
                        className="block text-sm font-semibold text-[#10233D] mb-1"
                      >
                        {t.scanner.instructionsLabel}
                      </label>
                      <textarea
                        id={`scan-inst-${draft.key}`}
                        rows={2}
                        disabled={draft.saved}
                        value={draft.instructions}
                        onChange={(e) => updateDraft(draft.key, { instructions: e.target.value })}
                        placeholder={t.scanner.instructionsPlaceholder}
                        className="w-full rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3 py-2 text-base"
                      />
                    </div>

                    {!draft.saved && canManage && (
                      <div className="space-y-3 pt-2 border-t border-[#E4DFD5]">
                        <label className="flex items-start gap-2.5 text-sm font-medium text-[#10233D] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={draft.verified}
                            onChange={(e) => updateDraft(draft.key, { verified: e.target.checked })}
                            className="h-5 w-5 mt-0.5 accent-[#1E6F5C]"
                          />
                          <span>{t.scanner.verifyCheckboxText}</span>
                        </label>

                        <button
                          type="button"
                          disabled={
                            !draft.verified ||
                            !draft.name.trim() ||
                            !draft.dosage.trim() ||
                            Boolean(duplicate) ||
                            savingKey === draft.key
                          }
                          onClick={() => void handleSaveDraft(draft)}
                          className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#1E6F5C] hover:bg-[#175849] text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
                        >
                          {savingKey === draft.key ? t.common.saving : t.scanner.saveVerifiedBtn}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
