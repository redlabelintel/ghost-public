#!/bin/bash
# Erigon Node Startup Script

set -e

echo "🚀 Starting Erigon Ethereum Node"
echo ""

# Check available disk space
AVAILABLE_GB=$(df -BG /Users/ghost/.openclaw/workspace/erigon/data | tail -1 | awk '{print $4}' | tr -d 'G')
echo "📊 Available disk space: ${AVAILABLE_GB}GB"

if [ "$AVAILABLE_GB" -lt "150" ]; then
    echo "⚠️  Warning: Less than 150GB available. Sepolia testnet may fail."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Pull latest images
echo "📦 Pulling Docker images..."
docker compose pull

# Start Sepolia node
echo "🌐 Starting Sepolia testnet node..."
docker compose up -d erigon-sepolia

echo ""
echo "⏳ Waiting for Erigon to initialize (30s)..."
sleep 30

# Start consensus client
echo "🔷 Starting Lighthouse consensus client..."
docker compose up -d lighthouse-sepolia

echo ""
echo "✅ Erigon Sepolia node is starting up!"
echo ""
echo "📡 Endpoints:"
echo "  HTTP RPC:   http://localhost:8545"
echo "  WebSocket:  ws://localhost:8546"
echo "  Beacon API: http://localhost:5052"
echo ""
echo "📊 Monitor sync progress:"
echo "  docker logs -f erigon-sepolia"
echo "  docker logs -f lighthouse-sepolia"
echo ""
echo "🔧 Useful commands:"
echo "  Stop:    docker compose down"
echo "  Status:  docker compose ps"
echo "  Logs:    docker compose logs -f"
