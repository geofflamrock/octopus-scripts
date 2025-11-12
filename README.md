# octopus-scripts

Scripts to do things in Octopus

## GitHub App Installation Access Token Generator

This Node.js TypeScript project provides a script to create an installation access token for a GitHub App using the `@octokit/auth-app` library. The script automatically looks up the installation ID for a given repository.

### Prerequisites

- Node.js (v24 or higher)

### Installation

The compiled script in the `dist/` folder is self-contained and bundles all dependencies. You can run it directly without installing any npm packages:

```bash
node dist/create-installation-token.js
```

If you want to modify the source code and rebuild:

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Build the TypeScript project (uses esbuild to bundle all dependencies):

```bash
npm run build
```

### Usage

The script accepts GitHub App credentials either through command-line arguments or environment variables.

#### Using PowerShell (Windows)

##### Generic Script Runner

A generic PowerShell script runner is provided to execute any Node.js script in this repository:

```powershell
.\scripts\run-script.ps1 <relativeScriptPath> [script arguments...]
```

Example:

```powershell
.\scripts\run-script.ps1 "dist\create-installation-token.js" "123456" "-----BEGIN RSA PRIVATE KEY-----..." "octocat" "Hello-World"
```

##### Create Installation Token Script

A convenience wrapper script is provided for creating GitHub App installation tokens:

```powershell
.\scripts\create-installation-token.ps1 -AppId <appId> -PrivateKey <privateKey> -RepositoryOwner <owner> -RepositoryName <name> [-Permissions <permissions>]
```

Example:

```powershell
.\scripts\create-installation-token.ps1 -AppId "123456" -PrivateKey "-----BEGIN RSA PRIVATE KEY-----..." -RepositoryOwner "octocat" -RepositoryName "Hello-World"
```

With permissions:

```powershell
.\scripts\create-installation-token.ps1 -AppId "123456" -PrivateKey "-----BEGIN RSA PRIVATE KEY-----..." -RepositoryOwner "octocat" -RepositoryName "Hello-World" -Permissions "contents:write`npull_requests:read"
```

**Octopus Deploy Integration**: When running inside Octopus Deploy, the PowerShell script automatically exports the generated token as a sensitive output variable named `token` using the `Set-OctopusVariable` function. This allows the token to be used in subsequent deployment steps.

#### Using Command-Line Arguments

```bash
node dist/create-installation-token.js <appId> <privateKey> <repositoryOwner> <repositoryName> [permissions]
```

Example:

```bash
node dist/create-installation-token.js 123456 "-----BEGIN RSA PRIVATE KEY-----..." octocat Hello-World
```

With permissions (multi-line format):

```bash
node dist/create-installation-token.js 123456 "-----BEGIN RSA PRIVATE KEY-----..." octocat Hello-World "contents:write
pull_requests:read
issues:write"
```

#### Using Environment Variables

Set the following environment variables:

- `GITHUB_APP_ID`: Your GitHub App ID
- `GITHUB_PRIVATE_KEY`: Your GitHub App private key
- `GITHUB_REPOSITORY_OWNER`: The owner (user or organization) of the repository
- `GITHUB_REPOSITORY_NAME`: The name of the repository
- `GITHUB_PERMISSIONS` (optional): A multi-line string specifying permissions in the format `permission:level`, one per line (e.g., `contents:write`)

Then run:

```bash
npm start
```

Or:

```bash
node dist/create-installation-token.js
```

### Permissions

The optional `permissions` parameter allows you to specify the permissions for the generated installation access token. Permissions are specified in the format `permission:level`, with one permission per line.

**Supported permission levels:**
- `read`: Read-only access
- `write`: Read and write access

**Example permissions:**
- `contents:write` - Read and write access to repository contents
- `pull_requests:read` - Read-only access to pull requests
- `issues:write` - Read and write access to issues
- `metadata:read` - Read access to repository metadata

For a complete list of available permissions, see [GitHub App Permissions](https://docs.github.com/en/rest/overview/permissions-required-for-github-apps).

**Note:** The GitHub App must already have these permissions configured. This parameter restricts the token to a subset of the app's permissions, it cannot grant permissions the app doesn't have.

### Output

The script outputs the installation access token to stdout. If an error occurs, it will be printed to stderr and the script will exit with code 1.

### Development

- Build the project: `npm run build` (uses esbuild to create a bundled, self-contained script)
- Run the script: `npm start`
