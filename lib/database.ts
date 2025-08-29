import mongoose from 'mongoose';
import { logger } from '@/lib/logger';
import { env } from '@/lib/env';

interface ConnectionOptions {
  maxPoolSize?: number;
  serverSelectionTimeoutMS?: number;
  socketTimeoutMS?: number;
  maxIdleTimeMS?: number;
  retryWrites?: boolean;
  retryReads?: boolean;
}

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected: boolean = false;
  private connectionAttempts: number = 0;
  private maxRetries: number = 5;
  private retryDelay: number = 1000; // 1 second

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  async connect(options: ConnectionOptions = {}): Promise<void> {
    if (this.isConnected) {
      logger.info('Database already connected');
      return;
    }

    const defaultOptions: ConnectionOptions = {
      maxPoolSize: 10, // Maximum number of connections in the connection pool
      serverSelectionTimeoutMS: 5000, // How long to wait for server selection
      socketTimeoutMS: 45000, // How long to wait for socket operations
      maxIdleTimeMS: 30000, // Maximum time a connection can remain idle
      retryWrites: true,
      retryReads: true,
      ...options,
    };

    try {
      logger.info('Attempting to connect to MongoDB...', {
        uri: env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@'), // Hide credentials in logs
        options: defaultOptions,
      });

      await mongoose.connect(env.MONGODB_URI, defaultOptions);

      this.isConnected = true;
      this.connectionAttempts = 0;

      logger.info('Successfully connected to MongoDB');

      // Set up connection event listeners
      this.setupConnectionListeners();

    } catch (error) {
      this.connectionAttempts++;
      logger.logError(error as Error, {
        attempt: this.connectionAttempts,
        maxRetries: this.maxRetries,
      });

      if (this.connectionAttempts < this.maxRetries) {
        logger.info(`Retrying connection in ${this.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        this.retryDelay *= 2; // Exponential backoff
        return this.connect(options);
      } else {
        const connectionError = new Error('Failed to connect to MongoDB after maximum retries');
        logger.logError(connectionError);
        throw connectionError;
      }
    }
  }

  private setupConnectionListeners(): void {
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected');
    });

    mongoose.connection.on('error', (error) => {
      logger.error(error, { event: 'connection_error' });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      this.isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      this.isConnected = true;
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      logger.info('Successfully disconnected from MongoDB');
    } catch (error) {
      logger.logError(error as Error, { context: 'disconnect' });
    }
  }

  getConnectionStatus(): {
    isConnected: boolean;
    readyState: number;
    name: string;
    host: string;
    port: number;
  } {
    const conn = mongoose.connection;
    return {
      isConnected: this.isConnected,
      readyState: conn.readyState,
      name: conn.name,
      host: conn.host,
      port: conn.port,
    };
  }

  // Health check method
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: Record<string, unknown>;
  }> {
    try {
      const startTime = Date.now();

      // Simple ping to check if database is responsive
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
      } else {
        throw new Error('Database connection not available');
      }

      const responseTime = Date.now() - startTime;
      const status = this.isConnected ? 'healthy' : 'unhealthy';

      return {
        status,
        details: {
          responseTime: `${responseTime}ms`,
          readyState: mongoose.connection.readyState,
          name: mongoose.connection.name,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: (error as Error).message,
          readyState: mongoose.connection.readyState,
        },
      };
    }
  }
}

// Export singleton instance
export const dbConnection = DatabaseConnection.getInstance();

// Helper function to ensure database connection
export async function ensureDatabaseConnection(): Promise<void> {
  const status = dbConnection.getConnectionStatus();
  if (!status.isConnected) {
    logger.info('Database not connected, attempting to connect...');
    await dbConnection.connect();
  }
}

// Export mongoose instance for direct use
export { mongoose };
