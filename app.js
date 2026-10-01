// Guides are listed in guides/index.json and rendered from guides/<file>.
// Routes: #/ (home), #/<slug> and #/<slug>/<section>.
const listEl = document.getElementById('guide-list');
const contentEl = document.getElementById('content');
const sidebarEl = document.getElementById('sidebar');
let guides = [];
let currentSlug = null;
let sectionObserver = null;

marked.setOptions({ gfm: true });

async function init() {
  guides = await fetch('guides/index.json', { cache: 'no-cache' }).then(r => r.json());
  listEl.innerHTML = guides
    .map(g => `<li data-slug="${g.slug}"><a href="#/${g.slug}" data-slug="${g.slug}">${g.title}</a></li>`)
    .join('');
  window.addEventListener('hashchange', route);
  route();
}

async function route() {
  const [slug = '', section = ''] = location.hash.replace(/^#\/?/, '').split('/');
  sidebarEl.classList.remove('open');
  listEl.querySelectorAll('a[data-slug]').forEach(a => a.classList.toggle('active', a.dataset.slug === slug));

  const guide = guides.find(g => g.slug === slug);
  if (!guide) {
    currentSlug = null;
    renderSections([]);
    return renderHome();
  }

  if (slug !== currentSlug) {
    const res = await fetch(`guides/${guide.file}`, { cache: 'no-cache' });
    if (!res.ok) {
      contentEl.innerHTML = `<p class="muted">Could not load ${guide.file}.</p>`;
      return;
    }
    contentEl.innerHTML = marked.parse(await res.text());
    document.title = `${guide.title} — Testing Easy`;
    currentSlug = slug;
    enhanceCode();
    renderSections(buildSections(slug), slug);
  }

  const target = section && document.getElementById(section);
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  else window.scrollTo(0, 0);
  setActiveSection(section);
}

// Give every h2 a stable id and return them as sidebar entries.
function buildSections(slug) {
  const used = new Set();
  return [...contentEl.querySelectorAll('h2')].map(h => {
    let id = h.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
    for (let n = 2; used.has(id); n++) id = id.replace(/-\d+$/, '') + `-${n}`;
    used.add(id);
    h.id = id;
    return { id, title: h.textContent, el: h };
  });
}

function renderSections(sections, slug) {
  listEl.querySelectorAll('.section-list').forEach(ul => ul.remove());
  if (sectionObserver) sectionObserver.disconnect();
  if (!sections.length) return;

  const ul = document.createElement('ul');
  ul.className = 'section-list';
  ul.innerHTML = sections
    .map(s => `<li><a href="#/${slug}/${s.id}" data-section="${s.id}">${s.title}</a></li>`)
    .join('');
  listEl.querySelector(`li[data-slug="${slug}"]`).appendChild(ul);

  // Highlight the section currently at the top of the viewport.
  sectionObserver = new IntersectionObserver(entries => {
    const visible = entries.filter(e => e.isIntersecting);
    if (visible.length) setActiveSection(visible[0].target.id);
  }, { rootMargin: '-56px 0px -70% 0px' });
  sections.forEach(s => sectionObserver.observe(s.el));
}

function setActiveSection(id) {
  listEl.querySelectorAll('a[data-section]').forEach(a => a.classList.toggle('active', a.dataset.section === id));
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
