import api from './api';
import { reportService } from './reportService';

export const caseService = {
  ...reportService,

  async getCases(params = {}) {
    try {
      const { data } = await api.get('/cases', { params });
      return data;
    } catch (_) {
      return reportService.getReports(params);
    }
  },

  async getCase(id) {
    try {
      const { data } = await api.get(`/cases/${id}`);
      return data;
    } catch (_) {
      return reportService.getReport(id);
    }
  },

  async getCaseStatistics() {
    try {
      const { data } = await api.get('/cases/statistics');
      return data;
    } catch (_) {
      return reportService.getStatistics();
    }
  },

  async updateCaseStatus(id, status, reason) {
    try {
      const { data } = await api.put(`/cases/${id}/status`, { status, reason });
      return data;
    } catch (_) {
      return reportService.updateReportStatus(id, status, reason);
    }
  },
};

export default caseService;

