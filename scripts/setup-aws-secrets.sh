#!/bin/bash

# AWS Secrets Configuration Script for CeesarWallet
# Account ID: 476114151082
# Region: us-east-1

set -e

AWS_ACCOUNT_ID="476114151082"
AWS_REGION="us-east-1"
SECRET_NAME="CeesarWallet/BrokerSecrets"

echo "🔐 Setting up AWS Secrets for CeesarWallet..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

# Verify account ID
CURRENT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
if [ "$CURRENT_ACCOUNT" != "$AWS_ACCOUNT_ID" ]; then
    echo "❌ Wrong AWS account. Expected: $AWS_ACCOUNT_ID, Got: $CURRENT_ACCOUNT"
    exit 1
fi

echo "✅ AWS credentials verified for account: $AWS_ACCOUNT_ID"

# Create broker secrets
echo "📝 Creating broker secrets..."

# Check if secret already exists
if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" &> /dev/null; then
    echo "⚠️  Secret $SECRET_NAME already exists. Updating..."
    aws secretsmanager update-secret \
        --secret-id "$SECRET_NAME" \
        --secret-string '{
            "alpacaApiKey": "YOUR_ALPACA_API_KEY",
            "alpacaSecretKey": "YOUR_ALPACA_SECRET_KEY",
            "binanceApiKey": "YOUR_BINANCE_API_KEY",
            "binanceSecretKey": "YOUR_BINANCE_SECRET_KEY",
            "oandaApiKey": "YOUR_OANDA_API_KEY",
            "oandaSecretKey": "YOUR_OANDA_SECRET_KEY",
            "alpacaBaseUrl": "https://paper-api.alpaca.markets",
            "binanceBaseUrl": "https://api.binance.com",
            "oandaBaseUrl": "https://api-fxpractice.oanda.com"
        }'
else
    echo "🆕 Creating new secret: $SECRET_NAME"
    aws secretsmanager create-secret \
        --name "$SECRET_NAME" \
        --description "Secrets for broker API integrations" \
        --secret-string '{
            "alpacaApiKey": "YOUR_ALPACA_API_KEY",
            "alpacaSecretKey": "YOUR_ALPACA_SECRET_KEY",
            "binanceApiKey": "YOUR_BINANCE_API_KEY",
            "binanceSecretKey": "YOUR_BINANCE_SECRET_KEY",
            "oandaApiKey": "YOUR_OANDA_API_KEY",
            "oandaSecretKey": "YOUR_OANDA_SECRET_KEY",
            "alpacaBaseUrl": "https://paper-api.alpaca.markets",
            "binanceBaseUrl": "https://api.binance.com",
            "oandaBaseUrl": "https://api-fxpractice.oanda.com"
        }'
fi

# Create ML model secrets
echo "🤖 Creating ML model secrets..."
ML_SECRET_NAME="CeesarWallet/MLSecrets"

if aws secretsmanager describe-secret --secret-id "$ML_SECRET_NAME" &> /dev/null; then
    echo "⚠️  Secret $ML_SECRET_NAME already exists. Updating..."
    aws secretsmanager update-secret \
        --secret-id "$ML_SECRET_NAME" \
        --secret-string '{
            "modelRegistryUrl": "https://your-model-registry.com",
            "modelApiKey": "YOUR_MODEL_API_KEY",
            "inferenceEndpoint": "https://your-inference-endpoint.com",
            "trainingDataBucket": "ceesar-wallet-training-data",
            "modelArtifactsBucket": "ceesar-wallet-model-artifacts"
        }'
else
    echo "🆕 Creating new secret: $ML_SECRET_NAME"
    aws secretsmanager create-secret \
        --name "$ML_SECRET_NAME" \
        --description "Secrets for ML model services" \
        --secret-string '{
            "modelRegistryUrl": "https://your-model-registry.com",
            "modelApiKey": "YOUR_MODEL_API_KEY",
            "inferenceEndpoint": "https://your-inference-endpoint.com",
            "trainingDataBucket": "ceesar-wallet-training-data",
            "modelArtifactsBucket": "ceesar-wallet-model-artifacts"
        }'
fi

# Create database secrets
echo "🗄️  Creating database secrets..."
DB_SECRET_NAME="CeesarWallet/DatabaseSecrets"

if aws secretsmanager describe-secret --secret-id "$DB_SECRET_NAME" &> /dev/null; then
    echo "⚠️  Secret $DB_SECRET_NAME already exists. Updating..."
    aws secretsmanager update-secret \
        --secret-id "$DB_SECRET_NAME" \
        --secret-string '{
            "dynamodbEndpoint": "https://dynamodb.us-east-1.amazonaws.com",
            "redisEndpoint": "your-redis-cluster.cache.amazonaws.com",
            "redisPort": "6379",
            "redisPassword": "YOUR_REDIS_PASSWORD"
        }'
else
    echo "🆕 Creating new secret: $DB_SECRET_NAME"
    aws secretsmanager create-secret \
        --name "$DB_SECRET_NAME" \
        --description "Secrets for database connections" \
        --secret-string '{
            "dynamodbEndpoint": "https://dynamodb.us-east-1.amazonaws.com",
            "redisEndpoint": "your-redis-cluster.cache.amazonaws.com",
            "redisPort": "6379",
            "redisPassword": "YOUR_REDIS_PASSWORD"
        }'
fi

# Create notification secrets
echo "📱 Creating notification secrets..."
NOTIFICATION_SECRET_NAME="CeesarWallet/NotificationSecrets"

if aws secretsmanager describe-secret --secret-id "$NOTIFICATION_SECRET_NAME" &> /dev/null; then
    echo "⚠️  Secret $NOTIFICATION_SECRET_NAME already exists. Updating..."
    aws secretsmanager update-secret \
        --secret-id "$NOTIFICATION_SECRET_NAME" \
        --secret-string '{
            "slackWebhookUrl": "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK",
            "teamsWebhookUrl": "https://your-teams-webhook.com",
            "emailApiKey": "YOUR_EMAIL_API_KEY",
            "smsApiKey": "YOUR_SMS_API_KEY",
            "pushNotificationKey": "YOUR_PUSH_NOTIFICATION_KEY"
        }'
else
    echo "🆕 Creating new secret: $NOTIFICATION_SECRET_NAME"
    aws secretsmanager create-secret \
        --name "$NOTIFICATION_SECRET_NAME" \
        --description "Secrets for notification services" \
        --secret-string '{
            "slackWebhookUrl": "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK",
            "teamsWebhookUrl": "https://your-teams-webhook.com",
            "emailApiKey": "YOUR_EMAIL_API_KEY",
            "smsApiKey": "YOUR_SMS_API_KEY",
            "pushNotificationKey": "YOUR_PUSH_NOTIFICATION_KEY"
        }'
fi

# Create monitoring secrets
echo "📊 Creating monitoring secrets..."
MONITORING_SECRET_NAME="CeesarWallet/MonitoringSecrets"

if aws secretsmanager describe-secret --secret-id "$MONITORING_SECRET_NAME" &> /dev/null; then
    echo "⚠️  Secret $MONITORING_SECRET_NAME already exists. Updating..."
    aws secretsmanager update-secret \
        --secret-id "$MONITORING_SECRET_NAME" \
        --secret-string '{
            "sentryDsn": "https://your-sentry-dsn@sentry.io/project-id",
            "datadogApiKey": "YOUR_DATADOG_API_KEY",
            "newRelicLicenseKey": "YOUR_NEW_RELIC_LICENSE_KEY",
            "logRocketAppId": "YOUR_LOGROCKET_APP_ID"
        }'
else
    echo "🆕 Creating new secret: $MONITORING_SECRET_NAME"
    aws secretsmanager create-secret \
        --name "$MONITORING_SECRET_NAME" \
        --description "Secrets for monitoring and logging services" \
        --secret-string '{
            "sentryDsn": "https://your-sentry-dsn@sentry.io/project-id",
            "datadogApiKey": "YOUR_DATADOG_API_KEY",
            "newRelicLicenseKey": "YOUR_NEW_RELIC_LICENSE_KEY",
            "logRocketAppId": "YOUR_LOGROCKET_APP_ID"
        }'
fi

# Create security secrets
echo "🔒 Creating security secrets..."
SECURITY_SECRET_NAME="CeesarWallet/SecuritySecrets"

if aws secretsmanager describe-secret --secret-id "$SECURITY_SECRET_NAME" &> /dev/null; then
    echo "⚠️  Secret $SECURITY_SECRET_NAME already exists. Updating..."
    aws secretsmanager update-secret \
        --secret-id "$SECURITY_SECRET_NAME" \
        --secret-string '{
            "jwtSecret": "YOUR_JWT_SECRET_KEY",
            "encryptionKey": "YOUR_ENCRYPTION_KEY",
            "fraudDetectionApiKey": "YOUR_FRAUD_DETECTION_API_KEY",
            "riskManagementApiKey": "YOUR_RISK_MANAGEMENT_API_KEY"
        }'
else
    echo "🆕 Creating new secret: $SECURITY_SECRET_NAME"
    aws secretsmanager create-secret \
        --name "$SECURITY_SECRET_NAME" \
        --description "Secrets for security services" \
        --secret-string '{
            "jwtSecret": "YOUR_JWT_SECRET_KEY",
            "encryptionKey": "YOUR_ENCRYPTION_KEY",
            "fraudDetectionApiKey": "YOUR_FRAUD_DETECTION_API_KEY",
            "riskManagementApiKey": "YOUR_RISK_MANAGEMENT_API_KEY"
        }'
fi

# Create SSM Parameters
echo "⚙️  Creating SSM Parameters..."

# Environment parameters
aws ssm put-parameter \
    --name "/CeesarWallet/Environment" \
    --value "production" \
    --type "String" \
    --overwrite

aws ssm put-parameter \
    --name "/CeesarWallet/Region" \
    --value "$AWS_REGION" \
    --type "String" \
    --overwrite

aws ssm put-parameter \
    --name "/CeesarWallet/AccountId" \
    --value "$AWS_ACCOUNT_ID" \
    --type "String" \
    --overwrite

# API endpoints
aws ssm put-parameter \
    --name "/CeesarWallet/API/BaseUrl" \
    --value "https://api.ceesarwallet.com" \
    --type "String" \
    --overwrite

aws ssm put-parameter \
    --name "/CeesarWallet/API/Version" \
    --value "v1" \
    --type "String" \
    --overwrite

# Feature flags
aws ssm put-parameter \
    --name "/CeesarWallet/Features/RealTimeTrading" \
    --value "true" \
    --type "String" \
    --overwrite

aws ssm put-parameter \
    --name "/CeesarWallet/Features/FraudDetection" \
    --value "true" \
    --type "String" \
    --overwrite

aws ssm put-parameter \
    --name "/CeesarWallet/Features/RiskManagement" \
    --value "true" \
    --type "String" \
    --overwrite

aws ssm put-parameter \
    --name "/CeesarWallet/Features/MLPredictions" \
    --value "true" \
    --type "String" \
    --overwrite

# Rate limits
aws ssm put-parameter \
    --name "/CeesarWallet/RateLimits/API" \
    --value "1000" \
    --type "String" \
    --overwrite

aws ssm put-parameter \
    --name "/CeesarWallet/RateLimits/Trading" \
    --value "100" \
    --type "String" \
    --overwrite

aws ssm put-parameter \
    --name "/CeesarWallet/RateLimits/DataRequests" \
    --value "5000" \
    --type "String" \
    --overwrite

# Timeouts
aws ssm put-parameter \
    --name "/CeesarWallet/Timeouts/API" \
    --value "30" \
    --type "String" \
    --overwrite

aws ssm put-parameter \
    --name "/CeesarWallet/Timeouts/Database" \
    --value "10" \
    --type "String" \
    --overwrite

aws ssm put-parameter \
    --name "/CeesarWallet/Timeouts/Broker" \
    --value "15" \
    --type "String" \
    --overwrite

echo "✅ All secrets and parameters created successfully!"

# List all created secrets
echo "📋 Created secrets:"
aws secretsmanager list-secrets --query 'SecretList[?contains(Name, `CeesarWallet`)].Name' --output table

# List all created parameters
echo "📋 Created parameters:"
aws ssm get-parameters-by-path --path "/CeesarWallet" --query 'Parameters[].Name' --output table

echo ""
echo "🎉 AWS Secrets setup completed!"
echo ""
echo "📝 Next steps:"
echo "1. Update the secret values with your actual API keys and credentials"
echo "2. Configure IAM roles and policies for your applications"
echo "3. Test the secrets retrieval in your applications"
echo ""
echo "🔐 To retrieve secrets in your application:"
echo "aws secretsmanager get-secret-value --secret-id CeesarWallet/BrokerSecrets --query SecretString --output text"
echo ""
echo "⚙️  To retrieve parameters in your application:"
echo "aws ssm get-parameter --name /CeesarWallet/Environment --query Parameter.Value --output text"
