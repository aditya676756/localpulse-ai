# 🏗️ LocalPulse AI — System Architecture & Technical Specifications

## 1. System Overview

LocalPulse AI is built with an ultra-lightweight, zero-external-dependency Node.js architecture designed for fast deployment, zero cold starts, and resilience in local computing environments.

```
+-------------------------------------------------------------------+
|                        LocalPulse AI Platform                     |
+-------------------------------------------------------------------+
             |                                          |
             v                                          v
   [Customer Interface]                       [Business Owner SaaS]
   - Simulated WhatsApp UI                    - Live Booking Calendar
   - Web Audio synthesizer                    - AI SEO & GEO Engine
   - Quick Action Chips                       - Win-back Broadcasts
   - Instant Ticket Generation                - 1-Click Social Ads
             |                                          |
             +--------------------+---------------------+
                                  |
                                  v
                  [Node.js REST API & Webhook Layer]
                   - /api/businesses
                   - /api/bookings
                   - /api/ai/chat (Conversational Engine)
                   - /api/ai/seo-audit
                   - /api/ai/generate-ads
                   - /api/ai/winback-campaign
                   - /api/roi-report
                   - /api/webhook (Meta Cloud API)
                                  |
                                  v
                    [JSON Local Data Persistence]
                   - data/businesses.json
                   - data/bookings.json
                   - data/customers.json
```

---

## 2. Conversational Intent Engine (`processAiWhatsAppMessage`)

The conversational engine uses deterministic natural language understanding (NLU) tailored for high-accuracy local booking without hallucinations:

1. **Entity Extraction:**
   - **Services:** Matched against catalog aliases and categories.
   - **Timestamps:** Natural expression matcher (`tomorrow at 3 PM`, `Friday 11 AM`).
   - **Pricing Inquiries:** Returns structured pricing from the active business catalog.
2. **Booking State Machine:**
   - Detects slot + service combination -> generates reference code (`BK-XXXX`).
   - Atomically appends booking record to `bookings.json` with source tag `WhatsApp AI Agent`.
   - Triggers live browser UI updates and revenue metric calculation.

---

## 3. Generative Engine Optimization (GEO) & Schema Engine

Traditional SEO is evolving into **GEO (Generative Engine Optimization)**. When users ask AI engines like Perplexity, ChatGPT, or Google Gemini *"What's the best hair salon near me?"*, the AI synthesizes answers based on:
1. Valid **Schema.org `LocalBusiness` JSON-LD** embedded in the site.
2. Consistent Name, Address, and Phone (NAP) citations across registries.
3. Explicit mentions of services, pricing ranges, and reviews sentiment.

LocalPulse AI automatically generates valid Schema.org markup ready to embed in any client website with 1 click.
