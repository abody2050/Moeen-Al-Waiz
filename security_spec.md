# Firebase Security Specification - معين الواعظ

## 1. Data Invariants
- A sermon must always have a `userId` that matches the authenticated user.
- Users can only read and write their own data (UserProfile and Sermons).
- Public access is denied.
- `idNumber` on UserProfile is assigned once and should be immutable for the client.

## 2. The "Dirty Dozen" Payloads

### P1: Identity Spoofing (Sermon)
Attempt to create a sermon for another user.
```json
{
  "userId": "other_user_id",
  "title": "Malicious Sermon",
  "content": "..."
}
```
**Expected: DENIED**

### P2: Privilege Escalation (UserProfile)
Attempt to modify settings of another user.
**Expected: DENIED**

### P3: Resource Poisoning (Sermon Title)
Title exceeding 200 characters.
**Expected: DENIED**

### P4: Orphaned Write
Sermon with invalid/missing userId.
**Expected: DENIED**

### P5: Update Gap (Sermon Content)
Modifying `createdAt` during update.
**Expected: DENIED**

### P6: System Field Injection
Attempting to manually set a "verified" flag (if it existed) on a user profile.
**Expected: DENIED**

### P7: Unauthenticated Read
Reading sermons without being signed in.
**Expected: DENIED**

### P8: Client-Side Query Scraping
Querying all sermons without filtering by userId.
**Expected: DENIED**

### P9: ID Poisoning
Using a 2KB string as a document ID.
**Expected: DENIED**

### P10: Terminal State Violation
If a sermon could be 'locked', attempting to edit it after locking.
**Expected: DENIED**

### P11: PII Leak
Reading another user's email via user profile list.
**Expected: DENIED**

### P12: Resource Exhaustion
Creating 10,000 sermons in a minute (Throttled by rules/infrastructure).
**Expected: DENIED**

## 3. Test Runner (Draft)
The `firestore.rules.test.ts` would verify that `request.auth.uid == data.userId` for all operations.
