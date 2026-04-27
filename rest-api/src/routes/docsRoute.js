const { Router } = require('express');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const router = Router();

// Configure marked for better output
marked.setOptions({
  gfm: true,
  breaks: true,
});

router.get('/', (_req, res) => {
  try {
    const mdPath = path.join(__dirname, '..', '..', 'API_DOCS.md');
    const markdown = fs.readFileSync(mdPath, 'utf-8');
    const htmlContent = marked(markdown);

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IT Helpdesk API Documentation</title>
  <style>
    /* ===== CSS Reset & Base ===== */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #ffffff;
      --bg-secondary: #f8fafc;
      --bg-code: #f1f5f9;
      --bg-code-block: #0f172a;
      --bg-table-header: #f1f5f9;
      --bg-table-stripe: #f8fafc;
      --bg-blockquote: #eff6ff;
      --bg-badge: #dbeafe;
      --text: #0f172a;
      --text-secondary: #475569;
      --text-muted: #94a3b8;
      --text-code: #e2e8f0;
      --text-code-inline: #be185d;
      --border: #e2e8f0;
      --border-blockquote: #3b82f6;
      --accent: #3b82f6;
      --accent-light: #dbeafe;
      --shadow: rgba(0,0,0,0.04);
      --method-get: #16a34a;
      --method-post: #2563eb;
      --method-put: #d97706;
      --method-patch: #7c3aed;
      --method-delete: #dc2626;
      --scrollbar-bg: #f1f5f9;
      --scrollbar-thumb: #cbd5e1;
    }

    .dark {
      --bg: #0f172a;
      --bg-secondary: #1e293b;
      --bg-code: #1e293b;
      --bg-code-block: #020617;
      --bg-table-header: #1e293b;
      --bg-table-stripe: #162032;
      --bg-blockquote: #172554;
      --bg-badge: #1e3a5f;
      --text: #e2e8f0;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;
      --text-code: #e2e8f0;
      --text-code-inline: #f472b6;
      --border: #334155;
      --border-blockquote: #3b82f6;
      --accent: #60a5fa;
      --accent-light: #1e3a5f;
      --shadow: rgba(0,0,0,0.2);
      --scrollbar-bg: #1e293b;
      --scrollbar-thumb: #475569;
    }

    html { scroll-behavior: smooth; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.7;
      transition: background 0.2s, color 0.2s;
    }

    /* ===== Scrollbar ===== */
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: var(--scrollbar-bg); }
    ::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 4px; }

    /* ===== Layout ===== */
    .top-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--bg);
      border-bottom: 1px solid var(--border);
      backdrop-filter: blur(12px);
      padding: 0 1.5rem;
    }
    .top-bar-inner {
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 56px;
    }
    .top-bar-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .top-bar-title span { color: var(--accent); }
    .top-bar-actions { display: flex; align-items: center; gap: 8px; }

    .theme-btn {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      color: var(--text-secondary);
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.15s;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .theme-btn:hover { border-color: var(--accent); color: var(--accent); }

    .wrapper {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem 1.5rem 4rem;
    }

    /* ===== Typography ===== */
    .content h1 {
      font-size: 2rem;
      font-weight: 800;
      margin: 2.5rem 0 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid var(--border);
      color: var(--text);
    }
    .content h1:first-child { margin-top: 0; }

    .content h2 {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 2.5rem 0 0.75rem;
      padding-bottom: 0.4rem;
      border-bottom: 1px solid var(--border);
      color: var(--text);
    }

    .content h3 {
      font-size: 1.15rem;
      font-weight: 600;
      margin: 2rem 0 0.5rem;
      color: var(--text);
    }

    .content h4 {
      font-size: 1rem;
      font-weight: 600;
      margin: 1.5rem 0 0.4rem;
      color: var(--text-secondary);
    }

    .content p {
      margin: 0.6rem 0;
      color: var(--text-secondary);
    }

    .content strong { color: var(--text); font-weight: 600; }

    .content a {
      color: var(--accent);
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: border-color 0.15s;
    }
    .content a:hover { border-bottom-color: var(--accent); }

    .content hr {
      border: none;
      border-top: 1px solid var(--border);
      margin: 2rem 0;
    }

    .content ul, .content ol {
      margin: 0.5rem 0;
      padding-left: 1.5rem;
      color: var(--text-secondary);
    }
    .content li { margin: 0.25rem 0; }

    /* ===== Code ===== */
    .content code {
      font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace;
      font-size: 0.85em;
      background: var(--bg-code);
      color: var(--text-code-inline);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid var(--border);
    }

    .content pre {
      background: var(--bg-code-block);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1rem 1.25rem;
      overflow-x: auto;
      margin: 0.75rem 0;
      position: relative;
    }
    .content pre code {
      background: none;
      border: none;
      padding: 0;
      color: var(--text-code);
      font-size: 0.82rem;
      line-height: 1.6;
    }

    /* ===== Tables ===== */
    .content table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.75rem 0;
      font-size: 0.88rem;
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
    }
    .content thead th {
      background: var(--bg-table-header);
      color: var(--text);
      font-weight: 600;
      text-align: left;
      padding: 10px 14px;
      border-bottom: 2px solid var(--border);
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .content tbody td {
      padding: 9px 14px;
      border-bottom: 1px solid var(--border);
      color: var(--text-secondary);
      vertical-align: top;
    }
    .content tbody tr:nth-child(even) { background: var(--bg-table-stripe); }
    .content tbody tr:last-child td { border-bottom: none; }

    /* ===== Blockquotes ===== */
    .content blockquote {
      background: var(--bg-blockquote);
      border-left: 4px solid var(--border-blockquote);
      border-radius: 0 8px 8px 0;
      padding: 0.75rem 1rem;
      margin: 0.75rem 0;
    }
    .content blockquote p {
      color: var(--text-secondary);
      margin: 0;
      font-size: 0.9rem;
    }
    .content blockquote strong { color: var(--text); }

    /* ===== Responsive ===== */
    @media (max-width: 640px) {
      .wrapper { padding: 1rem 1rem 3rem; }
      .content h1 { font-size: 1.5rem; }
      .content h2 { font-size: 1.25rem; }
      .content h3 { font-size: 1.05rem; }
      .content pre { padding: 0.75rem; font-size: 0.78rem; }
      .content table { font-size: 0.8rem; }
      .content thead th, .content tbody td { padding: 7px 10px; }
      .top-bar-title { font-size: 0.88rem; }
    }

    /* Table wrapper for horizontal scroll on mobile */
    .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  </style>
</head>
<body>
  <!-- Top Bar -->
  <div class="top-bar">
    <div class="top-bar-inner">
      <div class="top-bar-title">
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="currentColor" style="color:var(--accent)"/><path d="M8 18v-2a8 8 0 0116 0v2" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><rect x="6" y="17" width="4" height="6" rx="1.5" fill="#fff"/><rect x="22" y="17" width="4" height="6" rx="1.5" fill="#fff"/></svg>
        <span>API</span> Docs
      </div>
      <div class="top-bar-actions">
        <button class="theme-btn" onclick="toggleTheme()" id="themeBtn">🌙 Dark</button>
        <a href="/api/v1" class="theme-btn" style="text-decoration:none">⚡ API</a>
      </div>
    </div>
  </div>

  <!-- Content -->
  <div class="wrapper">
    <div class="content" id="content">
      ${htmlContent}
    </div>
  </div>

  <script>
    // Theme toggle
    function getTheme() {
      return localStorage.getItem('api-docs-theme') || 'light';
    }
    function applyTheme(t) {
      document.body.classList.toggle('dark', t === 'dark');
      document.getElementById('themeBtn').textContent = t === 'dark' ? '☀️ Light' : '🌙 Dark';
      localStorage.setItem('api-docs-theme', t);
    }
    function toggleTheme() {
      applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
    }
    applyTheme(getTheme());

    // Wrap tables for mobile scroll
    document.querySelectorAll('.content table').forEach(function(table) {
      if (!table.parentElement.classList.contains('table-wrap')) {
        var wrapper = document.createElement('div');
        wrapper.className = 'table-wrap';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }
    });

    // Add copy button to code blocks
    document.querySelectorAll('.content pre').forEach(function(pre) {
      var btn = document.createElement('button');
      btn.textContent = 'Copy';
      btn.style.cssText = 'position:absolute;top:8px;right:8px;background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-muted);border-radius:6px;padding:3px 10px;font-size:0.72rem;cursor:pointer;opacity:0;transition:opacity 0.15s;';
      btn.onclick = function() {
        var code = pre.querySelector('code');
        navigator.clipboard.writeText(code.textContent).then(function() {
          btn.textContent = 'Copied!';
          btn.style.color = 'var(--method-get)';
          setTimeout(function() { btn.textContent = 'Copy'; btn.style.color = 'var(--text-muted)'; }, 1500);
        });
      };
      pre.style.position = 'relative';
      pre.appendChild(btn);
      pre.onmouseenter = function() { btn.style.opacity = '1'; };
      pre.onmouseleave = function() { btn.style.opacity = '0'; };
    });
  </script>
</body>
</html>`;

    res.type('html').send(html);
  } catch (err) {
    res.status(500).json({ error: true, message: 'Gagal memuat dokumentasi' });
  }
});

module.exports = router;
