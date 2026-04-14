#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════╗
# ║              WriteWisely — One-Click Setup Script               ║
# ║      Run this script to set up the entire project (Linux/Mac)   ║
# ╚══════════════════════════════════════════════════════════════════╝

set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}${BOLD}"
echo "  ╔══════════════════════════════════════════════════════════════╗"
echo "  ║                                                              ║"
echo "  ║          ✍  W R I T E W I S E L Y    S E T U P              ║"
echo "  ║              AI-Powered Writing Coach                        ║"
echo "  ║                                                              ║"
echo "  ╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ──────────────────────────────────────────────────────────────────
# Step 1: Check Prerequisites
# ──────────────────────────────────────────────────────────────────
echo -e "  ${BOLD}[1/6] Checking prerequisites...${NC}"
echo ""

# -- Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "  ${RED}[ERROR] Python3 is not installed.${NC}"
    echo "         Please install Python 3.10+ from https://www.python.org/downloads/"
    exit 1
fi
PYTHON_VER=$(python3 --version | awk '{print $2}')
echo -e "  ${GREEN}✓${NC} Python ${PYTHON_VER} detected"

# -- Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "  ${RED}[ERROR] Node.js is not installed.${NC}"
    echo "         Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi
NODE_VER=$(node --version)
echo -e "  ${GREEN}✓${NC} Node.js ${NODE_VER} detected"

# -- Check npm
if ! command -v npm &> /dev/null; then
    echo -e "  ${RED}[ERROR] npm is not installed.${NC}"
    exit 1
fi
NPM_VER=$(npm --version)
echo -e "  ${GREEN}✓${NC} npm ${NPM_VER} detected"

echo ""
echo "  ──────────────────────────────────────────────────────────────"
echo ""

# ──────────────────────────────────────────────────────────────────
# Step 2: Backend Virtual Environment
# ──────────────────────────────────────────────────────────────────
echo -e "  ${BOLD}[2/6] Setting up Python virtual environment...${NC}"

if [ ! -d "backend/venv" ]; then
    echo "  Creating virtual environment in backend/venv..."
    python3 -m venv backend/venv
    echo -e "  ${GREEN}✓${NC} Virtual environment created"
else
    echo -e "  ${GREEN}✓${NC} Virtual environment already exists — skipping"
fi

echo ""
echo "  ──────────────────────────────────────────────────────────────"
echo ""

# ──────────────────────────────────────────────────────────────────
# Step 3: Install Backend Dependencies
# ──────────────────────────────────────────────────────────────────
echo -e "  ${BOLD}[3/6] Installing backend dependencies...${NC}"
echo ""

source backend/venv/bin/activate
pip install -r backend/requirements.txt --quiet
echo -e "  ${GREEN}✓${NC} Backend dependencies installed"

echo ""
echo "  ──────────────────────────────────────────────────────────────"
echo ""

# ──────────────────────────────────────────────────────────────────
# Step 4: Create .env File (if not exists)
# ──────────────────────────────────────────────────────────────────
echo -e "  ${BOLD}[4/6] Checking environment configuration...${NC}"

if [ ! -f "backend/.env" ]; then
    echo "  Creating backend/.env with default template..."
    cat > backend/.env << 'ENVEOF'
# ── WriteWisely Backend Configuration ──

# Core
MONGODB_URL=mongodb://localhost:27017/writewisely
JWT_SECRET=change-this-to-a-strong-random-secret
JWT_ALGORITHM=HS256
JWT_EXPIRY_HOURS=24

# LLM Providers (set at least one API key)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash

OPENROUTER_API_KEY=
LLM_MODEL=google/gemma-3-12b-it:free

HF_API_KEY=
HF_MODEL=meta-llama/Llama-3.2-1B-Instruct

# OTP / Email
MAILERSEND_API_KEY=
MAILERSEND_DOMAIN=
SENDER_EMAIL=
SENDER_NAME=WriteWisely
ALLOW_OTP_DEV_FALLBACK=true

# Local Mongo Recovery
AUTO_START_LOCAL_MONGO=true
LOCAL_MONGO_DBPATH=
ENVEOF
    echo -e "  ${GREEN}✓${NC} Environment file created at backend/.env"
    echo -e "  ${YELLOW}⚠  IMPORTANT: Edit backend/.env and add your API keys before running!${NC}"
else
    echo -e "  ${GREEN}✓${NC} backend/.env already exists — skipping"
fi

echo ""
echo "  ──────────────────────────────────────────────────────────────"
echo ""

# ──────────────────────────────────────────────────────────────────
# Step 5: Install Frontend Dependencies
# ──────────────────────────────────────────────────────────────────
echo -e "  ${BOLD}[5/6] Installing frontend dependencies...${NC}"
echo ""

cd frontend
npm install --silent
cd ..
echo -e "  ${GREEN}✓${NC} Frontend dependencies installed"

echo ""
echo "  ──────────────────────────────────────────────────────────────"
echo ""

# ──────────────────────────────────────────────────────────────────
# Step 6: Summary
# ──────────────────────────────────────────────────────────────────
echo -e "  ${BOLD}[6/6] Setup complete!${NC}"
echo ""
echo -e "  ${GREEN}${BOLD}"
echo "  ╔══════════════════════════════════════════════════════════════╗"
echo "  ║                                                              ║"
echo "  ║   ✅  WriteWisely is ready to go!                            ║"
echo "  ║                                                              ║"
echo "  ║   Before you start, make sure to:                            ║"
echo "  ║                                                              ║"
echo "  ║   1. Start MongoDB (local or Atlas)                          ║"
echo "  ║   2. Edit backend/.env with your API keys                    ║"
echo "  ║   3. Set a strong JWT_SECRET value                           ║"
echo "  ║                                                              ║"
echo "  ║   To start the app:                                          ║"
echo "  ║                                                              ║"
echo "  ║   Backend:                                                   ║"
echo "  ║     cd backend                                               ║"
echo "  ║     source venv/bin/activate                                 ║"
echo "  ║     uvicorn main:app --reload                                ║"
echo "  ║                                                              ║"
echo "  ║   Frontend (new terminal):                                   ║"
echo "  ║     cd frontend                                              ║"
echo "  ║     npm run dev                                              ║"
echo "  ║                                                              ║"
echo "  ╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
