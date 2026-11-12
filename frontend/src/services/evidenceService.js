import api from './api';

export const evidenceService = {
  async uploadEvidence(formData) {
    const { data } = await api.post('/evidence', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async getEvidence(params = {}) {
    const { data } = await api.get('/evidence', { params });
    return data;
  },

  async getEvidenceById(id) {
    const { data } = await api.get(`/evidence/${id}`);
    return data;
  },

  async deleteEvidence(id) {
    const { data } = await api.delete(`/evidence/${id}`);
    return data;
  },
};
