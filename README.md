# octopus-scripts
Scripts to do things in Octopus

## GitHub App Installation Access Token Generator

This Node.js TypeScript project provides a script to create an installation access token for a GitHub App using the `@octokit/auth-app` library. The script automatically looks up the installation ID for a given repository.

### Prerequisites

- Node.js (v20 or higher)

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

A PowerShell wrapper script is provided for convenience:

```powershell
.\scripts\create-installation-token.ps1 -AppId <appId> -PrivateKey <privateKey> -ClientId <clientId> -ClientSecret <clientSecret> -RepositoryOwner <owner> -RepositoryName <name>
```

Example:
```powershell
.\scripts\create-installation-token.ps1 -AppId "123456" -PrivateKey "-----BEGIN RSA PRIVATE KEY-----..." -ClientId "Iv1.abc123" -ClientSecret "secret123" -RepositoryOwner "octocat" -RepositoryName "Hello-World"
```

**Octopus Deploy Integration**: When running inside Octopus Deploy, the PowerShell script automatically exports the generated token as a sensitive output variable named `token` using the `Set-OctopusVariable` function. This allows the token to be used in subsequent deployment steps.

#### Using Command-Line Arguments

```bash
node dist/create-installation-token.js <appId> <privateKey> <clientId> <clientSecret> <repositoryOwner> <repositoryName>
```

Example:
```bash
node dist/create-installation-token.js 123456 "-----BEGIN RSA PRIVATE KEY-----..." Iv1.abc123 secret123 octocat Hello-World
```

#### Using Environment Variables

Set the following environment variables:
- `GITHUB_APP_ID`: Your GitHub App ID
- `GITHUB_PRIVATE_KEY`: Your GitHub App private key
- `GITHUB_CLIENT_ID`: Your GitHub App client ID
- `GITHUB_CLIENT_SECRET`: Your GitHub App client secret
- `GITHUB_REPOSITORY_OWNER`: The owner (user or organization) of the repository
- `GITHUB_REPOSITORY_NAME`: The name of the repository

Then run:
```bash
npm start
```

Or:
```bash
node dist/create-installation-token.js
```

### Output

The script outputs the installation access token to stdout. If an error occurs, it will be printed to stderr and the script will exit with code 1.

### Development

- Build the project: `npm run build` (uses esbuild to create a bundled, self-contained script)
- Run the script: `npm start`

