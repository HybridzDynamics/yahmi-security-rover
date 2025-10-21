#!/bin/bash

# ESP32 Surveillance Dashboard AWS Deployment Script
# This script automates the deployment process to AWS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
ECR_REPOSITORY=${ECR_REPOSITORY:-esp32-surveillance-dashboard}
ECS_CLUSTER=${ECS_CLUSTER:-surveillance-cluster}
ECS_SERVICE=${ECS_SERVICE:-surveillance-dashboard-service}
TASK_DEFINITION=${TASK_DEFINITION:-surveillance-dashboard-task}

echo -e "${BLUE}🚀 Starting ESP32 Surveillance Dashboard Deployment${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if required environment variables are set
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo -e "${YELLOW}⚠️  AWS credentials not found. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY${NC}"
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Step 1: Build the application
echo -e "${BLUE}📦 Building application...${NC}"
npm install
npm run build

# Step 2: Build Docker image
echo -e "${BLUE}🐳 Building Docker image...${NC}"
docker build -t $ECR_REPOSITORY:latest .

# Step 3: Login to ECR
echo -e "${BLUE}🔐 Logging in to Amazon ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com

# Step 4: Create ECR repository if it doesn't exist
echo -e "${BLUE}📁 Creating ECR repository...${NC}"
aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION || \
aws ecr create-repository --repository-name $ECR_REPOSITORY --region $AWS_REGION

# Step 5: Tag and push image
echo -e "${BLUE}🏷️  Tagging and pushing image...${NC}"
ECR_URI=$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY
docker tag $ECR_REPOSITORY:latest $ECR_URI:latest
docker push $ECR_URI:latest

# Step 6: Update ECS service
echo -e "${BLUE}🔄 Updating ECS service...${NC}"
aws ecs update-service \
    --cluster $ECS_CLUSTER \
    --service $ECS_SERVICE \
    --force-new-deployment \
    --region $AWS_REGION

# Step 7: Wait for deployment to complete
echo -e "${BLUE}⏳ Waiting for deployment to complete...${NC}"
aws ecs wait services-stable \
    --cluster $ECS_CLUSTER \
    --services $ECS_SERVICE \
    --region $AWS_REGION

# Step 8: Get service URL
echo -e "${BLUE}🌐 Getting service URL...${NC}"
SERVICE_URL=$(aws ecs describe-services \
    --cluster $ECS_CLUSTER \
    --services $ECS_SERVICE \
    --region $AWS_REGION \
    --query 'services[0].loadBalancers[0].dnsName' \
    --output text)

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌍 Your dashboard is available at: http://$SERVICE_URL${NC}"

# Optional: Run health check
echo -e "${BLUE}🏥 Running health check...${NC}"
if curl -f http://$SERVICE_URL/health; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${YELLOW}⚠️  Health check failed, but deployment may still be successful${NC}"
fi

echo -e "${GREEN}🎉 ESP32 Surveillance Dashboard is now live!${NC}"
