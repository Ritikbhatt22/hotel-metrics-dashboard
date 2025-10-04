# Hotel Metrics Dashboard

Full-stack project to upload hotel data (PDF/Excel), convert to structured JSON, import to Firestore, and view analytics in a React dashboard.

## Tech
- Backend: Node.js, Express, Multer, Firebase Admin, XLSX, Day.js
- Frontend: React, Vite, Tailwind, Recharts
- PDF Extraction: Landing AI API (simulated if no key)
- DB: Firestore (optional; local JSON fallback works out-of-the-box)

## Folder Structure

backend/
  server.js
  routes/
    upload.js
    metrics.js
  utils/
    parseExcel.js
    extractPDF.js
    firestoreImport.js
  processed-data/
    Marriott_Sep2025.json
    Taj_Sep2025.json
    Hyatt_Data.json
    Oberoi_Data.json
  uploads/
  .env.example

frontend/
  index.html
  vite.config.js
  tailwind.config.js
  postcss.config.js
  package.json
  src/
    main.jsx
    styles.css
    pages/
      UploadPage.jsx
      DashboardPage.jsx
    components/
      KPIcards.jsx
      Charts.jsx
      TableView.jsx

## Env Setup
Create `backend/.env` with:

```
PORT=4000
LANDING_AI_API_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

- If Firebase vars are not provided, the app will still work using local JSON files in `backend/processed-data`.
- If `LANDING_AI_API_KEY` is missing, PDF extraction is simulated with random data.

## Install & Run

In one terminal (backend):

```
cd backend
npm install
cp .env.example .env # edit as needed
npm run dev # or: npm start
```

In another terminal (frontend):

```
cd frontend
npm install
npm run dev
```

By default:
- Backend: http://localhost:4000
- Frontend: http://localhost:5173

Configure frontend to point to backend by adding `.env` in frontend (optional):

```
VITE_API_BASE=http://localhost:4000
```

## API
- `POST /upload` — multipart form field `files` (multiple). Accepts .pdf, .xlsx, .xls
  - Saves processed JSON under `backend/processed-data/`
  - Imports into Firestore when credentials are set
- `GET /api/metrics` — all metrics (from Firestore or local JSON)
- `GET /api/metrics/:hotelName` — metrics for a hotel
- `POST /api/metrics/date-range` — body: `{ startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD', hotelName?: string }`

## Notes
- Excel parser is flexible on column names: `date/Date/DATE`, `revenue/Revenue/Sales`, `ADR`, `RevPAR/revpar`, `occupancy/Occupancy/Occ %`.
- The backend serves static JSON at `/processed-data/*` to verify outputs quickly.
- Multer stores uploads in `backend/uploads/`. Files are processed then JSONs are written to `backend/processed-data/`.
- For Firestore, use a service account. Ensure `FIREBASE_PRIVATE_KEY` preserves newlines (use `\n` escapes in .env).
