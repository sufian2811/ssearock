const API_URL = import.meta.env.VITE_API_URL || '/api';

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

async function parseResponse(res) {
  const text = await res.text();

  if (!text) {
    if (res.status === 404) {
      throw new Error(
        'Backend API not found. Deploy the backend on Render/Railway and set VITE_API_URL in Vercel environment variables.'
      );
    }
    throw new Error(`Server returned empty response (${res.status})`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      'Cannot reach backend API. Set VITE_API_URL in Vercel to your deployed backend URL (e.g. https://your-app.onrender.com/api).'
    );
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
    throw new Error(
      'Cannot connect to backend. Deploy backend on Render/Railway and set VITE_API_URL in Vercel.'
    );
  }

  const data = await parseResponse(res);
  if (!res.ok && res.status !== 207) {
    throw new Error(data.error || data.warning || 'Request failed');
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
        throw new Error('Cannot connect to backend for file upload.');
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
