// Guides are listed in guides/index.json and rendered from guides/<file>.
// Routes: #/ (home) and #/<slug>.
const listEl = document.getElementById('guide-list');
const contentEl = document.getElementById('content');
const sidebarEl = document.getElementById('sidebar');
let guides = [];

marked.setOptions({ gfm: true });

async function init() {
  guides = await fetch('guides/index.json').then(r => r.json());
  listEl.innerHTML = guides
    .map(g => `<li><a href="#/${g.slug}" data-slug="${g.slug}">${g.title}</a></li>`)
    .join('');
  window.addEventListener('hashchange', route);
  route();
}

async function route() {
  const slug = location.hash.replace(/^#\/?/, '');
  sidebarEl.classList.remove('open');
  listEl.querySelectorAll('a').forEach(a => a.classList.toggle('active', a.dataset.slug === slug));

  const guide = guides.find(g => g.slug === slug);
  if (!guide) return renderHome();

  const res = await fetch(`guides/${guide.file}`);
  if (!res.ok) {
    contentEl.innerHTML = `<p class="muted">Could not load ${guide.file}.</p>`;
    return;
  }
  contentEl.innerHTML = marked.parse(await res.text());
  document.title = `${guide.title} — Testing Easy`;
  enhanceCode();
  window.scrollTo(0, 0);
}

function renderHome() {
  document.title = 'Testing Easy — Integration Guides';
  contentEl.innerHTML = `
    <h1>Testing Easy</h1>
    <p class="muted">Step-by-step guides for integrating testing into a project.</p>
    <div class="card-grid">
      ${guides.map(g => `
        <a class="card" href="#/${g.slug}">
          <strong>${g.title}</strong>
          <span>${g.description || ''}</span>
        </a>`).join('')}
    </div>`;
}

function enhanceCode() {
  contentEl.querySelectorAll('pre code').forEach(block => {
    hljs.highlightElement(block);
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.onclick = async () => {
      await navigator.clipboard.writeText(block.innerText);
      btn.textContent = 'Copied';
      setTimeout(() => (btn.textContent = 'Copy'), 1500);
    };
    block.parentElement.appendChild(btn);
  });
}

document.getElementById('menu-btn').onclick = () => sidebarEl.classList.toggle('open');
init();
