'use client';

import { Amplify } from 'aws-amplify';

// AWS Cognito credentials
const configureAws = () => {
  if (typeof window !== 'undefined') {
    const awsConfig = {
      Auth: {
        Cognito: {
          userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || 'us-east-2_2LcaWXxCl',
          userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || 'v3sdfiikctplpsrfals8bm68r',
          region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-2',
        }
      }
    };

    // Clear cached configurations
    localStorage.removeItem('amplify-signin-with-hostedUI');
    localStorage.removeItem('amplify-redirected-from-hosted-ui');

    // Log configuration for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log("AWS Configuration:", {
        userPoolId: awsConfig.Auth.Cognito.userPoolId,
        userPoolClientId: awsConfig.Auth.Cognito.userPoolClientId,
        region: awsConfig.Auth.Cognito.region
      });
    }

    // Initialize Amplify
    Amplify.configure(awsConfig);
  }
};

export { configureAws }; 