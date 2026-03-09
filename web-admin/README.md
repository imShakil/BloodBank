# BloodPoint Web Admin

Web app for managing and monitoring BloodPoint users, posts, and reports.

## Features (MVP)

- Public landing page at `/` with app highlights and download CTAs.
- Public content pages:
  - `/blogs`
  - `/blogs/:id`
  - `/stories`
  - `/stories/:id`
  - `/submit-content` (community blog/story submission)
- Public legal pages:
  - `/privacy-policy`
  - `/terms`
- Firebase Auth login (email/password).
- Admin dashboard moved to `/admin` (login at `/admin/login`).
- Dashboard with total users/posts/pending moderation/reports.
- Users page with verification actions (`VERIFIED` / `REJECTED`).
- Posts moderation page (approve/reject + moderation audit write).
- Reports listing page for admin triage.
- Admin content moderation at `/admin/content` for approving/rejecting submissions.
  - Includes popup full-reader to review complete blog/story text before publish.

Content limits:
- Blog: title max `120` chars, content `200-4000` chars
- Story: title max `120` chars, content `120-2200` chars

## Landing Data Security

To keep user data secure, public landing reads only `/publicLanding` (sanitized snapshot), not raw `/users` or `/posts`.

- Public reads: allowed only for `/publicLanding`.
- Protected data: `/users`, `/posts`, `/reports` remain restricted by auth/rules.
- Snapshot publisher:
  - Scheduled Cloud Function: `publishPublicLandingSnapshot` (every 5 minutes)
  - Manual fallback script: `npm run publish:landing-snapshot`

Example:

```bash
npm run publish:landing-snapshot
```

Deploy scheduled function:

```bash
firebase deploy --only functions:publishPublicLandingSnapshot
```

## Setup

1. Copy env template:

```bash
cp .env.example .env
```

2. Fill Firebase web config values in `.env`.
   - Optional for landing CTA buttons:
     - `VITE_PLAYSTORE_URL`
     - `VITE_APKPURE_URL`
     - `VITE_DIRECT_APK_URL`
3. Install dependencies:

```bash
npm install
```

4. Start dev server:

```bash
npm run dev
```

## Important Notes

- Database rules currently control write access for moderation/admin actions.
- If the signed-in user is not an admin according to your rules, sensitive actions will fail.
- This MVP reads/writes Realtime Database directly; for stricter security, move privileged writes to a BFF/Cloud Functions in the next phase.

## Bootstrap Super Admin

You can create or update a super admin using the Admin SDK script.

1. Put required vars in `web-admin/.env` (same format as your `VITE_...` setup):

```bash
VITE_FIREBASE_DATABASE_URL="https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com"
VITE_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
FIREBASE_SERVICE_ACCOUNT_PATH="/absolute/path/service-account.json"
```

2. Run by email:

```bash
npm run bootstrap:super-admin -- --email admin@example.com --role super-admin --assigned-by bootstrap
```

3. Or run by uid:

```bash
npm run bootstrap:super-admin -- --uid FIREBASE_UID --role super-admin --assigned-by bootstrap
```

4. Optional explicit project ID override:

```bash
npm run bootstrap:super-admin -- --email admin@example.com --project-id YOUR_PROJECT_ID
```

Notes:
- Script is idempotent for `/admins/<uid>` (it updates if already exists).
- It also writes an entry to `/adminAudit`.
- Script auto-loads values from `web-admin/.env`.

## Manual Admin Setup (No Script)

Use this when you want a low-risk, console-only flow.

1. Create or confirm user account
- Firebase Console -> Authentication -> Users
- Ensure the user exists and copy their `UID`.

2. Add admin record in Realtime Database
- Firebase Console -> Realtime Database -> Data
- Go to path: `/admins/<UID>`
- Set this JSON value:

```json
{
  "uid": "<UID>",
  "role": "super-admin",
  "assignedBy": "manual-console",
  "assignedAt": 1741430400000,
  "active": true
}
```

3. (Optional) Add audit entry
- Path: `/adminAudit/<AUTO_ID>`
- Value:

```json
{
  "action": "CREATE_ADMIN_ROLE",
  "targetUid": "<UID>",
  "adminUid": "manual-console",
  "details": "Manual admin bootstrap",
  "timestamp": 1741430400000
}
```

4. Sign in to web admin
- Log in with that user in the web app.
- Current rules treat users under `/admins/<uid>` as admins.

Role-based web access (current):
- `super-admin`: Dashboard + Users + Posts + Reports
- `verifier`: Dashboard + Users
- `moderator`: Dashboard + Posts + Reports
- `billing-admin` / `viewer`: Dashboard only

## GitHub Actions Deploy (Web App)

Workflow file:
- `.github/workflows/web-app.yml`

What it does:
- Triggers on push to `main` (web-admin / firebase config changes) and manual dispatch.
- Builds `web-admin` with `VITE_...` secrets.
- Deploys to Firebase Hosting (`blood-point-app`, `live` channel).

Required repository secrets:
- `FIREBASE_SERVICE_ACCOUNT_BLOOD_POINT_APP` (full JSON of Firebase service account key)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_DATABASE_URL`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
