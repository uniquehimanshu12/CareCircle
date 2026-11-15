import type { AppLanguage } from '../types';

export type ManualSectionId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

export interface ManualSection {
  id: ManualSectionId;
  title: string;
  explanation: string;
  steps: string[];
  whereToFind: string;
  commonMistakes: string[];
}

export interface GuidedTourStep {
  stepNumber: number;
  title: string;
  description: string;
  targetTab: 'dashboard' | 'medications' | 'appointments' | 'scanner' | 'circle' | 'notifications';
}

export const GUIDED_TOUR: Record<AppLanguage, GuidedTourStep[]> = {
  en: [
    {
      stepNumber: 1,
      title: 'Check Today’s Medication Schedule',
      description:
        'Open the Overview page anytime to see which medicines are due now, already taken, or still awaiting confirmation, plus the Emergency Contact card.',
      targetTab: 'dashboard',
    },
    {
      stepNumber: 2,
      title: 'Add or Check Medicines & Stock',
      description:
        'Use Medications to add medicines, set exact daily timings, pause prescriptions safely, or track remaining tablets for refill alerts.',
      targetTab: 'medications',
    },
    {
      stepNumber: 3,
      title: 'Scan & Verify Printed Prescriptions',
      description:
        'Take a clear photo in Rx Scanner to read prescription lines, then carefully double-check every medicine name, dosage, and time before saving.',
      targetTab: 'scanner',
    },
    {
      stepNumber: 4,
      title: 'Track Doctor Visits & Alerts',
      description:
        'Record upcoming doctor appointments in Appointments, and turn on Browser or Email reminders in Alerts so no visit or dose slips by.',
      targetTab: 'appointments',
    },
    {
      stepNumber: 5,
      title: 'Invite Family & Share Handover Notes',
      description:
        'Go to CareCircle to generate role-scoped passcodes for family or caretakers, update emergency numbers, leave handover notes, or switch languages.',
      targetTab: 'circle',
    },
  ],
  hi: [
    {
      stepNumber: 1,
      title: 'आज की दवाइयों का समय देखें',
      description:
        'मुख्य पेज (Overview) पर देखें कि अभी कौन-सी दवाई लेनी है, कौन-सी ली जा चुकी है, और किसकी पुष्टि बाकी है। आपातकालीन नंबर भी यहीं मिलता है।',
      targetTab: 'dashboard',
    },
    {
      stepNumber: 2,
      title: 'दवाइयाँ और उनका स्टॉक जोड़ें',
      description:
        'दवाइयाँ (Medications) पेज पर नई दवाई जोड़ें, सही समय तय करें, पुरानी दवाई रोकें या बची गोलियों की संख्या भरकर रीफिल अलर्ट पाएं।',
      targetTab: 'medications',
    },
    {
      stepNumber: 3,
      title: 'पर्चा स्कैन करें और खुद जांचें',
      description:
        'पर्चा स्कैन (Rx Scanner) में पर्चे की साफ फोटो डालें, फिर सेव करने से पहले दवाई का नाम, मात्रा और समय खुद देखकर पक्का करें।',
      targetTab: 'scanner',
    },
    {
      stepNumber: 4,
      title: 'डॉक्टर विज़िट और रिमाइंडर संभालें',
      description:
        'डॉक्टर विज़िट पेज में अपॉइंटमेंट लिखें और सूचनाएं (Alerts) में ब्राउज़र व ईमेल रिमाइंडर चालू रखें ताकि कोई समय न छूटे।',
      targetTab: 'appointments',
    },
    {
      stepNumber: 5,
      title: 'परिवार को जोड़ें और हैंडओवर नोट लिखें',
      description:
        'केयर सर्कल (CareCircle) पेज से परिवार या केयरटेकर के लिए पासकोड बनाएं, हैंडओवर नोट लिखें, और भाषा या बड़ा अक्षर मोड बदलें।',
      targetTab: 'circle',
    },
  ],
};

export const MANUAL_SECTIONS: Record<AppLanguage, ManualSection[]> = {
  en: [
    {
      id: 'A',
      title: 'A. Getting Started & CareCircle Roles',
      explanation:
        'CareCircle is a shared, private healthcare home for an elderly person, their family members, and caretakers. Instead of scattered phone calls or paper notes, everyone sees the same verified medication times, appointments, and updates according to their role.',
      steps: [
        'Choose your preferred language (English or हिन्दी) on the welcome screen, then sign in with your verified Google account.',
        'If setting up care for the first time, choose "Create Care Profile", enter the elder’s name, age, local timezone, and optional emergency contact.',
        'To join an existing family group, ask the Primary Caregiver for a passcode (CC-XXXX-XXXX) and select "Join with Passcode".',
        'Understand the 4 roles: Primary Caregiver (circle owner/leader who manages everything and roles), Caretaker (manages medicines, appointments, and dose corrections), Care Recipient / Elder (checks in doses and manages own appointments), and Family Member (views schedules, marks taken/unconfirmed/skipped check-ins, cannot alter prescriptions or appointments).',
      ],
      whereToFind: 'Sign-In / Onboarding screen for first setup, or the "CareCircle" tab in the left menu anytime.',
      commonMistakes: [
        'Wrong timezone selected: if schedules show the wrong hour, update the CareCircle timezone in the CareCircle tab.',
        'Confusing roles: only the original CareCircle owner can invite or change another Primary Caregiver; Caretakers cannot change member permissions.',
      ],
    },
    {
      id: 'B',
      title: 'B. Understanding the Dashboard',
      explanation:
        'The Overview dashboard gives you a calm daily snapshot at a glance: today’s medication schedule, 7-day adherence summary, upcoming doctor visits, recent activity, emergency contact, and caregiver handover notes.',
      steps: [
        'Look at the top KPI cards for today’s taken count, unconfirmed check-ins, 7-day adherence percentage, and next doctor visit.',
        'Review "Today’s Medication Schedule" sorted by time. Check the status badge on each row: "Scheduled" (upcoming later), "Due now" (within window), "Taken" (confirmed taken), "Unconfirmed" (time passed without a check-in yet), "Missed" (explicitly confirmed missed by a caregiver), or "Skipped".',
        'Check the "Emergency Contact" and "Latest Caregiver Handover Notes" cards for quick phone calling or shift updates.',
        'Use the "Listen" button whenever you want today’s schedule read aloud.',
      ],
      whereToFind: 'Click "Overview" (first item in the navigation menu).',
      commonMistakes: [
        'Assuming "Unconfirmed" means "Missed": CareCircle never marks an unlogged dose as missed automatically—always check with the elder or caretaker first.',
        'Trying to overwrite an already finalized "Missed" dose from the dashboard without a note: open Medications → Daily Check-In & History to enter a 5+ character correction reason.',
      ],
    },
    {
      id: 'C',
      title: 'C. Medication Management, Dose Check-Ins & Prescription Scanning',
      explanation:
        'Keep an accurate, duplicate-free list of medicines, set daily timings, track remaining stock for refill alerts, log daily check-ins, and scan printed prescriptions safely with mandatory human review.',
      steps: [
        'Add a medicine: in Medications, click "Add Medication", enter medicine name, dosage (e.g., 10 mg), frequency, start/end dates, and exact time slots.',
        'Pause or resume: click "Edit" on any medicine and uncheck or check "Medication is currently active" rather than deleting history.',
        'Refill reminders: open "Refill Stock & Reminder" inside a medicine card, enter available tablets/doses, and get low-stock alerts before running out.',
        'Record or correct doses: switch to "Daily Check-In & History" to mark Taken, Unconfirmed, Missed (caregivers), or Skipped. To correct a previously finalized dose (Taken/Missed/Skipped), an authorized caregiver must enter a clear correction reason (at least 5 characters) which is permanently logged in the audit trail.',
        'Scan a prescription: go to "Rx Scanner", upload a clear JPEG/PNG/WebP photo, click "Extract Medication Details", compare every extracted name, dosage, and time against the paper prescription, check the human-verification box, and click "Save Verified Medication".',
      ],
      whereToFind: 'Open "Medications" for schedules, refill stock, and history, or "Rx Scanner" for photo scanning.',
      commonMistakes: [
        'Saving scanned prescriptions without checking: handwriting or glare can cause errors—always compare with the physical prescription before ticking verification.',
        'Adding duplicate medicines: CareCircle blocks duplicate names; edit the existing medicine card instead.',
      ],
    },
    {
      id: 'D',
      title: 'D. Doctor Appointments',
      explanation:
        'Keep every upcoming clinic or hospital visit organized in one place with doctor name, specialty, clinic location, date, time, and questions you want to ask.',
      steps: [
        'Open the "Appointments" tab and click "Add Appointment" (available to Primary Caregivers, Caretakers, and Care Recipients).',
        'Fill in the doctor’s name, clinic/hospital name, date, time, and visit notes or questions.',
        'Use "Today" and "Tomorrow" reminder badges on upcoming visits so everyone prepares reports ahead of time.',
        'After the visit, click "Complete" or "Edit" to record doctor instructions in the visit notes.',
      ],
      whereToFind: 'Open "Appointments" in the main navigation menu.',
      commonMistakes: [
        'Editing a cancelled appointment: once an appointment is marked Cancelled, it is locked in history; schedule a new appointment if rebooking.',
        'Family Member trying to edit visits: Family Members have view-only access to appointments.',
      ],
    },
    {
      id: 'E',
      title: 'E. Notifications, Email, Browser & WhatsApp Reminders',
      explanation:
        'CareCircle alerts the right people about due medicines, unconfirmed doses, low refill stock, and upcoming appointments using in-app alerts, browser notifications, backend SMTP email, and (when configured) official WhatsApp Cloud API.',
      steps: [
        'In "Alerts", click "Enable Browser Notifications" to receive pop-up reminders on the device you are currently using.',
        'Review "Backend Email Pipeline Status" to confirm SMTP is verified, and use "Send Test Email" or "Run Reminder Check Now" to test email delivery.',
        'Under "Active Care Alerts", click "Save In-App Alert" (all members) or "Send Family Email Alert" (Primary Caregiver / Caretaker).',
        'For WhatsApp: check the "WhatsApp Notifications" panel. Only opt in if you give explicit consent, and note that if the server shows "Not Configured", Meta Cloud API credentials have not been set up yet.',
      ],
      whereToFind: 'Open "Alerts" in the navigation menu; toggle your own email preference under "CareCircle".',
      commonMistakes: [
        'Expecting emails when "Receive email alerts" is unchecked: each member must keep email alerts enabled in the CareCircle members list.',
        'Expecting WhatsApp messages before Meta Business Cloud API setup: CareCircle never fakes delivery—Wait until the status shows "Configured".',
      ],
    },
    {
      id: 'F',
      title: 'F. Smart Care Assistant',
      explanation:
        'The Smart Care Assistant answers plain-language questions using strictly your CareCircle’s stored records—such as today’s medicine schedule, unconfirmed doses, 7-day adherence, and upcoming appointments.',
      steps: [
        'Open "Care Assistant" from the menu or dashboard button.',
        'Tap one of the quick question buttons or type your own question in English or Hindi.',
        'Use the "Listen" button next to an answer if you prefer hearing it read aloud.',
      ],
      whereToFind: 'Click "Care Assistant" in the main navigation menu.',
      commonMistakes: [
        'Asking for new diagnoses or dosage changes: the assistant is NOT a doctor and will never prescribe, change dosages, or invent missing information.',
        'Forgetting to log new medicines first: the assistant can only report what is already saved in CareCircle.',
      ],
    },
    {
      id: 'G',
      title: 'G. Family & Caregiver Collaboration',
      explanation:
        'Coordinate smoothly across family members and shift caretakers with scoped invitation codes, clear permissions, printable doctor summaries, and permanent caregiver handover notes.',
      steps: [
        'Invite someone: in "CareCircle", choose their role (Family Member, Caretaker, or Care Recipient), click "Generate Passcode", and share the code privately.',
        'Leave a handover note: authorized caregivers can write shift updates under "Caregiver Handover Notes"; every note is saved with author name and server timestamp.',
        'Print a Care Summary: authorized caregivers can click "Printable Care Summary" to print or save a PDF of active medicines, upcoming visits, adherence, and notes.',
        'Remove or update members: the Primary Caregiver can change non-owner roles or remove a member immediately (revoked members lose access right away and their old invites stop working).',
      ],
      whereToFind: 'Open "CareCircle" in the navigation menu.',
      commonMistakes: [
        'Posting an active passcode in public chats: anyone with a valid passcode can request to join until revoked.',
        'Trying to delete the CareCircle owner: the original creator’s membership is protected.',
      ],
    },
    {
      id: 'H',
      title: 'H. Privacy, Security & Preferences',
      explanation:
        'Every CareCircle is isolated by strict database rules. Only verified Google accounts with an authorized membership can read or modify a CareCircle’s private healthcare data.',
      steps: [
        'Keep your Google account email verified—unverified accounts cannot perform protected healthcare updates.',
        'Revoke unused passcodes in "CareCircle → Invite via Passcode" once the intended family member has joined.',
        'Adjust your personal preferences anytime under "CareCircle → Personal Accessibility & Language Settings" (Language switch and Large Text mode).',
        'Review notification preferences by category for email and WhatsApp, and opt out anytime.',
      ],
      whereToFind: 'Settings & preferences are under "CareCircle"; alert preferences are under "CareCircle" and "Alerts".',
      commonMistakes: [
        'Sharing one Google login across multiple family members: each person should sign in with their own Google account so audit history shows accurately who took or updated each dose.',
        'Forgetting to log out on a shared tablet or clinic computer: always click "Sign Out" at the bottom of the menu when using a shared device.',
      ],
    },
  ],
  hi: [
    {
      id: 'A',
      title: 'A. शुरुआत कैसे करें और CareCircle की भूमिकाएं',
      explanation:
        'CareCircle बुज़ुर्ग सदस्य, उनके परिवार और केयरटेकर के लिए एक साझा और निजी देखभाल मंच है। अलग-अलग कागज़ या फोन कॉल के बजाय सभी सही समय पर एक जैसी दवाई और विज़िट की जानकारी देख सकते हैं।',
      steps: [
        'स्वागत स्क्रीन पर अपनी भाषा (English या हिन्दी) चुनें और फिर अपने सत्यापित Google खाते से लॉग इन करें।',
        'पहली बार प्रोफ़ाइल बना रहे हों तो "नया प्रोफ़ाइल बनाएं" चुनें और बुज़ुर्ग सदस्य का नाम, उम्र, समय क्षेत्र व आपातकालीन नंबर भरें।',
        'अगर परिवार के किसी सदस्य ने पहले से सर्कल बनाया है, तो उनसे पासकोड (CC-XXXX-XXXX) लेकर "पासकोड से जुड़ें" चुनें।',
        'चार भूमिकाएं समझें: मुख्य देखभालकर्ता (सर्कल बनाने वाला प्रमुख सदस्य), केयरटेकर (दवाइयाँ, विज़िट और खुराक सुधार संभाल सकते हैं), बुज़ुर्ग सदस्य (अपनी दवाई की पुष्टि और अपॉइंटमेंट देख/लिख सकते हैं), और परिवार के सदस्य (जानकारी देख सकते हैं और दवाई ली/पुष्टि बाकी चिह्नित कर सकते हैं, लेकिन पर्चा या विज़िट बदल नहीं सकते)।',
      ],
      whereToFind: 'पहली बार लॉगिन के बाद सेटअप पेज पर, या बाएं मेनू में "केयर सर्कल" टैब के अंदर।',
      commonMistakes: [
        'गलत समय क्षेत्र (Timezone) चुनना: यदि समय आगे-पीछे दिखे तो केयर सर्कल सेटिंग्स में सही समय क्षेत्र (जैसे Asia/Kolkata) चुनें।',
        'भूमिका की उलझन: केवल मूल मालिक ही मुख्य देखभालकर्ता जोड़ या बदल सकता है; केयरटेकर किसी का अधिकार नहीं बदल सकते।',
      ],
    },
    {
      id: 'B',
      title: 'B. मुख्य पेज (डैशबोर्ड) को समझना',
      explanation:
        'मुख्य पेज पर आपको एक ही नज़र में आज की दवाइयाँ, पिछले 7 दिनों का पालन, अगली डॉक्टर विज़िट, आपातकालीन नंबर और केयरटेकर के ताज़ा नोट्स दिखाई देते हैं।',
      steps: [
        'ऊपर के चार बॉक्स में आज ली गई दवाइयाँ, पुष्टि बाकी खुराक, 7 दिन का प्रतिशत और अगली विज़िट देखें।',
        '"आज की दवाइयों का समय" में हर दवाई के आगे लगा रंग और शब्द पढ़ें: "समय निर्धारित" (आने वाला समय), "अभी लेनी है", "ली जा चुकी", "पुष्टि बाकी" (समय बीत गया पर किसी ने दर्ज नहीं किया), "छूट गई" (केयरटेकर द्वारा पक्का किया गया), या "छोड़ी गई"।',
        'जरूरत पड़ने पर "आपातकालीन संपर्क" कार्ड से सीधे कॉल बटन दबाएं और "केयरटेकर के ताज़ा हैंडओवर नोट्स" पढ़ें।',
        'चाहें तो "आज की दवाइयाँ सुनें" बटन दबाकर आवाज में सुनें।',
      ],
      whereToFind: 'मेनू में सबसे ऊपर "मुख्य पेज" पर क्लिक करें।',
      commonMistakes: [
        '"पुष्टि बाकी" को "छूटी हुई" समझ लेना: CareCircle कभी भी बिना पूछे दवाई को छूटी हुई नहीं मानता — पहले बुज़ुर्ग या केयरटेकर से पूछकर पुष्टि करें।',
        'पहले से पक्की की गई "छूट गई" दवाई को बिना नोट लिखे डैशबोर्ड से बदलना: इसके लिए "दवाइयाँ → दैनिक जांच व इतिहास" में जाकर कम से कम 5 अक्षरों का कारण लिखें।',
      ],
    },
    {
      id: 'C',
      title: 'C. दवाइयों का प्रबंधन, दैनिक जांच और पर्चा स्कैन',
      explanation:
        'दवाइयों की साफ सूची रखें, समय तय करें, बची गोलियों से रीफिल अलर्ट पाएं, रोज़ की खुराक दर्ज करें और डॉक्टर के पर्चे की फोटो जांचकर सेव करें।',
      steps: [
        'दवाई जोड़ना: "दवाइयाँ" में "दवाई जोड़ें" दबाएं, दवाई का नाम, मात्रा, कितनी बार, तारीखें और तय समय भरें।',
        'दवाई रोकना या फिर चालू करना: पुरानी दवाई हटाने के बजाय "बदलें" दबाकर "यह दवाई अभी चालू है" से टिक हटाएं या लगाएं।',
        'रीफिल याद: हर दवाई कार्ड में "दवाई स्टॉक और रीफिल अलर्ट" में बची हुई गोलियाँ लिखें ताकि खत्म होने से पहले चेतावनी मिल जाए।',
        'दैनिक जांच व सुधार: "दैनिक जांच व इतिहास" में जाकर "ली गई", "पुष्टि बाकी", "छूट गई" या "छोड़ी गई" चुनें। यदि पहले से पक्की की गई खुराक को बदलना हो तो केयरटेकर को कम से कम 5 अक्षरों का कारण लिखना जरूरी है, जो सुरक्षित इतिहास में दर्ज होता है।',
        'पर्चा स्कैन: "पर्चा स्कैन" में साफ फोटो डालें, "पर्चे से दवाई निकालें" दबाएं, असली पर्चे से हर नाम, मात्रा और समय मिलाएं, जांच वाले बॉक्स पर टिक करें और फिर "जांची हुई दवाई सेव करें" दबाएं।',
      ],
      whereToFind: 'बाएं मेनू में "दवाइयाँ" और "पर्चा स्कैन" टैब में।',
      commonMistakes: [
        'बिना जांच किए पर्चा सेव करना: डॉक्टर की लिखावट या रोशनी से गलती हो सकती है, इसलिए असली कागज़ से मिलाकर ही टिक लगाएं।',
        'एक ही दवाई दो बार जोड़ना: एक जैसी दवाई दोबारा जोड़ने के बजाय पुरानी दवाई में "बदलें" बटन का उपयोग करें।',
      ],
    },
    {
      id: 'D',
      title: 'D. डॉक्टर अपॉइंटमेंट (विज़िट)',
      explanation:
        'आने वाली क्लिनिक या अस्पताल की सभी मुलाक़ातें, डॉक्टर का नाम, जगह, तारीख, समय और डॉक्टर से पूछने वाले सवाल एक जगह सुरक्षित रखें।',
      steps: [
        '"डॉक्टर विज़िट" खोलें और "विज़िट जोड़ें" दबाएं (मुख्य देखभालकर्ता, केयरटेकर और बुज़ुर्ग सदस्य जोड़ सकते हैं)।',
        'डॉक्टर का नाम, अस्पताल/क्लिनिक, तारीख, समय और जरूरी नोट्स लिखकर सेव करें।',
        'आने वाली विज़िट पर "आज" या "कल" का संकेत देखें ताकि रिपोर्ट और दवाइयाँ पहले से तैयार रहें।',
        'डॉक्टर से मिलने के बाद "पूर्ण करें" या "बदलें" दबाकर डॉक्टर की नई सलाह लिख लें।',
      ],
      whereToFind: 'मेनू में "डॉक्टर विज़िट" पर क्लिक करें।',
      commonMistakes: [
        'रद्द (Cancelled) विज़िट में बदलाव की कोशिश: रद्द होने के बाद रिकॉर्ड लॉक हो जाता है; नई तारीख के लिए नया अपॉइंटमेंट जोड़ें।',
        'परिवार के सदस्य द्वारा विज़िट बदलना: परिवार के सदस्य केवल विज़िट देख सकते हैं।',
      ],
    },
    {
      id: 'E',
      title: 'E. सूचनाएं, ईमेल, ब्राउज़र और WhatsApp रिमाइंडर',
      explanation:
        'समय पर दवाई लेने, पुष्टि बाकी खुराक, कम स्टॉक और आने वाली विज़िट की सूचना ऐप अलर्ट, ब्राउज़र नोटिफिकेशन, ईमेल और (यदि सेटअप हो तो) आधिकारिक WhatsApp Cloud API द्वारा मिलती है।',
      steps: [
        '"सूचनाएं" पेज पर "ब्राउज़र सूचनाएं चालू करें" दबाकर इस फोन या कंप्यूटर पर अलर्ट शुरू करें।',
        '"बैकएंड ईमेल सेवा की स्थिति" में जांचें कि ईमेल सेवा जुड़ी है या नहीं; टेस्ट के लिए "टेस्ट ईमेल भेजें" का उपयोग करें।',
        '"ताज़ा देखभाल अलर्ट" के नीचे "ऐप में अलर्ट सेव करें" या "परिवार को ईमेल भेजें" (केवल देखभालकर्ता) दबाएं।',
        'WhatsApp के लिए अपनी स्पष्ट सहमति दें और चुनें कि कौन-से संदेश चाहिए। यदि स्थिति "कॉन्फ़िगर नहीं है" दिख रही है, तो इसका अर्थ है कि सर्वर पर Meta API अभी नहीं जोड़ी गई है।',
      ],
      whereToFind: 'मेनू में "सूचनाएं" टैब में, और अपना ईमेल अलर्ट चुनने के लिए "केयर सर्कल" में।',
      commonMistakes: [
        '"ईमेल अलर्ट पाएं" बंद होने पर ईमेल की उम्मीद करना: हर सदस्य को केयर सर्कल सूची में अपना ईमेल अलर्ट चालू रखना होता है।',
        'Meta API सेट किए बिना WhatsApp संदेश का इंतज़ार करना: जब तक स्थिति "जुड़ा हुआ" न दिखे, WhatsApp संदेश नहीं जाएंगे।',
      ],
    },
    {
      id: 'F',
      title: 'F. स्मार्ट केयर सहायक',
      explanation:
        'स्मार्ट केयर सहायक केवल आपके CareCircle में दर्ज पक्के रिकॉर्ड देखकर आसान भाषा में जवाब देता है — जैसे आज कौन-सी दवाई लेनी है या अगली विज़िट कब है।',
      steps: [
        'मेनू या मुख्य पेज से "केयर सहायक" खोलें।',
        'ऊपर दिए गए आसान सवालों पर क्लिक करें या नीचे बॉक्स में हिन्दी या अंग्रेजी में अपना सवाल लिखें।',
        'जवाब को सुनने के लिए "सुनें" बटन का उपयोग करें।',
      ],
      whereToFind: 'मेनू में "केयर सहायक" पर क्लिक करें।',
      commonMistakes: [
        'नई बीमारी या दवाई बदलने की सलाह पूछना: यह सहायक डॉक्टर नहीं है; यह कोई दवाई नहीं लिखता और न ही बदलाव बताता है।',
        'दवाई सेव किए बिना सवाल पूछना: यह केवल उन्हीं दवाइयों के बारे में बता सकता है जो ऐप में दर्ज हैं।',
      ],
    },
    {
      id: 'G',
      title: 'G. परिवार और केयरटेकर का आपसी सहयोग',
      explanation:
        'परिवार के कई लोग और शिफ्ट में काम करने वाले केयरटेकर पासकोड, हैंडओवर नोट्स और प्रिंट सारांश की मदद से बिना किसी भ्रम के साथ काम कर सकते हैं।',
      steps: [
        'किसी को जोड़ना: "केयर सर्कल" में उनकी भूमिका चुनें, "पासकोड बनाएं" दबाएं और वह कोड निजी रूप से उन्हें भेजें।',
        'हैंडओवर नोट लिखना: अधिकृत केयरटेकर "केयरटेकर हैंडओवर नोट्स" में शिफ्ट का हाल लिख सकते हैं, जो समय और नाम सहित हमेशा सुरक्षित रहता है।',
        'देखभाल सारांश प्रिंट करना: डॉक्टर के पास जाने से पहले "प्रिंट करने योग्य सारांश" दबाकर पूरी दवाई और विज़िट सूची प्रिंट या PDF सेव करें।',
        'सदस्य हटाना: मुख्य देखभालकर्ता किसी भी गैर-मालिक सदस्य को तुरंत हटा सकते हैं (हटते ही उनकी पहुंच और पुराने पासकोड बंद हो जाते हैं)।',
      ],
      whereToFind: 'मेनू में "केयर सर्कल" टैब खोलें।',
      commonMistakes: [
        'सार्वजनिक ग्रुप में पासकोड डालना: पासकोड केवल भरोसेमंद व्यक्ति को निजी तौर पर भेजें और काम होने के बाद बंद कर दें।',
        'सर्कल मालिक को हटाने की कोशिश: मूल देखभालकर्ता का खाता सुरक्षित रहता है।',
      ],
    },
    {
      id: 'H',
      title: 'H. गोपनीयता, सुरक्षा और आपकी सेटिंग्स',
      explanation:
        'हर CareCircle मजबूत सुरक्षा नियमों से बंद रहता है। केवल सत्यापित Google खाते और जुड़े हुए सदस्य ही अपने परिवार की जानकारी देख सकते हैं।',
      steps: [
        'हमेशा सत्यापित Google खाते का उपयोग करें; असत्यापित खाते सुरक्षित बदलाव नहीं कर सकते।',
        'नए सदस्य के जुड़ने के बाद पुराने पासकोड को "रद्द करें" बटन से बंद कर दें।',
        '"केयर सर्कल → भाषा और पढ़ने की सुविधा" में जाकर कभी भी हिन्दी/English और बड़ा अक्षर मोड बदलें।',
        'अपनी ईमेल और WhatsApp पसंद के अनुसार अलर्ट चुनें या बंद (Opt Out) करें।',
      ],
      whereToFind: 'सभी व्यक्तिगत सेटिंग्स "केयर सर्कल" और अलर्ट विकल्प "सूचनाएं" में मिलेंगे।',
      commonMistakes: [
        'एक ही Google खाता कई लोगों द्वारा साझा करना: हर व्यक्ति को अपने Google खाते से लॉग इन करना चाहिए ताकि पता रहे किसने दवाई दर्ज की।',
        'साझा फोन या कंप्यूटर पर लॉग आउट न करना: इस्तेमाल के बाद हमेशा नीचे "लॉग आउट" बटन दबाएं।',
      ],
    },
  ],
};
