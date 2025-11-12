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

# Get the script's directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Path to the generic run-script.ps1
$runScript = Join-Path $scriptDir "run-script.ps1"

# Call the generic script runner with the create-installation-token.js script and arguments
if ($Permissions) {
    & $runScript "dist\create-installation-token.js" $AppId $PrivateKey $RepositoryOwner $RepositoryName $Permissions
}
else {
    & $runScript "dist\create-installation-token.js" $AppId $PrivateKey $RepositoryOwner $RepositoryName
}

# Check if the script executed successfully
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create installation access token"
    exit $LASTEXITCODE
}
