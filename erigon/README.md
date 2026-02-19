# Ethereum Nodes

Multiple Ethereum node options — from ultra-light to full archive.

## Option 1: Helios Light Client (Recommended for limited storage)

**Helios** is a true Ethereum light client. It verifies the chain using cryptographic proofs without downloading blocks. Perfect for your 100GB constraint.

| Spec | Value |
|------|-------|
| Storage | **< 1GB** |
| RAM | 2-4GB |
| Sync time | **< 1 minute** |
| Trust model | Verifies via checkpoints (trust-minimized) |

### Quick Start

```bash
cd /Users/ghost/.openclaw/workspace/erigon/helios
chmod +x start.sh
./start.sh
```

Or manually:
```bash
cd /Users/ghost/.openclaw/workspace/erigon/helios
docker-compose up -d
```

### Test it

```bash
# Should return latest block instantly
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Get Sepolia chain ID (0xaa36a7 = 11155111)
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

### Limitations

- **Cannot query historical state** before sync point
- **Relies on checkpoint sync** (trusts weak subjectivity checkpoint)
- Good for: current balances, sending transactions, real-time data
- Bad for: historical queries, archive data, tracing

---

## Option 2: Erigon Full Node (Pruned)

**Erigon** is a high-performance full node. Syncs the full chain but prunes old state.

| Spec | Value |
|------|-------|
| Storage | **100-200GB** (Sepolia pruned) |
| RAM | 8-16GB |
| Sync time | 2-6 hours |
| Trust model | Full verification |

### Quick Start

```bash
cd /Users/ghost/.openclaw/workspace/erigon
chmod +x start.sh
./start.sh
```

### What's Included

- **Erigon**: Execution client (processes transactions, maintains state)
- **Lighthouse**: Consensus client (handles PoS, block validation)
- Sepolia testnet with aggressive pruning

### Monitor Sync

```bash
# Check progress
docker logs -f erigon-sepolia | grep "synchronisation"

# Check if synced
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_syncing","params":[],"id":1}'
# Returns false when fully synced
```

### Mainnet Support

Mainnet needs 1.5TB+. Uncomment the `erigon-mainnet` service in `docker-compose.yml` and point to external storage.

---

## Comparison

| Feature | Helios | Erigon |
|---------|--------|--------|
| **Storage** | <1GB | 100-200GB |
| **RAM** | 2-4GB | 8-16GB |
| **Sync time** | <1 min | 2-6 hours |
| **Historical queries** | ❌ No | ✅ Yes (limited) |
| **Full verification** | ⚠️ Via checkpoints | ✅ Full |
| **Send transactions** | ✅ Yes | ✅ Yes |
| **Best for** | Wallets, dApps, testing | Indexing, heavy queries |

---

## API Reference

Both nodes expose standard Ethereum JSON-RPC on port 8545.

### Common Methods

```bash
# Get balance
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"eth_getBalance",
    "params":["0x...address...", "latest"],
    "id":1
  }'

# Send raw transaction
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"eth_sendRawTransaction",
    "params":["0x...signed-tx..."],
    "id":1
  }'

# Call contract
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"eth_call",
    "params":[{
      "to": "0x...contract...",
      "data": "0x..."
    }, "latest"],
    "id":1
  }'
```

---

## Security

- RPC is bound to `0.0.0.0` (all interfaces) for convenience
- **Do not expose port 8545 to the internet** without authentication
- For production, add a reverse proxy with TLS and rate limiting

---

## Which Should You Use?

| Your Need | Recommendation |
|-----------|---------------|
| Quick wallet/node for transactions | **Helios** |
| Limited disk space | **Helios** |
| Query historical data | **Erigon** |
| Run an indexer / heavy analytics | **Erigon** |
| Just want to "have a node" | **Helios** |

Start with Helios. If you need historical queries later, add Erigon.
