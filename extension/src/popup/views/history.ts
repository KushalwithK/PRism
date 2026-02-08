import { sendMessage, browserAPI } from '../../shared/compat.js';
import type { ExtensionResponse, PaginatedResponse, Generation } from '../../shared/types.js';

let cachedData: Generation[] = [];

export function renderHistoryView(container: HTMLElement) {
  let page = 1;

  async function load() {
    container.innerHTML = `
      <div class="section-header">
        <span class="section-title" style="margin-bottom:0;">History</span>
      </div>
      <div class="skeleton skeleton-card"></div>
      <div class="skeleton skeleton-card"></div>
      <div class="skeleton skeleton-card"></div>
    `;

    try {
      const response = await sendMessage<ExtensionResponse<PaginatedResponse<Generation>>>({
        type: 'GET_HISTORY',
        payload: { page, pageSize: 10 },
      });

      if (!response.success || !response.data) {
        container.innerHTML = '<div class="alert alert-error">✖ Failed to load history</div>';
        return;
      }

      const { data, total, totalPages } = response.data;
      cachedData = data;

      if (data.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <p>No generations yet</p>
            <p>Your PR descriptions will appear here</p>
          </div>
        `;
        return;
      }

      const platformBadge = (platform: string) => {
        const lower = platform.toLowerCase();
        if (lower === 'github') return '<span class="platform-badge platform-badge--github">GH</span>';
        if (lower === 'gitlab') return '<span class="platform-badge platform-badge--gitlab">GL</span>';
        return `<span class="platform-badge">${escapeHtml(platform)}</span>`;
      };

      container.innerHTML = `
        <div class="section-header">
          <span class="section-title" style="margin-bottom:0;">History</span>
          <span class="count-badge">${total}</span>
        </div>
        <div id="history-list">
          ${data.map((gen) => `
            <div class="card card-clickable" data-id="${gen.id}">
              <div class="card-title">${escapeHtml(gen.prTitle)}</div>
              <div class="card-meta">
                ${platformBadge(gen.platform)}
                <span>${gen.template?.name || 'Unknown template'}</span>
                <span>&middot;</span>
                <span>${new Date(gen.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          `).join('')}
        </div>
        ${totalPages > 1 ? `
          <div class="pagination">
            <button class="pagination-btn" id="prev-page" ${page <= 1 ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span class="pagination-info">${page} of ${totalPages}</span>
            <button class="pagination-btn" id="next-page" ${page >= totalPages ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg>
            </button>
          </div>
        ` : ''}
      `;

      // Delegated click on history cards
      document.getElementById('history-list')?.addEventListener('click', (e) => {
        const card = (e.target as HTMLElement).closest('.card[data-id]') as HTMLElement | null;
        if (!card) return;
        const id = card.dataset.id;
        const gen = cachedData.find((g) => g.id === id);
        if (gen) showDetailModal(gen);
      });

      document.getElementById('prev-page')?.addEventListener('click', () => {
        if (page > 1) { page--; load(); }
      });

      document.getElementById('next-page')?.addEventListener('click', () => {
        if (page < totalPages) { page++; load(); }
      });

    } catch (err) {
      container.innerHTML = `<div class="alert alert-error">✖ ${(err as Error).message}</div>`;
    }
  }

  load();
}

function showDetailModal(gen: Generation) {
  // Remove any existing modal
  document.querySelector('.modal-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const platformLabel = gen.platform.charAt(0).toUpperCase() + gen.platform.slice(1);
  const dateStr = new Date(gen.createdAt).toLocaleString();
  const truncatedUrl = gen.repoUrl.length > 40
    ? gen.repoUrl.slice(0, 40) + '…'
    : gen.repoUrl;

  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <span class="modal-header-title">${escapeHtml(gen.prTitle)}</span>
        <button class="modal-close" id="modal-close-btn">
          <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="modal-meta">
          <span class="modal-meta-label">Platform</span>
          <span class="modal-meta-value">${escapeHtml(platformLabel)}</span>
          <span class="modal-meta-label">Template</span>
          <span class="modal-meta-value">${escapeHtml(gen.template?.name || 'Unknown')}</span>
          <span class="modal-meta-label">Date</span>
          <span class="modal-meta-value">${escapeHtml(dateStr)}</span>
          <span class="modal-meta-label">Repo</span>
          <span class="modal-meta-value" title="${escapeHtml(gen.repoUrl)}">${escapeHtml(truncatedUrl)}</span>
        </div>
        ${gen.compareBranch && gen.baseBranch ? `
          <div class="branch-flow">
            <span class="branch-badge">${escapeHtml(gen.compareBranch)}</span>
            <svg class="branch-arrow" width="20" height="12" viewBox="0 0 20 12"><path d="M0 6h16M12 1l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span class="branch-badge">${escapeHtml(gen.baseBranch)}</span>
          </div>
        ` : ''}
        ${gen.diffSummary ? `
          <div class="modal-section-label">Diff Summary</div>
          <div class="modal-description" style="max-height:100px;margin-bottom:var(--space-4);">${escapeHtml(gen.diffSummary)}</div>
        ` : ''}
        <div class="modal-section-label">Description</div>
        <div class="modal-description">${escapeHtml(gen.prDescription)}</div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" id="modal-use-btn" disabled>
          <span class="btn-label">Use This</span>
        </button>
        <span class="modal-footer-hint" id="modal-footer-hint">Checking tab…</span>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeBtn = document.getElementById('modal-close-btn')!;
  const useBtn = document.getElementById('modal-use-btn') as HTMLButtonElement;
  const hint = document.getElementById('modal-footer-hint')!;

  function closeModal() {
    overlay.remove();
    document.removeEventListener('keydown', onEscape);
  }

  function onEscape(e: KeyboardEvent) {
    if (e.key === 'Escape') closeModal();
  }

  // Close handlers
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', onEscape);

  // Check if current tab is a PR page
  let activeTabId: number | null = null;

  browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab?.url || !tab.id) {
      hint.textContent = 'Open a PR page to use this';
      return;
    }

    activeTabId = tab.id;
    const url = tab.url;

    const isGitHubPR = url.includes('github.com') && (/\/compare\//.test(url) || /\/pull\//.test(url));
    const isGitLabMR = url.includes('gitlab.com') && /\/merge_requests\/new/.test(url);

    if (isGitHubPR || isGitLabMR) {
      useBtn.disabled = false;
      hint.textContent = '';
    } else {
      hint.textContent = 'Open a PR page to use this';
    }
  });

  // "Use This" click
  useBtn.addEventListener('click', () => {
    if (!activeTabId) return;

    useBtn.disabled = true;
    (useBtn.querySelector('.btn-label') as HTMLElement).textContent = 'Filling…';

    browserAPI.tabs.sendMessage(
      activeTabId,
      { type: 'FILL_FROM_HISTORY', payload: { title: gen.prTitle, description: gen.prDescription } },
      (response) => {
        if (response?.success) {
          closeModal();
          showToast('Filled successfully!');
        } else {
          hint.textContent = response?.error || 'Failed to fill — is this a PR page?';
          (useBtn.querySelector('.btn-label') as HTMLElement).textContent = 'Use This';
          useBtn.disabled = false;
        }
      },
    );
  });
}

function showToast(message: string) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 2000);
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
