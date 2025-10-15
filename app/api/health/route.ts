import { NextResponse } from 'next/server';
import { dbConnection, ensureDatabaseConnection } from '@/lib/database';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = Date.now();

  try {
    await ensureDatabaseConnection();
    const database = await dbConnection.healthCheck();

    const payload = {
      status: database.status === 'healthy' ? 'ok' : 'degraded',
      uptimeSeconds: Math.round(process.uptime()),
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      database,
    };

    const statusCode = database.status === 'healthy' ? 200 : 503;
    return NextResponse.json(payload, { status: statusCode });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Health check failed', { message }, error as Error);

    return NextResponse.json(
      {
        status: 'down',
        checkedAt: new Date().toISOString(),
        error: message,
      },
      { status: 503 }
    );
  }
}
