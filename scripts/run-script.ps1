param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$ScriptPath,

    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$ScriptArguments
)

# Get the script's directory and navigate to the repository root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir

# Resolve the script path relative to the repository root
$fullScriptPath = Join-Path $repoRoot $ScriptPath

# Check if the Node.js script exists
if (-not (Test-Path $fullScriptPath)) {
    Write-Error "Node.js script not found at: $fullScriptPath"
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

# Run the Node.js script with all provided arguments
if ($ScriptArguments) {
    node $fullScriptPath @ScriptArguments
}
else {
    node $fullScriptPath
}

# Check if the script executed successfully
if ($LASTEXITCODE -ne 0) {
    Write-Error "Script execution failed with exit code: $LASTEXITCODE"
    exit $LASTEXITCODE
}
