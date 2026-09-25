@echo off
REM ###############################################################################
REM Firebase Functions Deployment Script (Windows)
REM
REM Purpose: Safe deployment of Cloud Functions with pre-deployment checks.
REM Usage:   functions\scripts\deploy.bat [environment] [options]
REM
REM Environments -- set CONTACT_REQUEST_RETENTION_DAYS:
REM   - dev:        30 days
REM   - staging:    60 days
REM   - production: 90 days   [default]
REM
REM Options:
REM   --skip-tests           Skip test execution -- not recommended
REM   --function-only=NAME   Deploy a single function, e.g.
REM                          --function-only=cleanupOldContactRequests
REM   --project=PROJECT_ID   Target a specific Firebase project
REM                          default: the "default" entry in .firebaserc
REM   --dry-run              Show what would be written and deployed, change nothing
REM
REM How retention is configured
REM   cleanupOldContactRequests reads CONTACT_REQUEST_RETENTION_DAYS, declared in
REM   functions/index.js with defineInt. Firebase Functions params are backed by
REM   dotenv files, so this script writes functions\.env.<projectId> and then runs
REM   a plain `firebase deploy`. There is no --set-env-vars flag on the Firebase
REM   CLI -- that is a gcloud flag -- and `firebase functions:config:get` is the
REM   deprecated legacy config API, unrelated to params.
REM
REM   Param values are resolved at deploy time and baked into the deployed
REM   function, so changing retention always requires a redeploy.
REM ###############################################################################

setlocal enabledelayedexpansion

REM Resolve the repository root from this script's own location
REM functions\scripts\deploy.bat -> ..\.. , so the script works from any cwd.
for %%I in ("%~dp0..\..") do set "ROOT_DIR=%%~fI"
set "FUNCTIONS_DIR=%ROOT_DIR%\functions"

REM Default values
set "ENVIRONMENT=production"
set "SKIP_TESTS=false"
set "DRY_RUN=false"
set "FUNCTION_ONLY="
set "PROJECT_OVERRIDE="

REM Parse arguments. The first bare word, if any, is the environment.
REM
REM cmd treats "=" as an argument delimiter, so --function-only=NAME arrives as
REM two positional arguments ("--function-only" then "NAME"). Both the "=" and
REM the space form are therefore read from %2; the substring branches below
REM additionally cover a fully quoted "--function-only=NAME".
:parse_args
if "%~1"=="" goto args_done
set "ARG=%~1"

if /i "!ARG!"=="--skip-tests" (
    set "SKIP_TESTS=true"
    goto next_arg
)
if /i "!ARG!"=="--dry-run" (
    set "DRY_RUN=true"
    goto next_arg
)
if /i "!ARG!"=="--function-only" (
    set "FUNCTION_ONLY=%~2"
    shift
    goto next_arg
)
if /i "!ARG!"=="--project" (
    set "PROJECT_OVERRIDE=%~2"
    shift
    goto next_arg
)
if /i "!ARG:~0,16!"=="--function-only=" (
    set "FUNCTION_ONLY=!ARG:~16!"
    goto next_arg
)
if /i "!ARG:~0,10!"=="--project=" (
    set "PROJECT_OVERRIDE=!ARG:~10!"
    goto next_arg
)
if "!ARG:~0,2!"=="--" (
    echo [ERROR] Unknown option: !ARG!
    exit /b 1
)
set "ENVIRONMENT=!ARG!"

:next_arg
shift
goto parse_args

:args_done

REM Environment-specific retention periods in days
if /i "%ENVIRONMENT%"=="dev" (
    set "RETENTION_VALUE=30"
) else if /i "%ENVIRONMENT%"=="staging" (
    set "RETENTION_VALUE=60"
) else if /i "%ENVIRONMENT%"=="production" (
    set "RETENTION_VALUE=90"
) else (
    echo [ERROR] Invalid environment: %ENVIRONMENT%
    echo Valid options: dev, staging, production
    exit /b 1
)

echo ================================================================
echo        Firebase Functions Deployment Script
echo ================================================================
echo.
echo [INFO] Deployment Configuration:
echo    Environment: %ENVIRONMENT%
echo    Retention Period: %RETENTION_VALUE% days
echo    Skip Tests: %SKIP_TESTS%
if defined FUNCTION_ONLY (echo    Function Only: %FUNCTION_ONLY%) else (echo    Function Only: all)
echo    Dry Run: %DRY_RUN%
echo.

REM ---------------------------------------------------------------------------
REM Step 1: Pre-deployment checks
REM ---------------------------------------------------------------------------
echo ----------------------------------------------------------------
echo [STEP 1] Pre-deployment Checks
echo ----------------------------------------------------------------

where firebase >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Firebase CLI not found. Please install: npm install -g firebase-tools
    exit /b 1
)
echo [OK] Firebase CLI installed

firebase projects:list >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Not logged in to Firebase. Please run: firebase login
    exit /b 1
)
echo [OK] Firebase authentication verified

for /f "tokens=1 delims=v." %%a in ('node --version') do set "NODE_MAJOR=%%a"
set "NODE_MAJOR=%NODE_MAJOR:~1%"
if %NODE_MAJOR% LSS 20 (
    echo [ERROR] Node.js version 20 or higher required
    exit /b 1
)
echo [OK] Node.js version check passed

if not exist "%FUNCTIONS_DIR%\package.json" (
    echo [ERROR] Functions directory not found at: %FUNCTIONS_DIR%
    exit /b 1
)
echo [OK] Functions directory: %FUNCTIONS_DIR%

REM Resolve the target project id. The params dotenv file must be named after
REM the project id, so this has to be exact.
set "PROJECT_ID="
if defined PROJECT_OVERRIDE (
    set "PROJECT_ID=%PROJECT_OVERRIDE%"
) else (
    REM .firebaserc is JSON but has no .json extension, so it must be parsed by
    REM hand -- require would try to interpret it as JavaScript and throw.
    for /f "usebackq delims=" %%I in (`node -e "try{var rc=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));var p=rc.projects||{};process.stdout.write(String(p.default||Object.values(p)[0]||''))}catch(e){}" "%ROOT_DIR%\.firebaserc"`) do set "PROJECT_ID=%%I"
)

if not defined PROJECT_ID (
    echo [ERROR] Could not determine the Firebase project id.
    echo         Pass it explicitly: --project=^<projectId^>
    exit /b 1
)
echo [OK] Target project: %PROJECT_ID%

REM ---------------------------------------------------------------------------
REM Step 2: Install dependencies
REM ---------------------------------------------------------------------------
echo.
echo ----------------------------------------------------------------
echo [STEP 2] Installing Dependencies
echo ----------------------------------------------------------------

REM npm ci needs functions\package-lock.json, which is committed for this.
pushd "%FUNCTIONS_DIR%"
call npm ci
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    popd
    exit /b 1
)
popd
echo [OK] Dependencies installed

REM ---------------------------------------------------------------------------
REM Step 3: Run tests
REM ---------------------------------------------------------------------------
if "%SKIP_TESTS%"=="false" (
    echo.
    echo ----------------------------------------------------------------
    echo [STEP 3] Running Tests
    echo ----------------------------------------------------------------

    pushd "%FUNCTIONS_DIR%"
    call npm test
    if errorlevel 1 (
        echo [ERROR] Tests failed. Deployment aborted.
        popd
        exit /b 1
    )
    popd
    echo [OK] All tests passed
) else (
    echo.
    echo [WARNING] Step 3: Tests skipped -- --skip-tests flag
)

REM ---------------------------------------------------------------------------
REM Step 4: Write the retention configuration, backing up the previous one
REM ---------------------------------------------------------------------------
echo.
echo ----------------------------------------------------------------
echo [STEP 4] Writing Retention Configuration
echo ----------------------------------------------------------------

set "ENV_FILE=%FUNCTIONS_DIR%\.env.%PROJECT_ID%"

REM Locale-independent timestamp via node, which is already a hard requirement.
for /f "usebackq delims=" %%I in (`node -e "var d=new Date(),p=function(n){return String(n).padStart(2,'0')};process.stdout.write(''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'_'+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds()))"`) do set "STAMP=%%I"
set "BACKUP_DIR=%FUNCTIONS_DIR%\backups\%STAMP%"

for /f "usebackq delims=" %%I in (`node -e "process.stdout.write(new Date().toISOString())"`) do set "GENERATED_AT=%%I"

if "%DRY_RUN%"=="true" (
    echo [DRY RUN] Would write %ENV_FILE%:
    set "ENV_OUT="
) else (
    mkdir "%BACKUP_DIR%" 2>nul
    if exist "%ENV_FILE%" (
        copy /y "%ENV_FILE%" "%BACKUP_DIR%\.env.%PROJECT_ID%.before" >nul
        echo [OK] Previous configuration backed up to: %BACKUP_DIR%
    ) else (
        echo [WARNING] No existing %ENV_FILE% to back up -- first deploy for this project
    )
    echo %PROJECT_ID% > "%BACKUP_DIR%\project.txt"
    REM Truncate, then append each line via :emit.
    break > "%ENV_FILE%"
    set "ENV_OUT=%ENV_FILE%"
)

call :emit "# Generated by functions/scripts/deploy.bat on %GENERATED_AT%"
call :emit "# Environment: %ENVIRONMENT%   Project: %PROJECT_ID%"
call :emit "# Backs the CONTACT_REQUEST_RETENTION_DAYS param declared in functions/index.js."
call :emit "# Not committed -- see functions/.gitignore. Edit via this script, then redeploy."
call :emit "CONTACT_REQUEST_RETENTION_DAYS=%RETENTION_VALUE%"

if "%DRY_RUN%"=="false" (
    echo [OK] Wrote CONTACT_REQUEST_RETENTION_DAYS=%RETENTION_VALUE% to %ENV_FILE%
)

REM ---------------------------------------------------------------------------
REM Step 5: Confirmation
REM ---------------------------------------------------------------------------
echo.
echo ----------------------------------------------------------------
echo [STEP 5] Deployment Confirmation
echo ----------------------------------------------------------------

echo [WARNING] You are about to deploy to:
echo    Environment: %ENVIRONMENT%
echo    Project: %PROJECT_ID%
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

REM ---------------------------------------------------------------------------
REM Step 6: Deploy
REM ---------------------------------------------------------------------------
echo.
echo ----------------------------------------------------------------
echo [STEP 6] Deploying Functions
echo ----------------------------------------------------------------

set "DEPLOY_TARGET=functions"
if defined FUNCTION_ONLY set "DEPLOY_TARGET=functions:%FUNCTION_ONLY%"

if "%DRY_RUN%"=="true" (
    echo [DRY RUN] Would execute from %ROOT_DIR%:
    echo     firebase deploy --project %PROJECT_ID% --only %DEPLOY_TARGET%
    echo [OK] Dry run completed
) else (
    pushd "%ROOT_DIR%"
    call firebase deploy --project "%PROJECT_ID%" --only "%DEPLOY_TARGET%"
    if errorlevel 1 (
        echo [ERROR] Deployment failed
        popd
        exit /b 1
    )
    popd
    echo [OK] Deployment completed
)

REM ---------------------------------------------------------------------------
REM Step 7: Post-deployment verification
REM ---------------------------------------------------------------------------
echo.
echo ----------------------------------------------------------------
echo [STEP 7] Post-Deployment Verification
echo ----------------------------------------------------------------

if "%DRY_RUN%"=="false" (
    copy /y "%ENV_FILE%" "%BACKUP_DIR%\.env.%PROJECT_ID%.after" >nul
    echo [OK] Deployed configuration recorded
    echo.
    echo [INFO] Next Steps:
    echo    1. Confirm the effective value in the logs -- the function logs
    echo       retentionDays and retentionSource on every run:
    echo       firebase functions:log --only cleanupOldContactRequests
    echo    2. Expect retentionSource "configured" and retentionDays %RETENTION_VALUE%.
    echo       A "default" source means the param did not reach the function.
    echo    3. Next scheduled run is 03:30 UTC. To verify immediately, trigger it
    echo       from the Cloud Scheduler job in the Google Cloud console.
    echo.
    echo [OK] Backup location: %BACKUP_DIR%
) else (
    echo [INFO] No verification needed -- dry run
)

REM ---------------------------------------------------------------------------
REM Summary
REM ---------------------------------------------------------------------------
echo.
echo ================================================================
echo                   Deployment Summary
echo ================================================================
echo [OK] Environment: %ENVIRONMENT%
echo [OK] Project: %PROJECT_ID%
echo [OK] Retention Period: %RETENTION_VALUE% days
echo [OK] Status: SUCCESS
echo.

exit /b 0

REM ---------------------------------------------------------------------------
REM :emit -- append a line to ENV_OUT, or print it indented when unset
REM          i.e. in dry-run mode. Keep argument text free of parentheses.
REM ---------------------------------------------------------------------------
:emit
if defined ENV_OUT (
    >>"%ENV_OUT%" echo %~1
) else (
    echo     %~1
)
exit /b 0
