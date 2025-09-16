package tech.ceesar.ceesarwallet.infra

import software.amazon.awscdk.*
import software.amazon.awscdk.services.ec2.*
import software.amazon.awscdk.services.ecs.*
import software.amazon.awscdk.services.ecs.patterns.*
import software.amazon.awscdk.services.elasticloadbalancingv2.*
import software.amazon.awscdk.services.kinesis.*
import software.amazon.awscdk.services.dynamodb.*
import software.amazon.awscdk.services.s3.*
import software.amazon.awscdk.services.iam.*
import software.amazon.awscdk.services.cognito.*
import software.amazon.awscdk.services.secretsmanager.*
import software.amazon.awscdk.services.ssm.*
import software.amazon.awscdk.services.cloudwatch.*
import software.amazon.awscdk.services.events.*
import software.amazon.awscdk.services.events.targets.*
import software.amazon.awscdk.services.lambda.*
import software.amazon.awscdk.services.lambda.eventsources.*
import software.amazon.awscdk.services.sagemaker.*
import software.amazon.awscdk.services.frauddetector.*
import software.amazon.awscdk.services.elasticache.*
import software.amazon.awscdk.services.wafv2.*
import software.amazon.awscdk.services.shield.*
import software.amazon.awscdk.services.kms.*
import software.amazon.awscdk.services.cloudtrail.*
import software.amazon.awscdk.services.opensearch.*
import software.amazon.awscdk.services.sns.*
import software.amazon.awscdk.services.sqs.*
import software.amazon.awscdk.services.glue.*
import software.amazon.awscdk.services.kinesisanalytics.*
import software.constructs.Construct
import java.util.*

class CeesarWalletStack(scope: Construct, id: String, props: StackProps? = null) : Stack(scope, id, props) {
    
    init {
        // Create VPC
        val vpc = Vpc.Builder.create(this, "CeesarWalletVPC")
            .maxAzs(3)
            .natGateways(2)
            .build()
        
        // Create KMS key for encryption
        val kmsKey = Key.Builder.create(this, "CeesarWalletKMSKey")
            .description("KMS key for CeesarWallet encryption")
            .enableKeyRotation(true)
            .build()
        
        // Create S3 buckets
        createS3Buckets(kmsKey)
        
        // Create Kinesis streams
        createKinesisStreams(kmsKey)
        
        // Create DynamoDB tables
        createDynamoDBTables(kmsKey)
        
        // Create ElastiCache Redis cluster
        createElastiCacheCluster(vpc, kmsKey)
        
        // Create Cognito User Pool
        createCognitoUserPool()
        
        // Create Secrets Manager secrets
        createSecretsManagerSecrets(kmsKey)
        
        // Create SSM parameters
        createSSMParameters(kmsKey)
        
        // Create CloudWatch dashboards and alarms
        createCloudWatchResources()
        
        // Create EventBridge rules
        createEventBridgeRules()
        
        // Create Lambda functions
        createLambdaFunctions(vpc, kmsKey)
        
        // Create SageMaker resources
        createSageMakerResources(kmsKey)
        
        // Create AWS Fraud Detector
        createFraudDetectorResources()
        
        // Create WAF and Shield
        createSecurityResources()
        
        // Create CloudTrail
        createCloudTrail(kmsKey)
        
        // Create OpenSearch
        createOpenSearch(vpc, kmsKey)
        
        // Create SNS topics
        createSNSTopics()
        
        // Create SQS queues
        createSQSQueues(kmsKey)
        
        // Create Glue resources
        createGlueResources(kmsKey)
        
        // Create Kinesis Data Analytics
        createKinesisDataAnalytics(kmsKey)
        
        // Create ECS cluster and services
        createECSServices(vpc, kmsKey)
        
        // Create IAM roles and policies
        createIAMRoles()
        
        // Output important values
        createOutputs()
    }
    
    private fun createS3Buckets(kmsKey: Key) {
        // Raw data bucket
        Bucket.Builder.create(this, "RawDataBucket")
            .bucketName("ceesar-wallet-raw-data-${UUID.randomUUID().toString().substring(0, 8)}")
            .encryption(BucketEncryption.KMS)
            .encryptionKey(kmsKey)
            .versioned(true)
            .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
            .build()
        
        // Model artifacts bucket
        Bucket.Builder.create(this, "ModelArtifactsBucket")
            .bucketName("ceesar-wallet-models-${UUID.randomUUID().toString().substring(0, 8)}")
            .encryption(BucketEncryption.KMS)
            .encryptionKey(kmsKey)
            .versioned(true)
            .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
            .build()
        
        // Feature store bucket
        Bucket.Builder.create(this, "FeatureStoreBucket")
            .bucketName("ceesar-wallet-features-${UUID.randomUUID().toString().substring(0, 8)}")
            .encryption(BucketEncryption.KMS)
            .encryptionKey(kmsKey)
            .versioned(true)
            .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
            .build()
    }
    
    private fun createKinesisStreams(kmsKey: Key) {
        // Pre-trade events stream
        Stream.Builder.create(this, "PreTradeEventsStream")
            .streamName("pre-trade-events")
            .shardCount(2)
            .encryption(StreamEncryption.KMS)
            .encryptionKey(kmsKey)
            .retentionPeriod(Duration.hours(24))
            .build()
        
        // Post-trade events stream
        Stream.Builder.create(this, "PostTradeEventsStream")
            .streamName("post-trade-events")
            .shardCount(2)
            .encryption(StreamEncryption.KMS)
            .encryptionKey(kmsKey)
            .retentionPeriod(Duration.hours(24))
            .build()
        
        // Fraud scores stream
        Stream.Builder.create(this, "FraudScoresStream")
            .streamName("fraud-scores")
            .shardCount(1)
            .encryption(StreamEncryption.KMS)
            .encryptionKey(kmsKey)
            .retentionPeriod(Duration.hours(24))
            .build()
        
        // Market data stream
        Stream.Builder.create(this, "MarketDataStream")
            .streamName("market-data")
            .shardCount(3)
            .encryption(StreamEncryption.KMS)
            .encryptionKey(kmsKey)
            .retentionPeriod(Duration.hours(24))
            .build()
    }
    
    private fun createDynamoDBTables(kmsKey: Key) {
        // User profiles table
        Table.Builder.create(this, "UserProfilesTable")
            .tableName("user-profiles")
            .partitionKey(Attribute.builder()
                .name("userId")
                .type(AttributeType.STRING)
                .build())
            .billingMode(BillingMode.PAY_PER_REQUEST)
            .encryption(TableEncryption.AWS_MANAGED)
            .pointInTimeRecovery(true)
            .build()
        
        // Trading sessions table
        Table.Builder.create(this, "TradingSessionsTable")
            .tableName("trading-sessions")
            .partitionKey(Attribute.builder()
                .name("sessionId")
                .type(AttributeType.STRING)
                .build())
            .sortKey(Attribute.builder()
                .name("timestamp")
                .type(AttributeType.STRING)
                .build())
            .billingMode(BillingMode.PAY_PER_REQUEST)
            .encryption(TableEncryption.AWS_MANAGED)
            .pointInTimeRecovery(true)
            .build()
        
        // Trade history table
        Table.Builder.create(this, "TradeHistoryTable")
            .tableName("trade-history")
            .partitionKey(Attribute.builder()
                .name("userId")
                .type(AttributeType.STRING)
                .build())
            .sortKey(Attribute.builder()
                .name("tradeId")
                .type(AttributeType.STRING)
                .build())
            .billingMode(BillingMode.PAY_PER_REQUEST)
            .encryption(TableEncryption.AWS_MANAGED)
            .pointInTimeRecovery(true)
            .build()
        
        // Model metadata table
        Table.Builder.create(this, "ModelMetadataTable")
            .tableName("model-metadata")
            .partitionKey(Attribute.builder()
                .name("modelId")
                .type(AttributeType.STRING)
                .build())
            .billingMode(BillingMode.PAY_PER_REQUEST)
            .encryption(TableEncryption.AWS_MANAGED)
            .pointInTimeRecovery(true)
            .build()
    }
    
    private fun createElastiCacheCluster(vpc: Vpc, kmsKey: Key) {
        // Redis cluster for caching
        CfnCacheCluster.Builder.create(this, "RedisCluster")
            .cacheNodeType("cache.t3.micro")
            .engine("redis")
            .numCacheNodes(2)
            .vpcSecurityGroupIds(listOf())
            .cacheSubnetGroupName("redis-subnet-group")
            .build()
    }
    
    private fun createCognitoUserPool() {
        // User pool for authentication
        UserPool.Builder.create(this, "CeesarWalletUserPool")
            .userPoolName("ceesar-wallet-users")
            .selfSignUpEnabled(true)
            .signInAliases(SignInAliases.builder()
                .email(true)
                .username(true)
                .build())
            .standardAttributes(StandardAttributes.builder()
                .email(StandardAttribute.builder()
                    .required(true)
                    .mutable(true)
                    .build())
                .build())
            .passwordPolicy(PasswordPolicy.builder()
                .minLength(8)
                .requireLowercase(true)
                .requireUppercase(true)
                .requireDigits(true)
                .requireSymbols(true)
                .build())
            .mfa(Mfa.OPTIONAL)
            .mfaSecondFactor(MfaSecondFactor.builder()
                .sms(true)
                .otp(true)
                .build())
            .build()
    }
    
    private fun createSecretsManagerSecrets(kmsKey: Key) {
        // Broker API keys
        Secret.Builder.create(this, "BrokerAPIKeysSecret")
            .secretName("ceesar-wallet/broker-api-keys")
            .encryptionKey(kmsKey)
            .description("Broker API keys for trading")
            .build()
        
        // Database credentials
        Secret.Builder.create(this, "DatabaseCredentialsSecret")
            .secretName("ceesar-wallet/database-credentials")
            .encryptionKey(kmsKey)
            .description("Database credentials")
            .build()
        
        // ML model endpoints
        Secret.Builder.create(this, "MLModelEndpointsSecret")
            .secretName("ceesar-wallet/ml-model-endpoints")
            .encryptionKey(kmsKey)
            .description("ML model endpoints")
            .build()
    }
    
    private fun createSSMParameters(kmsKey: Key) {
        // Application configuration
        StringParameter.Builder.create(this, "AppConfigParameter")
            .parameterName("/ceesar-wallet/app/config")
            .stringValue("{\"environment\":\"production\",\"version\":\"1.0.0\"}")
            .description("Application configuration")
            .build()
        
        // Feature flags
        StringParameter.Builder.create(this, "FeatureFlagsParameter")
            .parameterName("/ceesar-wallet/features/flags")
            .stringValue("{\"autoTrading\":true,\"fraudDetection\":true,\"riskManagement\":true}")
            .description("Feature flags")
            .build()
    }
    
    private fun createCloudWatchResources() {
        // Dashboard
        Dashboard.Builder.create(this, "CeesarWalletDashboard")
            .dashboardName("CeesarWallet-Dashboard")
            .build()
        
        // Alarms
        Alarm.Builder.create(this, "HighErrorRateAlarm")
            .alarmName("CeesarWallet-HighErrorRate")
            .metric(Metric.Builder.create()
                .namespace("AWS/ApplicationELB")
                .metricName("TargetResponseTime")
                .statistic("Average")
                .period(Duration.minutes(5))
                .build())
            .threshold(1000.0)
            .evaluationPeriods(2)
            .build()
    }
    
    private fun createEventBridgeRules() {
        // Trade execution events
        Rule.Builder.create(this, "TradeExecutionRule")
            .ruleName("ceesar-wallet-trade-execution")
            .description("Rule for trade execution events")
            .eventPattern(EventPattern.builder()
                .source(listOf("ceesar-wallet.trading"))
                .detailType(listOf("Trade Executed"))
                .build())
            .build()
        
        // Fraud detection events
        Rule.Builder.create(this, "FraudDetectionRule")
            .ruleName("ceesar-wallet-fraud-detection")
            .description("Rule for fraud detection events")
            .eventPattern(EventPattern.builder()
                .source(listOf("ceesar-wallet.fraud"))
                .detailType(listOf("Fraud Detected"))
                .build())
            .build()
    }
    
    private fun createLambdaFunctions(vpc: Vpc, kmsKey: Key) {
        // Score dispatcher function
        Function.Builder.create(this, "ScoreDispatcherFunction")
            .functionName("ceesar-wallet-score-dispatcher")
            .runtime(Runtime.PYTHON_3_11)
            .handler("index.handler")
            .code(Code.fromAsset("lambda/score-dispatcher"))
            .timeout(Duration.seconds(30))
            .memorySize(256)
            .vpc(vpc)
            .environment(mapOf(
                "KINESIS_STREAM_NAME" to "fraud-scores",
                "DYNAMODB_TABLE_NAME" to "trading-sessions"
            ))
            .build()
        
        // Model training function
        Function.Builder.create(this, "ModelTrainingFunction")
            .functionName("ceesar-wallet-model-training")
            .runtime(Runtime.PYTHON_3_11)
            .handler("index.handler")
            .code(Code.fromAsset("lambda/model-training"))
            .timeout(Duration.minutes(15))
            .memorySize(1024)
            .vpc(vpc)
            .environment(mapOf(
                "SAGEMAKER_ROLE_ARN" to "arn:aws:iam::123456789012:role/SageMakerExecutionRole",
                "S3_BUCKET_NAME" to "ceesar-wallet-models"
            ))
            .build()
    }
    
    private fun createSageMakerResources(kmsKey: Key) {
        // SageMaker execution role
        Role.Builder.create(this, "SageMakerExecutionRole")
            .roleName("CeesarWalletSageMakerExecutionRole")
            .assumedBy(ServicePrincipal.Builder.create("sagemaker.amazonaws.com").build())
            .managedPolicies(listOf(
                ManagedPolicy.fromAwsManagedPolicyName("AmazonSageMakerFullAccess"),
                ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"),
                ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess")
            ))
            .build()
        
        // SageMaker endpoint
        CfnEndpoint.Builder.create(this, "MLModelEndpoint")
            .endpointName("ceesar-wallet-ml-endpoint")
            .endpointConfigName("ceesar-wallet-ml-config")
            .build()
    }
    
    private fun createFraudDetectorResources() {
        // Fraud detector detector
        CfnDetector.Builder.create(this, "FraudDetector")
            .detectorId("pre-trade-detector")
            .description("Pre-trade fraud detection detector")
            .eventTypeName("pre-trade-event")
            .build()
        
        // Fraud detector event type
        CfnEventType.Builder.create(this, "FraudDetectorEventType")
            .name("pre-trade-event")
            .description("Pre-trade fraud detection event")
            .eventVariables(listOf(
                CfnEventType.EventVariableProperty.builder()
                    .name("ip")
                    .dataType("STRING")
                    .dataSource("EVENT")
                    .build(),
                CfnEventType.EventVariableProperty.builder()
                    .name("deviceId")
                    .dataType("STRING")
                    .dataSource("EVENT")
                    .build()
            ))
            .labels(listOf(
                CfnEventType.LabelProperty.builder()
                    .name("FRAUD")
                    .description("Fraudulent transaction")
                    .build(),
                CfnEventType.LabelProperty.builder()
                    .name("LEGIT")
                    .description("Legitimate transaction")
                    .build()
            ))
            .build()
    }
    
    private fun createSecurityResources() {
        // WAF Web ACL
        CfnWebACL.Builder.create(this, "CeesarWalletWAF")
            .name("CeesarWalletWAF")
            .description("WAF for CeesarWallet")
            .scope("CLOUDFRONT")
            .defaultAction(CfnWebACL.DefaultActionProperty.builder()
                .allow(CfnWebACL.AllowActionProperty.builder().build())
                .build())
            .rules(listOf(
                CfnWebACL.RuleProperty.builder()
                    .name("RateLimitRule")
                    .priority(1)
                    .statement(CfnWebACL.StatementProperty.builder()
                        .rateBasedStatement(CfnWebACL.RateBasedStatementProperty.builder()
                            .limit(2000)
                            .aggregateKeyType("IP")
                            .build())
                        .build())
                    .action(CfnWebACL.RuleActionProperty.builder()
                        .block(CfnWebACL.BlockActionProperty.builder().build())
                        .build())
                    .visibilityConfig(CfnWebACL.VisibilityConfigProperty.builder()
                        .sampledRequestsEnabled(true)
                        .cloudWatchMetricsEnabled(true)
                        .metricName("RateLimitRule")
                        .build())
                    .build()
            ))
            .visibilityConfig(CfnWebACL.VisibilityConfigProperty.builder()
                .sampledRequestsEnabled(true)
                .cloudWatchMetricsEnabled(true)
                .metricName("CeesarWalletWAF")
                .build())
            .build()
        
        // Shield protection
        CfnProtection.Builder.create(this, "CeesarWalletShield")
            .name("CeesarWalletShield")
            .resourceArn("arn:aws:cloudfront::123456789012:distribution/E1234567890123")
            .build()
    }
    
    private fun createCloudTrail(kmsKey: Key) {
        // CloudTrail for audit logging
        Trail.Builder.create(this, "CeesarWalletCloudTrail")
            .trailName("ceesar-wallet-cloudtrail")
            .includeGlobalServiceEvents(true)
            .isMultiRegionTrail(true)
            .encryptionKey(kmsKey)
            .build()
    }
    
    private fun createOpenSearch(vpc: Vpc, kmsKey: Key) {
        // OpenSearch domain for log analysis
        Domain.Builder.create(this, "CeesarWalletOpenSearch")
            .domainName("ceesar-wallet-logs")
            .version(EngineVersion.OPENSEARCH_1_3)
            .capacity(CapacityConfig.builder()
                .dataNodes(2)
                .dataNodeInstanceType("t3.small.search")
                .build())
            .vpc(vpc)
            .encryptionAtRest(EncryptionAtRestOptions.builder()
                .enabled(true)
                .kmsKey(kmsKey)
                .build())
            .nodeToNodeEncryption(true)
            .enforceHttps(true)
            .build()
    }
    
    private fun createSNSTopics() {
        // SNS topic for alerts
        Topic.Builder.create(this, "CeesarWalletAlertsTopic")
            .topicName("ceesar-wallet-alerts")
            .displayName("CeesarWallet Alerts")
            .build()
        
        // SNS topic for notifications
        Topic.Builder.create(this, "CeesarWalletNotificationsTopic")
            .topicName("ceesar-wallet-notifications")
            .displayName("CeesarWallet Notifications")
            .build()
    }
    
    private fun createSQSQueues(kmsKey: Key) {
        // SQS queue for trade processing
        Queue.Builder.create(this, "TradeProcessingQueue")
            .queueName("ceesar-wallet-trade-processing")
            .encryption(QueueEncryption.KMS)
            .encryptionKey(kmsKey)
            .visibilityTimeout(Duration.minutes(5))
            .messageRetentionPeriod(Duration.days(14))
            .build()
        
        // SQS queue for fraud processing
        Queue.Builder.create(this, "FraudProcessingQueue")
            .queueName("ceesar-wallet-fraud-processing")
            .encryption(QueueEncryption.KMS)
            .encryptionKey(kmsKey)
            .visibilityTimeout(Duration.minutes(5))
            .messageRetentionPeriod(Duration.days(14))
            .build()
    }
    
    private fun createGlueResources(kmsKey: Key) {
        // Glue job for ETL
        CfnJob.Builder.create(this, "CeesarWalletETLJob")
            .name("ceesar-wallet-etl-job")
            .role("arn:aws:iam::123456789012:role/GlueServiceRole")
            .command(CfnJob.JobCommandProperty.builder()
                .name("glueetl")
                .scriptLocation("s3://ceesar-wallet-scripts/etl-job.py")
                .build())
            .glueVersion("3.0")
            .maxCapacity(2.0)
            .build()
        
        // Glue database
        CfnDatabase.Builder.create(this, "CeesarWalletGlueDatabase")
            .catalogId("123456789012")
            .databaseInput(CfnDatabase.DatabaseInputProperty.builder()
                .name("ceesar_wallet_db")
                .description("CeesarWallet database")
                .build())
            .build()
    }
    
    private fun createKinesisDataAnalytics(kmsKey: Key) {
        // Kinesis Data Analytics application
        CfnApplication.Builder.create(this, "CeesarWalletKDA")
            .applicationName("ceesar-wallet-kda")
            .applicationDescription("Kinesis Data Analytics for CeesarWallet")
            .runtimeEnvironment("FLINK-1_15")
            .serviceExecutionRole("arn:aws:iam::123456789012:role/KinesisAnalyticsServiceRole")
            .build()
    }
    
    private fun createECSServices(vpc: Vpc, kmsKey: Key) {
        // ECS cluster
        Cluster.Builder.create(this, "CeesarWalletCluster")
            .clusterName("ceesar-wallet-cluster")
            .vpc(vpc)
            .build()
        
        // ECS task definition
        TaskDefinition.Builder.create(this, "CeesarWalletTaskDefinition")
            .family("ceesar-wallet")
            .cpu("256")
            .memoryMiB("512")
            .networkMode(NetworkMode.AWS_VPC)
            .build()
        
        // ECS service
        FargateService.Builder.create(this, "CeesarWalletService")
            .serviceName("ceesar-wallet-service")
            .cluster(Cluster.Builder.create(this, "CeesarWalletCluster")
                .clusterName("ceesar-wallet-cluster")
                .vpc(vpc)
                .build())
            .taskDefinition(TaskDefinition.Builder.create(this, "CeesarWalletTaskDefinition")
                .family("ceesar-wallet")
                .cpu("256")
                .memoryMiB("512")
                .networkMode(NetworkMode.AWS_VPC)
                .build())
            .desiredCount(2)
            .build()
    }
    
    private fun createIAMRoles() {
        // ECS task role
        Role.Builder.create(this, "ECSTaskRole")
            .roleName("CeesarWalletECSTaskRole")
            .assumedBy(ServicePrincipal.Builder.create("ecs-tasks.amazonaws.com").build())
            .managedPolicies(listOf(
                ManagedPolicy.fromAwsManagedPolicyName("AmazonKinesisFullAccess"),
                ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess"),
                ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"),
                ManagedPolicy.fromAwsManagedPolicyName("AmazonSageMakerFullAccess")
            ))
            .build()
        
        // Lambda execution role
        Role.Builder.create(this, "LambdaExecutionRole")
            .roleName("CeesarWalletLambdaExecutionRole")
            .assumedBy(ServicePrincipal.Builder.create("lambda.amazonaws.com").build())
            .managedPolicies(listOf(
                ManagedPolicy.fromAwsManagedPolicyName("AWSLambdaBasicExecutionRole"),
                ManagedPolicy.fromAwsManagedPolicyName("AmazonKinesisFullAccess"),
                ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess"),
                ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess")
            ))
            .build()
    }
    
    private fun createOutputs() {
        // Output important values
        CfnOutput.Builder.create(this, "VPCId")
            .value(vpc.vpcId)
            .description("VPC ID")
            .build()
        
        CfnOutput.Builder.create(this, "KMSKeyId")
            .value(kmsKey.keyId)
            .description("KMS Key ID")
            .build()
        
        CfnOutput.Builder.create(this, "UserPoolId")
            .value("ceesar-wallet-users")
            .description("Cognito User Pool ID")
            .build()
    }
}
