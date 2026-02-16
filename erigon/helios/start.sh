#!/bin/bash
# Helios Light Client Startup

set -e

echo "🚀 Starting Helios Ethereum Light Client"
echo ""

# Pull latest
docker pull a16z/helios:latest

# Start Sepolia light client
echo "🌐 Starting Helios Sepolia light client..."
docker compose up -d helios-sepolia

echo ""
echo "⏳ Waiting for Helios to initialize (15s)..."
sleep 15

echo ""
echo "✅ Helios light client is running!"
echo ""
echo "📡 Endpoint: http://localhost:8545"
echo ""
echo "🔧 Quick test:"
echo "  curl -X POST http://localhost:8545 \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}'"
echo ""
echo "📊 Monitor: docker logs -f helios-sepolia"
