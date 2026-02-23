# 🏐 VolleyTrack Web

AI-powered volleyball spike speed analyzer and form tracker.  
Upload a clip → get ball speed in km/h + form scores — entirely in the browser using TensorFlow.js.

**Tech stack:** Next.js 14 · Tailwind CSS · Supabase · TensorFlow.js · MoveNet · Vercel

---

## Local Setup (5 minutes)

### 1. Clone and install
```bash
git clone https://github.com/YOUR_USERNAME/volleytrack-web.git
cd volleytrack-web
npm install
```

### 2. Set up environment variables
```bash
cp .env.local.example .env.local
```
Fill in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set up Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste the contents of `supabase/schema.sql` → **Run**
3. Go to **Authentication → Providers**:
   - Enable **Google** (see below)
   - Enable **Azure (Microsoft)** (see below)
4. Go to **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Add to Redirect URLs: `http://localhost:3000/auth/callback`

### 4. Run locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## Setting Up Google Sign-In

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → **APIs & Services → OAuth consent screen** → External
3. **Credentials → Create OAuth 2.0 Client ID → Web application**
   - Authorized redirect URI: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
4. Copy **Client ID** and **Client Secret**
5. In Supabase → **Authentication → Providers → Google** → paste both → Save

---

## Setting Up Microsoft Sign-In

1. Go to [portal.azure.com](https://portal.azure.com)
2. **Azure Active Directory → App registrations → New registration**
   - Name: VolleyTrack
   - Supported account types: Accounts in any organizational directory and personal Microsoft accounts
   - Redirect URI (Web): `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
3. After registration: **Certificates & secrets → New client secret** → copy the value
4. Copy the **Application (client) ID** from the Overview page
5. In Supabase → **Authentication → Providers → Azure** → paste Client ID + Secret → Save

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or connect your GitHub repo directly in the [Vercel dashboard](https://vercel.com/new).

**Add environment variables in Vercel → Project → Settings → Environment Variables:**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL   ← set to your production URL, e.g. https://volleytrack.vercel.app
```

**Update Supabase redirect URLs for production:**  
Authentication → URL Configuration → add:
```
https://your-app.vercel.app/auth/callback
```

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts    POST: create session | PATCH: save CV results
│   │   └── sessions/route.ts   GET: list + trends  | DELETE: remove session
│   ├── auth/
│   │   ├── page.tsx            Google + Microsoft sign-in
│   │   └── callback/route.ts   OAuth exchange handler
│   ├── home/                   Mode selector + recent sessions
│   ├── record/                 Video upload + CV analysis orchestration
│   ├── results/                Speed gauge + form cards + pose skeleton
│   ├── history/                Session list + trend chart
│   ├── settings/               Profile + preferences + account deletion
│   ├── layout.tsx
│   └── page.tsx                Root → redirects to /home or /auth
│
├── components/
│   ├── ui/Button.tsx
│   ├── SpeedGauge.tsx          Animated SVG semicircular gauge
│   ├── FormScoreCard.tsx       Circular progress rings
│   ├── TrendChart.tsx          14-day recharts line chart
│   └── Navbar.tsx              Bottom nav for authenticated pages
│
├── lib/
│   ├── cv/
│   │   ├── frameExtractor.ts   Video → ImageData[] via canvas
│   │   ├── ballDetector.ts     Hough circle transform in JS
│   │   ├── opticalFlow.ts      Lucas-Kanade sparse tracking
│   │   ├── speedCalculator.ts  Displacement → km/h with confidence
│   │   ├── poseAnalyzer.ts     MoveNet + form scoring
│   │   └── pipeline.ts         Orchestrates all CV steps
│   ├── supabase/
│   │   ├── client.ts           Browser client
│   │   └── server.ts           Server Component client
│   └── utils.ts
│
├── middleware.ts                Session refresh + route protection
└── types/index.ts               Shared TypeScript types

supabase/
└── schema.sql                  Complete DB schema — run once in Supabase SQL editor
```

---

## How the CV Pipeline Works

1. **Frame extraction** — video is seeked frame-by-frame using `<video>` + `<canvas>`, producing `ImageData[]` at the camera's actual fps (up to 60fps)

2. **Calibration** — a Hough circle transform detects the volleyball in the first ~30 frames and computes the pixel-to-meter ratio using the known ball diameter (21cm)

3. **Ball tracking** — Lucas-Kanade optical flow tracks the ball center between frames, falling back to fresh circle detection if tracking is lost for >8 consecutive frames

4. **Speed calculation** — pixel displacement per frame × fps ÷ px_per_meter → m/s → km/h, with a 5-frame smoothing window and confidence score

5. **Pose estimation** — MoveNet Lightning runs on the contact frame (peak velocity) via TensorFlow.js to extract 17 body keypoints

6. **Form scoring** — wrist snap angle, elbow extension angle, and wrist-to-ball distance are scored 0–100 and weighted into an overall form score

All processing happens in the user's browser — no video is sent to any server unless the user explicitly enables video storage in Settings.

---

## Week-by-Week Build Status

| Week | Feature | Status |
|------|---------|--------|
| 1 | Auth (Google + Microsoft), routing, Supabase | ✅ |
| 2 | Ball detection + optical flow | ✅ |
| 3 | MoveNet pose estimation + form scoring | ✅ |
| 4 | Full CV pipeline + results UI | ✅ |
| 5 | Frame scrubber + pose skeleton overlay | ✅ |
| 6 | History + trend charts | ✅ |
| 7 | Settings + video storage preference | ✅ |
| 8 | Polish, share, delete, error handling | ✅ |

---

## Future: Android + iOS

All CV logic is in `src/lib/cv/` — pure TypeScript with no browser APIs (except `ImageData` which maps 1:1 to Android's `Bitmap` and iOS's `UIImage`).

Migration path:
- **Android:** Port `pipeline.ts` to Kotlin, replace `<canvas>` frame extraction with `MediaMetadataRetriever`, use TFLite for MoveNet
- **iOS:** Port to Swift, use `AVAssetImageGenerator` for frames, use Core ML for MoveNet
- **Shared API:** Supabase handles auth + data on all platforms with the same schema
