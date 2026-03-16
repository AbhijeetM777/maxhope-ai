/* ============================================
   Maxhope.AI — My Projects Page
   ============================================ */

const ProjectsPage = {
  currentFilter: 'all',

  init() {
    if (!Auth.requireAuth()) return;
    this.render();
  },

  render() {
    const all = JSON.parse(localStorage.getItem('nexusai_projects') || '[]');
    const filtered = this.currentFilter === 'all'
      ? all
      : all.filter(p => p.type === this.currentFilter);

    const grid = document.getElementById('projects-grid');
    const empty = document.getElementById('empty-state');
    const badge = document.getElementById('project-count-badge');

    if (badge) badge.textContent = `${all.length} project${all.length !== 1 ? 's' : ''} total`;

    if (!filtered.length) {
      grid.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');

    const icons = {
      automation: '&#9889;', website: '&#127760;', chatbot: '&#129302;',
      microsaas: '&#128200;', email: '&#128231;', cloud: '&#9729;&#65039;', content: '&#9997;&#65039;'
    };

    const colors = {
      automation: 'var(--gold)', website: 'var(--blue)', chatbot: 'var(--green)',
      microsaas: 'var(--purple)', email: 'var(--gold)', cloud: 'var(--blue)', content: 'var(--green)'
    };

    const labels = {
      automation: 'Automation', website: 'Website', chatbot: 'Chatbot',
      microsaas: 'SaaS Blueprint', email: 'Email Campaign', cloud: 'Cloud Report', content: 'Content'
    };

    const toolLinks = {
      automation: 'tools/automation.html', website: 'tools/website-builder.html',
      chatbot: 'tools/chatbot.html', microsaas: 'tools/microsaas.html',
      email: 'tools/email-outreach.html', cloud: 'tools/cloud-consulting.html',
      content: 'tools/content-studio.html'
    };

    grid.innerHTML = filtered.map(p => {
      const date = new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const time = new Date(p.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const liveUrl = `https://app.maxhope.ai/${p.type}/${p.id}`;
      const icon = icons[p.type] || '&#128196;';
      const color = colors[p.type] || 'var(--accent)';
      const label = labels[p.type] || 'Project';

      return `
        <div class="card project-card" style="border-top:3px solid ${color};position:relative;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
            <div style="font-size:28px;">${icon}</div>
            <span class="tag tag-green" style="font-size:10px;">&#9679; Live</span>
          </div>
          <h4 style="margin-bottom:4px;font-size:15px;">${p.name}</h4>
          <p style="font-size:12px;color:var(--muted);margin-bottom:8px;">${p.description || label}</p>
          <div style="font-size:11px;color:var(--dim);margin-bottom:16px;">${date} at ${time}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;">
            <span class="tag" style="background:${color}20;color:${color};border:1px solid ${color}40;">${label}</span>
          </div>
          <div style="font-size:11px;color:var(--dim);margin-bottom:14px;word-break:break-all;">
            <span style="color:var(--muted);">URL:</span> <code style="color:var(--accent);">${liveUrl}</code>
          </div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-primary btn-sm" style="flex:1;" onclick="copyToClipboard('${liveUrl}')">Copy Link</button>
            <a href="${toolLinks[p.type] || 'dashboard.html'}" class="btn btn-secondary btn-sm" style="flex:1;text-align:center;">Open Tool</a>
            <button class="btn btn-ghost btn-sm" onclick="ProjectsPage.deleteProject('${p.id}')" title="Delete" style="color:var(--red);">&#128465;</button>
          </div>
        </div>`;
    }).join('');
  },

  deleteProject(id) {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    const projects = JSON.parse(localStorage.getItem('nexusai_projects') || '[]').filter(p => p.id !== id);
    localStorage.setItem('nexusai_projects', JSON.stringify(projects));
    showToast('Project deleted', 'info');
    this.render();
  }
};

function filterProjects(type, btn) {
  ProjectsPage.currentFilter = type;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  ProjectsPage.render();
}

// copyToClipboard may not be available on this page (it's in tools.js)
if (typeof copyToClipboard === 'undefined') {
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Failed to copy', 'error');
    });
  }
}

document.addEventListener('DOMContentLoaded', () => ProjectsPage.init());
