/**
 * LocalPulse AI - Autonomous Growth Engine for Local Businesses
 * Zero-dependency Node.js HTTP Server & AI Simulation Engine
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Utility to read JSON
function readJson(filename) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
    return [];
  }
}

// Utility to write JSON
function writeJson(filename, data) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filename}:`, err);
    return false;
  }
}

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Helper to parse POST request body
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 10 * 1024 * 1024) { // 10MB limit
        reject(new Error('Request body too large'));
      }
    });
    req.on('end', () => {
      try {
        if (!body) return resolve({});
        resolve(JSON.parse(body));
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', err => reject(err));
  });
}

// JSON Response Helper
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// AI WhatsApp Assistant Reasoning Engine
function processAiWhatsAppMessage(business, userMessage, history = []) {
  const cleanMsg = (userMessage || '').trim().toLowerCase();
  const services = business.services || [];
  const offers = business.offers || [];
  const faqs = business.faqs || [];

  // Check for greetings
  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good evening', 'namaste', 'hola'];
  const isGreeting = greetings.some(g => cleanMsg === g || cleanMsg.startsWith(g + ' '));

  // Check for pricing / services
  const asksServices = cleanMsg.includes('price') || cleanMsg.includes('cost') || cleanMsg.includes('service') || cleanMsg.includes('menu') || cleanMsg.includes('rate') || cleanMsg.includes('list');

  // Check for offers
  const asksOffers = cleanMsg.includes('offer') || cleanMsg.includes('discount') || cleanMsg.includes('promo') || cleanMsg.includes('deal') || cleanMsg.includes('coupon');

  // Check for hours or location
  const asksHours = cleanMsg.includes('hour') || cleanMsg.includes('open') || cleanMsg.includes('time') || cleanMsg.includes('timing') || cleanMsg.includes('close');
  const asksLocation = cleanMsg.includes('location') || cleanMsg.includes('address') || cleanMsg.includes('where') || cleanMsg.includes('direction') || cleanMsg.includes('parking');

  // Check for booking intent
  const asksBooking = cleanMsg.includes('book') || cleanMsg.includes('appointment') || cleanMsg.includes('reserve') || cleanMsg.includes('slot') || cleanMsg.includes('schedule');

  // Check for matching service mentioned
  const matchedService = services.find(s => cleanMsg.includes(s.name.toLowerCase()) || cleanMsg.includes(s.category.toLowerCase()));

  // Check for date/time patterns
  const timeRegex = /(1[0-2]|[1-9])(?::([0-5][0-9]))?\s*(am|pm)/i;
  const daysRegex = /(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i;
  const timeMatch = userMessage.match(timeRegex);
  const dayMatch = userMessage.match(daysRegex);

  // If user provides specific booking details (e.g. "Book haircut tomorrow at 3pm for Alex")
  if ((asksBooking || matchedService) && (timeMatch || dayMatch || cleanMsg.includes('confirm') || cleanMsg.includes('yes'))) {
    const detectedService = matchedService ? matchedService.name : services[0].name;
    const detectedPrice = matchedService ? matchedService.price : services[0].price;
    const detectedDay = dayMatch ? dayMatch[0] : 'Tomorrow';
    const detectedTime = timeMatch ? timeMatch[0].toUpperCase() : '3:00 PM';
    
    // Generate simulated booking reference
    const bookingCode = 'BK-' + Math.floor(1000 + Math.random() * 9000);

    return {
      reply: `🎉 Great! I have reserved your appointment at *${business.name}*!\n\n📋 *Booking Details:*\n• Reference: *${bookingCode}*\n• Service: *${detectedService}* (${business.currency}${detectedPrice})\n• Date/Time: *${detectedDay} at ${detectedTime}*\n• Location: ${business.address}\n\n📍 *What happens next?*\nYou will receive a reminder 2 hours prior. If you need to reschedule or cancel, simply message me here anytime. See you soon!`,
      action: 'booking_confirmed',
      bookingData: {
        id: bookingCode,
        businessId: business.id,
        serviceName: detectedService,
        servicePrice: detectedPrice,
        date: detectedDay.toLowerCase() === 'today' ? 'Today' : 'Tomorrow',
        time: detectedTime,
        status: 'confirmed',
        source: 'WhatsApp AI Agent'
      }
    };
  }

  // Handle asks booking in general
  if (asksBooking) {
    const serviceList = services.slice(0, 4).map((s, i) => `${i + 1}. *${s.name}* - ${business.currency}${s.price} (${s.duration})`).join('\n');
    return {
      reply: `📅 I'd love to help you book an appointment at *${business.name}*!\n\nWhich service would you like to schedule?\n\n${serviceList}\n\n👉 *Reply with the service name and preferred day & time* (e.g., "${services[0].name} tomorrow at 2 PM") and I'll confirm your slot instantly!`,
      action: 'prompt_booking_details'
    };
  }

  // Handle offers
  if (asksOffers) {
    const offerText = offers.map(o => `🎁 *${o.title}* (Code: *${o.code}*)\n${o.description}`).join('\n\n');
    return {
      reply: `🌟 *Exclusive Deals at ${business.name}:*\n\n${offerText || 'Special 15% discount for first-time bookings today!'}\n\nWould you like me to apply one of these to a booking for you? Just say "Book with ${offers[0] ? offers[0].code : 'OFFER'}"!`,
      action: 'show_offers'
    };
  }

  // Handle services & pricing
  if (asksServices || matchedService) {
    const list = services.map(s => `• *${s.name}* — ${business.currency}${s.price} (${s.duration})\n  _${s.category}_`).join('\n\n');
    return {
      reply: `✨ Here is our current menu & pricing at *${business.name}*:\n\n${list}\n\nWould you like to book one of these now? Reply with the service name and your preferred time!`,
      action: 'show_services'
    };
  }

  // Handle hours & location
  if (asksHours || asksLocation) {
    return {
      reply: `📍 *Location & Hours for ${business.name}:*\n\n🏢 *Address:* ${business.address}\n⏰ *Hours:* ${business.hours}\n📞 *Direct Phone:* ${business.phone}\n🚗 *Parking:* Complimentary parking available on-site.\n\nWould you like to schedule a visit today?`,
      action: 'show_info'
    };
  }

  // Handle FAQs matching
  for (const faq of faqs) {
    const qWords = faq.q.toLowerCase().split(' ').filter(w => w.length > 3);
    const matches = qWords.filter(w => cleanMsg.includes(w));
    if (matches.length >= 2) {
      return {
        reply: `💡 ${faq.a}\n\nIs there anything else I can help you with, or would you like to book an appointment?`,
        action: 'answer_faq'
      };
    }
  }

  // Default Greeting / Fallback
  if (isGreeting || cleanMsg.length < 5) {
    return {
      reply: `👋 Hello! Welcome to *${business.name}* WhatsApp concierge!\n\nI can help you with:\n1️⃣ *Booking an appointment* 📅\n2️⃣ *Browsing services & prices* 💅\n3️⃣ *Current offers & discounts* 🎁\n4️⃣ *Location, hours & parking* 📍\n\nHow can I help you today?`,
      action: 'greet'
    };
  }

  // Intelligent Contextual Fallback
  return {
    reply: `Thank you for reaching out to *${business.name}*! 😊\n\nI can assist you with booking our popular services like *${services[0] ? services[0].name : 'our signature experience'}*, answering questions on our rates (${business.currency}${services[0] ? services[0].price : '45'}+), or checking availability.\n\nWould you like to see our services list or book a slot for this week?`,
    action: 'general_assistance'
  };
}

// AI Local SEO & GEO Audit Generator
function generateLocalSeoAudit(business) {
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": business.category === 'salon' ? "BeautySalon" :
             business.category === 'gym' ? "ExerciseGym" :
             business.category === 'cafe' ? "CafeOrCoffeeShop" :
             business.category === 'clinic' ? "Dentist" : "EducationalOrganization",
    "name": business.name,
    "telephone": business.phone,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": business.address
    },
    "openingHours": "Mo-Sa 09:00-20:00",
    "priceRange": "$$",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": business.rating,
      "reviewCount": business.reviewsCount
    }
  };

  const geoOptimizationSteps = [
    {
      title: "Google Business Profile (GBP) Optimization",
      status: "Optimized",
      impact: "High",
      detail: `Verified primary category '${business.category.toUpperCase()}', added complete service menu with exact pricing, and updated weekly holiday hours.`
    },
    {
      title: "Generative Engine Optimization (GEO) for ChatGPT & Perplexity",
      status: "Needs Action",
      impact: "Critical",
      detail: `When AI models are asked 'best ${business.category} near me', they prioritize sites with structured FAQ JSON-LD, localized citation backlinks, and review sentiment keywords. Add the generated Schema markup.`
    },
    {
      title: "Local Citations & NAP Consistency",
      status: "92% Score",
      impact: "Medium",
      detail: `Name, Address, and Phone number are matched across Google Maps, Apple Maps, Bing Places, and Yelp.`
    },
    {
      title: "WhatsApp Click-to-Chat Link on Google Maps",
      status: "Configured",
      impact: "High",
      detail: `Placed direct 'Message Us on WhatsApp' action button on GBP profile to convert mobile searchers immediately without waiting for phone calls.`
    }
  ];

  const recommendedKeywords = business.seoKeywords || [
    `best ${business.category} in downtown`,
    `${business.category} open now near me`,
    `affordable ${business.category} with good reviews`
  ];

  return {
    businessName: business.name,
    overallScore: 88,
    seoGrade: "A-",
    schemaJsonLd: JSON.stringify(schemaMarkup, null, 2),
    geoOptimizationSteps,
    recommendedKeywords,
    searchSimulationQuery: `best ${business.category} near me`,
    aiEngineRecommendation: `\"Based on local ratings and verified services, ${business.name} on ${business.address} is highly rated (${business.rating}★ with ${business.reviewsCount}+ reviews). They offer instant WhatsApp booking with no wait times.\"`
  };
}

// AI Ad & Creative Generator
function generateAdCreatives(business) {
  const currency = business.currency || '$';
  const category = business.category;
  const service = business.services[0] || { name: 'Signature Service', price: 49 };
  const offer = business.offers[0] || { code: 'WELCOME', discount: '20% Off' };

  return {
    targetAudience: {
      location: `Within 5-8 miles radius of ${business.address}`,
      ageGroup: category === 'tuition' ? '30 - 55 (Parents)' : '21 - 48',
      interests: category === 'salon' ? ['Hair care', 'Skincare', 'Beauty salons', 'Self-care'] :
                 category === 'gym' ? ['Fitness', 'Weight loss', 'Bodybuilding', 'Healthy diet'] :
                 category === 'cafe' ? ['Specialty coffee', 'Remote work', 'Breakfast', 'Foodies'] :
                 category === 'clinic' ? ['Dental health', 'Cosmetic dentistry', 'Teeth whitening'] :
                 ['High school tutoring', 'SAT prep', 'STEM education'],
      recommendedBudget: '$5 - $10 / day'
    },
    adVariants: [
      {
        type: "Instagram Story / Reels Lead Ad",
        hook: `Tired of waiting in line or playing phone tag for a ${category} appointment? 📱`,
        body: `Meet ${business.name}! Book your ${service.name} directly on WhatsApp in under 30 seconds. Get an instant confirmation + ${offer.discount} for first-time guests using code ${offer.code}.`,
        cta: "Send WhatsApp Message 💬",
        estimatedResults: "35-50 clicks / week | 12-18 confirmed bookings"
      },
      {
        type: "Facebook Community & Local Group Ad",
        hook: `Downtown locals: Here's why ${business.name} is rated ${business.rating}★ by over ${business.reviewsCount} clients! ⭐⭐⭐⭐⭐`,
        body: `Top-rated hygienic studio, expert specialists, and transparent pricing starting at just ${currency}${service.price}. Tap the button to chat with our friendly AI concierge and grab your exclusive slot before this weekend fills up!`,
        cta: "Book Now on WhatsApp 📲",
        estimatedResults: "28-40 clicks / week | 9-14 confirmed bookings"
      },
      {
        type: "Google Local Search Ad (Sponsored)",
        headline: `${business.name} | Instant WhatsApp Booking Available`,
        description: `Top-rated ${category} in town. ${offer.title}. Friendly staff, zero wait times. Click to chat & book in 30 seconds!`,
        cta: "Message on WhatsApp",
        estimatedResults: "45-65 high-intent clicks / week | 15-22 bookings"
      }
    ]
  };
}

// AI Win-Back Campaign Generator
function generateWinBackCampaign(business, customers) {
  const dormantCustomers = customers.filter(c => c.businessId === business.id && (c.status === 'Dormant' || c.daysInactive >= 30));
  const count = dormantCustomers.length || 3;
  const offer = business.offers[0] || { code: 'WELCOMEBACK', title: 'We Miss You 20% Off' };

  const messageTemplate = `Hey {CustomerName}! We miss seeing your smile at *${business.name}*! 😊\n\nIt's been a few weeks since your last visit. We'd love to welcome you back with a special gift: *${offer.title}* on your next visit!\n\nUse VIP code: *${offer.code}*\n\nJust reply "BOOK" to this message and I will set up your appointment instantly. Hope to see you soon! ✨`;

  return {
    targetAudience: `Dormant Customers (No visits in >30 days)`,
    totalIdentified: count,
    projectedReactivationRate: "28% - 35%",
    estimatedRecoveredRevenue: `${business.currency}${Math.round(count * 0.3 * (business.services[0]?.price || 50))}`,
    messageTemplate,
    previewRecipients: dormantCustomers.slice(0, 3).map(c => ({
      name: c.name,
      phone: c.phone,
      daysInactive: c.daysInactive,
      lastService: c.preferredService,
      previewMessage: messageTemplate.replace('{CustomerName}', c.name.split(' ')[0])
    }))
  };
}

// Main HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // -------------------------------------------------------------
  // REST API ROUTES
  // -------------------------------------------------------------

  // 1. GET /api/businesses
  if (pathname === '/api/businesses' && method === 'GET') {
    const businesses = readJson('businesses.json');
    return sendJson(res, 200, { success: true, data: businesses });
  }

  // 2. GET /api/businesses/:id
  if (pathname.startsWith('/api/businesses/') && method === 'GET') {
    const id = pathname.replace('/api/businesses/', '');
    const businesses = readJson('businesses.json');
    const business = businesses.find(b => b.id === id);
    if (!business) return sendJson(res, 404, { success: false, error: 'Business not found' });
    return sendJson(res, 200, { success: true, data: business });
  }

  // 3. GET /api/bookings
  if (pathname === '/api/bookings' && method === 'GET') {
    const businessId = parsedUrl.searchParams.get('businessId');
    let bookings = readJson('bookings.json');
    if (businessId) {
      bookings = bookings.filter(b => b.businessId === businessId);
    }
    return sendJson(res, 200, { success: true, count: bookings.length, data: bookings });
  }

  // 4. POST /api/bookings
  if (pathname === '/api/bookings' && method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      const bookings = readJson('bookings.json');
      const businesses = readJson('businesses.json');
      const biz = businesses.find(b => b.id === body.businessId) || businesses[0];

      const newBooking = {
        id: body.id || ('BK-' + Math.floor(1000 + Math.random() * 9000)),
        businessId: body.businessId || biz.id,
        customerName: body.customerName || 'WhatsApp Customer',
        customerPhone: body.customerPhone || '+1 (555) ' + Math.floor(100 + Math.random() * 900) + '-' + Math.floor(1000 + Math.random() * 9000),
        serviceName: body.serviceName || biz.services[0].name,
        servicePrice: body.servicePrice !== undefined ? body.servicePrice : biz.services[0].price,
        date: body.date || 'Tomorrow',
        time: body.time || '14:00',
        status: body.status || 'confirmed',
        source: body.source || 'WhatsApp AI Agent',
        createdAt: new Date().toISOString(),
        notes: body.notes || 'Instant booking via LocalPulse AI'
      };

      bookings.unshift(newBooking);
      writeJson('bookings.json', bookings);

      // Also update business stats
      biz.stats = biz.stats || {};
      biz.stats.aiBookings = (biz.stats.aiBookings || 0) + 1;
      biz.stats.revenueGenerated = (biz.stats.revenueGenerated || 0) + newBooking.servicePrice;
      writeJson('businesses.json', businesses);

      return sendJson(res, 201, { success: true, data: newBooking });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 5. GET /api/customers
  if (pathname === '/api/customers' && method === 'GET') {
    const businessId = parsedUrl.searchParams.get('businessId');
    let customers = readJson('customers.json');
    if (businessId) {
      customers = customers.filter(c => c.businessId === businessId);
    }
    return sendJson(res, 200, { success: true, count: customers.length, data: customers });
  }

  // 6. POST /api/ai/chat (WhatsApp Agent Chat)
  if (pathname === '/api/ai/chat' && method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      const businesses = readJson('businesses.json');
      const business = businesses.find(b => b.id === body.businessId) || businesses[0];
      
      const aiResult = processAiWhatsAppMessage(business, body.message, body.history);

      // If a booking was confirmed via chat, save it automatically!
      if (aiResult.action === 'booking_confirmed' && aiResult.bookingData) {
        const bookings = readJson('bookings.json');
        const bookingRecord = {
          id: aiResult.bookingData.id,
          businessId: business.id,
          customerName: body.customerName || 'Demo Customer',
          customerPhone: body.customerPhone || '+1 (555) 349-2199',
          serviceName: aiResult.bookingData.serviceName,
          servicePrice: aiResult.bookingData.servicePrice,
          date: aiResult.bookingData.date,
          time: aiResult.bookingData.time,
          status: 'confirmed',
          source: 'WhatsApp AI Agent',
          createdAt: new Date().toISOString(),
          notes: 'Auto-booked by LocalPulse conversational AI'
        };
        bookings.unshift(bookingRecord);
        writeJson('bookings.json', bookings);

        // Update stats
        business.stats = business.stats || {};
        business.stats.aiBookings = (business.stats.aiBookings || 0) + 1;
        business.stats.revenueGenerated = (business.stats.revenueGenerated || 0) + bookingRecord.servicePrice;
        writeJson('businesses.json', businesses);
      }

      return sendJson(res, 200, {
        success: true,
        reply: aiResult.reply,
        action: aiResult.action,
        bookingData: aiResult.bookingData || null
      });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 7. POST /api/ai/seo-audit
  if (pathname === '/api/ai/seo-audit' && method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      const businesses = readJson('businesses.json');
      const business = businesses.find(b => b.id === body.businessId) || businesses[0];
      const audit = generateLocalSeoAudit(business);
      return sendJson(res, 200, { success: true, data: audit });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 8. POST /api/ai/generate-ads
  if (pathname === '/api/ai/generate-ads' && method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      const businesses = readJson('businesses.json');
      const business = businesses.find(b => b.id === body.businessId) || businesses[0];
      const ads = generateAdCreatives(business);
      return sendJson(res, 200, { success: true, data: ads });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 9. POST /api/ai/winback-campaign
  if (pathname === '/api/ai/winback-campaign' && method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      const businesses = readJson('businesses.json');
      const customers = readJson('customers.json');
      const business = businesses.find(b => b.id === body.businessId) || businesses[0];
      
      const campaign = generateWinBackCampaign(business, customers);

      // If action is execute, update customer records
      if (body.execute) {
        let reactivatedCount = 0;
        customers.forEach(c => {
          if (c.businessId === business.id && (c.status === 'Dormant' || c.daysInactive >= 30)) {
            c.status = 'Campaign Sent';
            c.lastCampaignSent = new Date().toISOString();
            reactivatedCount++;
          }
        });
        writeJson('customers.json', customers);
        campaign.executed = true;
        campaign.recipientsMessaged = reactivatedCount;
      }

      return sendJson(res, 200, { success: true, data: campaign });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 10. GET /api/roi-report (Step 3: Show them proof "you got 30 new customers")
  if (pathname === '/api/roi-report' && method === 'GET') {
    const businessId = parsedUrl.searchParams.get('businessId') || 'biz_salon';
    const businesses = readJson('businesses.json');
    const bookings = readJson('bookings.json').filter(b => b.businessId === businessId);
    const customers = readJson('customers.json').filter(c => c.businessId === businessId);
    const business = businesses.find(b => b.id === businessId) || businesses[0];

    const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.servicePrice) || 0), 0);
    const avgTicket = bookings.length > 0 ? Math.round(totalRevenue / bookings.length) : 50;

    const report = {
      businessName: business.name,
      trialPeriod: "Last 30 Days (Free Trial Proof)",
      totalNewBookings: bookings.length + (business.stats?.aiBookings || 34),
      estimatedRevenueAdded: totalRevenue + (business.stats?.revenueGenerated || 2850),
      currency: business.currency || '$',
      averageBookingValue: `${business.currency || '$'}${avgTicket}`,
      breakdownByChannel: [
        { channel: "24/7 WhatsApp AI Concierge", bookings: 24, revenue: 1540 },
        { channel: "AI Local SEO & Google Search", bookings: 11, revenue: 820 },
        { channel: "Automated Win-Back Follow-up", bookings: 7, revenue: 490 }
      ],
      ownerRoiSummary: {
        freeTrialCost: "$0.00",
        proposedMonthlySubscription: "$79.00 / month",
        netClientProfit: `$${(totalRevenue + 2850) - 79}`,
        returnOnInvestment: "3,600% ROI"
      },
      clientPitchConclusion: `\"In the last 30 days, LocalPulse AI captured 42 appointments that would have otherwise been missed calls or lost to competitors. At $79/mo, just 2 bookings cover the entire subscription!\"`
    };

    return sendJson(res, 200, { success: true, data: report });
  }

  // 11. POST /api/webhook (Production WhatsApp Cloud API / Twilio ready)
  if (pathname === '/api/webhook') {
    // Meta verification challenge
    if (method === 'GET') {
      const mode = parsedUrl.searchParams.get('hub.mode');
      const token = parsedUrl.searchParams.get('hub.verify_token');
      const challenge = parsedUrl.searchParams.get('hub.challenge');
      if (mode === 'subscribe' && token === 'localpulse_secret_token') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        return res.end(challenge);
      }
      return sendJson(res, 403, { error: 'Forbidden' });
    }

    if (method === 'POST') {
      try {
        const body = await parseRequestBody(req);
        // Process incoming WhatsApp message payload from Meta Cloud API
        console.log('[WhatsApp Webhook Received]:', JSON.stringify(body).slice(0, 150));
        return sendJson(res, 200, { status: 'EVENT_RECEIVED' });
      } catch (err) {
        return sendJson(res, 500, { error: err.message });
      }
    }
  }

  // -------------------------------------------------------------
  // STATIC FILE SERVING
  // -------------------------------------------------------------
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';

  const fullPath = path.join(PUBLIC_DIR, safePath);

  // Security check: ensure path is within PUBLIC_DIR
  if (!fullPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  fs.stat(fullPath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA routing
      const indexPath = path.join(PUBLIC_DIR, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return fs.createReadStream(indexPath).pipe(res);
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(fullPath).pipe(res);
  });
});

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🚀 LocalPulse AI is running at: http://localhost:${PORT}`);
    console.log(`📱 WhatsApp Bot Simulator + SaaS Dashboard ready`);
    console.log(`📁 Workspace: ${__dirname}`);
    console.log(`======================================================\n`);
  });
}

module.exports = server;
