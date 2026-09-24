#!/bin/bash

###############################################################################
# Firebase Functions Deployment Script
# 
# Purpose: Safe deployment of Cloud Functions with pre-deployment checks
# Usage: ./scripts/deploy.sh [environment] [options]
# 
# Environments:
#   - dev: Development environment (retention: 30 days)
#   - staging: Staging environment (retention: 60 days)
#   - production: Production environment (retention: 90 days)
# 
# Options:
#   --skip-tests: Skip test execution (not recommended)
#   --function-only: Deploy only specific function
#   --dry-run: Show what would be deployed without actually deploying
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="${1:-production}"
SKIP_TESTS=false
FUNCTION_ONLY=""
DRY_RUN=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    --function-only=*)
      FUNCTION_ONLY="${arg#*=}"
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
  esac
done

# Environment-specific retention periods
declare -A RETENTION_DAYS=(
  ["dev"]=30
  ["staging"]=60
  ["production"]=90
)

# Validate environment
if [[ ! -v RETENTION_DAYS[$ENVIRONMENT] ]]; then
  echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
  echo -e "Valid options: dev, staging, production"
  exit 1
fi

RETENTION_VALUE=${RETENTION_DAYS[$ENVIRONMENT]}

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

# Step 1: Pre-deployment checks
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🔍 Step 1: Pre-deployment Checks${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
  echo -e "${RED}❌ Firebase CLI not found. Please install: npm install -g firebase-tools${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} Firebase CLI installed"

# Check if logged in
if ! firebase projects:list &> /dev/null; then
  echo -e "${RED}❌ Not logged in to Firebase. Please run: firebase login${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} Firebase authentication verified"

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo -e "${RED}❌ Node.js version 20 or higher required. Current: $(node --version)${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} Node.js version $(node --version)"

# Check if in functions directory
if [ ! -f "package.json" ]; then
  echo -e "${YELLOW}⚠ Not in functions directory. Changing directory...${NC}"
  cd functions || exit 1
fi
echo -e "${GREEN}✓${NC} In functions directory"

# Step 2: Install dependencies
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📦 Step 2: Installing Dependencies${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

npm ci
echo -e "${GREEN}✓${NC} Dependencies installed"

# Step 3: Run tests
if [ "$SKIP_TESTS" = false ]; then
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}🧪 Step 3: Running Tests${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  if npm test; then
    echo -e "${GREEN}✓${NC} All tests passed"
  else
    echo -e "${RED}❌ Tests failed. Deployment aborted.${NC}"
    exit 1
  fi
else
  echo ""
  echo -e "${YELLOW}⚠ Step 3: Tests skipped (--skip-tests flag)${NC}"
fi

# Step 4: Backup current configuration
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}💾 Step 4: Backing Up Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Get current configuration
firebase functions:config:get > "$BACKUP_DIR/config-before.json" 2>/dev/null || echo "{}" > "$BACKUP_DIR/config-before.json"

# Get current project
CURRENT_PROJECT=$(firebase use)
echo "$CURRENT_PROJECT" > "$BACKUP_DIR/project.txt"

echo -e "${GREEN}✓${NC} Configuration backed up to: $BACKUP_DIR"

# Step 5: Confirmation
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}⚠️  Step 5: Deployment Confirmation${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${YELLOW}You are about to deploy to:${NC}"
echo -e "  Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "  Project: ${YELLOW}$CURRENT_PROJECT${NC}"
echo -e "  Retention: ${YELLOW}$RETENTION_VALUE days${NC}"
echo ""

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}🔍 DRY RUN MODE - No actual deployment${NC}"
else
  read -p "Continue with deployment? (yes/no): " -r
  echo
  if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${RED}❌ Deployment cancelled${NC}"
    exit 0
  fi
fi

# Step 6: Deploy
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🚀 Step 6: Deploying Functions${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd ..  # Go back to project root

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}[DRY RUN] Would execute:${NC}"
  if [ -z "$FUNCTION_ONLY" ]; then
    echo "firebase deploy --only functions --set-env-vars CONTACT_REQUEST_RETENTION_DAYS=$RETENTION_VALUE"
  else
    echo "firebase deploy --only functions:$FUNCTION_ONLY --set-env-vars CONTACT_REQUEST_RETENTION_DAYS=$RETENTION_VALUE"
  fi
  echo -e "${GREEN}✓${NC} Dry run completed"
else
  if [ -z "$FUNCTION_ONLY" ]; then
    firebase deploy --only functions --set-env-vars CONTACT_REQUEST_RETENTION_DAYS=$RETENTION_VALUE
  else
    firebase deploy --only functions:$FUNCTION_ONLY --set-env-vars CONTACT_REQUEST_RETENTION_DAYS=$RETENTION_VALUE
  fi
  echo -e "${GREEN}✓${NC} Deployment completed"
fi

# Step 7: Post-deployment verification
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Step 7: Post-Deployment Verification${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "$DRY_RUN" = false ]; then
  # Save post-deployment configuration
  firebase functions:config:get > "functions/$BACKUP_DIR/config-after.json" 2>/dev/null || echo "{}" > "functions/$BACKUP_DIR/config-after.json"
  
  echo -e "${GREEN}✓${NC} Post-deployment configuration saved"
  echo ""
  echo -e "${YELLOW}📝 Next Steps:${NC}"
  echo -e "  1. Monitor function logs: ${BLUE}firebase functions:log --only cleanupOldContactRequests${NC}"
  echo -e "  2. Verify next scheduled run (03:30 UTC): Check logs for retention days"
  echo -e "  3. Review Firebase Console: https://console.firebase.google.com"
  echo ""
  echo -e "${GREEN}✓${NC} Backup location: ${BLUE}functions/$BACKUP_DIR${NC}"
else
  echo -e "${YELLOW}[DRY RUN] No verification needed${NC}"
fi

# Summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  Deployment Summary                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo -e "${GREEN}✓${NC} Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "${GREEN}✓${NC} Retention Period: ${YELLOW}$RETENTION_VALUE days${NC}"
echo -e "${GREEN}✓${NC} Status: ${GREEN}SUCCESS${NC}"
echo ""

exit 0
