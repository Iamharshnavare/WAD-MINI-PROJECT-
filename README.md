# TableTrail

TableTrail is a full-stack restaurant booking website for a mini project. It includes a responsive frontend, a Node.js backend, live availability logic, reservation management, dashboard stats, and a backend-backed contact form.

## Project structure

```text
WAD MINI PROJECT/
├── backend/
│   ├── data/
│   │   ├── bookings.json
│   │   ├── messages.json
│   │   └── restaurants.json
│   ├── lib/
│   │   ├── booking-service.js
│   │   └── store.js
│   └── server.js
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── package.json
└── server.js
```

## Features

- Browse restaurants with cuisine and area filters
- View menu highlights and restaurant details
- Check real-time slot availability
- Create table reservations
- Search reservations by email, phone, restaurant, and status
- Update reservation status and cancel bookings
- View dashboard statistics and recent activity
- Submit contact messages stored by the backend

## Run locally

```bash
npm start
```

Open `http://127.0.0.1:3000`

## Deploy on Render

This project is ready to deploy as a Node web service on Render.

Important:

- The app stores bookings and messages in local JSON files.
- On Render, the filesystem is ephemeral by default, so data can reset on redeploy or restart.
- For a demo deployment, this is usually fine.
- For persistent data, use a Render persistent disk or move the data to a database.

### Quick steps

1. Push this repo to GitHub.
2. Sign in to [Render](https://render.com/).
3. Click `New` -> `Blueprint` or `New` -> `Web Service`.
4. Connect the GitHub repo `Iamharshnavare/WAD-MINI-PROJECT-`.
5. If using `Web Service`, use:
   - Build Command: `npm install`
   - Start Command: `npm start`
6. Deploy and open the generated `onrender.com` URL.

### Included config

- `render.yaml` is included at the repo root.
- Health check endpoint: `/health`
- Server binds to `0.0.0.0` for cloud hosting

## Deploy on Vercel

This repo also includes `vercel.json` and a catch-all function in `api/[...route].js`.

Important for Vercel:

- Vercel functions run through the `/api` directory.
- The app now adapts the backend server logic into a Vercel function handler.
- Vercel functions have a read-only filesystem except for writable `/tmp`, so the app uses `/tmp/tabletrail-data` on Vercel.
- That means bookings and messages can work for demo purposes, but they are not guaranteed to persist long-term across deployments or cold starts.

If you need permanent production data on Vercel, move bookings and messages to a database.

## Tech stack

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js HTTP server
- Storage: Local JSON files
