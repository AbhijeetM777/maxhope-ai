/* ============================================
   Maxhope.AI - Shared Application JavaScript
   ============================================ */

// ---- Auth Manager ----
const Auth = {
  getUser() {
    const data = localStorage.getItem('nexusai_user');
    return data ? JSON.parse(data) : null;
  },
  isLoggedIn() {
    return !!this.getUser();
  },
  login(email, password) {
    const users = JSON.parse(localStorage.getItem('nexusai_users') || '[]');
    const user = users.find(u => u.email === email);
    if (!user) return { success: false, error: 'No account found with this email.' };
    if (user.password !== password) return { success: false, error: 'Incorrect password.' };
    localStorage.setItem('nexusai_user', JSON.stringify(user));
    return { success: true, user };
  },
  signup(data) {
    const users = JSON.parse(localStorage.getItem('nexusai_users') || '[]');
    if (users.find(u => u.email === data.email)) {
      return { success: false, error: 'An account with this email already exists.' };
    }
    const planDefaults = { starter: { generations: 100, days: 7 }, pro: { generations: 5000, days: 30 }, enterprise: { generations: 99999, days: 30 } };
    const plan = data.plan || 'starter';
    const pd = planDefaults[plan] || planDefaults.starter;
    const joinDate = new Date().toISOString();
    const expiresAt = new Date(Date.now() + pd.days * 86400000).toISOString();
    const user = {
      id: Date.now().toString(36),
      name: data.name,
      email: data.email,
      password: data.password,
      plan,
      joinDate,
      usage: { generations: 0, projects: 0 },
      subscription: {
        status: 'active',
        expiresAt,
        generationsLimit: pd.generations,
        generationsUsed: 0,
        lastRecharged: null,
        rechargeHistory: []
      }
    };
    users.push(user);
    localStorage.setItem('nexusai_users', JSON.stringify(users));
    localStorage.setItem('nexusai_user', JSON.stringify(user));
    return { success: true, user };
  },
  logout() {
    localStorage.removeItem('nexusai_user');
    window.location.href = getBasePath() + 'index.html';
  },
  updateUsage(key, amount = 1) {
    const user = this.getUser();
    if (user) {
      user.usage[key] = (user.usage[key] || 0) + amount;
      localStorage.setItem('nexusai_user', JSON.stringify(user));
    }
  },
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = getBasePath() + 'login.html';
      return false;
    }
    return true;
  }
};

// ---- Currency Manager ----
const Currency = {
  currencies: [
    { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', rate: 1 },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', rate: 83.5 },
    { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', rate: 0.92 },
    { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', rate: 0.79 },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', rate: 1.53 },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦', rate: 1.36 },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪', rate: 3.67 },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬', rate: 1.34 },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', rate: 149.5 },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷', rate: 4.97 },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦', rate: 18.6 },
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬', rate: 1550 },
  ],
  get() {
    const saved = localStorage.getItem('nexusai_currency');
    return this.currencies.find(c => c.code === saved) || this.currencies[0];
  },
  set(code) {
    localStorage.setItem('nexusai_currency', code);
    this.applyToPage();
  },
  convert(usdAmount) {
    const cur = this.get();
    return Math.round(usdAmount * cur.rate);
  },
  format(usdAmount) {
    const cur = this.get();
    const converted = this.convert(usdAmount);
    if (cur.code === 'JPY' || cur.code === 'NGN') {
      return cur.symbol + converted.toLocaleString();
    }
    return cur.symbol + converted.toLocaleString();
  },
  applyToPage() {
    const cur = this.get();
    // Update all elements with data-usd attribute
    document.querySelectorAll('[data-usd]').forEach(el => {
      if (el.dataset.usdMonthly) return; // skip combo elements
      const usd = parseFloat(el.dataset.usd);
      const suffix = el.textContent.includes('/mo') ? '/mo' : (el.textContent.includes('/yr') ? '/yr' : '');
      el.textContent = this.format(usd) + suffix;
    });
    // Update annual prices too
    document.querySelectorAll('[data-usd-annual]').forEach(el => {
      const usd = parseFloat(el.dataset.usdAnnual);
      el.dataset.annual = this.format(usd);
    });
    document.querySelectorAll('[data-usd-monthly]').forEach(el => {
      const usd = parseFloat(el.dataset.usdMonthly);
      el.dataset.monthly = this.format(usd);
      // If toggle is not annual, update display
      const toggle = document.getElementById('pricing-toggle');
      const isAnnual = toggle && toggle.classList.contains('active');
      if (!isAnnual) el.textContent = this.format(usd);
    });
    // Update currency selector display
    document.querySelectorAll('.currency-current').forEach(el => {
      el.innerHTML = `${cur.flag} ${cur.code}`;
    });
  }
};

// ---- Path Helpers ----
function getBasePath() {
  const path = window.location.pathname;
  if (path.includes('/tools/')) return '../';
  return '';
}

// ---- Toast Notifications ----
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = '0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ---- Navbar Injection (Public Pages) ----
function renderPublicNav() {
  const nav = document.getElementById('nav-container');
  if (!nav) return;
  const base = getBasePath();
  const loggedIn = Auth.isLoggedIn();
  nav.innerHTML = `
    <nav class="navbar" id="navbar">
      <div class="container flex-between">
        <a href="${base}index.html" class="nav-logo">Maxhope<span>.AI</span></a>
        <div class="nav-links" id="nav-links">
          <a href="${base}index.html#features">Features</a>
          <a href="${base}index.html#tools">Tools</a>
          <a href="${base}pricing.html">Pricing</a>
          <a href="${base}index.html#testimonials">Testimonials</a>
        </div>
        <div class="nav-actions">
          <div class="currency-selector">
            <button class="currency-btn" onclick="toggleCurrencyDropdown(this)">
              <span class="currency-current">${Currency.get().flag} ${Currency.get().code}</span>
              <span style="font-size:10px;color:var(--dim);">&#9660;</span>
            </button>
            <div class="currency-dropdown">
              ${Currency.currencies.map(c => `
                <div class="currency-option ${c.code === Currency.get().code ? 'active' : ''}" onclick="selectCurrency('${c.code}')">
                  <span>${c.flag}</span>
                  <span class="currency-option-code">${c.code}</span>
                  <span class="currency-option-name">${c.name}</span>
                </div>
              `).join('')}
            </div>
          </div>
          ${loggedIn
            ? `<a href="${base}dashboard.html" class="btn btn-primary btn-sm">Dashboard</a>`
            : `<a href="${base}login.html">Login</a>
               <a href="${base}signup.html" class="btn btn-primary btn-sm">Start Free Trial</a>`
          }
        </div>
        <div class="hamburger" id="hamburger" onclick="toggleMobileNav()">
          <span></span><span></span><span></span>
        </div>
      </div>
    </nav>`;

  // Scroll listener
  window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 20);
  });
}

function toggleMobileNav() {
  const links = document.getElementById('nav-links');
  if (links) links.classList.toggle('open');
}

// ---- Footer Injection ----
function renderFooter() {
  const footer = document.getElementById('footer-container');
  if (!footer) return;
  const base = getBasePath();
  footer.innerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <div class="nav-logo" style="font-size:22px;">Maxhope<span>.AI</span></div>
            <p>The all-in-one AI platform for building, automating, and scaling your business. 7 powerful tools, one subscription.</p>
          </div>
          <div class="footer-col">
            <h5>Product</h5>
            <a href="${base}index.html#features">Features</a>
            <a href="${base}pricing.html">Pricing</a>
            <a href="${base}index.html#tools">All Tools</a>
            <a href="#">API Docs</a>
          </div>
          <div class="footer-col">
            <h5>Company</h5>
            <a href="#">About</a>
            <a href="#">Blog</a>
            <a href="#">Careers</a>
            <a href="#">Contact</a>
          </div>
          <div class="footer-col">
            <h5>Legal</h5>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
        <div class="footer-bottom">
          <span>&copy; 2026 Maxhope.AI. All rights reserved.</span>
          <div class="flex gap-md">
            <a href="#">Twitter</a>
            <a href="#">LinkedIn</a>
            <a href="#">GitHub</a>
          </div>
        </div>
      </div>
    </footer>`;
}

// ---- Sidebar Injection (Dashboard/Tool Pages) ----
function renderSidebar() {
  const sidebar = document.getElementById('sidebar-container');
  if (!sidebar) return;
  const user = Auth.getUser();
  if (!user) return;
  const base = getBasePath();
  const currentPage = window.location.pathname.split('/').pop();
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const tools = [
    { name: 'Automation Builder', href: `${base}tools/automation.html`, color: 'var(--gold)', file: 'automation.html' },
    { name: 'Website Builder', href: `${base}tools/website-builder.html`, color: 'var(--blue)', file: 'website-builder.html' },
    { name: 'Chatbot Creator', href: `${base}tools/chatbot.html`, color: 'var(--green)', file: 'chatbot.html' },
    { name: 'Micro-SaaS Generator', href: `${base}tools/microsaas.html`, color: 'var(--purple)', file: 'microsaas.html' },
    { name: 'Email & Outreach', href: `${base}tools/email-outreach.html`, color: 'var(--gold)', file: 'email-outreach.html' },
    { name: 'Cloud Consulting', href: `${base}tools/cloud-consulting.html`, color: 'var(--blue)', file: 'cloud-consulting.html' },
    { name: 'Content Studio', href: `${base}tools/content-studio.html`, color: 'var(--green)', file: 'content-studio.html' },
  ];

  sidebar.innerHTML = `
    <div class="sidebar-overlay" id="sidebar-overlay" onclick="toggleSidebar()"></div>
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo"><a href="${base}dashboard.html">Maxhope<span>.AI</span></a></div>
      <nav class="sidebar-nav">
        <div class="sidebar-section">
          <div class="sidebar-section-title">Main</div>
          <a href="${base}dashboard.html" class="sidebar-link ${currentPage === 'dashboard.html' ? 'active' : ''}">
            <span class="link-icon">&#9638;</span> Dashboard
          </a>
          <a href="${base}projects.html" class="sidebar-link ${currentPage === 'projects.html' ? 'active' : ''}">
            <span class="link-icon">&#128193;</span> My Projects
          </a>
          <a href="#" class="sidebar-link">
            <span class="link-icon">&#9881;</span> Settings
          </a>
          <a href="${base}recharge.html" class="sidebar-link ${currentPage === 'recharge.html' ? 'active' : ''}">
            <span class="link-icon">&#128179;</span> Billing
          </a>
        </div>
        <div class="sidebar-section">
          <div class="sidebar-section-title">AI Tools</div>
          ${tools.map(t => `
            <a href="${t.href}" class="sidebar-link ${currentPage === t.file ? 'active' : ''}">
              <span class="link-dot" style="background:${t.color}"></span> ${t.name}
            </a>
          `).join('')}
        </div>
      </nav>
      <div class="sidebar-user">
        <div class="sidebar-avatar">${initials}</div>
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">${user.name}</div>
          <div class="sidebar-user-plan">${user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Plan</div>
        </div>
        <button onclick="Auth.logout()" title="Logout" style="font-size:18px;color:var(--dim);margin-left:auto;">&#x23FB;</button>
      </div>
    </aside>`;
}

function renderDashTopbar() {
  const topbar = document.getElementById('topbar-container');
  if (!topbar) return;
  topbar.innerHTML = `
    <div class="dash-topbar">
      <div class="flex gap-md" style="align-items:center;">
        <button class="sidebar-toggle" onclick="toggleSidebar()">&#9776;</button>
        <div class="dash-search">
          <span style="color:var(--dim);">&#128269;</span>
          <input type="text" placeholder="Search tools..." />
        </div>
      </div>
      <div class="dash-topbar-actions">
        <div class="currency-selector">
          <button class="currency-btn" onclick="toggleCurrencyDropdown(this)">
            <span class="currency-current">${Currency.get().flag} ${Currency.get().code}</span>
            <span style="font-size:10px;color:var(--dim);">&#9660;</span>
          </button>
          <div class="currency-dropdown">
            ${Currency.currencies.map(c => `
              <div class="currency-option ${c.code === Currency.get().code ? 'active' : ''}" onclick="selectCurrency('${c.code}')">
                <span>${c.flag}</span>
                <span class="currency-option-code">${c.code}</span>
                <span class="currency-option-name">${c.name}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <button class="icon-btn" title="Notifications">&#128276;</button>
        <button class="icon-btn" onclick="Auth.logout()" title="Logout">&#x23FB;</button>
      </div>
    </div>`;
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('active');
}

// ---- Currency Dropdown ----
function toggleCurrencyDropdown(btn) {
  const dropdown = btn.nextElementSibling;
  const isOpen = dropdown.classList.contains('open');
  // Close all dropdowns first
  document.querySelectorAll('.currency-dropdown.open').forEach(d => d.classList.remove('open'));
  if (!isOpen) dropdown.classList.add('open');
}

function selectCurrency(code) {
  Currency.set(code);
  // Update all dropdowns
  document.querySelectorAll('.currency-dropdown').forEach(d => {
    d.classList.remove('open');
    d.querySelectorAll('.currency-option').forEach(opt => {
      opt.classList.toggle('active', opt.querySelector('.currency-option-code').textContent === code);
    });
  });
}

// Close currency dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.currency-selector')) {
    document.querySelectorAll('.currency-dropdown.open').forEach(d => d.classList.remove('open'));
  }
});

// ---- Scroll Animations ----
function initScrollAnimations() {
  const elements = document.querySelectorAll('.animate-on-scroll');
  if (!elements.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  elements.forEach(el => observer.observe(el));
}

// ---- Smooth Scroll for Anchor Links ----
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Close mobile nav
        const links = document.getElementById('nav-links');
        if (links) links.classList.remove('open');
      }
    });
  });
}

// ---- FAQ Accordion ----
function initFAQ() {
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });
}

// ---- Pricing Toggle ----
function initPricingToggle() {
  const toggle = document.getElementById('pricing-toggle');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    const isAnnual = toggle.classList.contains('active');
    document.querySelectorAll('[data-monthly]').forEach(el => {
      el.textContent = isAnnual ? el.dataset.annual : el.dataset.monthly;
    });
    document.querySelectorAll('.price-period').forEach(el => {
      el.textContent = isAnnual ? '/yr' : '/mo';
    });
    document.querySelectorAll('.toggle-label').forEach((label, i) => {
      label.classList.toggle('active', i === (isAnnual ? 1 : 0));
    });
  });
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  if (typeof SubscriptionManager !== 'undefined') SubscriptionManager.init();
  renderPublicNav();
  renderFooter();
  renderSidebar();
  renderDashTopbar();
  initScrollAnimations();
  initSmoothScroll();
  initFAQ();
  initPricingToggle();
  // Apply currency to all prices on page
  setTimeout(() => Currency.applyToPage(), 100);
});
