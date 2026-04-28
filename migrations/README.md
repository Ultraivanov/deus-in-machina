# DSR Database Migrations

PostgreSQL migrations for DSR v0.2.0 Enterprise Foundation.

## Quick Start

```bash
# Start PostgreSQL and Redis
npm run db:up

# Run all migrations
npm run db:migrate migrations/001_create_organizations.sql
npm run db:migrate migrations/002_create_users.sql
npm run db:migrate migrations/003_create_organization_members.sql
npm run db:migrate migrations/004_create_api_keys.sql
npm run db:migrate migrations/005_create_workspaces.sql

# Or run one by one
psql postgresql://dsr:dsr_dev_password@localhost:5432/dsr_dev -f migrations/001_create_organizations.sql

# Check database logs
npm run db:logs

# Stop database
npm run db:down
```

## Schema Overview

| Table | Purpose |
|-------|---------|
| `organizations` | Multi-tenant orgs with quotas |
| `users` | User accounts with auth |
| `organization_members` | Org membership with roles |
| `api_keys` | Programmatic access keys |
| `workspaces` | Environment isolation |

## Connection String

```
postgresql://dsr:dsr_dev_password@localhost:5432/dsr_dev
```

## Environment Variables

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dsr_dev
DB_USER=dsr
DB_PASSWORD=dsr_dev_password
```
