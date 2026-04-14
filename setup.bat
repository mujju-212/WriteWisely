@echo off
REM ╔══════════════════════════════════════════════════════════════════╗
REM ║              WriteWisely — One-Click Setup Script               ║
REM ║         Run this script to set up the entire project.           ║
REM ╚══════════════════════════════════════════════════════════════════╝

setlocal EnableDelayedExpansion
title WriteWisely Setup

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                                                              ║
echo  ║          ✍  W R I T E W I S E L Y    S E T U P              ║
echo  ║              AI-Powered Writing Coach                        ║
echo  ║                                                              ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

REM ──────────────────────────────────────────────────────────────────
REM  Step 1: Check Prerequisites
REM ──────────────────────────────────────────────────────────────────
echo  [1/6] Checking prerequisites...
echo.

REM -- Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Python is not installed or not in PATH.
    echo          Please install Python 3.10+ from https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VER=%%i
echo   ✓ Python %PYTHON_VER% detected

REM -- Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed or not in PATH.
    echo          Please install Node.js 18+ from https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f %%i in ('node --version') do set NODE_VER=%%i
echo   ✓ Node.js %NODE_VER% detected

REM -- Check npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] npm is not installed or not in PATH.
    echo.
    pause
    exit /b 1
)
for /f %%i in ('npm --version') do set NPM_VER=%%i
echo   ✓ npm %NPM_VER% detected

echo.
echo  ──────────────────────────────────────────────────────────────
echo.

REM ──────────────────────────────────────────────────────────────────
REM  Step 2: Backend Virtual Environment
REM ──────────────────────────────────────────────────────────────────
echo  [2/6] Setting up Python virtual environment...

if not exist "backend\venv" (
    echo   Creating virtual environment in backend\venv...
    python -m venv backend\venv
    if %errorlevel% neq 0 (
        echo  [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo   ✓ Virtual environment created
) else (
    echo   ✓ Virtual environment already exists — skipping
)

echo.
echo  ──────────────────────────────────────────────────────────────
echo.

REM ──────────────────────────────────────────────────────────────────
REM  Step 3: Install Backend Dependencies
REM ──────────────────────────────────────────────────────────────────
echo  [3/6] Installing backend dependencies...
echo.

call backend\venv\Scripts\activate.bat
pip install -r backend\requirements.txt --quiet
if %errorlevel% neq 0 (
    echo  [ERROR] Failed to install backend dependencies.
    pause
    exit /b 1
)
echo   ✓ Backend dependencies installed

echo.
echo  ──────────────────────────────────────────────────────────────
echo.

REM ──────────────────────────────────────────────────────────────────
REM  Step 4: Create .env File (if not exists)
REM ──────────────────────────────────────────────────────────────────
echo  [4/6] Checking environment configuration...

if not exist "backend\.env" (
    echo   Creating backend\.env with default template...
    (
        echo # ── WriteWisely Backend Configuration ──
        echo.
        echo # Core
        echo MONGODB_URL=mongodb://localhost:27017/writewisely
        echo JWT_SECRET=change-this-to-a-strong-random-secret
        echo JWT_ALGORITHM=HS256
        echo JWT_EXPIRY_HOURS=24
        echo.
        echo # LLM Providers ^(set at least one API key^)
        echo GEMINI_API_KEY=
        echo GEMINI_MODEL=gemini-2.0-flash
        echo.
        echo OPENROUTER_API_KEY=
        echo LLM_MODEL=google/gemma-3-12b-it:free
        echo.
        echo HF_API_KEY=
        echo HF_MODEL=meta-llama/Llama-3.2-1B-Instruct
        echo.
        echo # OTP / Email
        echo MAILERSEND_API_KEY=
        echo MAILERSEND_DOMAIN=
        echo SENDER_EMAIL=
        echo SENDER_NAME=WriteWisely
        echo ALLOW_OTP_DEV_FALLBACK=true
        echo.
        echo # Local Mongo Recovery
        echo AUTO_START_LOCAL_MONGO=true
        echo LOCAL_MONGO_DBPATH=
    ) > backend\.env
    echo   ✓ Environment file created at backend\.env
    echo   ⚠  IMPORTANT: Edit backend\.env and add your API keys before running!
) else (
    echo   ✓ backend\.env already exists — skipping
)

echo.
echo  ──────────────────────────────────────────────────────────────
echo.

REM ──────────────────────────────────────────────────────────────────
REM  Step 5: Install Frontend Dependencies
REM ──────────────────────────────────────────────────────────────────
echo  [5/6] Installing frontend dependencies...
echo.

cd frontend
call npm install --silent
if %errorlevel% neq 0 (
    echo  [ERROR] Failed to install frontend dependencies.
    cd ..
    pause
    exit /b 1
)
cd ..
echo   ✓ Frontend dependencies installed

echo.
echo  ──────────────────────────────────────────────────────────────
echo.

REM ──────────────────────────────────────────────────────────────────
REM  Step 6: Summary
REM ──────────────────────────────────────────────────────────────────
echo  [6/6] Setup complete!
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                                                              ║
echo  ║   ✅  WriteWisely is ready to go!                            ║
echo  ║                                                              ║
echo  ║   Before you start, make sure to:                            ║
echo  ║                                                              ║
echo  ║   1. Start MongoDB (local or Atlas)                          ║
echo  ║   2. Edit backend\.env with your API keys                    ║
echo  ║   3. Set a strong JWT_SECRET value                           ║
echo  ║                                                              ║
echo  ║   To start the app:                                          ║
echo  ║                                                              ║
echo  ║   Backend:                                                   ║
echo  ║     cd backend                                               ║
echo  ║     venv\Scripts\activate                                    ║
echo  ║     uvicorn main:app --reload                                ║
echo  ║                                                              ║
echo  ║   Frontend (new terminal):                                   ║
echo  ║     cd frontend                                              ║
echo  ║     npm run dev                                              ║
echo  ║                                                              ║
echo  ║   Or use: start.bat (coming soon)                            ║
echo  ║                                                              ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
pause
