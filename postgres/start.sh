#!/bin/bash
# PostgreSQL Docker Setup

set -e

echo "🐘 Starting PostgreSQL Docker container"
echo ""

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating default .env file..."
    cat > .env << EOF
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 24)
POSTGRES_DB=postgres
PGADMIN_EMAIL=admin@local.dev
PGADMIN_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 16)
EOF
    echo "✅ .env file created with random passwords"
fi

# Pull and start
docker compose pull
docker compose up -d

echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

until docker exec postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo "  Waiting..."
    sleep 2
done

echo ""
echo "✅ PostgreSQL is running!"
echo ""
echo "📡 Connection:"
echo "  Host:     localhost"
echo "  Port:     5432"
echo "  Database: postgres"
echo ""
echo "📊 View credentials: cat .env"
echo ""
echo "🔧 Quick test:"
echo "  docker exec -it postgres psql -U postgres -c 'SELECT version();'"
echo ""
echo "🌐 pgAdmin (optional): docker compose --profile admin up -d"
echo "   Then visit: http://localhost:5050"
