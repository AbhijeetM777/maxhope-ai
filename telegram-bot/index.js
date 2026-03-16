/* ============================================
   Maxhope.AI — Telegram Chat-to-Action Bot
   ============================================
   Talk naturally in Telegram to control your
   live project. No slash commands needed.
   Just say what you want done.
   ============================================ */

const TelegramBot = require('node-telegram-bot-api');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ---- Configuration ----
const PROJECT_DIR = path.resolve(__dirname, '..');
const GITHUB_PAGES_URL = 'https://abhijeetm777.github.io/maxhope-ai/';
const REPO_URL = 'https://github.com/AbhijeetM777/maxhope-ai';
const CONFIG_FILE = path.join(__dirname, '.bot-config.json');

// ---- Project Memory ----
const PROJECT_CONTEXT = {
  name: 'Maxhope.AI',
  owner: 'Abhijeet Mohanty',
  github: 'AbhijeetM777',
  email: 'abhijeetmohanty16@gmail.com',
  liveUrl: GITHUB_PAGES_URL,
  repo: REPO_URL,
  stack: 'Pure HTML/CSS/JS — no framework, no build step',
  hosting: 'GitHub Pages (auto-deploys from master branch)',
  description: 'AI SaaS Platform with 7 AI tools — automation builder, website builder, chatbot creator, micro-saas generator, email outreach, cloud consulting, content studio',
  structure: {
    pages: {
      'index.html': 'Landing page / homepage',
      'login.html': 'User login page',
      'signup.html': 'User signup with plan selection (starter/pro/enterprise)',
      'dashboard.html': 'User dashboard with subscription status',
      'pricing.html': 'Pricing page with plan comparison',
      'projects.html': 'My Projects — shows all deployed tools with details',
      'recharge.html': 'Billing page — recharge packs & payment history'
    },
    tools: {
      'tools/automation.html': 'Automation Builder — workflow/CRM/inventory automation',
      'tools/website-builder.html': 'Website Builder — AI-generated websites',
      'tools/chatbot.html': 'Chatbot Creator — custom AI chatbots',
      'tools/microsaas.html': 'Micro-SaaS Generator — SaaS app scaffolding',
      'tools/email-outreach.html': 'Email Outreach — campaign builder',
      'tools/cloud-consulting.html': 'Cloud Consulting — cost optimization',
      'tools/content-studio.html': 'Content Studio — blog/social content'
    },
    js: {
      'js/app.js': 'Core — auth, sidebar, navigation, currency formatting',
      'js/tools.js': 'All 7 tool generators + ProjectManager + deploy system',
      'js/dashboard.js': 'Dashboard rendering + subscription card',
      'js/subscription.js': 'SubscriptionManager — plans, recharge, billing (currently free mode)',
      'js/projects.js': 'ProjectsPage controller — filter, display, delete deployments',
      'js/recharge.js': 'RechargePageController — billing page logic'
    },
    css: {
      'css/style.css': 'All styles — main layout, tools, modals, subscription, deploy details'
    }
  },
  auth: 'localStorage-based — nexusai_user, nexusai_users, nexusai_projects',
  features: [
    'Subscription system (currently disabled — free mode)',
    'Multi-currency pricing (12 currencies)',
    'ProjectManager with deployment details (webhook URLs, API endpoints, embed codes)',
    'My Projects page with type filtering',
    'Recharge packs with payment simulation'
  ]
};

// ---- Config Management ----
function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  }
  return {};
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

// ---- Helpers ----
function git(cmd) {
  return execSync(`git ${cmd}`, { cwd: PROJECT_DIR, encoding: 'utf-8', timeout: 30000 }).trim();
}

function shell(cmd) {
  return execSync(cmd, { cwd: PROJECT_DIR, encoding: 'utf-8', timeout: 30000 }).trim();
}

function timestamp() {
  return new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
}

function getFileTree(dir = '.', prefix = '', depth = 0) {
  if (depth > 2) return [];
  const fullDir = path.join(PROJECT_DIR, dir);
  if (!fs.existsSync(fullDir)) return [];
  const entries = fs.readdirSync(fullDir, { withFileTypes: true });
  const lines = [];
  const filtered = entries.filter(e =>
    !e.name.startsWith('.') && e.name !== 'node_modules' &&
    e.name !== 'telegram-bot' && e.name !== 'whatsapp-bot'
  );
  for (const entry of filtered) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      lines.push(`${prefix}📁 ${entry.name}/`);
      lines.push(...getFileTree(rel, prefix + '  ', depth + 1));
    } else {
      lines.push(`${prefix}📄 ${entry.name}`);
    }
  }
  return lines;
}

// ---- Natural Language Intent Parser ----
function parseIntent(text) {
  const lower = text.toLowerCase().trim();

  // --- Deploy / Push Live ---
  if (/\b(deploy|push live|go live|push it|push changes|push to git|push to github|send live|make it live|ship it|publish)\b/.test(lower)) {
    const msg = text.replace(/^(deploy|push|publish|ship)\s*/i, '').trim();
    return { action: 'deploy', message: msg || null };
  }

  // --- Commit ---
  if (/\b(commit|save changes|save this|save progress)\b/.test(lower)) {
    const msg = text.replace(/^(commit|save)\s*/i, '').trim();
    return { action: 'commit', message: msg || null };
  }

  // --- Push only ---
  if (/\b(push|upload)\b/.test(lower) && !/push live|push it/.test(lower)) {
    return { action: 'push' };
  }

  // --- Status / What's happening ---
  if (/\b(status|what'?s? (happening|changed|going on|the state|up)|how'?s? the project|project status|any changes)\b/.test(lower)) {
    return { action: 'status' };
  }

  // --- Show recent activity / log ---
  if (/\b(log|history|recent commits|what (did|was) (i|we) (do|change)|last commits|show commits|activity)\b/.test(lower)) {
    return { action: 'log' };
  }

  // --- Diff / What changed ---
  if (/\b(diff|what changed|show changes|show me changes|see changes|changes made)\b/.test(lower)) {
    return { action: 'diff' };
  }

  // --- List files ---
  if (/\b(files|file list|show files|list files|project files|what files|structure|tree)\b/.test(lower)) {
    return { action: 'files' };
  }

  // --- Read a file ---
  if (/\b(read|show me|open|view|cat|display|look at|check)\b/.test(lower)) {
    const fileMatch = text.match(/(?:read|show me|open|view|cat|display|look at|check)\s+(.+)/i);
    if (fileMatch) {
      const file = fileMatch[1].trim().replace(/^(the |file |content of |contents of )/i, '');
      return { action: 'read', file };
    }
  }

  // --- Edit / Change / Replace / Update text ---
  if (/\b(change|replace|update|edit|modify|swap|set)\b/.test(lower) && /\b(to|with|into|→|->|=>)\b/.test(lower)) {
    // Try: "change X to Y in file"
    let m = text.match(/(?:change|replace|update|edit|swap|set)\s+["']?(.+?)["']?\s+(?:to|with|into|→|->|=>)\s+["']?(.+?)["']?\s+(?:in|on|inside|at)\s+(.+)/i);
    if (m) return { action: 'edit', file: m[3].trim(), oldText: m[1].trim(), newText: m[2].trim() };

    // Try: "in file, change X to Y"
    m = text.match(/(?:in|on)\s+(.+?)[\s,]+(?:change|replace|update|edit|swap|set)\s+["']?(.+?)["']?\s+(?:to|with|into|→|->|=>)\s+["']?(.+?)["']?$/i);
    if (m) return { action: 'edit', file: m[1].trim(), oldText: m[2].trim(), newText: m[3].trim() };

    return { action: 'edit_help' };
  }

  // --- Create file ---
  if (/\b(create|make|add|new)\b/.test(lower) && /\b(file|page)\b/.test(lower)) {
    const m = text.match(/(?:create|make|add|new)\s+(?:a\s+)?(?:file|page)\s+(?:called\s+|named\s+)?(.+)/i);
    if (m) return { action: 'create', file: m[1].trim() };
    return { action: 'create_help' };
  }

  // --- Delete file ---
  if (/\b(delete|remove|drop)\b/.test(lower) && /\b(file|page)\b/.test(lower)) {
    const m = text.match(/(?:delete|remove|drop)\s+(?:the\s+)?(?:file|page)\s+(.+)/i);
    if (m) return { action: 'delete', file: m[1].trim() };
    return { action: 'delete_help' };
  }

  // --- Rollback / Undo ---
  if (/\b(rollback|undo|revert|go back|undo last)\b/.test(lower)) {
    return { action: 'rollback' };
  }

  // --- Discard ---
  if (/\b(discard|throw away|reset|clean|wipe changes)\b/.test(lower)) {
    return { action: 'discard' };
  }

  // --- Backup ---
  if (/\b(backup|back up|save point|snapshot|tag)\b/.test(lower)) {
    const m = text.match(/(?:backup|back up|tag|snapshot)\s+(?:as\s+|called\s+|named\s+)?(.+)/i);
    return { action: 'backup', tag: m ? m[1].trim() : null };
  }

  // --- Restore ---
  if (/\b(restore|go back to|load backup|switch to tag)\b/.test(lower)) {
    const m = text.match(/(?:restore|go back to|load)\s+(.+)/i);
    return { action: 'restore', tag: m ? m[1].trim() : null };
  }

  // --- Site URL ---
  if (/\b(site|url|link|website|live link|where.?s.? (?:the|my) site|open site)\b/.test(lower)) {
    return { action: 'site' };
  }

  // --- Ping / Alive ---
  if (/\b(ping|alive|you there|hello|hi|hey|test)\b/.test(lower)) {
    return { action: 'ping' };
  }

  // --- Help ---
  if (/\b(help|what can you do|commands|how does this work|guide|instructions)\b/.test(lower)) {
    return { action: 'help' };
  }

  // --- Project info ---
  if (/\b(about|info|details|what is this|tell me about|project info|what project)\b/.test(lower)) {
    return { action: 'info' };
  }

  // --- Tags ---
  if (/\b(tags|backups|list backups|show tags|all backups)\b/.test(lower)) {
    return { action: 'tags' };
  }

  return { action: 'unknown', original: text };
}

// ---- Action Executors ----
const actions = {

  help() {
    return `🤖 *Maxhope.AI Remote Control*

Just chat naturally! Here's what I understand:

📊 *Status & Info*
• "what's the status" / "any changes?"
• "show me the log" / "recent activity"
• "what changed" / "show diff"
• "list files" / "show structure"
• "project info" / "about this project"
• "site url" / "where's my site"

📝 *File Operations*
• "read index.html" / "show me the homepage"
• "change X to Y in file.html"
• "create a file called test.html"
• "delete file old-page.html"

🚀 *Deploy & Git*
• "deploy" / "push live" / "ship it"
• "commit Updated the navbar"
• "push to github"
• "rollback" / "undo last commit"
• "discard all changes"

💾 *Backup*
• "backup as v2.0"
• "restore v1.0"
• "show tags"

Just type what you want — I'll figure it out! 💬`;
  },

  info() {
    const ctx = PROJECT_CONTEXT;
    return `🏢 *Project: ${ctx.name}*

👤 Owner: ${ctx.owner}
🔧 Stack: ${ctx.stack}
🌐 Live: ${ctx.liveUrl}
📂 Repo: ${ctx.repo}
🏠 Hosting: ${ctx.hosting}

📝 ${ctx.description}

🔐 Auth: ${ctx.auth}

⚡ Features:
${ctx.features.map(f => `• ${f}`).join('\n')}

📄 Pages: ${Object.keys(ctx.structure.pages).length} pages
🔧 Tools: ${Object.keys(ctx.structure.tools).length} AI tools
📜 Scripts: ${Object.keys(ctx.structure.js).length} JS files`;
  },

  status() {
    const status = git('status --short');
    const branch = git('rev-parse --abbrev-ref HEAD');
    const lastCommit = git('log -1 --format="%h %s (%cr)"');
    const ahead = (() => {
      try { return git('rev-list --count origin/master..HEAD'); } catch { return '?'; }
    })();
    return `📊 *Project Status*

🔀 Branch: ${branch}
📝 Last commit: ${lastCommit}
📤 Ahead of remote: ${ahead} commit(s)
📁 Changes:
${status || '✅ Clean — no pending changes'}

🌐 Live: ${GITHUB_PAGES_URL}
⏰ ${timestamp()}`;
  },

  log() {
    const log = git('log -5 --format="• %h %s (%cr)"');
    return `📋 *Recent Commits*\n\n${log}`;
  },

  diff() {
    const diff = git('diff --stat');
    if (!diff) return '✅ No changes to show. Working tree is clean.';
    const full = git('diff --shortstat');
    return `🔍 *Current Changes*\n\n${diff}\n\n${full}`;
  },

  files() {
    const tree = getFileTree();
    return `📁 *Project Structure*\n\n${tree.join('\n')}`;
  },

  read(intent) {
    let file = intent.file;
    if (!file) return '⚠️ Which file? Try: "read index.html" or "show me js/app.js"';

    // Smart file resolution
    const aliases = {
      'homepage': 'index.html', 'home': 'index.html', 'landing': 'index.html',
      'login': 'login.html', 'signup': 'signup.html', 'register': 'signup.html',
      'dashboard': 'dashboard.html', 'pricing': 'pricing.html',
      'projects': 'projects.html', 'billing': 'recharge.html', 'recharge': 'recharge.html',
      'styles': 'css/style.css', 'css': 'css/style.css', 'stylesheet': 'css/style.css',
      'app': 'js/app.js', 'main js': 'js/app.js', 'tools': 'js/tools.js',
      'automation': 'tools/automation.html', 'chatbot': 'tools/chatbot.html',
      'website builder': 'tools/website-builder.html', 'email': 'tools/email-outreach.html',
      'cloud': 'tools/cloud-consulting.html', 'content': 'tools/content-studio.html',
      'microsaas': 'tools/microsaas.html', 'saas': 'tools/microsaas.html'
    };
    file = aliases[file.toLowerCase()] || file;

    const filePath = path.join(PROJECT_DIR, file);
    if (!fs.existsSync(filePath)) return `❌ File not found: ${file}\n\nTry "list files" to see what's available.`;

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    if (lines.length > 80) {
      return `📄 *${file}* (${lines.length} lines — showing first 80)\n\n\`\`\`\n${lines.slice(0, 80).join('\n')}\n\`\`\`\n\nSay "read more of ${file}" for the next chunk.`;
    }
    return `📄 *${file}*\n\n\`\`\`\n${content}\n\`\`\``;
  },

  edit(intent) {
    if (!intent.file || !intent.oldText || !intent.newText) {
      return `⚠️ I need three things to edit:
1. The file name
2. The text to find
3. The replacement text

Example: "change Welcome to NexusAI to Welcome to Maxhope.AI in index.html"`;
    }

    // Smart file resolution
    const aliases = {
      'homepage': 'index.html', 'home': 'index.html',
      'styles': 'css/style.css', 'css': 'css/style.css',
      'app': 'js/app.js', 'tools': 'js/tools.js'
    };
    const file = aliases[intent.file.toLowerCase()] || intent.file;
    const filePath = path.join(PROJECT_DIR, file);

    if (!fs.existsSync(filePath)) return `❌ File not found: ${file}`;

    let content = fs.readFileSync(filePath, 'utf-8');
    if (!content.includes(intent.oldText)) {
      return `❌ Couldn't find "${intent.oldText.slice(0, 80)}" in ${file}.\n\nMake sure it matches exactly. Try "read ${file}" first to see the content.`;
    }

    content = content.replace(intent.oldText, intent.newText);
    fs.writeFileSync(filePath, content, 'utf-8');
    return `✅ *Edited ${file}!*

🔴 Removed: "${intent.oldText.slice(0, 100)}"
🟢 Added: "${intent.newText.slice(0, 100)}"

Say "deploy" to push this change live.`;
  },

  edit_help() {
    return `✏️ *How to edit files:*

Say something like:
• "change Welcome to Hello in index.html"
• "replace old text with new text in js/app.js"
• "in css/style.css, change #667eea to #ff6600"

I need to know: the file, what to find, and what to replace it with.`;
  },

  create(intent) {
    if (!intent.file) return '⚠️ What should I call the file? Try: "create a file called about.html"';

    const filePath = path.join(PROJECT_DIR, intent.file);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Generate basic template based on extension
    const ext = path.extname(intent.file).toLowerCase();
    let content = '';
    if (ext === '.html') {
      content = `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${path.basename(intent.file, ext)} - Maxhope.AI</title>\n  <link rel="stylesheet" href="css/style.css">\n</head>\n<body>\n  <h1>${path.basename(intent.file, ext)}</h1>\n  <p>New page created from Telegram.</p>\n  <script src="js/app.js"></script>\n</body>\n</html>`;
    } else if (ext === '.js') {
      content = `// ${path.basename(intent.file)} — Created from Telegram\n// ${timestamp()}\n\nconsole.log('${path.basename(intent.file)} loaded');\n`;
    } else if (ext === '.css') {
      content = `/* ${path.basename(intent.file)} — Created from Telegram */\n/* ${timestamp()} */\n`;
    } else {
      content = `Created from Telegram at ${timestamp()}\n`;
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    return `✅ *Created ${intent.file}!*

${content.length} chars written with a starter template.
Say "deploy" to push it live.`;
  },

  create_help() {
    return `📝 *How to create files:*

Say something like:
• "create a file called about.html"
• "make a new page called team.html"
• "create file js/analytics.js"

I'll add a starter template based on the file type.`;
  },

  delete(intent) {
    if (!intent.file) return '⚠️ Which file? Try: "delete file old-page.html"';

    const file = intent.file;
    const filePath = path.join(PROJECT_DIR, file);
    if (!fs.existsSync(filePath)) return `❌ File not found: ${file}`;

    const blocked = ['index.html', 'js/app.js', 'css/style.css', 'dashboard.html'];
    if (blocked.some(b => file.startsWith(b))) {
      return `⚠️ ${file} is a protected core file. I won't delete it.`;
    }

    fs.unlinkSync(filePath);
    return `🗑️ *Deleted ${file}*\n\nSay "deploy" to push this change live.`;
  },

  delete_help() {
    return '⚠️ Which file should I delete? Try: "delete file old-page.html"';
  },

  commit(intent) {
    const msg = intent.message || `Update from Telegram — ${timestamp()}`;
    try {
      git('add -A');
      const status = git('status --short');
      if (!status) return '✅ Nothing to commit — everything is already saved.';
      git(`commit -m "${msg.replace(/"/g, '\\"')}"`);
      const hash = git('log -1 --format="%h"');
      return `✅ *Committed!*

📝 ${msg}
🔗 ${hash}
⏰ ${timestamp()}

Say "push" to send to GitHub, or "deploy" to commit + push in one go.`;
    } catch (e) {
      return `❌ Commit failed: ${e.message.slice(0, 200)}`;
    }
  },

  push() {
    try {
      const result = git('push origin master');
      return `🚀 *Pushed to GitHub!*

${result || 'Up to date.'}

🌐 Live at: ${GITHUB_PAGES_URL}
⏰ ${timestamp()}

Changes will appear on the live site within 1-2 minutes.`;
    } catch (e) {
      if (e.message.includes('Everything up-to-date')) {
        return '✅ Already up to date — nothing to push.';
      }
      return `❌ Push failed: ${e.message.slice(0, 200)}`;
    }
  },

  deploy(intent) {
    const commitMsg = intent.message || `Deploy from Telegram — ${timestamp()}`;
    try {
      git('add -A');
      const status = git('status --short');
      if (!status) return '✅ Nothing to deploy — everything is already live.';

      const fileCount = status.split('\n').length;
      git(`commit -m "${commitMsg.replace(/"/g, '\\"')}"`);
      const hash = git('log -1 --format="%h"');

      let pushResult;
      try {
        pushResult = git('push origin master');
      } catch (pe) {
        pushResult = pe.message.includes('Everything up-to-date') ? 'Already synced.' : pe.message.slice(0, 100);
      }

      return `🚀 *Deployed to Production!*

📝 ${commitMsg}
🔗 Commit: ${hash}
📦 Files: ${fileCount} changed
📤 ${pushResult || 'Pushed successfully'}

🌐 Live: ${GITHUB_PAGES_URL}
⏰ ${timestamp()}

Your changes are going live now! Takes ~1-2 min.`;
    } catch (e) {
      return `❌ Deploy failed: ${e.message.slice(0, 200)}`;
    }
  },

  rollback() {
    try {
      const before = git('log -1 --format="%h %s"');
      git('reset HEAD~1');
      return `⏪ *Rolled back!*

Reverted: ${before}

Changes are now unstaged. You can:
• "deploy" to re-commit with changes
• "discard all changes" to fully revert`;
    } catch (e) {
      return `❌ Rollback failed: ${e.message.slice(0, 200)}`;
    }
  },

  discard() {
    try {
      git('checkout -- .');
      git('clean -fd');
      return `🗑️ *All changes discarded!*

Working tree is clean. You're back to the last commit.
⏰ ${timestamp()}`;
    } catch (e) {
      return `❌ Discard failed: ${e.message.slice(0, 200)}`;
    }
  },

  backup(intent) {
    const tag = intent.tag || `backup-${Date.now()}`;
    try {
      git(`tag ${tag}`);
      git(`push origin ${tag}`);
      return `💾 *Backup saved!*

🏷️ Tag: ${tag}
Pushed to remote.

To restore later: "restore ${tag}"`;
    } catch (e) {
      return `❌ Backup failed: ${e.message.slice(0, 200)}`;
    }
  },

  restore(intent) {
    if (!intent.tag) return '⚠️ Which backup? Try: "restore v1.0" or "show tags" to see all backups.';
    try {
      git(`checkout ${intent.tag.trim()} -- .`);
      return `♻️ *Restored from ${intent.tag}!*\n\nFiles restored. Say "deploy" to push live.`;
    } catch (e) {
      return `❌ Restore failed: ${e.message.slice(0, 200)}`;
    }
  },

  tags() {
    const tags = git('tag -l');
    if (!tags) return '📌 No backups found. Say "backup as v1.0" to create one.';
    return `📌 *Saved Backups*\n\n${tags.split('\n').map(t => `• ${t}`).join('\n')}\n\nSay "restore <tag>" to go back to any version.`;
  },

  site() {
    return `🌐 *Maxhope.AI*

Live site: ${GITHUB_PAGES_URL}
Repository: ${REPO_URL}
Hosting: GitHub Pages (auto-deploy from master)

Pages:
${Object.entries(PROJECT_CONTEXT.structure.pages).map(([f, d]) => `• ${f} — ${d}`).join('\n')}

Tools:
${Object.entries(PROJECT_CONTEXT.structure.tools).map(([f, d]) => `• ${f.replace('tools/', '')} — ${d}`).join('\n')}`;
  },

  ping() {
    return `🏓 Hey! I'm alive and watching your project.

📂 ${PROJECT_DIR}
🌐 ${GITHUB_PAGES_URL}
⏰ ${timestamp()}

Just tell me what you need!`;
  },

  unknown(intent) {
    return `🤔 I'm not sure what you mean by "${intent.original.slice(0, 80)}".

I can help with:
• "status" — check project state
• "deploy" — push changes live
• "read index.html" — view a file
• "change X to Y in file" — edit code
• "help" — see everything I can do

Just talk naturally — no special commands needed!`;
  }
};

// ---- Start Bot ----
async function startBot() {
  const config = loadConfig();

  if (!config.token) {
    console.log('\n╔═══════════════════════════════════════════════╗');
    console.log('║   Maxhope.AI — Telegram Chat-to-Action Bot    ║');
    console.log('╠═══════════════════════════════════════════════╣');
    console.log('║                                               ║');
    console.log('║  1. Open Telegram → search @BotFather         ║');
    console.log('║  2. Send /newbot                              ║');
    console.log('║  3. Name it (e.g. "Maxhope AI")               ║');
    console.log('║  4. Username (e.g. maxhope_ai_bot)            ║');
    console.log('║  5. Copy the API token it gives you           ║');
    console.log('║                                               ║');
    console.log('╚═══════════════════════════════════════════════╝\n');

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const token = await new Promise(resolve => {
      rl.question('🔑 Paste your Telegram Bot API token: ', (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });

    config.token = token;
    saveConfig(config);
    console.log('✅ Token saved!\n');
  }

  const bot = new TelegramBot(config.token, { polling: true });
  const me = await bot.getMe();

  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log('║   ✅  BOT IS READY — CHAT-TO-ACTION MODE      ║');
  console.log('║                                               ║');
  console.log(`║   Bot: @${me.username.padEnd(38)}║`);
  console.log(`║   Time: ${timestamp().padEnd(37)}║`);
  console.log('║                                               ║');
  console.log('║   Just type naturally in Telegram!             ║');
  console.log('║   "deploy" / "status" / "read index.html"      ║');
  console.log('║                                               ║');
  console.log(`║   Project: Maxhope.AI                          ║`);
  console.log(`║   Live: ${GITHUB_PAGES_URL.padEnd(38)}║`);
  console.log('╚═══════════════════════════════════════════════╝\n');

  if (config.ownerId) {
    console.log(`🔒 Locked to owner ID: ${config.ownerId}`);
  } else {
    console.log('⚠️  Send any message to claim ownership.');
  }

  // Message handler
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = (msg.text || '').trim();
    if (!text) return;

    // Owner lock
    if (!config.ownerId) {
      config.ownerId = chatId;
      saveConfig(config);
      console.log(`🔒 Owner set: ${msg.from.first_name} (${chatId})`);
      await bot.sendMessage(chatId,
        `🔒 You're now the owner of this bot. Only you can control it.\n\n🤖 *Maxhope.AI Remote Control*\nJust type what you want done — no commands needed!\n\nTry: "status" or "help"`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    if (chatId !== config.ownerId) {
      await bot.sendMessage(chatId, '⛔ This bot is locked to its owner.');
      return;
    }

    // Skip /start
    if (text === '/start') {
      await bot.sendMessage(chatId,
        `🤖 *Maxhope.AI Remote Control*\n\n📂 ${PROJECT_DIR}\n🌐 ${GITHUB_PAGES_URL}\n\nJust type what you want! Say "help" to see examples.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Parse natural language
    const intent = parseIntent(text);
    console.log(`[${timestamp()}] "${text}" → ${intent.action} | From: ${msg.from.first_name}`);

    // Execute action
    const handler = actions[intent.action];
    if (!handler) {
      await bot.sendMessage(chatId, actions.unknown(intent));
      return;
    }

    try {
      const result = handler(intent);
      // Try markdown first, fall back to plain text
      try {
        await bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
      } catch {
        await bot.sendMessage(chatId, result);
      }
    } catch (e) {
      console.error(`Error: ${e.message}`);
      await bot.sendMessage(chatId, `❌ Something went wrong: ${e.message.slice(0, 200)}`);
    }
  });

  bot.on('polling_error', (error) => {
    if (error.code === 'ETELEGRAM' && error.response?.statusCode === 409) {
      console.error('❌ Another instance is already running. Stop it first.');
      process.exit(1);
    }
    if (error.code !== 'EFATAL') {
      console.error('Polling error:', error.code || error.message);
    }
  });
}

// ---- Run ----
console.log('🚀 Starting Maxhope.AI Chat-to-Action Bot...');
console.log(`📂 Project: ${PROJECT_DIR}\n`);
startBot().catch(e => {
  console.error('❌ Failed to start:', e.message);
  process.exit(1);
});
