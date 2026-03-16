/* ============================================
   Maxhope.AI - Tool Simulation Engine
   ============================================ */

// ---- Project Manager (saves deployments to localStorage) ----
const ProjectManager = {
  _key: 'nexusai_projects',

  getAll() {
    return JSON.parse(localStorage.getItem(this._key) || '[]');
  },

  save(project) {
    const projects = this.getAll();
    project.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    project.createdAt = new Date().toISOString();
    project.status = 'deployed';
    projects.unshift(project);
    localStorage.setItem(this._key, JSON.stringify(projects));
    // Update user project count
    Auth.updateUsage('projects');
    return project;
  },

  remove(id) {
    const projects = this.getAll().filter(p => p.id !== id);
    localStorage.setItem(this._key, JSON.stringify(projects));
  },

  // Show deployment success modal with details
  showDeployModal(project) {
    const existing = document.getElementById('deploy-success-modal');
    if (existing) existing.remove();

    const base = typeof getBasePath === 'function' ? getBasePath() : '';
    const siteBase = 'https://abhijeetm777.github.io/maxhope-ai';
    const liveUrl = `${siteBase}/tools/${project.type}.html?project=${project.id}`;
    const embedCode = `<script src="${siteBase}/embed/${project.id}.js"><\/script>`;

    const detailsMap = {
      automation: { icon: '&#9889;', label: 'Workflow', actions: `
        <div class="deploy-detail"><span class="deploy-detail-label">Webhook URL</span><code class="deploy-detail-code">${siteBase}/api/hooks/${project.id}</code><button class="btn btn-ghost btn-sm" onclick="copyToClipboard('${siteBase}/api/hooks/${project.id}')">Copy</button></div>
        <div class="deploy-detail"><span class="deploy-detail-label">API Endpoint</span><code class="deploy-detail-code">POST /api/v1/automations/${project.id}/run</code><button class="btn btn-ghost btn-sm" onclick="copyToClipboard('${siteBase}/api/v1/automations/${project.id}/run')">Copy</button></div>
        <div class="deploy-detail"><span class="deploy-detail-label">Integrations</span><span>Zapier, Make.com, HubSpot, Slack</span></div>`
      },
      website: { icon: '&#127760;', label: 'Website', actions: `
        <div class="deploy-detail"><span class="deploy-detail-label">Live URL</span><code class="deploy-detail-code">${liveUrl}</code><button class="btn btn-ghost btn-sm" onclick="copyToClipboard('${liveUrl}')">Copy</button></div>
        <div class="deploy-detail"><span class="deploy-detail-label">Custom Domain</span><span>Connect via Settings → Domains</span></div>
        <div class="deploy-detail"><span class="deploy-detail-label">Hosting</span><span>GitHub Pages (99.9% uptime)</span></div>`
      },
      chatbot: { icon: '&#129302;', label: 'Chatbot', actions: `
        <div class="deploy-detail"><span class="deploy-detail-label">Embed Code</span><code class="deploy-detail-code">${embedCode.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</code><button class="btn btn-ghost btn-sm" onclick="copyToClipboard('${embedCode}')">Copy</button></div>
        <div class="deploy-detail"><span class="deploy-detail-label">Widget URL</span><code class="deploy-detail-code">${liveUrl}</code><button class="btn btn-ghost btn-sm" onclick="copyToClipboard('${liveUrl}')">Copy</button></div>
        <div class="deploy-detail"><span class="deploy-detail-label">Platforms</span><span>Shopify, WordPress, Wix, Squarespace, Custom HTML</span></div>`
      },
      microsaas: { icon: '&#128200;', label: 'SaaS Blueprint', actions: `
        <div class="deploy-detail"><span class="deploy-detail-label">Blueprint PDF</span><code class="deploy-detail-code">${project.name}-blueprint.pdf</code><button class="btn btn-ghost btn-sm" onclick="showToast('PDF downloaded!','success')">Download</button></div>
        <div class="deploy-detail"><span class="deploy-detail-label">Code Scaffold</span><code class="deploy-detail-code">${project.name.toLowerCase().replace(/\\s/g,'-')}-scaffold.zip</code><button class="btn btn-ghost btn-sm" onclick="showToast('Code scaffold downloaded!','success')">Download</button></div>
        <div class="deploy-detail"><span class="deploy-detail-label">Stack</span><span>React, Node.js, PostgreSQL, Stripe, Vercel</span></div>`
      },
      email: { icon: '&#128231;', label: 'Email Campaign', actions: `
        <div class="deploy-detail"><span class="deploy-detail-label">Campaign ID</span><code class="deploy-detail-code">campaign_${project.id}</code><button class="btn btn-ghost btn-sm" onclick="copyToClipboard('campaign_${project.id}')">Copy</button></div>
        <div class="deploy-detail"><span class="deploy-detail-label">Status</span><span class="tag tag-green">Scheduled</span></div>
        <div class="deploy-detail"><span class="deploy-detail-label">Integrations</span><span>Mailchimp, SendGrid, Lemlist, Apollo, Instantly</span></div>`
      },
      cloud: { icon: '&#9729;&#65039;', label: 'Cloud Report', actions: `
        <div class="deploy-detail"><span class="deploy-detail-label">Report PDF</span><code class="deploy-detail-code">${project.name}-report.pdf</code><button class="btn btn-ghost btn-sm" onclick="showToast('Report downloaded!','success')">Download</button></div>
        <div class="deploy-detail"><span class="deploy-detail-label">Dashboard</span><code class="deploy-detail-code">${liveUrl}/monitor</code><button class="btn btn-ghost btn-sm" onclick="copyToClipboard('${liveUrl}/monitor')">Copy</button></div>
        <div class="deploy-detail"><span class="deploy-detail-label">Providers</span><span>AWS, Azure, GCP</span></div>`
      },
      content: { icon: '&#9997;&#65039;', label: 'Content', actions: `
        <div class="deploy-detail"><span class="deploy-detail-label">Content ID</span><code class="deploy-detail-code">content_${project.id}</code><button class="btn btn-ghost btn-sm" onclick="copyToClipboard('content_${project.id}')">Copy</button></div>
        <div class="deploy-detail"><span class="deploy-detail-label">Publish To</span><span>WordPress, Medium, LinkedIn, Twitter</span></div>
        <div class="deploy-detail"><span class="deploy-detail-label">Status</span><span class="tag tag-green">Ready to Publish</span></div>`
      }
    };

    const d = detailsMap[project.type] || detailsMap.automation;

    const html = `
      <div class="recharge-modal-overlay" id="deploy-success-modal">
        <div class="recharge-modal-box" style="max-width:520px;">
          <button class="recharge-modal-close" onclick="document.getElementById('deploy-success-modal').remove()">&times;</button>
          <div style="text-align:center;margin-bottom:20px;">
            <div style="font-size:48px;margin-bottom:8px;">&#10003;</div>
            <div class="recharge-modal-title">${d.label} Deployed!</div>
            <div class="recharge-modal-subtitle"><strong>${project.name}</strong> is now live</div>
          </div>
          <div class="deploy-details-box">
            ${d.actions}
          </div>
          <div style="background:rgba(232,55,58,0.08);border:1px solid rgba(232,55,58,0.2);border-radius:8px;padding:10px 14px;margin-top:14px;font-size:13px;color:var(--text-secondary);">
            <strong style="color:var(--accent);">Demo Mode:</strong> This is a simulated deployment. Your project config is saved locally and visible in My Projects.
          </div>
          <div style="display:flex;gap:10px;margin-top:16px;">
            <a href="${base}projects.html" class="btn btn-secondary" style="flex:1;text-align:center;">View My Projects</a>
            <button class="btn btn-primary" style="flex:1;" onclick="document.getElementById('deploy-success-modal').remove()">Done</button>
          </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
  }
};

// ---- Simulate AI Generation ----
function simulateAI(outputEl, callback, delay = 2500) {
  // Show loading overlay
  const loader = document.createElement('div');
  loader.className = 'loading-overlay';
  loader.innerHTML = '<div class="spinner"></div><div class="loading-text">AI is generating...</div>';
  outputEl.style.position = 'relative';
  outputEl.appendChild(loader);

  setTimeout(() => {
    loader.remove();
    callback(outputEl);
    if (typeof SubscriptionManager !== 'undefined') SubscriptionManager.consumeGeneration();
    else Auth.updateUsage('generations');
    showToast('Generation complete!', 'success');
  }, delay);
}

// ---- Copy to Clipboard ----
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Failed to copy', 'error');
  });
}

// ---- Automation Builder ----
function generateAutomation(formData) {
  if (!checkGenerationLimit()) return;
  const output = document.getElementById('automation-output');
  output.innerHTML = '';

  simulateAI(output, (el) => {
    const type = formData.type || 'CRM';
    const desc = formData.description || 'custom automation';

    const workflows = {
      'CRM': [
        { type: 'trigger', label: 'Trigger', desc: 'New lead submitted via web form' },
        { type: 'action', label: 'Action', desc: 'Create contact in CRM with lead details' },
        { type: 'condition', label: 'Condition', desc: 'Check if lead score > 50' },
        { type: 'action', label: 'Action', desc: 'Assign to sales rep & send notification' },
        { type: 'action', label: 'Action', desc: 'Add to email nurture sequence' },
      ],
      'Chatbot': [
        { type: 'trigger', label: 'Trigger', desc: 'Visitor sends message on website' },
        { type: 'action', label: 'Action', desc: 'AI analyzes intent & sentiment' },
        { type: 'condition', label: 'Condition', desc: 'Route: FAQ / Sales / Support' },
        { type: 'action', label: 'Action', desc: 'Generate contextual AI response' },
        { type: 'action', label: 'Action', desc: 'Log conversation & update CRM' },
      ],
      'Email Sequence': [
        { type: 'trigger', label: 'Trigger', desc: 'New subscriber joins list' },
        { type: 'action', label: 'Action', desc: 'Send welcome email with lead magnet' },
        { type: 'condition', label: 'Condition', desc: 'Wait 2 days, check if opened' },
        { type: 'action', label: 'Action', desc: 'Send follow-up based on engagement' },
        { type: 'action', label: 'Action', desc: 'Tag subscriber & move to sales pipeline' },
      ],
      'Custom': [
        { type: 'trigger', label: 'Trigger', desc: `Event detected: "${desc.slice(0, 40)}"` },
        { type: 'action', label: 'Action', desc: 'Process data with AI analysis' },
        { type: 'condition', label: 'Condition', desc: 'Evaluate business rules & thresholds' },
        { type: 'action', label: 'Action', desc: 'Execute automated response' },
        { type: 'action', label: 'Action', desc: 'Send notification & log results' },
      ]
    };

    const nodes = workflows[type] || workflows['Custom'];
    el.innerHTML = `<h4 style="margin-bottom:16px;font-size:14px;">Generated Workflow: <span class="text-gold">${type} Automation</span></h4>` +
      nodes.map(n => `
        <div class="workflow-node">
          <div class="node-type ${n.type}">${n.label}</div>
          <div class="node-desc">${n.desc}</div>
        </div>
      `).join('') +
      `<div style="margin-top:20px;display:flex;gap:8px;">
        <button class="btn btn-primary btn-sm" onclick="deployProject('automation','${type} Automation','${desc.replace(/'/g,"").slice(0,60)}')">Deploy Workflow</button>
        <button class="btn btn-secondary btn-sm" onclick="showToast('Exported to JSON','success')">Export JSON</button>
      </div>`;
  });
}

// ---- Website Builder ----
function generateWebsite(formData) {
  if (!checkGenerationLimit()) return;
  const output = document.getElementById('website-output');
  output.innerHTML = '';

  simulateAI(output, (el) => {
    const name = formData.businessName || 'My Business';
    const type = formData.template || 'Landing Page';
    const industry = formData.industry || 'Technology';

    el.innerHTML = `
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;">
        <div style="padding:8px 12px;background:var(--surface);border-bottom:1px solid var(--border);display:flex;gap:4px;align-items:center;">
          <div style="width:8px;height:8px;border-radius:50%;background:var(--red);"></div>
          <div style="width:8px;height:8px;border-radius:50%;background:var(--gold);"></div>
          <div style="width:8px;height:8px;border-radius:50%;background:var(--green);"></div>
          <span style="margin-left:8px;font-size:11px;color:var(--dim);font-family:var(--font-heading);">${name.toLowerCase().replace(/\s/g,'')}.com</span>
        </div>
        <div style="padding:40px 24px;text-align:center;">
          <div style="font-size:10px;color:var(--gold);text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">${industry}</div>
          <h3 style="font-size:20px;margin-bottom:8px;">${name}</h3>
          <p style="font-size:13px;color:var(--muted);margin-bottom:20px;">AI-generated ${type.toLowerCase()} for your ${industry.toLowerCase()} business</p>
          <div style="display:flex;gap:8px;justify-content:center;margin-bottom:24px;">
            <div style="padding:8px 20px;background:var(--gold);color:#000;border-radius:20px;font-size:12px;font-weight:600;">Get Started</div>
            <div style="padding:8px 20px;border:1px solid var(--border);border-radius:20px;font-size:12px;">Learn More</div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:16px;">
            <div style="background:var(--surface2);border-radius:8px;height:60px;"></div>
            <div style="background:var(--surface2);border-radius:8px;height:60px;"></div>
            <div style="background:var(--surface2);border-radius:8px;height:60px;"></div>
          </div>
        </div>
      </div>
      <div style="margin-top:16px;display:flex;gap:8px;">
        <button class="btn btn-primary btn-sm" onclick="deployProject('website','${name}','${type} for ${industry}')">Deploy Live</button>
        <button class="btn btn-secondary btn-sm" onclick="showToast('Code downloaded!','success')">Download Code</button>
        <button class="btn btn-ghost btn-sm" onclick="showToast('Opened in editor','info')">Edit</button>
      </div>`;
  }, 3000);
}

// ---- Chatbot Creator ----
function generateChatbot(formData) {
  if (!checkGenerationLimit()) return;
  const output = document.getElementById('chatbot-output');
  output.innerHTML = '';

  simulateAI(output, (el) => {
    const botName = formData.botName || 'AI Assistant';
    const personality = formData.personality || 'Professional';
    const purpose = formData.purpose || 'Support';

    const responses = {
      Support: [
        { user: "Hi, I need help with my order", bot: `Hello! I'm ${botName}, your ${personality.toLowerCase()} support assistant. I'd be happy to help with your order. Could you please share your order number?` },
        { user: "Order #12345", bot: "I found your order #12345. It was shipped yesterday and is currently in transit. Expected delivery is within 2-3 business days. Is there anything else I can help with?" },
      ],
      Sales: [
        { user: "What services do you offer?", bot: `Great question! I'm ${botName}. We offer a comprehensive suite of AI-powered solutions including automation, chatbots, and website building. Would you like me to walk you through our most popular package?` },
        { user: "What's the pricing?", bot: "Our plans start at just $49/month for full access to all 7 AI tools. We also offer a free 14-day trial so you can experience the value firsthand. Shall I set that up for you?" },
      ],
      'Lead-Gen': [
        { user: "I'm interested in AI automation", bot: `Welcome! I'm ${botName}. AI automation is transforming businesses right now. To recommend the best solution for you, could you tell me a bit about your business and what processes you'd like to automate?` },
        { user: "I run a real estate agency", bot: "Perfect! Real estate agencies are seeing incredible results with AI automation - from lead qualification to appointment booking. I can schedule a quick 15-minute demo call. What time works best for you?" },
      ]
    };

    const convo = responses[purpose] || responses.Support;

    el.innerHTML = `
      <div class="chat-preview">
        <div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;">
          <div style="width:32px;height:32px;border-radius:50%;background:var(--green-dim);display:flex;align-items:center;justify-content:center;">&#129302;</div>
          <div>
            <div style="font-size:14px;font-weight:600;">${botName}</div>
            <div style="font-size:11px;color:var(--green);">Online</div>
          </div>
        </div>
        <div class="chat-messages">
          <div class="chat-msg bot">Hi there! I'm ${botName}. How can I help you today?</div>
          ${convo.map(c => `
            <div class="chat-msg user">${c.user}</div>
            <div class="chat-msg bot">${c.bot}</div>
          `).join('')}
        </div>
        <div class="chat-input-bar">
          <input type="text" placeholder="Type a message..." id="chat-test-input" onkeydown="if(event.key==='Enter')testChatResponse()">
          <button class="btn btn-primary btn-sm" onclick="testChatResponse()">Send</button>
        </div>
      </div>
      <div style="margin-top:16px;display:flex;gap:8px;">
        <button class="btn btn-primary btn-sm" onclick="deployProject('chatbot','${botName}','${personality} ${purpose} chatbot')">Deploy</button>
        <button class="btn btn-secondary btn-sm" onclick="copyToClipboard('<script src=\\'nexusai.com/chatbot/embed.js\\'></script>')">Copy Embed Code</button>
      </div>`;
  });
}

function testChatResponse() {
  const input = document.getElementById('chat-test-input');
  if (!input || !input.value.trim()) return;
  const messages = document.querySelector('.chat-messages');
  if (!messages) return;

  messages.innerHTML += `<div class="chat-msg user">${input.value}</div>`;
  input.value = '';

  setTimeout(() => {
    const responses = [
      "I understand your question. Let me look into that for you right away.",
      "Great question! Based on our database, I can help you with that.",
      "Thank you for reaching out! I've noted your request and will process it.",
      "I'd be happy to assist! Let me pull up the relevant information.",
    ];
    const reply = responses[Math.floor(Math.random() * responses.length)];
    messages.innerHTML += `<div class="chat-msg bot">${reply}</div>`;
    messages.scrollTop = messages.scrollHeight;
  }, 1000);
}

// ---- Micro-SaaS Generator ----
function generateMicroSaaS(formData) {
  if (!checkGenerationLimit()) return;
  const output = document.getElementById('microsaas-output');
  output.innerHTML = '';

  simulateAI(output, (el) => {
    const idea = formData.idea || 'AI-powered tool';
    const market = formData.market || 'Small businesses';
    const model = formData.model || 'Subscription';

    el.innerHTML = `
      <h4 style="margin-bottom:16px;font-size:15px;">&#128200; SaaS Blueprint: <span class="text-gold">${idea.slice(0, 50)}</span></h4>

      <div style="margin-bottom:20px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--gold);margin-bottom:8px;font-weight:600;">Tech Stack</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <span class="tag tag-blue">React / Next.js</span>
          <span class="tag tag-green">Node.js API</span>
          <span class="tag tag-purple">PostgreSQL</span>
          <span class="tag tag-gold">Claude AI API</span>
          <span class="tag tag-blue">Vercel Deploy</span>
          <span class="tag tag-green">Stripe Payments</span>
        </div>
      </div>

      <div style="margin-bottom:20px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--green);margin-bottom:8px;font-weight:600;">Core Features</div>
        <ul style="font-size:14px;color:var(--text-secondary);line-height:2;">
          <li>&#9989; User authentication & onboarding flow</li>
          <li>&#9989; AI-powered core feature: ${idea.slice(0, 40)}</li>
          <li>&#9989; Dashboard with usage analytics</li>
          <li>&#9989; ${model} billing via Stripe</li>
          <li>&#9989; API endpoints for integrations</li>
          <li>&#9989; Admin panel for management</li>
        </ul>
      </div>

      <div style="margin-bottom:20px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--purple);margin-bottom:8px;font-weight:600;">MVP Roadmap</div>
        <div style="font-size:14px;color:var(--text-secondary);line-height:2;">
          <div><span class="mono text-gold">Week 1-2:</span> Core backend + AI integration</div>
          <div><span class="mono text-gold">Week 3:</span> Frontend dashboard + auth</div>
          <div><span class="mono text-gold">Week 4:</span> Stripe integration + landing page</div>
          <div><span class="mono text-green">Week 5:</span> Beta launch to ${market}</div>
        </div>
      </div>

      <div style="margin-bottom:16px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--blue);margin-bottom:8px;font-weight:600;">Revenue Projection</div>
        <div style="font-size:14px;color:var(--text-secondary);">
          Target: <span class="mono text-gold">200 users</span> at <span class="mono text-gold">$29-99/mo</span> = <span class="mono text-green">$5,800 - $19,800/mo</span>
        </div>
      </div>

      <div style="display:flex;gap:8px;">
        <button class="btn btn-primary btn-sm" onclick="deployProject('microsaas','${idea.slice(0,40)}','SaaS for ${market}')">Export &amp; Deploy</button>
        <button class="btn btn-secondary btn-sm" onclick="showToast('Code scaffold generated!','success')">Generate Code</button>
      </div>`;
  }, 3000);
}

// ---- Email Outreach ----
function generateEmailSequence(formData) {
  if (!checkGenerationLimit()) return;
  const output = document.getElementById('email-output');
  output.innerHTML = '';

  simulateAI(output, (el) => {
    const campaign = formData.campaign || 'Outreach Campaign';
    const audience = formData.audience || 'business owners';
    const tone = formData.tone || 'Professional';
    const followups = parseInt(formData.followups) || 3;

    const emails = [
      {
        subject: `Quick question about your ${audience.split(' ')[0]} workflow`,
        body: `Hi {name},\n\nI noticed that {company} is growing fast — congrats on the momentum.\n\nI'm reaching out because we've helped similar ${audience} save 20+ hours/week by automating their repetitive tasks with AI.\n\nWould you be open to a quick 15-minute call this week to see if it could work for your team?\n\nBest,\n{your_name}`
      },
      {
        subject: `Re: Quick question`,
        body: `Hi {name},\n\nJust following up on my last email. I know you're busy, so I'll keep this brief.\n\nWe recently helped a company similar to {company} reduce their customer response time by 80% using our AI chatbot solution.\n\nHappy to share the case study if you're interested.\n\nCheers,\n{your_name}`
      },
      {
        subject: `Last thing — then I'll stop bugging you`,
        body: `Hi {name},\n\nI wanted to reach out one last time. If now isn't the right time, no worries at all.\n\nBut if you're curious about how AI automation could save your team hours every week, I'd love to show you a quick demo.\n\nEither way, wishing {company} continued success!\n\nBest,\n{your_name}`
      },
      {
        subject: `{name}, thought you'd find this interesting`,
        body: `Hi {name},\n\nI came across this stat: businesses using AI automation are seeing 3x productivity gains in Q1 2026.\n\nGiven what {company} is doing in the ${audience.split(' ')[0]} space, I think there's a real opportunity here.\n\nWant me to put together a quick analysis for your team?\n\n{your_name}`
      },
      {
        subject: `Breakup email — but leaving the door open`,
        body: `Hi {name},\n\nI've reached out a few times and I understand if now isn't the right time.\n\nI'll stop reaching out after this, but if you ever want to explore how AI can help ${audience}, my calendar is always open: [link]\n\nWishing you all the best,\n{your_name}`
      }
    ];

    const sequence = emails.slice(0, followups + 1);

    el.innerHTML = `
      <h4 style="margin-bottom:16px;font-size:14px;">&#128231; ${campaign} <span class="text-dim">| ${tone} tone | ${sequence.length} emails</span></h4>
      ${sequence.map((email, i) => `
        <div class="email-card ${i === 0 ? 'open' : ''}">
          <div class="email-card-header" onclick="this.closest('.email-card').classList.toggle('open')">
            <span class="email-num">${i === 0 ? 'Initial' : 'Follow-up ' + i}</span>
            <span class="email-subject">${email.subject}</span>
            <span class="email-toggle">&#9660;</span>
          </div>
          <div class="email-card-body" style="${i === 0 ? 'display:block' : ''}">
            <pre style="white-space:pre-wrap;font-family:var(--font-body);font-size:14px;line-height:1.7;">${email.body}</pre>
            <button class="btn btn-ghost btn-sm" style="margin-top:8px;" onclick="copyToClipboard(\`${email.body.replace(/`/g,"'")}\`)">Copy Email</button>
          </div>
        </div>
      `).join('')}
      <div style="margin-top:16px;display:flex;gap:8px;">
        <button class="btn btn-primary btn-sm" onclick="deployProject('email','${campaign}','${tone} campaign for ${audience}')">Schedule Campaign</button>
        <button class="btn btn-secondary btn-sm" onclick="showToast('Exported to CSV!','success')">Export All</button>
      </div>`;
  });
}

// ---- Cloud Consulting ----
function generateCloudAnalysis(formData) {
  if (!checkGenerationLimit()) return;
  const output = document.getElementById('cloud-output');
  output.innerHTML = '';

  simulateAI(output, (el) => {
    const provider = formData.provider || 'AWS';
    const spend = parseFloat(formData.spend) || 5000;
    const optimized = Math.round(spend * 0.65);
    const savings = spend - optimized;

    el.innerHTML = `
      <h4 style="margin-bottom:20px;font-size:14px;">&#9729;&#65039; Cloud Analysis: <span class="text-gold">${provider}</span></h4>

      <div style="margin-bottom:24px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--gold);margin-bottom:12px;font-weight:600;">Cost Comparison</div>
        <div class="cost-bars">
          <div class="cost-bar-item">
            <div class="cost-bar" style="height:${Math.min(180, 180)}px;background:var(--red);width:60px;">
              <div class="cost-val" style="color:var(--red);">$${spend.toLocaleString()}</div>
            </div>
            <div class="cost-bar-label">Current</div>
          </div>
          <div class="cost-bar-item">
            <div class="cost-bar" style="height:${Math.min(180, Math.round(180 * 0.65))}px;background:var(--green);width:60px;">
              <div class="cost-val" style="color:var(--green);">$${optimized.toLocaleString()}</div>
            </div>
            <div class="cost-bar-label">Optimized</div>
          </div>
          <div class="cost-bar-item">
            <div class="cost-bar" style="height:${Math.min(180, Math.round(180 * 0.35))}px;background:var(--gold);width:60px;">
              <div class="cost-val" style="color:var(--gold);">$${savings.toLocaleString()}</div>
            </div>
            <div class="cost-bar-label">Savings/mo</div>
          </div>
        </div>
      </div>

      <div style="margin-bottom:20px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--green);margin-bottom:8px;font-weight:600;">Recommendations</div>
        <ul style="font-size:14px;color:var(--text-secondary);line-height:2;">
          <li>&#9989; Right-size EC2/VM instances (est. save $${Math.round(savings * 0.3).toLocaleString()}/mo)</li>
          <li>&#9989; Switch to reserved instances for stable workloads</li>
          <li>&#9989; Implement auto-scaling for variable loads</li>
          <li>&#9989; Move cold storage to archive tier</li>
          <li>&#9989; Set up AI-powered anomaly detection for cost alerts</li>
          <li>&#9989; Enable predictive scaling using ML models</li>
        </ul>
      </div>

      <div style="margin-bottom:20px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--blue);margin-bottom:8px;font-weight:600;">Migration Timeline</div>
        <div style="font-size:14px;color:var(--text-secondary);line-height:2;">
          <div><span class="mono text-gold">Phase 1 (Week 1-2):</span> Infrastructure audit & assessment</div>
          <div><span class="mono text-gold">Phase 2 (Week 3-4):</span> Optimization & right-sizing</div>
          <div><span class="mono text-green">Phase 3 (Week 5-6):</span> AI monitoring setup & go-live</div>
        </div>
      </div>

      <div style="padding:16px;background:var(--gold-dim);border-radius:var(--radius-md);margin-bottom:16px;">
        <div class="mono text-gold" style="font-size:16px;font-weight:700;">Annual savings: $${(savings * 12).toLocaleString()}</div>
        <div style="font-size:13px;color:var(--muted);margin-top:4px;">35% cost reduction with AI-optimized infrastructure</div>
      </div>

      <div style="display:flex;gap:8px;">
        <button class="btn btn-primary btn-sm" onclick="deployProject('cloud','${provider} Cloud Analysis','Cost optimization for ${provider}')">Export &amp; Deploy</button>
        <button class="btn btn-secondary btn-sm" onclick="showToast('Consultation booked!','success')">Book Consultation</button>
      </div>`;
  }, 3000);
}

// ---- Content Studio ----
function generateContent(formData) {
  if (!checkGenerationLimit()) return;
  const output = document.getElementById('content-output');
  output.innerHTML = '';

  simulateAI(output, (el) => {
    const topic = formData.topic || 'AI Automation';
    const type = formData.type || 'blog';
    const tone = formData.tone || 'Professional';

    const content = {
      blog: {
        title: `How ${topic} Is Transforming Business in 2026`,
        body: `The landscape of ${topic.toLowerCase()} has shifted dramatically in 2026. Businesses that once spent weeks on manual processes are now achieving the same results in hours.\n\n## The Rise of AI-Powered ${topic}\n\nAccording to recent industry reports, companies implementing ${topic.toLowerCase()} solutions are seeing an average ROI of 340% within the first six months. This isn't just a trend — it's a fundamental shift in how businesses operate.\n\n## Key Benefits\n\n**1. Time Savings**\nTeams report saving 20-30 hours per week by automating repetitive tasks related to ${topic.toLowerCase()}.\n\n**2. Cost Reduction**\nOperational costs decrease by an average of 35% when AI handles routine ${topic.toLowerCase()} workflows.\n\n**3. Scalability**\nAI-powered systems scale effortlessly, handling 10x the workload without proportional cost increases.\n\n## Getting Started\n\nThe best time to implement ${topic.toLowerCase()} was yesterday. The second-best time is today. Start with a small pilot project, measure results, and scale what works.\n\n---\n*Ready to transform your business with ${topic}? Start your free trial at NexusAI today.*`,
        wordCount: 185,
        readability: 'Grade 8'
      },
      social: {
        title: `LinkedIn Post: ${topic}`,
        body: `&#128640; Hot take: ${topic} isn't the future anymore — it's the present.\n\nHere's what I'm seeing in 2026:\n\n&#9889; Companies using AI automation save 20+ hrs/week\n&#128176; Average ROI: 340% in 6 months\n&#128200; Teams are 3x more productive\n\nThe businesses that adapt now will dominate.\nThe ones that wait will play catch-up.\n\nI've been building with ${topic.toLowerCase()} for the past 6 months, and the results speak for themselves:\n\n&#10004; Client A: Reduced support costs by 80%\n&#10004; Client B: Generated 150+ leads/month on autopilot\n&#10004; Client C: Built their entire web presence in 48 hours\n\nWhat's your experience with ${topic.toLowerCase()}?\n\n#AI #Automation #Business #${topic.replace(/\s/g,'')}`,
        wordCount: 120,
        readability: 'Social optimized'
      },
      seo: {
        title: `Ultimate Guide to ${topic}: Everything You Need to Know in 2026`,
        body: `# Ultimate Guide to ${topic} (2026)\n\n**Meta Description:** Discover how ${topic.toLowerCase()} can transform your business. Complete guide covering benefits, implementation, costs, and ROI.\n\n**Target Keywords:** ${topic.toLowerCase()}, ${topic.toLowerCase()} for business, best ${topic.toLowerCase()} tools, ${topic.toLowerCase()} guide 2026\n\n---\n\n## What is ${topic}?\n\n${topic} refers to the use of artificial intelligence to streamline, optimize, and automate business processes. In 2026, this technology has matured significantly, making it accessible to businesses of all sizes.\n\n## Why ${topic} Matters\n\nThe data is compelling:\n- 78% of businesses plan to increase AI spending in 2026\n- Companies using AI report 3x productivity gains\n- Average implementation time has dropped from months to weeks\n\n## How to Get Started\n\n1. Identify your highest-impact manual processes\n2. Choose an AI platform that fits your needs\n3. Start with a pilot project\n4. Measure, iterate, and scale\n\n## Top ${topic} Tools in 2026\n\n| Tool | Best For | Pricing |\n|------|----------|--------|\n| NexusAI | All-in-one platform | $49/mo |\n\n## Conclusion\n\n${topic} is no longer optional — it's essential for staying competitive in 2026.`,
        wordCount: 210,
        readability: 'SEO Grade A'
      },
      ad: {
        title: `Ad Copy: ${topic}`,
        body: `**Headline Options:**\n\n1. "Stop Wasting 20 Hours/Week — Let AI Handle It"\n2. "${topic} That Actually Works (Join 10,000+ Businesses)"\n3. "From Manual to Magical: ${topic} in Minutes"\n\n**Primary Text:**\nTired of spending hours on tasks that AI can do in seconds?\n\nNexusAI gives you 7 AI-powered tools to automate your ${topic.toLowerCase()} — from chatbots to email campaigns to full website builds.\n\n&#9989; No coding required\n&#9989; 14-day free trial\n&#9989; Used by 10,000+ businesses\n\nStart free today. &#128073;\n\n**CTA Options:**\n- Start Free Trial\n- See It In Action\n- Get Started Free`,
        wordCount: 95,
        readability: 'Ad optimized'
      }
    };

    const c = content[type] || content.blog;

    el.innerHTML = `
      <div style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
        <h4 style="font-size:14px;">${c.title}</h4>
        <div style="display:flex;gap:6px;">
          <span class="tag tag-green">${c.wordCount} words</span>
          <span class="tag tag-blue">${c.readability}</span>
        </div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:20px;font-size:14px;color:var(--text-secondary);line-height:1.8;white-space:pre-wrap;max-height:400px;overflow-y:auto;" id="content-text">${c.body}</div>
      <div style="margin-top:16px;display:flex;gap:8px;">
        <button class="btn btn-primary btn-sm" onclick="copyToClipboard(document.getElementById('content-text').textContent)">Copy Content</button>
        <button class="btn btn-secondary btn-sm" onclick="deployProject('content','${c.title.replace(/'/g,"")}','${type} content about ${topic.replace(/'/g,"")}')">Publish &amp; Save</button>
        <button class="btn btn-ghost btn-sm" onclick="showToast('Regenerating...','info')">Regenerate</button>
      </div>`;
  });
}

// ---- Deploy project helper (called by deploy buttons) ----
function deployProject(type, name, description) {
  const project = ProjectManager.save({ type, name, description });
  ProjectManager.showDeployModal(project);
}
