/* ============================================
   Maxhope.AI - Dashboard JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAuth()) return;

  // Init subscription (backfill if needed)
  if (typeof SubscriptionManager !== 'undefined') SubscriptionManager.init();

  const user = Auth.getUser();
  const usage = user.usage || { generations: 0, projects: 0 };
  const sub = user.subscription || null;

  // ---- Subscription Status Card ----
  renderSubscriptionCard();

  // Populate welcome
  const nameEl = document.getElementById('user-name');
  if (nameEl) nameEl.textContent = user.name.split(' ')[0];

  // Generations left in welcome banner
  const genLeft = document.getElementById('generations-left');
  if (genLeft) {
    if (sub && user.plan !== 'enterprise') {
      genLeft.textContent = Math.max(0, sub.generationsLimit - sub.generationsUsed).toLocaleString();
    } else if (user.plan === 'enterprise') {
      genLeft.textContent = 'unlimited';
    } else {
      genLeft.textContent = '100';
    }
  }

  // Populate stats
  const stats = {
    projects: usage.projects || 0,
    generations: usage.generations || 0,
    automations: Math.min(usage.generations || 0, 3),
    savings: '$' + ((usage.generations || 0) * 12)
  };

  animateCounter('stat-projects', stats.projects);
  animateCounter('stat-generations', stats.generations);
  animateCounter('stat-automations', stats.automations);
  document.getElementById('stat-savings').textContent = stats.savings;

  // Usage bar
  let genLimit = sub ? sub.generationsLimit : 100;
  let genUsed  = sub ? sub.generationsUsed  : (usage.generations || 0);
  if (user.plan === 'enterprise') genLimit = 99999;

  const usagePercent = genLimit >= 99999 ? 5 : Math.min(100, (genUsed / genLimit) * 100);
  const usageText = document.getElementById('usage-text');
  const usageFill = document.getElementById('usage-fill');
  const usageNote = document.querySelector('[style*="Upgrade to Pro"]') || document.querySelector('.usage-bar + p');

  if (usageText) {
    usageText.textContent = user.plan === 'enterprise'
      ? `${genUsed.toLocaleString()} / ∞`
      : `${genUsed.toLocaleString()} / ${genLimit.toLocaleString()}`;
  }
  if (usageFill) setTimeout(() => usageFill.style.width = usagePercent + '%', 200);

  // Update usage note based on plan
  const usageNoteEl = document.getElementById('usage-note');
  if (usageNoteEl) {
    if (user.plan === 'enterprise') {
      usageNoteEl.textContent = 'Unlimited generations — Enterprise plan';
    } else if (user.plan === 'pro') {
      usageNoteEl.innerHTML = `<a href="recharge.html" style="color:var(--accent);">Recharge</a> for more generations`;
    } else {
      usageNoteEl.innerHTML = `Upgrade or <a href="recharge.html" style="color:var(--accent);">recharge</a> for more generations`;
    }
  }

  // Simulated recent activity
  const activities = [
    { text: 'Generated a landing page with Website Builder', color: 'var(--blue)', time: '2h ago' },
    { text: 'Created an email outreach sequence', color: 'var(--gold)', time: '5h ago' },
    { text: 'Deployed AI chatbot for client site', color: 'var(--green)', time: '1d ago' },
    { text: 'Analyzed cloud infrastructure costs', color: 'var(--blue)', time: '2d ago' },
    { text: 'Generated 15 blog posts with Content Studio', color: 'var(--green)', time: '3d ago' },
  ];

  if (usage.generations > 0) {
    const activityList = document.getElementById('activity-list');
    if (activityList) {
      activityList.innerHTML = activities.slice(0, 3).map(a => `
        <div class="activity-item">
          <div class="activity-dot" style="background:${a.color}"></div>
          <div class="activity-text">${a.text}</div>
          <div class="activity-time">${a.time}</div>
        </div>
      `).join('');
    }
  }
});

// ---- Render Subscription Status Card ----
function renderSubscriptionCard() {
  const container = document.getElementById('subscription-card-container');
  if (!container) return;
  if (typeof SubscriptionManager === 'undefined') return;

  const summary = SubscriptionManager.getDashboardSummary();
  if (!summary) return;

  const gensDisplay = summary.isEnterprise ? 'Unlimited' : `${Number(summary.gensLeft).toLocaleString()} left`;
  const usedDisplay = summary.isEnterprise ? '' : ` of ${Number(summary.generationsLimit).toLocaleString()}`;

  container.innerHTML = `
    <div class="subscription-status-card ${summary.badgeClass === 'active' ? '' : summary.badgeClass}">
      <div class="sub-status-left">
        <div class="sub-status-icon">&#128179;</div>
        <div>
          <div class="sub-status-plan">${summary.planLabel} Plan</div>
          <div class="sub-status-expiry">
            ${summary.badgeClass === 'expired'
              ? 'Subscription expired'
              : `Expires ${summary.expiryDate} &mdash; ${summary.daysLeft} day${summary.daysLeft !== 1 ? 's' : ''} left`}
          </div>
        </div>
        <span class="sub-status-badge ${summary.badgeClass}">
          ${summary.badgeClass === 'active' ? 'Active' : summary.badgeClass === 'warning' ? 'Expiring Soon' : 'Expired'}
        </span>
      </div>
      <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;">
        <div class="sub-status-gens">
          <strong>${gensDisplay}</strong>${usedDisplay ? ` <span style="color:var(--dim);">${usedDisplay}</span>` : ''}
        </div>
        <a href="recharge.html" class="btn btn-primary btn-sm">Recharge</a>
      </div>
    </div>`;
}

function animateCounter(id, target) {
  const el = document.getElementById(id);
  if (!el || target === 0) { if (el) el.textContent = target; return; }
  let current = 0;
  const step = Math.max(1, Math.floor(target / 30));
  const interval = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(interval);
    }
    el.textContent = current;
  }, 30);
}
