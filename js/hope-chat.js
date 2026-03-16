/* ============================================
   Hope — Maxhope.AI Support Chatbot
   Floating chat widget for user support
   ============================================ */

const HopeChat = {
  isOpen: false,
  messages: [],
  typingSpeed: 30,

  // Knowledge base
  kb: {
    greetings: ['hi', 'hello', 'hey', 'help', 'support', 'yo', 'hola'],
    topics: {
      pricing: {
        keywords: ['pricing', 'price', 'cost', 'plan', 'subscription', 'free', 'pro', 'enterprise', 'how much', 'pay', 'rupee', 'inr', 'dollar', 'usd', 'billing', 'recharge', 'charge'],
        response: `We have 3 plans:\n\n🟢 **Starter** — Free for 7 days. 2 tools, 100 AI generations.\n🔴 **Pro** — ₹999/mo. All 7 tools, 5,000 generations, API access.\n🟣 **Enterprise** — ₹4,999/mo. Unlimited everything + dedicated support.\n\nAll plans start with a free trial. No credit card needed!\n\n👉 [View Pricing](/pricing.html)`
      },
      tools: {
        keywords: ['tools', 'tool', 'what can', 'features', 'automation', 'website builder', 'chatbot', 'email', 'cloud', 'content', 'saas', 'microsaas', 'what do you offer'],
        response: `We have **7 AI tools**:\n\n⚡ **Automation Builder** — Workflows, CRM, WhatsApp bots\n🌐 **Website Builder** — AI-generated sites & landing pages\n🤖 **Chatbot Creator** — Support & sales bots for WhatsApp\n📈 **Micro-SaaS Generator** — Full SaaS blueprints\n📧 **Email & Outreach** — AI-powered campaigns\n☁️ **Cloud Consulting** — Cost optimization\n✍️ **Content Studio** — Blog, social, SEO content\n\nAll tools work together and deploy in seconds!`
      },
      account: {
        keywords: ['account', 'sign up', 'signup', 'register', 'login', 'log in', 'password', 'forgot', 'reset', 'can\'t login', 'cant login'],
        response: `**Account help:**\n\n📝 **Sign up** — [Create account here](/signup.html). Takes 30 seconds.\n🔑 **Login** — [Go to login](/login.html)\n🔄 **Forgot password** — Use the reset link on the login page.\n\nIf you're still stuck, describe your issue and I'll help!`
      },
      deploy: {
        keywords: ['deploy', 'deployment', 'live', 'publish', 'launch', 'how to deploy', 'where is my project', 'project', 'webhook', 'api endpoint'],
        response: `**Deploying is easy:**\n\n1. Generate your output using any tool\n2. Click the **Deploy** button\n3. You'll get a deployment modal with:\n   • Webhook URL\n   • API endpoint\n   • Integration details\n   • Embed code (for chatbots/widgets)\n\nAll deployments are saved in **My Projects** (sidebar → My Projects). You can view, manage, and delete them anytime.`
      },
      integrations: {
        keywords: ['integration', 'integrate', 'connect', 'whatsapp', 'razorpay', 'zoho', 'google sheets', 'shopify', 'slack', 'gmail', 'zapier', 'api'],
        response: `We integrate with the tools you already use:\n\n💬 **WhatsApp** — Business API for bots & notifications\n💳 **Razorpay** — Payment collection\n📋 **Zoho CRM** — Sales pipeline sync\n📊 **Google Sheets** — Data sync\n🛒 **Shopify India** — E-commerce\n📧 **Gmail** — Email automation\n💻 **Slack** — Team notifications\n🛠 **Zapier** — 1000+ app connections\n\nMore integrations coming soon!`
      },
      billing: {
        keywords: ['bill', 'invoice', 'refund', 'cancel', 'cancellation', 'downgrade', 'upgrade', 'recharge pack', 'generation', 'limit', 'ran out'],
        response: `**Billing & Generations:**\n\n📊 Check your usage on the **Dashboard**\n💰 Buy more generations via **Billing** (sidebar → Billing)\n📦 Recharge packs: ₹1,000 / ₹2,500 / ₹5,000\n\n**Need to cancel?** Go to Settings. No lock-in, cancel anytime.\n**Need a refund?** Contact us at support@maxhope.ai within 7 days.`
      },
      security: {
        keywords: ['security', 'secure', 'data', 'privacy', 'safe', 'encryption', 'soc', 'gdpr', 'india data'],
        response: `**Your data is safe with us:**\n\n🔒 **SOC 2 Compliant** — Enterprise-grade security\n🇮🇳 **India Data Residency** — Your data stays in India\n🛡 **End-to-End Encryption** — All data encrypted in transit & at rest\n✅ **GDPR Ready** — Full compliance\n\nWe never sell your data. Period.`
      },
      bug: {
        keywords: ['bug', 'error', 'broken', 'not working', 'issue', 'problem', 'crash', 'glitch', 'stuck', 'loading', 'blank', 'white screen'],
        response: `Sorry you're running into issues! Let's fix it:\n\n1. **Try refreshing** the page (Ctrl+R)\n2. **Clear cache** (Ctrl+Shift+Delete)\n3. **Try another browser** (Chrome works best)\n\nIf it's still broken, tell me:\n• What page are you on?\n• What were you trying to do?\n• Any error messages?\n\nI'll pass it to our team!`
      },
      contact: {
        keywords: ['contact', 'email', 'phone', 'reach', 'human', 'agent', 'real person', 'talk to someone', 'support team'],
        response: `**Get in touch:**\n\n📧 Email: **support@maxhope.ai**\n💬 WhatsApp: **+91 98765 43210**\n🐦 Twitter: **@maxhopeai**\n\nOur team responds within 2 hours during business hours (9 AM - 9 PM IST).\n\nOr just describe your issue here — I'll do my best to help!`
      },
      telegram: {
        keywords: ['telegram', 'bot', 'remote', 'remote control', 'manage from phone'],
        response: `**Telegram Remote Control:**\n\nYou can manage your entire project from Telegram! Our bot lets you:\n\n📊 Check project status\n🚀 Deploy changes live\n📝 Edit files remotely\n💾 Create backups\n📄 Read project files\n\nSet it up in the **/telegram-bot** folder. Just need a BotFather token!`
      }
    }
  },

  init() {
    this.injectStyles();
    this.injectWidget();
    this.bindEvents();
  },

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .hope-fab {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: var(--accent, #e8373a);
        color: #fff;
        border: none;
        cursor: pointer;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        box-shadow: 0 4px 20px rgba(232, 55, 58, 0.4);
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .hope-fab:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 30px rgba(232, 55, 58, 0.5);
      }
      .hope-fab.open {
        transform: rotate(45deg) scale(1);
        background: #333;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      }
      .hope-fab-badge {
        position: absolute;
        top: -2px;
        right: -2px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #4caf7d;
        border: 2px solid var(--bg, #0a0a0a);
        animation: hope-pulse 2s ease-in-out infinite;
      }
      @keyframes hope-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
      }
      .hope-window {
        position: fixed;
        bottom: 100px;
        right: 24px;
        width: 380px;
        max-height: 520px;
        background: #111111;
        border: 1px solid #1f1f1f;
        border-radius: 20px;
        z-index: 9998;
        display: none;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 12px 48px rgba(0,0,0,0.5);
        animation: hope-slide-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .hope-window.visible { display: flex; }
      @keyframes hope-slide-up {
        from { opacity: 0; transform: translateY(20px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .hope-header {
        background: #161616;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 12px;
        border-bottom: 1px solid #1f1f1f;
      }
      .hope-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: linear-gradient(135deg, #e8373a, #ff5c5f);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: #fff;
        font-weight: 700;
        flex-shrink: 0;
      }
      .hope-header-info h4 {
        font-family: 'Syne', sans-serif;
        font-size: 0.85rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #f5f0eb;
        margin: 0;
        line-height: 1.3;
      }
      .hope-header-info p {
        font-family: 'DM Sans', sans-serif;
        font-size: 0.7rem;
        color: #4caf7d;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .hope-header-info p::before {
        content: '';
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #4caf7d;
      }
      .hope-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-height: 280px;
        max-height: 320px;
        scrollbar-width: thin;
        scrollbar-color: #333 transparent;
      }
      .hope-msg {
        max-width: 85%;
        padding: 10px 14px;
        border-radius: 16px;
        font-family: 'DM Sans', sans-serif;
        font-size: 0.82rem;
        line-height: 1.5;
        color: #f5f0eb;
        animation: hope-msg-in 0.25s ease;
        word-wrap: break-word;
      }
      @keyframes hope-msg-in {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .hope-msg.bot {
        background: #1a1a1a;
        border: 1px solid #222;
        align-self: flex-start;
        border-bottom-left-radius: 4px;
      }
      .hope-msg.user {
        background: #e8373a;
        color: #fff;
        align-self: flex-end;
        border-bottom-right-radius: 4px;
      }
      .hope-msg a {
        color: #ff5c5f;
        text-decoration: underline;
      }
      .hope-msg.user a {
        color: #ffd;
      }
      .hope-msg strong { font-weight: 600; }
      .hope-typing {
        display: flex;
        gap: 4px;
        padding: 10px 14px;
        align-self: flex-start;
      }
      .hope-typing-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #555;
        animation: hope-typing-bounce 1.4s infinite;
      }
      .hope-typing-dot:nth-child(2) { animation-delay: 0.2s; }
      .hope-typing-dot:nth-child(3) { animation-delay: 0.4s; }
      @keyframes hope-typing-bounce {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-6px); }
      }
      .hope-quick-replies {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 0 16px 8px;
      }
      .hope-quick-btn {
        background: #1a1a1a;
        border: 1px solid #2a2a2a;
        border-radius: 20px;
        padding: 6px 14px;
        font-family: 'DM Sans', sans-serif;
        font-size: 0.7rem;
        color: #c8c2b8;
        cursor: pointer;
        transition: all 0.2s;
      }
      .hope-quick-btn:hover {
        border-color: #e8373a;
        color: #e8373a;
        background: rgba(232,55,58,0.08);
      }
      .hope-input-area {
        padding: 12px 16px;
        border-top: 1px solid #1f1f1f;
        display: flex;
        gap: 8px;
        background: #111;
      }
      .hope-input {
        flex: 1;
        background: #1a1a1a;
        border: 1px solid #2a2a2a;
        border-radius: 24px;
        padding: 10px 16px;
        font-family: 'DM Sans', sans-serif;
        font-size: 0.82rem;
        color: #f5f0eb;
        outline: none;
        transition: border-color 0.2s;
      }
      .hope-input::placeholder { color: #555; }
      .hope-input:focus { border-color: #e8373a; }
      .hope-send {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #e8373a;
        border: none;
        color: #fff;
        font-size: 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
      }
      .hope-send:hover { background: #c62d30; transform: scale(1.05); }
      @media (max-width: 480px) {
        .hope-window {
          right: 8px;
          left: 8px;
          width: auto;
          bottom: 90px;
          max-height: 70vh;
        }
      }
    `;
    document.head.appendChild(style);
  },

  injectWidget() {
    // FAB button
    const fab = document.createElement('button');
    fab.className = 'hope-fab';
    fab.id = 'hope-fab';
    fab.innerHTML = '💬<div class="hope-fab-badge"></div>';
    fab.title = 'Chat with Hope';
    document.body.appendChild(fab);

    // Chat window
    const win = document.createElement('div');
    win.className = 'hope-window';
    win.id = 'hope-window';
    win.innerHTML = `
      <div class="hope-header">
        <div class="hope-avatar">H</div>
        <div class="hope-header-info">
          <h4>Hope</h4>
          <p>Online — ready to help</p>
        </div>
      </div>
      <div class="hope-messages" id="hope-messages"></div>
      <div class="hope-quick-replies" id="hope-quick-replies"></div>
      <div class="hope-input-area">
        <input type="text" class="hope-input" id="hope-input" placeholder="Ask Hope anything..." autocomplete="off" />
        <button class="hope-send" id="hope-send">&#10148;</button>
      </div>
    `;
    document.body.appendChild(win);
  },

  bindEvents() {
    document.getElementById('hope-fab').addEventListener('click', () => this.toggle());
    document.getElementById('hope-send').addEventListener('click', () => this.sendUserMessage());
    document.getElementById('hope-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendUserMessage();
    });

    // Show welcome after 3 seconds
    setTimeout(() => {
      if (!this.isOpen && this.messages.length === 0) {
        // Subtle bounce to draw attention
        const fab = document.getElementById('hope-fab');
        fab.style.animation = 'hope-bounce 0.5s ease';
        setTimeout(() => fab.style.animation = '', 500);
      }
    }, 3000);
  },

  toggle() {
    this.isOpen = !this.isOpen;
    const win = document.getElementById('hope-window');
    const fab = document.getElementById('hope-fab');

    if (this.isOpen) {
      win.classList.add('visible');
      fab.classList.add('open');
      fab.innerHTML = '✕';
      const badge = fab.querySelector('.hope-fab-badge');
      if (badge) badge.remove();

      if (this.messages.length === 0) {
        this.showWelcome();
      }
      document.getElementById('hope-input').focus();
    } else {
      win.classList.remove('visible');
      fab.classList.remove('open');
      fab.innerHTML = '💬';
    }
  },

  showWelcome() {
    const user = (() => {
      try {
        const u = JSON.parse(localStorage.getItem('nexusai_user'));
        return u ? u.name || u.email.split('@')[0] : null;
      } catch { return null; }
    })();

    const greeting = user ? `Hey ${user}! 👋` : 'Hey there! 👋';

    this.addBotMessage(`${greeting} I'm **Hope**, your Maxhope.AI assistant.\n\nI can help you with pricing, tools, account issues, deployments, integrations, and more.\n\nWhat do you need help with?`);

    this.showQuickReplies([
      'What tools do you offer?',
      'Show me pricing',
      'How do I deploy?',
      'Integration options',
      'I have an issue'
    ]);
  },

  showQuickReplies(replies) {
    const container = document.getElementById('hope-quick-replies');
    container.innerHTML = replies.map(r =>
      `<button class="hope-quick-btn" onclick="HopeChat.handleQuickReply('${r.replace(/'/g, "\\'")}')">${r}</button>`
    ).join('');
  },

  clearQuickReplies() {
    document.getElementById('hope-quick-replies').innerHTML = '';
  },

  handleQuickReply(text) {
    this.clearQuickReplies();
    this.addUserMessage(text);
    this.processMessage(text);
  },

  sendUserMessage() {
    const input = document.getElementById('hope-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    this.clearQuickReplies();
    this.addUserMessage(text);
    this.processMessage(text);
  },

  addUserMessage(text) {
    this.messages.push({ role: 'user', text });
    const container = document.getElementById('hope-messages');
    const msg = document.createElement('div');
    msg.className = 'hope-msg user';
    msg.textContent = text;
    container.appendChild(msg);
    this.scrollToBottom();
  },

  addBotMessage(text) {
    this.messages.push({ role: 'bot', text });
    const container = document.getElementById('hope-messages');

    // Show typing indicator
    const typing = document.createElement('div');
    typing.className = 'hope-typing';
    typing.id = 'hope-typing';
    typing.innerHTML = '<div class="hope-typing-dot"></div><div class="hope-typing-dot"></div><div class="hope-typing-dot"></div>';
    container.appendChild(typing);
    this.scrollToBottom();

    // Replace with actual message after delay
    const delay = Math.min(text.length * 8, 1500);
    setTimeout(() => {
      typing.remove();
      const msg = document.createElement('div');
      msg.className = 'hope-msg bot';
      msg.innerHTML = this.formatMarkdown(text);
      container.appendChild(msg);
      this.scrollToBottom();
    }, delay);
  },

  formatMarkdown(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
      .replace(/\n/g, '<br>');
  },

  scrollToBottom() {
    const container = document.getElementById('hope-messages');
    setTimeout(() => { container.scrollTop = container.scrollHeight; }, 50);
  },

  processMessage(text) {
    const lower = text.toLowerCase();

    // Check greetings
    if (this.kb.greetings.some(g => lower === g || lower === g + '!')) {
      this.addBotMessage("Hey! 😊 How can I help you today? Ask me about pricing, tools, deployments, or anything else!");
      this.showQuickReplies(['Pricing', 'Tools overview', 'How to deploy', 'Contact support']);
      return;
    }

    // Check knowledge base topics
    for (const [topic, data] of Object.entries(this.kb.topics)) {
      if (data.keywords.some(kw => lower.includes(kw))) {
        this.addBotMessage(data.response);

        // Suggest related topics
        const followUps = this.getFollowUps(topic);
        if (followUps.length) {
          setTimeout(() => this.showQuickReplies(followUps), data.response.length * 8 + 200);
        }
        return;
      }
    }

    // Thank you
    if (/\b(thank|thanks|thx|ty|cheers)\b/.test(lower)) {
      this.addBotMessage("You're welcome! 😊 Anything else I can help with?");
      this.showQuickReplies(['No, all good!', 'Actually, one more thing...']);
      return;
    }

    // Bye
    if (/\b(bye|goodbye|see ya|later|done|no thanks|all good)\b/.test(lower)) {
      this.addBotMessage("Great chatting with you! If you need anything, I'm always here. Have a great day! ✌️");
      return;
    }

    // Fallback
    this.addBotMessage(`I'm not sure I understand that fully, but I want to help!\n\nHere are some things I can assist with:`);
    setTimeout(() => {
      this.showQuickReplies([
        'Pricing & plans',
        'Tool features',
        'Account help',
        'Deployment help',
        'Report a bug',
        'Talk to a human'
      ]);
    }, 800);
  },

  getFollowUps(currentTopic) {
    const map = {
      pricing: ['How do I sign up?', 'What tools are included?', 'Billing help'],
      tools: ['Show me pricing', 'How do I deploy?', 'Integration options'],
      account: ['Pricing & plans', 'I have a bug'],
      deploy: ['My Projects page', 'Integration options'],
      integrations: ['How do I deploy?', 'Pricing & plans'],
      billing: ['Pricing & plans', 'Contact support'],
      security: ['Pricing & plans', 'Contact support'],
      bug: ['Contact support', 'Other question'],
      contact: ['Pricing', 'Tools overview'],
      telegram: ['How do I deploy?', 'Contact support']
    };
    return map[currentTopic] || ['Pricing', 'Tools', 'Contact support'];
  }
};

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => HopeChat.init());
} else {
  HopeChat.init();
}
