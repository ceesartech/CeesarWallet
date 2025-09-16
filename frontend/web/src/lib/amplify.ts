import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

// Import your AWS configuration
import awsconfig from './aws-exports';

// Configure Amplify
Amplify.configure(awsconfig);

// Configure Amplify UI
const amplifyConfig = {
  Auth: {
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID,
    userPoolWebClientId: process.env.NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID,
    mandatorySignIn: true,
    authenticationFlowType: 'USER_SRP_AUTH',
  },
  API: {
    GraphQL: {
      endpoint: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT,
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
      defaultAuthMode: 'AMAZON_COGNITO_USER_POOLS',
    },
    REST: {
      TradingAPI: {
        endpoint: process.env.NEXT_PUBLIC_API_GATEWAY_URL,
        region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
      },
    },
  },
  Storage: {
    AWSS3: {
      bucket: process.env.NEXT_PUBLIC_S3_BUCKET,
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    },
  },
  Analytics: {
    AWSPinpoint: {
      appId: process.env.NEXT_PUBLIC_PINPOINT_APP_ID,
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    },
  },
  Notifications: {
    AWSPinpoint: {
      appId: process.env.NEXT_PUBLIC_PINPOINT_APP_ID,
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    },
  },
};

export default amplifyConfig;
