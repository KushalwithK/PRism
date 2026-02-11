import { sendMessage } from '../../shared/compat.js';
import type { ExtensionResponse, UserProfile, Template, CreateTemplateRequest, UpdateTemplateRequest } from '../../shared/types.js';
import { SAMPLE_PLACEHOLDER_VALUES, PLACEHOLDERS, renderTemplate } from '@prism/shared';

let currentTemplates: Template[] = [];
let currentUserPlan: string = 'FREE';

export function renderSettingsView(container: HTMLElement) {
  container.innerHTML = `
    <div class="skeleton skeleton-card" style="height:120px;"></div>
    <div class="skeleton skeleton-card" style="height:80px;margin-top:16px;"></div>
  `;

  loadProfile(container);
}

async function loadProfile(container: HTMLElement) {
  try {
    const [profileRes, templatesRes] = await Promise.all([
      sendMessage<ExtensionResponse<UserProfile>>({ type: 'GET_PROFILE' }),
      sendMessage<ExtensionResponse<Template[]>>({ type: 'GET_TEMPLATES' }),
    ]);

    if (!profileRes.success || !profileRes.data) {
      container.innerHTML = '<div class="alert alert-error">\u2716 Failed to load profile</div>';
      return;
    }

    const user = profileRes.data;
    currentTemplates = templatesRes.data ?? [];
    const defaultId = user.defaultTemplateId;
    const initials = getInitials(user.name);
    const prismSub = user.subscriptions.find((s) => s.productSlug === 'prism');
    const userPlan = prismSub?.plan ?? 'FREE';
    currentUserPlan = userPlan;
    const userUsageCount = prismSub?.usageCount ?? 0;
    const planLimit = prismSub?.usageLimit ?? 5;
    const isUnlimited = planLimit === -1;
    const usageLimit = isUnlimited ? '&infin;' : String(planLimit);
    const usagePercent = isUnlimited ? 0 : Math.min((userUsageCount / planLimit) * 100, 100);

    container.innerHTML = `
      <div class="section-title">Account</div>
      <div class="card-static">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px;">
          <div class="avatar">${escapeHtml(initials)}</div>
          <div>
            <div style="font-size:16px;font-weight:700;color:var(--text-primary);">${escapeHtml(user.name)}</div>
            <div style="font-size:13px;color:var(--text-secondary);margin-top:2px;">${escapeHtml(user.email)}</div>
          </div>
        </div>
        <div class="divider"></div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;">
          <span style="font-size:13px;color:var(--text-secondary);">Plan</span>
          <span class="usage-badge">${escapeHtml(userPlan)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;margin-top:4px;">
          <span style="font-size:13px;color:var(--text-secondary);">Generations</span>
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:13px;font-weight:600;color:var(--text-primary);">${userUsageCount} / ${usageLimit}</span>
            ${!isUnlimited ? `
              <div class="progress-track" style="width:48px;height:4px;margin:0;">
                <div class="progress-fill" style="width:${usagePercent}%"></div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      ${userPlan === 'FREE' ? `
        <button class="btn btn-primary" id="btn-upgrade-plan" style="margin-top:8px;">
          <span class="btn-label">Upgrade Plan</span>
        </button>
      ` : userPlan !== 'MAX' ? `
        <button class="btn btn-secondary" id="btn-upgrade-plan" style="margin-top:8px;">
          <span class="btn-label">Upgrade to ${userPlan === 'PRO' ? 'Max' : 'a Higher Plan'}</span>
        </button>
      ` : ''}

      <div class="section-title" style="margin-top:16px;">Default Template</div>
      <div class="form-group">
        <select id="settings-template-select">
          ${currentTemplates.map((t) => `
            <option value="${t.id}" ${t.id === defaultId ? 'selected' : ''}>
              ${escapeHtml(t.name)}${t.isPredefined ? ' (built-in)' : ''}
            </option>
          `).join('')}
        </select>
      </div>
      <div id="settings-template-alert"></div>
      <div class="card-static" style="margin-top:4px;">
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-tertiary);margin-bottom:8px;">Preview</div>
        <div id="settings-template-preview" class="template-preview-body"></div>
      </div>

      <div style="margin-top:16px;">
        <div class="section-header">
          <span class="section-title" style="margin-bottom:0;">My Templates</span>
          <button class="btn-new-template" id="btn-new-template"${userPlan === 'FREE' ? ' disabled title="Requires Pro plan" style="opacity:0.5;cursor:not-allowed;"' : ''}>+ New</button>
        </div>
        <div id="my-templates-list"></div>
      </div>

      <div class="section-title" style="margin-top:16px;">About</div>
      <div class="card-static">
        <div style="font-size:16px;font-weight:700;margin-bottom:6px;background:linear-gradient(135deg,var(--accent-light),var(--accent-primary));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;">PRism v1.0.0</div>
        <div style="font-size:13px;color:var(--text-tertiary);line-height:1.5;">
          AI-powered PR description generator for GitHub and GitLab.
        </div>
      </div>
    `;

    // Render initial preview
    const selectedTemplate = currentTemplates.find((t) => t.id === defaultId) ?? currentTemplates[0];
    updatePreview(selectedTemplate);

    // Render custom templates list
    const customTemplates = currentTemplates.filter((t) => !t.isPredefined);
    renderTemplateList(customTemplates, container);

    // On dropdown change: update preview + persist default
    document.getElementById('settings-template-select')!.addEventListener('change', async (e) => {
      const templateId = (e.target as HTMLSelectElement).value;
      const template = currentTemplates.find((t) => t.id === templateId);
      updatePreview(template);

      const alertEl = document.getElementById('settings-template-alert')!;
      try {
        const res = await sendMessage<ExtensionResponse>({
          type: 'SET_DEFAULT_TEMPLATE',
          payload: { templateId },
        });
        if (res.success) {
          alertEl.innerHTML = '<div class="alert alert-success">\u2714 Default template updated</div>';
        } else {
          alertEl.innerHTML = `<div class="alert alert-error">\u2716 ${res.error || 'Failed to save'}</div>`;
        }
        setTimeout(() => { alertEl.innerHTML = ''; }, 2000);
      } catch {
        alertEl.innerHTML = '<div class="alert alert-error">\u2716 Failed to save preference</div>';
      }
    });

    // Upgrade plan button
    const upgradeBtnEl = document.getElementById('btn-upgrade-plan');
    if (upgradeBtnEl) {
      upgradeBtnEl.addEventListener('click', async () => {
        try {
          const res = await sendMessage<ExtensionResponse<{ url: string }>>({
            type: 'GET_UPGRADE_URL',
          });
          if (res.success && res.data?.url) {
            chrome.tabs.create({ url: res.data.url });
          }
        } catch {
          // Silently fail
        }
      });
    }

    // New template button
    document.getElementById('btn-new-template')!.addEventListener('click', () => {
      if (currentUserPlan === 'FREE') return;
      showTemplateModal(null, container);
    });
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">\u2716 ${(err as Error).message}</div>`;
  }
}

function renderTemplateList(customTemplates: Template[], container: HTMLElement) {
  const listEl = document.getElementById('my-templates-list');
  if (!listEl) return;

  const newList = document.createElement('div');
  newList.id = 'my-templates-list';

  if (customTemplates.length === 0) {
    newList.innerHTML = `
      <div class="card-static" style="text-align:center;padding:20px;color:var(--text-tertiary);font-size:13px;">
        No custom templates yet
      </div>
    `;
  } else {
    newList.innerHTML = customTemplates.map((t) => `
      <div class="template-card" data-id="${t.id}">
        <div class="template-card-info">
          <div class="template-card-name">${escapeHtml(t.name)}</div>
          ${t.description ? `<div class="template-card-desc">${escapeHtml(t.description)}</div>` : ''}
        </div>
        <div class="template-card-actions">
          <button class="btn-icon-sm" data-action="edit" data-id="${t.id}" title="Edit">
            <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon-sm btn-icon-sm--danger" data-action="delete" data-id="${t.id}" title="Delete">
            <svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `).join('');
  }

  // Event delegation for edit/delete
  newList.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    const template = currentTemplates.find((t) => t.id === id);
    if (!template) return;

    if (action === 'edit') {
      showTemplateModal(template, container);
    } else if (action === 'delete') {
      showDeleteConfirm(template, container);
    }
  });

  listEl.replaceWith(newList);
}

function showTemplateModal(template: Template | null, container: HTMLElement) {
  const isEdit = template !== null;
  const title = isEdit ? 'Edit Template' : 'New Template';
  const placeholderKeys = Object.keys(PLACEHOLDERS);

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card" style="max-height:88%;">
      <div class="modal-header">
        <div class="modal-header-title">${title}</div>
        <button class="modal-close" id="tpl-modal-close">
          <svg viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
      <div class="modal-body" style="overflow-y:auto;">
        <div class="form-group">
          <label>Name *</label>
          <input type="text" id="tpl-name" placeholder="e.g. My Custom Template" value="${isEdit ? escapeAttr(template.name) : ''}">
        </div>
        <div class="form-group">
          <label>Description</label>
          <input type="text" id="tpl-description" placeholder="Optional description" value="${isEdit ? escapeAttr(template.description) : ''}">
        </div>
        <div class="form-group">
          <label>Body *</label>
          <textarea class="template-body-textarea" id="tpl-body" placeholder="Use {placeholder} syntax...">${isEdit ? escapeHtml(template.body) : ''}</textarea>
          <div style="font-size:11px;color:var(--text-tertiary);margin-top:4px;">Click a placeholder below to insert it at cursor position</div>
          <div class="placeholder-chips" id="tpl-chips">
            ${placeholderKeys.map((k) => `<span class="placeholder-chip" data-key="${k}" title="${escapeAttr(PLACEHOLDERS[k].description)}">{${k}}</span>`).join('')}
          </div>
        </div>
        <div style="margin-top:12px;">
          <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-tertiary);margin-bottom:8px;">Live Preview</div>
          <div id="tpl-preview" class="template-preview-body"></div>
        </div>
        <div id="tpl-modal-error" style="margin-top:8px;"></div>
      </div>
      <div class="modal-footer">
        <div class="modal-footer-buttons">
          <button class="btn btn-secondary" id="tpl-cancel">Cancel</button>
          <button class="btn btn-primary" id="tpl-save">
            <span class="btn-label">${isEdit ? 'Save' : 'Create'}</span>
            <span class="btn-spinner"></span>
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const nameInput = overlay.querySelector<HTMLInputElement>('#tpl-name')!;
  const descInput = overlay.querySelector<HTMLInputElement>('#tpl-description')!;
  const bodyTextarea = overlay.querySelector<HTMLTextAreaElement>('#tpl-body')!;
  const previewEl = overlay.querySelector<HTMLElement>('#tpl-preview')!;
  const errorEl = overlay.querySelector<HTMLElement>('#tpl-modal-error')!;
  const saveBtn = overlay.querySelector<HTMLButtonElement>('#tpl-save')!;

  function updateLivePreview() {
    const body = bodyTextarea.value;
    if (body.trim()) {
      const rendered = renderTemplate(body, SAMPLE_PLACEHOLDER_VALUES);
      previewEl.innerHTML = escapeHtml(rendered).replace(/\n/g, '<br>');
    } else {
      previewEl.innerHTML = '<span style="color:var(--text-tertiary);font-style:italic;">Enter a template body to see preview</span>';
    }
  }

  updateLivePreview();
  bodyTextarea.addEventListener('input', updateLivePreview);

  // Placeholder chip insertion
  overlay.querySelector('#tpl-chips')!.addEventListener('click', (e) => {
    const chip = (e.target as HTMLElement).closest<HTMLElement>('.placeholder-chip');
    if (!chip) return;
    const key = chip.dataset.key!;
    const insertion = `{${key}}`;
    const start = bodyTextarea.selectionStart;
    const end = bodyTextarea.selectionEnd;
    const before = bodyTextarea.value.substring(0, start);
    const after = bodyTextarea.value.substring(end);
    bodyTextarea.value = before + insertion + after;
    bodyTextarea.selectionStart = bodyTextarea.selectionEnd = start + insertion.length;
    bodyTextarea.focus();
    updateLivePreview();
  });

  function closeModal() {
    overlay.remove();
  }

  overlay.querySelector('#tpl-modal-close')!.addEventListener('click', closeModal);
  overlay.querySelector('#tpl-cancel')!.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  function handleEscape(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscape);
    }
  }
  document.addEventListener('keydown', handleEscape);

  // Save handler
  saveBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    const description = descInput.value.trim();
    const body = bodyTextarea.value.trim();

    // Validation
    if (!name) {
      errorEl.innerHTML = '<div class="alert alert-error">\u2716 Name is required</div>';
      nameInput.focus();
      return;
    }
    if (!body) {
      errorEl.innerHTML = '<div class="alert alert-error">\u2716 Body is required</div>';
      bodyTextarea.focus();
      return;
    }
    if (!/\{\w+\}/.test(body)) {
      errorEl.innerHTML = '<div class="alert alert-error">\u2716 Body must contain at least one {placeholder}</div>';
      bodyTextarea.focus();
      return;
    }

    errorEl.innerHTML = '';
    saveBtn.classList.add('btn--loading');
    saveBtn.disabled = true;

    try {
      if (isEdit) {
        const payload: UpdateTemplateRequest & { templateId: string } = {
          templateId: template.id,
          name,
          description,
          body,
        };
        const res = await sendMessage<ExtensionResponse>({
          type: 'UPDATE_TEMPLATE',
          payload,
        });
        if (!res.success) {
          errorEl.innerHTML = `<div class="alert alert-error">\u2716 ${res.error || 'Failed to update'}</div>`;
          return;
        }
      } else {
        const payload: CreateTemplateRequest = { name, description, body };
        const res = await sendMessage<ExtensionResponse>({
          type: 'CREATE_TEMPLATE',
          payload,
        });
        if (!res.success) {
          errorEl.innerHTML = `<div class="alert alert-error">\u2716 ${res.error || 'Failed to create'}</div>`;
          return;
        }
      }

      closeModal();
      document.removeEventListener('keydown', handleEscape);
      await refreshTemplates(container);
    } catch (err) {
      errorEl.innerHTML = `<div class="alert alert-error">\u2716 ${(err as Error).message}</div>`;
    } finally {
      saveBtn.classList.remove('btn--loading');
      saveBtn.disabled = false;
    }
  });
}

function showDeleteConfirm(template: Template, container: HTMLElement) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card" style="max-width:300px;">
      <div class="modal-header">
        <div class="modal-header-title">Delete Template</div>
        <button class="modal-close" id="del-modal-close">
          <svg viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <div style="font-size:14px;font-weight:600;color:var(--text-primary);margin-bottom:8px;">${escapeHtml(template.name)}</div>
        <div style="font-size:13px;color:var(--text-tertiary);">This cannot be undone.</div>
        <div id="del-modal-error" style="margin-top:8px;"></div>
      </div>
      <div class="modal-footer">
        <div class="modal-footer-buttons">
          <button class="btn btn-secondary" id="del-cancel">Cancel</button>
          <button class="btn btn-danger" id="del-confirm">
            <span class="btn-label">Delete</span>
            <span class="btn-spinner"></span>
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const errorEl = overlay.querySelector<HTMLElement>('#del-modal-error')!;
  const confirmBtn = overlay.querySelector<HTMLButtonElement>('#del-confirm')!;

  function closeModal() {
    overlay.remove();
  }

  overlay.querySelector('#del-modal-close')!.addEventListener('click', closeModal);
  overlay.querySelector('#del-cancel')!.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  function handleEscape(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscape);
    }
  }
  document.addEventListener('keydown', handleEscape);

  confirmBtn.addEventListener('click', async () => {
    confirmBtn.classList.add('btn--loading');
    confirmBtn.disabled = true;

    try {
      const res = await sendMessage<ExtensionResponse>({
        type: 'DELETE_TEMPLATE',
        payload: { templateId: template.id },
      });
      if (!res.success) {
        errorEl.innerHTML = `<div class="alert alert-error">\u2716 ${res.error || 'Failed to delete'}</div>`;
        return;
      }

      closeModal();
      document.removeEventListener('keydown', handleEscape);
      await refreshTemplates(container);
    } catch (err) {
      errorEl.innerHTML = `<div class="alert alert-error">\u2716 ${(err as Error).message}</div>`;
    } finally {
      confirmBtn.classList.remove('btn--loading');
      confirmBtn.disabled = false;
    }
  });
}

async function refreshTemplates(container: HTMLElement) {
  try {
    const res = await sendMessage<ExtensionResponse<Template[]>>({ type: 'GET_TEMPLATES' });
    if (!res.success || !res.data) return;

    currentTemplates = res.data;
    const customTemplates = currentTemplates.filter((t) => !t.isPredefined);
    renderTemplateList(customTemplates, container);

    // Update dropdown options, preserving current selection
    const select = document.getElementById('settings-template-select') as HTMLSelectElement | null;
    if (!select) return;

    const previousValue = select.value;
    select.innerHTML = currentTemplates.map((t) => `
      <option value="${t.id}">
        ${escapeHtml(t.name)}${t.isPredefined ? ' (built-in)' : ''}
      </option>
    `).join('');

    // Restore selection if it still exists, otherwise fall back to first
    const stillExists = currentTemplates.some((t) => t.id === previousValue);
    if (stillExists) {
      select.value = previousValue;
    } else {
      select.value = currentTemplates[0]?.id ?? '';
    }

    // Update preview for current selection
    const selected = currentTemplates.find((t) => t.id === select.value);
    updatePreview(selected);
  } catch {
    // Silently fail — user can manually refresh
  }
}

function updatePreview(template: Template | undefined) {
  const previewEl = document.getElementById('settings-template-preview');
  if (!previewEl || !template) return;
  const rendered = renderTemplate(template.body, SAMPLE_PLACEHOLDER_VALUES);
  previewEl.innerHTML = escapeHtml(rendered).replace(/\n/g, '<br>');
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
