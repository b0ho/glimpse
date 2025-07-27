# Glimpse Deployment Guide

## Overview

This guide covers the deployment process for the Glimpse dating app, including Docker containerization, CI/CD pipelines, and production deployment.

## Architecture

The production deployment consists of:
- **Backend API** (Node.js/Express)
- **Frontend Web** (Next.js)
- **PostgreSQL Database**
- **Redis Cache**
- **Nginx Reverse Proxy**
- **Monitoring Stack** (Prometheus, Grafana)

## Prerequisites

### Server Requirements
- Ubuntu 22.04 LTS or later
- Docker 24.0+
- Docker Compose 2.20+
- 4GB+ RAM
- 50GB+ Storage
- SSL Certificate

### GitHub Secrets Required
Configure these secrets in your GitHub repository:
- `DEPLOY_HOST` - Production server hostname
- `DEPLOY_USER` - SSH user for deployment
- `DEPLOY_SSH_KEY` - SSH private key
- All environment variables from `.env.example`

## Local Development with Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## CI/CD Pipeline

### Continuous Integration
The CI pipeline runs on every push and PR:
1. Linting and type checking
2. Unit tests for all packages
3. Integration tests with PostgreSQL
4. Docker image building
5. Security vulnerability scanning

### Continuous Deployment
Deployment happens automatically when pushing to `main`:
1. SSH into production server
2. Pull latest Docker images
3. Run database migrations
4. Zero-downtime deployment
5. Health checks
6. Slack notifications

## Production Deployment

### Initial Setup

1. **Server Preparation**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. **SSL Certificate Setup**
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d glimpse.app -d www.glimpse.app

# Copy certificates
sudo cp /etc/letsencrypt/live/glimpse.app/fullchain.pem ~/glimpse/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/glimpse.app/privkey.pem ~/glimpse/nginx/ssl/key.pem
```

3. **Environment Configuration**
- Copy `.env.example` to `.env`
- Fill in all production values
- Ensure strong passwords and secrets

### Manual Deployment

If you need to deploy manually:

```bash
# SSH into server
ssh deploy@your-server.com

# Navigate to project
cd ~/glimpse

# Pull latest code
git pull origin main

# Pull and restart services
docker-compose pull
docker-compose up -d

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Check status
docker-compose ps
docker-compose logs -f
```

## Monitoring

### Access Points
- **Application**: https://glimpse.app
- **Grafana**: https://glimpse.app:3030
- **Prometheus**: https://glimpse.app:9090

### Key Metrics
- API response times
- Database query performance
- WebSocket connections
- Error rates
- Resource usage

### Alerts
Configure alerts in Grafana for:
- High error rates (>1%)
- Slow API responses (>500ms p95)
- Database connection issues
- High memory usage (>80%)
- Disk space low (<20%)

## Backup Strategy

### Database Backups
```bash
# Automated daily backup (add to crontab)
0 2 * * * docker-compose exec -T postgres pg_dump -U glimpse glimpse_prod | gzip > ~/backups/db-$(date +\%Y\%m\%d).sql.gz

# Manual backup
docker-compose exec postgres pg_dump -U glimpse glimpse_prod > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U glimpse glimpse_prod < backup.sql
```

### File Storage
- S3 bucket versioning enabled
- Cross-region replication
- Lifecycle policies for old files

## Troubleshooting

### Common Issues

1. **Container Won't Start**
```bash
# Check logs
docker-compose logs backend

# Check resource usage
docker system df
docker system prune -a
```

2. **Database Connection Issues**
```bash
# Test connection
docker-compose exec postgres psql -U glimpse -d glimpse_prod

# Check migrations
docker-compose exec backend npx prisma migrate status
```

3. **SSL Certificate Issues**
```bash
# Renew certificate
sudo certbot renew

# Copy new certificates
sudo cp /etc/letsencrypt/live/glimpse.app/*.pem ~/glimpse/nginx/ssl/
```

### Performance Optimization

1. **Database**
- Enable query logging for slow queries
- Add indexes for common queries
- Use connection pooling

2. **Redis**
- Monitor memory usage
- Set appropriate eviction policies
- Use Redis Sentinel for HA

3. **Application**
- Enable Node.js clustering
- Implement response caching
- Use CDN for static assets

## Security Checklist

- [ ] All secrets in environment variables
- [ ] SSL/TLS properly configured
- [ ] Database passwords strong and unique
- [ ] Regular security updates applied
- [ ] Firewall rules configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Regular security scans
- [ ] Backup encryption enabled
- [ ] Access logs monitored

## Rollback Procedure

If deployment fails:

```bash
# Stop current deployment
docker-compose down

# Restore previous images
docker-compose pull backend:previous
docker-compose pull frontend:previous

# Start services
docker-compose up -d

# Restore database if needed
docker-compose exec -T postgres psql -U glimpse glimpse_prod < last-known-good.sql
```

## Support

For deployment issues:
1. Check container logs
2. Review monitoring dashboards
3. Check GitHub Actions logs
4. Contact DevOps team

Remember to always test deployments in staging before production!