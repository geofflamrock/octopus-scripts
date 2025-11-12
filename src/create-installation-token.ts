import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import {
  setOutputVariable,
  writeError,
  writeInfo,
} from "./octopus-service-messages";

interface GitHubAppConfig {
  appId: string;
  privateKey: string;
  repositoryOwner: string;
  repositoryName: string;
  permissions?: string;
}

function parsePermissions(
  permissionsInput?: string
): Record<string, string> | undefined {
  if (!permissionsInput) {
    return undefined;
  }

  const permissions: Record<string, string> = {};
  const lines = permissionsInput.trim().split("\n");

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      continue; // Skip empty lines
    }

    const [permission, level] = trimmedLine.split(":");
    if (permission && level) {
      permissions[permission.trim()] = level.trim();
    }
  }

  return Object.keys(permissions).length > 0 ? permissions : undefined;
}

async function createInstallationAccessToken(
  config: GitHubAppConfig
): Promise<string> {
  const {
    appId,
    privateKey,
    repositoryOwner,
    repositoryName,
    permissions: permissionsInput,
  } = config;

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

  // Get the installation access token, restricted to the specific repository
  const permissions = parsePermissions(permissionsInput);
  const installationAuthentication = await auth({
    type: "installation",
    installationId,
    repositories: [repositoryName],
    ...(permissions && { permissions }),
  });

  // Log the installation authentication details
  writeInfo(`GitHub installation access token created successfully:`);
  writeInfo(`  Expires at: ${installationAuthentication.expiresAt}`);
  writeInfo(
    `  Permissions: ${JSON.stringify(
      installationAuthentication.permissions,
      null,
      2
    )}`
  );
  writeInfo(
    `  Repository selection: ${installationAuthentication.repositorySelection}`
  );
  if (installationAuthentication.repositoryNames) {
    writeInfo(
      `  Repository names: ${installationAuthentication.repositoryNames.join(
        ", "
      )}`
    );
  }

  return installationAuthentication.token;
}

async function main() {
  // Get configuration from environment variables or command line arguments
  const appId = process.env.GITHUB_APP_ID || process.argv[2];
  const privateKey = process.env.GITHUB_PRIVATE_KEY || process.argv[3];
  const repositoryOwner =
    process.env.GITHUB_REPOSITORY_OWNER || process.argv[4];
  const repositoryName = process.env.GITHUB_REPOSITORY_NAME || process.argv[5];
  const permissions = process.env.GITHUB_PERMISSIONS || process.argv[6];

  // Validate all required parameters are provided
  if (!appId || !privateKey || !repositoryOwner || !repositoryName) {
    console.error("Error: Missing required parameters");
    console.error("");
    console.error("Usage:");
    console.error(
      "  node dist/create-installation-token.js <appId> <privateKey> <repositoryOwner> <repositoryName> [permissions]"
    );
    console.error("");
    console.error("Or set environment variables:");
    console.error("  GITHUB_APP_ID");
    console.error("  GITHUB_PRIVATE_KEY");
    console.error("  GITHUB_REPOSITORY_OWNER");
    console.error("  GITHUB_REPOSITORY_NAME");
    console.error(
      "  GITHUB_PERMISSIONS (optional, format: 'permission:level' per line)"
    );
    process.exit(1);
  }

  try {
    const token = await createInstallationAccessToken({
      appId,
      privateKey,
      repositoryOwner,
      repositoryName,
      permissions,
    });

    // Set the token as an Octopus output variable
    setOutputVariable("token", token, true);
  } catch (error) {
    writeError(`Error creating installation access token: ${error}`);
    process.exit(1);
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main();
}

export { createInstallationAccessToken, GitHubAppConfig, parsePermissions };
