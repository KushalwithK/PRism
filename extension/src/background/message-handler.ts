import type { ExtensionMessage, ExtensionResponse } from '../shared/types.js';
import { browserAPI } from '../shared/compat.js';
import { login, register, logout, getAuthState } from './auth-manager.js';
import { apiRequest } from './api-client.js';

export function setupMessageHandler() {
  browserAPI.runtime.onMessage.addListener(
    (message: ExtensionMessage, _sender, sendResponse) => {
      handleMessage(message)
        .then(sendResponse)
        .catch((err) => {
          sendResponse({
            success: false,
            error: err?.message || String(err),
          } satisfies ExtensionResponse);
        });
      return true; // keep channel open for async response
    },
  );
}

async function handleMessage(message: ExtensionMessage): Promise<ExtensionResponse> {
  switch (message.type) {
    case 'GET_AUTH_STATE': {
      const state = await getAuthState();
      return { success: true, data: state };
    }

    case 'LOGIN': {
      const { email, password } = message.payload as { email: string; password: string };
      const data = await login(email, password);
      return { success: true, data };
    }

    case 'REGISTER': {
      const { email, password, name } = message.payload as {
        email: string;
        password: string;
        name: string;
      };
      const data = await register(email, password, name);
      return { success: true, data };
    }

    case 'LOGOUT': {
      await logout();
      return { success: true };
    }

    case 'GENERATE': {
      const payload = message.payload as { diff: string; platform: string; repoUrl: string; templateId?: string };
      const data = await apiRequest('/api/generate', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return { success: true, data };
    }

    case 'GET_TEMPLATES': {
      const data = await apiRequest('/api/templates');
      return { success: true, data };
    }

    case 'GET_HISTORY': {
      const params = message.payload as { page?: number; pageSize?: number } | undefined;
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.pageSize) query.set('pageSize', String(params.pageSize));
      const qs = query.toString();
      const data = await apiRequest(`/api/history${qs ? `?${qs}` : ''}`);
      return { success: true, data };
    }

    case 'GET_USAGE': {
      const data = await apiRequest('/api/usage');
      return { success: true, data };
    }

    case 'GET_PROFILE': {
      const data = await apiRequest('/api/auth/profile');
      return { success: true, data };
    }

    case 'UPDATE_GENERATION': {
      const { generationId, prTitle, prDescription } = message.payload as {
        generationId: string;
        prTitle?: string;
        prDescription?: string;
      };
      const body: Record<string, string> = {};
      if (prTitle !== undefined) body.prTitle = prTitle;
      if (prDescription !== undefined) body.prDescription = prDescription;
      const data = await apiRequest(`/api/history/${generationId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      return { success: true, data };
    }

    case 'SET_DEFAULT_TEMPLATE': {
      const { templateId } = message.payload as { templateId: string };
      const data = await apiRequest(`/api/templates/${templateId}/set-default`, {
        method: 'PATCH',
      });
      return { success: true, data };
    }

    case 'CREATE_TEMPLATE': {
      const { name, description, body } = message.payload as {
        name: string;
        description: string;
        body: string;
      };
      const data = await apiRequest('/api/templates', {
        method: 'POST',
        body: JSON.stringify({ name, description, body }),
      });
      return { success: true, data };
    }

    case 'UPDATE_TEMPLATE': {
      const { templateId, ...fields } = message.payload as {
        templateId: string;
        name?: string;
        description?: string;
        body?: string;
      };
      const data = await apiRequest(`/api/templates/${templateId}`, {
        method: 'PUT',
        body: JSON.stringify(fields),
      });
      return { success: true, data };
    }

    case 'DELETE_TEMPLATE': {
      const { templateId } = message.payload as { templateId: string };
      await apiRequest(`/api/templates/${templateId}`, {
        method: 'DELETE',
      });
      return { success: true };
    }

    default:
      return { success: false, error: `Unknown message type: ${message.type}` };
  }
}
