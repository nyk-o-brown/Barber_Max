# Barber Max Backend Setup Guide

## Overview
This backend integrates your barber booking system with Google Calendar API, automatically creating and managing calendar events for appointments.

## Features
✅ SQLite database for appointment storage  
✅ Google Calendar API integration  
✅ Automatic event creation/updates/deletion  
✅ CORS enabled for frontend integration  
✅ Input validation  
✅ Error handling  
✅ Available time slots checking  

## Prerequisites
- Node.js 14+ installed
- Google Cloud Project with Calendar API enabled
- Google OAuth 2.0 credentials

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or use existing one
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials:
   - Go to "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Select "Web application"
   - Add authorized redirect URI: `http://localhost:5000/auth/google/callback`
   - Copy Client ID and Client Secret

5. Get your Google Calendar ID:
   - Open Google Calendar
   - Settings → Settings → Calendars
   - Find your calendar and copy the "Calendar ID"

### 3. Environment Configuration

Create a `.env` file in the project root:

```env
PORT=5000
NODE_ENV=development

# Google Calendar API
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
GOOGLE_CALENDAR_ID=your_calendar_id@gmail.com

# Database
DB_PATH=./data/appointments.db

# CORS
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
```

### 4. Start the Backend

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server will run on `http://localhost:5000`

## API Endpoints

### Authentication Routes

#### Get Google Auth URL
```http
GET /api/auth/google/url
```
Returns authorization URL for user login.

#### Handle Google Callback
```http
POST /api/auth/google/callback
Content-Type: application/json

{
  "code": "authorization_code_from_google"
}
```

#### Check Auth Status
```http
GET /api/auth/status
```
Returns `{ authenticated: true/false }`

### Appointment Routes

#### Create Appointment
```http
POST /api/appointments
Content-Type: application/json

{
  "clientName": "John Doe",
  "clientEmail": "john@example.com",
  "clientPhone": "+254700000000",
  "services": "Precision Haircut, Beard Trim",
  "barber": "Ahmed",
  "location": "Main Branch",
  "appointmentDate": "2026-02-15",
  "appointmentTime": "14:00",
  "duration": 60,
  "notes": "First time client"
}
```

#### Get All Appointments
```http
GET /api/appointments
```

#### Get Single Appointment
```http
GET /api/appointments/:id
```

#### Update Appointment
```http
PUT /api/appointments/:id
Content-Type: application/json

{
  "clientName": "John Doe",
  "clientEmail": "john@example.com",
  ...
}
```

#### Delete Appointment
```http
DELETE /api/appointments/:id
```

#### Get Available Time Slots
```http
GET /api/appointments/available/:date?duration=60
```

#### Sync to Google Calendar
```http
POST /api/appointments/:id/sync-calendar
```

## Frontend Integration

### Using the API Client

```javascript
import BarberAppointmentAPI from './api-client.js';

// Create appointment
const appointment = {
  clientName: "John Doe",
  clientEmail: "john@example.com",
  clientPhone: "+254700000000",
  services: "Precision Haircut",
  barber: "Ahmed",
  location: "Main Branch",
  appointmentDate: "2026-02-15",
  appointmentTime: "14:00",
  duration: 60,
  notes: "First time client"
};

BarberAppointmentAPI.createAppointment(appointment)
  .then(response => console.log('Appointment created:', response))
  .catch(error => console.error('Error:', error));
```

### Setup Google Authentication

```javascript
// Get auth URL
const { authUrl } = await BarberAppointmentAPI.getGoogleAuthUrl();

// Redirect user to Google
window.location.href = authUrl;

// Handle callback (in your redirect URI page)
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

if (code) {
  const result = await BarberAppointmentAPI.handleGoogleCallback(code);
  console.log('Authenticated:', result);
}
```

## Database Schema

### Appointments Table
```sql
CREATE TABLE appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clientName TEXT NOT NULL,
  clientEmail TEXT NOT NULL,
  clientPhone TEXT,
  services TEXT NOT NULL,
  barber TEXT NOT NULL,
  location TEXT NOT NULL,
  appointmentDate TEXT NOT NULL,
  appointmentTime TEXT NOT NULL,
  duration INTEGER DEFAULT 60,
  notes TEXT,
  googleEventId TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Google Auth Table
```sql
CREATE TABLE google_auth (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  accessToken TEXT NOT NULL,
  refreshToken TEXT,
  expiresAt INTEGER,
  scope TEXT,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

## Troubleshooting

### Google Calendar Not Syncing
1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
2. Ensure calendar ID is correct
3. Check that authorization was completed
4. Use `/api/appointments/:id/sync-calendar` to retry

### Database Errors
1. Ensure `data/` directory is writable
2. Delete `data/appointments.db` to reset database
3. Backend will recreate it on startup

### CORS Issues
1. Update `CORS_ORIGIN` in `.env` to match your frontend URL
2. Ensure frontend is making requests with correct headers

### Authorization Errors
1. Get new auth URL with `GET /api/auth/google/url`
2. Complete the OAuth flow
3. Callback will save tokens automatically

## Production Deployment

### Environment Variables
```env
NODE_ENV=production
PORT=5000
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback
GOOGLE_CALENDAR_ID=your_calendar_id@gmail.com
CORS_ORIGIN=https://yourdomain.com
DB_PATH=/var/barber-max/appointments.db
```

### Recommended Services
- **Hosting**: Heroku, Railway, Render, or DigitalOcean
- **Database**: SQLite (for small deployments) or PostgreSQL (for scale)
- **SSL**: Let's Encrypt (included in most hosting)

## Support
For issues or questions, refer to:
- [Google Calendar API Docs](https://developers.google.com/calendar)
- [Express.js Docs](https://expressjs.com)
- [SQLite Docs](https://www.sqlite.org/docs.html)
