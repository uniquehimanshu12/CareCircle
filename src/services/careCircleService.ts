import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type {
  ActivityCategory,
  ActivityEvent,
  Appointment,
  AppointmentStatus,
  CareCircle,
  CircleMember,
  CircleRole,
  DoseLog,
  DoseStatus,
  EmailDeliveryStatus,
  InviteCode,
  Medication,
  NotificationItem,
  NotificationType,
  UserMembership,
  UserProfile,
} from '../types';
import {
  generateInvitePasscode,
  generateSafeId,
  makeDoseLogId,
  normalizeMedicationKey,
} from '../utils/schedule';

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    const profile: UserProfile = {
      uid: user.uid,
      displayName: (user.displayName || user.email?.split('@')[0] || 'CareCircle Member').slice(0, 100),
      email: (user.email || '').slice(0, 160),
      photoURL: (user.photoURL || '').slice(0, 500),
      preferredLargeText: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, profile);
    return profile;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateUserLargeTextPreference(
  uid: string,
  preferredLargeText: boolean
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      preferredLargeText,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export function subscribeUserMemberships(
  uid: string,
  onData: (memberships: UserMembership[]) => void
): Unsubscribe {
  const path = `users/${uid}/memberships`;
  const q = query(collection(db, 'users', uid, 'memberships'), orderBy('joinedAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as UserMembership);
      onData(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeCareCircle(
  circleId: string,
  onData: (circle: CareCircle | null) => void
): Unsubscribe {
  const path = `careCircles/${circleId}`;
  return onSnapshot(
    doc(db, 'careCircles', circleId),
    (snap) => {
      onData(snap.exists() ? (snap.data() as CareCircle) : null);
    },
    (err) => handleFirestoreError(err, OperationType.GET, path)
  );
}

export function subscribeCircleMembers(
  circleId: string,
  onData: (members: CircleMember[]) => void
): Unsubscribe {
  const path = `careCircles/${circleId}/members`;
  const q = query(collection(db, 'careCircles', circleId, 'members'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as CircleMember);
      onData(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeMedications(
  circleId: string,
  onData: (meds: Medication[]) => void
): Unsubscribe {
  const path = `careCircles/${circleId}/medications`;
  const q = query(collection(db, 'careCircles', circleId, 'medications'), orderBy('name', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => d.data() as Medication));
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeDoseLogs(
  circleId: string,
  onData: (logs: DoseLog[]) => void
): Unsubscribe {
  const path = `careCircles/${circleId}/doseLogs`;
  const q = query(collection(db, 'careCircles', circleId, 'doseLogs'), orderBy('dateKey', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => d.data() as DoseLog));
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeAppointments(
  circleId: string,
  onData: (appts: Appointment[]) => void
): Unsubscribe {
  const path = `careCircles/${circleId}/appointments`;
  const q = query(
    collection(db, 'careCircles', circleId, 'appointments'),
    orderBy('appointmentDate', 'asc')
  );
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => d.data() as Appointment));
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeActivities(
  circleId: string,
  onData: (events: ActivityEvent[]) => void
): Unsubscribe {
  const path = `careCircles/${circleId}/activities`;
  const q = query(
    collection(db, 'careCircles', circleId, 'activities'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => d.data() as ActivityEvent));
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeNotifications(
  circleId: string,
  onData: (items: NotificationItem[]) => void
): Unsubscribe {
  const path = `careCircles/${circleId}/notifications`;
  const q = query(
    collection(db, 'careCircles', circleId, 'notifications'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map((d) => d.data() as NotificationItem));
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeCreatedInvites(
  uid: string,
  circleId: string,
  onData: (invites: InviteCode[]) => void
): Unsubscribe {
  const path = 'inviteCodes';
  const q = query(
    collection(db, 'inviteCodes'),
    where('createdBy', '==', uid)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => d.data() as InviteCode)
        .filter((inv) => inv.circleId === circleId);
      onData(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export async function logCircleActivity(params: {
  circleId: string;
  actorId: string;
  actorName: string;
  actorRole: CircleRole;
  category: ActivityCategory;
  summary: string;
}): Promise<void> {
  const actId = generateSafeId('act');
  const path = `careCircles/${params.circleId}/activities/${actId}`;
  try {
    const payload: ActivityEvent = {
      id: actId,
      circleId: params.circleId,
      actorId: params.actorId,
      actorName: params.actorName.slice(0, 100),
      actorRole: params.actorRole,
      category: params.category,
      summary: params.summary.slice(0, 300),
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'careCircles', params.circleId, 'activities', actId), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export const HANDOVER_NOTE_PREFIX = '[HANDOVER] ';

export interface HandoverNoteItem {
  id: string;
  note: string;
  actorName: string;
  actorRole: CircleRole;
  createdAt: unknown;
}

export async function postHandoverNote(params: {
  circleId: string;
  actorId: string;
  actorName: string;
  actorRole: CircleRole;
  note: string;
}): Promise<void> {
  const trimmed = params.note.trim();
  if (!trimmed) {
    throw new Error('Handover note cannot be empty.');
  }
  await logCircleActivity({
    circleId: params.circleId,
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    category: 'circle',
    summary: `${HANDOVER_NOTE_PREFIX}${trimmed}`.slice(0, 300),
  });
}

export function extractHandoverNotes(activities: ActivityEvent[]): HandoverNoteItem[] {
  return activities
    .filter((act) => act.category === 'circle' && typeof act.summary === 'string' && act.summary.startsWith(HANDOVER_NOTE_PREFIX))
    .map((act) => ({
      id: act.id,
      note: act.summary.slice(HANDOVER_NOTE_PREFIX.length).trim(),
      actorName: act.actorName,
      actorRole: act.actorRole,
      createdAt: act.createdAt,
    }));
}

export async function createCareCircle(params: {
  user: User;
  name: string;
  elderName: string;
  elderAge: number;
  elderRelationship: string;
  timezone: string;
  primaryConditionNotes: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}): Promise<string> {
  const circleId = generateSafeId('circle');
  const displayName = (params.user.displayName || params.user.email?.split('@')[0] || 'Caregiver').slice(0, 100);
  const email = (params.user.email || '').slice(0, 160);

  const circleData: CareCircle = {
    id: circleId,
    name: params.name.trim().slice(0, 120),
    elderName: params.elderName.trim().slice(0, 120),
    elderAge: Math.max(1, Math.min(130, Math.round(params.elderAge))),
    elderRelationship: params.elderRelationship.trim().slice(0, 60),
    timezone: params.timezone.trim().slice(0, 80),
    primaryConditionNotes: params.primaryConditionNotes.trim().slice(0, 1000),
    emergencyContactName: params.emergencyContactName.trim().slice(0, 120),
    emergencyContactPhone: params.emergencyContactPhone.trim().slice(0, 40),
    ownerId: params.user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const memberData: CircleMember = {
    userId: params.user.uid,
    circleId,
    displayName,
    email,
    role: 'primary_caregiver',
    notifyEmail: true,
    notifyUpcomingMed: true,
    notifyMissedDose: true,
    notifyAppointments: true,
    inviteCode: '',
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const membershipData: UserMembership = {
    circleId,
    circleName: circleData.name,
    elderName: circleData.elderName,
    role: 'primary_caregiver',
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const actId = generateSafeId('act');
  const activityData: ActivityEvent = {
    id: actId,
    circleId,
    actorId: params.user.uid,
    actorName: displayName,
    actorRole: 'primary_caregiver',
    category: 'circle',
    summary: `Created CareCircle "${circleData.name}" for ${circleData.elderName}.`,
    createdAt: serverTimestamp(),
  };

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'careCircles', circleId), circleData);
    batch.set(doc(db, 'careCircles', circleId, 'members', params.user.uid), memberData);
    batch.set(doc(db, 'users', params.user.uid, 'memberships', circleId), membershipData);
    batch.set(doc(db, 'careCircles', circleId, 'activities', actId), activityData);
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `careCircles/${circleId}`);
  }

  return circleId;
}

export async function updateCareCircleProfile(params: {
  circleId: string;
  updates: {
    name: string;
    elderName: string;
    elderAge: number;
    elderRelationship: string;
    timezone: string;
    primaryConditionNotes: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
  };
  actorId: string;
  actorName: string;
  actorRole: CircleRole;
}): Promise<void> {
  const path = `careCircles/${params.circleId}`;
  try {
    await updateDoc(doc(db, 'careCircles', params.circleId), {
      name: params.updates.name.trim().slice(0, 120),
      elderName: params.updates.elderName.trim().slice(0, 120),
      elderAge: Math.max(1, Math.min(130, Math.round(params.updates.elderAge))),
      elderRelationship: params.updates.elderRelationship.trim().slice(0, 60),
      timezone: params.updates.timezone.trim().slice(0, 80),
      primaryConditionNotes: params.updates.primaryConditionNotes.trim().slice(0, 1000),
      emergencyContactName: params.updates.emergencyContactName.trim().slice(0, 120),
      emergencyContactPhone: params.updates.emergencyContactPhone.trim().slice(0, 40),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }

  await logCircleActivity({
    circleId: params.circleId,
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    category: 'circle',
    summary: `Updated care profile details for ${params.updates.elderName}.`,
  });
}

export async function createInviteCode(params: {
  circle: CareCircle;
  role: CircleRole;
  actorId: string;
  actorName: string;
  actorRole: CircleRole;
}): Promise<string> {
  const code = generateInvitePasscode();
  const path = `inviteCodes/${code}`;
  try {
    const invite: InviteCode = {
      code,
      circleId: params.circle.id,
      circleName: params.circle.name.slice(0, 120),
      elderName: params.circle.elderName.slice(0, 120),
      role: params.role,
      createdBy: params.actorId,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'inviteCodes', code), invite);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }

  await logCircleActivity({
    circleId: params.circle.id,
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    category: 'circle',
    summary: `Generated an invitation passcode (${code}) for role ${params.role}.`,
  });

  return code;
}

export async function toggleInviteCodeActive(code: string, active: boolean): Promise<void> {
  const path = `inviteCodes/${code}`;
  try {
    await updateDoc(doc(db, 'inviteCodes', code), {
      active,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function joinCareCircleWithPasscode(params: {
  user: User;
  passcode: string;
}): Promise<{ circleId: string; circleName: string; role: CircleRole }> {
  const cleanCode = params.passcode.trim().toUpperCase();
  if (!/^[a-zA-Z0-9_\-]{6,40}$/.test(cleanCode)) {
    throw new Error('Passcode format is invalid. Please enter the code exactly as shared (e.g., CC-XXXX-XXXX).');
  }

  const invitePath = `inviteCodes/${cleanCode}`;
  let inviteSnap;
  try {
    inviteSnap = await getDoc(doc(db, 'inviteCodes', cleanCode));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, invitePath);
  }

  if (!inviteSnap.exists()) {
    throw new Error('No CareCircle invitation found for that passcode.');
  }

  const invite = inviteSnap.data() as InviteCode;
  if (!invite.active) {
    throw new Error('This invitation passcode has been deactivated by the CareCircle administrator.');
  }

  const existingMemberRef = doc(db, 'careCircles', invite.circleId, 'members', params.user.uid);
  const existingMemberSnap = await getDoc(existingMemberRef);
  if (existingMemberSnap.exists()) {
    // Ensure user membership index exists
    const membershipRef = doc(db, 'users', params.user.uid, 'memberships', invite.circleId);
    const membershipSnap = await getDoc(membershipRef);
    if (!membershipSnap.exists()) {
      await setDoc(membershipRef, {
        circleId: invite.circleId,
        circleName: invite.circleName,
        elderName: invite.elderName,
        role: (existingMemberSnap.data() as CircleMember).role,
        joinedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return {
      circleId: invite.circleId,
      circleName: invite.circleName,
      role: (existingMemberSnap.data() as CircleMember).role,
    };
  }

  const displayName = (params.user.displayName || params.user.email?.split('@')[0] || 'Care Member').slice(0, 100);
  const email = (params.user.email || '').slice(0, 160);

  const memberDoc: CircleMember = {
    userId: params.user.uid,
    circleId: invite.circleId,
    displayName,
    email,
    role: invite.role,
    notifyEmail: true,
    notifyUpcomingMed: true,
    notifyMissedDose: true,
    notifyAppointments: true,
    inviteCode: cleanCode,
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const membershipDoc: UserMembership = {
    circleId: invite.circleId,
    circleName: invite.circleName,
    elderName: invite.elderName,
    role: invite.role,
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    const batch = writeBatch(db);
    batch.set(existingMemberRef, memberDoc);
    batch.set(doc(db, 'users', params.user.uid, 'memberships', invite.circleId), membershipDoc);
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `careCircles/${invite.circleId}/members/${params.user.uid}`);
  }

  await logCircleActivity({
    circleId: invite.circleId,
    actorId: params.user.uid,
    actorName: displayName,
    actorRole: invite.role,
    category: 'circle',
    summary: `${displayName} joined the CareCircle as ${invite.role}.`,
  });

  return {
    circleId: invite.circleId,
    circleName: invite.circleName,
    role: invite.role,
  };
}

export async function updateMemberNotificationPrefs(params: {
  circleId: string;
  userId: string;
  notifyEmail: boolean;
  notifyUpcomingMed: boolean;
  notifyMissedDose: boolean;
  notifyAppointments: boolean;
}): Promise<void> {
  const path = `careCircles/${params.circleId}/members/${params.userId}`;
  try {
    await updateDoc(doc(db, 'careCircles', params.circleId, 'members', params.userId), {
      notifyEmail: params.notifyEmail,
      notifyUpcomingMed: params.notifyUpcomingMed,
      notifyMissedDose: params.notifyMissedDose,
      notifyAppointments: params.notifyAppointments,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function updateMemberRole(params: {
  circleId: string;
  targetUserId: string;
  targetName: string;
  newRole: CircleRole;
  actorId: string;
  actorName: string;
  actorRole: CircleRole;
}): Promise<void> {
  const path = `careCircles/${params.circleId}/members/${params.targetUserId}`;
  try {
    await updateDoc(doc(db, 'careCircles', params.circleId, 'members', params.targetUserId), {
      role: params.newRole,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }

  await logCircleActivity({
    circleId: params.circleId,
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    category: 'circle',
    summary: `Changed ${params.targetName}'s role to ${params.newRole}.`,
  });
}

export async function removeCircleMember(params: {
  circleId: string;
  targetUserId: string;
  targetName: string;
  actorId: string;
  actorName: string;
  actorRole: CircleRole;
}): Promise<void> {
  const path = `careCircles/${params.circleId}/members/${params.targetUserId}`;
  try {
    await deleteDoc(doc(db, 'careCircles', params.circleId, 'members', params.targetUserId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }

  // Best-effort cleanup of outstanding invite codes issued by the removed member.
  // Firestore rules remain the primary security boundary at redemption time.
  try {
    const actSnap = await getDocs(
      query(
        collection(db, 'careCircles', params.circleId, 'activities'),
        where('actorId', '==', params.targetUserId)
      )
    );
    const candidateCodes = new Set<string>();
    for (const d of actSnap.docs) {
      const act = d.data() as ActivityEvent;
      if (act.category !== 'circle') continue;
      const match = act.summary?.match(/passcode \(([A-Za-z0-9_-]{6,40})\)/);
      if (match?.[1]) {
        candidateCodes.add(match[1]);
      }
    }
    await Promise.all(
      Array.from(candidateCodes).map(async (code) => {
        try {
          const invRef = doc(db, 'inviteCodes', code);
          const invSnap = await getDoc(invRef);
          if (invSnap.exists()) {
            const inv = invSnap.data() as InviteCode;
            if (
              inv.active &&
              inv.circleId === params.circleId &&
              inv.createdBy === params.targetUserId
            ) {
              await updateDoc(invRef, {
                active: false,
                updatedAt: serverTimestamp(),
              });
            }
          }
        } catch {
          // Ignore individual invite cleanup failures; rules block redemption.
        }
      })
    );
  } catch {
    // Ignore cleanup query failures; rules enforce creator membership at join time.
  }

  await logCircleActivity({
    circleId: params.circleId,
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    category: 'circle',
    summary: `Removed ${params.targetName} from the CareCircle.`,
  });
}

export async function saveMedication(params: {
  circleId: string;
  existingMeds: Medication[];
  editId?: string;
  name: string;
  dosage: string;
  frequency: string;
  scheduledTimes: string[];
  instructions: string;
  startDate: string;
  endDate: string;
  active: boolean;
  source: 'manual' | 'prescription_scan';
  verifiedBy: string;
  actorId: string;
  actorName: string;
  actorRole: CircleRole;
}): Promise<string> {
  const cleanName = params.name.trim().slice(0, 140);
  const nameKey = normalizeMedicationKey(cleanName);
  if (!cleanName || !params.dosage.trim()) {
    throw new Error('Medication name and dosage are required.');
  }

  const validTimes = params.scheduledTimes
    .map((t) => t.trim())
    .filter((t) => /^[0-2][0-9]:[0-5][0-9]$/.test(t))
    .slice(0, 6);

  if (validTimes.length === 0) {
    throw new Error('Please provide at least one valid scheduled time (HH:MM).');
  }

  // Duplicate check against existing circle medications
  const duplicate = params.existingMeds.find(
    (m) => m.id !== params.editId && m.nameKey === nameKey
  );
  if (duplicate) {
    throw new Error(
      `A medication named "${duplicate.name}" (${duplicate.dosage}) already exists in this CareCircle. Edit the existing medication instead of creating a duplicate.`
    );
  }

  // Double-check against live Firestore in case state is stale
  if (!params.editId) {
    const dupQuery = query(
      collection(db, 'careCircles', params.circleId, 'medications'),
      where('nameKey', '==', nameKey)
    );
    const dupSnap = await getDocs(dupQuery);
    if (!dupSnap.empty) {
      const existing = dupSnap.docs[0].data() as Medication;
      throw new Error(
        `A medication named "${existing.name}" (${existing.dosage}) is already saved in this CareCircle.`
      );
    }
  }

  const medId = params.editId || generateSafeId('med');
  const path = `careCircles/${params.circleId}/medications/${medId}`;

  try {
    if (params.editId) {
      await updateDoc(doc(db, 'careCircles', params.circleId, 'medications', medId), {
        name: cleanName,
        nameKey,
        dosage: params.dosage.trim().slice(0, 100),
        frequency: params.frequency.trim().slice(0, 80),
        scheduledTimes: validTimes,
        instructions: params.instructions.trim().slice(0, 600),
        startDate: params.startDate,
        endDate: params.endDate || '',
        active: params.active,
        verifiedBy: params.verifiedBy.trim().slice(0, 120),
        updatedAt: serverTimestamp(),
      });
    } else {
      const medDoc: Medication = {
        id: medId,
        circleId: params.circleId,
        name: cleanName,
        nameKey,
        dosage: params.dosage.trim().slice(0, 100),
        frequency: params.frequency.trim().slice(0, 80),
        scheduledTimes: validTimes,
        instructions: params.instructions.trim().slice(0, 600),
        startDate: params.startDate,
        endDate: params.endDate || '',
        active: params.active,
        source: params.source,
        verifiedBy: params.verifiedBy.trim().slice(0, 120),
        createdBy: params.actorId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'careCircles', params.circleId, 'medications', medId), medDoc);
    }
  } catch (err) {
    handleFirestoreError(err, params.editId ? OperationType.UPDATE : OperationType.CREATE, path);
  }

  await logCircleActivity({
    circleId: params.circleId,
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    category: params.source === 'prescription_scan' && !params.editId ? 'prescription' : 'medication',
    summary: params.editId
      ? `Updated medication ${cleanName} (${params.dosage.trim()}).`
      : `Added ${params.source === 'prescription_scan' ? 'verified scanned ' : ''}medication ${cleanName} (${params.dosage.trim()}).`,
  });

  return medId;
}

export async function deleteMedication(params: {
  circleId: string;
  med: Medication;
  actorId: string;
  actorName: string;
  actorRole: CircleRole;
}): Promise<void> {
  const path = `careCircles/${params.circleId}/medications/${params.med.id}`;
  try {
    await deleteDoc(doc(db, 'careCircles', params.circleId, 'medications', params.med.id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }

  await logCircleActivity({
    circleId: params.circleId,
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    category: 'medication',
    summary: `Removed medication ${params.med.name} (${params.med.dosage}).`,
  });
}

export async function recordDoseStatus(params: {
  circleId: string;
  medication: Medication;
  dateKey: string;
  scheduledTime: string;
  status: DoseStatus;
  notes?: string;
  actorId: string;
  actorName: string;
  actorRole: CircleRole;
}): Promise<void> {
  const logId = makeDoseLogId(params.medication.id, params.dateKey, params.scheduledTime);
  const path = `careCircles/${params.circleId}/doseLogs/${logId}`;
  const ref = doc(db, 'careCircles', params.circleId, 'doseLogs', logId);
  const cleanNotes = (params.notes || '').trim().slice(0, 400);
  const cleanActorName = params.actorName.slice(0, 100);

  const statusVerb =
    params.status === 'taken'
      ? 'marked as taken'
      : params.status === 'missed'
        ? 'confirmed missed'
        : params.status === 'skipped'
          ? 'marked skipped'
          : 'flagged as unconfirmed';

  try {
    const existingSnap = await getDoc(ref);
    const takenAt = params.status === 'taken' ? serverTimestamp() : '';

    if (existingSnap.exists()) {
      const prev = existingSnap.data() as DoseLog;
      const isFinalizedCorrection = prev.status !== 'unconfirmed';

      if (isFinalizedCorrection) {
        if (params.actorRole !== 'primary_caregiver' && params.actorRole !== 'caretaker') {
          throw new Error(
            'Only a Primary Caregiver or Caretaker can submit an auditable correction for a finalized dose.'
          );
        }
        if (cleanNotes.length < 5) {
          throw new Error(
            'Correcting a finalized dose requires an explicit correction note (at least 5 characters). Add a note in Medications → Daily Check-In & History.'
          );
        }

        const actId = generateSafeId('act');
        const activityPayload: ActivityEvent = {
          id: actId,
          circleId: params.circleId,
          actorId: params.actorId,
          actorName: cleanActorName,
          actorRole: params.actorRole,
          category: 'dose',
          summary: `Corrected ${params.medication.name} (${params.scheduledTime} on ${params.dateKey}) from ${prev.status} to ${params.status}. Reason: ${cleanNotes}`.slice(0, 300),
          doseLogId: logId,
          previousStatus: prev.status,
          newStatus: params.status,
          correctionReason: cleanNotes,
          createdAt: serverTimestamp(),
        };

        const batch = writeBatch(db);
        batch.update(ref, {
          status: params.status,
          recordedBy: params.actorId,
          recordedByName: cleanActorName,
          notes: cleanNotes,
          takenAt,
          auditEventId: actId,
          updatedAt: serverTimestamp(),
        });
        batch.set(doc(db, 'careCircles', params.circleId, 'activities', actId), activityPayload);
        await batch.commit();
        return;
      }

      await updateDoc(ref, {
        status: params.status,
        recordedBy: params.actorId,
        recordedByName: cleanActorName,
        notes: cleanNotes,
        takenAt,
        updatedAt: serverTimestamp(),
      });
    } else {
      const logDoc: DoseLog = {
        id: logId,
        circleId: params.circleId,
        medicationId: params.medication.id,
        medicationName: params.medication.name.slice(0, 140),
        dosage: params.medication.dosage.slice(0, 100),
        dateKey: params.dateKey,
        scheduledTime: params.scheduledTime,
        status: params.status,
        recordedBy: params.actorId,
        recordedByName: cleanActorName,
        notes: cleanNotes,
        takenAt,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(ref, logDoc);
    }
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message.includes('Primary Caregiver or Caretaker') ||
        err.message.includes('correction note'))
    ) {
      throw err;
    }
    handleFirestoreError(err, OperationType.WRITE, path);
  }

  await logCircleActivity({
    circleId: params.circleId,
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    category: 'dose',
    summary: `${params.medication.name} (${params.scheduledTime} on ${params.dateKey}) ${statusVerb}.`,
  });
}

export async function saveAppointment(params: {
  circleId: string;
  editId?: string;
  doctorName: string;
  specialty: string;
  clinicName: string;
  appointmentDate: string;
  appointmentTime: string;
  notes: string;
  status: AppointmentStatus;
  actorId: string;
  actorName: string;
  actorRole: CircleRole;
}): Promise<string> {
  const apptId = params.editId || generateSafeId('appt');
  const path = `careCircles/${params.circleId}/appointments/${apptId}`;

  try {
    if (params.editId) {
      await updateDoc(doc(db, 'careCircles', params.circleId, 'appointments', apptId), {
        doctorName: params.doctorName.trim().slice(0, 120),
        specialty: params.specialty.trim().slice(0, 100),
        clinicName: params.clinicName.trim().slice(0, 140),
        appointmentDate: params.appointmentDate,
        appointmentTime: params.appointmentTime,
        notes: params.notes.trim().slice(0, 800),
        status: params.status,
        updatedAt: serverTimestamp(),
      });
    } else {
      const apptDoc: Appointment = {
        id: apptId,
        circleId: params.circleId,
        doctorName: params.doctorName.trim().slice(0, 120),
        specialty: params.specialty.trim().slice(0, 100),
        clinicName: params.clinicName.trim().slice(0, 140),
        appointmentDate: params.appointmentDate,
        appointmentTime: params.appointmentTime,
        notes: params.notes.trim().slice(0, 800),
        status: params.status,
        createdBy: params.actorId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'careCircles', params.circleId, 'appointments', apptId), apptDoc);
    }
  } catch (err) {
    handleFirestoreError(err, params.editId ? OperationType.UPDATE : OperationType.CREATE, path);
  }

  await logCircleActivity({
    circleId: params.circleId,
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    category: 'appointment',
    summary: params.editId
      ? `Updated appointment with ${params.doctorName.trim()} (${params.appointmentDate}).`
      : `Scheduled appointment with ${params.doctorName.trim()} at ${params.clinicName.trim()} on ${params.appointmentDate}.`,
  });

  return apptId;
}

export async function deleteAppointment(params: {
  circleId: string;
  appt: Appointment;
  actorId: string;
  actorName: string;
  actorRole: CircleRole;
}): Promise<void> {
  const path = `careCircles/${params.circleId}/appointments/${params.appt.id}`;
  try {
    await deleteDoc(doc(db, 'careCircles', params.circleId, 'appointments', params.appt.id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }

  await logCircleActivity({
    circleId: params.circleId,
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    category: 'appointment',
    summary: `Deleted appointment with ${params.appt.doctorName} (${params.appt.appointmentDate}).`,
  });
}

export async function createNotificationRecord(params: {
  circleId: string;
  type: NotificationType;
  title: string;
  message: string;
  targetKey: string;
  emailStatus: EmailDeliveryStatus;
  emailRecipients: string[];
  emailDetails: string;
  actorId: string;
}): Promise<string> {
  const notifId = generateSafeId('notif');
  const path = `careCircles/${params.circleId}/notifications/${notifId}`;
  try {
    const item: NotificationItem = {
      id: notifId,
      circleId: params.circleId,
      type: params.type,
      title: params.title.slice(0, 140),
      message: params.message.slice(0, 500),
      targetKey: params.targetKey.slice(0, 140),
      emailStatus: params.emailStatus,
      emailRecipients: params.emailRecipients.slice(0, 20),
      emailDetails: params.emailDetails.slice(0, 300),
      readBy: [params.actorId],
      createdBy: params.actorId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'careCircles', params.circleId, 'notifications', notifId), item);
    return notifId;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function markNotificationRead(params: {
  circleId: string;
  notif: NotificationItem;
  userId: string;
}): Promise<void> {
  if (params.notif.readBy.includes(params.userId)) return;
  const path = `careCircles/${params.circleId}/notifications/${params.notif.id}`;
  try {
    const updatedReadBy = [...params.notif.readBy, params.userId].slice(0, 20);
    await updateDoc(doc(db, 'careCircles', params.circleId, 'notifications', params.notif.id), {
      readBy: updatedReadBy,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}
