/**
 * caseService.js
 *
 * In VEXORA, "Cases" are investigation reports.
 * This service is a named alias over reportService for semantic clarity
 * in the Case Management UI.
 */
import { reportService } from './reportService';

export const caseService = {
  /** Fetch all cases (reports) with optional filters */
  getCases: (params = {}) => reportService.getReports(params),

  /** Fetch a single case by report _id */
  getCase: (id) => reportService.getReport(id),

  /** Create a new case (requires detectionId, profileId, title, description, severity) */
  createCase: (data) => reportService.createReport(data),

  /** Update case status */
  updateCaseStatus: (id, status, reason) =>
    reportService.updateReportStatus(id, status, reason),

  /** Add an investigation note */
  addNote: (id, note) => reportService.addNote(id, note),

  /** Get case statistics (counts by status) */
  getStatistics: () => reportService.getStatistics(),

  /** Export a case as JSON or PDF */
  exportCase: (id, format = 'json') => reportService.exportReport(id, format),
};

