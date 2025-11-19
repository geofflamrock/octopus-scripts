param(
    [Parameter(Mandatory = $true)]
    [string]$AppId,

    [Parameter(Mandatory = $true)]
    [string]$PrivateKey,

    [Parameter(Mandatory = $true)]
    [string]$RepositoryOwner,

    [Parameter(Mandatory = $true)]
    [string]$RepositoryName,

    [Parameter(Mandatory = $false)]
    [string]$Permissions
)

# Get the script's directory and navigate to the repository root
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptPath

# Path to the .NET C# script
$dotnetScript = Join-Path $repoRoot "src\create-installation-token.cs"

# Check if the .NET C# script exists
if (-not (Test-Path $dotnetScript)) {
    Write-Error ".NET C# script not found at: $dotnetScript"
    exit 1
}

# Check if dotnet is available
try {
    $null = Get-Command dotnet -ErrorAction Stop
}
catch {
    Write-Error ".NET is not installed or not in PATH"
    exit 1
}

# Check .NET version
$dotnetVersion = dotnet --version
if (-not $dotnetVersion.StartsWith("10.")) {
    Write-Warning ".NET 10 is recommended. Current version: $dotnetVersion"
}

dotnet run $dotnetScript $AppId $PrivateKey $RepositoryOwner $RepositoryName $Permissions

# Check if the script executed successfully
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create installation access token"
    exit $LASTEXITCODE
}
