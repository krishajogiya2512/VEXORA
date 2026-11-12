import api from './api';

export const reportService = {
  async createReport(reportData) {
    const { data } = await api.post('/reports', reportData);
    return data;
  },

  async getReports(params = {}) {
    const { data } = await api.get('/reports', { params });
    return data;
  },

  async getReport(id) {
    const { data } = await api.get(`/reports/${id}`);
    return data;
  },

  async updateReportStatus(id, status, reason) {
    const { data } = await api.put(`/reports/${id}/status`, { status, reason });
    return data;
  },

  async addNote(id, note) {
    const { data } = await api.post(`/reports/${id}/notes`, { note });
    return data;
  },

  async getStatistics() {
    const { data } = await api.get('/reports/statistics');
    return data;
  },

  async exportReport(id, format = 'json') {
    const { data } = await api.get(`/reports/${id}/export`, { params: { format } });
    return data;
  },
};
