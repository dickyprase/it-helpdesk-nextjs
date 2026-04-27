const { Router } = require('express');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const router = Router();
marked.setOptions({ gfm: true, breaks: true });

const DOCS_DIR = path.join(__dirname, '..', '..', 'docs');

const PAGES = [
  { slug: 'overview',  file: '01-overview.md',  title: 'Overview',       icon: '📋' },
  { slug: 'flow',      file: '02-flow.md',      title: 'Alur Aplikasi',  icon: '🔄' },
  { slug: 'database',  file: '03-database.md',  title: 'Database & ERD', icon: '🗄️' },
  { slug: 'endpoints', file: '04-endpoints.md', title: 'API Endpoints',  icon: '⚡' },
];

function renderPage(activePage) {
  const page = PAGES.find(p => p.slug === activePage) || PAGES[0];
  const mdPath = path.join(DOCS_DIR, page.file);
  const markdown = fs.readFileSync(mdPath, 'utf-8');
  const htmlContent = marked(markdown);

  const sidebarItems = PAGES.map(p => {
    const active = p.slug === page.slug;
    return `<a href="/docs/${p.slug}" class="nav-item ${active ? 'active' : ''}">${p.icon} ${p.title}</a>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${page.title} — IT Helpdesk API</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#fff;--bg2:#f8fafc;--bg3:#f1f5f9;--bg-code:#0f172a;
  --bg-tbl-h:#f1f5f9;--bg-tbl-s:#f8fafc;--bg-bq:#eff6ff;
  --c:#0f172a;--c2:#475569;--c3:#94a3b8;--c-code:#e2e8f0;--c-code-i:#be185d;
  --b:#e2e8f0;--b-bq:#3b82f6;--accent:#3b82f6;
  --sb-bg:#f8fafc;--sb-thumb:#cbd5e1;
  --sidebar-bg:#fff;--sidebar-w:260px;
}
.dark{
  --bg:#0f172a;--bg2:#1e293b;--bg3:#1e293b;--bg-code:#020617;
  --bg-tbl-h:#1e293b;--bg-tbl-s:#162032;--bg-bq:#172554;
  --c:#e2e8f0;--c2:#94a3b8;--c3:#64748b;--c-code:#e2e8f0;--c-code-i:#f472b6;
  --b:#334155;--b-bq:#3b82f6;--accent:#60a5fa;
  --sb-bg:#1e293b;--sb-thumb:#475569;
  --sidebar-bg:#0f172a;
}
html{scroll-behavior:smooth}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--c);line-height:1.7;transition:background .2s,color .2s}
::-webkit-scrollbar{width:7px;height:7px}
::-webkit-scrollbar-track{background:var(--sb-bg)}
::-webkit-scrollbar-thumb{background:var(--sb-thumb);border-radius:4px}

/* ===== Top Bar ===== */
.topbar{position:sticky;top:0;z-index:200;background:var(--bg);border-bottom:1px solid var(--b);height:52px;display:flex;align-items:center;padding:0 1rem}
.topbar-inner{width:100%;display:flex;align-items:center;justify-content:space-between}
.topbar-left{display:flex;align-items:center;gap:8px;font-weight:700;font-size:.95rem;color:var(--c)}
.topbar-left span{color:var(--accent)}
.topbar-right{display:flex;align-items:center;gap:6px}
.btn{background:var(--bg2);border:1px solid var(--b);color:var(--c2);border-radius:7px;padding:5px 11px;font-size:.78rem;cursor:pointer;transition:all .15s;text-decoration:none;display:flex;align-items:center;gap:4px}
.btn:hover{border-color:var(--accent);color:var(--accent)}
.menu-btn{display:none;background:none;border:none;color:var(--c2);font-size:1.3rem;cursor:pointer;padding:4px}

/* ===== Layout ===== */
.layout{display:flex;min-height:calc(100vh - 52px)}

/* ===== Sidebar ===== */
.sidebar{width:var(--sidebar-w);border-right:1px solid var(--b);background:var(--sidebar-bg);padding:1.25rem 0;position:sticky;top:52px;height:calc(100vh - 52px);overflow-y:auto;flex-shrink:0;transition:transform .25s}
.sidebar-label{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--c3);padding:0 1.25rem;margin:1rem 0 .4rem}
.sidebar-label:first-child{margin-top:0}
.nav-item{display:flex;align-items:center;gap:8px;padding:8px 1.25rem;font-size:.88rem;color:var(--c2);text-decoration:none;border-left:3px solid transparent;transition:all .12s}
.nav-item:hover{background:var(--bg2);color:var(--c)}
.nav-item.active{background:var(--bg2);color:var(--accent);border-left-color:var(--accent);font-weight:600}

/* ===== Main ===== */
.main{flex:1;min-width:0;padding:2rem 2.5rem 4rem;max-width:860px}

/* ===== Content ===== */
.content h1{font-size:1.85rem;font-weight:800;margin:2rem 0 .6rem;padding-bottom:.4rem;border-bottom:2px solid var(--b);color:var(--c)}
.content h1:first-child{margin-top:0}
.content h2{font-size:1.35rem;font-weight:700;margin:2.2rem 0 .6rem;padding-bottom:.35rem;border-bottom:1px solid var(--b);color:var(--c)}
.content h3{font-size:1.08rem;font-weight:600;margin:1.8rem 0 .4rem;color:var(--c)}
.content h4{font-size:.95rem;font-weight:600;margin:1.2rem 0 .3rem;color:var(--c2)}
.content p{margin:.5rem 0;color:var(--c2)}
.content strong{color:var(--c);font-weight:600}
.content a{color:var(--accent);text-decoration:none}
.content a:hover{text-decoration:underline}
.content hr{border:none;border-top:1px solid var(--b);margin:1.8rem 0}
.content ul,.content ol{margin:.4rem 0;padding-left:1.4rem;color:var(--c2)}
.content li{margin:.2rem 0}
.content code{font-family:'SF Mono','Fira Code',Consolas,monospace;font-size:.84em;background:var(--bg3);color:var(--c-code-i);padding:1.5px 5px;border-radius:4px;border:1px solid var(--b)}
.content pre{background:var(--bg-code);border:1px solid var(--b);border-radius:9px;padding:.9rem 1.1rem;overflow-x:auto;margin:.65rem 0;position:relative}
.content pre code{background:none;border:none;padding:0;color:var(--c-code);font-size:.8rem;line-height:1.6}
.table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
.content table{width:100%;border-collapse:collapse;margin:.65rem 0;font-size:.85rem;border:1px solid var(--b);border-radius:9px;overflow:hidden}
.content thead th{background:var(--bg-tbl-h);color:var(--c);font-weight:600;text-align:left;padding:9px 12px;border-bottom:2px solid var(--b);font-size:.78rem;text-transform:uppercase;letter-spacing:.03em}
.content tbody td{padding:8px 12px;border-bottom:1px solid var(--b);color:var(--c2);vertical-align:top}
.content tbody tr:nth-child(even){background:var(--bg-tbl-s)}
.content tbody tr:last-child td{border-bottom:none}
.content blockquote{background:var(--bg-bq);border-left:4px solid var(--b-bq);border-radius:0 7px 7px 0;padding:.65rem .9rem;margin:.65rem 0}
.content blockquote p{color:var(--c2);margin:0;font-size:.88rem}
.content blockquote strong{color:var(--c)}

/* ===== Mobile ===== */
@media(max-width:768px){
  .sidebar{position:fixed;top:52px;left:0;bottom:0;z-index:150;transform:translateX(-100%);width:280px;box-shadow:4px 0 20px rgba(0,0,0,.15)}
  .sidebar.open{transform:translateX(0)}
  .overlay{display:none;position:fixed;inset:0;top:52px;z-index:140;background:rgba(0,0,0,.4)}
  .overlay.show{display:block}
  .menu-btn{display:block}
  .main{padding:1.2rem 1rem 3rem}
  .content h1{font-size:1.4rem}
  .content h2{font-size:1.15rem}
  .content h3{font-size:1rem}
  .content pre{padding:.7rem;font-size:.75rem}
  .content table{font-size:.78rem}
  .content thead th,.content tbody td{padding:6px 8px}
}
</style>
</head>
<body>
<!-- Top Bar -->
<div class="topbar">
  <div class="topbar-inner">
    <div class="topbar-left">
      <button class="menu-btn" onclick="toggleSidebar()" aria-label="Menu">☰</button>
      <svg width="18" height="18" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="currentColor" style="color:var(--accent)"/><path d="M8 18v-2a8 8 0 0116 0v2" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><rect x="6" y="17" width="4" height="6" rx="1.5" fill="#fff"/><rect x="22" y="17" width="4" height="6" rx="1.5" fill="#fff"/></svg>
      <span>API</span> Docs
    </div>
    <div class="topbar-right">
      <button class="btn" onclick="toggleTheme()" id="themeBtn">🌙 Dark</button>
      <a href="/api/v1" class="btn">⚡ API</a>
    </div>
  </div>
</div>

<!-- Overlay for mobile sidebar -->
<div class="overlay" id="overlay" onclick="closeSidebar()"></div>

<!-- Layout -->
<div class="layout">
  <!-- Sidebar -->
  <nav class="sidebar" id="sidebar">
    <div class="sidebar-label">Dokumentasi</div>
    ${sidebarItems}
  </nav>

  <!-- Main Content -->
  <main class="main">
    <div class="content" id="content">
      ${htmlContent}
    </div>
  </main>
</div>

<script>
function getTheme(){return localStorage.getItem('api-docs-theme')||'light'}
function applyTheme(t){document.body.classList.toggle('dark',t==='dark');document.getElementById('themeBtn').textContent=t==='dark'?'☀️ Light':'🌙 Dark';localStorage.setItem('api-docs-theme',t)}
function toggleTheme(){applyTheme(getTheme()==='dark'?'light':'dark')}
applyTheme(getTheme());

function toggleSidebar(){document.getElementById('sidebar').classList.toggle('open');document.getElementById('overlay').classList.toggle('show')}
function closeSidebar(){document.getElementById('sidebar').classList.remove('open');document.getElementById('overlay').classList.remove('show')}

// Wrap tables
document.querySelectorAll('.content table').forEach(function(t){if(!t.parentElement.classList.contains('table-wrap')){var w=document.createElement('div');w.className='table-wrap';t.parentNode.insertBefore(w,t);w.appendChild(t)}});

// Copy buttons
document.querySelectorAll('.content pre').forEach(function(pre){var btn=document.createElement('button');btn.textContent='Copy';btn.style.cssText='position:absolute;top:7px;right:7px;background:var(--bg2);border:1px solid var(--b);color:var(--c3);border-radius:5px;padding:2px 9px;font-size:.7rem;cursor:pointer;opacity:0;transition:opacity .15s';btn.onclick=function(){var c=pre.querySelector('code');navigator.clipboard.writeText(c.textContent).then(function(){btn.textContent='Copied!';btn.style.color='#16a34a';setTimeout(function(){btn.textContent='Copy';btn.style.color='var(--c3)'},1500)})};pre.style.position='relative';pre.appendChild(btn);pre.onmouseenter=function(){btn.style.opacity='1'};pre.onmouseleave=function(){btn.style.opacity='0'}});

// Close sidebar on nav click (mobile)
document.querySelectorAll('.nav-item').forEach(function(a){a.addEventListener('click',closeSidebar)});
</script>
</body>
</html>`;
}

// Redirect /docs to /docs/overview
router.get('/', (_req, res) => res.redirect('/docs/overview'));

// Serve each page
router.get('/:page', (req, res) => {
  try {
    const page = PAGES.find(p => p.slug === req.params.page);
    if (!page) return res.redirect('/docs/overview');
    res.type('html').send(renderPage(req.params.page));
  } catch (err) {
    res.status(500).json({ error: true, message: 'Gagal memuat dokumentasi' });
  }
});

module.exports = router;
