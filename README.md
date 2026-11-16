# ⚡ BLUESOUL MANAGEMENTS — Autonomous AI Client Growth & WhatsApp Operations OS

> **The Enterprise AI Operations & Autonomous WhatsApp Gateway for Local Businesses**

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0%20(Pure%20Node.js)-blue.svg)]()
[![Meta WhatsApp API](https://img.shields.io/badge/Meta%20Cloud%20API-v19.0-green.svg)]()
[![License](https://img.shields.io/badge/License-MIT-purple.svg)]()

---

## 📌 Platform Overview

**BLUESOUL MANAGEMENTS** transforms local businesses (salons, clinics, gyms, cafes, academies) into 24/7 autonomous booking and customer acquisition operations directly through their WhatsApp number:

1. **🤖 24/7 AI WhatsApp Concierge:** Instant responses (< 1.5s), natural language appointment scheduling, price quoting, and real confirmed tickets.
2. **🔌 Official Meta WhatsApp Cloud API Gateway:** Direct webhook architecture (`/api/webhook`) supporting real incoming customer texts and outbound replies via Meta's Graph API.
3. **🔍 Generative Engine Optimization (GEO) & Local SEO:** Automatically creates Schema.org `LocalBusiness` JSON-LD and keyword positioning for ChatGPT, Perplexity, and Google.
4. **📢 1-Click Ads & Social Creative Studio:** Generates targeted Instagram Stories, Reels, and Google Search campaigns tailored to local demographics.
5. **🔄 Customer Win-Back Broadcasts:** Identifies customers inactive for >30 days and dispatches AI-personalized WhatsApp re-engagement offers.
6. **📊 Client ROI & Operations Dashboard:** Real-time booking calendar, CRM records, and automated performance reports.

---

## 🚀 Quick Start

Built with zero external npm dependencies for instant startup and resilience:

### 1. Launch the Server
```bash
node server.js
```
*Or using npm:*
```bash
npm start
```

### 2. Open in Your Browser
Open: **`http://localhost:3000`**

### 3. Run Test Suite (11/11 Passed)
```bash
npm test
```

---

## 📱 Real Meta WhatsApp Cloud API Setup

To connect a real physical WhatsApp Business number:

1. Go to [developers.facebook.com](https://developers.facebook.com) and create a **Business App**.
2. Add the **WhatsApp** product.
3. Copy your **Phone Number ID** and **Access Token**.
4. In **Bluesoul Dashboard** > **Live WhatsApp API Setup** tab, paste your credentials and click **Save**.
5. In Meta Developer Dashboard > **WhatsApp** > **Configuration**, set:
   - **Callback URL:** `https://your-domain.com/api/webhook`
   - **Verify Token:** `bluesoul_verify_token`
   - **Webhook Fields:** Subscribe to `messages`.

---

## 📁 Repository Structure

```
bluesoul-managements/
├── server.js               # Zero-dependency HTTP server, Meta WhatsApp Gateway & REST APIs
├── package.json            # Scripts & metadata
├── test.js                 # 11-stage automated API and webhook test suite
├── data/
│   ├── businesses.json     # Client presets (Salon, Gym, Cafe, Clinic, Tuition)
│   ├── bookings.json       # Live booking records and appointment calendar
│   └── customers.json      # CRM customer database with dormancy tracking
├── public/
│   ├── index.html          # Split-view UI: Assistant simulator & Operations OS
│   ├── style.css           # Glassmorphic dark slate UI & WhatsApp chat styles
│   └── app.js              # State manager, audio synthesizer, Meta dispatcher
└── docs/
    ├── WHATSAPP_API_SETUP.md # Step-by-step Meta Cloud API & Twilio setup guide
    └── ARCHITECTURE.md     # System architecture, NLU pipeline, and GEO strategy
```
