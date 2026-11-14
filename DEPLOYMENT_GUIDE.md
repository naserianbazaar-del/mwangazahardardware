# Deployment Guide

## Overview

This guide covers deploying the Mwazanga Hardware POS application to various hosting platforms.

---

## Pre-Deployment Checklist

- [ ] Run `npm run build` successfully
- [ ] Run `npm run lint` with no errors
- [ ] Update environment variables
- [ ] Test in production mode locally (`npm start`)
- [ ] Update version in `package.json`
- [ ] Create `.env.production` with production URLs
- [ ] Test all critical features
- [ ] Create database backups (if applicable)
- [ ] Document deployment steps

---

## 1. Vercel Deployment (Recommended for Next.js)

Vercel is the recommended platform for Next.js applications.

### Setup

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub/GitLab/Bitbucket

2. **Connect Repository**
   - Click "New Project"
   - Import your Git repository
   - Vercel auto-detects Next.js

3. **Configure Environment**
   - Add environment variables in Vercel dashboard
   - Required variables:
     ```
     NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
    NEXT_PUBLIC_APP_NAME=Mwazanga Hardware
     ```

4. **Deploy**
   - Vercel automatically deploys on push to main branch
   - Preview deployments on pull requests

### Environment Variables (Vercel)

```
Environment: Production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_APP_NAME=Mwazanga Hardware
```

### Domain Configuration

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as shown in Vercel dashboard
4. SSL certificate auto-generated

### Monitoring

- **Vercel Analytics**: Built-in performance monitoring
- **Error Tracking**: Automatic error reporting
- **Logs**: Real-time deployment and function logs

---

## 2. Docker Deployment

Deploy using Docker containers for more control.

### Build Docker Image

```bash
# Build image
docker build -t top-notch-pos:latest .

# Tag for registry
docker tag top-notch-pos:latest myregistry/top-notch-pos:latest

# Push to registry
docker push myregistry/top-notch-pos:latest
```

### Run Container

```bash
docker run \
  -d \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api \
  -e NEXT_PUBLIC_APP_NAME="Mwazanga Hardware" \
  --name pos-app \
  top-notch-pos:latest
```

### Docker Compose

```bash
# Start all services
docker-compose -f docker-compose.yml up -d

# View logs
docker-compose logs -f pos

# Stop services
docker-compose down
```

### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  pos:
    image: myregistry/top-notch-pos:latest
    ports:
      - "80:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
      - NODE_ENV=production
    restart: always
    networks:
      - app-network

  nginx:
    image: nginx:latest
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - pos
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

---

## 3. AWS Deployment

### Option A: AWS Amplify

1. **Connect Repository**
   ```bash
   amplify init
   amplify push
   ```

2. **Configure Build Settings**
   - Framework: Next.js
   - Build command: `npm run build`
   - Start command: `npm start`

3. **Environment Variables**
   - Add in Amplify Console
   - Stage-specific configurations

### Option B: EC2 Instance

1. **Launch EC2 Instance**
   - Ubuntu 20.04 LTS or later
   - t3.small minimum for production

2. **Install Dependencies**
   ```bash
   sudo apt update
   sudo apt install nodejs npm
   
   # Or use NVM for version management
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   ```

3. **Clone Repository**
   ```bash
   git clone https://github.com/yourusername/pos.git
   cd pos
   npm install
   ```

4. **Build Application**
   ```bash
   npm run build
   ```

5. **Setup PM2 for Process Management**
   ```bash
   npm install -g pm2
   
   pm2 start npm --name "pos-app" -- start
   pm2 startup
   pm2 save
   ```

6. **Setup Nginx Reverse Proxy**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot certonly --nginx -d yourdomain.com
   ```

### Option C: ECS (Elastic Container Service)

1. **Push Image to ECR**
   ```bash
   aws ecr get-login-password | docker login --username AWS --password-stdin <aws-account-id>.dkr.ecr.<region>.amazonaws.com
   docker tag top-notch-pos:latest <aws-account-id>.dkr.ecr.<region>.amazonaws.com/top-notch-pos:latest
   docker push <aws-account-id>.dkr.ecr.<region>.amazonaws.com/top-notch-pos:latest
   ```

2. **Create ECS Task Definition**
   - Container image: ECR image URI
   - Port mappings: 3000:3000
   - Environment variables

3. **Create ECS Service**
   - Launch type: Fargate
   - Load balancer: Application Load Balancer

---

## 4. Google Cloud Deployment

### Cloud Run

```bash
# Authenticate
gcloud auth login

# Set project
gcloud config set project PROJECT_ID

# Deploy
gcloud run deploy top-notch-pos \
  --source . \
  --platform managed \
  --region us-central1 \
  --set-env-vars NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

### App Engine

```yaml
# app.yaml
runtime: nodejs18

env: standard

handlers:
  - url: /.*
    script: auto

env_variables:
  NEXT_PUBLIC_API_URL: "https://api.yourdomain.com/api"
```

```bash
gcloud app deploy
```

---

## 5. DigitalOcean Deployment

### App Platform

1. **Connect Repository**
   - Create new App
   - Link GitHub repository
   - Select `main` branch

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Run command: `npm start`

3. **Add Environment Variables**
   - NEXT_PUBLIC_API_URL
   - NEXT_PUBLIC_APP_NAME

4. **Deploy**
   - DigitalOcean auto-deploys on push

### Droplet Deployment

Similar to AWS EC2 but using DigitalOcean's virtual machines.

---

## 6. Railway Deployment

```bash
# Install Railway CLI
npm i -g railway

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

---

## 7. Heroku Deployment (Legacy)

### Procfile

```
web: npm run build && npm start
```

### Deploy

```bash
heroku login
heroku create top-notch-pos
git push heroku main
```

### Environment Variables

```bash
heroku config:set NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

---

## Performance Optimization

### Build Optimization

```bash
# Analyze bundle size
npm run build -- --analyze
```

### Image Optimization

Enable Next.js Image Optimization:
- Automatic optimization on build
- Responsive image serving
- WebP format support

### Caching Strategy

```javascript
// next.config.js
module.exports = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=3600, s-maxage=3600',
        },
      ],
    },
  ],
};
```

---

## Security Considerations

### Environment Variables

```bash
# Never commit .env.production
echo ".env.production" >> .gitignore

# Use CI/CD secrets for sensitive data
```

### HTTPS/SSL

```bash
# Force HTTPS in next.config.js
module.exports = {
  async redirects() {
    return [
      {
        source: '/:path*',
        destination: 'https://:host/:path*',
        permanent: true,
      },
    ];
  },
};
```

### Security Headers

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'",
          },
        ],
      },
    ];
  },
};
```

---

## Monitoring & Logging

### Application Monitoring

- **Vercel Analytics**: Built-in
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **Datadog**: Infrastructure monitoring

### Setup Sentry

```bash
npm install @sentry/nextjs
```

```javascript
// next.config.js
const withSentryConfig = require("@sentry/nextjs/withSentryConfig");

module.exports = withSentryConfig(
  {
    // Your Next.js config
  },
  {
    org: "your-org",
    project: "pos-app",
    authToken: process.env.SENTRY_AUTH_TOKEN,
  }
);
```

---

## Database Backups

### If Using PostgreSQL

```bash
# Backup
pg_dump -h localhost -U user dbname > backup.sql

# Restore
psql -h localhost -U user dbname < backup.sql
```

### Automated Backups

- Setup daily automated backups
- Store in S3 or cloud storage
- Test restore procedures

---

## Rollback Procedure

### Vercel

1. Go to Deployments
2. Click "Redeploy" on previous deployment
3. Automatic rollback in seconds

### Docker

```bash
# Keep previous image tags
docker run -d -p 3000:3000 top-notch-pos:v1.0.0
```

### Manual Git Rollback

```bash
git log --oneline
git revert <commit-hash>
git push
```

---

## Deployment Checklist by Platform

### Vercel ✅
- [ ] Environment variables set
- [ ] Custom domain configured
- [ ] SSL enabled
- [ ] Analytics enabled

### Docker ✅
- [ ] Image builds without errors
- [ ] Container runs on local machine
- [ ] All environment variables passed
- [ ] Health checks working

### AWS ✅
- [ ] Security groups configured
- [ ] Load balancer configured
- [ ] Auto-scaling policies set
- [ ] CloudWatch alarms created

---

## Cost Optimization

| Platform | Estimated Cost | Notes |
|----------|---|---|
| Vercel | Free - $20/mo | Generous free tier |
| AWS | $10 - $50/mo | Pay-per-use model |
| DigitalOcean | $5 - $20/mo | Fixed pricing |
| Google Cloud | $10 - $30/mo | Free credits available |
| Railway | $10 - $20/mo | Simple pricing |

---

## Troubleshooting

### Build Fails

```bash
# Clear cache
rm -rf .next
npm ci
npm run build
```

### Memory Issues

```bash
# Increase Node memory
NODE_OPTIONS=--max_old_space_size=4096 npm run build
```

### Port Already in Use

```bash
# Find and kill process
lsof -i :3000
kill -9 <PID>
```

### API Connection Issues

- Verify NEXT_PUBLIC_API_URL in environment
- Check CORS settings on backend
- Test API endpoint directly

---

## Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment/vercel)
- [Docker Documentation](https://docs.docker.com/)
- [AWS EC2 User Guide](https://docs.aws.amazon.com/ec2/)
- [Vercel Documentation](https://vercel.com/docs)

---

## Support

For deployment issues:
1. Check logs on your deployment platform
2. Review environment variables
3. Test locally with `npm start`
4. Check GitHub Discussions or Issues

