import { NextResponse } from 'next/server';
import connectDb from '@/db/connectDb';
import { logger } from '@/lib/logger';
import { getMemoryUsage } from '@/lib/performance';

export async function GET() {
  try {
    const startTime = Date.now();

    // Check database connection
    let dbStatus = 'healthy';
    let dbResponseTime = 0;

    try {
      const dbStartTime = Date.now();
      await connectDb();
      dbResponseTime = Date.now() - dbStartTime;
    } catch (error) {
      dbStatus = 'unhealthy';
      logger.error('Database health check failed', { error: error instanceof Error ? error.message : String(error) });
    }

    // Get memory usage
    const memoryUsage = getMemoryUsage();
    const memoryStatus = memoryUsage && memoryUsage.used < memoryUsage.limit * 0.9 ? 'healthy' : 'warning';

    // Calculate total response time
    const totalResponseTime = Date.now() - startTime;

    // Determine overall health status
    const overallStatus = (dbStatus === 'healthy' && memoryStatus === 'healthy') ? 'healthy' : 'unhealthy';

    const healthCheck = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: totalResponseTime,
      services: {
        database: {
          status: dbStatus,
          responseTime: dbResponseTime,
        },
        memory: {
          status: memoryStatus,
          usage: memoryUsage,
        }
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    // Log health check results
    if (overallStatus === 'healthy') {
      logger.info('Health check completed successfully', {
        responseTime: totalResponseTime,
        dbResponseTime,
        memoryUsage: memoryUsage?.used
      });
    } else {
      logger.error('Health check failed', {
        overallStatus,
        dbStatus,
        memoryStatus
      });
    }

    const statusCode = overallStatus === 'healthy' ? 200 : 503;
    return NextResponse.json(healthCheck, { status: statusCode });

  } catch (error) {
    logger.error('Health check endpoint failed', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    }, { status: 503 });
  }
}

// Also support HEAD requests for load balancer health checks
export async function HEAD() {
  try {
    await connectDb();
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
