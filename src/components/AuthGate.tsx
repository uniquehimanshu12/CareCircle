import { useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, HeartHandshake, KeyRound, Mail, Plus, ShieldCheck } from 'lucide-react';
import type { User } from 'firebase/auth';
import { signInWithGoogle, signOutUser } from '../firebase';
import { createCareCircle, joinCareCircleWithPasscode } from '../services/careCircleService';
import { COMMON_TIMEZONES, detectBrowserTimezone } from '../utils/schedule';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

const cleanAuthError = (msg: string): string => {
  return msg
    .replace(/singular-temple-x7cdj\.firebaseapp\.com/gi, 'CareCircle')
    .replace(/singular-temple-x7cdj/gi, 'CareCircle');
};

interface AuthGateProps {
  user: User | null;
  authLoading: boolean;
  onCircleReady: (circleId: string) => void;
}

export function AuthGate({ user, authLoading, onCircleReady }: AuthGateProps) {
  const { t } = useLanguage();

  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState('');
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [circleName, setCircleName] = useState('');
  const [elderName, setElderName] = useState('');
  const [elderAge, setElderAge] = useState('76');
  const [elderRelationship, setElderRelationship] = useState('Father');
  const [timezone, setTimezone] = useState(detectBrowserTimezone());
  const [notes, setNotes] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const [passcode, setPasscode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthError(err instanceof Error ? cleanAuthError(err.message) : t.auth.errGoogleSignIn);
    } finally {
      setSigningIn(false);
    }
  };

  const handleCreateCircle = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFormError('');

    if (circleName.trim().length < 2 || elderName.trim().length < 2) {
      setFormError(t.auth.errNamesRequired);
      return;
    }

    const parsedAge = Number(elderAge);
    if (Number.isNaN(parsedAge) || parsedAge < 1 || parsedAge > 130) {
      setFormError(t.auth.errValidAge);
      return;
    }

    setSubmitting(true);
    try {
      const circleId = await createCareCircle({
        user,
        name: circleName,
        elderName,
        elderAge: parsedAge,
        elderRelationship,
        timezone,
        primaryConditionNotes: notes,
        emergencyContactName: emergencyName,
        emergencyContactPhone: emergencyPhone,
      });
      onCircleReady(circleId);
    } catch (err) {
      setFormError(err instanceof Error ? cleanAuthError(err.message) : t.auth.errCreateFailed);
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinCircle = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFormError('');

    if (!passcode.trim()) {
      setFormError(t.auth.errPasscodeRequired);
      return;
    }

    setSubmitting(true);
    try {
      const joined = await joinCareCircleWithPasscode({ user, passcode });
      onCircleReady(joined.circleId);
    } catch (err) {
      setFormError(err instanceof Error ? cleanAuthError(err.message) : t.auth.errJoinFailed);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="h-9 w-9 mx-auto rounded-full border-2 border-[#1E6F5C] border-t-transparent animate-spin" />
          <p className="text-base font-medium text-[#334E68]">{t.nav.loadingProfile}</p>
        </div>
      </div>
    );
  }

  // Unauthenticated Landing & Sign-In Experience
  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#10233D] flex flex-col">
        <header className="border-b border-[#E4DFD5] bg-white/80 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#EBF5F1] border border-[#CBE5DB] flex items-center justify-center text-[#1E6F5C] shadow-xs">
                <HeartHandshake className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-xl font-bold tracking-tight text-[#10233D] whitespace-nowrap">
                  {t.common.appName}
                </span>
                <span className="hidden sm:inline-block text-xs font-semibold text-[#5B728A]">
                  · {t.common.tagline}
                </span>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#334E68]">
              <a href="#how-it-works" className="hover:text-[#10233D] whitespace-nowrap shrink-0">
                {t.auth.howItWorks}
              </a>
              <a href="#care-safety" className="hover:text-[#10233D] whitespace-nowrap shrink-0">
                {t.auth.safetyPrivacy}
              </a>
              <a href="#roles" className="hover:text-[#10233D] whitespace-nowrap shrink-0">
                {t.auth.familyRoles}
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <LanguageSwitcher compact />
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={signingIn}
                className="min-h-[44px] px-4 sm:px-5 py-2.5 rounded-lg bg-[#1E6F5C] hover:bg-[#175849] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 cursor-pointer"
              >
                {signingIn ? t.auth.signingIn : t.auth.signInGoogle}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <p className="text-sm font-semibold tracking-wide text-[#1E6F5C]">
                {t.common.tagline}
              </p>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#10233D] leading-[1.15]">
                {t.auth.heroTitle}
              </h1>
              <p className="text-lg text-[#334E68] leading-relaxed max-w-xl">
                {t.auth.heroDesc}
              </p>

              {authError && (
                <div
                  role="alert"
                  className="rounded-lg border border-[#FECDCA] bg-[#FEF3F2] px-4 py-3 text-sm text-[#B42318]"
                >
                  {authError}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={signingIn}
                  className="min-h-[48px] inline-flex items-center gap-2.5 px-6 py-3 rounded-lg bg-[#1E6F5C] hover:bg-[#175849] text-white text-base font-semibold transition-colors disabled:opacity-60 cursor-pointer"
                >
                  <span>{signingIn ? t.auth.connecting : t.auth.continueGoogle}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <span className="text-sm text-[#5B728A]">{t.auth.privateBadge}</span>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-full min-h-[320px] rounded-xl border border-[#E4DFD5] bg-white overflow-hidden">
                {!heroImgFailed ? (
                  <img
                    src="/src/assets/images/carecircle_hero_care_1794720465168.jpg"
                    alt={t.auth.heroAlt}
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-[#EBF5F1] flex flex-col items-center justify-center p-8 text-center">
                    <HeartHandshake className="h-12 w-12 text-[#1E6F5C] mb-3" aria-hidden="true" />
                    <p className="font-display text-lg font-semibold text-[#10233D]">
                      {t.auth.fallbackCardTitle}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <section id="how-it-works" className="mt-16 pt-12 border-t border-[#E4DFD5] grid grid-cols-1 md:grid-cols-3 gap-8">
            <div id="care-safety" className="space-y-2">
              <CheckCircle2 className="h-6 w-6 text-[#1E6F5C]" aria-hidden="true" />
              <h2 className="font-display text-lg font-semibold text-[#10233D]">
                {t.auth.feature1Title}
              </h2>
              <p className="text-base text-[#334E68] leading-relaxed">{t.auth.feature1Desc}</p>
            </div>
            <div className="space-y-2">
              <ShieldCheck className="h-6 w-6 text-[#1E6F5C]" aria-hidden="true" />
              <h2 className="font-display text-lg font-semibold text-[#10233D]">
                {t.auth.feature2Title}
              </h2>
              <p className="text-base text-[#334E68] leading-relaxed">{t.auth.feature2Desc}</p>
            </div>
            <div id="roles" className="space-y-2">
              <KeyRound className="h-6 w-6 text-[#D96B27]" aria-hidden="true" />
              <h2 className="font-display text-lg font-semibold text-[#10233D]">
                {t.auth.feature3Title}
              </h2>
              <p className="text-base text-[#334E68] leading-relaxed">{t.auth.feature3Desc}</p>
            </div>
          </section>
        </main>

        <footer className="border-t border-[#E4DFD5] bg-white py-6 px-6 mt-16">
          <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#5B728A]">
            <div className="flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-[#1E6F5C]" aria-hidden="true" />
              <span className="font-bold text-[#10233D]">{t.common.appName}</span>
              <span>— {t.common.tagline}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
              <span>{t.auth.supportContact}</span>
              <a
                href="mailto:unique.himanshu12@gmail.com"
                className="font-semibold text-[#1E6F5C] hover:underline"
              >
                unique.himanshu12@gmail.com
              </a>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Signed-in user with no CareCircle yet -> Onboarding Create or Join
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#10233D] py-10 px-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E4DFD5] pb-5 mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#EBF5F1] border border-[#CBE5DB] flex items-center justify-center text-[#1E6F5C] shadow-xs">
              <HeartHandshake className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-xl font-bold text-[#10233D]">
                  {t.common.appName}
                </span>
                <span className="hidden sm:inline-block text-xs font-semibold text-[#5B728A]">
                  · {t.common.tagline}
                </span>
              </div>
              <p className="text-xs text-[#5B728A] mt-0.5">
                {t.auth.signedInAs} {user.displayName || user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher compact />
            <button
              type="button"
              onClick={() => void signOutUser()}
              className="min-h-[42px] px-4 py-2 rounded-lg border border-[#E4DFD5] bg-white hover:bg-[#F3EFE8] text-sm font-medium text-[#334E68] cursor-pointer"
            >
              {t.common.signOut}
            </button>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-[#10233D]">
            {t.auth.onboardingTitle}
          </h1>
          <p className="mt-2 text-base text-[#334E68]">{t.auth.onboardingDesc}</p>
        </div>

        <div className="inline-flex flex-wrap p-1 rounded-lg bg-[#F3EFE8] border border-[#E4DFD5] mb-6 gap-1">
          <button
            type="button"
            onClick={() => {
              setMode('create');
              setFormError('');
            }}
            className={`min-h-[44px] px-5 py-2 rounded-md text-sm font-semibold transition-colors cursor-pointer ${
              mode === 'create'
                ? 'bg-white text-[#10233D] shadow-sm'
                : 'text-[#5B728A] hover:text-[#10233D]'
            }`}
          >
            {t.auth.tabCreate}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('join');
              setFormError('');
            }}
            className={`min-h-[44px] px-5 py-2 rounded-md text-sm font-semibold transition-colors cursor-pointer ${
              mode === 'join'
                ? 'bg-white text-[#10233D] shadow-sm'
                : 'text-[#5B728A] hover:text-[#10233D]'
            }`}
          >
            {t.auth.tabJoin}
          </button>
        </div>

        {formError && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-[#FECDCA] bg-[#FEF3F2] px-4 py-3 text-sm text-[#B42318]"
          >
            {formError}
          </div>
        )}

        {mode === 'create' ? (
          <form
            onSubmit={handleCreateCircle}
            className="rounded-xl border border-[#E4DFD5] bg-white p-6 sm:p-8 space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="onboard-circle-name" className="block text-sm font-semibold text-[#10233D] mb-1.5">
                  {t.auth.circleNameLabel}
                </label>
                <input
                  id="onboard-circle-name"
                  type="text"
                  required
                  value={circleName}
                  onChange={(e) => setCircleName(e.target.value)}
                  placeholder={t.auth.circleNamePlaceholder}
                  className="w-full min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2.5 text-base text-[#10233D]"
                />
              </div>
              <div>
                <label htmlFor="onboard-elder-name" className="block text-sm font-semibold text-[#10233D] mb-1.5">
                  {t.auth.elderNameLabel}
                </label>
                <input
                  id="onboard-elder-name"
                  type="text"
                  required
                  value={elderName}
                  onChange={(e) => setElderName(e.target.value)}
                  placeholder={t.auth.elderNamePlaceholder}
                  className="w-full min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2.5 text-base text-[#10233D]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label htmlFor="onboard-age" className="block text-sm font-semibold text-[#10233D] mb-1.5">
                  {t.auth.ageLabel}
                </label>
                <input
                  id="onboard-age"
                  type="number"
                  min={1}
                  max={130}
                  required
                  value={elderAge}
                  onChange={(e) => setElderAge(e.target.value)}
                  className="w-full min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2.5 text-base text-[#10233D] font-mono-code"
                />
              </div>
              <div>
                <label htmlFor="onboard-relationship" className="block text-sm font-semibold text-[#10233D] mb-1.5">
                  {t.auth.relationshipLabel}
                </label>
                <input
                  id="onboard-relationship"
                  type="text"
                  required
                  value={elderRelationship}
                  onChange={(e) => setElderRelationship(e.target.value)}
                  placeholder={t.auth.relationshipPlaceholder}
                  className="w-full min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2.5 text-base text-[#10233D]"
                />
              </div>
              <div>
                <label htmlFor="onboard-timezone" className="block text-sm font-semibold text-[#10233D] mb-1.5">
                  {t.auth.timezoneLabel}
                </label>
                <select
                  id="onboard-timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2.5 text-base text-[#10233D]"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="onboard-emerg-name" className="block text-sm font-semibold text-[#10233D] mb-1.5">
                  {t.auth.emergencyNameLabel}
                </label>
                <input
                  id="onboard-emerg-name"
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder={t.common.optional}
                  className="w-full min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2.5 text-base text-[#10233D]"
                />
              </div>
              <div>
                <label htmlFor="onboard-emerg-phone" className="block text-sm font-semibold text-[#10233D] mb-1.5">
                  {t.auth.emergencyPhoneLabel}
                </label>
                <input
                  id="onboard-emerg-phone"
                  type="text"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder={t.common.optional}
                  className="w-full min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2.5 text-base text-[#10233D]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="onboard-notes" className="block text-sm font-semibold text-[#10233D] mb-1.5">
                {t.auth.notesLabel}
              </label>
              <textarea
                id="onboard-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.auth.notesPlaceholder}
                className="w-full rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3.5 py-2.5 text-base text-[#10233D]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="min-h-[48px] inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#1E6F5C] hover:bg-[#175849] text-white text-base font-semibold transition-colors disabled:opacity-60 cursor-pointer"
              >
                <Plus className="h-5 w-5" aria-hidden="true" />
                <span>{submitting ? t.auth.creatingCircle : t.auth.createCircleBtn}</span>
              </button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={handleJoinCircle}
            className="rounded-xl border border-[#E4DFD5] bg-white p-6 sm:p-8 space-y-5"
          >
            <div>
              <label htmlFor="onboard-passcode" className="block text-sm font-semibold text-[#10233D] mb-1.5">
                {t.auth.passcodeLabel}
              </label>
              <input
                id="onboard-passcode"
                type="text"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value.toUpperCase())}
                placeholder={t.auth.passcodePlaceholder}
                className="w-full min-h-[48px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-4 py-3 text-lg font-mono-code tracking-wider text-[#10233D]"
              />
              <p className="mt-2 text-sm text-[#5B728A]">{t.auth.passcodeHelp}</p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="min-h-[48px] inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#1E6F5C] hover:bg-[#175849] text-white text-base font-semibold transition-colors disabled:opacity-60 cursor-pointer"
            >
              <KeyRound className="h-5 w-5" aria-hidden="true" />
              <span>{submitting ? t.auth.joining : t.auth.joinBtn}</span>
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-[#E4DFD5] flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-[#5B728A]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#10233D]">{t.common.appName}</span>
            <span>— {t.common.tagline}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>{t.auth.supportContact}</span>
            <a
              href="mailto:unique.himanshu12@gmail.com"
              className="font-medium text-[#1E6F5C] hover:underline"
            >
              unique.himanshu12@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
