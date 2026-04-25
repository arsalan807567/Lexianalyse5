# Security Specification for LexiAnalyse

## 1. Data Invariants
- An `Analysis` document must belong to a valid user.
- Users can only read and write their own data.
- User profiles (`plan`, `usageCount`) cannot be modified by the user directly (simulating a system-only field situation, though typically `usageCount` would be updated by a cloud function or server-side). For this demo, I will allow incrementing `usageCount` if the request matches the previous value + 1, but ideally this is backend-only. Actually, I'll restrict `usageCount` and `plan` updates to "Admin" logic or specific conditions.

## 2. The Dirty Dozen Payloads
- Try to read another user's analysis.
- Try to create an analysis for another user ID.
- Try to update a `plan` from "free" to "pro" without authorization.
- Try to inject a 2MB string into a document name.
- Try to delete an analysis that isn't yours.
- Try to create a user profile with `usageCount: 9999`.
- Try to skip `userId` field in Analysis creation.
- ...and so on.

## 3. Test Runner (Placeholder)
`firestore.rules.test.ts` would verify these.
