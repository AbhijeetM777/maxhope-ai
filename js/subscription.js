/* ============================================
   Maxhope.AI — Subscription Manager
   ============================================ */

const SubscriptionManager = {

  PLAN_DEFAULTS: {
    starter:    { generations: 100,   days: 7  },
    pro:        { generations: 5000,  days: 30 },
    enterprise: { generations: 99999, days: 30 }
  },

  RECHARGE_PACKS: [
    { id: 'starter_pack', name: 'Starter Boost', usdEquivalent: 12, inrAmount: 1000, generations: 500,  durationDays: 30 },
    { id: 'pro_pack',     name: 'Pro Boost',     usdEquivalent: 30, inrAmount: 2500, generations: 1500, durationDays: 30 },
    { id: 'max_pack',     name: 'Max Boost',     usdEquivalent: 60, inrAmount: 5000, generations: 4000, durationDays: 30 }
  ],

  // ---- Persist user to BOTH storage keys ----
  _persistUser(user) {
    localStorage.setItem('nexusai_user', JSON.stringify(user));
    const users = JSON.parse(localStorage.getItem('nexusai_users') || '[]');
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) users[idx] = user;
    else users.push(user);
    localStorage.setItem('nexusai_users', JSON.stringify(users));
  },

  // ---- Backfill old accounts + mark expired ----
  init() {
    const data = localStorage.getItem('nexusai_user');
    if (!data) return;
    const user = JSON.parse(data);
    if (!user) return;

    // Backfill subscription if missing
    if (!user.subscription) {
      const pd = this.PLAN_DEFAULTS[user.plan] || this.PLAN_DEFAULTS.starter;
      const joinDate = user.joinDate || new Date().toISOString();
      user.subscription = {
        status: 'active',
        expiresAt: new Date(new Date(joinDate).getTime() + pd.days * 86400000).toISOString(),
        generationsLimit: pd.generations,
        generationsUsed: user.usage ? (user.usage.generations || 0) : 0,
        lastRecharged: null,
        rechargeHistory: []
      };
    }

    // Sync generationsUsed with usage.generations
    if (user.usage) {
      user.subscription.generationsUsed = user.usage.generations || 0;
    }

    // Mark expired
    if (user.plan !== 'enterprise' && new Date() > new Date(user.subscription.expiresAt)) {
      user.subscription.status = 'expired';
    } else if (user.subscription.status === 'expired' && new Date() <= new Date(user.subscription.expiresAt)) {
      user.subscription.status = 'active';
    }

    this._persistUser(user);
  },

  // ---- Get subscription status ----
  getStatus() {
    const data = localStorage.getItem('nexusai_user');
    if (!data) return { canGenerate: false, reason: 'not_logged_in' };
    const user = JSON.parse(data);
    if (!user || !user.subscription) return { canGenerate: false, reason: 'no_subscription' };

    const sub = user.subscription;
    const now = new Date();
    const expiresAt = new Date(sub.expiresAt);
    const daysLeft = Math.max(0, Math.ceil((expiresAt - now) / 86400000));
    const generationsLeft = Math.max(0, sub.generationsLimit - sub.generationsUsed);

    // Enterprise: unlimited generations, only expiry blocks
    if (user.plan === 'enterprise') {
      if (now > expiresAt) return { canGenerate: false, reason: 'expired', daysLeft: 0, generationsLeft, expiresAt: sub.expiresAt };
      return { canGenerate: true, reason: 'ok', daysLeft, generationsLeft: 'Unlimited', expiresAt: sub.expiresAt };
    }

    if (now > expiresAt) return { canGenerate: false, reason: 'expired', daysLeft: 0, generationsLeft, expiresAt: sub.expiresAt };
    if (generationsLeft <= 0) return { canGenerate: false, reason: 'exhausted', daysLeft, generationsLeft: 0, expiresAt: sub.expiresAt };
    return { canGenerate: true, reason: 'ok', daysLeft, generationsLeft, expiresAt: sub.expiresAt };
  },

  // ---- Consume one generation ----
  consumeGeneration() {
    const data = localStorage.getItem('nexusai_user');
    if (!data) return;
    const user = JSON.parse(data);
    if (!user || !user.subscription) return;
    user.usage.generations = (user.usage.generations || 0) + 1;
    user.subscription.generationsUsed = (user.subscription.generationsUsed || 0) + 1;
    this._persistUser(user);
  },

  // ---- Apply a recharge pack ----
  applyRecharge(packId) {
    const pack = this.RECHARGE_PACKS.find(p => p.id === packId);
    if (!pack) return false;
    const data = localStorage.getItem('nexusai_user');
    if (!data) return false;
    const user = JSON.parse(data);
    if (!user || !user.subscription) return false;

    const sub = user.subscription;
    const now = new Date();
    const currentExpiry = new Date(sub.expiresAt);
    const baseDate = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(baseDate.getTime() + pack.durationDays * 86400000);

    sub.generationsLimit += pack.generations;
    sub.expiresAt = newExpiry.toISOString();
    sub.status = 'active';
    sub.lastRecharged = now.toISOString();
    sub.rechargeHistory.push({
      date: now.toISOString(),
      packId: pack.id,
      packName: pack.name,
      amountINR: pack.inrAmount,
      amountFormatted: typeof Currency !== 'undefined' ? Currency.format(pack.usdEquivalent) : `$${pack.usdEquivalent}`,
      generationsAdded: pack.generations,
      newExpiresAt: newExpiry.toISOString()
    });

    this._persistUser(user);
    return true;
  },

  // ---- Get summary for dashboard card ----
  getDashboardSummary() {
    const data = localStorage.getItem('nexusai_user');
    if (!data) return null;
    const user = JSON.parse(data);
    if (!user || !user.subscription) return null;
    const status = this.getStatus();
    const sub = user.subscription;

    const expiryDate = new Date(sub.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const planLabel = user.plan.charAt(0).toUpperCase() + user.plan.slice(1);

    let badgeClass = 'active';
    if (sub.status === 'expired' || (status.daysLeft === 0 && user.plan !== 'enterprise')) badgeClass = 'expired';
    else if (status.daysLeft <= 5 && user.plan !== 'enterprise') badgeClass = 'warning';

    const gensLeft = user.plan === 'enterprise' ? 'Unlimited' : (sub.generationsLimit - sub.generationsUsed);

    return { planLabel, badgeClass, expiryDate, gensLeft, generationsUsed: sub.generationsUsed, generationsLimit: sub.generationsLimit, daysLeft: status.daysLeft, status: sub.status, isEnterprise: user.plan === 'enterprise' };
  },

  // ---- Show Recharge Modal ----
  showRechargeModal(reason) {
    // Remove existing if any
    const existing = document.getElementById('recharge-modal');
    if (existing) { existing.remove(); }

    const base = typeof getBasePath === 'function' ? getBasePath() : '';

    const reasonMsg = {
      expired:   '⚠️ Your subscription has expired. Recharge to continue generating.',
      exhausted: '⚠️ You\'ve used all your generations. Recharge to get more.',
      no_subscription: '⚠️ No active subscription found.',
    }[reason] || '⚠️ Upgrade your subscription to continue.';

    const packsHTML = this.RECHARGE_PACKS.map((pack, i) => `
      <div class="recharge-pack-card ${i === 1 ? 'highlight' : ''}" onclick="SubscriptionManager._selectModalPack('${pack.id}', this)" data-pack-id="${pack.id}">
        ${i === 1 ? '<div class="pack-badge">Most Popular</div>' : ''}
        <div class="pack-header">
          <div class="pack-name">${pack.name}</div>
          <div class="pack-price">${typeof Currency !== 'undefined' ? Currency.format(pack.usdEquivalent) : '$' + pack.usdEquivalent}</div>
        </div>
        <div class="pack-details">
          <span class="pack-tag">+${pack.generations.toLocaleString()} generations</span>
          <span class="pack-tag">+${pack.durationDays} days</span>
        </div>
      </div>
    `).join('');

    const html = `
      <div class="recharge-modal-overlay" id="recharge-modal">
        <div class="recharge-modal-box">
          <button class="recharge-modal-close" onclick="SubscriptionManager.hideRechargeModal()">&#10005;</button>

          <!-- Step 1: Pack Selection -->
          <div id="rm-step-select">
            <div class="recharge-modal-title">Recharge Your Account</div>
            <div class="recharge-modal-subtitle">Choose a pack to continue using AI tools</div>
            <div class="recharge-notice">${reasonMsg}</div>
            <div style="font-size:12px;color:var(--dim);margin-bottom:12px;">Minimum recharge: ₹1,000 INR equivalent</div>
            <div class="recharge-packs-grid">${packsHTML}</div>
            <button class="btn btn-primary btn-block" id="rm-continue-btn" onclick="SubscriptionManager._proceedToPayment()" disabled style="opacity:0.5;cursor:not-allowed;">Select a pack to continue</button>
            <div style="margin-top:12px;text-align:center;">
              <a href="${base}recharge.html" style="font-size:13px;color:var(--muted);">View full billing page →</a>
            </div>
          </div>

          <!-- Step 2: Payment Form -->
          <div id="rm-step-payment" class="hidden">
            <div class="recharge-modal-title">Payment Details</div>
            <div class="recharge-modal-subtitle">Simulated secure checkout — no real charge</div>
            <div class="recharge-pack-summary" id="rm-pack-summary"></div>
            <div class="form-group">
              <label class="form-label">Cardholder Name</label>
              <input type="text" class="form-input" id="rm-card-name" placeholder="John Doe">
            </div>
            <div class="form-group">
              <label class="form-label">Card Number</label>
              <input type="text" class="form-input" id="rm-card-number" placeholder="1234 5678 9012 3456" maxlength="19" oninput="this.value=this.value.replace(/[^0-9]/g,'').replace(/(.{4})/g,'$1 ').trim()">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;" class="form-group">
              <div>
                <label class="form-label">Expiry (MM/YY)</label>
                <input type="text" class="form-input" id="rm-card-expiry" placeholder="MM/YY" maxlength="5" oninput="formatExpiry(this)">
              </div>
              <div>
                <label class="form-label">CVV</label>
                <input type="text" class="form-input" id="rm-card-cvv" placeholder="123" maxlength="4" oninput="this.value=this.value.replace(/[^0-9]/g,'')">
              </div>
            </div>
            <div id="rm-payment-error" class="form-error hidden" style="margin-bottom:12px;"></div>
            <div style="display:flex;gap:10px;">
              <button class="btn btn-secondary" onclick="SubscriptionManager._backToSelect()">Back</button>
              <button class="btn btn-primary" style="flex:1;" onclick="SubscriptionManager._processPayment()">Pay &amp; Activate</button>
            </div>
          </div>

          <!-- Step 3: Processing -->
          <div id="rm-step-processing" class="hidden" style="text-align:center;padding:40px 0;">
            <div class="spinner" style="margin:0 auto 20px;"></div>
            <div style="font-size:16px;font-weight:600;">Processing payment...</div>
            <div style="font-size:13px;color:var(--muted);margin-top:6px;">Please wait</div>
          </div>

          <!-- Step 4: Success -->
          <div id="rm-step-success" class="hidden" style="text-align:center;padding:40px 0;">
            <div style="font-size:48px;margin-bottom:16px;">✅</div>
            <div style="font-size:20px;font-weight:800;margin-bottom:8px;">Payment Successful!</div>
            <div style="font-size:14px;color:var(--muted);" id="rm-success-msg">Your account has been recharged.</div>
          </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
  },

  hideRechargeModal() {
    const modal = document.getElementById('recharge-modal');
    if (modal) modal.remove();
  },

  _selectedPackId: null,

  _selectModalPack(packId, el) {
    this._selectedPackId = packId;
    document.querySelectorAll('#recharge-modal .recharge-pack-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    const btn = document.getElementById('rm-continue-btn');
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      btn.textContent = 'Continue to Payment →';
    }
  },

  _proceedToPayment() {
    if (!this._selectedPackId) return;
    const pack = this.RECHARGE_PACKS.find(p => p.id === this._selectedPackId);
    if (!pack) return;
    document.getElementById('rm-step-select').classList.add('hidden');
    document.getElementById('rm-step-payment').classList.remove('hidden');
    const summary = document.getElementById('rm-pack-summary');
    if (summary) {
      const price = typeof Currency !== 'undefined' ? Currency.format(pack.usdEquivalent) : '$' + pack.usdEquivalent;
      summary.innerHTML = `<span><strong>${pack.name}</strong> &mdash; +${pack.generations.toLocaleString()} generations, +${pack.durationDays} days</span><span style="font-weight:800;color:var(--accent);">${price}</span>`;
    }
  },

  _backToSelect() {
    document.getElementById('rm-step-payment').classList.add('hidden');
    document.getElementById('rm-step-select').classList.remove('hidden');
  },

  _processPayment() {
    const name = (document.getElementById('rm-card-name') || {}).value || '';
    const num  = (document.getElementById('rm-card-number') || {}).value || '';
    const exp  = (document.getElementById('rm-card-expiry') || {}).value || '';
    const cvv  = (document.getElementById('rm-card-cvv') || {}).value || '';
    const errEl = document.getElementById('rm-payment-error');

    if (!name.trim() || num.replace(/\s/g,'').length < 16 || exp.length < 5 || cvv.length < 3) {
      if (errEl) { errEl.textContent = 'Please fill in all card details correctly.'; errEl.classList.remove('hidden'); }
      return;
    }
    if (errEl) errEl.classList.add('hidden');

    document.getElementById('rm-step-payment').classList.add('hidden');
    document.getElementById('rm-step-processing').classList.remove('hidden');

    setTimeout(() => {
      const ok = this.applyRecharge(this._selectedPackId);
      document.getElementById('rm-step-processing').classList.add('hidden');
      document.getElementById('rm-step-success').classList.remove('hidden');
      const pack = this.RECHARGE_PACKS.find(p => p.id === this._selectedPackId);
      const msg = document.getElementById('rm-success-msg');
      if (msg && pack) msg.textContent = `+${pack.generations.toLocaleString()} generations added. Subscription extended by ${pack.durationDays} days.`;
      setTimeout(() => { this.hideRechargeModal(); window.location.reload(); }, 1800);
    }, 2000);
  }
};

// ---- Card expiry formatting helper ----
function formatExpiry(input) {
  let v = input.value.replace(/[^0-9]/g, '');
  if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2, 4);
  input.value = v;
}

// ---- Generation limit gate (used in tools.js) ----
function checkGenerationLimit() {
  // Subscription disabled — all tools are free to use
  return true;
}
