import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

interface GitHubAppConfig {
  appId: string;
  privateKey: string;
  repositoryOwner: string;
  repositoryName: string;
}

async function createInstallationAccessToken(
  config: GitHubAppConfig
): Promise<string> {
  const { appId, privateKey, repositoryOwner, repositoryName } = config;

  // Validate private key format
  if (!privateKey.includes("BEGIN") || !privateKey.includes("PRIVATE KEY")) {
    throw new Error(
      "Invalid private key format. Expected a PEM-formatted private key."
    );
  }

  // Create the authentication instance
  const auth = createAppAuth({
    appId,
    privateKey,
  });

  // Get an app authentication to look up the installation
  const appAuthentication = await auth({
    type: "app",
  });

  // Create an Octokit instance with app authentication
  const octokit = new Octokit({
    auth: appAuthentication.token,
  });

  // Look up the installation for the repository
  let installationId: number;
  try {
    const { data: installation } = await octokit.apps.getRepoInstallation({
      owner: repositoryOwner,
      repo: repositoryName,
    });
    installationId = installation.id;
  } catch (error) {
    throw new Error(
      `Failed to find installation for repository ${repositoryOwner}/${repositoryName}: ${error}`
    );
  }

  // Get the installation access token
  const installationAuthentication = await auth({
    type: "installation",
    installationId,
  });

  return installationAuthentication.token;
}

async function main() {
  // Get configuration from environment variables or command line arguments
  const appId = process.env.GITHUB_APP_ID || process.argv[2];
  const privateKey = process.env.GITHUB_PRIVATE_KEY || process.argv[3];
  const repositoryOwner =
    process.env.GITHUB_REPOSITORY_OWNER || process.argv[4];
  const repositoryName = process.env.GITHUB_REPOSITORY_NAME || process.argv[5];

  // Validate all required parameters are provided
  if (!appId || !privateKey || !repositoryOwner || !repositoryName) {
    console.error("Error: Missing required parameters");
    console.error("");
    console.error("Usage:");
    console.error(
      "  node dist/create-installation-token.js <appId> <privateKey> <repositoryOwner> <repositoryName>"
    );
    console.error("");
    console.error("Or set environment variables:");
    console.error("  GITHUB_APP_ID");
    console.error("  GITHUB_PRIVATE_KEY");
    console.error("  GITHUB_REPOSITORY_OWNER");
    console.error("  GITHUB_REPOSITORY_NAME");
    process.exit(1);
  }

  try {
    const token = await createInstallationAccessToken({
      appId,
      privateKey,
      repositoryOwner,
      repositoryName,
    });

    console.log(token);
  } catch (error) {
    console.error("Error creating installation access token:", error);
    process.exit(1);
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main();
}

export { createInstallationAccessToken, GitHubAppConfig };
