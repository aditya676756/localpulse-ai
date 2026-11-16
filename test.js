/**
 * BLUESOUL MANAGEMENTS - In-Memory Engine & API Test Suite
 * Tests full HTTP routing, Meta WhatsApp Webhooks, and Operations Engine
 */

const { EventEmitter } = require('events');
const server = require('./server');

function makeRequest(method, urlPath, body = null) {
  return new Promise((resolve, reject) => {
    const req = new EventEmitter();
    req.method = method;
    req.url = urlPath;
    req.headers = { host: 'localhost' };
    if (body) {
      req.headers['content-type'] = 'application/json';
    }

    const res = new EventEmitter();
    let resBody = '';
    let statusCode = 200;
    let headers = {};

    res.writeHead = (code, h = {}) => {
      statusCode = code;
      headers = h;
    };
    res.write = (chunk) => {
      resBody += chunk;
    };
    res.end = (chunk) => {
      if (chunk) resBody += chunk;
      try {
        resolve({ status: statusCode, headers, body: JSON.parse(resBody) });
      } catch {
        resolve({ status: statusCode, headers, body: resBody });
      }
    };

    server.emit('request', req, res);

    if (body) {
      req.emit('data', Buffer.from(typeof body === 'string' ? body : JSON.stringify(body)));
    }
    req.emit('end');
  });
}

async function runTests() {
  console.log('🚀 Starting Bluesoul Managements Test Suite (In-Memory Engine)...\n');

  try {
    // 1. Test GET /api/businesses
    console.log('Test 1: Fetching all business presets...');
    const bizRes = await makeRequest('GET', '/api/businesses');
    if (bizRes.status !== 200 || !bizRes.body.success || bizRes.body.data.length < 5) {
      throw new Error(`Failed to fetch businesses: status ${bizRes.status}`);
    }
    console.log(`✅ Business presets loaded (${bizRes.body.data.length} categories: Salon, Gym, Cafe, Clinic, Tuition).`);

    // 2. Test GET /api/businesses/:id
    console.log('Test 2: Fetching individual business profile (biz_salon)...');
    const singleBiz = await makeRequest('GET', '/api/businesses/biz_salon');
    if (singleBiz.status !== 200 || singleBiz.body.data.name !== 'Luxe Glow Salon & Spa') {
      throw new Error('Failed to fetch biz_salon profile');
    }
    console.log(`✅ Verified profile: ${singleBiz.body.data.name} (${singleBiz.body.data.currency}${singleBiz.body.data.services[0].price}+)`);

    // 3. Test POST /api/ai/chat (Services Inquiry)
    console.log('Test 3: Testing WhatsApp AI Assistant service inquiry...');
    const chatGreet = await makeRequest('POST', '/api/ai/chat', {
      businessId: 'biz_salon',
      message: 'Hi, what are your services and prices?'
    });
    if (chatGreet.status !== 200 || !chatGreet.body.reply.includes('Luxe Glow')) {
      throw new Error(`Chatbot reply failed: ${JSON.stringify(chatGreet.body)}`);
    }
    console.log('✅ WhatsApp AI Assistant returned menu and pricing.');

    // 4. Test POST /api/ai/chat (Natural Slot Booking Flow)
    console.log('Test 4: Testing WhatsApp AI Natural Booking Flow...');
    const chatBooking = await makeRequest('POST', '/api/ai/chat', {
      businessId: 'biz_salon',
      message: 'Book a haircut tomorrow at 3 PM for Alex Smith',
      customerName: 'Alex Smith',
      customerPhone: '+1 (555) 349-2199'
    });
    if (chatBooking.status !== 200 || chatBooking.body.action !== 'booking_confirmed') {
      throw new Error(`Booking flow failed: ${JSON.stringify(chatBooking.body)}`);
    }
    console.log(`✅ WhatsApp AI confirmed booking with Ref Code: ${chatBooking.body.bookingData.id}`);

    // 5. Test GET /api/bookings
    console.log('Test 5: Verifying booking persistence in CRM database...');
    const bookingsRes = await makeRequest('GET', '/api/bookings?businessId=biz_salon');
    if (bookingsRes.status !== 200 || bookingsRes.body.count === 0) {
      throw new Error('Bookings retrieval failed');
    }
    console.log(`✅ CRM database verified: ${bookingsRes.body.count} active appointments found.`);

    // 6. Test POST /api/ai/seo-audit
    console.log('Test 6: Testing AI Local SEO & GEO Audit generator...');
    const seoRes = await makeRequest('POST', '/api/ai/seo-audit', { businessId: 'biz_gym' });
    if (seoRes.status !== 200 || !seoRes.body.data.schemaJsonLd) {
      throw new Error('SEO Audit failed');
    }
    console.log('✅ Schema.org JSON-LD and Generative Engine keywords generated.');

    // 7. Test POST /api/ai/generate-ads
    console.log('Test 7: Testing 1-Click Ads & Creative Studio...');
    const adsRes = await makeRequest('POST', '/api/ai/generate-ads', { businessId: 'biz_cafe' });
    if (adsRes.status !== 200 || adsRes.body.data.adVariants.length < 3) {
      throw new Error('Ad generator failed');
    }
    console.log(`✅ ${adsRes.body.data.adVariants.length} Ad creative variants & target audience parameters generated.`);

    // 8. Test POST /api/ai/winback-campaign
    console.log('Test 8: Testing Customer Win-back Campaign engine...');
    const winbackRes = await makeRequest('POST', '/api/ai/winback-campaign', {
      businessId: 'biz_salon',
      execute: true
    });
    if (winbackRes.status !== 200 || !winbackRes.body.data.messageTemplate) {
      throw new Error('Winback generator failed');
    }
    console.log(`✅ Win-back broadcast simulated for dormant customers (Reactivation rate: ${winbackRes.body.data.projectedReactivationRate}).`);

    // 9. Test GET /api/roi-report (Client Performance Report)
    console.log('Test 9: Testing Client Performance & Operations Generator...');
    const roiRes = await makeRequest('GET', '/api/roi-report?businessId=biz_salon');
    if (roiRes.status !== 200 || !roiRes.body.data.clientRoiSummary) {
      throw new Error('ROI report failed');
    }
    console.log(`✅ Performance report generated (${roiRes.body.data.totalNewBookings} bookings, ${roiRes.body.data.clientRoiSummary.returnOnInvestment}).`);

    // 10. Test Meta Webhook Verification Handshake
    console.log('Test 10: Testing Meta WhatsApp Cloud API Webhook handshake...');
    const webhookRes = await makeRequest('GET', '/api/webhook?hub.mode=subscribe&hub.verify_token=bluesoul_verify_token&hub.challenge=VERIFIED_CHALLENGE');
    if (webhookRes.status !== 200 || webhookRes.body !== 'VERIFIED_CHALLENGE') {
      throw new Error('Webhook handshake failed');
    }
    console.log('✅ Meta Cloud API Webhook verification handshake successful.');

    // 11. Test Live Test Dispatcher Endpoint
    console.log('Test 11: Testing Live WhatsApp Dispatcher endpoint...');
    const dispatchRes = await makeRequest('POST', '/api/whatsapp/send-test', {
      recipientPhone: '+919999999999',
      message: 'Test from Bluesoul Gateway'
    });
    if (dispatchRes.status !== 200 || !dispatchRes.body.success) {
      throw new Error('WhatsApp Dispatcher failed');
    }
    console.log('✅ WhatsApp Gateway dispatcher endpoint verified.');

    console.log('\n======================================================');
    console.log('🎉 ALL 11 TESTS PASSED! BLUESOUL MANAGEMENTS READY.');
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    process.exit(1);
  }
}

runTests();
