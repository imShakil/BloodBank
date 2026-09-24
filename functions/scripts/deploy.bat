@echo off
REM ###############################################################################
REM Firebase Functions Deployment Script (Windows)
REM 
REM Purpose: Safe deployment of Cloud Functions with pre-deployment checks
REM Usage: scripts\deploy.bat [environment] [options]
REM 
REM Environments:
REM   - dev: Development environment (retention: 30 days)
REM   - staging: Staging environment (retention: 60 days)
REM   - production: Production environment (retention: 90 days)
REM 
REM Options:
REM   --skip-tests: Skip test execution (not recommended)
REM   --dry-run: Show what would be deployed without actually deploying
REM ###############################################################################

setlocal enabledelayedexpansion

REM Default values
set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=production

set SKIP_TESTS=false
set DRY_RUN=false

REM Parse arguments
:parse_args
if "%2"=="--skip-tests" set SKIP_TESTS=true
if "%2"=="--dry-run" set DRY_RUN=true
shift
if not "%2"=="" goto parse_args

REM Set retention based on environment
if "%ENVIRONMENT%"=="dev" (
    set RETENTION_VALUE=30
) else if "%ENVIRONMENT%"=="staging" (
    set RETENTION_VALUE=60
) else if "%ENVIRONMENT%"=="production" (
    set RETENTION_VALUE=90
) else (
    echo [ERROR] Invalid environment: %ENVIRONMENT%
    echo Valid options: dev, staging, production
    exit /b 1
)

echo ╔════════════════════════════════════════════════════════════════╗
echo ║       Firebase Functions Deployment Script                     ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo [INFO] Deployment Configuration:
echo    Environment: %ENVIRONMENT%
echo    Retention Period: %RETENTION_VALUE% days
echo    Skip Tests: %SKIP_TESTS%
echo    Dry Run: %DRY_RUN%
echo.

REM Step 1: Pre-deployment checks
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo [STEP 1] Pre-deployment Checks
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REM Check if Firebase CLI is installed
where firebase >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Firebase CLI not found. Please install: npm install -g firebase-tools
    exit /b 1
)
echo [OK] Firebase CLI installed

REM Check if logged in
firebase projects:list >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Not logged in to Firebase. Please run: firebase login
    exit /b 1
)
echo [OK] Firebase authentication verified

REM Check Node.js version
for /f "tokens=1 delims=v." %%a in ('node --version') do set NODE_MAJOR=%%a
set NODE_MAJOR=%NODE_MAJOR:~1%
if %NODE_MAJOR% LSS 20 (
    echo [ERROR] Node.js version 20 or higher required
    exit /b 1
)
echo [OK] Node.js version check passed

REM Check if in functions directory
if not exist "package.json" (
    echo [INFO] Changing to functions directory...
    cd functions
    if errorlevel 1 (
        echo [ERROR] Functions directory not found
        exit /b 1
    )
)
echo [OK] In functions directory

REM Step 2: Install dependencies
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo [STEP 2] Installing Dependencies
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

call npm ci
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)
echo [OK] Dependencies installed

REM Step 3: Run tests
if "%SKIP_TESTS%"=="false" (
    echo.
    echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    echo [STEP 3] Running Tests
    echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    call npm test
    if errorlevel 1 (
        echo [ERROR] Tests failed. Deployment aborted.
        exit /b 1
    )
    echo [OK] All tests passed
) else (
    echo.
    echo [WARNING] Step 3: Tests skipped (--skip-tests flag)
)

REM Step 4: Backup current configuration
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo [STEP 4] Backing Up Configuration
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set BACKUP_DIR=backups\%date:~-4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set BACKUP_DIR=%BACKUP_DIR: =0%
mkdir "%BACKUP_DIR%" 2>nul

firebase functions:config:get > "%BACKUP_DIR%\config-before.json" 2>nul
if errorlevel 1 (
    echo {} > "%BACKUP_DIR%\config-before.json"
)

firebase use > "%BACKUP_DIR%\project.txt" 2>nul

echo [OK] Configuration backed up to: %BACKUP_DIR%

REM Step 5: Confirmation
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo [STEP 5] Deployment Confirmation
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo [WARNING] You are about to deploy to:
echo    Environment: %ENVIRONMENT%
echo    Retention: %RETENTION_VALUE% days
echo.

if "%DRY_RUN%"=="true" (
    echo [INFO] DRY RUN MODE - No actual deployment
) else (
    set /p CONFIRM="Continue with deployment? (yes/no): "
    if /i not "!CONFIRM!"=="yes" (
        echo [INFO] Deployment cancelled
        exit /b 0
    )
)

REM Step 6: Deploy
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo [STEP 6] Deploying Functions
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cd ..

if "%DRY_RUN%"=="true" (
    echo [DRY RUN] Would execute:
    echo firebase deploy --only functions --set-env-vars CONTACT_REQUEST_RETENTION_DAYS=%RETENTION_VALUE%
    echo [OK] Dry run completed
) else (
    firebase deploy --only functions --set-env-vars CONTACT_REQUEST_RETENTION_DAYS=%RETENTION_VALUE%
    if errorlevel 1 (
        echo [ERROR] Deployment failed
        exit /b 1
    )
    echo [OK] Deployment completed
)

REM Step 7: Post-deployment verification
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo [STEP 7] Post-Deployment Verification
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if "%DRY_RUN%"=="false" (
    firebase functions:config:get > "functions\%BACKUP_DIR%\config-after.json" 2>nul
    
    echo [OK] Post-deployment configuration saved
    echo.
    echo [INFO] Next Steps:
    echo    1. Monitor function logs: firebase functions:log --only cleanupOldContactRequests
    echo    2. Verify next scheduled run (03:30 UTC): Check logs for retention days
    echo    3. Review Firebase Console: https://console.firebase.google.com
    echo.
    echo [OK] Backup location: functions\%BACKUP_DIR%
) else (
    echo [INFO] No verification needed (dry run)
)

REM Summary
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                  Deployment Summary                            ║
echo ╚════════════════════════════════════════════════════════════════╝
echo [OK] Environment: %ENVIRONMENT%
echo [OK] Retention Period: %RETENTION_VALUE% days
echo [OK] Status: SUCCESS
echo.

exit /b 0
