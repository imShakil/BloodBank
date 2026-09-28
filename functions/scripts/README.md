# Deployment Scripts

Deployment automation for the Firebase Cloud Functions in `functions/`.

Both scripts do the same thing: run pre-deployment checks, write the
environment's retention value into `functions/.env.<projectId>`, and then run a
plain `firebase deploy`. They resolve the repository root from their own
location, so they can be run from any working directory.

## Available Scripts

### 1. `deploy.sh` (Linux/Mac/Git Bash)

```bash
# Make executable (first time only)
chmod +x functions/scripts/deploy.sh

# Deploy to production (90 days retention)
./functions/scripts/deploy.sh production

# Deploy to staging (60 days retention)
./functions/scripts/deploy.sh staging

# Deploy to dev (30 days retention)
./functions/scripts/deploy.sh dev

# Dry run — prints the .env file it would write and the deploy command
./functions/scripts/deploy.sh production --dry-run

# Skip tests (not recommended)
./functions/scripts/deploy.sh production --skip-tests

# Deploy a single function
./functions/scripts/deploy.sh production --function-only=cleanupOldContactRequests

# Target a project other than the .firebaserc default
./functions/scripts/deploy.sh production --project=blood-point-app
```

### 2. `deploy.bat` (Windows)

```cmd
REM Deploy to production (90 days retention)
functions\scripts\deploy.bat production

REM Deploy to staging (60 days retention)
functions\scripts\deploy.bat staging

REM Deploy to dev (30 days retention)
functions\scripts\deploy.bat dev

REM Dry run
functions\scripts\deploy.bat production --dry-run

REM Skip tests (not recommended)
functions\scripts\deploy.bat production --skip-tests

REM Single function / explicit project
functions\scripts\deploy.bat production --function-only=cleanupOldContactRequests
functions\scripts\deploy.bat production --project=blood-point-app
```

`cmd` treats `=` as an argument delimiter, so `--function-only=NAME` and
`--function-only NAME` are equivalent on Windows; both work.

## What the Scripts Do

### Pre-Deployment Checks

1. Firebase CLI is installed
2. Firebase authentication is valid (`firebase projects:list` succeeds)
3. Node.js is 20 or higher
4. `functions/package.json` exists
5. The target project id resolves — from `--project=`, else the `default` entry
   in `.firebaserc`

### Deployment Process

1. Install dependencies (`npm ci` in `functions/`)
2. Run tests (unless `--skip-tests`)
3. Write `functions/.env.<projectId>`, backing up the previous file
4. Ask for confirmation (unless `--dry-run`)
5. `firebase deploy --project <projectId> --only functions[:<name>]`
6. Record the deployed configuration for the audit trail

### Environment-Specific Retention

| Environment | `CONTACT_REQUEST_RETENTION_DAYS` | Use Case |
|-------------|----------------------------------|----------|
| `dev` | 30 | Development and testing |
| `staging` | 60 | Pre-production validation |
| `production` | 90 | Production environment (the code default) |

## How retention reaches the function

`cleanupOldContactRequests` reads a Firebase Functions **param**, declared in
[`functions/index.js`](../index.js):

```js
const contactRequestRetentionDays = defineInt("CONTACT_REQUEST_RETENTION_DAYS", {
  default: DEFAULT_CONTACT_REQUEST_RETENTION_DAYS,   // 90
});
```

Params are backed by dotenv files, so the scripts write
`functions/.env.<projectId>` — for example `functions/.env.blood-point-app`:

```
CONTACT_REQUEST_RETENTION_DAYS=90
```

Two things follow from this, and both have bitten this project before:

- **There is no `--set-env-vars` flag on the Firebase CLI.** That flag belongs to
  `gcloud`. Earlier revisions of these scripts and docs used it; the deploy would
  have failed outright.
- **Param values are resolved at deploy time and baked into the deployed
  function.** Changing retention always requires a redeploy. Editing the
  environment variable in the Google Cloud console will not survive the next
  deploy.

`firebase functions:config:get` (the legacy `functions.config()` API) is
deprecated and unrelated to params, so the scripts do not use it for backups.

## Safety Features

- **Validated at runtime too**: `0`, negatives, fractions and non-numeric values
  are rejected by the function itself, which logs a warning and falls back to the
  90-day default. A retention of `0` would otherwise put the cutoff at "now" and
  delete every contact request.
- **Configuration backup**: the previous `.env.<projectId>` is copied into a
  timestamped directory before being overwritten.
- **Test execution**: the full suite runs before deployment.
- **Confirmation prompt**: explicit `yes` required before deploying.
- **Dry run**: `--dry-run` prints the file contents and the deploy command
  without writing or deploying anything.
- **Post-deployment record**: the deployed file is copied alongside the backup.

## Backup Location

```
functions/backups/YYYYMMDD_HHMMSS/
├── .env.<projectId>.before   # configuration before deployment (if any existed)
├── .env.<projectId>.after    # configuration as deployed
└── project.txt               # target Firebase project id
```

`functions/backups/` is gitignored.

## Verifying a deployment

The function logs the value it actually used on every run:

```bash
firebase functions:log --only cleanupOldContactRequests
```

Expect `retentionSource: "configured"` and `retentionDays: <your value>` in the
`cleanupOldContactRequests: starting` entry. A `retentionSource: "default"`
means the param did not reach the function and the 90-day default was used.

## Troubleshooting

### Error: Firebase CLI not found

```bash
npm install -g firebase-tools
```

### Error: Not logged in to Firebase

```bash
firebase login
```

### Error: Node.js version too old

Install Node.js 20 or higher from https://nodejs.org/

### Error: Could not determine the Firebase project id

`.firebaserc` has no `projects.default`. Pass the project explicitly:

```bash
./functions/scripts/deploy.sh production --project=blood-point-app
```

### Error: Tests failed

Fix the failing tests before deploying. Do not use `--skip-tests` unless
absolutely necessary.

### `npm ci` fails with a lockfile error

`functions/package-lock.json` must be committed. The root `.gitignore` ignores
`package-lock.json` globally and re-includes this one with
`!functions/package-lock.json`; if that negation is removed, `npm ci` breaks here
and in CI.

## CI/CD Integration

`.github/workflows/functions-ci.yml` runs `npm ci` and `npm test` for changes
under `functions/**`. It does not deploy.

For a deploy job, note that these scripts prompt for confirmation, so pass
`--dry-run` for validation or drive the CLI directly:

```yaml
- name: Deploy Functions
  env:
    FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
  run: |
    printf 'CONTACT_REQUEST_RETENTION_DAYS=90\n' > functions/.env.blood-point-app
    npx --yes firebase-tools deploy --only functions --project blood-point-app
```

## Manual Deployment (Without Scripts)

```bash
cd functions
npm ci
npm test
cd ..

# Write the param value for the target project, then deploy.
echo "CONTACT_REQUEST_RETENTION_DAYS=90" > functions/.env.blood-point-app
firebase deploy --only functions --project blood-point-app
```

Omitting the `.env` file is safe: the param's declared default of 90 days is
resolved by the CLI at deploy time.

## Support

- Check the script output for specific error messages
- Review Firebase logs: `firebase functions:log`
- Operations runbook: [`functions/OPERATIONS_RUNBOOK.md`](../OPERATIONS_RUNBOOK.md)
- Retention design: [`functions/docs/RETENTION_DESIGN.md`](../docs/RETENTION_DESIGN.md)
- Configuration template: [`functions/.env.example`](../.env.example)
