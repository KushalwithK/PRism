import type { PlatformAdapter } from './platforms/platform-adapter.js';
import { sendMessage } from '../shared/compat.js';
import type { ExtensionResponse, GenerateResponse, UsageStats, UserProfile, Template, Generation, PaginatedResponse } from '../shared/types.js';

const BUTTON_ID = 'prism-generate-btn';
const MODAL_HOST_ID = 'prism-modal-host';

// ── Design Tokens ──

const COLORS = {
  primary: '#8b6fd4',
  primaryLight: 'rgba(139,111,212,0.12)',
  primaryBorder: 'rgba(139,111,212,0.4)',
  primaryBorderHover: 'rgba(139,111,212,0.6)',
  primaryActive: 'rgba(139,111,212,0.2)',
  bg: '#161b22',
  bgSecondary: '#1c2129',
  bgTertiary: '#21262d',
  text: '#e6edf3',
  textSecondary: '#8b949e',
  textMuted: '#6e7681',
  border: '#30363d',
  error: '#f85149',
  errorBg: 'rgba(248,81,73,0.1)',
  errorBorder: 'rgba(248,81,73,0.3)',
  success: '#3fb950',
  overlay: 'rgba(0,0,0,0.65)',
  progressBg: '#30363d',
  badgeFree: '#6e7681',
  badgePro: '#8b6fd4',
  badgeMax: '#d4a017',
  inputBg: '#0d1117',
};

const FONT_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

// ── Icons ──

const sparkleIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${COLORS.primary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/></svg>`;

const prismLogo = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${COLORS.primary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/></svg>`;

const clockIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${COLORS.textSecondary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;

const previewIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;

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

  @keyframes prism-pulse-glow {
    0%, 100% { transform: translate(-50%,-50%) scale(1); filter: drop-shadow(0 0 4px rgba(139,111,212,0.3)); }
    50% { transform: translate(-50%,-50%) scale(1.06); filter: drop-shadow(0 0 10px rgba(139,111,212,0.5)); }
  }

  @keyframes prism-ring-rotate {
    to { transform: rotate(360deg); }
  }

  @keyframes prism-ring-rotate-reverse {
    to { transform: rotate(-360deg); }
  }

  @keyframes prism-status-in {
    from { opacity: 0; transform: translate(-50%, 6px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }

  @keyframes prism-status-out {
    from { opacity: 1; transform: translate(-50%, 0); }
    to { opacity: 0; transform: translate(-50%, -6px); }
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
    background:${COLORS.overlay};
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

  const badge = document.createElement('span');
  if (user.plan === 'MAX') {
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
  } else if (user.plan === 'PRO') {
    badge.style.cssText = `
      font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;
      background:linear-gradient(135deg, #8b6fd4, #b44adf, #e879de, #b44adf, #8b6fd4);
      background-size:200% auto;
      animation:prism-pro-shine 3s linear infinite;
      color:white;text-transform:uppercase;letter-spacing:0.5px;
      text-shadow:0 0 6px rgba(232,121,222,0.5);
      box-shadow:0 0 8px rgba(139,111,212,0.4);
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
  ctx.body.style.position = 'relative';

  // Track all timers for cleanup
  const timers: ReturnType<typeof setTimeout>[] = [];
  let elapsedInterval: ReturnType<typeof setInterval> | null = null;

  // ── Progress bar ──
  const progressBarWrap = document.createElement('div');
  progressBarWrap.style.cssText = `position:absolute;top:0;left:0;width:100%;height:2px;overflow:hidden;`;

  const progressFill = document.createElement('div');
  progressFill.style.cssText = `
    position:absolute;top:0;height:100%;
    background:linear-gradient(90deg, transparent, ${COLORS.primary}, transparent);
    animation: prism-progress-sweep 2s ease-in-out infinite;
  `;
  progressBarWrap.appendChild(progressFill);
  ctx.body.appendChild(progressBarWrap);

  // ── Central area ──
  const centralArea = document.createElement('div');
  centralArea.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding-top:15vh;';

  // Orb container
  const orbContainer = document.createElement('div');
  orbContainer.style.cssText = 'position:relative;width:64px;height:64px;margin-bottom:20px;';

  // Ring 1 — outer, clockwise
  const ring1 = document.createElement('div');
  ring1.style.cssText = `
    position:absolute;inset:0;border-radius:50%;
    border:1.5px solid rgba(139,111,212,0.25);
    border-top-color:rgba(139,111,212,0.7);
    animation: prism-ring-rotate 3s linear infinite;
  `;
  orbContainer.appendChild(ring1);

  // Ring 2 — inner, counter-clockwise
  const ring2 = document.createElement('div');
  ring2.style.cssText = `
    position:absolute;inset:6px;border-radius:50%;
    border:1px dashed rgba(139,111,212,0.15);
    border-top-color:rgba(139,111,212,0.4);
    animation: prism-ring-rotate-reverse 5s linear infinite;
  `;
  orbContainer.appendChild(ring2);

  // Sparkle icon — centered, pulsing
  const sparkle = document.createElement('div');
  sparkle.style.cssText = `
    position:absolute;top:50%;left:50%;
    animation: prism-pulse-glow 2.5s ease-in-out infinite;
  `;
  sparkle.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${COLORS.primary}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/></svg>`;
  orbContainer.appendChild(sparkle);

  centralArea.appendChild(orbContainer);

  // ── Status text area ──
  const statusArea = document.createElement('div');
  statusArea.style.cssText = 'position:relative;width:240px;height:20px;overflow:hidden;margin-bottom:8px;';

  const statusText = document.createElement('div');
  statusText.style.cssText = `
    position:absolute;left:50%;transform:translate(-50%,0);
    font-size:14px;color:${COLORS.textSecondary};font-weight:500;white-space:nowrap;
    animation: prism-status-in 0.3s ease-out;
  `;
  statusText.textContent = LOADING_PHASES[0].text;
  statusArea.appendChild(statusText);

  centralArea.appendChild(statusArea);

  // ── Elapsed timer ──
  const elapsedTime = document.createElement('div');
  elapsedTime.style.cssText = `font-size:11px;color:${COLORS.textMuted};font-variant-numeric:tabular-nums;min-height:16px;`;
  centralArea.appendChild(elapsedTime);

  ctx.body.appendChild(centralArea);

  // ── Section skeletons ──
  const sectionPreview = document.createElement('div');
  sectionPreview.style.cssText = 'display:flex;flex-direction:column;gap:20px;max-width:480px;margin:40px auto 0;width:100%;';

  const sectionDefs = [
    { name: 'Summary', lines: ['55%', '80%'], revealAt: 0 },
    { name: 'Changes', lines: ['70%', '90%', '50%'], revealAt: 2500 },
    { name: 'Details', lines: ['60%', '85%'], revealAt: 5500 },
  ];

  const sectionEls: HTMLElement[] = [];
  for (const sec of sectionDefs) {
    const sectionBlock = document.createElement('div');
    sectionBlock.style.cssText = sec.revealAt === 0
      ? 'animation: prism-section-reveal 0.4s ease-out;'
      : 'opacity:0;';

    const sectionHeader = document.createElement('div');
    sectionHeader.style.cssText = `
      font-size:11px;font-weight:600;text-transform:uppercase;
      letter-spacing:0.05em;color:${COLORS.textMuted};margin-bottom:8px;
    `;
    sectionHeader.textContent = sec.name;
    sectionBlock.appendChild(sectionHeader);

    for (const w of sec.lines) {
      const line = document.createElement('div');
      line.style.cssText = `
        height:10px;width:${w};border-radius:3px;margin-bottom:6px;
        background:linear-gradient(90deg, ${COLORS.progressBg} 25%, ${COLORS.bgTertiary} 50%, ${COLORS.progressBg} 75%);
        background-size:200% 100%;
        animation: prism-shimmer 1.5s ease-in-out infinite;
      `;
      sectionBlock.appendChild(line);
    }

    sectionEls.push(sectionBlock);
    sectionPreview.appendChild(sectionBlock);
  }
  ctx.body.appendChild(sectionPreview);

  // ── Schedule section reveals ──
  for (let i = 0; i < sectionDefs.length; i++) {
    if (sectionDefs[i].revealAt > 0) {
      const t = setTimeout(() => {
        sectionEls[i].style.cssText = 'animation: prism-section-reveal 0.4s ease-out forwards;';
      }, sectionDefs[i].revealAt);
      timers.push(t);
    }
  }

  // ── Schedule status text transitions ──
  for (let i = 1; i < LOADING_PHASES.length; i++) {
    const t = setTimeout(() => {
      // Fade out current
      statusText.style.animation = 'prism-status-out 0.2s ease-in forwards';
      const swapTimer = setTimeout(() => {
        statusText.textContent = LOADING_PHASES[i].text;
        statusText.style.animation = 'prism-status-in 0.3s ease-out forwards';
      }, 200);
      timers.push(swapTimer);
    }, LOADING_PHASES[i].delay);
    timers.push(t);
  }

  // ── Elapsed time counter ──
  let elapsed = 0;
  elapsedInterval = setInterval(() => {
    elapsed++;
    elapsedTime.textContent = `${elapsed}s`;
  }, 1000);

  // ── Cleanup function ──
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
