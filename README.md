# Mini Task Management Platform

Full-stack take-home: **Next.js (TypeScript) frontend**, **Express (TypeScript) backend**, **MongoDB**, JWT authentication, projects & tasks CRUD, and a dashboard.

## Tech stack

- Frontend: Next.js + TypeScript + Tailwind CSS
- Backend: Express + TypeScript + Zod validation + JWT
- DB: MongoDB (via Mongoose)
- Docs (bonus): Swagger UI (`/docs`)
- Docker (bonus): `docker compose`

## Local setup

### 1) Install dependencies

```bash
npm install
```

### 2) Start MongoDB (Docker)

```bash
docker compose up -d db
```

### 3) Configure env

Create these files:

- `apps/backend/.env`
- `apps/frontend/.env.local`

Backend (`apps/backend/.env`):

```bash
PORT=4000
MONGODB_URI=mongodb://localhost:27017/task_platform
JWT_SECRET=dev_secret_change_me
JWT_EXPIRES_IN=7d
```

Frontend (`apps/frontend/.env.local`):

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

### 4) Start dev

```bash
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:4000/health`
- Swagger docs: `http://localhost:4000/docs`

## Features

### Authentication

- Signup, login
- JWT-based auth
- Protected API routes

### Project management

- Create / edit / delete / list projects

### Task management

- Create / edit / delete tasks within projects
- Filter/sort (status, due date, search)

### Dashboard / analytics

- Total projects
- Total tasks
- Completed tasks
- Overdue tasks

## Architecture notes

- Monorepo using npm workspaces:
  - `apps/backend`: Express REST API
  - `apps/frontend`: Next.js app (app router)
- API uses **Zod** for request validation and a centralized **error-handling middleware** for consistent responses.
- DB uses **Mongoose** with a simple schema:
  - `User` → many `Project`
  - `Project` → many `Task`
- Authorization: resources are always scoped to the authenticated user (owner).

## API documentation

Swagger UI is available at `GET /docs`.

## Assumptions / decisions

- Single-owner projects (no collaboration) to keep scope small.
- Tasks belong to a project (no cross-project tasks).
- “Overdue” means: `dueDate < now` and `status != COMPLETED`.

