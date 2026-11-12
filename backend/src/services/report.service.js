'use strict';

const Report = require('../models/Report');
const Detection = require('../models/Detection');
const Profile = require('../models/Profile');

class ReportService {
  async createReport(data, userId) {
    const { detectionId, profileId, title, description, severity } = data;

    // Validate references
    const [detection, profile] = await Promise.all([
      Detection.findById(detectionId),
      Profile.findById(profileId),
    ]);
    if (!detection) throw new Error('Detection not found');
    if (!profile) throw new Error('Profile not found');

    const report = await Report.create({
      detection: detectionId,
      profile: profileId,
      submittedBy: userId,
      title,
      description,
      severity: severity.toUpperCase(),
      status: 'PENDING',
      statusHistory: [{ status: 'PENDING', changedBy: userId, reason: 'Report created' }],
    });

    return report.populate([
      { path: 'detection' }, { path: 'profile', select: 'username platform' },
      { path: 'submittedBy', select: 'name email' },
    ]);
  }

  async getReports(query, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate('profile', 'username platform')
        .populate('submittedBy', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 }).skip(skip).limit(limit),
      Report.countDocuments(query),
    ]);
    return { reports, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getReportById(id) {
    return Report.findById(id)
      .populate('detection')
      .populate('profile')
      .populate('submittedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('analystNotes.addedBy', 'name')
      .populate('statusHistory.changedBy', 'name');
  }

  async updateReportStatus(id, status, userId, reason) {
    const report = await Report.findById(id);
    if (!report) return null;

    report.status = status;
    report.statusHistory.push({ status, changedBy: userId, reason: reason || `Status changed to ${status}`, changedAt: new Date() });
    await report.save();
    return report;
  }

  async addAnalystNote(id, note, userId) {
    const report = await Report.findByIdAndUpdate(
      id,
      { $push: { analystNotes: { note, addedBy: userId, addedAt: new Date() } } },
      { new: true }
    ).populate('analystNotes.addedBy', 'name');
    return report;
  }

  async getReportStatistics() {
    const [byStatus, bySeverity, total, recent] = await Promise.all([
      Report.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Report.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
      Report.countDocuments(),
      Report.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
    ]);

    const statusCounts = {};
    byStatus.forEach(s => { statusCounts[s._id] = s.count; });
    const severityCounts = {};
    bySeverity.forEach(s => { severityCounts[s._id] = s.count; });

    return { total, recentWeek: recent, byStatus: statusCounts, bySeverity: severityCounts };
  }

  async exportReport(id, format) {
    const report = await this.getReportById(id);
    if (!report) return null;

    const exportData = {
      caseId: report.caseId,
      title: report.title,
      description: report.description,
      severity: report.severity,
      status: report.status,
      profile: report.profile,
      detection: report.detection,
      submittedBy: report.submittedBy,
      assignedTo: report.assignedTo,
      analystNotes: report.analystNotes,
      statusHistory: report.statusHistory,
      evidence: report.evidence,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      exportedAt: new Date().toISOString(),
      exportFormat: format,
      disclaimer: 'This report is for authorized investigative use only. Findings are based on automated analysis and require human verification before any action is taken.',
    };

    if (format === 'pdf') {
      exportData._note = 'Full PDF generation requires pdfkit. Structured JSON data provided.';
    }

    return exportData;
  }
}

module.exports = ReportService;
