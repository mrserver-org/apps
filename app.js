import { Holo } from 'holo-js';
const holo = Holo.init();
holo.setTitle("MrServer Apps Repository");
holo.render(`
<header>
<div class="navbar">
<div class="logo">
<img width="25" src="https://raw.githubusercontent.com/mrserver-org/ui/refs/heads/main/logo.png"></img>
<span>MrServer Apps</span>
</div>
<div class="search-bar">
<i class="fas fa-search"></i>
<input type="text" id="search-input" placeholder="Search apps...">
</div>
</div>
</header>  
<main>
<div class="hero">
<h1>MrServer Apps Repository</h1>
<p>Discover and install powerful applications for your MrServer instance with a single command</p>
</div>
<div class="filter-area">
<div class="sort-dropdown">
<select id="sort-select">
<option value="name-asc">Name (A-Z)</option>
<option value="name-desc">Name (Z-A)</option>
<option value="publisher">Publisher</option>
</select>
</div>
</div>
<div class="loader" id="loader">
<div class="loader-spinner"></div>
</div>
<div class="apps-grid" id="apps-grid"></div>
</main>  
<footer>
<div class="footer-content">
<div class="footer-logo">
<img width="25" src="https://raw.githubusercontent.com/mrserver-org/ui/refs/heads/main/logo.png"></img>
<span>MrServer Apps Repository</span>
</div>  
<div class="footer-links">
<a href="#about">About</a>
<a href="https://mrserverdocs.now.sh">Documentation</a>
<a href="https://github.com/mrserver-org/apps">Publish App</a>
<a href="https://github.com/mrserver-org">GitHub</a>
</div>
</div>
</footer>  
<div class="copy-notification" id="copy-notification">
Command copied to clipboard!
</div>
<div class="modal" id="install-modal">
<div class="modal-content">
<div class="modal-header">
<div class="modal-title">Install App</div>
<button class="close-modal">&times;</button>
</div>
<div class="modal-body">
<p>Follow these steps to install the app on your MrServer instance:</p>
<ul class="install-steps">
<li>
<div class="step-number">1</div>
<div>Open the terminal inside/outside of MrServer</div>
</li>
<li>
<div class="step-number">2</div>
<div>
<p>Run the following command:</p>
<div class="command-box">
<code id="modal-command">mr -a app-uuid</code>
<button class="command-copy" id="modal-copy-btn">
<i class="far fa-copy"></i>
</button>
</div>
</div>
</li>
<li>
<div class="step-number">3</div>
<div>Wait for the installation process to complete</div>
</li>
<li>
<div class="step-number">4</div>
<div>Refresh the browser to take full effect. (the app may appear but won't launch.)</div>
</li>
</ul>
<div class="modal-app-info">
<p>The app will be installed on your MrServer instance and ready to use immediately after installation.</p>
</div>
</div>
</div>
</div>
`);
const appsGrid = document.getElementById('apps-grid');
const loader = document.getElementById('loader');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const filterBadges = document.querySelectorAll('.filter-badge');
const copyNotification = document.getElementById('copy-notification');
const installModal = document.getElementById('install-modal');
const closeModal = document.querySelector('.close-modal');
const modalCommand = document.getElementById('modal-command');
const modalCopyBtn = document.getElementById('modal-copy-btn');

let apps = [];
let filteredApps = [];
const urlParams = new URLSearchParams(window.location.search);
let currentFilter = urlParams.has("install") ? 'all' : 'listed';

async function fetchApps() {
  try {
const response = await fetch('/metadata.json');
apps = await response.json();
filteredApps = [...apps];

loader.style.display = 'none';

if (apps.length === 0) {
  appsGrid.innerHTML = '<div class="no-apps"><i class="fas fa-box-open fa-3x"></i><p>No apps found</p></div>';
  return;
}

sortApps('name-asc');
renderApps();
  } catch (error) {
console.error('Error fetching apps:', error);
loader.style.display = 'none';
appsGrid.innerHTML = '<div class="no-apps"><i class="fas fa-exclamation-triangle fa-3x"></i><p>Failed to load apps</p></div>';
  }
}

function renderApps() {
  appsGrid.innerHTML = '';
  
  if (filteredApps.length === 0) {
appsGrid.innerHTML = '<div class="no-apps"><i class="fas fa-search fa-3x"></i><p>No apps match your search</p></div>';
return;
  }
  
  filteredApps.forEach(app => {
if (currentFilter === 'listed' && app.listed === false) return;
if (currentFilter === 'unlisted' && app.listed !== false) return;

const card = document.createElement('div');
card.className = 'app-card';

const bannerUrl = app.banner || '';
const logoUrl = app.logo || null;

card.innerHTML = `
  <div class="app-banner" style="background-image: url('\${bannerUrl}')">
<div class="app-logo">
  ${logoUrl ? `<img src="${logoUrl}" alt="${app.name} logo">` : `<i class="fas fa-cube app-logo-placeholder"></i>`}
</div>
  </div>
  <div class="app-content">
<div class="app-header">
  <div class="app-name">${app.name}</div>
  <div class="app-publisher">
<div class="publisher-avatar">
  <img src="https://github.com/${app.publisher}.png" alt="${app.publisher}" onerror="this.src=''">
</div>
${app.publisher}
  </div>
</div>
<div class="app-description">${app.description || 'No description provided'}</div>
<div class="app-footer">
  <button class="install-btn" data-uuid="${app.uuid}">
<i class="fas fa-download"></i> Install
  </button>
  <div class="app-uuid">
<span class="copy-cmd" data-command="mr -a ${app.uuid}" title="Copy install command">
  <i class="far fa-copy"></i>
</span>
${app.uuid}
  </div>
</div>
  </div>
`;

appsGrid.appendChild(card);
});
  
document.querySelectorAll('.copy-cmd').forEach(btn => {
btn.addEventListener('click', (e) => {
  const command = e.currentTarget.dataset.command;
  copyToClipboard(command);
  e.stopPropagation();
});
});
  
  document.querySelectorAll('.install-btn').forEach(btn => {
btn.addEventListener('click', () => {
  const uuid = btn.dataset.uuid;
  showInstallModal(uuid);
});
if (urlParams.get("install") == btn.dataset.uuid) {
	btn.click();
}
});
}

function filterApps() {
  const searchTerm = searchInput.value.toLowerCase();
  
  filteredApps = apps.filter(app => {
const nameMatch = app.name.toLowerCase().includes(searchTerm);
const descMatch = app.description && app.description.toLowerCase().includes(searchTerm);
const publisherMatch = app.publisher.toLowerCase().includes(searchTerm);
const uuidMatch = app.uuid.toLowerCase().includes(searchTerm);

return nameMatch || descMatch || publisherMatch || uuidMatch;
  });
  
  sortApps(sortSelect.value);
  renderApps();
}

function sortApps(sortType) {
  switch (sortType) {
case 'name-asc':
  filteredApps.sort((a, b) => a.name.localeCompare(b.name));
  break;
case 'name-desc':
  filteredApps.sort((a, b) => b.name.localeCompare(a.name));
  break;
case 'publisher':
  filteredApps.sort((a, b) => a.publisher.localeCompare(b.publisher));
  break;
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
copyNotification.classList.add('active');
setTimeout(() => {
  copyNotification.classList.remove('active');
}, 2000);
  }).catch(err => {
console.error('Failed to copy text: ', err);
  });
}

function showInstallModal(uuid) {
  modalCommand.textContent = `mr -a ${uuid}`;
  installModal.classList.add('active');
}

closeModal.addEventListener('click', () => {
  installModal.classList.remove('active');
});

installModal.addEventListener('click', (e) => {
  if (e.target === installModal) {
installModal.classList.remove('active');
  }
});

modalCopyBtn.addEventListener('click', () => {
  copyToClipboard(modalCommand.textContent);
});

searchInput.addEventListener('input', filterApps);

sortSelect.addEventListener('change', () => {
  sortApps(sortSelect.value);
  renderApps();
});

fetchApps();