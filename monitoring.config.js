// Health Check Monitoring Setup
// This file configures monitoring for your production deployment

module.exports = {
  // ===========================================
  // HEALTH CHECK ENDPOINTS
  // ===========================================
  healthCheck: {
    path: '/api/health',
    enabled: true
  },

  // Database health check
  databaseHealth: {
    enabled: true,
    maxConnectionFailures: 3
  },

  // Memory usage alert threshold (MB)
  memoryAlertThreshold: 500,

  // Response time alert threshold (ms)
  responseTimeAlertThreshold: 2000,

  // ===========================================
  // MONITORING SERVICES
  // ===========================================
  monitoring: {
    uptimeEnabled: true,
    slackWebhook: process.env.SLACK_WEBHOOK_URL,
    discordWebhook: process.env.DISCORD_WEBHOOK_URL
  },

  // ===========================================
  // LOG AGGREGATION
  // ===========================================
  logging: {
    service: 'logtail', // Options: logtail, datadog, cloudwatch
    token: process.env.LOGTAIL_TOKEN
  },

  // ===========================================
  // ERROR TRACKING
  // ===========================================
  errorTracking: {
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'production'
    }
  },

  // ===========================================
  // PERFORMANCE MONITORING
  // ===========================================
  performance: {
    enabled: true,
    service: 'vercel-analytics' // Options: vercel-analytics, datadog, new-relic
  },

  // ===========================================
  // ALERT CONFIGURATION
  // ===========================================
  alerts: {
    dbConnectionFailures: 3,
    highMemoryUsage: 80, // Percentage
    highResponseTime: 3000, // ms
    rateLimitExceeded: 10 // per minute
  },

  // ===========================================
  // MONITORING DASHBOARD
  // ===========================================
  dashboard: {
    url: 'https://your-monitoring-dashboard.com'
  },

  // ===========================================
  // BACKUP MONITORING
  // ===========================================
  backup: {
    enabled: true,
    successWebhook: 'https://your-backup-monitoring-webhook.com'
  },

  // ===========================================
  // SECURITY MONITORING
  // ===========================================
  security: {
    enabled: true,
    alertWebhook: 'https://your-security-monitoring-webhook.com'
  }
};
