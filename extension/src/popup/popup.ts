import { sendMessage } from '../shared/compat.js';
import type { ExtensionResponse, UserProfile } from '../shared/types.js';
import { renderLoginView } from './views/login.js';
import { renderMainView } from './views/main.js';
import { renderHistoryView } from './views/history.js';
import { renderSettingsView } from './views/settings.js';

const mainContent = document.getElementById('main-content')!;
const bottomNav = document.getElementById('bottom-nav')!;
const logoutBtn = document.getElementById('nav-logout')!;
let currentView = 'main';

async function init() {
  const response = await sendMessage<ExtensionResponse<{ isAuthenticated: boolean; user: UserProfile | null }>>({
    type: 'GET_AUTH_STATE',
  });

  if (response.success && response.data?.isAuthenticated) {
    showAuthenticatedUI();
  } else {
    showLoginUI();
  }
}

function showLoginUI() {
  bottomNav.classList.add('hidden');
  logoutBtn.classList.add('hidden');
  renderLoginView(mainContent, () => {
    showAuthenticatedUI();
  });
}

function showAuthenticatedUI() {
  bottomNav.classList.remove('hidden');
  logoutBtn.classList.remove('hidden');
  navigateTo('main');
}

function navigateTo(view: string) {
  currentView = view;

  // Update nav
  bottomNav.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.view === view);
  });

  // Render view
  switch (view) {
    case 'main':
      renderMainView(mainContent);
      break;
    case 'history':
      renderHistoryView(mainContent);
      break;
    case 'settings':
      renderSettingsView(mainContent);
      break;
  }
}

// Nav click handlers
bottomNav.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('.nav-btn') as HTMLElement | null;
  if (btn?.dataset.view) {
    navigateTo(btn.dataset.view);
  }
});

// Logout
logoutBtn.addEventListener('click', async () => {
  await sendMessage({ type: 'LOGOUT' });
  showLoginUI();
});

init();
