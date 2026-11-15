import { Component, useCallback, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  Bell,
  BookOpen,
  Calendar,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Pill,
  ScanLine,
  Users,
  X,
} from 'lucide-react';
import { auth, signOutUser, testFirestoreConnection } from './firebase';
import {
  ensureUserProfile,
  subscribeActivities,
  subscribeAppointments,
  subscribeCareCircle,
  subscribeCircleMembers,
  subscribeCreatedInvites,
  subscribeDoseLogs,
  subscribeMedications,
  subscribeNotifications,
  subscribeUserMemberships,
  updateUserLargeTextPreference,
} from './services/careCircleService';
import { fetchMedicationRefills } from './services/apiService';
import type {
  ActivityEvent,
  Appointment,
  CareCircle,
  CircleMember,
  CircleRole,
  DoseLog,
  InviteCode,
  Medication,
  MedicationRefillInfo,
  NotificationItem,
  UserMembership,
  UserProfile,
} from './types';
import { useLanguage } from './i18n/LanguageContext';
import { LanguageWelcomeScreen } from './components/LanguageWelcomeScreen';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { AuthGate } from './components/AuthGate';
import { DashboardView } from './components/DashboardView';
import { MedicationsView } from './components/MedicationsView';
import { AppointmentsView } from './components/AppointmentsView';
import { CareCircleView } from './components/CareCircleView';
import { PrescriptionScannerView } from './components/PrescriptionScannerView';
import { SmartAssistantView } from './components/SmartAssistantView';
import { NotificationsView } from './components/NotificationsView';
import { HelpCentreView } from './components/HelpCentreView';
import { CareSummaryModal } from './components/CareSummaryModal';

export type AppTab =
  | 'dashboard'
  | 'medications'
  | 'appointments'
  | 'scanner'
  | 'assistant'
  | 'notifications'
  | 'circle'
  | 'help';

interface ErrorBoundaryState {
  errorMessage: string | null;
}

class CareCircleErrorBoundary extends Component<
  { children: ReactNode; title: string; reloadLabel: string },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { errorMessage: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { errorMessage: error.message || 'An unexpected error occurred.' };
  }

  render() {
    if (this.state.errorMessage) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6">
          <div className="max-w-lg w-full rounded-xl border border-[#FECDCA] bg-white p-8 space-y-4">
            <h1 className="font-display text-xl font-bold text-[#B42318]">
              {this.props.title}
            </h1>
            <p className="text-sm text-[#334E68] break-words">{this.state.errorMessage}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#1E6F5C] text-white text-sm font-semibold cursor-pointer"
            >
              {this.props.reloadLabel}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { hasChosenLanguage, syncAccountLanguage, t } = useLanguage();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [memberships, setMemberships] = useState<UserMembership[]>([]);
  const [membershipsLoaded, setMembershipsLoaded] = useState(false);

  const [activeCircleId, setActiveCircleId] = useState<string>('');
  const [circle, setCircle] = useState<CareCircle | null>(null);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [invites, setInvites] = useState<InviteCode[]>([]);
  const [refills, setRefills] = useState<Record<string, MedicationRefillInfo>>({});

  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Test Firestore connectivity on boot
  useEffect(() => {
    void testFirestoreConnection();
  }, []);

  // Auth listener & user profile/memberships subscriptions
  useEffect(() => {
    let unsubMemberships: (() => void) | undefined;
    const unsubAuth = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (unsubMemberships) {
        unsubMemberships();
        unsubMemberships = undefined;
      }

      if (!nextUser) {
        void syncAccountLanguage(null);
        setUserProfile(null);
        setMemberships([]);
        setMembershipsLoaded(false);
        setActiveCircleId('');
        setCircle(null);
        setRefills({});
        setAuthLoading(false);
        return;
      }

      try {
        void syncAccountLanguage(nextUser.uid);
        const profile = await ensureUserProfile(nextUser);
        setUserProfile(profile);
        unsubMemberships = subscribeUserMemberships(nextUser.uid, (list) => {
          setMemberships(list);
          setMembershipsLoaded(true);
          setActiveCircleId((prev) => {
            if (prev && list.some((m) => m.circleId === prev)) return prev;
            const saved = localStorage.getItem('carecircle_active_id');
            if (saved && list.some((m) => m.circleId === saved)) return saved;
            return list[0]?.circleId || '';
          });
        });
      } finally {
        setAuthLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubMemberships) unsubMemberships();
    };
  }, [syncAccountLanguage]);

  // Active CareCircle data subscriptions
  useEffect(() => {
    if (!user || !activeCircleId) {
      setCircle(null);
      setMembers([]);
      setMedications([]);
      setDoseLogs([]);
      setAppointments([]);
      setActivities([]);
      setNotifications([]);
      setInvites([]);
      setRefills({});
      return;
    }

    localStorage.setItem('carecircle_active_id', activeCircleId);

    const unsubs = [
      subscribeCareCircle(activeCircleId, setCircle),
      subscribeCircleMembers(activeCircleId, setMembers),
      subscribeMedications(activeCircleId, setMedications),
      subscribeDoseLogs(activeCircleId, setDoseLogs),
      subscribeAppointments(activeCircleId, setAppointments),
      subscribeActivities(activeCircleId, setActivities),
      subscribeNotifications(activeCircleId, setNotifications),
      subscribeCreatedInvites(user.uid, activeCircleId, setInvites),
    ];

    void fetchMedicationRefills(activeCircleId)
      .then((res) => setRefills(res.refills || {}))
      .catch(() => {});

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [user, activeCircleId]);

  const handleToggleLargeText = async () => {
    if (!user || !userProfile) return;
    const next = !userProfile.preferredLargeText;
    setUserProfile({ ...userProfile, preferredLargeText: next });
    await updateUserLargeTextPreference(user.uid, next);
  };

  const handleRefillUpdated = useCallback((refill: MedicationRefillInfo) => {
    setRefills((prev) => ({ ...prev, [refill.medicationId]: refill }));
  }, []);

  if (authLoading || (user && !membershipsLoaded)) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="h-9 w-9 mx-auto rounded-full border-2 border-[#1E6F5C] border-t-transparent animate-spin" />
          <p className="text-base font-medium text-[#334E68]">{t.nav.loadingProfile}</p>
        </div>
      </div>
    );
  }

  if (!user && !hasChosenLanguage) {
    return (
      <CareCircleErrorBoundary title={t.nav.boundaryTitle} reloadLabel={t.nav.reloadApp}>
        <LanguageWelcomeScreen />
      </CareCircleErrorBoundary>
    );
  }

  if (!user || memberships.length === 0) {
    return (
      <CareCircleErrorBoundary title={t.nav.boundaryTitle} reloadLabel={t.nav.reloadApp}>
        <AuthGate
          user={user}
          authLoading={authLoading}
          onCircleReady={(id) => {
            setActiveCircleId(id);
            setActiveTab('dashboard');
          }}
        />
      </CareCircleErrorBoundary>
    );
  }

  const activeMembership = memberships.find((m) => m.circleId === activeCircleId) || memberships[0];
  const currentMember = members.find((m) => m.userId === user.uid);
  const currentRole: CircleRole = currentMember?.role || activeMembership.role;
  const currentUserName =
    currentMember?.displayName || userProfile?.displayName || user.displayName || 'Care Member';

  const unreadNotifCount = notifications.filter((n) => !n.readBy.includes(user.uid)).length;
  const largeText = Boolean(userProfile?.preferredLargeText);

  const navItems: Array<{ id: AppTab; label: string; Icon: typeof LayoutDashboard }> = [
    { id: 'dashboard', label: t.nav.overview, Icon: LayoutDashboard },
    { id: 'medications', label: t.nav.medications, Icon: Pill },
    { id: 'appointments', label: t.nav.appointments, Icon: Calendar },
    { id: 'scanner', label: t.nav.scanner, Icon: ScanLine },
    { id: 'assistant', label: t.nav.assistant, Icon: MessageSquare },
    { id: 'notifications', label: t.nav.alerts, Icon: Bell },
    { id: 'circle', label: t.nav.careCircle, Icon: Users },
    { id: 'help', label: t.nav.helpCentre, Icon: BookOpen },
  ];

  return (
    <CareCircleErrorBoundary title={t.nav.boundaryTitle} reloadLabel={t.nav.reloadApp}>
      <div className={`min-h-screen bg-[#FAF8F5] text-[#10233D] flex ${largeText ? 'text-[18px]' : ''}`}>
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-[#E4DFD5] bg-white">
          <div className="px-6 py-5 border-b border-[#E4DFD5]">
            <div className="font-display text-xl font-bold text-[#10233D] tracking-tight">
              {t.common.appName}
            </div>
            <p className="text-xs text-[#5B728A] mt-0.5">{t.common.tagline}</p>
          </div>

          <div className="p-4 border-b border-[#E4DFD5]">
            <label
              htmlFor="desktop-active-circle-select"
              className="block text-xs font-semibold text-[#5B728A] mb-1.5"
            >
              {t.nav.activeProfile}
            </label>
            <select
              id="desktop-active-circle-select"
              value={activeCircleId}
              onChange={(e) => setActiveCircleId(e.target.value)}
              className="w-full min-h-[42px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3 py-2 text-sm font-semibold text-[#10233D]"
            >
              {memberships.map((m) => (
                <option key={m.circleId} value={m.circleId}>
                  {m.elderName} ({m.circleName})
                </option>
              ))}
            </select>
          </div>

          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto" aria-label="Primary navigation">
            {navItems.map(({ id, label, Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`w-full min-h-[46px] flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-left leading-snug transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#EBF5F1] text-[#1E6F5C]'
                      : 'text-[#334E68] hover:bg-[#FAF8F5] hover:text-[#10233D]'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span className="break-words">{label}</span>
                  </span>
                  {id === 'notifications' && unreadNotifCount > 0 && (
                    <span className="font-mono-code text-xs font-bold text-[#B54708] shrink-0">
                      {unreadNotifCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-[#E4DFD5] space-y-3">
            <LanguageSwitcher />

            <button
              type="button"
              onClick={() => void handleToggleLargeText()}
              className="w-full min-h-[42px] px-3.5 py-2 rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] hover:bg-[#F3EFE8] text-sm font-medium text-[#10233D] text-left cursor-pointer"
            >
              {largeText ? t.nav.textSizeLargeOn : t.nav.textSizeStandard}
            </button>

            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#10233D] truncate">
                  {currentUserName}
                </div>
                <div className="text-xs text-[#5B728A] truncate">{user.email}</div>
              </div>
              <button
                type="button"
                onClick={() => void signOutUser()}
                title={t.common.signOut}
                aria-label={t.common.signOut}
                className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-lg border border-[#E4DFD5] text-[#5B728A] hover:text-[#10233D] hover:bg-[#FAF8F5] cursor-pointer shrink-0"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Viewport */}
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
          {/* Mobile Header */}
          <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-[#E4DFD5] px-4 py-3 flex items-center justify-between gap-3">
            <span className="font-display text-lg font-bold text-[#10233D] whitespace-nowrap">
              {t.common.appName}
            </span>
            <div className="flex items-center gap-2">
              <LanguageSwitcher compact />
              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label={t.nav.toggleMenu}
                aria-expanded={mobileMenuOpen}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-[#E4DFD5] text-[#10233D] cursor-pointer"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </header>

          {mobileMenuOpen && (
            <div className="lg:hidden border-b border-[#E4DFD5] bg-white p-4 space-y-3">
              <label
                htmlFor="mobile-active-circle-select"
                className="block text-xs font-semibold text-[#5B728A]"
              >
                {t.nav.activeProfile}
              </label>
              <select
                id="mobile-active-circle-select"
                value={activeCircleId}
                onChange={(e) => setActiveCircleId(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-[#E4DFD5] bg-[#FAF8F5] px-3 py-2 text-sm font-semibold"
              >
                {memberships.map((m) => (
                  <option key={m.circleId} value={m.circleId}>
                    {m.elderName} ({m.circleName})
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                {navItems.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setActiveTab(id);
                      setMobileMenuOpen(false);
                    }}
                    className={`min-h-[46px] flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-left leading-snug ${
                      activeTab === id
                        ? 'bg-[#EBF5F1] text-[#1E6F5C]'
                        : 'bg-[#FAF8F5] text-[#334E68]'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E4DFD5]">
                <button
                  type="button"
                  onClick={() => void handleToggleLargeText()}
                  className="min-h-[42px] px-3 py-1.5 rounded-lg border border-[#E4DFD5] text-xs font-medium"
                >
                  {largeText ? t.nav.largeTextOnShort : t.nav.largeTextOffShort}
                </button>
                <button
                  type="button"
                  onClick={() => void signOutUser()}
                  className="min-h-[42px] px-3 py-1.5 rounded-lg border border-[#E4DFD5] text-xs font-medium text-[#B42318]"
                >
                  {t.common.signOut}
                </button>
              </div>
            </div>
          )}

          {/* Workspace Content */}
          <main className="flex-1 mx-auto w-full max-w-6xl px-5 sm:px-8 py-8">
            {!circle ? (
              <div className="rounded-xl border border-[#E4DFD5] bg-white p-10 text-center text-base text-[#5B728A]">
                {t.nav.loadingProfile}
              </div>
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <DashboardView
                    circle={circle}
                    currentRole={currentRole}
                    currentUserId={user.uid}
                    currentUserName={currentUserName}
                    medications={medications}
                    doseLogs={doseLogs}
                    appointments={appointments}
                    activities={activities}
                    members={members}
                    refills={refills}
                    onOpenSummary={() => setShowSummaryModal(true)}
                    onNavigate={(tab) => setActiveTab(tab)}
                  />
                )}

                {activeTab === 'medications' && (
                  <MedicationsView
                    circle={circle}
                    currentRole={currentRole}
                    currentUserId={user.uid}
                    currentUserName={currentUserName}
                    medications={medications}
                    doseLogs={doseLogs}
                    refills={refills}
                    onRefillUpdated={handleRefillUpdated}
                  />
                )}

                {activeTab === 'appointments' && (
                  <AppointmentsView
                    circle={circle}
                    currentRole={currentRole}
                    currentUserId={user.uid}
                    currentUserName={currentUserName}
                    appointments={appointments}
                  />
                )}

                {activeTab === 'scanner' && (
                  <PrescriptionScannerView
                    circle={circle}
                    currentRole={currentRole}
                    currentUserId={user.uid}
                    currentUserName={currentUserName}
                    medications={medications}
                    onSaved={() => setActiveTab('medications')}
                  />
                )}

                {activeTab === 'assistant' && (
                  <SmartAssistantView
                    circle={circle}
                    medications={medications}
                    doseLogs={doseLogs}
                    appointments={appointments}
                    activities={activities}
                  />
                )}

                {activeTab === 'notifications' && (
                  <NotificationsView
                    circle={circle}
                    currentRole={currentRole}
                    currentUserId={user.uid}
                    currentUserName={currentUserName}
                    members={members}
                    medications={medications}
                    doseLogs={doseLogs}
                    appointments={appointments}
                    notifications={notifications}
                    refills={refills}
                  />
                )}

                {activeTab === 'circle' && (
                  <CareCircleView
                    user={user}
                    circle={circle}
                    currentRole={currentRole}
                    members={members}
                    invites={invites}
                    activities={activities}
                    largeText={largeText}
                    onToggleLargeText={handleToggleLargeText}
                    onOpenSummary={() => setShowSummaryModal(true)}
                    onSwitchCircle={(id) => {
                      setActiveCircleId(id);
                      setActiveTab('dashboard');
                    }}
                  />
                )}

                {activeTab === 'help' && (
                  <HelpCentreView onNavigate={(tab) => setActiveTab(tab)} />
                )}

                <CareSummaryModal
                  open={showSummaryModal}
                  onClose={() => setShowSummaryModal(false)}
                  circle={circle}
                  currentRole={currentRole}
                  medications={medications}
                  doseLogs={doseLogs}
                  appointments={appointments}
                  activities={activities}
                />
              </>
            )}
          </main>
        </div>
      </div>
    </CareCircleErrorBoundary>
  );
}
