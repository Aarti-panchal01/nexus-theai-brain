import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "6911ae8235a6b72eddcc5949", 
  requiresAuth: true // Ensure authentication is required for all operations
});
