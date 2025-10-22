#!/bin/bash
# Glimpse Infrastructure - Terraform Deployment
# Usage: ./scripts/deploy.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ENVIRONMENT="startup-prod"
TERRAFORM_DIR="terraform/environments/$ENVIRONMENT"

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}Glimpse Infrastructure Deployment${NC}"
echo -e "${GREEN}Environment: $ENVIRONMENT${NC}"
echo -e "${GREEN}=====================================${NC}"

# Production warning
echo -e "${YELLOW}WARNING: Deploying to PRODUCTION${NC}"
read -p "Continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo -e "${RED}Cancelled${NC}"
  exit 0
fi

# Navigate to terraform directory
cd "$TERRAFORM_DIR" || exit 1

# Terraform workflow
echo -e "\n${GREEN}1. Terraform Init${NC}"
terraform init -upgrade

echo -e "\n${GREEN}2. Terraform Validate${NC}"
terraform validate

echo -e "\n${GREEN}3. Terraform Plan${NC}"
terraform plan -out=tfplan

echo -e "\n${YELLOW}Review the plan above.${NC}"
read -p "Apply? (yes/no): " APPLY
if [ "$APPLY" != "yes" ]; then
  rm -f tfplan
  exit 0
fi

echo -e "\n${GREEN}4. Terraform Apply${NC}"
terraform apply tfplan

echo -e "\n${GREEN}=====================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}=====================================${NC}"

# Show outputs
echo -e "\n${GREEN}Outputs:${NC}"
terraform output

# Cleanup
rm -f tfplan

exit 0
