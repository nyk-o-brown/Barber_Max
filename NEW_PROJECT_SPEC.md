# CosmicCare — Product & Development Specification

> Draft: 2026-06-06
> Status: Pre-development planning

---

## What We're Building

A two-sided marketplace for cosmetic care professionals and clients.

**Professionals** (barbers, hair stylists, nail techs, locticians, braiders, colorists, makeup artists) create a profile, post portfolio photos, list their services, and set their availability. They can be shop-based or fully independent, and can offer to travel to the client's location.

**Clients** browse by look (not just service name), save pros they like, and book appointments — at a shop, salon, or at their own home.

Think of it as Instagram meets Booksy, built from the ground up for the African cosmetic care market.

---

## The Core Problem

Right now a client who wants specific dreadlock styles or a particular braiding technique has to scroll Instagram or ask around. There's no structured way to find someone local who has *proven* they can do that specific look. On the other side, talented independent pros have no platform to reach clients outside of word of mouth.

---

## Two Types of Users

### Professional (the supply side)
- Barber, stylist, nail tech, loctician, braider, colorist, makeup artist, etc.
- Can be employed by a shop or fully independent (freelance)
- Can offer mobile service (travels to the client)
- Builds a portfolio of their work with photos
- Lists services with prices and estimated duration
- Sets availability / working hours
- Gets bookings and reviews

### Client (the demand side)
- Looking for a specific look or style
- Searches visually — by look tag, not just service name
- Can filter by location, price range, availability, and whether the pro offers home visits
- Books and pays through the platform
- Leaves reviews

---

## Core Features

### 1. Professional Profile
- Profile photo + bio
- Portfolio grid (photos of their work — before/after supported)
- Each portfolio post is tagged with look categories (e.g., "Loc Retwist", "Box Braids", "Fade", "Knotless Braids", "Colour — Green", "Acrylic Nails")
- Service menu: service name, price (range or fixed), duration
- Location: shop address OR "mobile — I travel to you" OR both
- Availability calendar
- Verified badge (optional — for pros who upload their certifications)
- Review score + review count

### 2. Client Search & Discovery
- Search by **look tag** — the core differentiator. Clients type or select "long dreadlocks" and see every pro in their area who has posted that work.
- Filter by:
  - Distance / city
  - Price range
  - Availability (show only pros available this week)
  - Service type (mobile / in-shop / both)
  - Rating
- Explore feed — scroll portfolio posts like an Instagram grid, tap a post to see the pro's profile and book

### 3. Booking System
- Client picks service → picks date/time from pro's available slots → confirms
- For mobile bookings: client enters their address, pro confirms they can travel there
- Booking confirmation sent to both parties (email + push notification)
- Reminders 24 hours and 2 hours before appointment

### 4. Payments
- Client pays a deposit at booking (e.g., 20–30%) to secure the slot
- Remainder paid in person or through the app at completion
- Stripe or Paystack (Paystack is better for Kenya/Africa)
- Pro receives payout minus platform fee (suggested: 10–15%)

### 5. Reviews
- Client leaves a star rating + written review after the appointment
- Client can upload a photo of the finished result
- Pro can respond to reviews

### 6. Messaging
- In-app chat between client and pro after a booking is confirmed
- Used for directions, timing, style reference photos, etc.

### 7. Notifications
- Booking confirmed / cancelled / reminder
- New review
- New message
- New follower (clients can follow pros)

---

## Look Tag System (Key Design Decision)

This is the feature that makes this platform different from a generic booking app.

Every portfolio photo a pro uploads must be tagged with one or more **look tags**. These tags are structured — not free-form text — so search actually works.

**Tag categories:**
- **Hair type**: Natural, Relaxed, Loc'd, Extensions, Colour-treated
- **Style**: Box Braids, Knotless Braids, Faux Locs, Cornrows, Weave, Loc Retwist, Starter Locs, Twist Out, Fade, Taper, Dreadlocks — Long, Dreadlocks — Short, Afro, etc.
- **Color**: Natural, Black, Blonde, Red, Green, Blue, Purple, Ombre, Highlights
- **Service type**: Cut, Style, Color, Treatment, Protective Style, Nail Art, Makeup, etc.

Clients search these tags. The more photos a pro uploads and tags well, the more they show up in search.

---

## Mobile App vs Web App

Build both. Share as much code as possible.

| Layer | Web | Mobile |
|---|---|---|
| Frontend | React (Next.js) | React Native (Expo) |
| Shared logic | API client, validators, type definitions | Same — put in a shared `packages/` folder |
| Shared UI | Some components can be adapted | |

Use a **monorepo** (one repo, multiple packages) so web and mobile share business logic, types, and API calls.

---

## Recommended Tech Stack

### Frontend — Web
- **Next.js 14** (React framework — handles routing, SSR, image optimization)
- **TailwindCSS** — utility CSS, same as your current project
- **shadcn/ui** — pre-built accessible components (buttons, modals, forms)
- **React Query (TanStack Query)** — data fetching and caching
- **Zustand** — lightweight global state (auth session, booking flow)

### Frontend — Mobile
- **React Native + Expo** — cross-platform iOS and Android
- **Expo Router** — file-based routing (same mental model as Next.js)
- **NativeWind** — TailwindCSS for React Native
- Same React Query + Zustand setup as web

### Backend
- **Node.js + Express** — same as your current project, you already know it
- **TypeScript** — strongly recommended for a larger project, catches bugs before runtime
- **Prisma ORM** — replaces raw SQL queries, type-safe database access
- **PostgreSQL** — relational database (Neon for free hosted)

### Infrastructure & Services
| Need | Service | Why |
|---|---|---|
| Auth | **Supabase Auth** | Free, handles email/social login, JWTs |
| Photo storage | **Cloudinary** | Free tier, auto-resizes images, CDN delivery |
| Payments | **Paystack** | Built for Kenya/Africa, M-Pesa support |
| Maps / location | **Google Maps API** | Geocoding + distance calculations |
| Email | **Resend** | Simple, free tier, good deliverability |
| Push notifications | **Expo Notifications** | Works for both iOS and Android from one setup |
| Hosting (backend) | **Render** | Same as your current plan |
| Hosting (web frontend) | **Vercel** | Free, deploys Next.js instantly |
| Database | **Neon** | Free hosted PostgreSQL |

### Monorepo Structure
```
cosmiccare/
├── apps/
│   ├── web/          # Next.js web app
│   └── mobile/       # React Native (Expo) app
├── packages/
│   ├── api-client/   # Shared API fetch functions
│   ├── types/        # Shared TypeScript types
│   └── validators/   # Shared form validation (Zod)
├── backend/          # Express API server
│   ├── routes/
│   ├── services/
│   ├── prisma/       # Database schema
│   └── server.ts
└── package.json      # Monorepo root (use pnpm workspaces)
```

---

## Database Schema (Core Tables)

```
users
  id, email, passwordHash, role (PROFESSIONAL | CLIENT), createdAt

professional_profiles
  id, userId, displayName, bio, phone, avatarUrl
  serviceType (BARBER | STYLIST | NAIL_TECH | ...)
  offersHomeVisits (boolean)
  shopName, shopAddress, lat, lng
  isVerified, avgRating, reviewCount

services
  id, professionalId, name, description
  priceMin, priceMax, durationMinutes, isActive

portfolio_posts
  id, professionalId, imageUrl, caption, createdAt

portfolio_tags
  postId, tag  (one post can have many tags)

availability_slots
  id, professionalId, date, startTime, endTime, isBooked

bookings
  id, clientId, professionalId, serviceId, slotId
  status (PENDING | CONFIRMED | COMPLETED | CANCELLED)
  isHomeVisit, clientAddress, clientLat, clientLng
  depositAmount, totalAmount, paymentStatus
  createdAt

reviews
  id, bookingId, clientId, professionalId
  rating (1–5), comment, photoUrl, createdAt

messages
  id, bookingId, senderId, body, createdAt, isRead

follows
  followerId (clientId), followingId (professionalId)
```

---

## API Endpoints

### Auth
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Professionals
```
GET  /api/professionals              — search (query, lat, lng, tags, price)
GET  /api/professionals/:id          — profile + portfolio
PUT  /api/professionals/:id          — update profile
GET  /api/professionals/:id/availability/:date
```

### Portfolio
```
POST   /api/portfolio                — upload photo + tags
DELETE /api/portfolio/:postId
GET    /api/portfolio/tags           — list all available tags
```

### Services
```
GET    /api/professionals/:id/services
POST   /api/services
PUT    /api/services/:id
DELETE /api/services/:id
```

### Bookings
```
POST /api/bookings                   — create booking
GET  /api/bookings                   — list (client sees their bookings, pro sees their bookings)
PUT  /api/bookings/:id/confirm
PUT  /api/bookings/:id/cancel
PUT  /api/bookings/:id/complete
```

### Reviews
```
POST /api/reviews                    — after booking is COMPLETED
GET  /api/professionals/:id/reviews
```

### Messages
```
GET  /api/bookings/:id/messages
POST /api/bookings/:id/messages
```

---

## Build Order (Recommended Phases)

Build in this order so you always have something working and testable at each phase.

### Phase 1 — Foundation (Weeks 1–3)
- [ ] Set up monorepo with pnpm workspaces
- [ ] Backend: Express + TypeScript + Prisma + PostgreSQL
- [ ] Auth: register, login, JWT middleware
- [ ] Professional profile CRUD
- [ ] Client profile CRUD
- [ ] Basic web frontend: auth pages, pro profile page

**Done when:** A pro can sign up, fill in their profile, and you can view their page at `/pro/:id`

### Phase 2 — Portfolio & Search (Weeks 4–6)
- [ ] Photo upload to Cloudinary
- [ ] Portfolio post creation with tags
- [ ] Tag taxonomy (define all look tags)
- [ ] Search API (by tag + location)
- [ ] Search UI on web
- [ ] Explore feed (grid of portfolio posts)

**Done when:** A client can search "box braids Nairobi" and see real pro profiles with photos

### Phase 3 — Booking (Weeks 7–9)
- [ ] Availability slots (pro sets their schedule)
- [ ] Booking flow (client selects service → slot → confirms)
- [ ] Home visit booking (address input)
- [ ] Booking management (pro confirms/cancels)
- [ ] Email notifications (Resend)

**Done when:** A client can book an appointment and both sides get a confirmation email

### Phase 4 — Payments (Weeks 10–11)
- [ ] Paystack integration
- [ ] Deposit collection at booking
- [ ] Pro payout system
- [ ] Payment history

**Done when:** Money moves through the platform

### Phase 5 — Reviews & Messaging (Weeks 12–13)
- [ ] Review submission after completed booking
- [ ] Review display on pro profile
- [ ] In-app messaging (REST-based, no real-time needed at first)

### Phase 6 — Mobile App (Weeks 14–18)
- [ ] Expo project setup
- [ ] Auth screens
- [ ] Pro profile + portfolio view
- [ ] Search + explore feed
- [ ] Booking flow
- [ ] Push notifications (Expo Notifications)

**Done when:** Core client experience works on Android and iOS

### Phase 7 — Polish & Launch
- [ ] SEO for pro profile pages (Next.js SSR)
- [ ] Performance audit (image sizes, API response times)
- [ ] Error tracking (Sentry — free tier)
- [ ] Analytics (Posthog — free tier)
- [ ] App Store + Play Store submission

---

## What to Reuse from the Current Project

| Current Barber Max piece | Keep? | Notes |
|---|---|---|
| Express route structure | Yes | Same pattern, just add TypeScript |
| `routes/appointments.js` | Partially | Booking logic is similar, but expand it |
| Google Calendar integration | Optional | Nice-to-have for pros — add in Phase 6 |
| `.env` setup, dotenv | Yes | Same |
| TailwindCSS | Yes | Same |
| SQLite | No | Switch to PostgreSQL from the start |
| Vanilla JS frontend | No | Move to Next.js |
| Web components (navbar/footer) | No | Replace with React components |

---

## Estimated Costs (Running in Production)

| Service | Free Tier | Paid (when you scale) |
|---|---|---|
| Neon (PostgreSQL) | 3 GB storage | ~$20/month |
| Cloudinary (photos) | 25 GB storage | ~$90/month |
| Render (backend) | 750 hrs/month | ~$7/month |
| Vercel (web) | Unlimited hobby | ~$20/month (pro) |
| Paystack | 1.5% per transaction | Same |
| Resend (email) | 3,000/month | ~$20/month |
| **Total launch cost** | **~$0** | **~$50–150/month** |

---

## Open Questions to Decide Before Building

1. **Name** — What's the app called? Something broader than "Barber Max" since it covers all cosmetic care.
2. **Geography** — Starting in one city (Nairobi)? Or Kenya-wide from day one?
3. **Platform fee** — What % do you take from each booking?
4. **Verification** — Do pros need to verify their skills/certifications, or is it open to anyone?
5. **M-Pesa** — Paystack supports M-Pesa but you need a Kenyan business registration to go live. Do you have this or will you use a partner?
6. **Language** — English only, or Swahili support?
