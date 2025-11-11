param(
    [Parameter(Mandatory = $true)]
    [string]$AppId,

    [Parameter(Mandatory = $true)]
    [string]$PrivateKey,

    [Parameter(Mandatory = $true)]
    [string]$RepositoryOwner,

    [Parameter(Mandatory = $true)]
    [string]$RepositoryName
)

# Get the script's directory and navigate to the repository root
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptPath

# Path to the Node.js script
$nodeScript = Join-Path $repoRoot "dist\create-installation-token.js"

# Check if the Node.js script exists
if (-not (Test-Path $nodeScript)) {
    Write-Error "Node.js script not found at: $nodeScript"
    exit 1
}

# Check if node is available
try {
    $null = Get-Command node -ErrorAction Stop
}
catch {
    Write-Error "Node.js is not installed or not in PATH"
    exit 1
}

node $nodeScript $AppId $PrivateKey $RepositoryOwner $RepositoryName

# Check if the script executed successfully
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create installation access token"
    exit $LASTEXITCODE
}
