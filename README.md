# octopus-scripts
Scripts to do things in Octopus

## GitHub App Installation Access Token Generator

This Node.js TypeScript project provides a script to create an installation access token for a GitHub App using the `@octokit/auth-app` library.

### Prerequisites

- Node.js (v20 or higher)
- npm

### Installation

1. Clone this repository
2. Install dependencies:
```bash
npm install
```

3. Build the TypeScript project:
```bash
npm run build
```

### Usage

The script accepts GitHub App credentials either through command-line arguments or environment variables.

#### Using Command-Line Arguments

```bash
node dist/create-installation-token.js <appId> <privateKey> <clientId> <clientSecret> <installationId>
```

Example:
```bash
node dist/create-installation-token.js 123456 "-----BEGIN RSA PRIVATE KEY-----..." Iv1.abc123 secret123 78910
```

#### Using Environment Variables

Set the following environment variables:
- `GITHUB_APP_ID`: Your GitHub App ID
- `GITHUB_PRIVATE_KEY`: Your GitHub App private key
- `GITHUB_CLIENT_ID`: Your GitHub App client ID
- `GITHUB_CLIENT_SECRET`: Your GitHub App client secret
- `GITHUB_INSTALLATION_ID`: The installation ID for your GitHub App

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

- Build the project: `npm run build`
- Run the script: `npm start`

### API

The script also exports the `createInstallationAccessToken` function that can be imported and used in other TypeScript/JavaScript projects:

```typescript
import { createInstallationAccessToken, GitHubAppConfig } from './create-installation-token';

const config: GitHubAppConfig = {
  appId: 'your-app-id',
  privateKey: 'your-private-key',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  installationId: 'your-installation-id'
};

const token = await createInstallationAccessToken(config);
console.log(token);
```

