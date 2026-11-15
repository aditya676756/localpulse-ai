/**
 * LocalPulse AI - Frontend Application
 * Live WhatsApp Bot Simulator, SaaS Growth Dashboard & ROI Engine
 */

// Application State
const state = {
  activeBusinessId: 'biz_salon',
  activeBusiness: null,
  allBusinesses: [],
  bookings: [],
  customers: [],
  chatHistory: [],
  audioEnabled: true
};

// Web Audio API Synthesizer for realistic chimes (zero external assets needed)
let audioCtx = null;
function playSound(type = 'receive') {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'send') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } else if (type === 'receive') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    }
  } catch (e) {
    // Audio context silently fails if restricted
  }
}

// Format time (e.g., 2:45 PM)
function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Toast Notification
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>⚡</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ============================================================================
// Initialization & Data Fetching
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadBusinesses();
  await switchBusiness('biz_salon');
});

// Setup DOM event listeners
function setupEventListeners() {
  // Business Switcher
  const bizSelect = document.getElementById('businessSelect');
  bizSelect.addEventListener('change', (e) => {
    switchBusiness(e.target.value);
  });

  // Tab Switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const targetTab = document.getElementById(`tab-${btn.dataset.tab}`);
      if (targetTab) targetTab.classList.add('active');
    });
  });

  // Link to View All Bookings
  const linkAll = document.getElementById('linkViewAllBookings');
  if (linkAll) {
    linkAll.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelector('[data-tab="bookings"]').click();
    });
  }

  // WhatsApp Form Submit
  const waForm = document.getElementById('waForm');
  waForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('waInput');
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    sendUserWhatsAppMessage(msg);
  });

  // Quick Suggestion Chips
  const chipsContainer = document.getElementById('waQuickChips');
  chipsContainer.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (chip && chip.dataset.msg) {
      sendUserWhatsAppMessage(chip.dataset.msg);
    }
  });

  // Quick Manual Booking Form
  const qbForm = document.getElementById('quickBookingForm');
  qbForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleQuickBookingSubmit();
  });

  // Search Bookings
  const searchInput = document.getElementById('searchBookings');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderBookingsTable(e.target.value);
    });
  }

  // Regenerate Ads Button
  const btnAds = document.getElementById('btnRegenerateAds');
  if (btnAds) {
    btnAds.addEventListener('click', () => {
      loadAdsModule();
      showToast('New ad variations generated for ' + state.activeBusiness.name);
    });
  }

  // Copy Schema Button
  const btnCopySchema = document.getElementById('btnCopySchema');
  if (btnCopySchema) {
    btnCopySchema.addEventListener('click', () => {
      const code = document.getElementById('schemaCodeBlock').innerText;
      navigator.clipboard.writeText(code).then(() => {
        showToast('Schema.org JSON-LD copied to clipboard!');
      });
    });
  }

  // Launch Winback Broadcast
  const btnWinback = document.getElementById('btnLaunchWinback');
  if (btnWinback) {
    btnWinback.addEventListener('click', async () => {
      await executeWinBackCampaign();
    });
  }

  // Modal: ROI Proof Report
  const btnProof = document.getElementById('btnDownloadProof');
  const btnPreview = document.getElementById('btnPreviewPitch');
  const modal = document.getElementById('proofModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const btnPrintModal = document.getElementById('btnPrintModal');
  const btnCopyPitch = document.getElementById('btnCopyPitchText');

  const openProof = () => {
    loadProofModal();
    modal.classList.add('active');
  };

  if (btnProof) btnProof.addEventListener('click', openProof);
  if (btnPreview) btnPreview.addEventListener('click', openProof);
  if (btnCloseModal) btnCloseModal.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  if (btnPrintModal) {
    btnPrintModal.addEventListener('click', () => {
      window.print();
    });
  }

  if (btnCopyPitch) {
    btnCopyPitch.addEventListener('click', () => {
      const biz = state.activeBusiness;
      const text = `Hi ${biz.name}! Here is your 30-day LocalPulse AI performance summary:\n\n` +
        `• Total New Bookings Captured: 38 appointments\n` +
        `• Added Revenue Generated: ${biz.currency}2,480\n` +
        `• Dormant Clients Won Back: 14 clients\n` +
        `• Cost of 30-Day Free Trial: $0.00\n\n` +
        `Our software subscription is just $79/mo. 2 appointments pay for the entire system! Let's lock in your growth for next month?`;
      navigator.clipboard.writeText(text).then(() => {
        showToast('Pitch message copied for WhatsApp!');
      });
    });
  }
}

// Fetch all business presets
async function loadBusinesses() {
  try {
    const res = await fetch('/api/businesses');
    const json = await res.json();
    if (json.success) {
      state.allBusinesses = json.data;
    }
  } catch (err) {
    console.error('Failed to load businesses:', err);
  }
}

// Switch active business preset
async function switchBusiness(businessId) {
  state.activeBusinessId = businessId;
  state.activeBusiness = state.allBusinesses.find(b => b.id === businessId) || state.allBusinesses[0];

  if (!state.activeBusiness) return;

  const biz = state.activeBusiness;

  // 1. Update WhatsApp Phone Header
  const avatarMap = {
    salon: '💅',
    gym: '🏋️',
    cafe: '☕',
    clinic: '🩺',
    tuition: '📚'
  };
  document.getElementById('waAvatar').innerText = avatarMap[biz.category] || '🏢';
  document.getElementById('waBusinessName').innerText = biz.name;

  // 2. Refresh WhatsApp Chat Simulation
  resetWhatsAppChat(biz);

  // 3. Populate Quick Booking Form Services
  const qbSelect = document.getElementById('qbService');
  qbSelect.innerHTML = biz.services.map(s => `<option value="${s.name}" data-price="${s.price}">${s.name} (${biz.currency}${s.price})</option>`).join('');

  // 4. Update Stats & Bookings
  await loadBookings();
  await loadCustomers();
  loadSeoModule();
  loadAdsModule();
  loadWinbackModule();

  showToast(`Switched active business to ${biz.name}`);
}

// ============================================================================
// WhatsApp Simulator Engine
// ============================================================================

function resetWhatsAppChat(biz) {
  const chatBody = document.getElementById('waChatBody');
  state.chatHistory = [];

  // Remove existing message bubbles but keep header/encryption note
  chatBody.innerHTML = `
    <div class="wa-date-divider"><span>TODAY</span></div>
    <div class="wa-encryption-notice">
      🔒 Messages are end-to-end encrypted. Powered by LocalPulse AI WhatsApp Gateway.
    </div>
  `;

  // Update quick chips
  const chipsContainer = document.getElementById('waQuickChips');
  if (biz.category === 'salon') {
    chipsContainer.innerHTML = `
      <button class="chip" data-msg="Hi! What are your salon services and rates?">💅 Services & Rates</button>
      <button class="chip" data-msg="I want to book a haircut tomorrow at 3 PM">📅 Book Haircut</button>
      <button class="chip" data-msg="Do you have any first-time client discounts?">🎁 First-time Promo</button>
      <button class="chip" data-msg="Where are you located and is there parking?">📍 Address & Parking</button>
    `;
  } else if (biz.category === 'gym') {
    chipsContainer.innerHTML = `
      <button class="chip" data-msg="Can I get a free trial day pass?">🏋️ Free Day Pass</button>
      <button class="chip" data-msg="What are your monthly membership prices?">💵 Membership Rates</button>
      <button class="chip" data-msg="Book a personal training session tomorrow at 10 AM">📅 Book PT Session</button>
      <button class="chip" data-msg="What are your peak hours?">⏰ Hours & Crowd</button>
    `;
  } else if (biz.category === 'cafe') {
    chipsContainer.innerHTML = `
      <button class="chip" data-msg="Can I reserve a co-working table with Wi-Fi today?">☕ Reserve Table</button>
      <button class="chip" data-msg="Do you have vegan and gluten-free pastries?">🥐 Vegan Menu</button>
      <button class="chip" data-msg="Book a weekend brunch table for 3 people">📅 Brunch Booking</button>
      <button class="chip" data-msg="What are your open hours?">📍 Hours & Wi-Fi</button>
    `;
  } else if (biz.category === 'clinic') {
    chipsContainer.innerHTML = `
      <button class="chip" data-msg="How much is a teeth cleaning & checkup?">🩺 Checkup & Cleaning</button>
      <button class="chip" data-msg="Book a dental checkup tomorrow at 2 PM">📅 Book Appointment</button>
      <button class="chip" data-msg="Do you accept dental insurance?">🛡️ Insurance Accepted</button>
      <button class="chip" data-msg="Do you have emergency slots today?">🚨 Emergency Slot</button>
    `;
  } else {
    chipsContainer.innerHTML = `
      <button class="chip" data-msg="Can I book a free demo diagnostic class?">📚 Free Demo Class</button>
      <button class="chip" data-msg="What is the tuition fee for Grade 10 Math?">📐 Course Fees</button>
      <button class="chip" data-msg="What is your student to teacher ratio?">👨‍🏫 Batch Size</button>
      <button class="chip" data-msg="Where are you located?">📍 Center Location</button>
    `;
  }

  // Initial welcome message from the AI Assistant
  setTimeout(() => {
    appendBotMessage(`👋 Hello! Welcome to *${biz.name}*!\n\nI am your 24/7 AI concierge. How can I help you today? You can check our services, ask questions, or book an appointment in seconds! ✨`);
  }, 300);
}

function appendUserMessage(text) {
  const chatBody = document.getElementById('waChatBody');
  const msgEl = document.createElement('div');
  msgEl.className = 'wa-msg wa-msg-out';
  msgEl.innerHTML = `
    ${formatWhatsAppText(text)}
    <span class="wa-msg-time">${formatTime()} <span class="tick">✓✓</span></span>
  `;
  chatBody.appendChild(msgEl);
  chatBody.scrollTop = chatBody.scrollHeight;
  playSound('send');
}

function appendBotMessage(text, bookingData = null) {
  const chatBody = document.getElementById('waChatBody');
  const msgEl = document.createElement('div');
  msgEl.className = 'wa-msg wa-msg-in';

  let ticketHtml = '';
  if (bookingData) {
    ticketHtml = `
      <div class="wa-booking-ticket">
        <h5>✅ Confirmed Appointment</h5>
        <div><strong>Ref:</strong> ${bookingData.id}</div>
        <div><strong>Service:</strong> ${bookingData.serviceName} (${state.activeBusiness.currency}${bookingData.servicePrice})</div>
        <div><strong>Slot:</strong> ${bookingData.date} @ ${bookingData.time}</div>
      </div>
    `;
  }

  msgEl.innerHTML = `
    ${formatWhatsAppText(text)}
    ${ticketHtml}
    <span class="wa-msg-time">${formatTime()}</span>
  `;
  chatBody.appendChild(msgEl);
  chatBody.scrollTop = chatBody.scrollHeight;
  playSound('receive');
}

function showTypingIndicator() {
  const chatBody = document.getElementById('waChatBody');
  const typing = document.createElement('div');
  typing.className = 'wa-typing';
  typing.id = 'waTypingIndicator';
  typing.innerHTML = `
    <div class="wa-typing-dot"></div>
    <div class="wa-typing-dot"></div>
    <div class="wa-typing-dot"></div>
  `;
  chatBody.appendChild(typing);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function removeTypingIndicator() {
  const typing = document.getElementById('waTypingIndicator');
  if (typing) typing.remove();
}

// Convert WhatsApp Markdown (*bold*, _italic_) to HTML
function formatWhatsAppText(str) {
  if (!str) return '';
  return str
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

// Send user message to AI backend
async function sendUserWhatsAppMessage(text) {
  appendUserMessage(text);
  state.chatHistory.push({ role: 'user', content: text });
  showTypingIndicator();

  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId: state.activeBusinessId,
        message: text,
        history: state.chatHistory,
        customerName: 'Demo User',
        customerPhone: '+1 (555) 438-9921'
      })
    });
    const data = await res.json();

    // Natural typing delay simulation (600ms)
    setTimeout(async () => {
      removeTypingIndicator();
      if (data.success) {
        appendBotMessage(data.reply, data.bookingData);
        state.chatHistory.push({ role: 'assistant', content: data.reply });

        // If a booking was created, refresh dashboard live!
        if (data.action === 'booking_confirmed') {
          showToast(`🎉 New Booking Created: ${data.bookingData.serviceName} (${data.bookingData.id})!`, 'success');
          await loadBookings();
        }
      } else {
        appendBotMessage("Sorry, I'm having trouble processing that right now. Please try again!");
      }
    }, 600);
  } catch (err) {
    removeTypingIndicator();
    appendBotMessage("Error connecting to LocalPulse server. Please check your connection.");
  }
}

// ============================================================================
// SaaS Dashboard Modules
// ============================================================================

// Fetch and render bookings
async function loadBookings() {
  try {
    const res = await fetch(`/api/bookings?businessId=${state.activeBusinessId}`);
    const json = await res.json();
    if (json.success) {
      state.bookings = json.data;
      renderBookingsTable();
      renderRecentBookings();
      updateOverviewStats();
    }
  } catch (err) {
    console.error('Failed to load bookings:', err);
  }
}

// Render All Bookings in Tab 2
function renderBookingsTable(filterQuery = '') {
  const tbody = document.getElementById('allBookingsTbody');
  const countBadge = document.getElementById('bookingCountBadge');
  const biz = state.activeBusiness;

  let filtered = state.bookings;
  if (filterQuery) {
    const q = filterQuery.toLowerCase();
    filtered = filtered.filter(b => 
      b.customerName.toLowerCase().includes(q) ||
      b.serviceName.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q)
    );
  }

  countBadge.innerText = filtered.length;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 20px; color:#94a3b8;">No appointments found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(b => `
    <tr>
      <td><strong>${b.id}</strong></td>
      <td>${b.customerName}</td>
      <td style="color:#94a3b8;">${b.customerPhone}</td>
      <td><strong>${b.serviceName}</strong></td>
      <td>${b.date} • ${b.time}</td>
      <td style="color:#34d399; font-weight:600;">${biz.currency}${b.servicePrice}</td>
      <td><span class="badge badge-info">${b.source || 'WhatsApp AI'}</span></td>
      <td><span class="badge badge-success">${b.status}</span></td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="alert('Notification sent to ${b.customerPhone} via WhatsApp!')">Notify</button>
      </td>
    </tr>
  `).join('');
}

// Render Recent 4 Bookings in Overview Tab
function renderRecentBookings() {
  const tbody = document.getElementById('recentBookingsTbody');
  const biz = state.activeBusiness;
  const recent = state.bookings.slice(0, 4);

  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:15px; color:#94a3b8;">No bookings yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = recent.map(b => `
    <tr>
      <td><strong>${b.customerName}</strong></td>
      <td>${b.serviceName}</td>
      <td>${b.date} @ ${b.time}</td>
      <td style="color:#34d399;">${biz.currency}${b.servicePrice}</td>
      <td><span class="badge badge-info">${b.source}</span></td>
      <td><span class="badge badge-success">${b.status}</span></td>
    </tr>
  `).join('');
}

// Update Top Overview KPIs
function updateOverviewStats() {
  const biz = state.activeBusiness;
  const totalRev = state.bookings.reduce((sum, b) => sum + (Number(b.servicePrice) || 0), 0) + (biz.stats?.revenueGenerated || 1800);
  const totalCount = state.bookings.length + (biz.stats?.aiBookings || 25);

  document.getElementById('statBookings').innerText = totalCount;
  document.getElementById('statRevenue').innerText = `${biz.currency}${totalRev.toLocaleString()}`;
  document.getElementById('statReactivated').innerText = biz.stats?.dormantReactivated || 14;
}

// Handle Quick Booking Form
async function handleQuickBookingSubmit() {
  const name = document.getElementById('qbName').value.trim();
  const phone = document.getElementById('qbPhone').value.trim();
  const serviceSelect = document.getElementById('qbService');
  const serviceName = serviceSelect.value;
  const servicePrice = Number(serviceSelect.selectedOptions[0]?.dataset?.price || 50);
  const date = document.getElementById('qbDate').value.trim();
  const time = document.getElementById('qbTime').value.trim();

  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId: state.activeBusinessId,
        customerName: name,
        customerPhone: phone,
        serviceName,
        servicePrice,
        date,
        time,
        source: 'Manual Counter Entry'
      })
    });
    const json = await res.json();
    if (json.success) {
      showToast(`Appointment added for ${name}!`, 'success');
      document.getElementById('qbName').value = '';
      document.getElementById('qbPhone').value = '';
      await loadBookings();
    }
  } catch (err) {
    showToast('Failed to save booking', 'error');
  }
}

// ============================================================================
// SEO & GEO Engine (Tab 3)
// ============================================================================
async function loadSeoModule() {
  const biz = state.activeBusiness;
  try {
    const res = await fetch('/api/ai/seo-audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: biz.id })
    });
    const json = await res.json();
    if (json.success) {
      const data = json.data;

      // Render Checklist
      const listContainer = document.getElementById('seoChecklist');
      listContainer.innerHTML = data.geoOptimizationSteps.map(step => `
        <div class="audit-item">
          <div class="audit-item-top">
            <span class="audit-item-title">${step.title}</span>
            <span class="badge ${step.status === 'Optimized' || step.status === 'Configured' ? 'badge-success' : 'badge-warning'}">${step.status}</span>
          </div>
          <p class="audit-item-desc">${step.detail}</p>
        </div>
      `).join('');

      // Keywords
      const keywordsContainer = document.getElementById('seoKeywords');
      keywordsContainer.innerHTML = data.recommendedKeywords.map(k => `
        <span class="keyword-pill">🔍 ${k}</span>
      `).join('');

      // AI Simulation Text
      document.getElementById('geoSimulationText').innerHTML = data.aiEngineRecommendation;

      // Schema Code
      document.getElementById('schemaCodeBlock').innerHTML = `<code>${escapeHtml(data.schemaJsonLd)}</code>`;
    }
  } catch (err) {
    console.error('Failed to load SEO audit:', err);
  }
}

function escapeHtml(string) {
  return String(string).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ============================================================================
// Ads & Creatives Generator (Tab 4)
// ============================================================================
async function loadAdsModule() {
  const biz = state.activeBusiness;
  try {
    const res = await fetch('/api/ai/generate-ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: biz.id })
    });
    const json = await res.json();
    if (json.success) {
      const data = json.data;

      // Target Audience
      const audienceCard = document.getElementById('adAudienceCard');
      audienceCard.innerHTML = `
        <h5>🎯 AI Recommended Target Audience</h5>
        <div class="audience-details">
          <div><strong>📍 Radius:</strong> ${data.targetAudience.location}</div>
          <div><strong>👥 Demographics:</strong> ${data.targetAudience.ageGroup}</div>
          <div><strong>💡 Interests:</strong> ${data.targetAudience.interests.join(', ')}</div>
          <div><strong>💰 Budget:</strong> ${data.targetAudience.recommendedBudget}</div>
        </div>
      `;

      // Variants Grid
      const variantsContainer = document.getElementById('adVariantsContainer');
      variantsContainer.innerHTML = data.adVariants.map(ad => `
        <div class="ad-variant-card">
          <div class="ad-variant-header">
            <span class="ad-type-badge">${ad.type}</span>
          </div>
          <div class="ad-hook">${ad.hook || ad.headline}</div>
          <div class="ad-body">${ad.body || ad.description}</div>
          <div class="ad-cta-box">${ad.cta}</div>
          <div class="ad-results-estimate">📈 Projected: ${ad.estimatedResults}</div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load ads:', err);
  }
}

// ============================================================================
// Win-Back Campaign Module (Tab 5)
// ============================================================================
async function loadCustomers() {
  try {
    const res = await fetch(`/api/customers?businessId=${state.activeBusinessId}`);
    const json = await res.json();
    if (json.success) {
      state.customers = json.data;
      loadWinbackModule();
    }
  } catch (err) {
    console.error('Failed to load customers:', err);
  }
}

async function loadWinbackModule() {
  const biz = state.activeBusiness;
  try {
    const res = await fetch('/api/ai/winback-campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: biz.id, execute: false })
    });
    const json = await res.json();
    if (json.success) {
      const data = json.data;

      // Metrics Bar
      const metricsContainer = document.getElementById('winbackMetrics');
      metricsContainer.innerHTML = `
        <div class="winback-stat-col">
          <span>Identified Dormant Clients</span>
          <h4>${data.totalIdentified} Customers</h4>
        </div>
        <div class="winback-stat-col">
          <span>Target Inactivity</span>
          <h4>> 30 Days</h4>
        </div>
        <div class="winback-stat-col">
          <span>Projected Recovery Rate</span>
          <h4>${data.projectedReactivationRate}</h4>
        </div>
        <div class="winback-stat-col">
          <span>Est. Recoverable Revenue</span>
          <h4>${data.estimatedRecoveredRevenue}</h4>
        </div>
      `;

      // Customer Table
      const tbody = document.getElementById('winbackCustomersTbody');
      const customers = state.customers.filter(c => c.businessId === biz.id);

      if (customers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:15px; color:#94a3b8;">No dormant customers found for this location.</td></tr>`;
        return;
      }

      tbody.innerHTML = customers.map(c => `
        <tr>
          <td><strong>${c.name}</strong></td>
          <td style="color:#94a3b8;">${c.phone}</td>
          <td><span style="color:#f87171; font-weight:600;">${c.daysInactive} days</span></td>
          <td>${c.preferredService}</td>
          <td><span class="badge ${c.status === 'Active' ? 'badge-success' : 'badge-warning'}">${c.status}</span></td>
          <td style="font-size:11px; color:#cbd5e1; max-width:300px;">
            "${data.messageTemplate.replace('{CustomerName}', c.name.split(' ')[0])}"
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load winback module:', err);
  }
}

async function executeWinBackCampaign() {
  const biz = state.activeBusiness;
  try {
    const res = await fetch('/api/ai/winback-campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: biz.id, execute: true })
    });
    const json = await res.json();
    if (json.success) {
      showToast(`🚀 WhatsApp Broadcast sent to ${json.data.recipientsMessaged || 3} dormant clients!`, 'success');
      await loadCustomers();
    }
  } catch (err) {
    showToast('Failed to execute broadcast', 'error');
  }
}

// ============================================================================
// ROI Proof Report Modal (Step 3: Show them proof "you got 30 new customers")
// ============================================================================
async function loadProofModal() {
  const modalContent = document.getElementById('proofModalContent');
  modalContent.innerHTML = '<p>Generating 30-day proof analysis...</p>';

  try {
    const res = await fetch(`/api/roi-report?businessId=${state.activeBusinessId}`);
    const json = await res.json();
    if (json.success) {
      const r = json.data;
      modalContent.innerHTML = `
        <div class="proof-report-card">
          <div class="report-title-row">
            <div>
              <h2 style="font-size:20px; font-weight:bold;">${r.businessName}</h2>
              <p style="color:#64748b; font-size:12px;">LocalPulse AI Performance & ROI Proof Report</p>
            </div>
            <div style="text-align:right;">
              <span class="badge badge-success" style="font-size:12px;">30-Day Free Trial Audit</span>
              <p style="font-size:11px; color:#64748b; margin-top:4px;">Period: Last 30 Days</p>
            </div>
          </div>

          <div class="report-kpis">
            <div class="report-kpi-box">
              <span style="font-size:11px; color:#64748b; font-weight:600;">NEW CUSTOMERS</span>
              <h2>+${r.totalNewBookings}</h2>
            </div>
            <div class="report-kpi-box">
              <span style="font-size:11px; color:#64748b; font-weight:600;">REVENUE ADDED</span>
              <h2 style="color:#10b981;">${r.currency}${r.estimatedRevenueAdded.toLocaleString()}</h2>
            </div>
            <div class="report-kpi-box">
              <span style="font-size:11px; color:#64748b; font-weight:600;">RETURN ON INVESTMENT</span>
              <h2 style="color:#8b5cf6;">${r.ownerRoiSummary.returnOnInvestment}</h2>
            </div>
          </div>

          <h5 style="font-size:13px; font-weight:bold; margin-top:16px;">Acquisition Channel Breakdown:</h5>
          <table class="report-channels-table">
            <thead>
              <tr>
                <th>Channel</th>
                <th>Appointments</th>
                <th>Est. Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${r.breakdownByChannel.map(c => `
                <tr>
                  <td><strong>${c.channel}</strong></td>
                  <td>${c.bookings} bookings</td>
                  <td style="color:#10b981; font-weight:600;">${r.currency}${c.revenue}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="report-pitch-highlight">
            <strong>The Bottom Line for ${r.businessName}:</strong><br>
            ${r.clientPitchConclusion}
          </div>

          <div style="display:flex; justify-content:space-between; margin-top:20px; border-top:1px solid #cbd5e1; padding-top:12px; font-size:12px; color:#475569;">
            <div>Trial Cost Paid: <strong>$0.00</strong></div>
            <div>Monthly Subscription: <strong>${r.ownerRoiSummary.proposedMonthlySubscription}</strong></div>
            <div>Owner Net Added Value: <strong style="color:#059669;">+${r.ownerRoiSummary.netClientProfit}</strong></div>
          </div>
        </div>
      `;
    }
  } catch (err) {
    modalContent.innerHTML = '<p style="color:red;">Failed to generate proof report.</p>';
  }
}
