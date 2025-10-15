import { NextApiRequest, NextApiResponse } from "next";
import connectDb from "@/db/connectDb";
import AuditLogModel from "@/models/AuditLog";
import { logger } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!['GET', 'POST', 'PUT'].includes(req.method || '')) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await connectDb();

    if (req.method === "GET") {
      // Get audit logs
      const {
        eventType,
        severity,
        userId,
        dateFrom,
        dateTo,
        limit = '50',
        offset = '0'
      } = req.query;

      const query: Record<string, unknown> = {};

      if (eventType && typeof eventType === 'string') query.eventType = eventType;
      if (severity && typeof severity === 'string') query.severity = severity;
      if (userId && typeof userId === 'string') query.userId = userId;

      if (dateFrom || dateTo) {
        const dateQuery: Record<string, unknown> = {};
        if (dateFrom && typeof dateFrom === 'string') dateQuery.$gte = new Date(dateFrom);
        if (dateTo && typeof dateTo === 'string') dateQuery.$lte = new Date(dateTo);
        query.createdAt = dateQuery;
      }

      const auditLogs = await AuditLogModel.find(query)
        .populate('userId', 'username')
        .populate('processedBy', 'username')
        .populate('reviewedBy', 'username')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(Number(offset))
        .lean();

      return res.status(200).json({
        success: true,
        auditLogs
      });
    }

    if (req.method === "POST") {
      // Create new audit log
      const {
        eventType,
        severity,
        description,
        userId,
        username,
        userRole,
        sessionId,
        ipAddress,
        userAgent,
        location,
        metadata
      } = req.body;

      if (!eventType || !severity || !description || !ipAddress) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const auditLog = new AuditLogModel({
        eventType,
        severity,
        description,
        userId,
        username,
        userRole,
        sessionId,
        ipAddress,
        userAgent,
        location,
        metadata: metadata || {},
      });

      await auditLog.save();

      return res.status(201).json({
        success: true,
        auditLog: auditLog.toObject()
      });
    }

    if (req.method === "PUT") {
      // Update audit log status
      const { logId, processed, processedBy, reviewed, reviewedBy, reviewNotes } = req.body;

      if (!logId) {
        return res.status(400).json({ error: "Log ID is required" });
      }

      const updateData: Record<string, unknown> = {};

      if (processed !== undefined) {
        updateData.processed = processed;
        if (processed) {
          updateData.processedAt = new Date();
          updateData.processedBy = processedBy;
        }
      }

      if (reviewed !== undefined) {
        updateData.reviewed = reviewed;
        if (reviewed) {
          updateData.reviewedAt = new Date();
          updateData.reviewedBy = reviewedBy;
        }
      }

      if (reviewNotes) {
        updateData.reviewNotes = reviewNotes;
      }

      const auditLog = await AuditLogModel.findByIdAndUpdate(
        logId,
        updateData,
        { new: true }
      )
        .populate('userId', 'username')
        .populate('processedBy', 'username')
        .populate('reviewedBy', 'username');

      if (!auditLog) {
        return res.status(404).json({ error: "Audit log not found" });
      }

      return res.status(200).json({
        success: true,
        auditLog: auditLog.toObject()
      });
    }
  } catch (error) {
    logger.error('Audit Log API error:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
