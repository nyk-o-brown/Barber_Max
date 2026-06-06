# Barber Max — Deployment Readiness Guide

> Last updated: 2026-06-06

---

## Critical: Do This First

**Your `.env` file contains real Google credentials (client ID + secret) and it is currently tracked by `.gitignore` incorrectly — `.env.example` is also ignored, which means your example file won't be shared, but more importantly your real `.env` may already be committed to git history.**

Before anything else:

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → your project → Credentials → rotate/regenerate your OAuth Client Secret immediately.
2. Run `git log --all --full-history -- .env` to check if `.env` was ever committed. If it was, the old secret is exposed in git history.
3. Fix `.gitignore` — `.env.example` should be committed (it has no real secrets), only `.env` should be ignored:

```
# .gitignore — correct version
.env
node_modules/
data/
```

---

## What Needs to Change for Production

There are 7 areas to address. Work through them in order.

---

### 1. Serve the Frontend from Express

Right now `server.js` only handles API routes — it has no static file serving. Your HTML pages will 404 on any host. Add this to `server.js` before the routes:

```js
import path from 'path';

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// After all API routes — catch-all for direct URL navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
```

> Place the catch-all **after** your API routes, not before.

---

### 2. Switch from SQLite to PostgreSQL

SQLite stores data in a local file (`data/appointments.db`). Every cloud host uses an **ephemeral filesystem** — the file is wiped on every redeploy or server restart. You will lose all appointment data.

**Option A — Easiest: use [Neon](https://neon.tech) (free hosted PostgreSQL)**

1. Create a free Neon project — you get a connection string like:
   `postgresql://user:pass@host/dbname`
2. Install the Postgres driver:
   ```
   npm install pg
   npm uninstall sqlite3
   ```
3. Update `database/init.js` to use `pg` instead of `sqlite3` (column types stay the same; swap `TEXT` for `VARCHAR`, `INTEGER` for `SERIAL` on the primary key).
4. Add to your environment variables: `DATABASE_URL=<your-neon-connection-string>`

**Option B — If you want to keep SQLite:** Use [Turso](https://turso.tech) (hosted SQLite, free tier). It's a drop-in swap with a single driver change.

---

### 3. Update Environment Variables

Never hardcode or commit real values. For production you need these variables set on your hosting platform:

| Variable | Description |
|---|---|
| `PORT` | Set automatically by most hosts — remove your hardcoded `5000` fallback or keep it as a local default |
| `NODE_ENV` | Set to `production` |
| `GOOGLE_CLIENT_ID` | Your (rotated) Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Your (rotated) Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | **Must change** — use your production domain: `https://yourdomain.com/auth/google/callback` |
| `GOOGLE_CALENDAR_ID` | Your Google Calendar email |
| `DATABASE_URL` | Your Neon/Postgres connection string |
| `CORS_ORIGIN` | Your production frontend URL: `https://yourdomain.com` |

Update `.env.example` with these keys (no real values) so future developers know what's needed.

---

### 4. Update Google OAuth Settings

Your Google OAuth app is currently configured to only allow `localhost` as a redirect URI. For production:

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → your OAuth 2.0 client.
2. Under **Authorized redirect URIs**, add: `https://yourdomain.com/auth/google/callback`
3. Under **Authorized JavaScript origins**, add: `https://yourdomain.com`
4. Keep the `localhost` entries for local development.

---

### 5. Update Frontend API URLs

Your frontend JavaScript files likely call `http://localhost:5000/api/...`. These need to point to your production backend.

**Best approach — use a relative URL so it works on any domain:**

In `api-client.js`, change:
```js
// Before
const BASE_URL = 'http://localhost:5000/api';

// After
const BASE_URL = '/api';
```

Since Express will now serve both the frontend and backend from the same origin, relative URLs work everywhere without environment-specific config.

---

### 6. Choose a Hosting Platform

Since this is a Node.js + Express app, you need a platform that runs Node. The best free options:

**Recommended: [Render](https://render.com)**
- Free tier runs Node.js web services
- Connects directly to your GitHub repo and auto-deploys on push
- Set environment variables in the Render dashboard
- Steps:
  1. Push your code to GitHub
  2. Create a new **Web Service** on Render
  3. Set **Build Command**: `npm install`
  4. Set **Start Command**: `npm start`
  5. Add all environment variables from Section 3
  6. Deploy

**Alternatives:**
- [Railway](https://railway.app) — similar to Render, slightly faster cold starts
- [Fly.io](https://fly.io) — more control, requires a `Dockerfile` (see optional section below)
- [Vercel](https://vercel.com) — works but requires converting Express to serverless functions (more work)

---

### 7. Add a `package.json` Engine Field

Hosting platforms need to know which Node.js version to use. Add this to `package.json`:

```json
"engines": {
  "node": ">=18.0.0"
}
```

---

## Summary Checklist

Work through this list top to bottom before going live:

- [ ] Rotate Google OAuth client secret (it may be exposed)
- [ ] Fix `.gitignore` — ignore `.env`, commit `.env.example`
- [ ] Add static file serving to `server.js`
- [ ] Switch database from SQLite to hosted PostgreSQL (Neon recommended)
- [ ] Add all environment variables to hosting platform dashboard
- [ ] Update Google OAuth redirect URIs in Google Cloud Console
- [ ] Change frontend API base URL from `localhost:5000` to `/api` (relative)
- [ ] Add `engines` field to `package.json`
- [ ] Push to GitHub and deploy via Render (or your chosen platform)
- [ ] Test the live URL: booking flow end-to-end + Google Calendar sync

---

## Optional but Recommended

### Add a Dockerfile (for Fly.io or any container host)

Create `Dockerfile` in the project root:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

### Add a `.dockerignore`

```
node_modules
.env
data/
*.md
```

### Redirect HTTP to HTTPS

Most platforms handle this for you. If yours doesn't, add this middleware to `server.js`:

```js
// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
  });
}
```

---

## Estimated Time

| Task | Time |
|---|---|
| Fix credentials + gitignore | 15 min |
| Add static file serving | 10 min |
| Set up Neon + migrate DB layer | 1–2 hrs |
| Update env vars + OAuth redirect URIs | 20 min |
| Deploy to Render | 30 min |
| End-to-end testing | 30 min |
| **Total** | **~4 hrs** |
