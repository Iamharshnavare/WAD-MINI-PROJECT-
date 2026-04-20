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

## Tech stack

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js HTTP server
- Storage: Local JSON files
