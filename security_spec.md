# CareCircle Security Specification (Payload-First TDD)

## 1. Data Invariants
1. **PII Isolation**: User documents (`/users/{userId}`) and memberships (`/users/{userId}/memberships/{circleId}`) are readable and writable strictly by the owning authenticated user (`request.auth.uid == userId`). Blanket signed-in reads are forbidden.
2. **Circle Privacy**: A `CareCircle` profile and all of its subcollections (`members`, `medications`, `doseLogs`, `appointments`, `activities`, `notifications`) are strictly inaccessible to any user who does not have an active member document at `/careCircles/{circleId}/members/{request.auth.uid}`.
3. **Passcode-Gated Joining**: `/inviteCodes/{code}` cannot be listed (`allow list: if false`). Only users possessing the exact secret `code` can `get` the invite. Joining `/careCircles/{circleId}/members/{uid}` via an invite enforces that the chosen `role` matches `inviteCodes/{code}.role`, `active == true`, and `circleId` matches.
4. **Role-Based Authorization**:
   - `primary_caregiver` and `caretaker`: Can create, update, and delete medications and appointments, manage invites, and record any dose state.
   - `elder` and `family_member`: Can view all circle data, record dose check-ins (`taken`, `unconfirmed`, `skipped`), add appointments/notes, and mark notifications read, but cannot delete medications or modify circle ownership/members.
5. **Immutable Audit Trail**: `/careCircles/{circleId}/activities/{activityId}` cannot be updated or deleted once written (`allow update, delete: if false`).
6. **Temporal & Identity Integrity**: All `createdAt` / `updatedAt` timestamps must equal `request.time`, all author fields (`ownerId`, `createdBy`, `recordedBy`, `actorId`) must match `request.auth.uid` on creation, and `ownerId`/`createdAt`/`circleId` are immutable on update.
7. **Email Verification**: All mutations require `request.auth.token.email_verified == true`.

## 2. The "Dirty Dozen" Attack Payloads (All Must Yield `PERMISSION_DENIED`)
1. **Unauthenticated Read**: `GET /careCircles/circle-1` with `auth == null` -> `PERMISSION_DENIED`.
2. **Cross-User PII Read**: `GET /users/victim-uid` as `attacker-uid` -> `PERMISSION_DENIED`.
3. **Invite Enumeration**: `LIST /inviteCodes` as signed-in user -> `PERMISSION_DENIED`.
4. **Unauthorized Subcollection Read**: `LIST /careCircles/circle-1/medications` as a signed-in user who is NOT in `/careCircles/circle-1/members/{uid}` -> `PERMISSION_DENIED`.
5. **Self-Privilege Escalation on Join**: `CREATE /careCircles/circle-1/members/attacker-uid` with `role: "primary_caregiver"` using an invite code issued for `role: "family_member"` -> `PERMISSION_DENIED`.
6. **Ghost / Shadow Field Injection**: `CREATE /careCircles/circle-1/medications/med-1` with valid fields plus `"isVerifiedByDoctor": true` -> `PERMISSION_DENIED`.
7. **Author Spoofing**: `CREATE /careCircles/circle-1/medications/med-1` with `createdBy: "victim-uid"` when `auth.uid == "attacker-uid"` -> `PERMISSION_DENIED`.
8. **Client Timestamp Forgery**: `CREATE /careCircles/circle-1/doseLogs/log-1` with `createdAt: "2020-01-01T00:00:00Z"` instead of `request.time` -> `PERMISSION_DENIED`.
9. **Unauthorized Destructive Delete**: `DELETE /careCircles/circle-1/medications/med-1` as a user whose role is `"family_member"` -> `PERMISSION_DENIED`.
10. **Immutable Audit Tampering**: `UPDATE /careCircles/circle-1/activities/act-1` with `{ summary: "tampered" }` -> `PERMISSION_DENIED`.
11. **ID Poisoning / Resource Exhaustion**: `CREATE /careCircles/circle-1/medications/invalid$id*with>bad<chars` or a 10KB `name` string -> `PERMISSION_DENIED`.
12. **Unverified Email Mutation**: `CREATE /careCircles/circle-1` with `auth.token.email_verified == false` -> `PERMISSION_DENIED`.
