import api from './api';

export const authService = {
  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    return data; // { success, message, data: { user, token } }
  },

  async register(name, email, password, role) {
    const { data } = await api.post('/auth/register', { name, email, password, role });
    return data;
  },

  async getMe() {
    const { data } = await api.get('/auth/me');
    return data;
  },

  async updatePassword(currentPassword, newPassword) {
    const { data } = await api.put('/auth/password', { currentPassword, newPassword });
    return data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (_) { /* ignore errors on logout */ }
    localStorage.removeItem('vexora_token');
    localStorage.removeItem('vexora_user');
  },
};
