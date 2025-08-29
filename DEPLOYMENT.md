# 🚀 Hack-a-Byte Deployment Guide

Welcome to the production deployment guide for Hack-a-Byte! This guide will help you deploy your enterprise-grade application to production.

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ Node.js 18+ installed
- ✅ npm or yarn package manager
- ✅ MongoDB database (Atlas recommended)
- ✅ Razorpay account with API keys
- ✅ Email service (SendGrid, AWS SES, etc.)
- ✅ Domain name and SSL certificate
- ✅ Production server or cloud platform

## 🛠️ Quick Deployment

### Option 1: Automated Deployment (Recommended)

```bash
# Make sure you're in the project root
cd /Users/dhavalsuthar/Desktop/hack-a-byte

# Run the automated deployment script
./deploy.sh --deploy
```

### Option 2: Manual Deployment

```bash
# 1. Install dependencies
npm ci --production=false

# 2. Run tests
npm test

# 3. Build the application
npm run build

# 4. Start the production server
npm start
```

## ⚙️ Environment Configuration

### 1. Copy Environment Template

```bash
cp .env.example .env.production
```

### 2. Configure Production Variables

Edit `.env.production` with your production values:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hackabyte

# Authentication
JWT_SECRET=your-32-char-jwt-secret
NEXTAUTH_SECRET=your-32-char-nextauth-secret

# Payments
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_live_secret

# Email
EMAIL_FROM=noreply@yourdomain.com
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key

# Application
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
LOG_LEVEL=info
```

### 3. Generate Secure Secrets

```bash
# Generate JWT secret (32 characters)
openssl rand -hex 32

# Generate NextAuth secret (32 characters)
openssl rand -hex 32
```

## 🌐 Deployment Platforms

### Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login to Vercel
   vercel login

   # Deploy
   vercel --prod
   ```

2. **Environment Variables**
   - Go to Vercel dashboard
   - Project Settings → Environment Variables
   - Add all variables from `.env.production`

3. **Domain Configuration**
   - Add your custom domain in Vercel
   - Configure DNS records as instructed

### Railway

1. **Deploy to Railway**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login
   railway login

   # Deploy
   railway deploy
   ```

### DigitalOcean App Platform

1. **Create App Spec**
   ```yaml
   # .do/app.yaml
   name: hack-a-byte
   services:
   - name: web
     source_dir: /
     github:
       repo: Dhaval-Suthar/nextjs-dashboard
       branch: main
     run_command: npm start
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: NODE_ENV
       value: production
   ```

## 🔍 Health Checks & Monitoring

### Health Check Endpoint

Your application includes a comprehensive health check endpoint:

```bash
# Check application health
curl https://yourdomain.com/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-08-29T...",
  "uptime": 3600,
  "responseTime": 45,
  "services": {
    "database": { "status": "healthy" },
    "memory": { "status": "healthy" }
  }
}
```

### Monitoring Setup

1. **Enable Monitoring**
   ```javascript
   // monitoring.config.js is already configured
   // Update webhook URLs in the config file
   ```

2. **Set Up Alerts**
   - Database connection failures
   - High memory usage (>80%)
   - Slow response times (>3s)
   - Rate limit violations

## 🔒 Security Checklist

- ✅ [ ] Environment variables configured securely
- ✅ [ ] Database credentials are production-ready
- ✅ [ ] API keys have restricted permissions
- ✅ [ ] SSL certificate installed
- ✅ [ ] Rate limiting is active
- ✅ [ ] Input validation is working
- ✅ [ ] CORS is properly configured
- ✅ [ ] Security headers are set

## 📊 Performance Optimization

### Database Optimization

```javascript
// Connection pooling is already configured
// Monitor connection usage in production
```

### Caching Strategy

```javascript
// Implement Redis for session storage (optional)
// Add CDN for static assets
```

### Monitoring Performance

```javascript
// Performance monitoring is active
// Check /api/health for metrics
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and rebuild
   rm -rf .next
   npm run build
   ```

2. **Database Connection Issues**
   ```bash
   # Check MongoDB connection
   curl https://yourdomain.com/api/health
   ```

3. **Environment Variable Issues**
   ```bash
   # Verify environment variables
   node -e "console.log(process.env.MONGODB_URI)"
   ```

### Logs and Debugging

```bash
# Check application logs
# (Platform-specific, check your deployment provider)

# Test health endpoint
curl -v https://yourdomain.com/api/health
```

## 📞 Support

If you encounter issues:

1. Check the health endpoint: `/api/health`
2. Review application logs
3. Verify environment variables
4. Test database connectivity
5. Check monitoring alerts

## 🎯 Post-Deployment Tasks

- [ ] Set up automated backups
- [ ] Configure log aggregation
- [ ] Set up error tracking (Sentry)
- [ ] Configure CDN for assets
- [ ] Set up automated testing in CI/CD
- [ ] Monitor performance metrics
- [ ] Set up alerting for critical issues

## 🚀 Scaling Considerations

- **Horizontal Scaling**: Use load balancer
- **Database Scaling**: Consider read replicas
- **Caching**: Implement Redis for sessions
- **CDN**: Use for static assets
- **Monitoring**: Set up comprehensive monitoring

---

**🎉 Congratulations!** Your Hack-a-Byte application is now production-ready with enterprise-grade features including security, monitoring, and performance optimization.

For additional help, check the monitoring dashboard or contact your development team.
