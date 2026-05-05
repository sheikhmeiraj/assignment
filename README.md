# Team Task Manager

A small full-stack app for collaborating on projects: admins create projects, invite members by email, and assign tasks with statuses. Everyone gets a JWT-secured REST API plus a plain React frontend.

This repo is deliberately simple (no TypeScript ORMs, Redux, Tailwind, or Docker).

## Tech stack

- **Frontend:** React (Vite), React Router, Axios, plain CSS
- **Backend:** Node.js, Express, `mysql2`, JWT, `bcryptjs`, `dotenv`, `cors`
- **Database:** MySQL

## Features (assignment checklist)

1. Sign up and login
2. JWT authentication
3. Role-based access (global Admin vs Member inside the `users.role` column)
4. Admins create projects
5. Admins add existing members via email lookup
6. Admins create tasks inside a project
7. Tasks are assigned only to users who belong to that project
8. Members see projects listed only when they are in `project_members`
9. Members see **only tasks assigned to them** on the project tasks API
10. Members may change statuses **only on their assigned tasks**
11. Dashboard shows task totals: all tasks for admins, scoped to “assigned to me” for members (`overdue` uses `due_date < today` and `status <> done`)
12. Log out clears the JWT from `localStorage`

## Folder layout

```
team-task-manager/
  README.md           ← this file
  client/             ← Vite React app
  server/             ← Express API
```

### Database overview

| Table               | Purpose |
|---------------------|---------|
| `users`             | Accounts with email + hashed password + global `role` (`admin` / `member`) |
| `projects`          | Project metadata plus `created_by` |
| `project_members`   | Many-to-many between users & projects (+ optional per-project role) |
| `tasks`             | Work items scoped to projects with assignment + status enums |

Relationships match the coursework schema (see [`server/database/schema.sql`](server/database/schema.sql)).

## Run locally

### 1. MySQL setup

Create a database (example name `team_tasks`) and execute the SQL scripts against it (order matters):

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS team_tasks;"
mysql -u root -p team_tasks < server/database/schema.sql
mysql -u root -p team_tasks < server/database/seed.sql
```

> `seed.sql` assumes a fresh DB so inserted users obtain `id` `1` and `2`.

### 2. Backend (`server`)

```bash
cd server
cp .env.example .env
```

Fill `.env`:

| Variable       | Meaning |
|----------------|---------|
| `PORT`         | Local port (`5000` by default). Railway injects its own automatically. |
| `DB_HOST` etc. | MySQL connection credentials |
| `JWT_SECRET`   | Long random string used to sign tokens |
| `FRONTEND_URL` | *(Optional)* comma-separated browser origins (`http://localhost:5173,...`) |

Install + start:

```bash
npm install
npm run dev
```

Health probe: [`http://localhost:5000/health`](http://localhost:5000/health)

API base: [`http://localhost:5000/api`](http://localhost:5000/api)

**Quick API check (after schema + seed):** with `npm run dev` still running in `server/`, open a second terminal and run **`npm run smoke`**. It hits `/health`, logs in as the demo admin, then calls `/api/auth/me` and `/api/dashboard`.

### 3. Frontend (`client`)

Optional environment file (`client/.env`):

```
VITE_API_URL=http://localhost:5000/api
```

Defaults already point here if unset.

```bash
cd client
npm install
npm run dev
```

Open the printed Vite URL (usually [`http://localhost:5173`](http://localhost:5173)).

## Demo accounts (seeded)

Password for both demo users: `password123`

| Role            | Email                |
|-----------------|---------------------|
| Global admin    | `admin@example.com` |
| Global member   | `member@example.com` |

The seeded “Website Redesign” project adds both users and assigns sample tasks.

## Deploying backend + database on Railway

1. Sign in at [`https://railway.app`](https://railway.app) and click **New Project**.
2. **Add MySQL** from the Railway template/store. Railway exposes hostname, username, password, database, and port in the Variables tab.
3. **Add a blank Node.js service** (or connect GitHub pointing at `/server`).
4. Inside the backend service Variables, map MySQL secrets to Express env keys:
   - `DB_HOST`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
5. Generate a strong random string for `JWT_SECRET`.
6. **Do not manually set `PORT`**—Railway provides it; `server/server.js` already reads `process.env.PORT`.
7. Set `NODE_ENV` to `production` if Railway does not automatically.
8. Configure `FRONTEND_URL` with your SPA origin (`https://your-frontend.vercel.app`, etc.). Leave blank only if you will accept permissive origins (not recommended in production).

Build/start commands configured in [`server/package.json`](server/package.json):

- Railway default `npm install` pulls dependencies automatically.
- `npm run start` simply runs `node server.js`.

#### Running SQL on Railway

Use Railway’s built-in SQL console/MySQL CLI or temporarily connect locally with SSL credentials to replay `schema.sql` + `seed.sql`. Keep production seeds minimal—omit demo inserts if unnecessary.

Copy the HTTPS URL Railway assigns to the backend (for example `https://team-task-api.up.railway.app`). Your API resolves at `https://.../api/...`.

## Deploying the frontend

### Railway (static)

1. New service → Deploy from repo subfolder **`client`**.
2. Build command: `npm install && npm run build`.
3. Publish directory: `dist`.
4. Environment variable: `VITE_API_URL=https://<your-backend-host>/api`
5. Redeploy whenever the API URL changes.

### Vercel

1. Import the Git repo; choose `client` as root.
2. Framework preset: Vite.
3. Set `VITE_API_URL` to your Railway API base URL with `/api`.
4. Ensure `FRONTEND_URL` on the backend includes the Vercel domain for CORS.

## API surface (Express)

| Method & path | Notes |
|---------------|-------|
| `POST /api/auth/signup` | Always creates a `member` |
| `POST /api/auth/login` | Returns `{ user, token }` |
| `GET /api/auth/me` | Requires JWT |
| `GET /api/projects` | Members see only joined projects |
| `POST /api/projects` | Admin only |
| `GET /api/projects/:id` | Membership enforced for members |
| `POST /api/projects/:id/members` | Admin adds by email |
| `GET /api/tasks/project/:projectId` | Members only see their assignments |
| `POST /api/tasks` | Admin only |
| `PUT /api/tasks/:id/status` | Owner (assignee) or admin |
| `DELETE /api/tasks/:id` | Admin only |
| `GET /api/dashboard` | Role-scoped stats |

Middleware files live in [`server/middleware`](server/middleware).

## Frontend notes

- JWT stored under `localStorage` key **`token`**.
- Axios interceptor injects headers and redirects to `/login` on `401`s.
- `ProtectedRoute` shows the Navbar for authenticated layouts.

Happy shipping!
