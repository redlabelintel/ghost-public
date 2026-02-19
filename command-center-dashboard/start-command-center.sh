#!/bin/bash

# CEO Command Center Startup Script
# Starts both backend API and frontend dashboard

set -e

echo "🎯 Starting CEO Command Center..."

# Directory setup
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install npm first.${NC}"
    exit 1
fi

# Function to install dependencies
install_deps() {
    local dir=$1
    local name=$2
    
    echo -e "${BLUE}📦 Installing $name dependencies...${NC}"
    cd "$dir"
    
    if [ ! -d "node_modules" ]; then
        npm install
    else
        echo -e "${GREEN}✅ Dependencies already installed for $name${NC}"
    fi
    
    cd "$SCRIPT_DIR"
}

# Install backend dependencies
echo -e "${YELLOW}🔧 Setting up backend...${NC}"
install_deps "$BACKEND_DIR" "backend"

# Install frontend dependencies 
echo -e "${YELLOW}🎨 Setting up frontend...${NC}"
install_deps "$FRONTEND_DIR" "frontend"

# Create logs directory
mkdir -p "$SCRIPT_DIR/logs"

# Start backend API
echo -e "${BLUE}🚀 Starting Control API server...${NC}"
cd "$BACKEND_DIR"
node control-api.js &
BACKEND_PID=$!

# Wait for backend to start
echo -e "${YELLOW}⏳ Waiting for API server to initialize...${NC}"
sleep 3

# Check if backend is running
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Control API server running on port 3001${NC}"
else
    echo -e "${RED}❌ Failed to start Control API server${NC}"
    exit 1
fi

# Start frontend development server
echo -e "${BLUE}🎯 Starting CEO Dashboard...${NC}"
cd "$FRONTEND_DIR"
npm start &
FRONTEND_PID=$!

# Wait for frontend to start
echo -e "${YELLOW}⏳ Waiting for dashboard to initialize...${NC}"
sleep 5

# Check if frontend is running
if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✅ CEO Dashboard running on port 3000${NC}"
else
    echo -e "${RED}❌ Failed to start CEO Dashboard${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo -e "${GREEN}🎯 CEO COMMAND CENTER IS ONLINE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Control API:    http://localhost:3001${NC}"
echo -e "${GREEN}✅ CEO Dashboard:  http://localhost:3000${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📋 Available Controls:${NC}"
echo -e "   🚨 Emergency Panic Button"
echo -e "   💸 Kill Expensive Sessions"
echo -e "   📊 Real-time Financial Monitoring"
echo -e "   🔧 Session Management"
echo -e "   👥 Agent Control"
echo -e "   🛡️ Complete Audit Logging"
echo ""
echo -e "${BLUE}Press Ctrl+C to shut down the command center${NC}"
echo ""

# Store PIDs for cleanup
echo $BACKEND_PID > "$SCRIPT_DIR/logs/backend.pid"
echo $FRONTEND_PID > "$SCRIPT_DIR/logs/frontend.pid"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down CEO Command Center...${NC}"
    
    if [ -f "$SCRIPT_DIR/logs/backend.pid" ]; then
        BACKEND_PID=$(cat "$SCRIPT_DIR/logs/backend.pid")
        kill $BACKEND_PID 2>/dev/null && echo -e "${GREEN}✅ Control API stopped${NC}"
        rm -f "$SCRIPT_DIR/logs/backend.pid"
    fi
    
    if [ -f "$SCRIPT_DIR/logs/frontend.pid" ]; then
        FRONTEND_PID=$(cat "$SCRIPT_DIR/logs/frontend.pid")
        kill $FRONTEND_PID 2>/dev/null && echo -e "${GREEN}✅ CEO Dashboard stopped${NC}"
        rm -f "$SCRIPT_DIR/logs/frontend.pid"
    fi
    
    echo -e "${BLUE}👋 Command Center offline. Stay in control, CEO.${NC}"
    exit 0
}

# Trap signals for graceful shutdown
trap cleanup SIGINT SIGTERM

# Keep script running and monitor processes
while true; do
    # Check if backend is still running
    if ! ps -p $BACKEND_PID > /dev/null; then
        echo -e "${RED}❌ Control API crashed! Restarting...${NC}"
        cd "$BACKEND_DIR"
        node control-api.js &
        BACKEND_PID=$!
        echo $BACKEND_PID > "$SCRIPT_DIR/logs/backend.pid"
    fi
    
    # Check if frontend is still running
    if ! ps -p $FRONTEND_PID > /dev/null; then
        echo -e "${RED}❌ CEO Dashboard crashed! Restarting...${NC}"
        cd "$FRONTEND_DIR"
        npm start &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > "$SCRIPT_DIR/logs/frontend.pid"
    fi
    
    sleep 10
done