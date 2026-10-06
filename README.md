# Sanjeevani Hospital Platform

A portfolio-ready full-stack evolution of the Sanjeevani Hospital website. It keeps the original hospital identity and public information while adding patient and admin workflows, persistent appointment requests, and a hospital-navigation assistant.

## Stack

- React 19, TypeScript, Vite, and React Router
- Express 4, TypeScript, Zod, JWT, and bcryptjs
- PostgreSQL 16 for hospital directories, accounts, appointments, and AI conversation schema
- Nginx, Docker Compose, and GitHub Actions

## Run The Complete Stack

Requirements: Docker Desktop with Docker Compose.

1. Copy `.env.example` to `.env`.
2. Replace the example database password, JWT secret, admin email, and admin password. Use URL-safe characters for the database password; the API password must be at least 12 characters and the JWT secret at least 32 characters.
3. From the repository root, run:

   ```powershell
   docker compose up --build
   ```

4. Open [http://localhost:8080](http://localhost:8080). The first API startup creates the schema and seeds the hospital directory. The admin account is created from the configured environment values if it does not already exist.

Patients can register from the Sign in page. Admins sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`. The API health endpoint is available at `/api/health`.

To stop the stack, run `docker compose down`. Database records remain in the named `hospital-data` volume. `docker compose down -v` deletes that volume and its data.

## Local Development

Run PostgreSQL with Compose, then run the API and frontend in separate terminals:

```powershell
cd backend
Copy-Item .env.example .env
npm ci
npm run dev
```

```powershell
cd app
npm ci
npm run dev
```

For local API development, copy `backend/.env.example` to `backend/.env` and set `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `OPENAI_API_KEY`. Keep the OpenAI key only in `backend/.env`; never add it to `app/.env` or frontend code. Vite proxies `/api` requests to `http://localhost:4000`. Without PostgreSQL, the API still starts in degraded mode so the AI endpoint can report configuration errors clearly; database-backed endpoints require PostgreSQL.

## Verification

```powershell
cd app
npm ci
npm run build
```

```powershell
cd backend
npm ci
npm test
```

Backend unit tests cover JWT verification, role authorization, and the live AI endpoint's validation/missing-key behavior without requiring a database or provider key. When `DATABASE_URL` is set, the API integration test starts the server and checks registration, appointment access, admin permissions/status changes, and the emergency safety response. A normal LLM answer requires a valid `OPENAI_API_KEY`; no successful provider response is claimed without that secret. GitHub Actions runs the database integration test against PostgreSQL.

## Features

- Responsive public pages for the hospital, doctors, services, contact, and FAQs
- Database-backed doctor/service directories with clearly labeled local display fallback
- Appointment requests persisted in PostgreSQL; requests may be submitted without an account
- Patient registration and sign-in with bcrypt password hashes and expiring signed JWTs
- Patient-owned appointment list and admin-only operational summary/status management
- Hospital-content retrieval for the assistant, with a conservative offline response when no AI provider key is configured
- Optional OpenAI Chat Completions integration using `OPENAI_API_KEY` and `OPENAI_MODEL`
- Emergency-oriented handoff language and explicit non-diagnostic safety notice

## API Overview

- `GET /api/health`, `/api/doctors`, `/api/services`, `/api/departments`, `/api/faqs`
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `POST /api/appointments`; authenticated `GET /api/appointments`
- Admin-only `GET /api/admin/summary` and `PATCH /api/admin/appointments/:id`
- `POST /api/ai/chat`

## Boundaries

This is a demonstration and portfolio project, not a clinical system. It does not diagnose, triage, or recommend treatment. Directory and admin counts are only as accurate as the configured database. The assistant uses lexical hospital-content retrieval; it is not a validated medical RAG system. When an OpenAI key is enabled, chat text is sent to that provider, so do not enter real patient identifiers, records, or protected health information.

Before handling real patient data, the project needs security review, managed secret storage, rate limiting, audit logging, robust migrations/backups, consent and retention controls, operational monitoring, provider/legal review, and applicable healthcare privacy/compliance work. Browser JWT storage is suitable only for this demo and should be replaced with a reviewed secure session strategy before production.