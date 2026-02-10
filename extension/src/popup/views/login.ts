import { sendMessage } from '../../shared/compat.js';
import type { ExtensionResponse, AuthResponse } from '../../shared/types.js';

export function renderLoginView(
  container: HTMLElement,
  onAuth: () => void,
) {
  let isLogin = true;

  function render() {
    container.innerHTML = `
      <div style="text-align:center;padding:20px 0 16px;">
        <div style="display:inline-flex;align-items:center;gap:8px;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><path d="M6 9v12"/></svg>
          <span style="font-size:22px;font-weight:700;background:linear-gradient(135deg,var(--accent-light),var(--accent-primary));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;">PRism</span>
        </div>
        <p style="font-size:13px;color:var(--text-secondary);margin-top:6px;">AI-powered PR descriptions for GitHub & GitLab</p>
      </div>
      <div class="tab-toggle">
        <button class="${isLogin ? 'active' : ''}" id="tab-login">Login</button>
        <button class="${!isLogin ? 'active' : ''}" id="tab-register">Register</button>
      </div>
      <div id="auth-alert"></div>
      <form id="auth-form">
        ${!isLogin ? `
          <div class="form-field">
            <input type="text" id="name" placeholder="Your name" required>
            <label for="name">Name</label>
          </div>
        ` : ''}
        <div class="form-field">
          <input type="email" id="email" placeholder="you@example.com" required>
          <label for="email">Email</label>
        </div>
        <div class="form-field">
          <input type="password" id="password" placeholder="${isLogin ? 'Your password' : 'Min 8 characters'}" minlength="8" required>
          <label for="password">Password</label>
        </div>
        <button type="submit" class="btn btn-primary" id="auth-submit">
          <span class="btn-label">${isLogin ? 'Login' : 'Create Account'}</span>
          <span class="btn-spinner"></span>
        </button>
      </form>
      <div style="text-align:center;margin-top:20px;font-size:11px;color:var(--text-tertiary);">
        Powered by <strong style="color:var(--text-secondary);">Lucent</strong>
      </div>
    `;

    container.querySelector('#tab-login')!.addEventListener('click', () => {
      isLogin = true;
      render();
    });

    container.querySelector('#tab-register')!.addEventListener('click', () => {
      isLogin = false;
      render();
    });

    container.querySelector('#auth-form')!.addEventListener('submit', async (e) => {
      e.preventDefault();
      const alert = container.querySelector('#auth-alert')!;
      const submitBtn = container.querySelector('#auth-submit') as HTMLButtonElement;

      const email = (container.querySelector('#email') as HTMLInputElement).value;
      const password = (container.querySelector('#password') as HTMLInputElement).value;

      submitBtn.disabled = true;
      submitBtn.classList.add('btn--loading');
      alert.innerHTML = '';

      try {
        let response: ExtensionResponse<AuthResponse>;

        if (isLogin) {
          response = await sendMessage<ExtensionResponse<AuthResponse>>({
            type: 'LOGIN',
            payload: { email, password },
          });
        } else {
          const name = (container.querySelector('#name') as HTMLInputElement).value;
          response = await sendMessage<ExtensionResponse<AuthResponse>>({
            type: 'REGISTER',
            payload: { email, password, name },
          });
        }

        if (response.success) {
          onAuth();
        } else {
          alert.innerHTML = `<div class="alert alert-error">\u2716 ${response.error || 'Authentication failed'}</div>`;
        }
      } catch (err) {
        alert.innerHTML = `<div class="alert alert-error">\u2716 ${(err as Error).message || 'An error occurred'}</div>`;
      } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('btn--loading');
      }
    });
  }

  render();
}
