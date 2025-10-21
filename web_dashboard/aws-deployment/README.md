# ESP32 Surveillance Dashboard - AWS Deployment

This directory contains all the necessary files and configurations to deploy the ESP32 Surveillance Dashboard to AWS.

## 🚀 Quick Start

### Prerequisites

1. **AWS CLI** - Install and configure with your credentials
2. **Docker** - For building containerized applications
3. **Terraform** - For infrastructure as code (optional)
4. **Node.js** - For running the application locally

### Environment Setup

1. Copy the environment file:
```bash
cp env.example .env
```

2. Update the `.env` file with your actual values:
```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-actual-project-id
FIREBASE_PRIVATE_KEY=your-actual-private-key
FIREBASE_CLIENT_EMAIL=your-actual-client-email

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key
```

## 🐳 Docker Deployment

### Local Development

1. Build the Docker image:
```bash
docker build -t surveillance-dashboard .
```

2. Run the container:
```bash
docker run -p 3000:3000 --env-file .env surveillance-dashboard
```

### Production Deployment

1. Use Docker Compose:
```bash
docker-compose up -d
```

2. Check logs:
```bash
docker-compose logs -f
```

## ☁️ AWS Deployment

### Method 1: Automated Script

1. Make the deployment script executable:
```bash
chmod +x deploy.sh
```

2. Set your AWS credentials:
```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_REGION=us-east-1
```

3. Run the deployment:
```bash
./deploy.sh
```

### Method 2: Manual AWS Deployment

#### Step 1: Create ECR Repository

```bash
aws ecr create-repository --repository-name esp32-surveillance-dashboard --region us-east-1
```

#### Step 2: Build and Push Image

```bash
# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t esp32-surveillance-dashboard .

# Tag image
docker tag esp32-surveillance-dashboard:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/esp32-surveillance-dashboard:latest

# Push image
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/esp32-surveillance-dashboard:latest
```

#### Step 3: Create ECS Cluster

```bash
aws ecs create-cluster --cluster-name surveillance-cluster
```

#### Step 4: Create Task Definition

```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

#### Step 5: Create ECS Service

```bash
aws ecs create-service --cluster surveillance-cluster --service-name surveillance-dashboard-service --task-definition surveillance-dashboard-task --desired-count 1
```

### Method 3: Terraform Infrastructure

1. Initialize Terraform:
```bash
cd terraform
terraform init
```

2. Plan the deployment:
```bash
terraform plan
```

3. Apply the infrastructure:
```bash
terraform apply
```

4. Get the load balancer URL:
```bash
terraform output load_balancer_dns
```

## 📊 Monitoring and Logs

### CloudWatch Logs

View application logs:
```bash
aws logs describe-log-groups --log-group-name-prefix /ecs/esp32-surveillance
```

### Health Checks

The application includes health check endpoints:
- `/health` - Basic health check
- `/api/status` - API status
- `/api/health` - Detailed health information

### Monitoring Dashboard

Access the monitoring dashboard at:
```
http://your-load-balancer-url/monitoring
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (production/development) | Yes |
| `PORT` | Application port | No (default: 3000) |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `FIREBASE_PRIVATE_KEY` | Firebase private key | Yes |
| `SMTP_HOST` | SMTP server host | Yes |
| `SMTP_USER` | SMTP username | Yes |
| `SMTP_PASS` | SMTP password | Yes |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | Yes |
| `GEMINI_API_KEY` | Gemini AI API key | Yes |

### Security Configuration

The application includes several security features:
- HTTPS/SSL support
- Security headers (HSTS, CSP, etc.)
- Rate limiting
- Input validation
- CORS configuration

## 🚨 Troubleshooting

### Common Issues

1. **Container won't start**
   - Check environment variables
   - Verify Docker image build
   - Check container logs

2. **Health checks failing**
   - Verify application is running on correct port
   - Check security group rules
   - Verify load balancer configuration

3. **Database connection issues**
   - Verify Firebase credentials
   - Check network connectivity
   - Verify environment variables

### Debug Commands

```bash
# Check container status
docker ps -a

# View container logs
docker logs container-id

# Check ECS service status
aws ecs describe-services --cluster surveillance-cluster --services surveillance-dashboard-service

# Check load balancer health
aws elbv2 describe-target-health --target-group-arn YOUR_TARGET_GROUP_ARN
```

## 📈 Scaling

### Horizontal Scaling

To scale the application:

```bash
aws ecs update-service --cluster surveillance-cluster --service surveillance-dashboard-service --desired-count 3
```

### Auto Scaling

Configure auto scaling based on CPU/memory usage:

```bash
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/surveillance-cluster/surveillance-dashboard-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 1 \
  --max-capacity 10
```

## 🔒 Security Best Practices

1. **Use HTTPS** - Always use SSL certificates
2. **Environment Variables** - Never commit secrets to code
3. **IAM Roles** - Use least privilege principle
4. **Network Security** - Configure security groups properly
5. **Regular Updates** - Keep dependencies updated
6. **Monitoring** - Set up CloudWatch alarms

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review AWS documentation
3. Check application logs
4. Contact the development team

## 🎯 Next Steps

1. Set up monitoring and alerting
2. Configure backup strategies
3. Implement CI/CD pipeline
4. Set up staging environment
5. Configure domain and SSL certificates
