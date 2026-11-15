import type { AppLanguage } from '../types';

export interface TranslationDictionary {
  common: {
    appName: string;
    tagline: string;
    english: string;
    hindi: string;
    languageLabel: string;
    save: string;
    saving: string;
    cancel: string;
    edit: string;
    delete: string;
    confirmDelete: string;
    close: string;
    print: string;
    loading: string;
    optional: string;
    signOut: string;
    requiredMark: string;
    backToOverview: string;
    yes: string;
    no: string;
    active: string;
    paused: string;
    unknownError: string;
  };
  welcome: {
    heading: string;
    subheading: string;
    englishButton: string;
    hindiButton: string;
    helperNote: string;
    tagline: string;
  };
  auth: {
    howItWorks: string;
    safetyPrivacy: string;
    familyRoles: string;
    signInGoogle: string;
    signingIn: string;
    heroTitle: string;
    heroDesc: string;
    continueGoogle: string;
    connecting: string;
    privateBadge: string;
    heroAlt: string;
    fallbackCardTitle: string;
    feature1Title: string;
    feature1Desc: string;
    feature2Title: string;
    feature2Desc: string;
    feature3Title: string;
    feature3Desc: string;
    signedInAs: string;
    onboardingTitle: string;
    onboardingDesc: string;
    tabCreate: string;
    tabJoin: string;
    circleNameLabel: string;
    circleNamePlaceholder: string;
    elderNameLabel: string;
    elderNamePlaceholder: string;
    ageLabel: string;
    relationshipLabel: string;
    relationshipPlaceholder: string;
    timezoneLabel: string;
    emergencyNameLabel: string;
    emergencyPhoneLabel: string;
    notesLabel: string;
    notesPlaceholder: string;
    creatingCircle: string;
    createCircleBtn: string;
    passcodeLabel: string;
    passcodePlaceholder: string;
    passcodeHelp: string;
    joining: string;
    joinBtn: string;
    errNamesRequired: string;
    errValidAge: string;
    errPasscodeRequired: string;
    errGoogleSignIn: string;
    errCreateFailed: string;
    errJoinFailed: string;
    changeLanguage: string;
    supportContact: string;
    supportAssistance: string;
  };
  nav: {
    activeProfile: string;
    overview: string;
    medications: string;
    appointments: string;
    scanner: string;
    assistant: string;
    alerts: string;
    careCircle: string;
    helpCentre: string;
    textSizeLargeOn: string;
    textSizeStandard: string;
    largeTextOnShort: string;
    largeTextOffShort: string;
    loadingProfile: string;
    boundaryTitle: string;
    reloadApp: string;
    toggleMenu: string;
    languageSwitcherAria: string;
  };
  speech: {
    listen: string;
    pause: string;
    resume: string;
    stop: string;
    speaking: string;
    paused: string;
    unsupported: string;
    noHindiVoiceNote: string;
  };
  dashboard: {
    localTime: string;
    greetingMorning: string;
    greetingAfternoon: string;
    greetingEvening: string;
    caringFor: string;
    yearsOld: string;
    yourRole: string;
    addMedication: string;
    askAssistant: string;
    printSummary: string;
    helpGuideBtn: string;
    kpiTakenTitle: string;
    kpiNoDosesToday: string;
    kpiAllTaken: string;
    kpiRemainingToday: string;
    kpiUnconfirmedTitle: string;
    kpiAwaitingConfirm: string;
    kpiNoUnconfirmed: string;
    kpiAdherenceTitle: string;
    kpiTakenLabel: string;
    kpiUnconfirmedLabel: string;
    kpiNextApptTitle: string;
    kpiNoneScheduled: string;
    kpiAddInAppts: string;
    todayScheduleTitle: string;
    todayScheduleSubtitle: string;
    manageAllMeds: string;
    emptyScheduleTitle: string;
    emptyScheduleDesc: string;
    addFirstMed: string;
    scanPrescription: string;
    updatedBy: string;
    notePrefix: string;
    markTaken: string;
    markUnconfirmed: string;
    confirmMissed: string;
    upcomingApptsTitle: string;
    viewAll: string;
    noUpcomingAppts: string;
    scheduleApptBtn: string;
    todayBadge: string;
    tomorrowBadge: string;
    recentActivityTitle: string;
    recentActivitySub: string;
    emptyActivity: string;
    careTeamTitle: string;
    manageCircle: string;
    emailAlertsOn: string;
    emailAlertsOff: string;
    emergencyCardTitle: string;
    noEmergencyContact: string;
    callNow: string;
    editContact: string;
    handoverTitle: string;
    noHandoverNotes: string;
    viewAllHandovers: string;
    refillWarningTitle: string;
    refillDaysLeft: string;
    listenTodaySummary: string;
    todaySpeechPrefix: string;
    errUpdateDose: string;
  };
  chart: {
    title: string;
    subtitle: string;
    weeklyRate: string;
    dueLabel: string;
    takenLegend: string;
    unconfirmedLegend: string;
    missedLegend: string;
  };
  medications: {
    title: string;
    subtitle: string;
    tabList: string;
    tabHistory: string;
    addBtn: string;
    formEditTitle: string;
    formAddTitle: string;
    nameLabel: string;
    namePlaceholder: string;
    duplicateInline: string;
    dosageLabel: string;
    dosagePlaceholder: string;
    frequencyLabel: string;
    freqOnce: string;
    freqTwice: string;
    freqThree: string;
    freqWeekly: string;
    freqAsNeeded: string;
    startDateLabel: string;
    endDateLabel: string;
    activeCheckbox: string;
    scheduledTimesLabel: string;
    addTimeSlot: string;
    removeTimeSlotAria: string;
    instructionsLabel: string;
    instructionsPlaceholder: string;
    saveChanges: string;
    saveMedication: string;
    emptyTitle: string;
    emptyDesc: string;
    timesPrefix: string;
    startsPrefix: string;
    endsPrefix: string;
    ongoing: string;
    verifiedByPrefix: string;
    historyTitle: string;
    historySubtitle: string;
    todayOptionPrefix: string;
    noMedsScheduledForDate: string;
    loggedBy: string;
    noteInputPlaceholder: string;
    btnTaken: string;
    btnUnconfirmed: string;
    btnMissed: string;
    btnSkipped: string;
    errEndBeforeStart: string;
    errDuplicateSave: string;
    errSaveMed: string;
    errDeleteMed: string;
    errLogDose: string;
    msgUpdated: string;
    msgSaved: string;
    msgDeleted: string;
    refillTitle: string;
    refillDisclaimer: string;
    refillQtyLabel: string;
    refillPerDoseLabel: string;
    refillAlertDaysLabel: string;
    refillSaveBtn: string;
    refillSavedMsg: string;
    refillEstimatedRunout: string;
    refillDaysRemaining: string;
    refillLowBadge: string;
    refillNotSet: string;
    refillManualTrackingRequired: string;
    refillExpiredNotice: string;
    refillStartsFutureNotice: string;
    refillStorageNote: string;
    listenInstructions: string;
  };
  appointments: {
    title: string;
    subtitle: string;
    addBtn: string;
    formEditTitle: string;
    formAddTitle: string;
    doctorLabel: string;
    doctorPlaceholder: string;
    specialtyLabel: string;
    specialtyPlaceholder: string;
    clinicLabel: string;
    clinicPlaceholder: string;
    dateLabel: string;
    timeLabel: string;
    statusLabel: string;
    notesLabel: string;
    notesPlaceholder: string;
    saveChanges: string;
    saveAppointment: string;
    upcomingTitle: string;
    emptyUpcoming: string;
    reminderToday: string;
    reminderTomorrow: string;
    completeBtn: string;
    historyTitle: string;
    emptyHistory: string;
    updateNotesBtn: string;
    errDoctorClinicRequired: string;
    errSave: string;
    errUpdate: string;
    errDelete: string;
    msgUpdated: string;
    msgScheduled: string;
    msgCompleted: string;
    msgDeleted: string;
  };
  scanner: {
    title: string;
    subtitle: string;
    viewOnlyNotice: string;
    previewAlt: string;
    guideAlt: string;
    selectHint: string;
    chooseAnother: string;
    uploadPhoto: string;
    extracting: string;
    extractBtn: string;
    safetyGuarantee: string;
    waitingTitle: string;
    waitingDesc: string;
    headerDetails: string;
    prescriberPrefix: string;
    datePrefix: string;
    notShown: string;
    verifyHeading: string;
    savedBadge: string;
    scannerNotePrefix: string;
    duplicateWarning: string;
    nameLabel: string;
    dosageLabel: string;
    missingVerifyPlaceholder: string;
    frequencyLabel: string;
    primaryTimeLabel: string;
    instructionsLabel: string;
    instructionsPlaceholder: string;
    verifyCheckboxText: string;
    saveVerifiedBtn: string;
    errInvalidType: string;
    errTooLarge: string;
    errNoMedsFound: string;
    errScanFailed: string;
    errSaveFailed: string;
    msgSaved: string;
  };
  assistant: {
    title: string;
    subtitle: string;
    safetyBanner: string;
    emptyTitle: string;
    emptyDesc: string;
    reviewing: string;
    inputPlaceholder: string;
    askBtn: string;
    errReach: string;
    quickQuestions: string[];
    listenAnswer: string;
  };
  notifications: {
    title: string;
    subtitle: string;
    browserEnabled: string;
    enableBrowser: string;
    browserEnabledTitle: string;
    browserEnabledBody: string;
    emailPipelineTitle: string;
    reverifySmtp: string;
    smtpVerifiedMsg: string;
    smtpFailedMsg: string;
    smtpUnconfiguredMsg: string;
    envDetectedLabel: string;
    envDefaultPort: string;
    envDefaultFrom: string;
    testEmailPlaceholder: string;
    sendTestEmail: string;
    sendingTest: string;
    runReminderCheck: string;
    checkingReminders: string;
    checkingSmtp: string;
    reminderEvalSummary: string;
    activeAlertsTitle: string;
    activeAlertsSub: string;
    noActiveAlerts: string;
    permittedRecipients: string;
    noneOptedIn: string;
    saveInAppAlert: string;
    sendFamilyEmail: string;
    sending: string;
    historyTitle: string;
    noHistory: string;
    unreadBadge: string;
    emailStatusPrefix: string;
    markRead: string;
    listenAlert: string;
    refillAlertTitle: string;
    refillAlertMessage: string;
    whatsappTitle: string;
    whatsappBadgeNotConfigured: string;
    whatsappBadgeConfigured: string;
    whatsappNotConfiguredDesc: string;
    whatsappConfigChecklistTitle: string;
    whatsappRequirements: string[];
    whatsappPrivacyNote: string;
    whatsappPhoneLabel: string;
    whatsappPhonePlaceholder: string;
    whatsappConsentLabel: string;
    whatsappEnableToggle: string;
    whatsappCategoriesTitle: string;
    whatsappCatMed: string;
    whatsappCatAppt: string;
    whatsappCatMissed: string;
    whatsappCatFamily: string;
    whatsappSavePrefs: string;
    whatsappOptOutBtn: string;
    whatsappOptedOutBanner: string;
    whatsappPrefsSaved: string;
    whatsappOptedOutMsg: string;
    whatsappSendTestBlocked: string;
    whatsappDisabledNotice: string;
    whatsappErrPhoneRequired: string;
    errTestEmail: string;
    errRunCheck: string;
    errDispatch: string;
    errWhatsapp: string;
  };
  circle: {
    title: string;
    subtitle: string;
    newCircleBtn: string;
    newCircleTitle: string;
    circleNameLabel: string;
    elderNameLabel: string;
    ageLabel: string;
    createBtn: string;
    profileTitle: string;
    profileNameLabel: string;
    elderLabel: string;
    ageShortLabel: string;
    relationshipLabel: string;
    timezoneLabel: string;
    emergencyNameLabel: string;
    emergencyPhoneLabel: string;
    careNotesLabel: string;
    saveProfileBtn: string;
    inviteTitle: string;
    inviteDesc: string;
    roleOptFamily: string;
    roleOptCaretaker: string;
    roleOptElder: string;
    generatePasscodeBtn: string;
    copied: string;
    copy: string;
    revoke: string;
    reactivate: string;
    revoked: string;
    joinAnotherTitle: string;
    joinAnotherPlaceholder: string;
    joinCircleBtn: string;
    membersTitle: string;
    youSuffix: string;
    receiveEmailAlerts: string;
    removeBtn: string;
    handoverTitle: string;
    handoverDesc: string;
    handoverPlaceholder: string;
    handoverSubmitBtn: string;
    handoverEmpty: string;
    handoverSaved: string;
    handoverRequired: string;
    handoverCharCount: string;
    activityTitle: string;
    activityEmpty: string;
    preferencesTitle: string;
    preferencesDesc: string;
    languageSettingLabel: string;
    largeTextSettingLabel: string;
    careSummaryBtn: string;
    callEmergencyBtn: string;
    errInvalidProfile: string;
    errUpdateProfile: string;
    errGenerateInvite: string;
    errJoinCircle: string;
    errCreateCircle: string;
    msgProfileUpdated: string;
    msgPasscodeGenerated: string;
    msgJoinedCircle: string;
    supportCardTitle: string;
    supportCardDesc: string;
  };
  summary: {
    title: string;
    subtitle: string;
    generatedOn: string;
    patientInfo: string;
    emergencyContact: string;
    currentSchedule: string;
    noActiveMeds: string;
    upcomingAppointments: string;
    noUpcomingAppts: string;
    adherenceSection: string;
    adherenceStats: string;
    handoverNotesSection: string;
    noHandoverNotes: string;
    conditionNotesSection: string;
    noConditionNotes: string;
    privacyFooter: string;
    printBtn: string;
    restrictedNotice: string;
  };
  help: {
    title: string;
    subtitle: string;
    tourTitle: string;
    tourSubtitle: string;
    tourStepLabel: string;
    tourPrev: string;
    tourNext: string;
    tourGoToFeature: string;
    manualTitle: string;
    manualSubtitle: string;
    expandAll: string;
    collapseAll: string;
    labelExplanation: string;
    labelSteps: string;
    labelWhere: string;
    labelMistakes: string;
    listenSection: string;
    supportHeading: string;
    supportDesc: string;
    supportEmailLabel: string;
    supportResponseTime: string;
  };
}

export const TRANSLATIONS: Record<AppLanguage, TranslationDictionary> = {
  en: {
    common: {
      appName: 'CareCircle',
      tagline: 'Better care. Together.',
      english: 'English',
      hindi: 'हिन्दी',
      languageLabel: 'Language',
      save: 'Save',
      saving: 'Saving…',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      confirmDelete: 'Confirm Delete',
      close: 'Close',
      print: 'Print Summary',
      loading: 'Loading…',
      optional: 'Optional',
      signOut: 'Sign Out',
      requiredMark: '*',
      backToOverview: 'Back to Overview',
      yes: 'Yes',
      no: 'No',
      active: 'Active',
      paused: 'Paused',
      unknownError: 'Something went wrong. Please try again.',
    },
    welcome: {
      heading: 'Welcome to CareCircle',
      subheading: 'Choose your preferred language',
      englishButton: 'English',
      hindiButton: 'हिन्दी (Hindi)',
      helperNote: 'You can change your language anytime from the login page or Settings.',
      tagline: 'Better care. Together.',
    },
    auth: {
      howItWorks: 'How It Works',
      safetyPrivacy: 'Safety & Privacy',
      familyRoles: 'Family Roles',
      signInGoogle: 'Sign in with Google',
      signingIn: 'Signing in…',
      heroTitle: 'Shared medication care built for seniors and families.',
      heroDesc:
        'Coordinate daily medications, doctor appointments, and human-verified prescription scans inside a private, role-based CareCircle that keeps everyone calmly informed.',
      continueGoogle: 'Continue with Google',
      connecting: 'Connecting…',
      privateBadge: 'Private · Passcode-gated family access',
      heroAlt: 'Elderly father and adult daughter sharing morning tea together',
      fallbackCardTitle: 'CareCircle Family Coordination',
      feature1Title: 'Clear Daily Schedules',
      feature1Desc:
        'Timezone-accurate reminders distinguish between taken doses, upcoming schedules, and unconfirmed check-ins without assuming a dose was missed.',
      feature2Title: 'Human-Verified AI Scanning',
      feature2Desc:
        'Upload prescription photos to extract medicine names and dosages, then review and verify every instruction before saving.',
      feature3Title: 'Private Role-Based Access',
      feature3Desc:
        'Invite family members and caretakers with scoped passcodes so authorized caregivers coordinate care while keeping profiles private.',
      signedInAs: 'Signed in as',
      onboardingTitle: 'Set up your CareCircle',
      onboardingDesc:
        'Create a private healthcare profile for an elderly loved one, or enter an invitation passcode from a family caregiver.',
      tabCreate: 'Create Care Profile',
      tabJoin: 'Join with Passcode',
      circleNameLabel: 'CareCircle Name *',
      circleNamePlaceholder: "e.g., Arthur's Care Team",
      elderNameLabel: 'Care Recipient Name *',
      elderNamePlaceholder: 'e.g., Arthur Miller',
      ageLabel: 'Age *',
      relationshipLabel: 'Relationship *',
      relationshipPlaceholder: 'Father, Mother, Self',
      timezoneLabel: 'Schedule Timezone *',
      emergencyNameLabel: 'Emergency Contact Name',
      emergencyPhoneLabel: 'Emergency Contact Phone',
      notesLabel: 'Care Notes & Allergies',
      notesPlaceholder: 'Key allergies, mobility notes, or physician instructions…',
      creatingCircle: 'Creating CareCircle…',
      createCircleBtn: 'Create CareCircle',
      passcodeLabel: 'Invitation Passcode *',
      passcodePlaceholder: 'CC-XXXX-XXXX',
      passcodeHelp:
        'Ask the primary caregiver to generate an invitation passcode from their CareCircle management tab.',
      joining: 'Joining…',
      joinBtn: 'Join CareCircle',
      errNamesRequired: 'Please enter both a CareCircle name and the care recipient’s full name.',
      errValidAge: 'Please enter a valid age between 1 and 130.',
      errPasscodeRequired: 'Please enter the CareCircle invitation passcode shared with you.',
      errGoogleSignIn: 'Unable to sign in with Google.',
      errCreateFailed: 'Failed to create CareCircle.',
      errJoinFailed: 'Unable to join with that passcode.',
      changeLanguage: 'Switch language',
      supportContact: 'Need help or support? Contact',
      supportAssistance: 'Our dedicated care support team is available at',
    },
    nav: {
      activeProfile: 'Active Care Profile',
      overview: 'Overview',
      medications: 'Medications',
      appointments: 'Appointments',
      scanner: 'Rx Scanner',
      assistant: 'Care Assistant',
      alerts: 'Alerts',
      careCircle: 'CareCircle',
      helpCentre: 'Help & Guide',
      textSizeLargeOn: 'Text Size: Large (On)',
      textSizeStandard: 'Text Size: Standard',
      largeTextOnShort: 'Large Text: On',
      largeTextOffShort: 'Large Text: Off',
      loadingProfile: 'Loading CareCircle profile…',
      boundaryTitle: 'CareCircle encountered a permissions or data error',
      reloadApp: 'Reload CareCircle',
      toggleMenu: 'Toggle navigation menu',
      languageSwitcherAria: 'Choose interface language',
    },
    speech: {
      listen: 'Listen',
      pause: 'Pause',
      resume: 'Resume',
      stop: 'Stop',
      speaking: 'Reading aloud…',
      paused: 'Paused',
      unsupported: 'Audio reading is not supported on this browser.',
      noHindiVoiceNote: 'Hindi voice unavailable on this device; using browser default speech.',
    },
    dashboard: {
      localTime: 'Local time',
      greetingMorning: 'Good morning',
      greetingAfternoon: 'Good afternoon',
      greetingEvening: 'Good evening',
      caringFor: 'Caring for',
      yearsOld: 'yrs',
      yourRole: 'Your role',
      addMedication: 'Add Medication',
      askAssistant: 'Ask Care Assistant',
      printSummary: 'Care Summary',
      helpGuideBtn: 'User Guide',
      kpiTakenTitle: "Today's Doses Taken",
      kpiNoDosesToday: 'No doses scheduled today',
      kpiAllTaken: 'All scheduled doses taken',
      kpiRemainingToday: 'remaining today',
      kpiUnconfirmedTitle: 'Unconfirmed Check-Ins',
      kpiAwaitingConfirm: 'Awaiting confirmation today',
      kpiNoUnconfirmed: 'No unconfirmed doses today',
      kpiAdherenceTitle: '7-Day Adherence',
      kpiTakenLabel: 'taken',
      kpiUnconfirmedLabel: 'unconfirmed',
      kpiNextApptTitle: 'Next Appointment',
      kpiNoneScheduled: 'None scheduled',
      kpiAddInAppts: 'Add a visit in Appointments',
      todayScheduleTitle: "Today's Medication Schedule",
      todayScheduleSubtitle:
        'Unconfirmed doses are never assumed missed—please confirm with the care recipient or a caretaker.',
      manageAllMeds: 'Manage All Medications',
      emptyScheduleTitle: 'No medications scheduled for today yet.',
      emptyScheduleDesc:
        'Add a medication manually or scan a printed prescription to build the daily schedule.',
      addFirstMed: 'Add First Medication',
      scanPrescription: 'Scan Prescription',
      updatedBy: 'Updated by',
      notePrefix: 'Note',
      markTaken: 'Mark Taken',
      markUnconfirmed: 'Unconfirmed',
      confirmMissed: 'Confirm Missed',
      upcomingApptsTitle: 'Upcoming Appointments',
      viewAll: 'View All',
      noUpcomingAppts: 'No upcoming doctor appointments scheduled.',
      scheduleApptBtn: 'Schedule Appointment',
      todayBadge: 'Today',
      tomorrowBadge: 'Tomorrow',
      recentActivityTitle: 'Recent Activity',
      recentActivitySub: 'Chronological care log',
      emptyActivity: 'Activity updates will appear here as medications, doses, and appointments are logged.',
      careTeamTitle: 'Family Care Team',
      manageCircle: 'Manage Circle',
      emailAlertsOn: 'Email alerts on',
      emailAlertsOff: 'Email alerts off',
      emergencyCardTitle: 'Emergency Contact',
      noEmergencyContact: 'No emergency contact added yet.',
      callNow: 'Call',
      editContact: 'Update in Settings',
      handoverTitle: 'Latest Caregiver Handover Notes',
      noHandoverNotes: 'No caregiver handover notes posted yet.',
      viewAllHandovers: 'Post / View Handover Notes',
      refillWarningTitle: 'Medication Refill Reminders',
      refillDaysLeft: 'days left (est.)',
      listenTodaySummary: 'Listen to today’s schedule',
      todaySpeechPrefix: "Today's medication schedule:",
      errUpdateDose: 'Unable to update dose status.',
    },
    chart: {
      title: '7-Day Medication Adherence',
      subtitle: 'Taken doses vs. unconfirmed and confirmed missed doses across the past 7 days',
      weeklyRate: 'Weekly adherence rate',
      dueLabel: 'Due',
      takenLegend: 'Taken',
      unconfirmedLegend: 'Unconfirmed',
      missedLegend: 'Confirmed Missed',
    },
    medications: {
      title: 'Medications & Dose History',
      subtitle: 'Manage prescriptions, scheduled times, refill stock, and daily check-ins.',
      tabList: 'Active Prescriptions',
      tabHistory: 'Daily Check-In & History',
      addBtn: 'Add Medication',
      formEditTitle: 'Edit',
      formAddTitle: 'Add New Medication',
      nameLabel: 'Medicine Name *',
      namePlaceholder: 'e.g., Lisinopril',
      duplicateInline: 'Duplicate detected: This medicine is already in this circle.',
      dosageLabel: 'Dosage *',
      dosagePlaceholder: 'e.g., 10 mg (1 tablet)',
      frequencyLabel: 'Frequency *',
      freqOnce: 'Once daily',
      freqTwice: 'Twice daily',
      freqThree: 'Three times daily',
      freqWeekly: 'Weekly',
      freqAsNeeded: 'As needed',
      startDateLabel: 'Start Date *',
      endDateLabel: 'End Date (Optional)',
      activeCheckbox: 'Medication is currently active',
      scheduledTimesLabel: 'Scheduled Times',
      addTimeSlot: '+ Add Time Slot',
      removeTimeSlotAria: 'Remove time slot',
      instructionsLabel: 'Administration Instructions',
      instructionsPlaceholder: 'e.g., Take with breakfast and a full glass of water.',
      saveChanges: 'Save Changes',
      saveMedication: 'Save Medication',
      emptyTitle: 'No medications recorded yet',
      emptyDesc:
        'Add medications manually or use the AI Prescription Scanner to extract details from a prescription photo.',
      timesPrefix: 'Times:',
      startsPrefix: 'Starts',
      endsPrefix: 'Ends',
      ongoing: 'Ongoing',
      verifiedByPrefix: 'Verified by',
      historyTitle: 'Dose Check-In & Medication History',
      historySubtitle: "Review any day's scheduled slots and record or clarify unconfirmed doses.",
      todayOptionPrefix: 'Today',
      noMedsScheduledForDate: 'No active medications scheduled for',
      loggedBy: 'Logged by',
      noteInputPlaceholder: 'Note (5+ chars for corrections)…',
      btnTaken: 'Taken',
      btnUnconfirmed: 'Unconfirmed',
      btnMissed: 'Missed',
      btnSkipped: 'Skipped',
      errEndBeforeStart: 'End date cannot be earlier than the start date.',
      errDuplicateSave: 'A medication with this name already exists. Edit the existing record instead.',
      errSaveMed: 'Unable to save medication.',
      errDeleteMed: 'Unable to delete medication.',
      errLogDose: 'Failed to log dose status.',
      msgUpdated: 'Updated',
      msgSaved: 'Saved to schedule:',
      msgDeleted: 'Deleted',
      refillTitle: 'Refill Stock & Reminder',
      refillDisclaimer:
        'Estimate depends on accurate remaining quantity and daily schedule entries.',
      refillQtyLabel: 'Available tablets / doses',
      refillPerDoseLabel: 'Units per scheduled dose',
      refillAlertDaysLabel: 'Alert days before run-out',
      refillSaveBtn: 'Update Stock',
      refillSavedMsg: 'Refill stock updated.',
      refillEstimatedRunout: 'Est. run-out:',
      refillDaysRemaining: 'days left',
      refillLowBadge: 'Refill Soon',
      refillNotSet: 'Stock not tracked yet',
      refillManualTrackingRequired: 'Manual stock tracking required for this frequency',
      refillExpiredNotice: 'Prescription end date has passed; refill alerts are off',
      refillStartsFutureNotice: 'Includes days before scheduled start date',
      refillStorageNote:
        'Notice: Stock counts and runtime preferences are held in temporary server storage until full database migration is deployed.',
      listenInstructions: 'Listen to instructions',
    },
    appointments: {
      title: 'Doctor Appointments',
      subtitle: 'Track upcoming clinic visits, reminders, and post-visit notes.',
      addBtn: 'Add Appointment',
      formEditTitle: 'Edit Appointment',
      formAddTitle: 'Schedule Doctor Appointment',
      doctorLabel: 'Doctor Name *',
      doctorPlaceholder: 'e.g., Dr. Elena Rostova',
      specialtyLabel: 'Specialty',
      specialtyPlaceholder: 'e.g., Cardiology',
      clinicLabel: 'Hospital or Clinic *',
      clinicPlaceholder: 'e.g., St. Jude Medical Center',
      dateLabel: 'Date *',
      timeLabel: 'Time',
      statusLabel: 'Status',
      notesLabel: 'Visit Notes & Questions to Ask',
      notesPlaceholder: 'Bring blood pressure log, ask about afternoon dizziness…',
      saveChanges: 'Save Changes',
      saveAppointment: 'Save Appointment',
      upcomingTitle: 'Upcoming Visits',
      emptyUpcoming: 'No upcoming appointments scheduled.',
      reminderToday: 'Reminder: Today',
      reminderTomorrow: 'Reminder: Tomorrow',
      completeBtn: 'Complete',
      historyTitle: 'Appointment History',
      emptyHistory: 'Past and completed visits will appear here.',
      updateNotesBtn: 'Update Notes',
      errDoctorClinicRequired: 'Please enter both the doctor name and hospital or clinic name.',
      errSave: 'Unable to save appointment.',
      errUpdate: 'Failed to update appointment.',
      errDelete: 'Unable to delete appointment.',
      msgUpdated: 'Appointment updated.',
      msgScheduled: 'Appointment scheduled.',
      msgCompleted: 'Marked visit as completed:',
      msgDeleted: 'Appointment removed.',
    },
    scanner: {
      title: 'AI Prescription Scanner',
      subtitle:
        'Upload a clear prescription photo. Extracted details always require human verification before they are added.',
      viewOnlyNotice:
        'Only Primary Caregivers and Caretakers can save scanned medications. You can preview how scanning works, or ask a caregiver to review and save prescriptions.',
      previewAlt: 'Uploaded prescription preview',
      guideAlt: 'Example of a well-lit, flat printed prescription ready for scanning',
      selectHint: 'Select a prescription image to scan',
      chooseAnother: 'Choose Another Image',
      uploadPhoto: 'Upload Prescription Photo',
      extracting: 'Extracting details…',
      extractBtn: 'Extract Medication Details',
      safetyGuarantee:
        'Safety guarantee: CareCircle never fabricates illegible dosages and never auto-saves unverified instructions.',
      waitingTitle: 'Waiting for Prescription Scan',
      waitingDesc:
        'Upload a clear photo of a prescription label or clinic printout and click “Extract Medication Details” to review extracted items here.',
      headerDetails: 'Prescription Header Details',
      prescriberPrefix: 'Prescriber:',
      datePrefix: 'Date:',
      notShown: 'Not shown',
      verifyHeading: 'Human Verification Required',
      savedBadge: 'Saved',
      scannerNotePrefix: 'Scanner note:',
      duplicateWarning:
        'Duplicate warning: This medicine is already in this CareCircle. Edit it in Medications instead of adding a duplicate.',
      nameLabel: 'Medicine Name *',
      dosageLabel: 'Dosage *',
      missingVerifyPlaceholder: 'Missing — verify manually',
      frequencyLabel: 'Frequency *',
      primaryTimeLabel: 'Primary Scheduled Time *',
      instructionsLabel: 'Instructions',
      instructionsPlaceholder: 'Verify instructions from label…',
      verifyCheckboxText:
        'I have physically compared these extracted fields against the original prescription and confirm they are accurate.',
      saveVerifiedBtn: 'Save Verified Medication',
      errInvalidType: 'Please upload a JPEG, PNG, or WebP prescription image.',
      errTooLarge: 'Please choose an image smaller than 7 MB.',
      errNoMedsFound:
        'No clear medications could be extracted from this image. Try a sharper, well-lit photo or add the medication manually.',
      errScanFailed: 'Unable to scan prescription.',
      errSaveFailed: 'Unable to save verified medication.',
      msgSaved: 'Verified and saved to Medications:',
    },
    assistant: {
      title: 'Smart Care Assistant',
      subtitle: 'Ask questions grounded strictly in stored CareCircle records.',
      safetyBanner:
        'Grounded strictly in your CareCircle records. The assistant never invents records, never treats unconfirmed doses as missed, and never offers independent prescribing advice.',
      emptyTitle: 'Ask anything about daily medications, adherence, or visits',
      emptyDesc: 'Choose a quick question above or type your own question below.',
      reviewing: 'Reviewing care records…',
      inputPlaceholder: 'Ask about medications, unconfirmed doses, or appointments…',
      askBtn: 'Ask',
      errReach: 'Unable to reach Smart Care Assistant.',
      quickQuestions: [
        'What medicines are scheduled for today?',
        'When is the next appointment?',
        'Which doses remain unconfirmed?',
        "Show this week's medication adherence.",
      ],
      listenAnswer: 'Listen',
    },
    notifications: {
      title: 'Notifications & Reminders',
      subtitle:
        'Manage medication reminders, unconfirmed dose follow-ups, appointment alerts, email, and WhatsApp preferences.',
      browserEnabled: 'Browser Alerts Enabled',
      enableBrowser: 'Enable Browser Notifications',
      browserEnabledTitle: 'CareCircle Alerts Enabled',
      browserEnabledBody: 'Browser reminders are now active.',
      emailPipelineTitle: 'Backend Email Pipeline Status',
      reverifySmtp: 'Re-verify SMTP',
      smtpVerifiedMsg: 'SMTP connection and authentication verified on backend.',
      smtpFailedMsg: 'SMTP configured, verification failed:',
      smtpUnconfiguredMsg: 'Backend SMTP environment variables are not fully configured.',
      envDetectedLabel: 'Env detected —',
      envDefaultPort: 'Default(587)',
      envDefaultFrom: 'Default',
      testEmailPlaceholder: 'recipient@example.com',
      sendTestEmail: 'Send Test Email',
      sendingTest: 'Sending Test…',
      runReminderCheck: 'Run Reminder Check Now',
      checkingReminders: 'Checking…',
      checkingSmtp: 'Checking SMTP pipeline status…',
      reminderEvalSummary: 'Scheduled Reminder Evaluation:',
      activeAlertsTitle: 'Active Care Alerts',
      activeAlertsSub: 'Detected from live schedule and refill estimates.',
      noActiveAlerts:
        'No due medications, unconfirmed doses, refill warnings, or immediate appointments need alerts right now.',
      permittedRecipients: 'Permitted email recipients',
      noneOptedIn: 'None opted in',
      saveInAppAlert: 'Save In-App Alert',
      sendFamilyEmail: 'Send Family Email Alert',
      sending: 'Sending…',
      historyTitle: 'Notification History',
      noHistory: 'No notifications logged yet.',
      unreadBadge: 'Unread',
      emailStatusPrefix: 'Email status:',
      markRead: 'Mark Read',
      listenAlert: 'Listen',
      refillAlertTitle: 'Low Medicine Stock:',
      refillAlertMessage: 'Estimated supply may run out soon based on current stock and schedule.',
      whatsappTitle: 'WhatsApp Notifications (Official Meta Cloud API)',
      whatsappBadgeNotConfigured: 'Not Configured',
      whatsappBadgeConfigured: 'Configured',
      whatsappNotConfiguredDesc:
        'Official Meta WhatsApp Business Cloud API credentials are not configured on the backend. CareCircle never simulates WhatsApp delivery.',
      whatsappConfigChecklistTitle: 'Required Server Configuration:',
      whatsappRequirements: [
        'Verified Meta Business Account & WhatsApp Business Phone Number ID (WHATSAPP_PHONE_NUMBER_ID)',
        'Server-side Meta Cloud API permanent access token (WHATSAPP_ACCESS_TOKEN, never exposed in frontend)',
        'Pre-approved Meta WhatsApp utility message template (WHATSAPP_TEMPLATE_NAME)',
      ],
      whatsappPrivacyNote:
        'Privacy rule: WhatsApp alerts never include detailed prescriptions or sensitive medical histories—only safe reminder prompts.',
      whatsappPhoneLabel: 'WhatsApp Mobile Number (with country code, e.g., +91...)',
      whatsappPhonePlaceholder: '+91 98765 43210',
      whatsappConsentLabel:
        'I give explicit consent to receive CareCircle care reminders on WhatsApp once the Meta Cloud API is connected.',
      whatsappEnableToggle: 'Enable WhatsApp notifications for my account',
      whatsappCategoriesTitle: 'WhatsApp Alert Categories',
      whatsappCatMed: 'Medication reminders',
      whatsappCatAppt: 'Upcoming doctor appointments',
      whatsappCatMissed: 'Missed-dose alerts (for authorized caregivers)',
      whatsappCatFamily: 'Important family updates',
      whatsappSavePrefs: 'Save WhatsApp Preferences',
      whatsappOptOutBtn: 'Opt Out of All WhatsApp Alerts',
      whatsappOptedOutBanner:
        'You have opted out of WhatsApp notifications. No WhatsApp alerts will be sent.',
      whatsappPrefsSaved: 'WhatsApp preferences saved.',
      whatsappOptedOutMsg: 'WhatsApp notifications disabled and opted out.',
      whatsappSendTestBlocked:
        'Cannot send WhatsApp message: Meta WhatsApp Business Cloud API is not configured on the backend.',
      whatsappDisabledNotice:
        'WhatsApp dispatch is disabled on the backend until durable consent persistence and Meta Cloud API credentials are configured.',
      whatsappErrPhoneRequired:
        'Please enter a valid international WhatsApp number in E.164 format (e.g., +91 98765 43210, 10–15 digits) before giving consent.',
      errTestEmail: 'Unable to send test email.',
      errRunCheck: 'Unable to evaluate scheduled reminders.',
      errDispatch: 'Unable to dispatch notification.',
      errWhatsapp: 'Unable to update WhatsApp preferences.',
    },
    circle: {
      title: 'CareCircle & Settings',
      subtitle:
        'Manage profile details, emergency contacts, caregiver handover notes, language, invites, and members.',
      newCircleBtn: 'Create New Circle',
      newCircleTitle: 'Create Another CareCircle',
      circleNameLabel: 'CareCircle Name *',
      elderNameLabel: 'Care Recipient Name *',
      ageLabel: 'Age *',
      createBtn: 'Create',
      profileTitle: 'Care Recipient & Emergency Contact',
      profileNameLabel: 'CareCircle Name',
      elderLabel: 'Care Recipient',
      ageShortLabel: 'Age',
      relationshipLabel: 'Relationship',
      timezoneLabel: 'Timezone',
      emergencyNameLabel: 'Emergency Contact Name',
      emergencyPhoneLabel: 'Emergency Contact Phone',
      careNotesLabel: 'Care Notes & Allergies',
      saveProfileBtn: 'Save Care Profile',
      inviteTitle: 'Invite via Passcode',
      inviteDesc: 'Generate a role-scoped passcode to invite family members, caretakers, or the care recipient.',
      roleOptFamily: 'Family Member (View & Dose Check-In)',
      roleOptCaretaker: 'Caretaker (Full Medication & Visit Management)',
      roleOptElder: 'Care Recipient (Self Check-In & Appointments)',
      generatePasscodeBtn: 'Generate Passcode',
      copied: 'Copied',
      copy: 'Copy',
      revoke: 'Revoke',
      reactivate: 'Reactivate',
      revoked: 'Revoked',
      joinAnotherTitle: 'Join Another CareCircle',
      joinAnotherPlaceholder: 'Enter passcode (CC-XXXX-XXXX)',
      joinCircleBtn: 'Join CareCircle',
      membersTitle: 'Authorized Members',
      youSuffix: '(You)',
      receiveEmailAlerts: 'Receive email alerts',
      removeBtn: 'Remove',
      handoverTitle: 'Caregiver Handover Notes',
      handoverDesc:
        'Leave timestamped updates for the next caregiver on duty. Saved permanently in the CareCircle audit log.',
      handoverPlaceholder:
        'e.g., Took morning walk well, drank extra water, monitor BP before evening tablet…',
      handoverSubmitBtn: 'Post Handover Note',
      handoverEmpty: 'No caregiver handover notes posted yet.',
      handoverSaved: 'Handover note recorded in CareCircle history.',
      handoverRequired: 'Please write a short handover note first.',
      handoverCharCount: 'characters',
      activityTitle: 'CareCircle Activity History',
      activityEmpty: 'No activity recorded yet.',
      preferencesTitle: 'Personal Accessibility & Language Settings',
      preferencesDesc: 'Changes apply immediately without logging you out or losing your current work.',
      languageSettingLabel: 'Preferred Language',
      largeTextSettingLabel: 'Large Text Mode for Easier Reading',
      careSummaryBtn: 'Printable Care Summary',
      callEmergencyBtn: 'Call Emergency Contact',
      errInvalidProfile: 'Please provide valid profile details and age.',
      errUpdateProfile: 'Unable to update care profile.',
      errGenerateInvite: 'Unable to generate passcode.',
      errJoinCircle: 'Unable to join with that passcode.',
      errCreateCircle: 'Unable to create CareCircle.',
      msgProfileUpdated: 'Care profile updated.',
      msgPasscodeGenerated: 'Generated passcode',
      msgJoinedCircle: 'Joined',
      supportCardTitle: 'CareCircle Support & Help',
      supportCardDesc:
        'Have questions, feedback, or need help managing your CareCircle profile? Contact our support team at unique.himanshu12@gmail.com.',
    },
    summary: {
      title: 'Printable Care Summary',
      subtitle: 'Confidential summary prepared for doctor visits and caregiver handovers.',
      generatedOn: 'Generated on',
      patientInfo: 'Care Recipient Profile',
      emergencyContact: 'Emergency Contact',
      currentSchedule: 'Current Medication Schedule',
      noActiveMeds: 'No active medications recorded.',
      upcomingAppointments: 'Upcoming Appointments',
      noUpcomingAppts: 'No upcoming appointments scheduled.',
      adherenceSection: '7-Day Adherence Summary',
      adherenceStats: 'Taken / Unconfirmed / Confirmed Missed / Skipped',
      handoverNotesSection: 'Recent Caregiver Handover Notes',
      noHandoverNotes: 'No recent handover notes.',
      conditionNotesSection: 'Care Notes & Allergies',
      noConditionNotes: 'None recorded.',
      privacyFooter: 'CareCircle Private Care Record — Share only with authorized caregivers and clinicians.',
      printBtn: 'Print / Save PDF',
      restrictedNotice:
        'Care Summary printing is restricted to Primary Caregivers and Caretakers to protect member privacy.',
    },
    help: {
      title: 'Help Centre & CareCircle User Manual',
      subtitle:
        'Step-by-step instructions in plain language to help seniors, family members, and caretakers use CareCircle safely.',
      tourTitle: 'Start Here: 5-Step Guided Tour',
      tourSubtitle: 'New to CareCircle? Follow these simple steps to understand the essentials.',
      tourStepLabel: 'Step',
      tourPrev: 'Previous',
      tourNext: 'Next Step',
      tourGoToFeature: 'Open This Section',
      manualTitle: 'Complete User Manual',
      manualSubtitle: 'Tap any topic below to read simple explanations, steps, and common fixes.',
      expandAll: 'Expand All',
      collapseAll: 'Collapse All',
      labelExplanation: 'What this does',
      labelSteps: 'Step-by-step instructions',
      labelWhere: 'Where to find it',
      labelMistakes: 'Common mistakes & how to fix them',
      listenSection: 'Listen to this guide',
      supportHeading: 'Need Help or Technical Assistance?',
      supportDesc:
        'Our dedicated support team assists seniors, family caregivers, and caretakers with any questions about CareCircle.',
      supportEmailLabel: 'Official Support Email',
      supportResponseTime: 'Direct email support · Response typically within 24 hours',
    },
  },
  hi: {
    common: {
      appName: 'CareCircle',
      tagline: 'बेहतर देखभाल, साथ मिलकर।',
      english: 'English',
      hindi: 'हिन्दी',
      languageLabel: 'भाषा',
      save: 'सेव करें',
      saving: 'सेव हो रहा है…',
      cancel: 'रद्द करें',
      edit: 'बदलें',
      delete: 'हटाएं',
      confirmDelete: 'हटाना पक्का करें',
      close: 'बंद करें',
      print: 'सारांश प्रिंट करें',
      loading: 'लोड हो रहा है…',
      optional: 'वैकल्पिक',
      signOut: 'लॉग आउट',
      requiredMark: '*',
      backToOverview: 'मुख्य पेज पर लौटें',
      yes: 'हाँ',
      no: 'नहीं',
      active: 'चालू',
      paused: 'रोकी गई',
      unknownError: 'कुछ गड़बड़ हुई। कृपया फिर से कोशिश करें।',
    },
    welcome: {
      heading: 'CareCircle में आपका स्वागत है',
      subheading: 'अपनी पसंदीदा भाषा चुनें',
      englishButton: 'English',
      hindiButton: 'हिन्दी',
      helperNote: 'आप लॉगिन पेज या सेटिंग्स से कभी भी भाषा बदल सकते हैं।',
      tagline: 'बेहतर देखभाल, साथ मिलकर।',
    },
    auth: {
      howItWorks: 'यह कैसे काम करता है',
      safetyPrivacy: 'सुरक्षा और गोपनीयता',
      familyRoles: 'परिवार की भूमिकाएं',
      signInGoogle: 'Google से लॉग इन करें',
      signingIn: 'लॉग इन हो रहा है…',
      heroTitle: 'बुज़ुर्गों और परिवार के लिए सरल और सुरक्षित दवाई देखभाल।',
      heroDesc:
        'रोज़ की दवाइयों का समय, डॉक्टर की मुलाक़ातें, और डॉक्टर के पर्चे की जांच एक निजी CareCircle में परिवार और केयरटेकर के साथ आसानी से संभालें।',
      continueGoogle: 'Google से आगे बढ़ें',
      connecting: 'जुड़ रहा है…',
      privateBadge: 'निजी · पासकोड से सुरक्षित परिवार पहुंच',
      heroAlt: 'बुज़ुर्ग पिता और बेटी साथ में सुबह की चाय पीते हुए',
      fallbackCardTitle: 'CareCircle परिवार देखभाल',
      feature1Title: 'स्पष्ट दैनिक समय-सारणी',
      feature1Desc:
        'सही समय क्षेत्र के अनुसार याद दिलाना — ली गई दवाई, आने वाली खुराक और पुष्टि बाकी खुराक को साफ अलग दिखाता है।',
      feature2Title: 'मनुष्य द्वारा जांचा गया पर्चा स्कैन',
      feature2Desc:
        'डॉक्टर के पर्चे की फोटो डालें, दवाई का नाम और मात्रा देखें, और सेव करने से पहले खुद जांचकर पक्का करें।',
      feature3Title: 'निजी और सुरक्षित परिवार पहुंच',
      feature3Desc:
        'खास पासकोड से परिवार के सदस्यों और केयरटेकर को जोड़ें ताकि केवल सही लोग ही जानकारी देख और बदल सकें।',
      signedInAs: 'लॉग इन खाता:',
      onboardingTitle: 'अपना CareCircle शुरू करें',
      onboardingDesc:
        'अपने बुज़ुर्ग परिजन के लिए नया देखभाल प्रोफ़ाइल बनाएं, या परिवार के सदस्य द्वारा दिया गया पासकोड डालें।',
      tabCreate: 'नया प्रोफ़ाइल बनाएं',
      tabJoin: 'पासकोड से जुड़ें',
      circleNameLabel: 'CareCircle का नाम *',
      circleNamePlaceholder: 'जैसे: दादाजी का देखभाल समूह',
      elderNameLabel: 'बुज़ुर्ग सदस्य का पूरा नाम *',
      elderNamePlaceholder: 'जैसे: रमेश शर्मा',
      ageLabel: 'उम्र *',
      relationshipLabel: 'रिश्ता *',
      relationshipPlaceholder: 'पिताजी, माताजी, स्वयं',
      timezoneLabel: 'समय क्षेत्र (Timezone) *',
      emergencyNameLabel: 'आपातकालीन संपर्क व्यक्ति का नाम',
      emergencyPhoneLabel: 'आपातकालीन फोन नंबर',
      notesLabel: 'जरूरी स्वास्थ्य जानकारी और एलर्जी',
      notesPlaceholder: 'दवाई से एलर्जी, चलने-फिरने की बात, या डॉक्टर की खास सलाह…',
      creatingCircle: 'बन रहा है…',
      createCircleBtn: 'CareCircle बनाएं',
      passcodeLabel: 'निमंत्रण पासकोड *',
      passcodePlaceholder: 'CC-XXXX-XXXX',
      passcodeHelp:
        'मुख्य देखभालकर्ता से CareCircle पेज में बनाया गया पासकोड मांगें।',
      joining: 'जुड़ रहा है…',
      joinBtn: 'CareCircle में जुड़ें',
      errNamesRequired: 'कृपया CareCircle का नाम और बुज़ुर्ग सदस्य का पूरा नाम दोनों लिखें।',
      errValidAge: 'कृपया 1 से 130 के बीच सही उम्र लिखें।',
      errPasscodeRequired: 'कृपया मिला हुआ निमंत्रण पासकोड डालें।',
      errGoogleSignIn: 'Google से लॉग इन नहीं हो पाया।',
      errCreateFailed: 'CareCircle बनाने में समस्या आई।',
      errJoinFailed: 'इस पासकोड से जुड़ने में समस्या आई।',
      changeLanguage: 'भाषा बदलें',
      supportContact: 'मदद या सहायता चाहिए? संपर्क करें:',
      supportAssistance: 'हमारी केयर सहायता टीम उपलब्ध है:',
    },
    nav: {
      activeProfile: 'चुना हुआ देखभाल प्रोफ़ाइल',
      overview: 'मुख्य पेज',
      medications: 'दवाइयाँ',
      appointments: 'डॉक्टर विज़िट',
      scanner: 'पर्चा स्कैन',
      assistant: 'केयर सहायक',
      alerts: 'सूचनाएं',
      careCircle: 'केयर सर्कल',
      helpCentre: 'मदद व गाइड',
      textSizeLargeOn: 'बड़ा अक्षर: चालू',
      textSizeStandard: 'अक्षर आकार: सामान्य',
      largeTextOnShort: 'बड़ा अक्षर: चालू',
      largeTextOffShort: 'बड़ा अक्षर: बंद',
      loadingProfile: 'CareCircle प्रोफ़ाइल लोड हो रहा है…',
      boundaryTitle: 'CareCircle में अनुमति या डेटा की समस्या आई',
      reloadApp: 'पेज फिर से खोलें',
      toggleMenu: 'मेनू खोलें या बंद करें',
      languageSwitcherAria: 'भाषा चुनें',
    },
    speech: {
      listen: 'सुनें',
      pause: 'रोकें',
      resume: 'जारी रखें',
      stop: 'बंद करें',
      speaking: 'पढ़कर सुनाया जा रहा है…',
      paused: 'रुका हुआ',
      unsupported: 'इस ब्राउज़र में बोलकर सुनाने की सुविधा उपलब्ध नहीं है।',
      noHindiVoiceNote: 'इस डिवाइस पर हिन्दी आवाज़ उपलब्ध नहीं है; ब्राउज़र की डिफ़ॉल्ट आवाज़ उपयोग हो रही है।',
    },
    dashboard: {
      localTime: 'स्थानीय समय',
      greetingMorning: 'सुप्रभात',
      greetingAfternoon: 'नमस्कार',
      greetingEvening: 'शुभ संध्या',
      caringFor: 'देखभाल:',
      yearsOld: 'वर्ष',
      yourRole: 'आपकी भूमिका',
      addMedication: 'दवाई जोड़ें',
      askAssistant: 'सहायक से पूछें',
      printSummary: 'देखभाल सारांश',
      helpGuideBtn: 'उपयोग गाइड',
      kpiTakenTitle: 'आज ली गई दवाइयाँ',
      kpiNoDosesToday: 'आज कोई खुराक निर्धारित नहीं',
      kpiAllTaken: 'आज की सभी खुराक ले ली गईं',
      kpiRemainingToday: 'आज बाकी हैं',
      kpiUnconfirmedTitle: 'पुष्टि बाकी खुराक',
      kpiAwaitingConfirm: 'आज पुष्टि की प्रतीक्षा में',
      kpiNoUnconfirmed: 'कोई अनिश्चित खुराक नहीं',
      kpiAdherenceTitle: '7 दिन का नियम पालन',
      kpiTakenLabel: 'ली गई',
      kpiUnconfirmedLabel: 'पुष्टि बाकी',
      kpiNextApptTitle: 'अगली डॉक्टर विज़िट',
      kpiNoneScheduled: 'कोई विज़िट तय नहीं',
      kpiAddInAppts: 'डॉक्टर विज़िट में जोड़ें',
      todayScheduleTitle: 'आज की दवाइयों का समय',
      todayScheduleSubtitle:
        'जिस खुराक की पुष्टि न हुई हो उसे अपने आप छूटा नहीं माना जाता — कृपया मरीज या केयरटेकर से पूछकर पक्का करें।',
      manageAllMeds: 'सभी दवाइयाँ देखें',
      emptyScheduleTitle: 'आज के लिए अभी कोई दवाई दर्ज नहीं है।',
      emptyScheduleDesc:
        'दैनिक समय-सारणी बनाने के लिए हाथ से दवाई जोड़ें या डॉक्टर का पर्चा स्कैन करें।',
      addFirstMed: 'पहली दवाई जोड़ें',
      scanPrescription: 'पर्चा स्कैन करें',
      updatedBy: 'अपडेट किया:',
      notePrefix: 'नोट',
      markTaken: 'दवाई ली गई',
      markUnconfirmed: 'पुष्टि बाकी',
      confirmMissed: 'छूट गई पक्का करें',
      upcomingApptsTitle: 'आगामी डॉक्टर विज़िट',
      viewAll: 'सभी देखें',
      noUpcomingAppts: 'अभी कोई आगामी डॉक्टर अपॉइंटमेंट नहीं है।',
      scheduleApptBtn: 'विज़िट जोड़ें',
      todayBadge: 'आज',
      tomorrowBadge: 'कल',
      recentActivityTitle: 'हाल की गतिविधियाँ',
      recentActivitySub: 'समय के अनुसार पूरा रिकॉर्ड',
      emptyActivity: 'जब दवाइयाँ, खुराक या विज़िट दर्ज होंगी, तो वे यहाँ दिखेंगी।',
      careTeamTitle: 'परिवार और देखभाल टीम',
      manageCircle: 'टीम संभालें',
      emailAlertsOn: 'ईमेल अलर्ट चालू',
      emailAlertsOff: 'ईमेल अलर्ट बंद',
      emergencyCardTitle: 'आपातकालीन संपर्क',
      noEmergencyContact: 'अभी आपातकालीन नंबर दर्ज नहीं है।',
      callNow: 'कॉल करें',
      editContact: 'सेटिंग्स में बदलें',
      handoverTitle: 'केयरटेकर के ताज़ा हैंडओवर नोट्स',
      noHandoverNotes: 'अभी कोई हैंडओवर नोट नहीं लिखा गया है।',
      viewAllHandovers: 'नोट लिखें / सभी देखें',
      refillWarningTitle: 'दवाई खत्म होने की चेतावनी',
      refillDaysLeft: 'दिन शेष (अनुमान)',
      listenTodaySummary: 'आज की दवाइयाँ सुनें',
      todaySpeechPrefix: 'आज की दवाइयों का समय:',
      errUpdateDose: 'खुराक की स्थिति अपडेट नहीं हो सकी।',
    },
    chart: {
      title: 'पिछले 7 दिनों की दवाई नियमितता',
      subtitle: 'पिछले 7 दिनों में ली गई, पुष्टि बाकी और पक्की छूटी हुई खुराक',
      weeklyRate: 'साप्ताहिक नियमितता',
      dueLabel: 'समय',
      takenLegend: 'ली गई',
      unconfirmedLegend: 'पुष्टि बाकी',
      missedLegend: 'पक्की छूटी',
    },
    medications: {
      title: 'दवाइयाँ और खुराक इतिहास',
      subtitle: 'दवाइयों का नाम, समय, स्टॉक और रोज़ की पुष्टि यहाँ संभालें।',
      tabList: 'मौजूदा दवाइयाँ',
      tabHistory: 'दैनिक जांच व इतिहास',
      addBtn: 'दवाई जोड़ें',
      formEditTitle: 'दवाई बदलें:',
      formAddTitle: 'नई दवाई जोड़ें',
      nameLabel: 'दवाई का नाम *',
      namePlaceholder: 'जैसे: मेटफॉर्मिन / लिसिनोप्रिल',
      duplicateInline: 'यह दवाई पहले से इस CareCircle में मौजूद है।',
      dosageLabel: 'मात्रा (Dosage) *',
      dosagePlaceholder: 'जैसे: 10 mg (1 गोली)',
      frequencyLabel: 'कितनी बार *',
      freqOnce: 'दिन में एक बार',
      freqTwice: 'दिन में दो बार',
      freqThree: 'दिन में तीन बार',
      freqWeekly: 'हफ्ते में एक बार',
      freqAsNeeded: 'जरूरत पड़ने पर',
      startDateLabel: 'शुरू करने की तारीख *',
      endDateLabel: 'खत्म करने की तारीख (वैकल्पिक)',
      activeCheckbox: 'यह दवाई अभी चालू है',
      scheduledTimesLabel: 'तय समय',
      addTimeSlot: '+ समय जोड़ें',
      removeTimeSlotAria: 'समय हटाएं',
      instructionsLabel: 'लेने के निर्देश',
      instructionsPlaceholder: 'जैसे: नाश्ते के बाद एक गिलास पानी के साथ लें।',
      saveChanges: 'बदलाव सेव करें',
      saveMedication: 'दवाई सेव करें',
      emptyTitle: 'अभी कोई दवाई दर्ज नहीं है',
      emptyDesc:
        'हाथ से दवाई जोड़ें या पर्चे की फोटो से दवाई पढ़ने के लिए पर्चा स्कैन उपयोग करें।',
      timesPrefix: 'समय:',
      startsPrefix: 'शुरू:',
      endsPrefix: 'समाप्त:',
      ongoing: 'लगातार चालू',
      verifiedByPrefix: 'जांचा गया:',
      historyTitle: 'दैनिक दवाई जांच और इतिहास',
      historySubtitle: 'किसी भी दिन की खुराक देखें और पुष्टि बाकी खुराक को अपडेट करें।',
      todayOptionPrefix: 'आज',
      noMedsScheduledForDate: 'इस तारीख के लिए कोई चालू दवाई नहीं है:',
      loggedBy: 'दर्ज किया:',
      noteInputPlaceholder: 'नोट (सुधार के लिए कम से कम 5 अक्षर)…',
      btnTaken: 'ली गई',
      btnUnconfirmed: 'पुष्टि बाकी',
      btnMissed: 'छूट गई',
      btnSkipped: 'छोड़ी गई',
      errEndBeforeStart: 'खत्म करने की तारीख शुरू की तारीख से पहले नहीं हो सकती।',
      errDuplicateSave: 'इस नाम की दवाई पहले से मौजूद है। नई बनाने के बजाय पुरानी को बदलें।',
      errSaveMed: 'दवाई सेव नहीं हो सकी।',
      errDeleteMed: 'दवाई हटाई नहीं जा सकी।',
      errLogDose: 'खुराक दर्ज करने में समस्या आई।',
      msgUpdated: 'अपडेट किया गया:',
      msgSaved: 'दवाई जोड़ दी गई:',
      msgDeleted: 'हटाया गया:',
      refillTitle: 'दवाई स्टॉक और रीफिल अलर्ट',
      refillDisclaimer:
        'यह अनुमान आपके द्वारा भरी गई बची गोलियों और तय खुराक समय पर निर्भर करता है।',
      refillQtyLabel: 'बची हुई गोलियाँ / खुराक',
      refillPerDoseLabel: 'हर बार की मात्रा',
      refillAlertDaysLabel: 'कितने दिन पहले चेतावनी दें',
      refillSaveBtn: 'स्टॉक अपडेट करें',
      refillSavedMsg: 'दवाई का स्टॉक अपडेट हो गया।',
      refillEstimatedRunout: 'खत्म होने का अनुमान:',
      refillDaysRemaining: 'दिन शेष',
      refillLowBadge: 'जल्द मंगवाएं',
      refillNotSet: 'स्टॉक अभी दर्ज नहीं',
      refillManualTrackingRequired: 'इस आवृत्ति के लिए स्टॉक का हिसाब खुद रखना आवश्यक है',
      refillExpiredNotice: 'दवाई की अंतिम तारीख बीत चुकी है; रीफिल अलर्ट बंद हैं',
      refillStartsFutureNotice: 'इसमें दवाई शुरू होने की तारीख से पहले के दिन शामिल हैं',
      refillStorageNote:
        'सूचना: डेटाबेस के पूर्ण डिप्लॉयमेंट तक दवाई स्टॉक और प्राथमिक सेटिंग्स अस्थायी सर्वर मेमोरी में सुरक्षित हैं।',
      listenInstructions: 'निर्देश सुनें',
    },
    appointments: {
      title: 'डॉक्टर अपॉइंटमेंट',
      subtitle: 'आने वाली क्लिनिक विज़िट, याद दिलाने वाले समय और डॉक्टर की सलाह यहाँ रखें।',
      addBtn: 'विज़िट जोड़ें',
      formEditTitle: 'विज़िट बदलें',
      formAddTitle: 'नया डॉक्टर अपॉइंटमेंट जोड़ें',
      doctorLabel: 'डॉक्टर का नाम *',
      doctorPlaceholder: 'जैसे: डॉ. राजेश गुप्ता',
      specialtyLabel: 'विशेषज्ञता',
      specialtyPlaceholder: 'जैसे: हृदय रोग / सामान्य चिकित्सक',
      clinicLabel: 'अस्पताल या क्लिनिक *',
      clinicPlaceholder: 'जैसे: सिटी केयर क्लिनिक',
      dateLabel: 'तारीख *',
      timeLabel: 'समय',
      statusLabel: 'स्थिति',
      notesLabel: 'विज़िट नोट्स और डॉक्टर से पूछने वाले सवाल',
      notesPlaceholder: 'ब्लड प्रेशर की डायरी साथ ले जाएं, शाम के चक्कर के बारे में पूछें…',
      saveChanges: 'बदलाव सेव करें',
      saveAppointment: 'अपॉइंटमेंट सेव करें',
      upcomingTitle: 'आने वाली विज़िट',
      emptyUpcoming: 'कोई आने वाला अपॉइंटमेंट तय नहीं है।',
      reminderToday: 'याद: आज है',
      reminderTomorrow: 'याद: कल है',
      completeBtn: 'पूर्ण करें',
      historyTitle: 'पिछली विज़िट का इतिहास',
      emptyHistory: 'पुरानी और पूरी हो चुकी विज़िट यहाँ दिखेंगी।',
      updateNotesBtn: 'नोट्स जोड़ें / बदलें',
      errDoctorClinicRequired: 'कृपया डॉक्टर और अस्पताल या क्लिनिक दोनों का नाम लिखें।',
      errSave: 'अपॉइंटमेंट सेव नहीं हो सका।',
      errUpdate: 'अपॉइंटमेंट अपडेट नहीं हो सका।',
      errDelete: 'अपॉइंटमेंट हटाया नहीं जा सका।',
      msgUpdated: 'अपॉइंटमेंट अपडेट हो गया।',
      msgScheduled: 'नया अपॉइंटमेंट जुड़ गया।',
      msgCompleted: 'विज़िट पूर्ण की गई:',
      msgDeleted: 'अपॉइंटमेंट हटाया गया।',
    },
    scanner: {
      title: 'AI पर्चा स्कैनर',
      subtitle:
        'डॉक्टर के पर्चे की साफ फोटो डालें। निकाली गई जानकारी को सेव करने से पहले इंसान द्वारा जांचना अनिवार्य है।',
      viewOnlyNotice:
        'स्कैन की गई दवाइयों को केवल मुख्य देखभालकर्ता और केयरटेकर ही सेव कर सकते हैं। आप इसे देख सकते हैं या उनसे सेव करने को कह सकते हैं।',
      previewAlt: 'अपलोड किया गया पर्चा',
      guideAlt: 'साफ और सीधी रोशनी में खींचे गए पर्चे का उदाहरण',
      selectHint: 'स्कैन करने के लिए पर्चे की फोटो चुनें',
      chooseAnother: 'दूसरी फोटो चुनें',
      uploadPhoto: 'पर्चे की फोटो चुनें',
      extracting: 'पर्चा पढ़ा जा रहा है…',
      extractBtn: 'पर्चे से दवाई निकालें',
      safetyGuarantee:
        'सुरक्षा गारंटी: CareCircle कभी भी धुंधली मात्रा का अंदाज़ा नहीं लगाता और बिना जांच के दवाई सेव नहीं करता।',
      waitingTitle: 'पर्चे की प्रतीक्षा है',
      waitingDesc:
        'पर्चे की साफ फोटो चुनें और “पर्चे से दवाई निकालें” दबाकर हर दवाई की जांच यहाँ करें।',
      headerDetails: 'पर्चे का ऊपरी विवरण',
      prescriberPrefix: 'डॉक्टर:',
      datePrefix: 'तारीख:',
      notShown: 'दिखाई नहीं दिया',
      verifyHeading: 'मानवीय जांच आवश्यक है',
      savedBadge: 'सेव हो गई',
      scannerNotePrefix: 'स्कैनर की टिप्पणी:',
      duplicateWarning:
        'चेतावनी: यह दवाई पहले से इस CareCircle में है। नई जोड़ने के बजाय दवाइयाँ पेज से इसे बदलें।',
      nameLabel: 'दवाई का नाम *',
      dosageLabel: 'मात्रा *',
      missingVerifyPlaceholder: 'अस्पष्ट — खुद देखकर भरें',
      frequencyLabel: 'दिन में कितनी बार *',
      primaryTimeLabel: 'पहला समय *',
      instructionsLabel: 'लेने के निर्देश',
      instructionsPlaceholder: 'पर्चे से देखकर निर्देश लिखें…',
      verifyCheckboxText:
        'मैंने ऊपर लिखी जानकारी को असली पर्चे से मिलाकर देख लिया है और यह बिल्कुल सही है।',
      saveVerifiedBtn: 'जांची हुई दवाई सेव करें',
      errInvalidType: 'कृपया JPEG, PNG, या WebP फोटो ही डालें।',
      errTooLarge: 'कृपया 7 MB से छोटी फोटो चुनें।',
      errNoMedsFound:
        'इस फोटो से दवाई साफ पढ़ी नहीं जा सकी। रोशनी में साफ फोटो लें या हाथ से दवाई जोड़ें।',
      errScanFailed: 'पर्चा स्कैन नहीं हो सका।',
      errSaveFailed: 'दवाई सेव नहीं हो सकी।',
      msgSaved: 'जांच के बाद दवाई सेव हो गई:',
    },
    assistant: {
      title: 'स्मार्ट केयर सहायक',
      subtitle: 'केवल आपके CareCircle में दर्ज पक्के रिकॉर्ड के आधार पर सवाल पूछें।',
      safetyBanner:
        'यह सहायक केवल आपके सेव किए गए रिकॉर्ड से ही जवाब देता है। यह कभी अपनी ओर से दवाई नहीं बताता और न ही बिना पुष्टि वाली खुराक को छूटी मानता है।',
      emptyTitle: 'आज की दवाइयों, नियमितता या डॉक्टर विज़िट के बारे में पूछें',
      emptyDesc: 'ऊपर दिए आसान सवालों में से चुनें या नीचे अपना सवाल लिखें।',
      reviewing: 'आपके रिकॉर्ड देखे जा रहे हैं…',
      inputPlaceholder: 'दवाइयों, बाकी खुराक या अपॉइंटमेंट के बारे में पूछें…',
      askBtn: 'पूछें',
      errReach: 'सहायक से संपर्क नहीं हो पाया।',
      quickQuestions: [
        'आज कौन-कौन सी दवाइयाँ लेनी हैं?',
        'अगला डॉक्टर अपॉइंटमेंट कब है?',
        'किन खुराकों की पुष्टि अभी बाकी है?',
        'इस हफ्ते की दवाई नियमितता कैसी रही?',
      ],
      listenAnswer: 'सुनें',
    },
    notifications: {
      title: 'सूचनाएं और रिमाइंडर',
      subtitle:
        'दवाई के समय, पुष्टि बाकी खुराक, अपॉइंटमेंट अलर्ट, ईमेल और WhatsApp सेटिंग्स यहाँ संभालें।',
      browserEnabled: 'ब्राउज़र अलर्ट चालू हैं',
      enableBrowser: 'ब्राउज़र सूचनाएं चालू करें',
      browserEnabledTitle: 'CareCircle अलर्ट चालू',
      browserEnabledBody: 'अब आपको इस ब्राउज़र पर समय-समय पर याद दिलाया जाएगा।',
      emailPipelineTitle: 'बैकएंड ईमेल सेवा की स्थिति',
      reverifySmtp: 'SMTP फिर से जांचें',
      smtpVerifiedMsg: 'ईमेल सेवा (SMTP) सर्वर पर सही से जुड़ी और प्रमाणित है।',
      smtpFailedMsg: 'SMTP सेटिंग मिली, पर जांच विफल रही:',
      smtpUnconfiguredMsg: 'बैकएंड ईमेल (SMTP) सेटिंग पूरी तरह कॉन्फ़िगर नहीं है।',
      envDetectedLabel: 'मिली सेटिंग —',
      envDefaultPort: 'डिफ़ॉल्ट(587)',
      envDefaultFrom: 'डिफ़ॉल्ट',
      testEmailPlaceholder: 'अपना ईमेल लिखें (जैसे name@example.com)',
      sendTestEmail: 'टेस्ट ईमेल भेजें',
      sendingTest: 'भेजा जा रहा है…',
      runReminderCheck: 'अभी रिमाइंडर जांच चलाएं',
      checkingReminders: 'जांच हो रही है…',
      checkingSmtp: 'ईमेल सेवा की स्थिति जांची जा रही है…',
      reminderEvalSummary: 'रिमाइंडर जांच परिणाम:',
      activeAlertsTitle: 'ताज़ा देखभाल अलर्ट',
      activeAlertsSub: 'आज की खुराक, विज़िट और कम दवाई स्टॉक के आधार पर।',
      noActiveAlerts:
        'अभी कोई जरूरी दवाई अलर्ट, कम स्टॉक चेतावनी या तुरंत विज़िट रिमाइंडर नहीं है।',
      permittedRecipients: 'ईमेल पाने वाले सदस्य',
      noneOptedIn: 'किसी ने ईमेल चालू नहीं किया',
      saveInAppAlert: 'ऐप में अलर्ट सेव करें',
      sendFamilyEmail: 'परिवार को ईमेल भेजें',
      sending: 'भेजा जा रहा है…',
      historyTitle: 'सूचनाओं का इतिहास',
      noHistory: 'अभी कोई सूचना दर्ज नहीं है।',
      unreadBadge: 'नया',
      emailStatusPrefix: 'ईमेल स्थिति:',
      markRead: 'पढ़ा हुआ चिह्नित करें',
      listenAlert: 'सुनें',
      refillAlertTitle: 'दवाई कम हो रही है:',
      refillAlertMessage: 'मौजूदा स्टॉक और समय के अनुसार यह दवाई जल्द खत्म हो सकती है।',
      whatsappTitle: 'WhatsApp सूचनाएं (आधिकारिक Meta Cloud API)',
      whatsappBadgeNotConfigured: 'कॉन्फ़िगर नहीं है',
      whatsappBadgeConfigured: 'जुड़ा हुआ',
      whatsappNotConfiguredDesc:
        'सर्वर पर आधिकारिक Meta WhatsApp Business Cloud API की जानकारी अभी सेट नहीं है। CareCircle नकली संदेश कभी नहीं दिखाता।',
      whatsappConfigChecklistTitle: 'जरूरी सर्वर सेटअप:',
      whatsappRequirements: [
        'सत्यापित Meta Business खाता और WhatsApp Business Phone Number ID (WHATSAPP_PHONE_NUMBER_ID)',
        'सर्वर पर सुरक्षित Meta Cloud API एक्सेस टोकन (WHATSAPP_ACCESS_TOKEN, फ्रंटएंड में कभी नहीं)',
        'Meta द्वारा स्वीकृत संदेश टेम्पलेट (WHATSAPP_TEMPLATE_NAME)',
      ],
      whatsappPrivacyNote:
        'गोपनीयता नियम: WhatsApp संदेशों में कभी भी पूरी दवाई सूची या निजी मेडिकल विवरण नहीं भेजे जाते।',
      whatsappPhoneLabel: 'WhatsApp मोबाइल नंबर (देश कोड सहित, जैसे +91...)',
      whatsappPhonePlaceholder: '+91 98765 43210',
      whatsappConsentLabel:
        'Meta Cloud API जुड़ने के बाद मैं WhatsApp पर CareCircle के रिमाइंडर पाने की स्पष्ट सहमति देता/देती हूँ।',
      whatsappEnableToggle: 'मेरे खाते के लिए WhatsApp सूचनाएं चालू करें',
      whatsappCategoriesTitle: 'किस तरह की WhatsApp सूचनाएं पाना चाहते हैं',
      whatsappCatMed: 'दवाई लेने का समय याद दिलाना',
      whatsappCatAppt: 'आगामी डॉक्टर अपॉइंटमेंट',
      whatsappCatMissed: 'छूटी हुई खुराक की सूचना (केवल देखभालकर्ता के लिए)',
      whatsappCatFamily: 'परिवार के जरूरी अपडेट',
      whatsappSavePrefs: 'WhatsApp सेटिंग सेव करें',
      whatsappOptOutBtn: 'सभी WhatsApp अलर्ट बंद (Opt Out) करें',
      whatsappOptedOutBanner:
        'आपने WhatsApp सूचनाएं बंद (Opt Out) कर दी हैं। कोई WhatsApp संदेश नहीं भेजा जाएगा।',
      whatsappPrefsSaved: 'WhatsApp पसंद सेव हो गई।',
      whatsappOptedOutMsg: 'WhatsApp सूचनाएं बंद कर दी गईं।',
      whatsappSendTestBlocked:
        'WhatsApp संदेश नहीं भेजा जा सका: बैकएंड पर आधिकारिक Meta WhatsApp Business Cloud API सेट नहीं है।',
      whatsappDisabledNotice:
        'जब तक स्थायी सहमति डेटाबेस और Meta Cloud API जुड़ नहीं जाते, तब तक बैकएंड पर WhatsApp संदेश भेजना बंद रखा गया है।',
      whatsappErrPhoneRequired:
        'सहमति देने से पहले कृपया देश कोड सहित सही WhatsApp नंबर लिखें (जैसे +91 98765 43210, 10–15 अंक)।',
      errTestEmail: 'टेस्ट ईमेल नहीं भेजा जा सका।',
      errRunCheck: 'रिमाइंडर जांच नहीं हो सकी।',
      errDispatch: 'सूचना भेजी नहीं जा सकी।',
      errWhatsapp: 'WhatsApp सेटिंग सेव नहीं हो सकी।',
    },
    circle: {
      title: 'केयर सर्कल और सेटिंग्स',
      subtitle:
        'परिवार प्रोफ़ाइल, आपातकालीन नंबर, हैंडओवर नोट्स, भाषा, पासकोड और सदस्य यहाँ संभालें।',
      newCircleBtn: 'नया सर्कल बनाएं',
      newCircleTitle: 'एक और CareCircle बनाएं',
      circleNameLabel: 'CareCircle का नाम *',
      elderNameLabel: 'बुज़ुर्ग सदस्य का नाम *',
      ageLabel: 'उम्र *',
      createBtn: 'बनाएं',
      profileTitle: 'बुज़ुर्ग सदस्य और आपातकालीन संपर्क',
      profileNameLabel: 'CareCircle का नाम',
      elderLabel: 'बुज़ुर्ग सदस्य का नाम',
      ageShortLabel: 'उम्र',
      relationshipLabel: 'रिश्ता',
      timezoneLabel: 'समय क्षेत्र',
      emergencyNameLabel: 'आपातकालीन संपर्क नाम',
      emergencyPhoneLabel: 'आपातकालीन फोन नंबर',
      careNotesLabel: 'स्वास्थ्य नोट्स और एलर्जी',
      saveProfileBtn: 'प्रोफ़ाइल सेव करें',
      inviteTitle: 'पासकोड से परिवार को जोड़ें',
      inviteDesc: 'परिवार के सदस्य, केयरटेकर या बुज़ुर्ग सदस्य को जोड़ने के लिए पासकोड बनाएं।',
      roleOptFamily: 'परिवार के सदस्य (देखें व खुराक दर्ज करें)',
      roleOptCaretaker: 'केयरटेकर (दवाइयाँ व विज़िट संभालें)',
      roleOptElder: 'बुज़ुर्ग सदस्य (खुद की पुष्टि व विज़िट)',
      generatePasscodeBtn: 'पासकोड बनाएं',
      copied: 'कॉपी हो गया',
      copy: 'कॉपी करें',
      revoke: 'रद्द करें',
      reactivate: 'फिर चालू करें',
      revoked: 'बंद',
      joinAnotherTitle: 'किसी अन्य CareCircle से जुड़ें',
      joinAnotherPlaceholder: 'पासकोड लिखें (CC-XXXX-XXXX)',
      joinCircleBtn: 'जुड़ें',
      membersTitle: 'जुड़े हुए सदस्य',
      youSuffix: '(आप)',
      receiveEmailAlerts: 'ईमेल अलर्ट पाएं',
      removeBtn: 'हटाएं',
      handoverTitle: 'केयरटेकर हैंडओवर नोट्स',
      handoverDesc:
        'अगले देखभालकर्ता के लिए ज़रूरी जानकारी लिखें। यह समय और लेखक के नाम के साथ सुरक्षित इतिहास में जुड़ती है।',
      handoverPlaceholder:
        'जैसे: सुबह का नाश्ता ठीक से किया, शाम की गोली से पहले ब्लड प्रेशर देख लें…',
      handoverSubmitBtn: 'हैंडओवर नोट जोड़ें',
      handoverEmpty: 'अभी कोई हैंडओवर नोट नहीं लिखा गया है।',
      handoverSaved: 'हैंडओवर नोट सफलतापूर्वक जुड़ गया।',
      handoverRequired: 'कृपया पहले हैंडओवर नोट लिखें।',
      handoverCharCount: 'अक्षर',
      activityTitle: 'CareCircle गतिविधि इतिहास',
      activityEmpty: 'अभी कोई गतिविधि दर्ज नहीं है।',
      preferencesTitle: 'भाषा और पढ़ने की सुविधा (सेटिंग्स)',
      preferencesDesc: 'यहाँ किया गया बदलाव बिना लॉग आउट किए तुरंत लागू होता है।',
      languageSettingLabel: 'पसंदीदा भाषा',
      largeTextSettingLabel: 'आसानी से पढ़ने के लिए बड़ा अक्षर मोड',
      careSummaryBtn: 'प्रिंट करने योग्य सारांश',
      callEmergencyBtn: 'आपातकालीन नंबर पर कॉल करें',
      errInvalidProfile: 'कृपया सही नाम और उम्र (1 से 130) लिखें।',
      errUpdateProfile: 'प्रोफ़ाइल अपडेट नहीं हो सकी।',
      errGenerateInvite: 'पासकोड नहीं बन सका।',
      errJoinCircle: 'इस पासकोड से जुड़ने में समस्या आई।',
      errCreateCircle: 'नया CareCircle नहीं बन सका।',
      msgProfileUpdated: 'प्रोफ़ाइल अपडेट हो गया।',
      msgPasscodeGenerated: 'नया पासकोड तैयार:',
      msgJoinedCircle: 'आप जुड़ गए:',
      supportCardTitle: 'CareCircle सहायता व संपर्क',
      supportCardDesc:
        'कोई प्रश्न, सुझाव या अपनी देखभाल प्रोफ़ाइल में मदद चाहिए? हमारी सपोर्ट टीम से संपर्क करें: unique.himanshu12@gmail.com',
    },
    summary: {
      title: 'प्रिंट करने योग्य देखभाल सारांश',
      subtitle: 'डॉक्टर से मिलने या केयरटेकर बदलने पर साथ ले जाने के लिए साफ सारांश।',
      generatedOn: 'तैयार किया गया:',
      patientInfo: 'बुज़ुर्ग सदस्य विवरण',
      emergencyContact: 'आपातकालीन संपर्क',
      currentSchedule: 'वर्तमान दवाइयों की सूची',
      noActiveMeds: 'कोई चालू दवाई दर्ज नहीं है।',
      upcomingAppointments: 'आगामी डॉक्टर विज़िट',
      noUpcomingAppts: 'कोई आगामी विज़िट तय नहीं है।',
      adherenceSection: 'पिछले 7 दिनों की दवाई नियमितता',
      adherenceStats: 'ली गई / पुष्टि बाकी / पक्की छूटी / छोड़ी गई',
      handoverNotesSection: 'हाल के केयरटेकर हैंडओवर नोट्स',
      noHandoverNotes: 'अभी कोई हैंडओवर नोट नहीं है।',
      conditionNotesSection: 'जरूरी स्वास्थ्य नोट्स और एलर्जी',
      noConditionNotes: 'कोई नोट दर्ज नहीं।',
      privacyFooter: 'CareCircle निजी स्वास्थ्य सारांश — केवल अधिकृत परिवार व डॉक्टर को दिखाएं।',
      printBtn: 'प्रिंट करें / PDF सेव करें',
      restrictedNotice:
        'सदस्यों की गोपनीयता के लिए देखभाल सारांश केवल मुख्य देखभालकर्ता और केयरटेकर ही प्रिंट कर सकते हैं।',
    },
    help: {
      title: 'मदद केंद्र और CareCircle उपयोग गाइड',
      subtitle:
        'बुज़ुर्गों, परिवार और केयरटेकर के लिए सरल भाषा में हर सुविधा को इस्तेमाल करने का आसान तरीका।',
      tourTitle: 'यहाँ से शुरू करें: 5 आसान कदम',
      tourSubtitle: 'पहली बार CareCircle चला रहे हैं? इन 5 आसान कदमों से शुरुआत करें।',
      tourStepLabel: 'कदम',
      tourPrev: 'पिछला',
      tourNext: 'अगला कदम',
      tourGoToFeature: 'इस पेज पर जाएं',
      manualTitle: 'संपूर्ण उपयोग पुस्तिका (मैनुअल)',
      manualSubtitle: 'सरल जानकारी, कदम-दर-कदम तरीका और आम गलतियों के हल पढ़ने के लिए किसी भी विषय पर क्लिक करें।',
      expandAll: 'सभी खोलें',
      collapseAll: 'सभी बंद करें',
      labelExplanation: 'यह क्या है (सरल समझ)',
      labelSteps: 'कदम-दर-कदम तरीका',
      labelWhere: 'ऐप में कहाँ मिलेगा',
      labelMistakes: 'आम गलतियाँ और उनका समाधान',
      listenSection: 'इस गाइड को सुनें',
      supportHeading: 'मदद या तकनीकी सहायता चाहिए?',
      supportDesc:
        'बुज़ुर्गों, परिवार के देखभालकर्ताओं और केयरटेकरों की किसी भी समस्या या सवाल के लिए हमारी सहायता टीम उपलब्ध है।',
      supportEmailLabel: 'आधिकारिक सहायता ईमेल',
      supportResponseTime: 'सीधा ईमेल संपर्क · आमतौर पर 24 घंटे में जवाब',
    },
  },
};
