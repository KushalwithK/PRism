import { sendMessage } from '../../shared/compat.js';
import type { ExtensionResponse, UsageStats } from '../../shared/types.js';

export function renderMainView(container: HTMLElement) {
  container.innerHTML = `
    <div id="main-alert"></div>
    <div id="usage-section" style="margin-bottom:16px;">
      <div class="skeleton skeleton-card" style="height:80px;"></div>
    </div>
    <div class="section-title">How to use</div>
    <div class="howto-card">
      <ol class="howto-steps">
        <li class="howto-step">
          <span class="howto-step-num">1</span>
          <span>Navigate to a GitHub or GitLab PR/MR creation page</span>
        </li>
        <li class="howto-step">
          <span class="howto-step-num">2</span>
          <span>Click the <strong style="color:var(--text-primary);">"Generate PR Description"</strong> button</span>
        </li>
        <li class="howto-step">
          <span class="howto-step-num">3</span>
          <span>The title and description will be filled in automatically</span>
        </li>
      </ol>
    </div>
  `;

  loadUsage();
}

async function loadUsage() {
  const section = document.getElementById('usage-section')!;

  try {
    const response = await sendMessage<ExtensionResponse<UsageStats>>({
      type: 'GET_USAGE',
    });

    if (response.success && response.data) {
      const { used, limit, plan } = response.data;
      const isUnlimited = limit === -1;
      const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
      const limitText = isUnlimited ? '&infin;' : String(limit);

      let fillClass = '';
      if (!isUnlimited && percentage >= 100) fillClass = 'progress-fill--danger';
      else if (!isUnlimited && percentage >= 80) fillClass = 'progress-fill--warning';

      section.innerHTML = `
        <div class="card-static">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <span style="font-size:13px;font-weight:600;color:var(--text-secondary);">Generations</span>
            <span style="font-size:14px;font-weight:700;color:var(--text-primary);">${used} <span style="color:var(--text-tertiary);font-weight:400;">/ ${limitText}</span></span>
          </div>
          ${!isUnlimited ? `
            <div class="progress-track">
              <div class="progress-fill ${fillClass}" style="width:${percentage}%"></div>
            </div>
          ` : `
            <div style="text-align:center;padding:4px 0;font-size:20px;color:var(--purple-light);font-weight:700;">&infin;</div>
          `}
          <div style="margin-top:8px;">
            <span class="usage-badge">${plan} plan</span>
          </div>
        </div>
      `;
    }
  } catch {
    section.innerHTML = '<div class="alert alert-error">\u2716 Failed to load usage</div>';
  }
}

