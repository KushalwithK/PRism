import type { PlatformAdapter } from './platforms/platform-adapter.js';
import { sendMessage } from '../shared/compat.js';
import type { ExtensionResponse, GenerateResponse, UsageStats, UserProfile, Template, Generation, PaginatedResponse } from '../shared/types.js';

const BUTTON_ID = 'prism-generate-btn';
const MODAL_HOST_ID = 'prism-modal-host';

// ── Design Tokens ──

const COLORS = {
  primary: '#8b5cf6',
  primaryLight: 'rgba(139,92,246,0.12)',
  primaryBorder: 'rgba(139,92,246,0.4)',
  primaryBorderHover: 'rgba(139,92,246,0.6)',
  primaryActive: 'rgba(139,92,246,0.2)',
  bg: '#030014',
  bgSecondary: '#0a0a1a',
  bgTertiary: '#12112a',
  text: '#f5f3ff',
  textSecondary: '#a5a0c0',
  textMuted: '#6b6590',
  border: '#252347',
  error: '#f85149',
  errorBg: 'rgba(248,81,73,0.1)',
  errorBorder: 'rgba(248,81,73,0.3)',
  success: '#3fb950',
  overlay: 'rgba(3,0,20,0.75)',
  progressBg: '#252347',
  badgeFree: '#6b6590',
  badgePro: '#8b5cf6',
  badgeMax: '#d4a017',
  inputBg: '#08081a',
};

const FONT_STACK = "'General Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

// ── Icons ──

const sparkleIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${COLORS.primary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><path d="M6 9v12"/></svg>`;

const prismLogo = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${COLORS.primary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><path d="M6 9v12"/></svg>`;

const clockIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${COLORS.textSecondary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;

const previewIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;

const repoIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${COLORS.textMuted}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65S8.93 17.38 9 18v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>`;

const arrowIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${COLORS.textMuted}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`;

const checkIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${COLORS.primary}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

// ── Button Styles ──

const baseStyle = `
  background: transparent;
  color: ${COLORS.primary};
  border: 1px solid ${COLORS.primaryBorder};
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  box-shadow: none;
  font-family: ${FONT_STACK};
`;

const hoverStyle = `
  background: ${COLORS.primaryLight};
  border-color: ${COLORS.primaryBorderHover};
  box-shadow: 0 0 12px rgba(139,92,246,0.2);
`;

const activeStyle = `
  background: ${COLORS.primaryActive};
`;

// ── Shadow DOM Styles (keyframes only) ──

const shadowStyles = `
  * { box-sizing: border-box; }

  @keyframes prism-spin {
    to { transform: rotate(360deg); }
  }

  @keyframes prism-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  @keyframes prism-pro-shine {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  @keyframes prism-fade-in {
    from { opacity: 0; transform: scale(0.97); }
    to { opacity: 1; transform: scale(1); }
  }

  @keyframes prism-orbit-spin {
    to { transform: rotate(360deg); }
  }

  @keyframes prism-orbit-spin-reverse {
    to { transform: rotate(-360deg); }
  }

  @keyframes prism-core-pulse {
    0%, 100% { box-shadow: 0 0 25px 8px rgba(139,92,246,0.12), 0 0 50px 16px rgba(139,92,246,0.05); }
    50% { box-shadow: 0 0 40px 14px rgba(139,92,246,0.22), 0 0 80px 28px rgba(139,92,246,0.08); }
  }

  @keyframes prism-core-breathe {
    0%, 100% { transform: scale(1); filter: drop-shadow(0 0 8px rgba(139,92,246,0.3)); }
    50% { transform: scale(1.06); filter: drop-shadow(0 0 16px rgba(139,92,246,0.5)); }
  }

  @keyframes prism-wave {
    0% { transform: translate(-50%,-50%) scale(0.3); opacity: 0.5; }
    100% { transform: translate(-50%,-50%) scale(2.8); opacity: 0; }
  }

  @keyframes prism-particle {
    0% { transform: translateY(0); opacity: 0; }
    15% { opacity: 0.6; }
    85% { opacity: 0.35; }
    100% { transform: translateY(-200px); opacity: 0; }
  }

  @keyframes prism-ambient {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.7; }
  }

  @keyframes prism-dot-pulse {
    0%, 100% { box-shadow: 0 0 3px 1px rgba(139,92,246,0.35); }
    50% { box-shadow: 0 0 8px 3px rgba(139,92,246,0.65); }
  }

  @keyframes prism-progress-sweep {
    0% { left: -30%; width: 30%; }
    50% { left: 30%; width: 50%; }
    100% { left: 100%; width: 30%; }
  }

  @keyframes prism-section-reveal {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes prism-check-appear {
    from { transform: scale(0) rotate(-45deg); opacity: 0; }
    to { transform: scale(1) rotate(0deg); opacity: 1; }
  }

  @keyframes prism-connector-fill {
    from { width: 0%; }
    to { width: 100%; }
  }
`;

// ── Loading Status Labels ──

const LOADING_PHASES = [
  { text: 'Extracting diff',        delay: 0 },
  { text: 'Analyzing changes',      delay: 2000 },
  { text: 'Generating description', delay: 4500 },
  { text: 'Finalizing',             delay: 8000 },
];

// ── Modal State ──

type ModalState = 'pre-generate' | 'loading' | 'post-generate';

interface ModalContext {
  host: HTMLElement;
  shadow: ShadowRoot;
  body: HTMLElement;
  footer: HTMLElement;
  adapter: PlatformAdapter;
  cleanupLoading: (() => void) | null;
  keydownHandler: ((e: KeyboardEvent) => void) | null;
  generationId: string | null;
  originalTitle: string;
  originalDescription: string;
  overrideTemplateId: string | null;
}

interface PreGenData {
  authData: { isAuthenticated: boolean; user?: UserProfile } | undefined;
  usageData: UsageStats | undefined;
  templates: Template[];
  repoGenerations: Generation[];
  errorMsg?: string;
}

// ── Button Injection ──

export function injectButton(adapter: PlatformAdapter) {
  if (document.getElementById(BUTTON_ID)) return;

  const anchor = adapter.getButtonAnchor();
  if (!anchor) return;

  const container = document.createElement('div');
  container.style.cssText = 'display:flex;align-items:center;gap:8px;margin:8px 0;';

  const button = document.createElement('button');
  button.id = BUTTON_ID;
  button.type = 'button';
  button.innerHTML = `${sparkleIcon} Generate PR Description`;
  button.style.cssText = baseStyle;

  button.addEventListener('mouseenter', () => {
    if (!button.disabled) button.style.cssText = baseStyle + hoverStyle;
  });
  button.addEventListener('mouseleave', () => {
    if (!button.disabled) button.style.cssText = baseStyle;
  });
  button.addEventListener('mousedown', () => {
    if (!button.disabled) button.style.cssText = baseStyle + activeStyle;
  });
  button.addEventListener('mouseup', () => {
    if (!button.disabled) button.style.cssText = baseStyle + hoverStyle;
  });

  button.addEventListener('click', () => openModal(adapter));

  container.appendChild(button);
  anchor.insertAdjacentElement('beforebegin', container);
}

// ── Modal Lifecycle ──

function openModal(adapter: PlatformAdapter) {
  // Prevent duplicate modals
  if (document.getElementById(MODAL_HOST_ID)) return;

  const host = document.createElement('div');
  host.id = MODAL_HOST_ID;
  host.style.cssText = `position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483647;`;

  // Stop keyboard events from reaching GitHub/GitLab shortcut handlers
  for (const evt of ['keydown', 'keyup', 'keypress'] as const) {
    host.addEventListener(evt, (e) => {
      if ((e as KeyboardEvent).key !== 'Escape') e.stopPropagation();
    });
  }

  const shadow = host.attachShadow({ mode: 'closed' });

  // Inject scoped styles
  const styleEl = document.createElement('style');
  styleEl.textContent = shadowStyles;
  shadow.appendChild(styleEl);

  // Overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:absolute;top:0;left:0;width:100%;height:100%;
    background:${COLORS.overlay};backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  `;
  shadow.appendChild(overlay);

  // Modal container
  const modal = document.createElement('div');
  modal.style.cssText = `
    position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
    width:85vw;height:85vh;max-width:900px;
    background:${COLORS.bg};color:${COLORS.text};
    border-radius:12px;display:flex;flex-direction:column;
    font-family:${FONT_STACK};
    animation: prism-fade-in 0.2s ease-out;
    overflow:hidden;
    box-shadow: inset 0 0 30px rgba(139,92,246,0.05), 0 8px 32px rgba(0,0,0,0.5);
  `;
  shadow.appendChild(modal);

  // Header
  const header = document.createElement('div');
  header.style.cssText = `
    display:flex;align-items:center;justify-content:space-between;
    padding:16px 20px;border-bottom:1px solid ${COLORS.border};
    flex-shrink:0;
  `;

  const titleWrap = document.createElement('div');
  titleWrap.style.cssText = 'display:flex;align-items:center;gap:8px;';
  titleWrap.innerHTML = `${prismLogo}<span style="font-size:16px;font-weight:700;color:${COLORS.text};">PRism</span>`;

  const closeBtn = document.createElement('button');
  closeBtn.style.cssText = `
    background:none;border:none;cursor:pointer;padding:4px 8px;
    font-size:20px;color:${COLORS.textSecondary};line-height:1;
    border-radius:4px;
  `;
  closeBtn.textContent = '\u2715';
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = COLORS.bgTertiary;
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = 'none';
  });

  header.appendChild(titleWrap);
  header.appendChild(closeBtn);
  modal.appendChild(header);

  // Body
  const body = document.createElement('div');
  body.style.cssText = 'flex:1;overflow-y:auto;padding:20px;';
  modal.appendChild(body);

  // Footer
  const footer = document.createElement('div');
  footer.style.cssText = `
    display:flex;align-items:center;justify-content:flex-end;gap:10px;
    padding:14px 20px;border-top:1px solid ${COLORS.border};
    flex-shrink:0;
  `;
  modal.appendChild(footer);

  const ctx: ModalContext = {
    host,
    shadow,
    body,
    footer,
    adapter,
    cleanupLoading: null,
    keydownHandler: null,
    generationId: null,
    originalTitle: '',
    originalDescription: '',
    overrideTemplateId: null,
  };

  // Close handlers
  const close = () => closeModal(ctx);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);

  ctx.keydownHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  };
  document.addEventListener('keydown', ctx.keydownHandler);

  document.body.appendChild(host);

  // Start with pre-generate state
  renderPreGenerate(ctx);
}

function closeModal(ctx: ModalContext) {
  ctx.cleanupLoading?.();
  if (ctx.keydownHandler) document.removeEventListener('keydown', ctx.keydownHandler);
  ctx.host.remove();
}

// ── State: Pre-Generate ──

async function renderPreGenerate(ctx: ModalContext, errorMsgOrCache?: string | PreGenData) {
  ctx.body.innerHTML = '';
  ctx.footer.innerHTML = '';
  ctx.body.style.cssText = 'flex:1;overflow-y:auto;padding:20px;';

  const cached = typeof errorMsgOrCache === 'object' ? errorMsgOrCache : undefined;
  const errorMsg = typeof errorMsgOrCache === 'string' ? errorMsgOrCache : cached?.errorMsg;

  let authData: { isAuthenticated: boolean; user?: UserProfile } | undefined;
  let usageData: UsageStats | undefined;
  let templates: Template[] = [];
  let repoGenerations: Generation[] = [];

  if (cached) {
    authData = cached.authData;
    usageData = cached.usageData;
    templates = cached.templates;
    repoGenerations = cached.repoGenerations;
  } else {
    // Show loading while fetching auth + usage + history
    ctx.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:${COLORS.textSecondary};font-size:14px;">Loading...</div>`;

    try {
      const metadata = ctx.adapter.getMetadata();
      const [authRes, usageRes, templatesRes, historyRes] = await Promise.all([
        sendMessage<ExtensionResponse<{ isAuthenticated: boolean; user?: UserProfile }>>({ type: 'GET_AUTH_STATE' }),
        sendMessage<ExtensionResponse<UsageStats>>({ type: 'GET_USAGE' }),
        sendMessage<ExtensionResponse<Template[]>>({ type: 'GET_TEMPLATES' }),
        sendMessage<ExtensionResponse<PaginatedResponse<Generation>>>({
          type: 'GET_HISTORY',
          payload: {
            page: 1,
            pageSize: 5,
            repoUrl: metadata.repoUrl,
            baseBranch: metadata.targetBranch,
            compareBranch: metadata.sourceBranch,
          },
        }),
      ]);
      if (authRes.success) authData = authRes.data;
      if (usageRes.success) usageData = usageRes.data;
      if (templatesRes.success && templatesRes.data) templates = templatesRes.data;
      if (historyRes.success && historyRes.data) repoGenerations = historyRes.data.data;
    } catch {
      // If calls fail, we'll show unauthenticated state
    }
  }

  ctx.body.innerHTML = '';
  ctx.footer.innerHTML = '';

  const preGenData: PreGenData = { authData, usageData, templates, repoGenerations, errorMsg };

  // Not authenticated
  if (!authData?.isAuthenticated) {
    ctx.body.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:12px;">
        <div style="font-size:18px;font-weight:600;color:${COLORS.text};">Not Logged In</div>
        <div style="font-size:14px;color:${COLORS.textSecondary};">Please log in via the PRism popup to generate descriptions.</div>
      </div>
    `;
    const closeOnlyBtn = makeButton('Close', 'secondary');
    closeOnlyBtn.addEventListener('click', () => closeModal(ctx));
    ctx.footer.appendChild(closeOnlyBtn);
    return;
  }

  const user = authData.user!;

  // User info bar
  const userBar = document.createElement('div');
  userBar.style.cssText = `
    display:flex;align-items:center;gap:12px;
    padding:12px 16px;background:${COLORS.bgSecondary};
    border-radius:8px;margin-bottom:16px;
  `;

  const avatar = document.createElement('div');
  const initial = (user.name || user.email)[0].toUpperCase();
  avatar.style.cssText = `
    width:36px;height:36px;border-radius:50%;
    background:${COLORS.primary};color:white;
    display:flex;align-items:center;justify-content:center;
    font-weight:700;font-size:14px;flex-shrink:0;
  `;
  avatar.textContent = initial;

  const userInfo = document.createElement('div');
  userInfo.style.cssText = 'flex:1;min-width:0;';

  const nameRow = document.createElement('div');
  nameRow.style.cssText = 'display:flex;align-items:center;gap:8px;';

  const nameEl = document.createElement('span');
  nameEl.style.cssText = `font-size:14px;font-weight:600;color:${COLORS.text};`;
  nameEl.textContent = user.name || user.email;

  const prismSub = user.subscriptions.find((s) => s.productSlug === 'prism');
  const userPlan = prismSub?.plan ?? 'FREE';

  const badge = document.createElement('span');
  if (userPlan === 'MAX') {
    badge.style.cssText = `
      font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;
      background:linear-gradient(135deg, #d4a017, #f0c040, #ffe066, #f0c040, #d4a017);
      background-size:200% auto;
      animation:prism-pro-shine 3s linear infinite;
      color:#1a1a1a;text-transform:uppercase;letter-spacing:0.5px;
      text-shadow:0 0 4px rgba(240,192,64,0.4);
      box-shadow:0 0 8px rgba(212,160,23,0.4);
    `;
    badge.textContent = 'MAX';
  } else if (userPlan === 'PRO') {
    badge.style.cssText = `
      font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;
      background:linear-gradient(135deg, #7c3aed, #8b5cf6, #c4b5fd, #8b5cf6, #7c3aed);
      background-size:200% auto;
      animation:prism-pro-shine 3s linear infinite;
      color:white;text-transform:uppercase;letter-spacing:0.5px;
      text-shadow:0 0 6px rgba(196,181,253,0.5);
      box-shadow:0 0 8px rgba(139,92,246,0.4);
    `;
    badge.textContent = 'PRO';
  } else {
    badge.style.cssText = `
      font-size:11px;font-weight:700;padding:2px 6px;border-radius:4px;
      background:${COLORS.badgeFree};color:white;text-transform:uppercase;
    `;
    badge.textContent = 'FREE';
  }

  nameRow.appendChild(nameEl);
  nameRow.appendChild(badge);
  userInfo.appendChild(nameRow);

  // Generation count below name
  if (usageData) {
    const limitDisplay = usageData.limit === -1 ? '\u221e' : String(usageData.limit);
    const countEl = document.createElement('div');
    countEl.style.cssText = `font-size:12px;color:${COLORS.textSecondary};margin-top:4px;`;
    countEl.textContent = `${usageData.used} / ${limitDisplay} generations used`;
    userInfo.appendChild(countEl);
  }

  userBar.appendChild(avatar);
  userBar.appendChild(userInfo);
  ctx.body.appendChild(userBar);

  // Error message (if retrying after error)
  if (errorMsg) {
    const errEl = document.createElement('div');
    errEl.style.cssText = `
      padding:10px 14px;background:${COLORS.errorBg};border:1px solid ${COLORS.errorBorder};
      border-radius:8px;color:${COLORS.error};font-size:13px;margin-bottom:16px;
    `;
    errEl.textContent = errorMsg;
    ctx.body.appendChild(errEl);
  }

  // Template override dropdown
  if (templates.length > 0) {
    const tplLabel = document.createElement('label');
    tplLabel.style.cssText = `display:block;font-size:14px;font-weight:600;color:${COLORS.text};margin-bottom:4px;`;
    tplLabel.textContent = 'Template';
    ctx.body.appendChild(tplLabel);

    const tplHint = document.createElement('div');
    tplHint.style.cssText = `font-size:12px;color:${COLORS.textSecondary};margin-bottom:8px;`;
    tplHint.textContent = 'Choose a template for this generation. This does not change your default.';
    ctx.body.appendChild(tplHint);

    const tplSelect = document.createElement('select');
    tplSelect.style.cssText = `
      width:100%;padding:8px 12px;
      border:1px solid ${COLORS.border};border-radius:8px;
      font-size:14px;font-family:${FONT_STACK};
      color:${COLORS.text};background:${COLORS.inputBg};
      outline:none;cursor:pointer;margin-bottom:16px;
      appearance:none;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238b949e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
      background-repeat:no-repeat;background-position:right 10px center;
      padding-right:36px;
    `;

    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = 'Use default template';
    tplSelect.appendChild(defaultOpt);

    for (const t of templates) {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.name}${t.isPredefined ? ' (built-in)' : ''}`;
      tplSelect.appendChild(opt);
    }

    if (ctx.overrideTemplateId) {
      tplSelect.value = ctx.overrideTemplateId;
    }

    tplSelect.addEventListener('change', () => {
      ctx.overrideTemplateId = tplSelect.value || null;
    });

    tplSelect.addEventListener('focus', () => { tplSelect.style.borderColor = COLORS.primary; });
    tplSelect.addEventListener('blur', () => { tplSelect.style.borderColor = COLORS.border; });

    ctx.body.appendChild(tplSelect);
  }

  // Additional instructions textarea
  const label = document.createElement('label');
  label.style.cssText = `display:block;font-size:14px;font-weight:600;color:${COLORS.text};margin-bottom:6px;`;
  label.textContent = 'Additional Instructions (optional)';
  ctx.body.appendChild(label);

  const hint = document.createElement('div');
  hint.style.cssText = `font-size:12px;color:${COLORS.textSecondary};margin-bottom:8px;`;
  hint.textContent = 'Add context or specific instructions for the AI to follow when generating the description.';
  ctx.body.appendChild(hint);

  const textareaWrap = document.createElement('div');
  textareaWrap.style.cssText = 'position:relative;';

  const textarea = document.createElement('textarea');
  textarea.style.cssText = `
    width:100%;min-height:120px;padding:10px 12px;
    border:1px solid ${COLORS.border};border-radius:8px;
    font-size:14px;font-family:${FONT_STACK};
    color:${COLORS.text};background:${COLORS.inputBg};
    resize:vertical;outline:none;
  `;
  textarea.placeholder = 'e.g., "Focus on the security implications" or "Mention the migration steps"';
  textarea.maxLength = 2000;

  const charCounter = document.createElement('div');
  charCounter.style.cssText = `
    text-align:right;font-size:11px;color:${COLORS.textMuted};margin-top:4px;
  `;
  charCounter.textContent = '0 / 2000';

  textarea.addEventListener('input', () => {
    charCounter.textContent = `${textarea.value.length} / 2000`;
  });

  textarea.addEventListener('focus', () => {
    textarea.style.borderColor = COLORS.primary;
  });
  textarea.addEventListener('blur', () => {
    textarea.style.borderColor = COLORS.border;
  });

  textareaWrap.appendChild(textarea);
  ctx.body.appendChild(textareaWrap);
  ctx.body.appendChild(charCounter);

  // Past generations for this repo
  if (repoGenerations.length > 0) {
    const section = document.createElement('div');
    section.style.cssText = 'margin-top:16px;';

    const sectionHeader = document.createElement('div');
    sectionHeader.style.cssText = `display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:${COLORS.textSecondary};margin-bottom:8px;`;
    sectionHeader.innerHTML = `${clockIcon}<span>Past Generations for This Repo</span>`;
    section.appendChild(sectionHeader);

    const list = document.createElement('div');
    list.style.cssText = 'display:flex;flex-direction:column;gap:6px;max-height:220px;overflow-y:auto;';

    for (const gen of repoGenerations) {
      const item = document.createElement('div');
      item.style.cssText = `
        display:flex;align-items:center;gap:10px;
        background:${COLORS.bgSecondary};border:1px solid ${COLORS.border};
        border-radius:8px;padding:8px 12px;
      `;

      const info = document.createElement('div');
      info.style.cssText = 'flex:1;min-width:0;';

      const title = document.createElement('div');
      title.style.cssText = `font-size:13px;font-weight:600;color:${COLORS.text};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;`;
      title.textContent = gen.prTitle;
      info.appendChild(title);

      const meta = document.createElement('div');
      meta.style.cssText = `font-size:11px;color:${COLORS.textMuted};margin-top:2px;`;
      const templateName = gen.template?.name || 'No template';
      const dateStr = new Date(gen.createdAt).toLocaleDateString();
      meta.textContent = `${templateName} · ${dateStr}`;
      info.appendChild(meta);

      const previewBtn = document.createElement('button');
      previewBtn.type = 'button';
      previewBtn.style.cssText = `
        background:transparent;color:${COLORS.primary};
        border:1px solid ${COLORS.primaryBorder};border-radius:6px;
        padding:4px 10px;font-size:12px;font-weight:500;
        cursor:pointer;font-family:${FONT_STACK};
        display:flex;align-items:center;gap:4px;
        transition:background 0.15s;flex-shrink:0;
      `;
      previewBtn.innerHTML = `${previewIcon} Preview`;
      previewBtn.addEventListener('mouseenter', () => { previewBtn.style.background = COLORS.primaryLight; });
      previewBtn.addEventListener('mouseleave', () => { previewBtn.style.background = 'transparent'; });
      previewBtn.addEventListener('click', () => {
        renderHistoryPreview(ctx, gen, preGenData);
      });

      item.appendChild(info);
      item.appendChild(previewBtn);
      list.appendChild(item);
    }

    section.appendChild(list);
    ctx.body.appendChild(section);
  }

  // Footer buttons
  const cancelBtn = makeButton('Cancel', 'secondary');
  cancelBtn.addEventListener('click', () => closeModal(ctx));

  const generateBtn = makeButton('Generate', 'primary');

  // Disable if usage exhausted
  const exhausted = usageData && usageData.remaining === 0 && usageData.limit !== -1;
  if (exhausted) {
    generateBtn.disabled = true;
    generateBtn.style.cssText += 'opacity:0.5;cursor:not-allowed;';

    const exhaustedHint = document.createElement('span');
    exhaustedHint.style.cssText = `font-size:12px;color:${COLORS.error};margin-right:auto;`;
    exhaustedHint.textContent = 'Usage limit reached. Upgrade your plan for more.';
    ctx.footer.appendChild(exhaustedHint);
  }

  generateBtn.addEventListener('click', () => {
    renderLoading(ctx, textarea.value.trim() || undefined);
  });

  ctx.footer.appendChild(cancelBtn);
  ctx.footer.appendChild(generateBtn);

  // Focus textarea
  setTimeout(() => textarea.focus(), 50);
}

// ── State: History Preview ──

function renderHistoryPreview(ctx: ModalContext, generation: Generation, cachedData: PreGenData) {
  ctx.body.innerHTML = '';
  ctx.footer.innerHTML = '';

  // Title (read-only)
  const titleLabel = document.createElement('label');
  titleLabel.style.cssText = `display:block;font-size:13px;font-weight:600;color:${COLORS.textSecondary};margin-bottom:4px;`;
  titleLabel.textContent = 'Title';
  ctx.body.appendChild(titleLabel);

  const titleDiv = document.createElement('div');
  titleDiv.style.cssText = `
    width:100%;padding:10px 12px;
    border:1px solid ${COLORS.border};border-radius:8px;
    font-size:15px;font-weight:600;font-family:${FONT_STACK};
    color:${COLORS.text};background:${COLORS.bgSecondary};
    margin-bottom:14px;
  `;
  titleDiv.textContent = generation.prTitle;
  ctx.body.appendChild(titleDiv);

  // Description (read-only)
  const descLabel = document.createElement('label');
  descLabel.style.cssText = `display:block;font-size:13px;font-weight:600;color:${COLORS.textSecondary};margin-bottom:4px;`;
  descLabel.textContent = 'Description';
  ctx.body.appendChild(descLabel);

  const descDiv = document.createElement('div');
  descDiv.style.cssText = `
    width:100%;min-height:calc(85vh * 0.45);max-height:calc(85vh * 0.55);padding:10px 12px;
    border:1px solid ${COLORS.border};border-radius:8px;
    font-size:14px;font-family:${FONT_STACK};
    color:${COLORS.text};background:${COLORS.bgSecondary};
    line-height:1.5;white-space:pre-wrap;overflow-y:auto;
  `;
  descDiv.textContent = generation.prDescription;
  ctx.body.appendChild(descDiv);

  // Meta line
  const metaLine = document.createElement('div');
  metaLine.style.cssText = `
    display:flex;align-items:center;gap:16px;margin-top:10px;
    font-size:12px;color:${COLORS.textMuted};
  `;
  const templateName = generation.template?.name || 'No template';
  const dateStr = new Date(generation.createdAt).toLocaleDateString();
  metaLine.innerHTML = `
    <span>Template: ${escapeHtml(templateName)}</span>
    <span>${escapeHtml(dateStr)}</span>
  `;
  ctx.body.appendChild(metaLine);

  // Footer buttons
  const backBtn = makeButton('Back', 'secondary');
  backBtn.addEventListener('click', () => {
    renderPreGenerate(ctx, cachedData);
  });

  const useBtn = makeButton('Use This', 'primary');
  useBtn.addEventListener('click', () => {
    ctx.adapter.fillTitle(generation.prTitle);
    ctx.adapter.fillDescription(generation.prDescription);
    closeModal(ctx);
  });

  ctx.footer.appendChild(backBtn);
  ctx.footer.appendChild(useBtn);
}

// ── State: Loading ──

async function renderLoading(ctx: ModalContext, additionalPrompt?: string) {
  ctx.body.innerHTML = '';
  ctx.footer.innerHTML = '';
  ctx.body.style.cssText = 'flex:1;display:flex;flex-direction:column;padding:0;position:relative;overflow:hidden;';

  const timers: ReturnType<typeof setTimeout>[] = [];
  let elapsedInterval: ReturnType<typeof setInterval> | null = null;

  // ── Progress bar (absolute) ──
  const progressWrap = document.createElement('div');
  progressWrap.style.cssText = `position:absolute;top:0;left:0;width:100%;height:2px;overflow:hidden;z-index:2;`;
  const progressFill = document.createElement('div');
  progressFill.style.cssText = `
    position:absolute;top:0;height:100%;
    background:linear-gradient(90deg, transparent, ${COLORS.primary}, transparent);
    animation: prism-progress-sweep 2s ease-in-out infinite;
  `;
  progressWrap.appendChild(progressFill);
  ctx.body.appendChild(progressWrap);

  // ── Floating particles (absolute) ──
  const particleField = document.createElement('div');
  particleField.style.cssText = `position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0;`;
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    const x = 15 + Math.random() * 70;
    const size = 1.5 + Math.random() * 2;
    const dur = 7 + Math.random() * 8;
    const delay = -(Math.random() * dur);
    p.style.cssText = `
      position:absolute;bottom:10%;left:${x}%;
      width:${size}px;height:${size}px;border-radius:50%;
      background:${COLORS.primary};
      animation:prism-particle ${dur.toFixed(1)}s ease-in-out infinite;
      animation-delay:${delay.toFixed(1)}s;
    `;
    particleField.appendChild(p);
  }
  ctx.body.appendChild(particleField);

  // ── Content column (flex:1, 5 zones) ──
  const contentCol = document.createElement('div');
  contentCol.style.cssText = `
    display:flex;flex-direction:column;flex:1;
    position:relative;z-index:1;min-height:0;
  `;

  // ── Zone 1: Metadata context bar ──
  const metadata = ctx.adapter.getMetadata();
  const hasMetadata = metadata.repoUrl || metadata.sourceBranch || metadata.targetBranch;

  if (hasMetadata) {
    const metaBar = document.createElement('div');
    metaBar.style.cssText = `
      flex-shrink:0;display:flex;align-items:center;justify-content:center;gap:10px;
      padding:12px 20px;
      background:rgba(139,92,246,0.03);
      border-bottom:1px solid rgba(139,92,246,0.06);
      font-size:12px;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;
      color:${COLORS.textMuted};
    `;

    // Extract short repo name from URL
    let repoName = metadata.repoUrl;
    try {
      const urlObj = new URL(metadata.repoUrl);
      repoName = urlObj.pathname.replace(/^\//, '').replace(/\.git$/, '');
    } catch { /* use full url */ }

    if (repoName) {
      const repoSpan = document.createElement('span');
      repoSpan.style.cssText = `display:inline-flex;align-items:center;gap:5px;color:${COLORS.textSecondary};`;
      repoSpan.innerHTML = `${repoIcon}<span>${escapeHtml(repoName)}</span>`;
      metaBar.appendChild(repoSpan);
    }

    if (metadata.sourceBranch && metadata.targetBranch) {
      const branchFlow = document.createElement('span');
      branchFlow.style.cssText = `display:inline-flex;align-items:center;gap:6px;`;
      branchFlow.innerHTML = `
        <span style="color:${COLORS.primary};font-weight:500;">${escapeHtml(metadata.sourceBranch)}</span>
        ${arrowIcon}
        <span style="color:${COLORS.textSecondary};">${escapeHtml(metadata.targetBranch)}</span>
      `;
      metaBar.appendChild(branchFlow);
    }

    contentCol.appendChild(metaBar);
  }

  // ── Zone 2: Enlarged orbit scene (flex:1 centered) ──
  const orbitZone = document.createElement('div');
  orbitZone.style.cssText = `
    flex:1;display:flex;align-items:center;justify-content:center;
    position:relative;min-height:0;
  `;

  // Ambient glow
  const ambient = document.createElement('div');
  ambient.style.cssText = `
    position:absolute;width:400px;height:400px;
    top:50%;left:50%;transform:translate(-50%,-50%);
    background:radial-gradient(circle, rgba(139,92,246,0.1) 0%, rgba(139,92,246,0.02) 50%, transparent 70%);
    animation:prism-ambient 6s ease-in-out infinite;
    pointer-events:none;
  `;
  orbitZone.appendChild(ambient);

  // Orbit scene (enlarged to 280×280)
  const orbitScene = document.createElement('div');
  orbitScene.style.cssText = `position:relative;width:280px;height:280px;`;

  // Pulse waves (expanding rings from center)
  for (let i = 0; i < 3; i++) {
    const wave = document.createElement('div');
    wave.style.cssText = `
      position:absolute;top:50%;left:50%;
      width:80px;height:80px;border-radius:50%;
      border:1px solid rgba(139,92,246,0.2);
      transform:translate(-50%,-50%);opacity:0;
      animation:prism-wave 4.5s ease-out ${i * 1.5}s infinite;
      pointer-events:none;
    `;
    orbitScene.appendChild(wave);
  }

  // 3D-style elliptical orbits (enlarged)
  const orbits = [
    { size: 250, scaleY: 0.30, rotate: 0,   dur: '8s',  reverse: false, dotSize: 6, counterScale: 3.33 },
    { size: 200, scaleY: 0.35, rotate: 55,  dur: '6s',  reverse: true,  dotSize: 5, counterScale: 2.86 },
    { size: 150, scaleY: 0.25, rotate: -30, dur: '10s', reverse: false, dotSize: 5, counterScale: 4.00 },
  ];

  for (const o of orbits) {
    const tilt = document.createElement('div');
    tilt.style.cssText = `
      position:absolute;top:50%;left:50%;
      transform:translate(-50%,-50%) rotate(${o.rotate}deg) scaleY(${o.scaleY});
      pointer-events:none;
    `;

    const spin = document.createElement('div');
    spin.style.cssText = `
      width:${o.size}px;height:${o.size}px;border-radius:50%;
      border:1px solid rgba(139,92,246,0.06);
      animation:prism-orbit-spin${o.reverse ? '-reverse' : ''} ${o.dur} linear infinite;
      position:relative;
    `;

    const halfDot = o.dotSize / 2;
    const dot = document.createElement('div');
    dot.style.cssText = `
      position:absolute;top:${-halfDot}px;left:calc(50% - ${halfDot}px);
      width:${o.dotSize}px;height:${o.dotSize}px;border-radius:50%;
      background:${COLORS.primary};
      transform:scaleY(${o.counterScale});
      animation:prism-dot-pulse 2s ease-in-out infinite;
    `;

    spin.appendChild(dot);
    tilt.appendChild(spin);
    orbitScene.appendChild(tilt);
  }

  // Core — conic gradient ring (enlarged to 68px)
  const coreOuter = document.createElement('div');
  coreOuter.style.cssText = `
    position:absolute;top:50%;left:50%;
    width:68px;height:68px;
    margin-top:-34px;margin-left:-34px;
    border-radius:50%;
    background:conic-gradient(from 0deg, rgba(139,92,246,0.03), rgba(139,92,246,0.25), rgba(139,92,246,0.03), rgba(139,92,246,0.1), rgba(139,92,246,0.03));
    animation:prism-core-pulse 4s ease-in-out infinite;
  `;

  // Core inner (enlarged to 50px)
  const coreInner = document.createElement('div');
  coreInner.style.cssText = `
    position:absolute;top:50%;left:50%;
    width:50px;height:50px;
    margin-top:-25px;margin-left:-25px;
    border-radius:50%;
    background:${COLORS.bg};
    display:flex;align-items:center;justify-content:center;
    animation:prism-core-breathe 3s ease-in-out infinite;
  `;
  coreInner.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${COLORS.primary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><path d="M6 9v12"/></svg>`;

  coreOuter.appendChild(coreInner);
  orbitScene.appendChild(coreOuter);
  orbitZone.appendChild(orbitScene);
  contentCol.appendChild(orbitZone);

  // ── Zone 3: Compact status row ──
  const statusRow = document.createElement('div');
  statusRow.style.cssText = `
    flex-shrink:0;display:flex;align-items:center;justify-content:center;gap:12px;
    padding:6px 20px 10px;
  `;

  const statusTextEl = document.createElement('div');
  statusTextEl.style.cssText = `
    font-size:15px;font-weight:600;color:${COLORS.textSecondary};
    white-space:nowrap;letter-spacing:0.02em;
    transition:opacity 0.2s ease, transform 0.2s ease;
  `;
  statusTextEl.textContent = LOADING_PHASES[0].text;

  const sepDot = document.createElement('div');
  sepDot.style.cssText = `width:4px;height:4px;border-radius:50%;background:${COLORS.textMuted};flex-shrink:0;`;

  const elapsedEl = document.createElement('div');
  elapsedEl.style.cssText = `
    font-size:12px;color:${COLORS.textMuted};
    font-variant-numeric:tabular-nums;min-width:24px;
  `;

  statusRow.appendChild(statusTextEl);
  statusRow.appendChild(sepDot);
  statusRow.appendChild(elapsedEl);
  contentCol.appendChild(statusRow);

  // ── Zone 4: Horizontal step timeline ──
  const stepLabels = ['Extract', 'Analyze', 'Generate', 'Finalize'];
  const timelineWrap = document.createElement('div');
  timelineWrap.style.cssText = `
    flex-shrink:0;padding:8px 40px 16px;
  `;

  const timelineRow = document.createElement('div');
  timelineRow.style.cssText = `
    display:flex;align-items:center;
  `;

  const stepCircles: HTMLElement[] = [];
  const connectorFills: HTMLElement[] = [];

  for (let i = 0; i < stepLabels.length; i++) {
    // Step column (circle + label)
    const stepCol = document.createElement('div');
    stepCol.style.cssText = `display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0;`;

    const circle = document.createElement('div');
    circle.style.cssText = `
      width:28px;height:28px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      transition:all 0.4s ease;
      ${i === 0
        ? `background:rgba(139,92,246,0.15);border:1.5px solid ${COLORS.primary};box-shadow:0 0 10px rgba(139,92,246,0.25);`
        : `background:transparent;border:1.5px solid ${COLORS.border};`}
    `;

    // Inner pulsing dot for active state (only step 0 starts active)
    if (i === 0) {
      const innerDot = document.createElement('div');
      innerDot.style.cssText = `
        width:8px;height:8px;border-radius:50%;
        background:${COLORS.primary};
        animation:prism-dot-pulse 1.5s ease-in-out infinite;
      `;
      innerDot.className = 'step-inner';
      circle.appendChild(innerDot);
    }

    const label = document.createElement('div');
    label.style.cssText = `
      font-size:10px;font-weight:500;letter-spacing:0.03em;
      transition:color 0.3s ease;
      ${i === 0 ? `color:${COLORS.primary};` : `color:${COLORS.textMuted};`}
    `;
    label.textContent = stepLabels[i];

    stepCircles.push(circle);
    stepCol.appendChild(circle);
    stepCol.appendChild(label);
    timelineRow.appendChild(stepCol);

    // Connector between steps
    if (i < stepLabels.length - 1) {
      const connector = document.createElement('div');
      connector.style.cssText = `
        flex:1;height:2px;background:${COLORS.border};
        position:relative;overflow:hidden;margin:0 4px;
        margin-bottom:22px;
      `;
      const fill = document.createElement('div');
      fill.style.cssText = `
        position:absolute;top:0;left:0;height:100%;width:0%;
        background:${COLORS.primary};
        transition:width 0.6s ease;
      `;
      connector.appendChild(fill);
      connectorFills.push(fill);
      timelineRow.appendChild(connector);
    }
  }

  timelineWrap.appendChild(timelineRow);
  contentCol.appendChild(timelineWrap);

  // Step activation function
  const activateStep = (index: number) => {
    for (let s = 0; s < stepCircles.length; s++) {
      const circle = stepCircles[s];
      const label = circle.nextElementSibling as HTMLElement | null;

      if (s < index) {
        // Completed
        circle.style.cssText = `
          width:28px;height:28px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          transition:all 0.4s ease;
          background:rgba(139,92,246,0.1);border:1.5px solid rgba(139,92,246,0.5);
        `;
        circle.innerHTML = `<div style="animation:prism-check-appear 0.3s ease-out;">${checkIcon}</div>`;
        if (label) label.style.color = COLORS.textSecondary;
      } else if (s === index) {
        // Active
        circle.style.cssText = `
          width:28px;height:28px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          transition:all 0.4s ease;
          background:rgba(139,92,246,0.15);border:1.5px solid ${COLORS.primary};box-shadow:0 0 10px rgba(139,92,246,0.25);
        `;
        circle.innerHTML = `<div style="width:8px;height:8px;border-radius:50%;background:${COLORS.primary};animation:prism-dot-pulse 1.5s ease-in-out infinite;"></div>`;
        if (label) label.style.color = COLORS.primary;
      }
      // Pending steps stay unchanged
    }

    // Fill connectors up to current step
    for (let c = 0; c < connectorFills.length; c++) {
      if (c < index) {
        connectorFills[c].style.width = '100%';
      }
    }
  };

  // ── Zone 5: Horizontal section skeletons ──
  const sectionPreview = document.createElement('div');
  sectionPreview.style.cssText = `
    flex-shrink:0;display:flex;gap:12px;
    padding:0 20px 20px;
    position:relative;z-index:1;
  `;

  const sectionDefs = [
    { name: 'Summary', lines: ['55%', '80%'], revealAt: 0 },
    { name: 'Changes', lines: ['70%', '90%'], revealAt: 2500 },
    { name: 'Details', lines: ['60%', '85%'], revealAt: 5500 },
  ];

  const sectionEls: HTMLElement[] = [];
  for (const sec of sectionDefs) {
    const block = document.createElement('div');
    block.style.cssText = `
      flex:1;padding:12px 14px;border-radius:8px;
      background:rgba(139,92,246,0.02);
      border:1px solid rgba(139,92,246,0.06);
      ${sec.revealAt === 0 ? 'animation:prism-section-reveal 0.4s ease-out;' : 'opacity:0;'}
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      font-size:10px;font-weight:600;text-transform:uppercase;
      letter-spacing:0.08em;color:${COLORS.textMuted};margin-bottom:8px;
    `;
    header.textContent = sec.name;
    block.appendChild(header);

    for (const w of sec.lines) {
      const line = document.createElement('div');
      line.style.cssText = `
        height:8px;width:${w};border-radius:4px;margin-bottom:5px;
        background:linear-gradient(90deg, ${COLORS.progressBg} 25%, ${COLORS.bgTertiary} 50%, ${COLORS.progressBg} 75%);
        background-size:200% 100%;
        animation:prism-shimmer 1.5s ease-in-out infinite;
      `;
      block.appendChild(line);
    }

    sectionEls.push(block);
    sectionPreview.appendChild(block);
  }
  contentCol.appendChild(sectionPreview);
  ctx.body.appendChild(contentCol);

  // ── Schedule section reveals ──
  for (let i = 0; i < sectionDefs.length; i++) {
    if (sectionDefs[i].revealAt > 0) {
      timers.push(setTimeout(() => {
        sectionEls[i].style.opacity = '1';
        sectionEls[i].style.animation = 'prism-section-reveal 0.4s ease-out forwards';
      }, sectionDefs[i].revealAt));
    }
  }

  // ── Schedule status text transitions + step activations ──
  for (let i = 1; i < LOADING_PHASES.length; i++) {
    timers.push(setTimeout(() => {
      // Fade out — slide up
      statusTextEl.style.opacity = '0';
      statusTextEl.style.transform = 'translateY(-4px)';

      timers.push(setTimeout(() => {
        statusTextEl.textContent = LOADING_PHASES[i].text;
        statusTextEl.style.transform = 'translateY(4px)';
        void statusTextEl.offsetHeight;
        statusTextEl.style.opacity = '1';
        statusTextEl.style.transform = 'translateY(0)';

        // Activate step in timeline
        activateStep(i);
      }, 200));
    }, LOADING_PHASES[i].delay));
  }

  // ── Elapsed timer ──
  let elapsed = 0;
  elapsedInterval = setInterval(() => {
    elapsed++;
    elapsedEl.textContent = `${elapsed}s`;
  }, 1000);

  // ── Cleanup ──
  const cleanup = () => {
    for (const t of timers) clearTimeout(t);
    if (elapsedInterval) clearInterval(elapsedInterval);
    ctx.cleanupLoading = null;
  };
  ctx.cleanupLoading = cleanup;

  // ── Perform generation ──
  try {
    const diff = await ctx.adapter.extractDiff();
    if (!diff) {
      throw new Error('Could not extract diff. Try loading the full diff first.');
    }

    const metadata = ctx.adapter.getMetadata();

    const generatePayload: Record<string, string | undefined> = {
      diff,
      platform: ctx.adapter.platform,
      repoUrl: metadata.repoUrl,
      baseBranch: metadata.targetBranch,
      compareBranch: metadata.sourceBranch,
      additionalPrompt,
    };
    if (ctx.overrideTemplateId) {
      generatePayload.templateId = ctx.overrideTemplateId;
    }

    const response = await sendMessage<ExtensionResponse<GenerateResponse>>({
      type: 'GENERATE',
      payload: generatePayload,
    });

    cleanup();

    if (!response.success) {
      throw new Error(response.error || 'Generation failed');
    }

    const result = response.data!;
    ctx.generationId = result.generation.id;
    ctx.originalTitle = result.title;
    ctx.originalDescription = result.description;

    renderPostGenerate(ctx, result);
  } catch (err) {
    cleanup();
    renderPreGenerate(ctx, (err as Error).message || 'An error occurred');
  }
}

// ── State: Post-Generate ──

function renderPostGenerate(ctx: ModalContext, result: GenerateResponse) {
  ctx.body.innerHTML = '';
  ctx.footer.innerHTML = '';
  ctx.body.style.cssText = 'flex:1;overflow-y:auto;padding:20px;';

  // Editable title
  const titleLabel = document.createElement('label');
  titleLabel.style.cssText = `display:block;font-size:13px;font-weight:600;color:${COLORS.textSecondary};margin-bottom:4px;`;
  titleLabel.textContent = 'Title';
  ctx.body.appendChild(titleLabel);

  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.value = result.title;
  titleInput.style.cssText = `
    width:100%;padding:10px 12px;
    border:1px solid ${COLORS.border};border-radius:8px;
    font-size:15px;font-weight:600;font-family:${FONT_STACK};
    color:${COLORS.text};background:${COLORS.inputBg};
    outline:none;margin-bottom:14px;
  `;
  titleInput.addEventListener('focus', () => { titleInput.style.borderColor = COLORS.primary; });
  titleInput.addEventListener('blur', () => { titleInput.style.borderColor = COLORS.border; });
  ctx.body.appendChild(titleInput);

  // Editable description
  const descLabel = document.createElement('label');
  descLabel.style.cssText = `display:block;font-size:13px;font-weight:600;color:${COLORS.textSecondary};margin-bottom:4px;`;
  descLabel.textContent = 'Description';
  ctx.body.appendChild(descLabel);

  const descTextarea = document.createElement('textarea');
  descTextarea.value = result.description;
  descTextarea.style.cssText = `
    width:100%;min-height:calc(85vh * 0.55);padding:10px 12px;
    border:1px solid ${COLORS.border};border-radius:8px;
    font-size:14px;font-family:${FONT_STACK};
    color:${COLORS.text};background:${COLORS.inputBg};
    resize:vertical;outline:none;line-height:1.5;
  `;
  descTextarea.addEventListener('focus', () => { descTextarea.style.borderColor = COLORS.primary; });
  descTextarea.addEventListener('blur', () => { descTextarea.style.borderColor = COLORS.border; });
  ctx.body.appendChild(descTextarea);

  // Meta line
  const metaLine = document.createElement('div');
  metaLine.style.cssText = `
    display:flex;align-items:center;gap:16px;margin-top:10px;
    font-size:12px;color:${COLORS.textMuted};
  `;
  metaLine.innerHTML = `
    <span>Template: ${escapeHtml(result.generation.templateName)}</span>
    <span>${result.usage.used}/${result.usage.limit === -1 ? '\u221e' : result.usage.limit} used</span>
  `;
  ctx.body.appendChild(metaLine);

  // Footer buttons
  const cancelBtn = makeButton('Cancel', 'secondary');
  cancelBtn.addEventListener('click', () => closeModal(ctx));

  const useBtn = makeButton('Use This', 'primary');
  useBtn.addEventListener('click', async () => {
    const editedTitle = titleInput.value;
    const editedDesc = descTextarea.value;

    // Persist edits if changed (best-effort, non-blocking)
    const titleChanged = editedTitle !== ctx.originalTitle;
    const descChanged = editedDesc !== ctx.originalDescription;

    if ((titleChanged || descChanged) && ctx.generationId) {
      const updatePayload: Record<string, string> = { generationId: ctx.generationId };
      if (titleChanged) updatePayload.prTitle = editedTitle;
      if (descChanged) updatePayload.prDescription = editedDesc;

      // Fire-and-forget
      sendMessage({
        type: 'UPDATE_GENERATION',
        payload: updatePayload,
      }).catch(() => {/* best-effort */});
    }

    // Fill form on host page
    ctx.adapter.fillTitle(editedTitle);
    ctx.adapter.fillDescription(editedDesc);

    closeModal(ctx);
  });

  ctx.footer.appendChild(cancelBtn);
  ctx.footer.appendChild(useBtn);

  // Focus title input
  setTimeout(() => titleInput.focus(), 50);
}

// ── Helpers ──

function makeButton(text: string, variant: 'primary' | 'secondary'): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = text;

  if (variant === 'primary') {
    btn.style.cssText = `
      background:${COLORS.primary};color:white;border:none;
      border-radius:8px;padding:8px 20px;font-size:14px;font-weight:600;
      cursor:pointer;font-family:${FONT_STACK};
      transition:opacity 0.15s;
    `;
    btn.addEventListener('mouseenter', () => { if (!btn.disabled) btn.style.opacity = '0.85'; });
    btn.addEventListener('mouseleave', () => { btn.style.opacity = '1'; });
  } else {
    btn.style.cssText = `
      background:transparent;color:${COLORS.textSecondary};
      border:1px solid ${COLORS.border};border-radius:8px;
      padding:8px 20px;font-size:14px;font-weight:500;
      cursor:pointer;font-family:${FONT_STACK};
      transition:background 0.15s;
    `;
    btn.addEventListener('mouseenter', () => { btn.style.background = COLORS.bgTertiary; });
    btn.addEventListener('mouseleave', () => { btn.style.background = 'transparent'; });
  }

  return btn;
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
