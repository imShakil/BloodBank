#!/bin/bash

###############################################################################
# Firebase Functions Deployment Script
#
# Purpose: Safe deployment of Cloud Functions with pre-deployment checks.
# Usage:   ./functions/scripts/deploy.sh [environment] [options]
#
# Environments (set CONTACT_REQUEST_RETENTION_DAYS):
#   - dev:        30 days
#   - staging:    60 days
#   - production: 90 days   (default)
#
# Options:
#   --skip-tests           Skip test execution (not recommended)
#   --function-only=NAME   Deploy a single function, e.g.
#                          --function-only=cleanupOldContactRequests
#   --project=PROJECT_ID   Target a specific Firebase project
#                          (default: the "default" entry in .firebaserc)
#   --dry-run              Show what would be written and deployed, change nothing
#
# How retention is configured
#   cleanupOldContactRequests reads CONTACT_REQUEST_RETENTION_DAYS, declared in
#   functions/index.js with defineInt(). Firebase Functions params are backed by
#   dotenv files, so this script writes functions/.env.<projectId> and then runs
#   a plain `firebase deploy`. There is no `--set-env-vars` flag on the Firebase
#   CLI — that is a gcloud flag — and `firebase functions:config:get` is the
#   deprecated legacy config API, unrelated to params.
#
#   Param values are resolved at deploy time and baked into the deployed
#   function, so changing retention always requires a redeploy.
###############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Resolve the repository root from this script's own location
# (functions/scripts/deploy.sh -> ../..), so the script works from any cwd.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
FUNCTIONS_DIR="$ROOT_DIR/functions"

# Default values
ENVIRONMENT="production"
SKIP_TESTS=false
FUNCTION_ONLY=""
PROJECT_OVERRIDE=""
DRY_RUN=false

# Parse arguments. The first bare word (if any) is the environment.
for arg in "$@"; do
  case $arg in
    --skip-tests)      SKIP_TESTS=true ;;
    --dry-run)         DRY_RUN=true ;;
    --function-only=*) FUNCTION_ONLY="${arg#*=}" ;;
    --project=*)       PROJECT_OVERRIDE="${arg#*=}" ;;
    --*)
      echo -e "${RED}❌ Unknown option: $arg${NC}"
      exit 1
      ;;
    *)                 ENVIRONMENT="$arg" ;;
  esac
done

# Environment-specific retention periods (days)
case "$ENVIRONMENT" in
  dev)        RETENTION_VALUE=30 ;;
  staging)    RETENTION_VALUE=60 ;;
  production) RETENTION_VALUE=90 ;;
  *)
    echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
    echo -e "Valid options: dev, staging, production"
    exit 1
    ;;
esac

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Firebase Functions Deployment Script                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📋 Deployment Configuration:${NC}"
echo -e "   Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "   Retention Period: ${YELLOW}$RETENTION_VALUE days${NC}"
echo -e "   Skip Tests: ${YELLOW}$SKIP_TESTS${NC}"
echo -e "   Function Only: ${YELLOW}${FUNCTION_ONLY:-all}${NC}"
echo -e "   Dry Run: ${YELLOW}$DRY_RUN${NC}"
echo ""

# ---------------------------------------------------------------------------
# Step 1: Pre-deployment checks
# ---------------------------------------------------------------------------
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🔍 Step 1: Pre-deployment Checks${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if ! command -v firebase &> /dev/null; then
  echo -e "${RED}❌ Firebase CLI not found. Please install: npm install -g firebase-tools${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} Firebase CLI installed"

if ! firebase projects:list &> /dev/null; then
  echo -e "${RED}❌ Not logged in to Firebase. Please run: firebase login${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} Firebase authentication verified"

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo -e "${RED}❌ Node.js version 20 or higher required. Current: $(node --version)${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} Node.js version $(node --version)"

if [ ! -f "$FUNCTIONS_DIR/package.json" ]; then
  echo -e "${RED}❌ Functions directory not found at: $FUNCTIONS_DIR${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} Functions directory: $FUNCTIONS_DIR"

# Resolve the target project id. The params dotenv file must be named after the
# project id, so this has to be exact.
if [ -n "$PROJECT_OVERRIDE" ]; then
  PROJECT_ID="$PROJECT_OVERRIDE"
else
  # .firebaserc is JSON but has no .json extension, so it must be parsed by
  # hand — require() would try to interpret it as JavaScript and throw.
  PROJECT_ID=$(node -e '
    try {
      const rc = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
      const projects = (rc && rc.projects) || {};
      process.stdout.write(String(projects.default || Object.values(projects)[0] || ""));
    } catch (e) { process.stdout.write(""); }
  ' "$ROOT_DIR/.firebaserc")
fi

if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}❌ Could not determine the Firebase project id.${NC}"
  echo -e "   Pass it explicitly: ${BLUE}--project=<projectId>${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} Target project: $PROJECT_ID"

# ---------------------------------------------------------------------------
# Step 2: Install dependencies
# ---------------------------------------------------------------------------
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📦 Step 2: Installing Dependencies${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# npm ci needs functions/package-lock.json, which is committed for exactly this.
(cd "$FUNCTIONS_DIR" && npm ci)
echo -e "${GREEN}✓${NC} Dependencies installed"

# ---------------------------------------------------------------------------
# Step 3: Run tests
# ---------------------------------------------------------------------------
if [ "$SKIP_TESTS" = false ]; then
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}🧪 Step 3: Running Tests${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  if (cd "$FUNCTIONS_DIR" && npm test); then
    echo -e "${GREEN}✓${NC} All tests passed"
  else
    echo -e "${RED}❌ Tests failed. Deployment aborted.${NC}"
    exit 1
  fi
else
  echo ""
  echo -e "${YELLOW}⚠ Step 3: Tests skipped (--skip-tests flag)${NC}"
fi

# ---------------------------------------------------------------------------
# Step 4: Write the retention configuration (and back up the previous one)
# ---------------------------------------------------------------------------
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}💾 Step 4: Writing Retention Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

ENV_FILE="$FUNCTIONS_DIR/.env.$PROJECT_ID"
BACKUP_DIR="$FUNCTIONS_DIR/backups/$(date +%Y%m%d_%H%M%S)"

# The file content is identical in dry-run and real mode; only writing differs.
ENV_CONTENT="# Generated by functions/scripts/deploy.sh on $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Environment: $ENVIRONMENT   Project: $PROJECT_ID
# Backs the CONTACT_REQUEST_RETENTION_DAYS param declared in functions/index.js.
# Not committed (see functions/.gitignore). Edit via this script, then redeploy.
CONTACT_REQUEST_RETENTION_DAYS=$RETENTION_VALUE"

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}[DRY RUN] Would write $ENV_FILE:${NC}"
  echo "$ENV_CONTENT" | sed 's/^/    /'
else
  mkdir -p "$BACKUP_DIR"
  if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "$BACKUP_DIR/.env.$PROJECT_ID.before"
    echo -e "${GREEN}✓${NC} Previous configuration backed up to: $BACKUP_DIR"
  else
    echo -e "${YELLOW}⚠${NC} No existing $ENV_FILE to back up (first deploy for this project)"
  fi
  echo "$PROJECT_ID" > "$BACKUP_DIR/project.txt"
  echo "$ENV_CONTENT" > "$ENV_FILE"
  echo -e "${GREEN}✓${NC} Wrote CONTACT_REQUEST_RETENTION_DAYS=$RETENTION_VALUE to $ENV_FILE"
fi

# ---------------------------------------------------------------------------
# Step 5: Confirmation
# ---------------------------------------------------------------------------
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}⚠️  Step 5: Deployment Confirmation${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${YELLOW}You are about to deploy to:${NC}"
echo -e "  Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "  Project: ${YELLOW}$PROJECT_ID${NC}"
echo -e "  Retention: ${YELLOW}$RETENTION_VALUE days${NC}"
echo ""

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}🔍 DRY RUN MODE - No actual deployment${NC}"
else
  read -p "Continue with deployment? (yes/no): " -r REPLY
  echo
  if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${RED}❌ Deployment cancelled${NC}"
    exit 0
  fi
fi

# ---------------------------------------------------------------------------
# Step 6: Deploy
# ---------------------------------------------------------------------------
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🚀 Step 6: Deploying Functions${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

DEPLOY_TARGET="functions"
if [ -n "$FUNCTION_ONLY" ]; then
  DEPLOY_TARGET="functions:$FUNCTION_ONLY"
fi

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}[DRY RUN] Would execute (from $ROOT_DIR):${NC}"
  echo "    firebase deploy --project $PROJECT_ID --only $DEPLOY_TARGET"
  echo -e "${GREEN}✓${NC} Dry run completed"
else
  (cd "$ROOT_DIR" && firebase deploy --project "$PROJECT_ID" --only "$DEPLOY_TARGET")
  echo -e "${GREEN}✓${NC} Deployment completed"
fi

# ---------------------------------------------------------------------------
# Step 7: Post-deployment verification
# ---------------------------------------------------------------------------
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Step 7: Post-Deployment Verification${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "$DRY_RUN" = false ]; then
  cp "$ENV_FILE" "$BACKUP_DIR/.env.$PROJECT_ID.after"
  echo -e "${GREEN}✓${NC} Deployed configuration recorded"
  echo ""
  echo -e "${YELLOW}📝 Next Steps:${NC}"
  echo -e "  1. Confirm the effective value in the logs — the function logs"
  echo -e "     ${BLUE}retentionDays${NC} and ${BLUE}retentionSource${NC} on every run:"
  echo -e "     ${BLUE}firebase functions:log --only cleanupOldContactRequests${NC}"
  echo -e "  2. Expect ${BLUE}retentionSource: \"configured\"${NC} and ${BLUE}retentionDays: $RETENTION_VALUE${NC}."
  echo -e "     A ${BLUE}\"default\"${NC} source means the param did not reach the function."
  echo -e "  3. Next scheduled run is 03:30 UTC. To verify immediately, trigger it"
  echo -e "     from the Cloud Scheduler job in the Google Cloud console."
  echo ""
  echo -e "${GREEN}✓${NC} Backup location: ${BLUE}$BACKUP_DIR${NC}"
else
  echo -e "${YELLOW}[DRY RUN] No verification needed${NC}"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  Deployment Summary                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo -e "${GREEN}✓${NC} Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "${GREEN}✓${NC} Project: ${YELLOW}$PROJECT_ID${NC}"
echo -e "${GREEN}✓${NC} Retention Period: ${YELLOW}$RETENTION_VALUE days${NC}"
echo -e "${GREEN}✓${NC} Status: ${GREEN}SUCCESS${NC}"
echo ""

exit 0
