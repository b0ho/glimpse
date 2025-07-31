# Glimpse Deployment Guide

This guide covers the deployment process for the Glimpse dating app.

## Prerequisites

- Docker & Docker Compose installed
- Domain names configured (glimpse.app, api.glimpse.app)
- SSL certificates
- AWS account for S3 storage
- Firebase project for push notifications
- Clerk account for authentication
- Stripe account for payments
- Korean payment gateway accounts (TossPay, KakaoPay)

## Environment Setup

1. Copy the environment template:
```bash
cp .env.production.example .env.production
```

2. Fill in all required environment variables in `.env.production`

## Local Development with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Production Deployment

### 1. Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. SSL Certificate Setup

```bash
# Install Certbot
sudo apt install certbot

# Generate certificates
sudo certbot certonly --standalone -d glimpse.app -d api.glimpse.app

# Copy certificates
sudo cp /etc/letsencrypt/live/glimpse.app/fullchain.pem ./nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/glimpse.app/privkey.pem ./nginx/ssl/key.pem
```

### 3. Deploy Application

```bash
# Clone repository
git clone https://github.com/your-org/glimpse.git
cd glimpse

# Run deployment script
./scripts/deploy.sh production
```

### 4. Database Setup

```bash
# Run migrations
docker-compose exec backend npm run db:migrate

# Create admin user (optional)
docker-compose exec backend npm run db:seed
```

## Monitoring

### Access monitoring tools:
- Grafana: http://your-server:3030
- Prometheus: http://your-server:9090
- Kibana: http://your-server:5601
- Jaeger: http://your-server:16686

### Health Checks
- Frontend: https://glimpse.app/health
- Backend: https://api.glimpse.app/health

## Backup and Recovery

### Database Backup
```bash
# Manual backup
docker-compose exec postgres pg_dump -U glimpse glimpse_prod > backup_$(date +%Y%m%d).sql

# Restore from backup
docker-compose exec -T postgres psql -U glimpse glimpse_prod < backup_20240124.sql
```

### Automated Backups
Add to crontab:
```bash
0 2 * * * /app/scripts/backup.sh
```

## Scaling

### Horizontal Scaling
```bash
# Scale backend instances
docker-compose up -d --scale backend=3

# Scale with specific resources
docker-compose up -d --scale backend=3 --scale redis=2
```

### Vertical Scaling
Edit `docker-compose.yml` to adjust resource limits:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

## Troubleshooting

### Check Service Status
```bash
docker-compose ps
docker-compose logs backend --tail=100
```

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL in environment
   - Verify postgres service is running
   - Check network connectivity

2. **Redis Connection Failed**
   - Verify redis password in environment
   - Check redis service status

3. **File Upload Issues**
   - Verify AWS credentials
   - Check S3 bucket permissions
   - Ensure bucket CORS is configured

4. **Push Notifications Not Working**
   - Verify FCM credentials
   - Check Firebase project settings
   - Ensure FCM tokens are being saved

## Security Checklist

- [ ] All environment variables set securely
- [ ] SSL certificates installed and auto-renewal configured
- [ ] Firewall configured (only necessary ports open)
- [ ] Database passwords changed from defaults
- [ ] Admin panel access restricted by IP
- [ ] Rate limiting configured in nginx
- [ ] Regular security updates scheduled

## Performance Optimization

1. **Enable Redis Caching**
   - Ensure Redis is properly configured
   - Monitor cache hit rates

2. **CDN Configuration**
   - Configure CloudFront for static assets
   - Set appropriate cache headers

3. **Database Optimization**
   - Run ANALYZE periodically
   - Monitor slow queries
   - Adjust connection pool settings

## Maintenance

### Regular Tasks
- Monitor disk space
- Check log rotation
- Update dependencies
- Review security alerts
- Backup verification

### Update Process
```bash
# Pull latest changes
git pull origin master

# Rebuild and deploy
docker-compose build
docker-compose up -d
```

## Support

For issues or questions:
- Technical documentation: `/docs`
- GitHub Issues: https://github.com/your-org/glimpse/issues
- Slack: #glimpse-support