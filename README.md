# Finance-It

A full-stack personal finance tracker: React frontend + Express backend + PostgreSQL (Docker) + JWT authentication.

## Quick Start

Make sure [Node.js](https://nodejs.org) and [Docker](https://www.docker.com/products/docker-desktop/) are installed. Then:

```bash
# One-step setup: install dependencies, start the database, create tables
make setup

# Start the backend (in one terminal)
make dev

# Start the frontend (in another terminal)
make front
```

Then open `http://localhost:5173` in your browser.

## Common Commands

| Command | Description |
|---|---|
| `make setup` | One-step setup (first run) |
| `make dev` | Start the backend (`:3000`) |
| `make front` | Start the frontend (`:5173`) |
| `make db-up` / `db-down` | Start / stop the database |
| `make psql` | Open the database shell |
| `make db-reset` | Destroy and recreate the database (⚠️ deletes all data) |
| `make clean` | Remove node_modules |

Run `make` with no arguments to show the help.

## Tech Stack

- **Frontend**: React 18 + Vite + React Router
- **Backend**: Node.js + Express + bcrypt + jsonwebtoken
- **Database**: PostgreSQL 16 (Docker Compose)

## Project Structure

```
finance-it/
├── docker-compose.yml    # Database container config
├── Makefile              # One-step command entry point
├── sql/init.sql          # Table creation script
├── backend/              # Express backend
│   ├── .env.example      # Environment variable template
│   ├── index.js          # Entry point
│   ├── db.js             # Database connection pool
│   ├── middleware/auth.js
│   └── routes/           # auth / transactions / users
└── frontend/             # React frontend (Vite)
    └── src/
        ├── api/          # Backend API wrappers
        ├── components/
        └── pages/
```
