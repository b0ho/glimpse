#!/bin/bash
# Production Deployment Script for Glimpse

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_ENV=${1:-production}
AWS_REGION="ap-northeast-2"
ECR_REPOSITORY="glimpse-api"
ECS_CLUSTER="glimpse-prod"
ECS_SERVICE="glimpse-api"

echo -e "${GREEN}Starting Glimpse Production Deployment${NC}"
echo "Environment: $DEPLOYMENT_ENV"

# Check required tools
check_requirements() {
    echo -e "${YELLOW}Checking requirements...${NC}"
    
    command -v aws >/dev/null 2>&1 || { echo -e "${RED}AWS CLI is required but not installed.${NC}" >&2; exit 1; }
    command -v docker >/dev/null 2>&1 || { echo -e "${RED}Docker is required but not installed.${NC}" >&2; exit 1; }
    command -v npm >/dev/null 2>&1 || { echo -e "${RED}npm is required but not installed.${NC}" >&2; exit 1; }
    
    echo -e "${GREEN}All requirements satisfied${NC}"
}

# Run tests
run_tests() {
    echo -e "${YELLOW}Running tests...${NC}"
    
    npm run typecheck
    npm run lint
    npm test
    
    echo -e "${GREEN}All tests passed${NC}"
}

# Build Docker image
build_docker_image() {
    echo -e "${YELLOW}Building Docker image...${NC}"
    
    # Get ECR login token
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com
    
    # Build and tag image
    IMAGE_TAG=$(git rev-parse --short HEAD)
    FULL_IMAGE_NAME="$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG"
    
    docker build -t $FULL_IMAGE_NAME -f docker/Dockerfile.server .
    
    echo -e "${GREEN}Docker image built: $FULL_IMAGE_NAME${NC}"
    
    # Push to ECR
    docker push $FULL_IMAGE_NAME
    
    # Also tag and push as latest
    docker tag $FULL_IMAGE_NAME $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest
    docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest
    
    echo -e "${GREEN}Docker image pushed to ECR${NC}"
}

# Run database migrations
run_migrations() {
    echo -e "${YELLOW}Running database migrations...${NC}"
    
    # Get current task definition
    TASK_DEFINITION=$(aws ecs describe-task-definition --task-definition glimpse-api-task --region $AWS_REGION)
    
    # Create migration task definition
    MIGRATION_TASK_DEF=$(echo $TASK_DEFINITION | jq '.taskDefinition | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy) | .containerDefinitions[0].command = ["npx", "prisma", "migrate", "deploy"]')
    
    # Register migration task definition
    MIGRATION_TASK_ARN=$(aws ecs register-task-definition --cli-input-json "$MIGRATION_TASK_DEF" --region $AWS_REGION --query 'taskDefinition.taskDefinitionArn' --output text)
    
    # Run migration task
    aws ecs run-task \
        --cluster $ECS_CLUSTER \
        --task-definition $MIGRATION_TASK_ARN \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
        --region $AWS_REGION
    
    echo -e "${GREEN}Database migrations completed${NC}"
}

# Deploy to ECS
deploy_to_ecs() {
    echo -e "${YELLOW}Deploying to ECS...${NC}"
    
    # Update service with new image
    aws ecs update-service \
        --cluster $ECS_CLUSTER \
        --service $ECS_SERVICE \
        --force-new-deployment \
        --region $AWS_REGION
    
    echo -e "${YELLOW}Waiting for service to stabilize...${NC}"
    
    # Wait for service to stabilize
    aws ecs wait services-stable \
        --cluster $ECS_CLUSTER \
        --services $ECS_SERVICE \
        --region $AWS_REGION
    
    echo -e "${GREEN}ECS deployment completed${NC}"
}

# Health check
health_check() {
    echo -e "${YELLOW}Running health check...${NC}"
    
    HEALTH_URL="https://api.glimpse.app/health"
    
    for i in {1..30}; do
        if curl -f $HEALTH_URL > /dev/null 2>&1; then
            echo -e "${GREEN}Health check passed${NC}"
            return 0
        fi
        echo "Attempt $i failed, retrying in 10 seconds..."
        sleep 10
    done
    
    echo -e "${RED}Health check failed after 30 attempts${NC}"
    return 1
}

# Deploy web and admin to Vercel
deploy_web_admin() {
    echo -e "${YELLOW}Deploying web and admin to Vercel...${NC}"
    
    # Deploy web
    echo "Deploying web landing page..."
    cd web
    npx vercel --prod
    cd ..
    
    # Deploy admin
    echo "Deploying admin dashboard..."
    cd admin
    npx vercel --prod
    cd ..
    
    echo -e "${GREEN}Web and Admin deployed to Vercel${NC}"
}

# Notify deployment status
notify_deployment() {
    local status=$1
    local message=$2
    
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST $SLACK_WEBHOOK_URL \
            -H 'Content-Type: application/json' \
            -d "{
                \"text\": \"Deployment $status\",
                \"attachments\": [{
                    \"color\": \"$([ "$status" = "success" ] && echo "good" || echo "danger")\",
                    \"fields\": [
                        {\"title\": \"Environment\", \"value\": \"$DEPLOYMENT_ENV\", \"short\": true},
                        {\"title\": \"Commit\", \"value\": \"$(git rev-parse --short HEAD)\", \"short\": true},
                        {\"title\": \"Message\", \"value\": \"$message\", \"short\": false}
                    ]
                }]
            }"
    fi
}

# Main deployment flow
main() {
    check_requirements
    
    # Ensure we're on the correct branch
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [ "$CURRENT_BRANCH" != "main" ] && [ "$DEPLOYMENT_ENV" = "production" ]; then
        echo -e "${RED}Production deployments must be from main branch${NC}"
        exit 1
    fi
    
    # Run tests
    run_tests || { notify_deployment "failed" "Tests failed"; exit 1; }
    
    # Build and push Docker image
    build_docker_image || { notify_deployment "failed" "Docker build failed"; exit 1; }
    
    # Run migrations
    run_migrations || { notify_deployment "failed" "Database migrations failed"; exit 1; }
    
    # Deploy to ECS
    deploy_to_ecs || { notify_deployment "failed" "ECS deployment failed"; exit 1; }
    
    # Deploy web admin
    deploy_web_admin || { notify_deployment "failed" "Web admin deployment failed"; exit 1; }
    
    # Health check
    health_check || { notify_deployment "failed" "Health check failed"; exit 1; }
    
    notify_deployment "success" "All services deployed successfully"
    
    echo -e "${GREEN}Deployment completed successfully!${NC}"
}

# Run main function
main