# PostgreSQL Docker Setup

Simple PostgreSQL 16 container with optional pgAdmin web UI.

## Quick Start

```bash
cd /Users/ghost/.openclaw/workspace/postgres
chmod +x start.sh
./start.sh
```

This creates:
- PostgreSQL server on `localhost:5432`
- Persistent data in `./data/`
- Random passwords in `.env` file

## Connection Details

After running `start.sh`, check your credentials:

```bash
cat .env
```

Default connection:
- **Host:** `localhost`
- **Port:** `5432`
- **User:** `postgres` (or see POSTGRES_USER in .env)
- **Password:** (see POSTGRES_PASSWORD in .env)
- **Database:** `postgres`

## Commands

| Action | Command |
|--------|---------|
| Start | `docker compose up -d` |
| Stop | `docker compose down` |
| Full reset (deletes data!) | `docker compose down -v` |
| View logs | `docker logs -f postgres` |
| Connect to psql | `docker exec -it postgres psql -U postgres` |
| Run SQL file | `docker exec -i postgres psql -U postgres < script.sql` |

## Optional: pgAdmin Web UI

```bash
docker compose --profile admin up -d
```

Then visit: http://localhost:5050

Login with credentials from `.env`:
- Email: `PGADMIN_EMAIL`
- Password: `PGADMIN_PASSWORD`

Add a server:
- Host: `postgres`
- Port: `5432`
- Database: `postgres`
- User: `postgres`
- Password: (from `.env`)

## Create Additional Databases

```bash
# Interactive
docker exec -it postgres psql -U postgres
CREATE DATABASE myapp;
\q

# Or from SQL file
echo "CREATE DATABASE myapp;" | docker exec -i postgres psql -U postgres
```

## Backup & Restore

```bash
# Backup
docker exec postgres pg_dump -U postgres myapp > backup.sql

# Restore
docker exec -i postgres psql -U postgres -d myapp < backup.sql
```

## Storage

Data persists in `./data/` directory. Total disk usage:
- Fresh install: ~50MB
- Typical use: grows with your data

## Security Notes

- Default passwords are auto-generated on first run
- PostgreSQL is bound to localhost only (safe)
- `.env` file contains secrets — don't commit it
- pgAdmin is optional (not started by default)

## Troubleshooting

### "Permission denied" on data directory
```bash
sudo chown -R $USER:$USER data/
docker compose restart
```

### Reset everything
```bash
docker compose down -v
rm -rf data/
./start.sh
```
