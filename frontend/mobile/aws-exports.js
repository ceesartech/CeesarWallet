const awsconfig = {
  aws_project_region: 'us-east-1',
  aws_cognito_region: 'us-east-1',
  aws_user_pools_id: 'us-east-1_XXXXXXXXX',
  aws_user_pools_web_client_id: 'your_client_id',
  oauth: {
    domain: 'your-domain.auth.us-east-1.amazoncognito.com',
    scope: ['phone', 'email', 'openid', 'profile', 'aws.cognito.signin.user.admin'],
    redirectSignIn: 'ceesartrader://',
    redirectSignOut: 'ceesartrader://',
    responseType: 'code'
  },
  federationTarget: 'COGNITO_USER_POOLS',
  aws_cognito_identity_pool_id: 'us-east-1:your-identity-pool-id',
  aws_cognito_mfa_types: ['SMS'],
  aws_cognito_signup_attributes: ['EMAIL'],
  aws_cognito_social_providers: ['GOOGLE', 'APPLE'],
  aws_cognito_username_attributes: ['EMAIL'],
  aws_cognito_user_pool_add_ons: {
    advancedSecurityMode: 'ENFORCED'
  },
  aws_appsync_graphqlEndpoint: 'https://your-api-id.appsync-api.us-east-1.amazonaws.com/graphql',
  aws_appsync_region: 'us-east-1',
  aws_appsync_authenticationType: 'AMAZON_COGNITO_USER_POOLS',
  aws_appsync_apiKey: 'your-api-key',
  aws_user_files_s3_bucket: 'ceesar-trader-assets-476114151082',
  aws_user_files_s3_bucket_region: 'us-east-1',
  aws_mobile_analytics_app_id: 'your-analytics-app-id',
  aws_mobile_analytics_app_region: 'us-east-1',
  aws_pinpoint_app_id: 'your-pinpoint-app-id',
  aws_pinpoint_region: 'us-east-1',
  aws_pinpoint_endpoint: 'https://pinpoint.us-east-1.amazonaws.com',
  aws_cloud_logic_custom: [
    {
      name: 'ceesartrader-api',
      endpoint: 'https://your-api-id.execute-api.us-east-1.amazonaws.com/prod',
      region: 'us-east-1'
    }
  ]
};

export default awsconfig;
