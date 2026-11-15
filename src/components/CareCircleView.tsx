import { useEffect, useState, type FormEvent } from 'react';
import {
  ClipboardList,
  Copy,
  KeyRound,
  PhoneCall,
  Plus,
  Printer,
  Settings2,
  Shield,
  Trash2,
  Users,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import type {
  ActivityEvent,
  CareCircle,
  CircleMember,
  CircleRole,
  InviteCode,
} from '../types';
import { COMMON_TIMEZONES } from '../utils/schedule';
import {
  createCareCircle,
  createInviteCode,
  extractHandoverNotes,
  joinCareCircleWithPasscode,
  postHandoverNote,
  removeCircleMember,
  toggleInviteCodeActive,
  updateCareCircleProfile,
  updateMemberNotificationPrefs,
  updateMemberRole,
} from '../services/careCircleService';
import { useLanguage } from '../i18n/LanguageContext';
import {
  formatCategoryLabelLocalized,
  formatFirestoreTimestampLocalized,
  formatNumberLocalized,
  formatRoleLabelLocalized,
} from '../i18n/locales';
import { LanguageSwitcher } from './LanguageSwitcher';

interface CareCircleViewProps {
  user: User;
  circle: CareCircle;
  currentRole: CircleRole;
  members: CircleMember[];
  invites: InviteCode[];
  activities: ActivityEvent[];
  largeText: boolean;
  onToggleLargeText: () => Promise<void>;
  onOpenSummary: () => void;
  onSwitchCircle: (circleId: string) => void;
}

export function CareCircleView({
  user,
  circle,
  currentRole,
  members,
  invites,
  activities,
  largeText,
  onToggleLargeText,
  onOpenSummary,
  onSwitchCircle,
}: CareCircleViewProps) {
  const { lang, t } = useLanguage();
  const canManage = currentRole === 'primary_caregiver' || currentRole === 'caretaker';
  const isPrimary = currentRole === 'primary_caregiver';

  const [name, setName] = useState(circle.name);
  const [elderName, setElderName] = useState(circle.elderName);
  const [elderAge, setElderAge] = useState(String(circle.elderAge));
  const [elderRelationship, setElderRelationship] = useState(circle.elderRelationship);
  const [timezone, setTimezone] = useState(circle.timezone);
  const [notes, setNotes] = useState(circle.primaryConditionNotes);
  const [emergencyName, setEmergencyName] = useState(circle.emergencyContactName);
  const [emergencyPhone, setEmergencyPhone] = useState(circle.emergencyContactPhone);

  useEffect(() => {
    setName(circle.name);
    setElderName(circle.elderName);
    setElderAge(String(circle.elderAge));
    setElderRelationship(circle.elderRelationship);
    setTimezone(circle.timezone);
    setNotes(circle.primaryConditionNotes);
    setEmergencyName(circle.emergencyContactName);
    setEmergencyPhone(circle.emergencyContactPhone);
  }, [
    circle.id,
    circle.name,
    circle.elderName,
    circle.elderAge,
    circle.elderRelationship,
    circle.timezone,
    circle.primaryConditionNotes,
    circle.emergencyContactName,
    circle.emergencyContactPhone,
  ]);

  const [inviteRole, setInviteRole] = useState<CircleRole>('family_member');
  const [joinPasscode, setJoinPasscode] = useState('');
  const [copiedCode, setCopiedCode] = useState('');

  const [showNewCircle, setShowNewCircle] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');
  const [newElderName, setNewElderName] = useState('');
  const [newElderAge, setNewElderAge] = useState('75');

  const [handoverDraft, setHandoverDraft] = useState('');
  const [postingHandover, setPostingHandover] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const currentMember = members.find((m) => m.userId === user.uid);
  const actorName = currentMember?.displayName || user.displayName || 'Caregiver';
  const handoverNotes = extractHandoverNotes(activities);
  const sanitizedTel = circle.emergencyContactPhone.replace(/[^\d+]/g, '');

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMsg('');
    const parsedAge = Number(elderAge);
    if (Number.isNaN(parsedAge) || parsedAge < 1 || parsedAge > 130) {
      setError(t.circle.errInvalidProfile);
      return;
    }

    setBusy(true);
    try {
      await updateCareCircleProfile({
        circleId: circle.id,
        updates: {
          name,
          elderName,
          elderAge: parsedAge,
          elderRelationship,
          timezone,
          primaryConditionNotes: notes,
          emergencyContactName: emergencyName,
          emergencyContactPhone: emergencyPhone,
        },
        actorId: user.uid,
        actorName,
        actorRole: currentRole,
      });
      setStatusMsg(t.circle.msgProfileUpdated);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.circle.errUpdateProfile);
    } finally {
      setBusy(false);
    }
  };

  const handleCreateInvite = async () => {
    setError('');
    setStatusMsg('');
    setBusy(true);
    try {
      const code = await createInviteCode({
        circle,
        role: inviteRole,
        actorId: user.uid,
        actorName,
        actorRole: currentRole,
      });
      setStatusMsg(
        `${t.circle.msgPasscodeGenerated} ${code} (${formatRoleLabelLocalized(inviteRole, lang)})`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t.circle.errGenerateInvite);
    } finally {
      setBusy(false);
    }
  };

  const handleJoinAnother = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMsg('');
    if (!joinPasscode.trim()) return;
    setBusy(true);
    try {
      const joined = await joinCareCircleWithPasscode({ user, passcode: joinPasscode });
      setJoinPasscode('');
      setStatusMsg(`${t.circle.msgJoinedCircle} ${joined.circleName}`);
      onSwitchCircle(joined.circleId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.circle.errJoinCircle);
    } finally {
      setBusy(false);
    }
  };

  const handleCreateNewCircle = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newCircleName.trim() || !newElderName.trim()) return;
    setBusy(true);
    try {
      const newId = await createCareCircle({
        user,
        name: newCircleName,
        elderName: newElderName,
        elderAge: Number(newElderAge) || 75,
        elderRelationship: 'Family',
        timezone: circle.timezone,
        primaryConditionNotes: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
      });
      setShowNewCircle(false);
      setNewCircleName('');
      setNewElderName('');
      onSwitchCircle(newId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.circle.errCreateCircle);
    } finally {
      setBusy(false);
    }
  };

  const handlePostHandover = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMsg('');
    if (!handoverDraft.trim()) {
      setError(t.circle.handoverRequired);
      return;
    }
    setPostingHandover(true);
    try {
      await postHandoverNote({
        circleId: circle.id,
        actorId: user.uid,
        actorName,
        actorRole: currentRole,
        note: handoverDraft,
      });
      setHandoverDraft('');
      setStatusMsg(t.circle.handoverSaved);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.unknownError);
    } finally {
      setPostingHandover(false);
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2000);
    } catch {
      setCopiedCode('');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#10233D]">{t.circle.title}</h1>
          <p className="mt-1 text-base text-[#334E68]">
            {t.circle.subtitle} ({circle.elderName})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canManage && (
            <button
              type="button"
              onClick={onOpenSummary}
              className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1E6F5C] hover:bg-[#175849] text-white text-sm font-semibold cursor-pointer"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              <span>{t.circle.careSummaryBtn}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowNewCircle((v) => !v)}
            className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#E4DFD5] bg-white hover:bg-[#FAF8F5] text-sm font-semibold text-[#10233D] cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>{t.circle.newCircleBtn}</span>
          </button>
        </div>
      </div>

      {/* Personal Accessibility & Language Settings */}
      <section className="rounded-xl border border-[#E4DFD5] bg-white p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E4DFD5] pb-3">
          <Settings2 className="h-5 w-5 text-[#1E6F5C]" aria-hidden="true" />
          <div>
            <h2 className="font-display text-lg font-bold text-[#10233D]">
              {t.circle.preferencesTitle}
            </h2>
            <p className="text-xs sm:text-sm text-[#5B728A]">{t.circle.preferencesDesc}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
          <div className="space-y-1.5">
            <div className="text-sm font-semibold text-[#10233D]">
              {t.circle.languageSettingLabel}
            </div>
            <LanguageSwitcher />
          </div>

          <div className="space-y-1.5">
            <div className="text-sm font-semibold text-[#10233D]">
              {t.circle.largeTextSettingLabel}
            </div>
            <button
              type="button"
              onClick={() => void onToggleLargeText()}
              className={`w-full min-h-[46px] px-4 py-2.5 rounded-lg border text-sm font-semibold text-left transition-colors cursor-pointer ${
                largeText
                  ? 'border-[#1E6F5C] bg-[#EBF5F1] text-[#1E6F5C]'
                  : 'border-[#E4DFD5] bg-[#FAF8F5] text-[#10233D] hover:bg-[#F3EFE8]'
              }`}
            >
              {largeText ? t.nav.textSizeLargeOn : t.nav.textSizeStandard}
            </button>
          </div>
        </div>
      </section>

      {statusMsg && (
        <div className="rounded-lg border border-[#CBE5DB] bg-[#EBF5F1] px-4 py-3 text-sm font-medium text-[#1E6F5C]">
          {statusMsg}
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

      {showNewCircle && (
        <form
          onSubmit={handleCreateNewCircle}
          className="rounded-xl border border-[#E4DFD5] bg-white p-6 space-y-4"
        >
          <h2 className="font-display text-lg font-bold text-[#10233D]">
            {t.circle.newCircleTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="text"
              required
              aria-label={t.circle.circleNameLabel}
              value={newCircleName}
              onChange={(e) => setNewCircleName(e.target.value)}
              placeholder={t.circle.circleNameLabel}
              className="min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2 text-base"
            />
            <input
              type="text"
              required
              aria-label={t.circle.elderNameLabel}
              value={newElderName}
              onChange={(e) => setNewElderName(e.target.value)}
              placeholder={t.circle.elderNameLabel}
              className="min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2 text-base"
            />
            <input
              type="number"
              min={1}
              max={130}
              required
              aria-label={t.circle.ageLabel}
              value={newElderAge}
              onChange={(e) => setNewElderAge(e.target.value)}
              placeholder={t.circle.ageLabel}
              className="min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2 text-base font-mono-code"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={busy}
              className="min-h-[44px] px-5 py-2 rounded-lg bg-[#1E6F5C] text-white text-sm font-semibold cursor-pointer"
            >
              {t.circle.createBtn}
            </button>
            <button
              type="button"
              onClick={() => setShowNewCircle(false)}
              className="min-h-[44px] px-4 py-2 rounded-lg border border-[#E4DFD5] text-sm text-[#5B728A] cursor-pointer"
            >
              {t.common.cancel}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Healthcare Profile Form */}
        <form
          onSubmit={handleSaveProfile}
          className="lg:col-span-7 rounded-xl border border-[#E4DFD5] bg-white p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E4DFD5] pb-3">
            <h2 className="font-display text-lg font-bold text-[#10233D]">
              {t.circle.profileTitle}
            </h2>
            {sanitizedTel && (
              <a
                href={`tel:${sanitizedTel}`}
                className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FEF3F2] border border-[#FECDCA] text-xs font-bold text-[#B42318]"
              >
                <PhoneCall className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {t.circle.callEmergencyBtn}: {circle.emergencyContactPhone}
                </span>
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="profile-circle-name" className="block text-sm font-semibold text-[#10233D] mb-1">
                {t.circle.profileNameLabel}
              </label>
              <input
                id="profile-circle-name"
                type="text"
                disabled={!canManage}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2 text-base disabled:opacity-70"
              />
            </div>
            <div>
              <label htmlFor="profile-elder-name" className="block text-sm font-semibold text-[#10233D] mb-1">
                {t.circle.elderLabel}
              </label>
              <input
                id="profile-elder-name"
                type="text"
                disabled={!canManage}
                value={elderName}
                onChange={(e) => setElderName(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2 text-base disabled:opacity-70"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="profile-age" className="block text-sm font-semibold text-[#10233D] mb-1">
                {t.circle.ageShortLabel}
              </label>
              <input
                id="profile-age"
                type="number"
                disabled={!canManage}
                value={elderAge}
                onChange={(e) => setElderAge(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2 text-base font-mono-code disabled:opacity-70"
              />
            </div>
            <div>
              <label htmlFor="profile-rel" className="block text-sm font-semibold text-[#10233D] mb-1">
                {t.circle.relationshipLabel}
              </label>
              <input
                id="profile-rel"
                type="text"
                disabled={!canManage}
                value={elderRelationship}
                onChange={(e) => setElderRelationship(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2 text-base disabled:opacity-70"
              />
            </div>
            <div>
              <label htmlFor="profile-tz" className="block text-sm font-semibold text-[#10233D] mb-1">
                {t.circle.timezoneLabel}
              </label>
              <select
                id="profile-tz"
                disabled={!canManage}
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2 text-base disabled:opacity-70"
              >
                {!COMMON_TIMEZONES.includes(timezone) && (
                  <option value={timezone}>{timezone}</option>
                )}
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="profile-emerg-name" className="block text-sm font-semibold text-[#10233D] mb-1">
                {t.circle.emergencyNameLabel}
              </label>
              <input
                id="profile-emerg-name"
                type="text"
                disabled={!canManage}
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2 text-base disabled:opacity-70"
              />
            </div>
            <div>
              <label htmlFor="profile-emerg-phone" className="block text-sm font-semibold text-[#10233D] mb-1">
                {t.circle.emergencyPhoneLabel}
              </label>
              <input
                id="profile-emerg-phone"
                type="text"
                disabled={!canManage}
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2 text-base disabled:opacity-70"
              />
            </div>
          </div>

          <div>
            <label htmlFor="profile-notes" className="block text-sm font-semibold text-[#10233D] mb-1">
              {t.circle.careNotesLabel}
            </label>
            <textarea
              id="profile-notes"
              rows={3}
              disabled={!canManage}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2 text-base disabled:opacity-70"
            />
          </div>

          {canManage && (
            <button
              type="submit"
              disabled={busy}
              className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#1E6F5C] hover:bg-[#175849] text-white text-sm font-semibold cursor-pointer"
            >
              {busy ? t.common.saving : t.circle.saveProfileBtn}
            </button>
          )}
        </form>

        {/* Invites & Join by Passcode */}
        <div className="lg:col-span-5 space-y-6">
          {canManage && (
            <div className="rounded-xl border border-[#E4DFD5] bg-white p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E4DFD5] pb-3">
                <KeyRound className="h-5 w-5 text-[#1E6F5C]" aria-hidden="true" />
                <h2 className="font-display text-lg font-bold text-[#10233D]">
                  {t.circle.inviteTitle}
                </h2>
              </div>
              <p className="text-sm text-[#334E68]">{t.circle.inviteDesc}</p>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  aria-label={t.circle.inviteTitle}
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as CircleRole)}
                  className="flex-1 min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3 py-2 text-sm font-medium text-[#10233D]"
                >
                  <option value="family_member">{t.circle.roleOptFamily}</option>
                  <option value="caretaker">{t.circle.roleOptCaretaker}</option>
                  <option value="elder">{t.circle.roleOptElder}</option>
                </select>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleCreateInvite()}
                  className="min-h-[44px] px-4 py-2 rounded-lg bg-[#1E6F5C] hover:bg-[#175849] text-white text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {t.circle.generatePasscodeBtn}
                </button>
              </div>

              {invites.length > 0 && (
                <div className="divide-y divide-[#E4DFD5] pt-2">
                  {invites.map((inv) => (
                    <div
                      key={inv.code}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-mono-code text-sm font-semibold text-[#10233D]">
                          {inv.code}
                        </div>
                        <div className="text-xs text-[#5B728A]">
                          {formatRoleLabelLocalized(inv.role, lang)} ·{' '}
                          {inv.active ? t.common.active : t.circle.revoked}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void copyCode(inv.code)}
                          className="min-h-[38px] inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#E4DFD5] text-xs font-medium text-[#10233D] hover:bg-[#FAF8F5] cursor-pointer"
                        >
                          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{copiedCode === inv.code ? t.circle.copied : t.circle.copy}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void toggleInviteCodeActive(inv.code, !inv.active)}
                          className="min-h-[38px] px-2.5 py-1 rounded border border-[#E4DFD5] text-xs font-medium text-[#334E68] hover:bg-[#FAF8F5] cursor-pointer"
                        >
                          {inv.active ? t.circle.revoke : t.circle.reactivate}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <form
            onSubmit={handleJoinAnother}
            className="rounded-xl border border-[#E4DFD5] bg-white p-6 space-y-4"
          >
            <h2 className="font-display text-lg font-bold text-[#10233D]">
              {t.circle.joinAnotherTitle}
            </h2>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                aria-label={t.circle.joinAnotherPlaceholder}
                value={joinPasscode}
                onChange={(e) => setJoinPasscode(e.target.value.toUpperCase())}
                placeholder={t.circle.joinAnotherPlaceholder}
                className="flex-1 min-w-[160px] min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2 text-sm font-mono-code"
              />
              <button
                type="submit"
                disabled={busy}
                className="min-h-[44px] px-4 py-2 rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] hover:bg-[#F3EFE8] text-sm font-semibold text-[#10233D] whitespace-nowrap cursor-pointer"
              >
                {t.circle.joinCircleBtn}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Caregiver Handover Notes */}
      <section className="rounded-xl border border-[#E4DFD5] bg-white p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E4DFD5] pb-3">
          <ClipboardList className="h-5 w-5 text-[#1E6F5C]" aria-hidden="true" />
          <div>
            <h2 className="font-display text-lg font-bold text-[#10233D]">
              {t.circle.handoverTitle}
            </h2>
            <p className="text-xs sm:text-sm text-[#5B728A]">{t.circle.handoverDesc}</p>
          </div>
        </div>

        {canManage && (
          <form onSubmit={handlePostHandover} className="space-y-3">
            <div>
              <textarea
                rows={2}
                maxLength={289}
                aria-label={t.circle.handoverTitle}
                value={handoverDraft}
                onChange={(e) => setHandoverDraft(e.target.value)}
                placeholder={t.circle.handoverPlaceholder}
                className="w-full rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2.5 text-base text-[#10233D]"
              />
              <div className="mt-1 text-right text-xs font-mono-code text-[#5B728A]">
                {formatNumberLocalized(handoverDraft.length, lang)} / {formatNumberLocalized(289, lang)}{' '}
                {t.circle.handoverCharCount}
              </div>
            </div>
            <button
              type="submit"
              disabled={postingHandover}
              className="min-h-[44px] px-5 py-2 rounded-lg bg-[#1E6F5C] hover:bg-[#175849] text-white text-sm font-semibold disabled:opacity-60 cursor-pointer"
            >
              {postingHandover ? t.common.saving : t.circle.handoverSubmitBtn}
            </button>
          </form>
        )}

        {handoverNotes.length === 0 ? (
          <p className="text-sm text-[#5B728A] py-2">{t.circle.handoverEmpty}</p>
        ) : (
          <div className="divide-y divide-[#E4DFD5]">
            {handoverNotes.slice(0, 10).map((h) => (
              <div key={h.id} className="py-3 space-y-1">
                <p className="text-sm sm:text-base text-[#10233D]">{h.note}</p>
                <p className="text-xs text-[#5B728A]">
                  {h.actorName} · {formatRoleLabelLocalized(h.actorRole, lang)}
                  {h.createdAt ? ` · ${formatFirestoreTimestampLocalized(h.createdAt, lang)}` : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Member Directory & Notification Preferences */}
      <section className="rounded-xl border border-[#E4DFD5] bg-white p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E4DFD5] pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#1E6F5C]" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold text-[#10233D]">
              {t.circle.membersTitle} ({formatNumberLocalized(members.length, lang)})
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-[#5B728A]">
            <Shield className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t.auth.privateBadge}</span>
          </span>
        </div>

        <div className="divide-y divide-[#E4DFD5]">
          {members.map((m) => {
            const isSelf = m.userId === user.uid;
            const isCircleOwner = m.userId === circle.ownerId;
            return (
              <div
                key={m.userId}
                className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div>
                  <div className="font-semibold text-[#10233D]">
                    {m.displayName} {isSelf ? t.circle.youSuffix : ''}
                  </div>
                  <div className="text-sm text-[#5B728A]">
                    {m.email} · {formatRoleLabelLocalized(m.role, lang)}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {isSelf && (
                    <label className="inline-flex items-center gap-2 text-sm text-[#334E68] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={m.notifyEmail}
                        onChange={(e) =>
                          void updateMemberNotificationPrefs({
                            circleId: circle.id,
                            userId: user.uid,
                            notifyEmail: e.target.checked,
                            notifyUpcomingMed: m.notifyUpcomingMed,
                            notifyMissedDose: m.notifyMissedDose,
                            notifyAppointments: m.notifyAppointments,
                          })
                        }
                        className="h-4 w-4 accent-[#1E6F5C]"
                      />
                      <span>{t.circle.receiveEmailAlerts}</span>
                    </label>
                  )}

                  {isPrimary && !isCircleOwner && (
                    <>
                      <select
                        aria-label={`${m.displayName} role`}
                        value={m.role}
                        onChange={(e) =>
                          void updateMemberRole({
                            circleId: circle.id,
                            targetUserId: m.userId,
                            targetName: m.displayName,
                            newRole: e.target.value as CircleRole,
                            actorId: user.uid,
                            actorName,
                            actorRole: currentRole,
                          })
                        }
                        className="min-h-[42px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3 py-1.5 text-sm text-[#10233D]"
                      >
                        <option value="caretaker">{formatRoleLabelLocalized('caretaker', lang)}</option>
                        <option value="family_member">
                          {formatRoleLabelLocalized('family_member', lang)}
                        </option>
                        <option value="elder">{formatRoleLabelLocalized('elder', lang)}</option>
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          void removeCircleMember({
                            circleId: circle.id,
                            targetUserId: m.userId,
                            targetName: m.displayName,
                            actorId: user.uid,
                            actorName,
                            actorRole: currentRole,
                          })
                        }
                        className="min-h-[42px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E4DFD5] text-sm text-[#B42318] hover:bg-[#FEF3F2] cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span>{t.circle.removeBtn}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Activity History */}
      <section className="rounded-xl border border-[#E4DFD5] bg-white p-6 space-y-3">
        <h2 className="font-display text-lg font-bold text-[#10233D] border-b border-[#E4DFD5] pb-3">
          {t.circle.activityTitle}
        </h2>
        {activities.length === 0 ? (
          <p className="text-sm text-[#5B728A] py-4">{t.circle.activityEmpty}</p>
        ) : (
          <div className="divide-y divide-[#E4DFD5]">
            {activities.slice(0, 25).map((act) => (
              <div key={act.id} className="py-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <span className="text-sm text-[#10233D]">{act.summary}</span>
                <span className="text-xs text-[#5B728A] shrink-0">
                  {act.actorName} · {formatCategoryLabelLocalized(act.category, lang)}
                  {act.createdAt ? ` · ${formatFirestoreTimestampLocalized(act.createdAt, lang)}` : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
