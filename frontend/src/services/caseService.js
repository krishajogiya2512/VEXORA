import api, { getErrorMessage } from './api';
import { reportService } from './reportService';

/**
 * caseService – Case Management API client.
 *
 * Provides dedicated endpoints for investigating cases with automatic fallback
 * to reportService to maintain full backward compatibility with legacy endpoints.
 */
export const caseService = {
  ...reportService,

  /**
   * Retrieves paginated cases with optional status and severity filtering.
   * Falls back to reportService.getReports if the case alias is unavailable.
   */
  async getCases(params = {}) {
    try {
      const { data } = await api.get('/cases', { params });
      return data;
    } catch (err) {
      try {
        return await reportService.getReports(params);
      } catch (fallbackErr) {
        return {
          success: false,
          data: [],
          message: getErrorMessage(fallbackErr, 'Failed to fetch cases'),
        };
      }
    }
  },

  /**
   * Retrieves full details, timeline, and audit history for a single case.
   */
  async getCase(id) {
    try {
      const { data } = await api.get(`/cases/${id}`);
      return data;
    } catch (_) {
      return reportService.getReport(id);
    }
  },

  /**
   * Fetches aggregate case metrics (totals, counts by status, counts by severity).
   */
  async getCaseStatistics() {
    try {
      const { data } = await api.get('/cases/statistics');
      return data;
    } catch (_) {
      return reportService.getStatistics();
    }
  },

  /**
   * Updates case lifecycle status with an optional investigator audit reason.
   */
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

