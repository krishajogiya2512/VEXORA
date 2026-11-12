import api from './api';

export const detectionService = {
  async analyzeProfile(profileId) {
    const { data } = await api.post('/detection/analyze', { profileId });
    return data;
  },

  async getDetections(params = {}) {
    const { data } = await api.get('/detection', { params });
    return data;
  },

  async getDetection(id) {
    const { data } = await api.get(`/detection/${id}`);
    return data;
  },

  async getStatistics() {
    const { data } = await api.get('/detection/statistics');
    return data;
  },

  async getHistory(params = {}) {
    const { data } = await api.get('/detection/history', { params });
    return data;
  },

  async batchAnalyze(profileIds) {
    const { data } = await api.post('/detection/batch', { profileIds });
    return data;
  },
};
