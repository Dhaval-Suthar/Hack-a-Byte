"use server";

import connectDb from "@/db/connectDb";
import AuditLogModel from "@/models/AuditLog";
import { logger } from '@/lib/logger';

export async function createAuditLog(data: {
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  userId?: string;
  username?: string;
  userRole?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  location?: {
    country?: string;
    city?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  metadata?: Record<string, unknown>;
}) {
  try {
    await connectDb();

    const auditLog = new AuditLogModel({
      eventType: data.eventType,
      severity: data.severity,
      description: data.description,
      userId: data.userId,
      username: data.username,
      userRole: data.userRole,
      sessionId: data.sessionId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      location: data.location,
      metadata: data.metadata || {},
    });

    await auditLog.save();
    return { success: true, auditLog: auditLog.toObject() };
  } catch (error) {
    logger.error('Error creating audit log:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { success: false, error: "Failed to create audit log" };
  }
}

export async function getAuditLogs(filters: {
  eventType?: string;
  severity?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}) {
  try {
    await connectDb();

    const query: Record<string, unknown> = {};

    if (filters.eventType) query.eventType = filters.eventType;
    if (filters.severity) query.severity = filters.severity;
    if (filters.userId) query.userId = filters.userId;

    if (filters.dateFrom || filters.dateTo) {
      const dateQuery: Record<string, unknown> = {};
      if (filters.dateFrom) dateQuery.$gte = filters.dateFrom;
      if (filters.dateTo) dateQuery.$lte = filters.dateTo;
      query.createdAt = dateQuery;
    }

    const auditLogs = await AuditLogModel.find(query)
      .populate('userId', 'username')
      .populate('processedBy', 'username')
      .populate('reviewedBy', 'username')
      .sort({ createdAt: -1 })
      .limit(filters.limit || 50)
      .skip(filters.offset || 0)
      .lean();

    return { success: true, auditLogs };
  } catch (error) {
    logger.error('Error fetching audit logs:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { success: false, error: "Failed to fetch audit logs" };
  }
}

export async function getAuditLogById(logId: string) {
  try {
    await connectDb();

    const auditLog = await AuditLogModel.findById(logId)
      .populate('userId', 'username')
      .populate('processedBy', 'username')
      .populate('reviewedBy', 'username')
      .lean();

    if (!auditLog) {
      return { success: false, error: "Audit log not found" };
    }

    return { success: true, auditLog };
  } catch (error) {
    logger.error('Error fetching audit log:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { success: false, error: "Failed to fetch audit log" };
  }
}

export async function updateAuditLogStatus(logId: string, updates: {
  processed?: boolean;
  processedBy?: string;
  reviewed?: boolean;
  reviewedBy?: string;
  reviewNotes?: string;
}) {
  try {
    await connectDb();

    const updateData: Record<string, unknown> = {};

    if (updates.processed !== undefined) {
      updateData.processed = updates.processed;
      if (updates.processed) {
        updateData.processedAt = new Date();
        updateData.processedBy = updates.processedBy;
      }
    }

    if (updates.reviewed !== undefined) {
      updateData.reviewed = updates.reviewed;
      if (updates.reviewed) {
        updateData.reviewedAt = new Date();
        updateData.reviewedBy = updates.reviewedBy;
      }
    }

    if (updates.reviewNotes) {
      updateData.reviewNotes = updates.reviewNotes;
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
      return { success: false, error: "Audit log not found" };
    }

    return { success: true, auditLog: auditLog.toObject() };
  } catch (error) {
    logger.error('Error updating audit log:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { success: false, error: "Failed to update audit log" };
  }
}

export async function getAuditStatistics(filters: {
  dateFrom?: Date;
  dateTo?: Date;
  eventType?: string;
}) {
  try {
    await connectDb();

    const matchStage: Record<string, unknown> = {};

    if (filters.dateFrom || filters.dateTo) {
      const dateQuery: Record<string, unknown> = {};
      if (filters.dateFrom) dateQuery.$gte = filters.dateFrom;
      if (filters.dateTo) dateQuery.$lte = filters.dateTo;
      matchStage.createdAt = dateQuery;
    }

    if (filters.eventType) {
      matchStage.eventType = filters.eventType;
    }

    const stats = await AuditLogModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            eventType: '$eventType',
            severity: '$severity'
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $group: {
          _id: '$_id.severity',
          events: {
            $push: {
              eventType: '$_id.eventType',
              count: '$count',
              uniqueUsers: { $size: '$uniqueUsers' }
            }
          },
          totalEvents: { $sum: '$count' }
        }
      }
    ]);

    return { success: true, stats };
  } catch (error) {
    logger.error('Error fetching audit statistics:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    return { success: false, error: "Failed to fetch audit statistics" };
  }
}
