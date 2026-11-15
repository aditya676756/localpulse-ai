# 🔌 WhatsApp Cloud API & Webhook Integration Guide

LocalPulse AI includes a production-ready webhook architecture that can seamlessly connect to **Meta WhatsApp Cloud API** (official) or **Twilio for WhatsApp**.

---

## 🛠️ Option 1: Official Meta WhatsApp Cloud API (Free 1,000 conversations/mo)

### 1. Create a Meta Developer App
1. Go to [developers.facebook.com](https://developers.facebook.com).
2. Click **Create App** → Select **Business** type.
3. Add the **WhatsApp** product to your app.

### 2. Configure Webhook
In the Meta WhatsApp App dashboard:
1. Navigate to **WhatsApp** → **Configuration**.
2. Click **Edit** under **Webhook**:
   - **Callback URL:** `https://your-domain.com/api/webhook` (or your ngrok URL during local testing)
   - **Verify Token:** `localpulse_secret_token`
3. Subscribe to webhook field: `messages`.

### 3. Verification Code Reference in `server.js`:
```javascript
if (pathname === '/api/webhook' && method === 'GET') {
  const mode = parsedUrl.searchParams.get('hub.mode');
  const token = parsedUrl.searchParams.get('hub.verify_token');
  const challenge = parsedUrl.searchParams.get('hub.challenge');
  if (mode === 'subscribe' && token === 'localpulse_secret_token') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end(challenge);
  }
}
```

### 4. Sending Outbound Responses
When an incoming message is received at `POST /api/webhook`, dispatch the outbound message using Meta's Graph API:

```javascript
async function sendWhatsAppMessage(toPhoneNumber, messageText) {
  const url = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhoneNumber,
      type: 'text',
      text: { preview_url: false, body: messageText }
    })
  });
  return response.json();
}
```

---

## 🚀 Option 2: Twilio for WhatsApp Sandbox (Instant 2-Minute Setup)
1. Sign up on [Twilio](https://www.twilio.com) and go to **Messaging** → **Try WhatsApp**.
2. Set the "When a message comes in" Webhook URL to: `https://your-domain.com/api/webhook`.
3. Set HTTP method to `POST`.
