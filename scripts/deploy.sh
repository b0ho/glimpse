#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Glimpse Production Deployment Script${NC}"

# Check if .env file exists
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Error: .env.production file not found!${NC}"
    echo "Please copy .env.production.example to .env.production and fill in the values."
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command_exists docker; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! command_exists docker-compose; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"

# Build and deploy
echo -e "${YELLOW}🔨 Building containers...${NC}"
docker-compose -f docker-compose.prod.yml build

echo -e "${YELLOW}🔄 Pulling latest images...${NC}"
docker-compose -f docker-compose.prod.yml pull

echo -e "${YELLOW}🗃️ Running database migrations...${NC}"
docker-compose -f docker-compose.prod.yml run --rm server npx prisma migrate deploy

echo -e "${YELLOW}🚀 Starting services...${NC}"
docker-compose -f docker-compose.prod.yml up -d

echo -e "${YELLOW}🏥 Waiting for services to be healthy...${NC}"
sleep 10

# Check service health
echo -e "${YELLOW}🔍 Checking service status...${NC}"
docker-compose -f docker-compose.prod.yml ps

# Run health checks
echo -e "${YELLOW}🏥 Running health checks...${NC}"

# Check server health
if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Server is healthy${NC}"
else
    echo -e "${RED}❌ Server health check failed${NC}"
    docker-compose -f docker-compose.prod.yml logs server
    exit 1
fi

# Check Redis
if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping | grep -q PONG; then
    echo -e "${GREEN}✅ Redis is healthy${NC}"
else
    echo -e "${RED}❌ Redis health check failed${NC}"
    exit 1
fi

# Check PostgreSQL
if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U glimpse | grep -q "accepting connections"; then
    echo -e "${GREEN}✅ PostgreSQL is healthy${NC}"
else
    echo -e "${RED}❌ PostgreSQL health check failed${NC}"
    exit 1
fi

echo -e "${GREEN}✨ Deployment completed successfully!${NC}"
echo -e "${YELLOW}📊 View logs: docker-compose -f docker-compose.prod.yml logs -f${NC}"
echo -e "${YELLOW}🛑 Stop services: docker-compose -f docker-compose.prod.yml down${NC}"