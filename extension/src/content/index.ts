import { detectPlatform } from './platform-detector.js';
import { injectButton } from './ui-injector.js';
import { browserAPI } from '../shared/compat.js';

function init() {
  const adapter = detectPlatform();
  if (!adapter) return;

  console.log(`PRism: Detected ${adapter.platform} PR creation page`);
  injectButton(adapter);
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

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Also handle SPA navigation (GitHub uses pjax/turbo)
const observer = new MutationObserver(() => {
  const adapter = detectPlatform();
  if (adapter && !document.getElementById('prism-generate-btn')) {
    injectButton(adapter);
  }
});

observer.observe(document.body, { childList: true, subtree: true });
