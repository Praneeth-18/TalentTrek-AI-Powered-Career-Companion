import { Amplify } from 'aws-amplify';

// Use environment variables for AWS Cognito credentials
const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
      region: import.meta.env.VITE_AWS_REGION,
    }
  }
};

// Force clear any cached configurations
localStorage.removeItem('amplify-signin-with-hostedUI');
localStorage.removeItem('amplify-redirected-from-hosted-ui');

// Log configuration for debugging
console.log("AWS Configuration (from env):", {
  userPoolId: awsConfig.Auth.Cognito.userPoolId,
  userPoolClientId: awsConfig.Auth.Cognito.userPoolClientId,
  region: awsConfig.Auth.Cognito.region
});

Amplify.configure(awsConfig);

export default Amplify; 