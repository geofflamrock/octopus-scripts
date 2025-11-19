#:package System.IdentityModel.Tokens.Jwt@8.3.1
#:package Microsoft.IdentityModel.Tokens@8.3.1

using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.IdentityModel.Tokens;

// Configuration from environment variables or command line arguments
var appId = Environment.GetEnvironmentVariable("GITHUB_APP_ID") ?? (args.Length > 0 ? args[0] : null);
var privateKeyInput = Environment.GetEnvironmentVariable("GITHUB_PRIVATE_KEY") ?? (args.Length > 1 ? args[1] : null);
var repositoryOwner = Environment.GetEnvironmentVariable("GITHUB_REPOSITORY_OWNER") ?? (args.Length > 2 ? args[2] : null);
var repositoryName = Environment.GetEnvironmentVariable("GITHUB_REPOSITORY_NAME") ?? (args.Length > 3 ? args[3] : null);
var permissionsInput = Environment.GetEnvironmentVariable("GITHUB_PERMISSIONS") ?? (args.Length > 4 ? args[4] : null);

// Validate required parameters
if (string.IsNullOrWhiteSpace(appId) || string.IsNullOrWhiteSpace(privateKeyInput) ||
    string.IsNullOrWhiteSpace(repositoryOwner) || string.IsNullOrWhiteSpace(repositoryName))
{
    Console.Error.WriteLine("Error: Missing required parameters");
    Console.Error.WriteLine();
    Console.Error.WriteLine("Usage:");
    Console.Error.WriteLine("  dotnet run create-installation-token.cs <appId> <privateKey> <repositoryOwner> <repositoryName> [permissions]");
    Console.Error.WriteLine();
    Console.Error.WriteLine("Or set environment variables:");
    Console.Error.WriteLine("  GITHUB_APP_ID");
    Console.Error.WriteLine("  GITHUB_PRIVATE_KEY");
    Console.Error.WriteLine("  GITHUB_REPOSITORY_OWNER");
    Console.Error.WriteLine("  GITHUB_REPOSITORY_NAME");
    Console.Error.WriteLine("  GITHUB_PERMISSIONS (optional, format: 'permission:level' per line)");
    Environment.Exit(1);
    return;
}

try
{
    // Load private key (from file if path provided, otherwise use as content)
    string privateKey;
    if (File.Exists(privateKeyInput))
    {
        privateKey = await File.ReadAllTextAsync(privateKeyInput);
        WriteInfo($"Loaded private key from file: {privateKeyInput}");
    }
    else
    {
        privateKey = privateKeyInput;
    }

    // Validate private key format
    if (!privateKey.Contains("BEGIN") || !privateKey.Contains("PRIVATE KEY"))
    {
        throw new Exception("Invalid private key format. Expected a PEM-formatted private key.");
    }

    // Create installation access token
    var token = await CreateInstallationAccessToken(appId, privateKey, repositoryOwner, repositoryName, permissionsInput);

    // Set the token as an Octopus output variable (sensitive)
    SetOutputVariable("token", token, sensitive: true);
}
catch (Exception ex)
{
    WriteError($"Error creating installation access token: {ex.Message}");
    Environment.Exit(1);
}

// Functions

static string GenerateGitHubJwt(string privateKey, string appId)
{
    using var rsa = RSA.Create();
    rsa.ImportFromPem(privateKey);
    
    var signingCredentials = new SigningCredentials(
        new RsaSecurityKey(rsa), 
        SecurityAlgorithms.RsaSha256
    );

    var now = DateTimeOffset.UtcNow;
    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Issuer = appId,
        IssuedAt = now.UtcDateTime,
        Expires = now.AddMinutes(10).UtcDateTime,
        SigningCredentials = signingCredentials
    };

    var tokenHandler = new JwtSecurityTokenHandler();
    var token = tokenHandler.CreateToken(tokenDescriptor);
    return tokenHandler.WriteToken(token);
}

static Dictionary<string, string>? ParsePermissions(string? permissionsInput)
{
    if (string.IsNullOrWhiteSpace(permissionsInput))
    {
        return null;
    }

    var permissions = new Dictionary<string, string>();
    var lines = permissionsInput.Trim().Split('\n');

    foreach (var line in lines)
    {
        var trimmedLine = line.Trim();
        if (string.IsNullOrWhiteSpace(trimmedLine))
        {
            continue; // Skip empty lines
        }

        var parts = trimmedLine.Split(':');
        if (parts.Length == 2)
        {
            var permission = parts[0].Trim();
            var level = parts[1].Trim();
            if (!string.IsNullOrWhiteSpace(permission) && !string.IsNullOrWhiteSpace(level))
            {
                permissions[permission] = level;
            }
        }
    }

    return permissions.Count > 0 ? permissions : null;
}

static async Task<string> CreateInstallationAccessToken(
    string appId, 
    string privateKey, 
    string repositoryOwner, 
    string repositoryName,
    string? permissionsInput)
{
    // Generate JWT for app authentication
    var jwt = GenerateGitHubJwt(privateKey, appId);

    using var httpClient = new HttpClient();
    httpClient.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("octopus-scripts", "1.0"));
    httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));
    httpClient.DefaultRequestHeaders.Add("X-GitHub-Api-Version", "2022-11-28");

    // Get installation ID for the repository
    httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwt);
    
    var installationUrl = $"https://api.github.com/repos/{repositoryOwner}/{repositoryName}/installation";
    var installationResponse = await httpClient.GetAsync(installationUrl);
    
    if (!installationResponse.IsSuccessStatusCode)
    {
        var errorContent = await installationResponse.Content.ReadAsStringAsync();
        throw new Exception($"Failed to find installation for repository {repositoryOwner}/{repositoryName}: {installationResponse.StatusCode} - {errorContent}");
    }

    var installation = await installationResponse.Content.ReadFromJsonAsync<InstallationResponse>();
    if (installation == null)
    {
        throw new Exception($"Failed to deserialize installation response for repository {repositoryOwner}/{repositoryName}");
    }

    WriteInfo($"Found installation ID: {installation.Id}");

    // Create installation access token
    var tokenUrl = $"https://api.github.com/app/installations/{installation.Id}/access_tokens";
    
    var permissions = ParsePermissions(permissionsInput);
    var tokenRequest = new CreateTokenRequest
    {
        Permissions = permissions
    };

    var tokenResponse = await httpClient.PostAsJsonAsync(tokenUrl, tokenRequest);
    
    if (!tokenResponse.IsSuccessStatusCode)
    {
        var errorContent = await tokenResponse.Content.ReadAsStringAsync();
        throw new Exception($"Failed to create installation access token: {tokenResponse.StatusCode} - {errorContent}");
    }

    var tokenData = await tokenResponse.Content.ReadFromJsonAsync<TokenResponse>();
    if (tokenData == null || string.IsNullOrWhiteSpace(tokenData.Token))
    {
        throw new Exception("Failed to deserialize token response or token is empty");
    }

    // Log the installation authentication details
    WriteInfo("GitHub installation access token created successfully:");
    WriteInfo($"  Expires at: {tokenData.ExpiresAt}");
    WriteInfo($"  Permissions: {JsonSerializer.Serialize(tokenData.Permissions, new JsonSerializerOptions { WriteIndented = true })}");
    WriteInfo($"  Repository selection: {tokenData.RepositorySelection}");
    if (tokenData.Repositories != null && tokenData.Repositories.Length > 0)
    {
        WriteInfo($"  Repository names: {string.Join(", ", tokenData.Repositories.Select(r => r.Name))}");
    }

    return tokenData.Token;
}

static void WriteInfo(string message)
{
    Console.WriteLine($"##octopus[stdout-default]");
    Console.WriteLine(message);
}

static void WriteError(string message)
{
    Console.Error.WriteLine($"##octopus[stderr-error]");
    Console.Error.WriteLine(message);
}

static void SetOutputVariable(string name, string value, bool sensitive = false)
{
    if (sensitive)
    {
        Console.WriteLine($"##octopus[setVariable name={name} sensitive=True]{value}");
    }
    else
    {
        Console.WriteLine($"##octopus[setVariable name={name}]{value}");
    }
}

// DTOs for JSON serialization
record InstallationResponse(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("app_id")] int AppId,
    [property: JsonPropertyName("target_type")] string TargetType
);

record CreateTokenRequest(
    [property: JsonPropertyName("permissions")] Dictionary<string, string>? Permissions = null
);

record TokenResponse(
    [property: JsonPropertyName("token")] string Token,
    [property: JsonPropertyName("expires_at")] string ExpiresAt,
    [property: JsonPropertyName("permissions")] Dictionary<string, string> Permissions,
    [property: JsonPropertyName("repository_selection")] string RepositorySelection,
    [property: JsonPropertyName("repositories")] Repository[]? Repositories = null
);

record Repository(
    [property: JsonPropertyName("name")] string Name
);
