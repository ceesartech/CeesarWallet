#!/bin/bash

# CeesarWallet Production Deployment Script
# This script deploys the complete CeesarWallet platform to AWS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="$PROJECT_ROOT/deployment.log"
AWS_ACCOUNT_ID="476114151082"
AWS_REGION="us-east-1"
ENVIRONMENT="${ENVIRONMENT:-production}"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        error "AWS CLI is not installed"
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS credentials not configured. Run 'aws configure' first"
    fi
    
    # Verify account ID
    local current_account=$(aws sts get-caller-identity --query Account --output text)
    if [ "$current_account" != "$AWS_ACCOUNT_ID" ]; then
        error "Wrong AWS account. Expected: $AWS_ACCOUNT_ID, Got: $current_account"
    fi
    
    # Check CDK
    if ! command -v cdk &> /dev/null; then
        error "AWS CDK is not installed"
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        error "Python 3 is not installed"
    fi
    
    log "Prerequisites check passed"
}

# Validate environment variables
validate_env_vars() {
    log "Validating environment variables..."
    
    local required_vars=(
        "ALPACA_API_KEY"
        "ALPACA_SECRET_KEY"
        "BINANCE_API_KEY"
        "BINANCE_SECRET_KEY"
        "OANDA_API_KEY"
        "OANDA_SECRET_KEY"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        error "Missing required environment variables: ${missing_vars[*]}"
    fi
    
    log "Environment variables validation passed"
}

# Deploy infrastructure
deploy_infrastructure() {
    log "Deploying infrastructure..."
    
    cd "$PROJECT_ROOT/infra/cdk"
    
    # Install dependencies
    npm install
    
    # Bootstrap CDK if needed
    if ! aws cloudformation describe-stacks --stack-name CDKToolkit &> /dev/null; then
        log "Bootstrapping CDK..."
        cdk bootstrap
    fi
    
    # Deploy infrastructure
    log "Deploying CDK stack..."
    cdk deploy --require-approval never
    
    # Get outputs
    local user_pool_id=$(aws cloudformation describe-stacks \
        --stack-name CeesarWalletInfrastructureStack \
        --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
        --output text)
    
    local user_pool_client_id=$(aws cloudformation describe-stacks \
        --stack-name CeesarWalletInfrastructureStack \
        --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
        --output text)
    
    local api_gateway_url=$(aws cloudformation describe-stacks \
        --stack-name CeesarWalletInfrastructureStack \
        --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
        --output text)
    
    local graphql_api_url=$(aws cloudformation describe-stacks \
        --stack-name CeesarWalletInfrastructureStack \
        --query 'Stacks[0].Outputs[?OutputKey==`GraphQLApiUrl`].OutputValue' \
        --output text)
    
    local s3_bucket=$(aws cloudformation describe-stacks \
        --stack-name CeesarWalletInfrastructureStack \
        --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
        --output text)
    
    local pinpoint_app_id=$(aws cloudformation describe-stacks \
        --stack-name CeesarWalletInfrastructureStack \
        --query 'Stacks[0].Outputs[?OutputKey==`PinpointAppId`].OutputValue' \
        --output text)
    
    # Export for other steps
    export USER_POOL_ID="$user_pool_id"
    export USER_POOL_CLIENT_ID="$user_pool_client_id"
    export API_GATEWAY_URL="$api_gateway_url"
    export GRAPHQL_API_URL="$graphql_api_url"
    export S3_BUCKET="$s3_bucket"
    export PINPOINT_APP_ID="$pinpoint_app_id"
    
    log "Infrastructure deployment completed"
}

# Update secrets
update_secrets() {
    log "Updating AWS secrets..."
    
    # Update broker secrets
    aws secretsmanager update-secret \
        --secret-id "CeesarWallet/BrokerSecrets" \
        --secret-string "{
            \"alpacaApiKey\": \"$ALPACA_API_KEY\",
            \"alpacaSecretKey\": \"$ALPACA_SECRET_KEY\",
            \"binanceApiKey\": \"$BINANCE_API_KEY\",
            \"binanceSecretKey\": \"$BINANCE_SECRET_KEY\",
            \"oandaApiKey\": \"$OANDA_API_KEY\",
            \"oandaSecretKey\": \"$OANDA_SECRET_KEY\",
            \"alpacaBaseUrl\": \"https://api.alpaca.markets\",
            \"binanceBaseUrl\": \"https://api.binance.com\",
            \"oandaBaseUrl\": \"https://api-fxtrade.oanda.com\"
        }"
    
    # Update ML secrets
    aws secretsmanager update-secret \
        --secret-id "CeesarWallet/MLSecrets" \
        --secret-string "{
            \"modelRegistryUrl\": \"https://your-model-registry.com\",
            \"modelApiKey\": \"$MODEL_API_KEY\",
            \"inferenceEndpoint\": \"https://your-inference-endpoint.com\",
            \"trainingDataBucket\": \"$S3_BUCKET\",
            \"modelArtifactsBucket\": \"$S3_BUCKET\"
        }"
    
    # Update security secrets
    aws secretsmanager update-secret \
        --secret-id "CeesarWallet/SecuritySecrets" \
        --secret-string "{
            \"jwtSecret\": \"$JWT_SECRET\",
            \"encryptionKey\": \"$ENCRYPTION_KEY\",
            \"fraudDetectionApiKey\": \"$FRAUD_DETECTION_API_KEY\",
            \"riskManagementApiKey\": \"$RISK_MANAGEMENT_API_KEY\"
        }"
    
    log "Secrets updated successfully"
}

# Build and deploy backend
deploy_backend() {
    log "Building and deploying backend..."
    
    cd "$PROJECT_ROOT/ml-algorithm"
    
    # Build Docker image
    local image_tag="ceesar-wallet-ml:latest"
    log "Building Docker image: $image_tag"
    docker build -f Dockerfile.ml -t "$image_tag" .
    
    # Tag for ECR
    local ecr_repo="476114151082.dkr.ecr.us-east-1.amazonaws.com/ceesar-wallet-ml"
    local ecr_image="$ecr_repo:latest"
    docker tag "$image_tag" "$ecr_image"
    
    # Login to ECR
    aws ecr get-login-password --region "$AWS_REGION" | \
        docker login --username AWS --password-stdin "$ecr_repo"
    
    # Push to ECR
    log "Pushing image to ECR..."
    docker push "$ecr_image"
    
    # Update ECS service
    log "Updating ECS service..."
    aws ecs update-service \
        --cluster ceesar-wallet-cluster \
        --service ceesar-wallet-ml-service \
        --force-new-deployment \
        --region "$AWS_REGION"
    
    log "Backend deployment completed"
}

# Build and deploy frontend web
deploy_frontend_web() {
    log "Building and deploying frontend web..."
    
    cd "$PROJECT_ROOT/frontend/web"
    
    # Create production environment file
    cat > .env.production << EOF
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_AWS_REGION=$AWS_REGION
NEXT_PUBLIC_AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID
NEXT_PUBLIC_USER_POOL_ID=$USER_POOL_ID
NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID=$USER_POOL_CLIENT_ID
NEXT_PUBLIC_API_GATEWAY_URL=$API_GATEWAY_URL
NEXT_PUBLIC_GRAPHQL_ENDPOINT=$GRAPHQL_API_URL
NEXT_PUBLIC_S3_BUCKET=$S3_BUCKET
NEXT_PUBLIC_PINPOINT_APP_ID=$PINPOINT_APP_ID
NEXT_PUBLIC_WS_URL=wss://api.ceesarwallet.com/ws
EOF
    
    # Install dependencies
    npm ci
    
    # Build application
    log "Building Next.js application..."
    npm run build
    
    # Deploy to S3
    log "Deploying to S3..."
    aws s3 sync .next/static s3://$S3_BUCKET/static --delete
    aws s3 sync public s3://$S3_BUCKET/public --delete
    
    # Deploy to Amplify
    log "Deploying to Amplify..."
    amplify push --yes
    
    # Invalidate CloudFront
    local distribution_id=$(aws cloudformation describe-stacks \
        --stack-name CeesarWalletInfrastructureStack \
        --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
        --output text)
    
    if [ ! -z "$distribution_id" ]; then
        log "Invalidating CloudFront distribution..."
        aws cloudfront create-invalidation \
            --distribution-id "$distribution_id" \
            --paths "/*"
    fi
    
    log "Frontend web deployment completed"
}

# Build and deploy frontend mobile
deploy_frontend_mobile() {
    log "Building and deploying frontend mobile..."
    
    cd "$PROJECT_ROOT/frontend/mobile"
    
    # Create production environment file
    cat > .env.production << EOF
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_AWS_REGION=$AWS_REGION
EXPO_PUBLIC_AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID
EXPO_PUBLIC_USER_POOL_ID=$USER_POOL_ID
EXPO_PUBLIC_USER_POOL_WEB_CLIENT_ID=$USER_POOL_CLIENT_ID
EXPO_PUBLIC_API_GATEWAY_URL=$API_GATEWAY_URL
EXPO_PUBLIC_GRAPHQL_ENDPOINT=$GRAPHQL_API_URL
EXPO_PUBLIC_S3_BUCKET=$S3_BUCKET
EXPO_PUBLIC_PINPOINT_APP_ID=$PINPOINT_APP_ID
EOF
    
    # Install dependencies
    npm ci
    
    # Build for Android
    log "Building Android app..."
    eas build --platform android --non-interactive
    
    # Build for iOS
    log "Building iOS app..."
    eas build --platform ios --non-interactive
    
    # Submit to stores (if configured)
    if [ ! -z "$GOOGLE_SERVICE_ACCOUNT_KEY" ]; then
        log "Submitting to Google Play..."
        eas submit --platform android --non-interactive
    fi
    
    if [ ! -z "$APPLE_ID" ] && [ ! -z "$APPLE_ID_PASSWORD" ]; then
        log "Submitting to App Store..."
        eas submit --platform ios --non-interactive
    fi
    
    log "Frontend mobile deployment completed"
}

# Run post-deployment tests
run_post_deployment_tests() {
    log "Running post-deployment tests..."
    
    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 30
    
    # Health check
    local health_url="$API_GATEWAY_URL/health"
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f "$health_url" > /dev/null 2>&1; then
            log "Health check passed"
            break
        else
            warning "Health check failed (attempt $attempt/$max_attempts)"
            sleep 10
            ((attempt++))
        fi
    done
    
    if [ $attempt -gt $max_attempts ]; then
        error "Health check failed after $max_attempts attempts"
    fi
    
    # API tests
    log "Running API tests..."
    curl -f "$API_GATEWAY_URL/market-data/AAPL" > /dev/null || warning "Market data API test failed"
    curl -f "$API_GATEWAY_URL/signals" > /dev/null || warning "Signals API test failed"
    
    # Frontend tests
    log "Running frontend tests..."
    cd "$PROJECT_ROOT/frontend/web"
    npm run test:smoke || warning "Frontend smoke tests failed"
    
    log "Post-deployment tests completed"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Create CloudWatch alarms
    aws cloudwatch put-metric-alarm \
        --alarm-name "CeesarWallet-API-Errors" \
        --alarm-description "API Gateway 4xx/5xx errors" \
        --metric-name "4XXError" \
        --namespace "AWS/ApiGateway" \
        --statistic "Sum" \
        --period 300 \
        --threshold 10 \
        --comparison-operator "GreaterThanThreshold" \
        --evaluation-periods 2 \
        --alarm-actions "arn:aws:sns:$AWS_REGION:$AWS_ACCOUNT_ID:ceesar-wallet-alerts"
    
    aws cloudwatch put-metric-alarm \
        --alarm-name "CeesarWallet-Lambda-Errors" \
        --alarm-description "Lambda function errors" \
        --metric-name "Errors" \
        --namespace "AWS/Lambda" \
        --statistic "Sum" \
        --period 300 \
        --threshold 5 \
        --comparison-operator "GreaterThanThreshold" \
        --evaluation-periods 2 \
        --alarm-actions "arn:aws:sns:$AWS_REGION:$AWS_ACCOUNT_ID:ceesar-wallet-alerts"
    
    # Create SNS topic for alerts
    aws sns create-topic \
        --name "ceesar-wallet-alerts" \
        --region "$AWS_REGION" || true
    
    log "Monitoring setup completed"
}

# Update deployment status
update_deployment_status() {
    log "Updating deployment status..."
    
    # Update SSM parameters
    aws ssm put-parameter \
        --name "/CeesarWallet/Deployment/Status" \
        --value "successful" \
        --type "String" \
        --overwrite
    
    aws ssm put-parameter \
        --name "/CeesarWallet/Deployment/Version" \
        --value "$(git rev-parse HEAD)" \
        --type "String" \
        --overwrite
    
    aws ssm put-parameter \
        --name "/CeesarWallet/Deployment/Timestamp" \
        --value "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --type "String" \
        --overwrite
    
    aws ssm put-parameter \
        --name "/CeesarWallet/Deployment/Environment" \
        --value "$ENVIRONMENT" \
        --type "String" \
        --overwrite
    
    log "Deployment status updated"
}

# Send notifications
send_notifications() {
    log "Sending deployment notifications..."
    
    local message="🚀 CeesarWallet deployment completed successfully!
    
Environment: $ENVIRONMENT
Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)
Commit: $(git rev-parse HEAD)
    
Services deployed:
✅ Infrastructure (CDK)
✅ Backend (ECS)
✅ Frontend Web (Amplify)
✅ Frontend Mobile (EAS)
✅ Monitoring (CloudWatch)
    
URLs:
🌐 Web App: https://ceesarwallet.com
📱 Mobile App: Available in stores
🔌 API: $API_GATEWAY_URL
📊 GraphQL: $GRAPHQL_API_URL"
    
    # Send to Slack (if configured)
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
    
    # Send to Teams (if configured)
    if [ ! -z "$TEAMS_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$TEAMS_WEBHOOK_URL"
    fi
    
    log "Notifications sent"
}

# Rollback function
rollback() {
    log "Rolling back deployment..."
    
    # Rollback infrastructure
    cd "$PROJECT_ROOT/infra/cdk"
    cdk destroy --force
    
    # Rollback backend
    aws ecs update-service \
        --cluster ceesar-wallet-cluster \
        --service ceesar-wallet-ml-service \
        --desired-count 0 \
        --region "$AWS_REGION"
    
    log "Rollback completed"
}

# Main deployment function
main() {
    case "${1:-deploy}" in
        "deploy")
            log "Starting CeesarWallet production deployment..."
            
            # Clear log file
            > "$LOG_FILE"
            
            # Execute deployment steps
            check_prerequisites
            validate_env_vars
            deploy_infrastructure
            update_secrets
            deploy_backend
            deploy_frontend_web
            deploy_frontend_mobile
            run_post_deployment_tests
            setup_monitoring
            update_deployment_status
            send_notifications
            
            log "Production deployment completed successfully!"
            
            echo ""
            echo "🎉 Deployment Complete!"
            echo ""
            echo "Services deployed:"
            echo "  🌐 Web App: https://ceesarwallet.com"
            echo "  📱 Mobile App: Available in stores"
            echo "  🔌 API: $API_GATEWAY_URL"
            echo "  📊 GraphQL: $GRAPHQL_API_URL"
            echo ""
            echo "Monitoring:"
            echo "  📊 CloudWatch Dashboard: AWS Console"
            echo "  🚨 Alerts: SNS Topic configured"
            echo ""
            ;;
        "rollback")
            rollback
            ;;
        "status")
            log "Checking deployment status..."
            aws ssm get-parameter --name "/CeesarWallet/Deployment/Status" --query 'Parameter.Value' --output text
            ;;
        *)
            echo "Usage: $0 {deploy|rollback|status}"
            echo "  deploy   - Deploy to production (default)"
            echo "  rollback - Rollback deployment"
            echo "  status   - Check deployment status"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
