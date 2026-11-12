import api from './api';

export const dashboardService = {
  async getOverview() {
    const { data } = await api.get('/dashboard/overview');
    return data;
  },

  async checkHealth() {
    const { data } = await api.get('/health');
    return data;
  },
};
