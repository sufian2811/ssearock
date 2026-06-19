const API_URL = import.meta.env.VITE_API_URL || '/api';

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

async function parseResponse(res) {
  const text = await res.text();
  if (!text) {
    if (!res.ok) {
      throw new Error(
        res.status === 404
          ? 'API not found. Backend may not be deployed. Set VITE_API_URL in Vercel env vars.'
          : `Server error (${res.status}). Check backend is running and env vars are set.`
      );
    }
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Server returned an invalid response. Check backend deployment and API URL.');
  }
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error('Cannot reach API server. Check your internet connection and backend URL.');
  }

  const data = await parseResponse(res);
  if (!res.ok && res.status !== 207) {
    throw new Error(data.error || data.warning || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  auth: {
    login: (email, password) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    me: () => request('/auth/me'),
  },
  leads: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/leads${query ? `?${query}` : ''}`);
    },
    get: (id) => request(`/leads/${id}`),
    create: (data) => request('/leads', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/leads/${id}`, { method: 'DELETE' }),
    deleteBulk: (leadIds) =>
      request('/leads/delete-bulk', { method: 'POST', body: JSON.stringify({ leadIds }) }),
    uploadExcel: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const headers = {};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;
      let res;
      try {
        res = await fetch(`${API_URL}/leads/upload`, {
          method: 'POST',
          headers,
          body: formData,
        });
      } catch {
        throw new Error('Cannot reach API server for file upload.');
      }
      const data = await parseResponse(res);
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      return data;
    },
  },
  messages: {
    getConversation: (leadId) => request(`/messages/conversation/${leadId}`),
    getConversations: () => request('/messages/conversations'),
    send: (data) => request('/messages/send', { method: 'POST', body: JSON.stringify(data) }),
    sendBulk: (data) => request('/messages/send-bulk', { method: 'POST', body: JSON.stringify(data) }),
    getTemplates: () => request('/messages/templates'),
    createTemplate: (data) => request('/messages/templates', { method: 'POST', body: JSON.stringify(data) }),
    deleteTemplate: (id) => request(`/messages/templates/${id}`, { method: 'DELETE' }),
    getWindowStatus: (leadId) => request(`/messages/window-status/${leadId}`),
    getStatus: () => request('/messages/status'),
  },
};
