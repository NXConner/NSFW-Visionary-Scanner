Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step([string]$Message) {
  Write-Host ""
  Write-Host $Message
  Write-Host ""
}

function Assert-CommandExists([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "$Name is required but was not found in PATH."
  }
}

try {
  $RootDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
  Set-Location $RootDir

  Write-Step "Installing project dependencies..."

  Assert-CommandExists "node"
  Assert-CommandExists "npm"

  $HasLock = Test-Path (Join-Path $RootDir "package-lock.json")
  $HasNodeModules = Test-Path (Join-Path $RootDir "node_modules")

  if ($HasLock -and -not $HasNodeModules) {
    npm ci
  }
  else {
    npm install
  }

  Write-Host ""
  Write-Host "Dependencies installed. Next steps:"
  Write-Host "  1. Copy .env.example to .env and set real values."
  Write-Host "  2. Run: npm run lint"
  Write-Host "  3. Run: npm run format:write"
  Write-Host ""
}
catch {
  Write-Error $_
  exit 1
}

