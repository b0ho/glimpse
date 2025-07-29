#!/bin/bash

# Glimpse Production Deployment Script
# Usage: ./scripts/deploy.sh [staging|production]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
DOCKER_REGISTRY="your-registry.com"
IMAGE_TAG=$(git rev-parse --short HEAD)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Function to print colored output
print_status() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Check if environment file exists
if [ ! -f ".env.${ENVIRONMENT}" ]; then
    print_error "Environment file .env.${ENVIRONMENT} not found!"
    exit 1
fi

print_status "Starting deployment to ${ENVIRONMENT} environment..."

# 1. Run tests
print_status "Running tests..."
npm test -- --coverage --passWithNoTests || {
    print_error "Tests failed! Aborting deployment."
    exit 1
}

# 2. Build Docker images
print_status "Building Docker images..."
docker build -t ${DOCKER_REGISTRY}/glimpse-backend:${IMAGE_TAG} -f server/Dockerfile .
docker build -t ${DOCKER_REGISTRY}/glimpse-frontend:${IMAGE_TAG} -f web/Dockerfile .

# 3. Tag images
docker tag ${DOCKER_REGISTRY}/glimpse-backend:${IMAGE_TAG} ${DOCKER_REGISTRY}/glimpse-backend:latest
docker tag ${DOCKER_REGISTRY}/glimpse-frontend:${IMAGE_TAG} ${DOCKER_REGISTRY}/glimpse-frontend:latest

# 4. Push images to registry
print_status "Pushing images to registry..."
docker push ${DOCKER_REGISTRY}/glimpse-backend:${IMAGE_TAG}
docker push ${DOCKER_REGISTRY}/glimpse-backend:latest
docker push ${DOCKER_REGISTRY}/glimpse-frontend:${IMAGE_TAG}
docker push ${DOCKER_REGISTRY}/glimpse-frontend:latest

# 5. Create deployment directory
DEPLOY_DIR="deployments/${ENVIRONMENT}_${TIMESTAMP}"
mkdir -p ${DEPLOY_DIR}

# 6. Copy necessary files
print_status "Preparing deployment files..."
cp docker-compose.yml ${DEPLOY_DIR}/
cp .env.${ENVIRONMENT} ${DEPLOY_DIR}/.env
cp -r nginx ${DEPLOY_DIR}/
cp -r monitoring ${DEPLOY_DIR}/

# 7. Update image tags in docker-compose
sed -i.bak "s|image: .*glimpse-backend.*|image: ${DOCKER_REGISTRY}/glimpse-backend:${IMAGE_TAG}|g" ${DEPLOY_DIR}/docker-compose.yml
sed -i.bak "s|image: .*glimpse-frontend.*|image: ${DOCKER_REGISTRY}/glimpse-frontend:${IMAGE_TAG}|g" ${DEPLOY_DIR}/docker-compose.yml
rm ${DEPLOY_DIR}/docker-compose.yml.bak

# 8. Create deployment archive
print_status "Creating deployment archive..."
tar -czf ${DEPLOY_DIR}.tar.gz -C deployments ${ENVIRONMENT}_${TIMESTAMP}

# 9. Deploy to server (example using SSH)
if [ "${ENVIRONMENT}" == "production" ]; then
    SERVER="production.glimpse.app"
else
    SERVER="staging.glimpse.app"
fi

print_status "Deploying to ${SERVER}..."
scp ${DEPLOY_DIR}.tar.gz deploy@${SERVER}:/home/deploy/
ssh deploy@${SERVER} << EOF
    cd /home/deploy
    tar -xzf ${ENVIRONMENT}_${TIMESTAMP}.tar.gz
    cd ${ENVIRONMENT}_${TIMESTAMP}
    
    # Backup current deployment
    if [ -d "/app/current" ]; then
        mv /app/current /app/backup_${TIMESTAMP}
    fi
    
    # Deploy new version
    mv * /app/current/
    cd /app/current
    
    # Pull images
    docker-compose pull
    
    # Run database migrations
    docker-compose run --rm backend npm run db:migrate
    
    # Start services with zero downtime
    docker-compose up -d --scale backend=2
    sleep 30
    docker-compose up -d --scale backend=1
    
    # Health check
    curl -f http://localhost/health || exit 1
    
    # Clean up old containers
    docker system prune -f
EOF

# 10. Clean up local files
print_status "Cleaning up..."
rm -rf ${DEPLOY_DIR}
rm ${DEPLOY_DIR}.tar.gz

# 11. Send deployment notification
print_status "Sending deployment notification..."
curl -X POST https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK \
    -H 'Content-type: application/json' \
    -d '{
        "text": "🚀 Deployment to '${ENVIRONMENT}' completed successfully!",
        "attachments": [{
            "color": "good",
            "fields": [
                {"title": "Environment", "value": "'${ENVIRONMENT}'", "short": true},
                {"title": "Version", "value": "'${IMAGE_TAG}'", "short": true},
                {"title": "Timestamp", "value": "'${TIMESTAMP}'", "short": true}
            ]
        }]
    }'

print_status "Deployment completed successfully! 🎉"
print_status "Version ${IMAGE_TAG} is now live on ${ENVIRONMENT}"