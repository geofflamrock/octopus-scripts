import { createAppAuth } from '@octokit/auth-app';

interface GitHubAppConfig {
  appId: string;
  privateKey: string;
  clientId: string;
  clientSecret: string;
  installationId: string;
}

async function createInstallationAccessToken(config: GitHubAppConfig): Promise<string> {
  const { appId, privateKey, clientId, clientSecret, installationId } = config;

  // Validate private key format
  if (!privateKey.includes('BEGIN') || !privateKey.includes('PRIVATE KEY')) {
    throw new Error('Invalid private key format. Expected a PEM-formatted private key.');
  }

  // Create the authentication instance
  const auth = createAppAuth({
    appId,
    privateKey,
    clientId,
    clientSecret,
  });

  // Get the installation access token
  const installationAuthentication = await auth({
    type: 'installation',
    installationId: Number(installationId),
  });

  return installationAuthentication.token;
}

async function main() {
  // Get configuration from environment variables or command line arguments
  const appId = process.env.GITHUB_APP_ID || process.argv[2];
  const privateKey = process.env.GITHUB_PRIVATE_KEY || process.argv[3];
  const clientId = process.env.GITHUB_CLIENT_ID || process.argv[4];
  const clientSecret = process.env.GITHUB_CLIENT_SECRET || process.argv[5];
  const installationId = process.env.GITHUB_INSTALLATION_ID || process.argv[6];

  // Validate all required parameters are provided
  if (!appId || !privateKey || !clientId || !clientSecret || !installationId) {
    console.error('Error: Missing required parameters');
    console.error('');
    console.error('Usage:');
    console.error('  node dist/create-installation-token.js <appId> <privateKey> <clientId> <clientSecret> <installationId>');
    console.error('');
    console.error('Or set environment variables:');
    console.error('  GITHUB_APP_ID');
    console.error('  GITHUB_PRIVATE_KEY');
    console.error('  GITHUB_CLIENT_ID');
    console.error('  GITHUB_CLIENT_SECRET');
    console.error('  GITHUB_INSTALLATION_ID');
    process.exit(1);
  }

  try {
    const token = await createInstallationAccessToken({
      appId,
      privateKey,
      clientId,
      clientSecret,
      installationId,
    });

    console.log(token);
  } catch (error) {
    console.error('Error creating installation access token:', error);
    process.exit(1);
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main();
}

export { createInstallationAccessToken, GitHubAppConfig };
