#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as pinpoint from 'aws-cdk-lib/aws-pinpoint';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as eventbridge from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

export class CeesarWalletInfrastructureStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // AWS Account ID
    const accountId = '476114151082';
    const region = 'us-east-1';

    // Create S3 bucket for static assets
    const assetsBucket = new s3.Bucket(this, 'CeesarWalletAssets', {
      bucketName: `ceesar-wallet-assets-${accountId}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'CeesarWalletDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(assetsBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
      },
      domainNames: ['ceesarwallet.com', 'www.ceesarwallet.com'],
      certificate: cdk.aws_certificatemanager.Certificate.fromCertificateArn(
        this,
        'Certificate',
        `arn:aws:acm:${region}:${accountId}:certificate/your-certificate-id`
      ),
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    // Create Cognito User Pool
    const userPool = new cognito.UserPool(this, 'CeesarWalletUserPool', {
      userPoolName: 'CeesarWallet-Users',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: true,
          mutable: true,
        },
        familyName: {
          required: true,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: true,
        otp: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create Cognito User Pool Client
    const userPoolClient = new cognito.UserPoolClient(this, 'CeesarWalletUserPoolClient', {
      userPool,
      userPoolClientName: 'CeesarWallet-WebClient',
      generateSecret: true,
      authFlows: {
        userSrp: true,
        userPassword: true,
        adminUserPassword: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true,
        },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
        callbackUrls: ['https://ceesarwallet.com/auth/callback'],
        logoutUrls: ['https://ceesarwallet.com/auth/logout'],
      },
      refreshTokenValidity: cdk.Duration.days(30),
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
    });

    // Create DynamoDB tables
    const marketDataTable = new dynamodb.Table(this, 'MarketDataTable', {
      tableName: 'CeesarWallet-MarketData',
      partitionKey: { name: 'symbol', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const tradeSignalsTable = new dynamodb.Table(this, 'TradeSignalsTable', {
      tableName: 'CeesarWallet-TradeSignals',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const tradeExecutionsTable = new dynamodb.Table(this, 'TradeExecutionsTable', {
      tableName: 'CeesarWallet-TradeExecutions',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const positionsTable = new dynamodb.Table(this, 'PositionsTable', {
      tableName: 'CeesarWallet-Positions',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const portfolioTable = new dynamodb.Table(this, 'PortfolioTable', {
      tableName: 'CeesarWallet-Portfolio',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create Lambda functions
    const tradingApiLambda = new lambda.Function(this, 'TradingApiLambda', {
      functionName: 'CeesarWallet-TradingAPI',
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'main.handler',
      code: lambda.Code.fromAsset('../backend/lambda'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        MARKET_DATA_TABLE: marketDataTable.tableName,
        TRADE_SIGNALS_TABLE: tradeSignalsTable.tableName,
        TRADE_EXECUTIONS_TABLE: tradeExecutionsTable.tableName,
        POSITIONS_TABLE: positionsTable.tableName,
        PORTFOLIO_TABLE: portfolioTable.tableName,
        USER_POOL_ID: userPool.userPoolId,
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      },
    });

    // Grant Lambda permissions to DynamoDB tables
    marketDataTable.grantReadWriteData(tradingApiLambda);
    tradeSignalsTable.grantReadWriteData(tradingApiLambda);
    tradeExecutionsTable.grantReadWriteData(tradingApiLambda);
    positionsTable.grantReadWriteData(tradingApiLambda);
    portfolioTable.grantReadWriteData(tradingApiLambda);

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'CeesarWalletAPI', {
      restApiName: 'CeesarWallet Trading API',
      description: 'API for CeesarWallet trading platform',
      defaultCorsPreflightOptions: {
        allowOrigins: ['https://ceesarwallet.com', 'https://www.ceesarwallet.com'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
      },
    });

    // Create Cognito Authorizer
    const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [userPool],
      authorizerName: 'CognitoAuthorizer',
    });

    // Add API Gateway resources
    const marketDataResource = api.root.addResource('market-data');
    const symbolResource = marketDataResource.addResource('{symbol}');
    symbolResource.addMethod('GET', new apigateway.LambdaIntegration(tradingApiLambda), {
      authorizer: cognitoAuthorizer,
    });

    const signalsResource = api.root.addResource('signals');
    signalsResource.addMethod('GET', new apigateway.LambdaIntegration(tradingApiLambda), {
      authorizer: cognitoAuthorizer,
    });
    signalsResource.addMethod('POST', new apigateway.LambdaIntegration(tradingApiLambda), {
      authorizer: cognitoAuthorizer,
    });

    const tradesResource = api.root.addResource('trades');
    const executeResource = tradesResource.addResource('execute');
    executeResource.addMethod('POST', new apigateway.LambdaIntegration(tradingApiLambda), {
      authorizer: cognitoAuthorizer,
    });

    const executionsResource = tradesResource.addResource('executions');
    executionsResource.addMethod('GET', new apigateway.LambdaIntegration(tradingApiLambda), {
      authorizer: cognitoAuthorizer,
    });

    const positionsResource = api.root.addResource('positions');
    positionsResource.addMethod('GET', new apigateway.LambdaIntegration(tradingApiLambda), {
      authorizer: cognitoAuthorizer,
    });

    const portfolioResource = api.root.addResource('portfolio');
    portfolioResource.addMethod('GET', new apigateway.LambdaIntegration(tradingApiLambda), {
      authorizer: cognitoAuthorizer,
    });

    // Create AppSync API
    const graphqlApi = new appsync.GraphqlApi(this, 'CeesarWalletGraphQL', {
      name: 'CeesarWallet-GraphQL',
      schema: appsync.Schema.fromAsset('./graphql/schema.graphql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool: userPool,
          },
        },
        additionalAuthorizationModes: [
          {
            authorizationType: appsync.AuthorizationType.API_KEY,
            apiKeyConfig: {
              description: 'API Key for public access',
              expires: cdk.Expiration.after(cdk.Duration.days(365)),
            },
          },
        ],
      },
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
      },
    });

    // Create AppSync Data Sources
    const marketDataDataSource = graphqlApi.addDynamoDbDataSource('MarketDataDataSource', marketDataTable);
    const tradeSignalsDataSource = graphqlApi.addDynamoDbDataSource('TradeSignalsDataSource', tradeSignalsTable);
    const tradeExecutionsDataSource = graphqlApi.addDynamoDbDataSource('TradeExecutionsDataSource', tradeExecutionsTable);
    const positionsDataSource = graphqlApi.addDynamoDbDataSource('PositionsDataSource', positionsTable);
    const portfolioDataSource = graphqlApi.addDynamoDbDataSource('PortfolioDataSource', portfolioTable);

    // Create Pinpoint application for push notifications
    const pinpointApp = new pinpoint.CfnApp(this, 'CeesarWalletPinpoint', {
      name: 'CeesarWallet-Mobile',
    });

    // Create SNS topics for notifications
    const fraudAlertsTopic = new sns.Topic(this, 'FraudAlertsTopic', {
      topicName: 'CeesarWallet-FraudAlerts',
      displayName: 'CeesarWallet Fraud Alerts',
    });

    const riskAlertsTopic = new sns.Topic(this, 'RiskAlertsTopic', {
      topicName: 'CeesarWallet-RiskAlerts',
      displayName: 'CeesarWallet Risk Alerts',
    });

    const tradeExecutionsTopic = new sns.Topic(this, 'TradeExecutionsTopic', {
      topicName: 'CeesarWallet-TradeExecutions',
      displayName: 'CeesarWallet Trade Executions',
    });

    // Create EventBridge rules
    const fraudAlertsRule = new eventbridge.Rule(this, 'FraudAlertsRule', {
      ruleName: 'CeesarWallet-FraudAlerts',
      description: 'Rule for fraud detection alerts',
      eventPattern: {
        source: ['ceesarwallet.fraud'],
        detailType: ['Fraud Detected'],
      },
    });

    fraudAlertsRule.addTarget(new targets.SnsTopic(fraudAlertsTopic));

    const riskAlertsRule = new eventbridge.Rule(this, 'RiskAlertsRule', {
      ruleName: 'CeesarWallet-RiskAlerts',
      description: 'Rule for risk management alerts',
      eventPattern: {
        source: ['ceesarwallet.risk'],
        detailType: ['Risk Threshold Exceeded'],
      },
    });

    riskAlertsRule.addTarget(new targets.SnsTopic(riskAlertsTopic));

    // Create WAF Web ACL
    const webAcl = new wafv2.CfnWebACL(this, 'CeesarWalletWAF', {
      name: 'CeesarWallet-WAF',
      scope: 'CLOUDFRONT',
      defaultAction: { allow: {} },
      rules: [
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
          },
        },
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 2,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesCommonRuleSet',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'CeesarWalletWAF',
      },
    });

    // Associate WAF with CloudFront distribution
    new wafv2.CfnWebACLAssociation(this, 'WAFAssociation', {
      resourceArn: `arn:aws:cloudfront::${accountId}:distribution/${distribution.distributionId}`,
      webAclArn: webAcl.attrArn,
    });

    // Create CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'CeesarWalletDashboard', {
      dashboardName: 'CeesarWallet-Frontend',
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Requests',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Count',
            dimensionsMap: {
              ApiName: api.restApiName,
            },
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Invocations',
            dimensionsMap: {
              FunctionName: tradingApiLambda.functionName,
            },
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Read/Write Capacity',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ConsumedReadCapacityUnits',
            dimensionsMap: {
              TableName: marketDataTable.tableName,
            },
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ConsumedWriteCapacityUnits',
            dimensionsMap: {
              TableName: marketDataTable.tableName,
            },
          }),
        ],
      })
    );

    // Create Secrets Manager secrets
    const brokerSecrets = new secretsmanager.Secret(this, 'BrokerSecrets', {
      secretName: 'CeesarWallet/BrokerSecrets',
      description: 'Secrets for broker API integrations',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          alpacaApiKey: 'your-alpaca-api-key',
          alpacaSecretKey: 'your-alpaca-secret-key',
          binanceApiKey: 'your-binance-api-key',
          binanceSecretKey: 'your-binance-secret-key',
          oandaApiKey: 'your-oanda-api-key',
          oandaSecretKey: 'your-oanda-secret-key',
        }),
        generateStringKey: 'randomKey',
        excludeCharacters: '"@/\\',
      },
    });

    // Create SSM Parameters
    new ssm.StringParameter(this, 'UserPoolIdParameter', {
      parameterName: '/CeesarWallet/Cognito/UserPoolId',
      stringValue: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new ssm.StringParameter(this, 'UserPoolClientIdParameter', {
      parameterName: '/CeesarWallet/Cognito/UserPoolClientId',
      stringValue: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new ssm.StringParameter(this, 'ApiGatewayUrlParameter', {
      parameterName: '/CeesarWallet/API/GatewayUrl',
      stringValue: api.url,
      description: 'API Gateway URL',
    });

    new ssm.StringParameter(this, 'GraphQLApiUrlParameter', {
      parameterName: '/CeesarWallet/GraphQL/ApiUrl',
      stringValue: graphqlApi.graphqlUrl,
      description: 'GraphQL API URL',
    });

    new ssm.StringParameter(this, 'PinpointAppIdParameter', {
      parameterName: '/CeesarWallet/Pinpoint/AppId',
      stringValue: pinpointApp.ref,
      description: 'Pinpoint Application ID',
    });

    // Output important values
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'GraphQLApiUrl', {
      value: graphqlApi.graphqlUrl,
      description: 'GraphQL API URL',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront Distribution ID',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: assetsBucket.bucketName,
      description: 'S3 Bucket Name for Assets',
    });

    new cdk.CfnOutput(this, 'PinpointAppId', {
      value: pinpointApp.ref,
      description: 'Pinpoint Application ID',
    });
  }
}

const app = new cdk.App();
new CeesarWalletInfrastructureStack(app, 'CeesarWalletInfrastructureStack', {
  env: {
    account: '476114151082',
    region: 'us-east-1',
  },
});
