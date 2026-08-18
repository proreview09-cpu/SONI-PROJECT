# Suvarn Bachat Yojana — Gold Savings Scheme Management

A local-first MERN application for managing an Indian jewellery-retail savings scheme
(11 monthly installments + completion reward, WhatsApp reminders, live ledger).

## Stack

- **Frontend:** React 18 + Vite, React Router v6, plain CSS (design tokens from the client preview), Axios, lucide-react
- **Backend:** Node.js + Express, Mongoose ODM, JWT auth, `node-cron` daily automation, `exceljs`/`csv-writer` export
- **Database:** MongoDB (local, `mongodb://localhost:27017/suvarn_bachat_yojana`)
- **WhatsApp:** pluggable service layer — `stub` provider by default (logs to console + WhatsAppLog collection), swap to a real provider in one file (`backend/src/services/whatsappService.js`)

## Prerequisites

- Node.js 18+
- MongoDB running locally on port 27017 (e.g. `mongod`)

## Quick Start

```bash
# one-time setup (from project root)
npm install
npm install --prefix backend
npm install --prefix frontend

# populate demo data (reproduces the client-preview mockup)
npm run seed

# run backend (port 5000) + frontend (port 5173) together
npm run dev
```

Open http://localhost:5173

### Demo logins

| Role  | Email          | Password |
|-------|----------------|----------|
| Owner | owner@demo.com | admin123 |
| Staff | staff@demo.com | staff123 |

## Environment

Backend config lives in `backend/.env` (see `backend/.env.example`): port, Mongo URI, JWT
secret, daily-job cron (`0 8 * * *` IST), WhatsApp provider. Frontend uses
`VITE_API_BASE_URL` in `frontend/.env` (defaults to `http://localhost:5000/api`).

## Daily Automation

`node-cron` runs once daily at 08:00 IST and executes three checks:
1. **5-day advance reminder** for installments due in N days
2. **Due-today reminder** (status → `due_today`)
3. **Overdue detection + follow-up** (status → `overdue`, re-notified on an interval)

The dashboard's "Automation Queue" panel shows live counts and the last run time.

## Configurable business rules (Settings page)

Due day (default 5), reminder lead time (5 days), grace period (0), overdue re-notify
interval, monthly collection target, WhatsApp provider. All open business decisions are
settings, not hardcoded rules.

## Cloud database (MongoDB Atlas)

The backend connects to MongoDB Atlas (database `suvarn_bachat_yojana`) via `MONGO_URI`
in `backend/.env`. To use a local MongoDB instead, swap it for
`mongodb://localhost:27017/suvarn_bachat_yojana`.

## Deploy to Render (live)

The repo includes `render.yaml`. On [render.com](https://render.com):

1. **New → Blueprint**, connect the GitHub repository — it creates one web service
   that runs the API **and** serves the built frontend.
2. In the service settings, set the environment variable:
   - `MONGO_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — a strong random string (or let Render generate it)
3. Deploy. Optional: open the Render **Shell** and run `node seed/seedDemoData.js`
   (from the `backend` folder) to load demo data.

Note: the free plan sleeps after ~15 min of inactivity; the daily WhatsApp automation
cron runs while the service is awake.
