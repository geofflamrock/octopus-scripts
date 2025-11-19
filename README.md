# octopus-scripts

Scripts to do things in Octopus

## GitHub App Installation Access Token Generator

This project provides scripts to create an installation access token for a GitHub App. The scripts automatically look up the installation ID for a given repository. Two implementations are available:

1. **Node.js/TypeScript version** - Uses the `@octokit/auth-app` library
2. **.NET 10 version** - Uses a file-based C# app with JWT authentication

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

A PowerShell wrapper script is provided for convenience:

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

---

## .NET 10 File-Based App Version

A .NET 10 file-based app implementation is also available that provides the same functionality without requiring a Node.js environment.

### Prerequisites

- .NET 10 SDK or higher

### Usage

The .NET version is a single C# file that can be run directly using `dotnet run`. It accepts GitHub App credentials either through command-line arguments or environment variables.

#### Using PowerShell (Windows)

A PowerShell wrapper script is provided for convenience:

```powershell
.\scripts\create-installation-token-dotnet.ps1 -AppId <appId> -PrivateKey <privateKey> -RepositoryOwner <owner> -RepositoryName <name> [-Permissions <permissions>]
```

Example:

```powershell
.\scripts\create-installation-token-dotnet.ps1 -AppId "123456" -PrivateKey "-----BEGIN RSA PRIVATE KEY-----..." -RepositoryOwner "octocat" -RepositoryName "Hello-World"
```

With permissions:

```powershell
.\scripts\create-installation-token-dotnet.ps1 -AppId "123456" -PrivateKey "-----BEGIN RSA PRIVATE KEY-----..." -RepositoryOwner "octocat" -RepositoryName "Hello-World" -Permissions "contents:write`npull_requests:read"
```

**Octopus Deploy Integration**: When running inside Octopus Deploy, the script automatically exports the generated token as a sensitive output variable named `token` using Octopus service messages.

#### Using Command-Line Arguments

```bash
dotnet run src/create-installation-token.cs <appId> <privateKey> <repositoryOwner> <repositoryName> [permissions]
```

Example:

```bash
dotnet run src/create-installation-token.cs 123456 "-----BEGIN RSA PRIVATE KEY-----..." octocat Hello-World
```

With permissions (multi-line format):

```bash
dotnet run src/create-installation-token.cs 123456 "-----BEGIN RSA PRIVATE KEY-----..." octocat Hello-World "contents:write
pull_requests:read
issues:write"
```

#### Using Environment Variables

Set the following environment variables:

- `GITHUB_APP_ID`: Your GitHub App ID
- `GITHUB_PRIVATE_KEY`: Your GitHub App private key (can also be a file path to a .pem file)
- `GITHUB_REPOSITORY_OWNER`: The owner (user or organization) of the repository
- `GITHUB_REPOSITORY_NAME`: The name of the repository
- `GITHUB_PERMISSIONS` (optional): A multi-line string specifying permissions in the format `permission:level`, one per line

Then run:

```bash
dotnet run src/create-installation-token.cs
```

### File-Based Private Key

The .NET version supports loading the private key from a file. Simply provide the path to a `.pem` file containing the private key:

```bash
dotnet run src/create-installation-token.cs 123456 /path/to/private-key.pem octocat Hello-World
```

This is useful for keeping sensitive keys in secure file storage rather than passing them as command-line arguments.

### How It Works

The .NET version uses .NET 10's file-based app feature, which allows running a single `.cs` file without requiring a project file. The script:

1. Loads the private key (from file or command-line argument)
2. Generates a JSON Web Token (JWT) for GitHub App authentication
3. Looks up the installation ID for the specified repository
4. Creates an installation access token with optional permissions
5. Outputs the token as an Octopus variable (or to stdout)

The script automatically restores required NuGet packages (`System.IdentityModel.Tokens.Jwt` and `Microsoft.IdentityModel.Tokens`) using package directives at the top of the file.
