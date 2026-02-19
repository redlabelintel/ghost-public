#!/bin/bash
# Geth Light Client Startup

set -e

echo "⛓️ Starting Geth Ethereum Light Client (Sepolia)"
echo ""

# Pull image
docker pull ethereum/client-go:stable

# Create data directory
mkdir -p data

# Start
docker compose up -d

echo ""
echo "⏳ Waiting for Geth to start..."
sleep 10

echo ""
echo "✅ Geth light client is running!"
echo ""
echo "📡 Endpoint: http://localhost:8545"
echo ""
echo "🔧 Quick test:"
echo "  curl -X POST http://localhost:8545 \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"jsonrpc\":\"2.0\",\"method\":\"eth_syncing\",\"params\":[],\"id\":1}'"
echo ""
echo "📊 Monitor: docker logs -f geth-sepolia"
echo ""
echo "⚠️  Light mode syncs headers only. Good for:"
echo "   - Current balances"
echo "   - Sending transactions"
echo "   - Gas estimation"
echo ""
echo "   Not good for:"
echo "   - Historical state queries"
echo "   - Full verification"
