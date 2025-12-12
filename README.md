# Noted

Noted is a modern way to store all your data, notes, photos, and schedule in one service built as a Nx monorepo.
The project is under active development and not production-ready yet.

> **Work in progress.** Most of the system is not production-ready yet.

## Tech Stack

### Backend

NestJS, Prisma, PostgreSQL, JWT, Argon2, MinIO (planned), Full test setup with Jest and Testcontainers

### Frontend

Vue

### Monorepo

NX workspaces

### Applications:

- apps/Noted

## Development

```bash
# Install dependencies:
npm install

# Build shared libraries:
npx nx g @nx/js:library libs/shared/types

# Start application:
npx nx serve Noted
```

## Testing

```bash
# Unit tests:
npx nx test Noted


# Static checks:
npm audit
npm run lint:nx
npm run typecheck
```

## CI

GitHub Actions run audit, linting, typechecking, unit tests, and build checks.
Triggered on pull requests and pushes to main and develop branches.
