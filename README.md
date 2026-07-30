# 🛺 TukTuk Meter & GPS Navigation
### A Professional Ride Fare Meter and Navigation Dashboard for Sri Lanka Tuk-Tuk Drivers

[![Live App](https://img.shields.io/badge/Live%20App-tuktuk--app--ten.vercel.app-cyan?style=for-the-badge)](https://tuktuk-app-ten.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
[![Leaflet](https://img.shields.io/badge/Leaflet-Map-green?style=for-the-badge)](https://leafletjs.com)

---

## 📖 Overview

**TukTuk Meter** is a mobile-first, landscape-oriented Progressive Web App built for Sri Lanka three-wheeler (tuk-tuk) drivers. It replaces a physical taxi meter with a fully digital, GPS-powered fare calculation and live navigation system — all running in a mobile browser with no app installation required.

The app runs on any modern Android or iOS browser when the phone is mounted in landscape mode on the vehicle dashboard. It tracks real GPS position, calculates fare in real-time based on configurable tariff settings, provides toll-free road navigation, and saves trip receipts locally.

---

## 🌟 Key Highlights

- 📍 **Real GPS tracking** with satellite accuracy filtering
- 🛣️ **Toll-free routing** via Valhalla engine (always avoids Sri Lanka expressways)
- 💰 **Live fare meter** with base fare + per-KM + wait charge + surcharges
- 🗺️ **Interactive Leaflet map** with Google Maps-style heading-up rotation
- 🔒 **No API keys required** — fully open-source routing and geocoding
- 📱 **Landscape mobile HUD** — designed for phone windshield mount
- 🌙 **Windshield mirror mode** — flipped display for night dash reflection
- 🔔 **Voice + audio feedback** — kilometre announcements and chimes
- 📋 **Trip history** — saves all receipts locally on device
- ☀️ **Wake Lock** — screen stays on while trip is active

---

## 🖥️ Interface Layout

The app uses a **split-screen landscape layout**:

```
┌─────────────────────────┬──────────────────────────────┐
│                         │  [HISTORY] [FULL] [RESET] [⏸]│
│    INTERACTIVE MAP      │                              │
│    (left ~55%)          │    FARE METER PANEL          │
│                         │    (right ~45%)              │
│  - Live GPS position    │                              │
│  - Route line           │  Rs. 1,978   19.58 KM       │
│  - Driven path          │                              │
│  - Destination pin      │  TOTAL TIME    WAIT TIME     │
│  - Heading-up rotation  │  00:23:00      00:00:00      │
│                         │                              │
│  [Search...]  [📍]      │  SPEED: 45 KM/H             │
│  [Layers]               │                              │
│                         │  [▶ START RIDE NAVIGATION]  │
└─────────────────────────┴──────────────────────────────┘
```

---

## 🗺️ Map Features

### Tile Layers
| Style | Provider | Best For |
|---|---|---|
| **Streets** | OpenStreetMap | Normal daytime use |
| **Dark** | CartoDB Dark Matter | Night driving, less glare |
| **Satellite** | ArcGIS World Imagery | Identifying landmarks |

### Navigation
- **Heading-Up Rotation**: Map rotates so vehicle direction always faces up (Google Maps style). Returns to North-Up when trip ends.
- **Vehicle Arrow**: Cyan rotating arrow shows real-time position and heading.
- **Route Line** (cyan dashed): Planned route from pickup to destination.
- **Driven Path** (green solid): Actual GPS path driven so far.
- **Destination Pin**: Bouncing red pin at destination.
- **Auto-Fit Bounds**: Auto-zooms to show both pickup and destination when set.
- **Re-Center Button**: Snaps map back to vehicle and zooms in.

### Destination Search
Dual-engine geocoding:
1. **Photon (Komoot)** — Fast, OSM-based, Sri Lanka bounding box
2. **Nominatim (OSM)** — Full country filter fallback

Results merged and de-duplicated by location proximity. All queries URL-encoded. Nominatim `User-Agent` header included per OSM usage policy.

### Drag Pin Mode
1. Tap **DRAG PIN** button
2. Drag the map to center the crosshair on the destination
3. Tap **SET DESTINATION PIN** to confirm

---

## 📡 GPS & Location

### 3-Layer GPS Outlier Filtering
```
FILTER 1 — Accuracy Gate:
  accuracy > 40m  →  REJECT (weak satellite lock)
  Shows: "GPS Signal Weak (±Xm — waiting...)"

FILTER 2 — Speed Sanity Check:
  Implied speed > 150 km/h  →  REJECT (GPS teleport)

FILTER 3 — Jitter Gate:
  Movement < 5m from last point  →  SKIP (stationary noise)
```

Prevents the "crazy zigzag" path from weak GPS signal.

### Simulation Mode
When real GPS is unavailable: simulates 25–45 km/h trip along the planned route. All meter calculations work identically.

### Reverse Geocoding
GPS coordinates → human-readable street name via Nominatim. Cached by 3-decimal grid (~100m) to minimize API calls.

### Wake Lock
`navigator.wakeLock.request('screen')` keeps screen on during trips. Auto-reacquired on screen unlock via `visibilitychange` listener.

---

## 🛣️ Routing Engine

### Primary: Valhalla
- **Free** — no API key required
- `use_tolls: 0.0` — avoids toll roads
- `use_highways: 0.0` — avoids expressways
- Custom **precision-6 polyline decoder** (Valhalla uses 1/1,000,000° precision)

### Fallback: OSRM
- Used when Valhalla is unreachable
- Standard GeoJSON geometry response

### Last Resort: Straight Line
- Only if both routing engines fail

**Example — Colombo → Galle:**
- ❌ Without avoidance: Southern Expressway (E01) — toll road
- ✅ With avoidance: A2 Coastal Road — local, toll-free

---

## 💰 Fare Calculation

```
Total Fare = Base Fare
           + max(0, distance - baseKmIncluded) × ratePerKm
           + (waitMinutes × waitRatePerMin)
           + [AC Surcharge if enabled]
           + [Luggage Surcharge if enabled]
           × [Night Multiplier if night tariff]
```

### Default Sri Lanka Tariff
| Parameter | Default |
|---|---|
| Base Fare | Rs. 120 |
| Base KM Included | 1.0 km |
| Rate per KM | Rs. 100 |
| Wait Rate | Rs. 6/min |
| Night Multiplier | ×1.2 |
| AC Surcharge | Rs. 50 |
| Luggage Surcharge | Rs. 100 |

All values configurable via Settings modal.

### Wait Time Logic
| Mode | Wait Time Counts When |
|---|---|
| Real GPS | Driver manually PAUSES |
| Simulation | Traffic sim ON or speed = 0 |

---

## ⏱️ Trip Lifecycle

```
IDLE ──[START]──→ RUNNING ──[PAUSE]──→ PAUSED ──[RESUME]──→ RUNNING
  ↑                   │                                          │
  └──[RESET]──────────┘                                         │
                       └─────────────[FINISH]──────────→ FINISHED
```

### Timer Architecture
Uses **live refs pattern** — `setInterval` only restarts on `status` change, never on GPS updates. Prevents tick drift and interval jitter.

---

## 🧾 Trip History & Receipts

Every completed trip auto-saved to `localStorage`:
```json
{
  "id": "trip-1722341234567",
  "date": "30/07/2026",
  "time": "19:23",
  "distanceKm": 19.58,
  "durationSec": 1380,
  "totalFare": 1978,
  "currency": "Rs."
}
```
- Unlimited trips stored locally
- Full receipt breakdown in HISTORY modal
- **Clear History** deletes all records
- No data sent to any server — fully private

---

## 🔊 Audio Feedback

| Event | Sound |
|---|---|
| Trip Start | 3-tone ascending chime |
| Trip End | 3-tone descending chime |
| Each KM completed | Voice: "X kilometer completed." |
| Meter tick (0.1 KM) | Short beep |
| Trip finished | Voice: "Trip completed. Total fare Rs. X" |

All audio mutable via 🔇 button. Uses Web Audio API (no library).

---

## 🌙 Windshield Mirror Mode

Full-screen `transform: scaleX(-1)` flip for dashboard reflection viewing at night.

---

## 🔐 Security

| Check | Status |
|---|---|
| Hardcoded API keys | ✅ None |
| XSS / eval / innerHTML | ✅ None |
| Environment variable leaks | ✅ None |
| User input sanitization | ✅ `encodeURIComponent` everywhere |
| Sensitive data in localStorage | ✅ Only fare receipts |
| External URLs | ✅ All HTTPS |
| Nominatim User-Agent | ✅ Set per OSM policy |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS + Custom CSS |
| Map | Leaflet + React-Leaflet |
| Routing | Valhalla + OSRM |
| Geocoding | Nominatim + Photon |
| Icons | Lucide React |
| Audio | Web Audio API |
| Storage | localStorage |
| Hosting | Vercel |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                   # Main split-screen layout
│   ├── layout.tsx                 # Root HTML, fonts, metadata
│   └── globals.css                # Global styles, glassmorphism
├── components/
│   ├── Map/
│   │   └── InteractiveMap.tsx     # Leaflet map, search, layers, rotation
│   ├── Meter/
│   │   ├── TelemetryPanel.tsx     # Fare + controls panel
│   │   ├── TariffSettingsModal.tsx
│   │   ├── ReceiptModal.tsx
│   │   └── TripHistoryModal.tsx
│   └── HUD/
│       └── WindshieldMirrorMode.tsx
├── hooks/
│   └── useTripMeter.ts            # Core state — GPS, timer, routing, fare
└── utils/
    └── audio.ts                   # Web Audio API engine
```

---

## 🚀 Local Development

```bash
git clone https://github.com/malinga-PW/tuktuk-app.git
cd tuktuk-app
npm install
npm run dev
# Open http://localhost:3000
```

---

## 📱 Requirements

| | Minimum |
|---|---|
| Browser | Chrome 92+ / Firefox 90+ / Safari 15+ |
| GPS | Optional (simulation mode available) |
| Orientation | Landscape recommended |
| Internet | Required for map tiles and routing |

---

*Built with ❤️ for Sri Lanka tuk-tuk drivers | 2026*
