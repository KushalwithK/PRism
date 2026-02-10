import { detectPlatform } from './platform-detector.js';
import { injectButton } from './ui-injector.js';
import { browserAPI } from '../shared/compat.js';

const BUTTON_ID = 'prism-generate-btn';

let lastUrl = location.href;

function tryInject() {
  const adapter = detectPlatform();
  if (adapter && !document.getElementById(BUTTON_ID)) {
    console.log(`PRism: Detected ${adapter.platform} PR creation page`);
    injectButton(adapter);
  }
}

function onUrlChange() {
  const currentUrl = location.href;
  if (currentUrl === lastUrl) return;
  lastUrl = currentUrl;

  // URL changed — remove stale button if we left a PR page
  const existing = document.getElementById(BUTTON_ID);
  if (existing) {
    const adapter = detectPlatform();
    if (!adapter) existing.parentElement?.remove();
  }

  // Try injecting on the new page (with a small delay for DOM to settle)
  setTimeout(tryInject, 300);
  setTimeout(tryInject, 1000);
}

// Listen for FILL_FROM_HISTORY messages from the popup
browserAPI.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'FILL_FROM_HISTORY') {
    const { title, description } = message.payload as { title: string; description: string };
    const adapter = detectPlatform();
    if (adapter) {
      adapter.fillTitle(title);
      adapter.fillDescription(description);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Not on a PR page' });
    }
    return true;
  }
});

// 1. Run on initial page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', tryInject);
} else {
  tryInject();
}

// 2. Detect SPA navigation via popstate (browser back/forward)
window.addEventListener('popstate', onUrlChange);

// 3. Detect SPA navigation via pushState/replaceState (GitHub turbo)
const origPushState = history.pushState.bind(history);
const origReplaceState = history.replaceState.bind(history);

history.pushState = function (...args) {
  origPushState(...args);
  onUrlChange();
};

history.replaceState = function (...args) {
  origReplaceState(...args);
  onUrlChange();
};

// 4. Debounced MutationObserver as fallback for DOM changes
//    (catches turbo-frame swaps that don't trigger pushState)
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const observer = new MutationObserver(() => {
  if (debounceTimer) return;
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    onUrlChange();
    tryInject();
  }, 200);
});

observer.observe(document.body, { childList: true, subtree: true });
