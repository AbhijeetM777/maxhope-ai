/* ============================================
   Maxhope.AI — WhatsApp Remote Control Bot
   ============================================
   Send commands from WhatsApp to manage your
   live project: commit, push, edit, deploy.
   ============================================ */

const { Client, LocalAuth } = require('whatsapp-web.js');
const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ---- Configuration ----
const PROJECT_DIR = path.resolve(__dirname, '..');
const GITHUB_PAGES_URL = 'https://abhijeetm777.github.io/maxhope-ai/';
const REPO_URL = 'https://github.com/AbhijeetM777/maxhope-ai';
const BOT_PREFIX = '!';  // Commands start with !
const OWNER_NUMBER = null; // Set to your number like '91XXXXXXXXXX@c.us' to restrict access, null = any sender

// ---- WhatsApp Client (Pairing Code mode) ----
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '.wwebjs_auth') }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  }
});

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

function getFileList(dir, base = '') {
  const entries = fs.readdirSync(path.join(PROJECT_DIR, dir), { withFileTypes: true });
  return entries
    .filter(e => !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== 'whatsapp-bot')
    .map(e => {
      const rel = path.join(base, e.name);
      return e.isDirectory() ? `📁 ${rel}/` : `📄 ${rel}`;
    });
}

// ---- Command Handlers ----
const commands = {

  // --- Status & Info ---
  help: {
    desc: 'Show all commands',
    run() {
      const lines = ['*🤖 Maxhope.AI Remote Control*\n'];
      for (const [name, cmd] of Object.entries(commands)) {
        lines.push(`${BOT_PREFIX}${name} — ${cmd.desc}`);
      }
      lines.push('\n_Send any command to control your live project from WhatsApp._');
      return lines.join('\n');
    }
  },

  status: {
    desc: 'Git status of the project',
    run() {
      const status = git('status --short');
      const branch = git('rev-parse --abbrev-ref HEAD');
      const lastCommit = git('log -1 --format="%h %s (%cr)"');
      return `*📊 Project Status*\n\n` +
        `🔀 Branch: *${branch}*\n` +
        `📝 Last commit: ${lastCommit}\n` +
        `📁 Changes:\n${status || '_(clean — no changes)_'}\n` +
        `🌐 Live: ${GITHUB_PAGES_URL}\n` +
        `⏰ Checked: ${timestamp()}`;
    }
  },

  log: {
    desc: 'Show last 5 commits',
    run() {
      const log = git('log -5 --format="• %h %s (%cr)"');
      return `*📋 Recent Commits*\n\n${log}`;
    }
  },

  diff: {
    desc: 'Show current changes (diff)',
    run() {
      const diff = git('diff --stat');
      if (!diff) return '✅ No changes to show.';
      const full = git('diff --shortstat');
      return `*🔍 Current Changes*\n\n${diff}\n\n${full}`;
    }
  },

  files: {
    desc: 'List project files',
    run() {
      const root = getFileList('.');
      return `*📁 Project Files*\n\n${root.join('\n')}`;
    }
  },

  // --- Git Operations ---
  commit: {
    desc: 'Commit all changes with a message. Usage: !commit Fixed navbar bug',
    run(args) {
      const msg = args || `Update from WhatsApp remote — ${timestamp()}`;
      try {
        git('add -A');
        const status = git('status --short');
        if (!status) return '✅ Nothing to commit — working tree is clean.';
        git(`commit -m "${msg.replace(/"/g, '\\"')}"`);
        const hash = git('log -1 --format="%h"');
        return `✅ *Committed!*\n\n📝 Message: ${msg}\n🔗 Hash: ${hash}\n⏰ ${timestamp()}`;
      } catch (e) {
        return `❌ Commit failed:\n${e.message}`;
      }
    }
  },

  push: {
    desc: 'Push changes to GitHub (goes live on Pages)',
    run() {
      try {
        const result = git('push origin master');
        return `🚀 *Pushed to GitHub!*\n\n${result || 'Up to date.'}\n\n🌐 Live at: ${GITHUB_PAGES_URL}\n⏰ ${timestamp()}`;
      } catch (e) {
        if (e.message.includes('Everything up-to-date')) {
          return '✅ Already up to date — nothing to push.';
        }
        return `❌ Push failed:\n${e.message}`;
      }
    }
  },

  deploy: {
    desc: 'Commit + Push in one go. Usage: !deploy Updated homepage design',
    run(args) {
      const commitMsg = args || `Deploy from WhatsApp — ${timestamp()}`;
      try {
        git('add -A');
        const status = git('status --short');
        if (!status) return '✅ Nothing to deploy — working tree is clean.';
        git(`commit -m "${commitMsg.replace(/"/g, '\\"')}"`);
        const hash = git('log -1 --format="%h"');

        let pushResult;
        try {
          pushResult = git('push origin master');
        } catch (pe) {
          pushResult = pe.message.includes('Everything up-to-date') ? 'Already up to date.' : pe.message;
        }

        return `🚀 *Deployed!*\n\n` +
          `📝 Commit: ${commitMsg}\n` +
          `🔗 Hash: ${hash}\n` +
          `📤 Push: ${pushResult || 'Success'}\n` +
          `🌐 Live: ${GITHUB_PAGES_URL}\n` +
          `⏰ ${timestamp()}`;
      } catch (e) {
        return `❌ Deploy failed:\n${e.message}`;
      }
    }
  },

  rollback: {
    desc: 'Revert the last commit (keeps changes unstaged)',
    run() {
      try {
        const before = git('log -1 --format="%h %s"');
        git('reset HEAD~1');
        return `⏪ *Rolled back!*\n\nReverted: ${before}\n⚠️ Changes are unstaged. Use !deploy to re-commit or !discard to remove.`;
      } catch (e) {
        return `❌ Rollback failed:\n${e.message}`;
      }
    }
  },

  discard: {
    desc: 'Discard ALL uncommitted changes (⚠️ destructive)',
    run() {
      try {
        git('checkout -- .');
        git('clean -fd');
        return `🗑️ *All changes discarded.*\n\nWorking tree is now clean.\n⏰ ${timestamp()}`;
      } catch (e) {
        return `❌ Discard failed:\n${e.message}`;
      }
    }
  },

  // --- File Operations ---
  read: {
    desc: 'Read a file. Usage: !read index.html',
    run(args) {
      if (!args) return '⚠️ Specify a file. Example: !read index.html';
      const filePath = path.join(PROJECT_DIR, args.trim());
      if (!fs.existsSync(filePath)) return `❌ File not found: ${args}`;
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.length > 3000) {
          const lines = content.split('\n');
          return `*📄 ${args}* (${lines.length} lines, showing first 80)\n\n\`\`\`\n${lines.slice(0, 80).join('\n')}\n\`\`\`\n\n_File truncated. Use !readlines ${args} 80 160 for next chunk._`;
        }
        return `*📄 ${args}*\n\n\`\`\`\n${content}\n\`\`\``;
      } catch (e) {
        return `❌ Error reading file:\n${e.message}`;
      }
    }
  },

  readlines: {
    desc: 'Read specific lines. Usage: !readlines index.html 10 30',
    run(args) {
      const parts = args.split(/\s+/);
      if (parts.length < 3) return '⚠️ Usage: !readlines <file> <start> <end>';
      const [file, start, end] = parts;
      const filePath = path.join(PROJECT_DIR, file);
      if (!fs.existsSync(filePath)) return `❌ File not found: ${file}`;
      try {
        const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
        const s = Math.max(0, parseInt(start) - 1);
        const e = Math.min(lines.length, parseInt(end));
        return `*📄 ${file}* (lines ${s + 1}–${e})\n\n\`\`\`\n${lines.slice(s, e).join('\n')}\n\`\`\``;
      } catch (e) {
        return `❌ Error:\n${e.message}`;
      }
    }
  },

  edit: {
    desc: 'Replace text in a file. Usage: !edit <file> ||| old text ||| new text',
    run(args) {
      const parts = args.split('|||').map(s => s.trim());
      if (parts.length !== 3) return '⚠️ Usage: !edit <file> ||| old text ||| new text';
      const [file, oldText, newText] = parts;
      const filePath = path.join(PROJECT_DIR, file);
      if (!fs.existsSync(filePath)) return `❌ File not found: ${file}`;
      try {
        let content = fs.readFileSync(filePath, 'utf-8');
        if (!content.includes(oldText)) return `❌ Text not found in ${file}. Make sure it matches exactly.`;
        content = content.replace(oldText, newText);
        fs.writeFileSync(filePath, content, 'utf-8');
        return `✅ *Edited ${file}*\n\n🔴 Removed: "${oldText.slice(0, 100)}"\n🟢 Added: "${newText.slice(0, 100)}"\n\n_Use !deploy to push live._`;
      } catch (e) {
        return `❌ Edit failed:\n${e.message}`;
      }
    }
  },

  create: {
    desc: 'Create a new file. Usage: !create <file> ||| content here',
    run(args) {
      const sep = args.indexOf('|||');
      if (sep === -1) return '⚠️ Usage: !create <file> ||| file content here';
      const file = args.slice(0, sep).trim();
      const content = args.slice(sep + 3).trim();
      const filePath = path.join(PROJECT_DIR, file);
      try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, content, 'utf-8');
        return `✅ *Created ${file}*\n\n${content.length} chars written.\n_Use !deploy to push live._`;
      } catch (e) {
        return `❌ Create failed:\n${e.message}`;
      }
    }
  },

  delete: {
    desc: 'Delete a file. Usage: !delete <file>',
    run(args) {
      if (!args) return '⚠️ Specify a file. Example: !delete old-page.html';
      const filePath = path.join(PROJECT_DIR, args.trim());
      if (!fs.existsSync(filePath)) return `❌ File not found: ${args}`;
      // Safety: prevent deleting critical files
      const blocked = ['index.html', 'js/app.js', 'css/style.css', 'whatsapp-bot'];
      if (blocked.some(b => args.trim().startsWith(b))) {
        return `⚠️ Cannot delete protected file: ${args}\nProtected: ${blocked.join(', ')}`;
      }
      try {
        fs.unlinkSync(filePath);
        return `🗑️ *Deleted ${args}*\n\n_Use !deploy to push live._`;
      } catch (e) {
        return `❌ Delete failed:\n${e.message}`;
      }
    }
  },

  // --- Quick Actions ---
  site: {
    desc: 'Get the live site URL',
    run() {
      return `🌐 *Maxhope.AI Live Site*\n\n${GITHUB_PAGES_URL}\n\n📂 Repo: ${REPO_URL}`;
    }
  },

  backup: {
    desc: 'Create a backup tag. Usage: !backup v2.0',
    run(args) {
      const tag = args || `backup-${Date.now()}`;
      try {
        git(`tag ${tag}`);
        git(`push origin ${tag}`);
        return `💾 *Backup created!*\n\nTag: ${tag}\nPushed to remote.\n\nRestore with: !restore ${tag}`;
      } catch (e) {
        return `❌ Backup failed:\n${e.message}`;
      }
    }
  },

  restore: {
    desc: 'Restore from a backup tag. Usage: !restore backup-v1.0',
    run(args) {
      if (!args) return '⚠️ Specify a tag. Example: !restore backup-v1.0';
      try {
        git(`checkout ${args.trim()} -- .`);
        return `♻️ *Restored from ${args}!*\n\nFiles restored. Use !deploy to push live.`;
      } catch (e) {
        return `❌ Restore failed:\n${e.message}`;
      }
    }
  },

  tags: {
    desc: 'List all backup tags',
    run() {
      const tags = git('tag -l');
      if (!tags) return '📌 No tags/backups found.';
      return `*📌 Backup Tags*\n\n${tags.split('\n').map(t => `• ${t}`).join('\n')}`;
    }
  },

  ping: {
    desc: 'Check if bot is alive',
    run() {
      return `🏓 *Pong!*\n\nBot is running.\n⏰ ${timestamp()}\n📂 Project: ${PROJECT_DIR}`;
    }
  }
};

// ---- Message Handler ----
client.on('message', async (msg) => {
  // Ignore group messages, only process direct messages
  if (msg.from.includes('@g.us')) return;

  // Owner restriction (optional)
  if (OWNER_NUMBER && msg.from !== OWNER_NUMBER) return;

  const body = msg.body.trim();

  // Must start with prefix
  if (!body.startsWith(BOT_PREFIX)) return;

  const parts = body.slice(BOT_PREFIX.length).trim().split(/\s+/);
  const cmdName = parts[0].toLowerCase();
  const args = body.slice(BOT_PREFIX.length + cmdName.length).trim();

  const cmd = commands[cmdName];
  if (!cmd) {
    await msg.reply(`❓ Unknown command: *${cmdName}*\n\nType ${BOT_PREFIX}help to see all commands.`);
    return;
  }

  console.log(`[${timestamp()}] Command: ${cmdName} | From: ${msg.from} | Args: ${args}`);

  try {
    const result = cmd.run(args);
    await msg.reply(result);
  } catch (e) {
    await msg.reply(`❌ Error executing *${cmdName}*:\n${e.message}`);
  }
});

// ---- Pairing Code Auth ----
let pairingPhoneNumber = null;
let pairingCodeRequested = false;

client.on('qr', async () => {
  if (pairingCodeRequested) return; // only request once
  pairingCodeRequested = true;

  // Small delay to let WhatsApp Web fully load
  await new Promise(r => setTimeout(r, 3000));

  try {
    const code = await client.requestPairingCode(pairingPhoneNumber, true);
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║      YOUR WHATSAPP PAIRING CODE      ║');
    console.log('╠══════════════════════════════════════╣');
    console.log(`║                                      ║`);
    console.log(`║            ${code}                    ║`);
    console.log(`║                                      ║`);
    console.log('╠══════════════════════════════════════╣');
    console.log('║  WhatsApp → Linked Devices →         ║');
    console.log('║  Link a Device → Link with phone     ║');
    console.log('║  number instead → Enter code above   ║');
    console.log('╚══════════════════════════════════════╝\n');
  } catch (e) {
    console.error('❌ Failed to get pairing code:', e.message);
    pairingCodeRequested = false; // allow retry
  }
});

client.on('ready', () => {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  ✅  WHATSAPP BOT IS READY!          ║');
  console.log('║                                      ║');
  console.log('║  Send !help from your WhatsApp to    ║');
  console.log('║  see all available commands.          ║');
  console.log('║                                      ║');
  console.log('║  Project: Maxhope.AI                 ║');
  console.log(`║  Time: ${timestamp().padEnd(28)}║`);
  console.log('╚══════════════════════════════════════╝\n');
});

client.on('auth_failure', (msg) => {
  console.error('❌ Authentication failed:', msg);
});

client.on('disconnected', (reason) => {
  console.log('📴 Disconnected:', reason);
  console.log('Reconnecting in 5 seconds...');
  setTimeout(() => client.initialize(), 5000);
});

// ---- Start ----
console.log('🚀 Starting Maxhope.AI WhatsApp Remote Control...');
console.log(`📂 Project: ${PROJECT_DIR}\n`);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('📱 Enter your WhatsApp number with country code (e.g. 919876543210): ', (number) => {
  rl.close();
  pairingPhoneNumber = number.replace(/[^0-9]/g, '');
  console.log(`\n⏳ Connecting to WhatsApp for +${pairingPhoneNumber}...`);
  console.log('⏳ This may take 15-30 seconds, please wait...\n');
  client.initialize();
});
