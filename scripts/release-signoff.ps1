# Release Execution Signoff Utility
# Tracks external/manual release steps with evidence and validation.

param(
    [ValidateSet("init", "record", "status", "validate")]
    [string]$Action = "status",

    [ValidateSet("staging", "production")]
    [string]$Environment = "staging",

    [string]$Session = "",
    [string]$StepId = "",

    [ValidateSet("pending", "pass", "fail", "blocked", "warning", "na")]
    [string]$Result = "pass",

    [string]$Evidence = "",
    [string]$Notes = "",
    [string]$Operator = "",

    [bool]$IncludePayments = $true,
    [bool]$IncludePush = $true,
    [bool]$IncludeNSFW = $true,
    [switch]$SkipMobile,

    [switch]$Force
)

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

if ([string]::IsNullOrWhiteSpace($Operator)) {
    $Operator = if ($env:USER) { $env:USER } elseif ($env:USERNAME) { $env:USERNAME } else { "unknown" }
}

$stepsConfigPath = Join-Path $repoRoot "config/release/release-signoff.steps.json"

function Ensure-FileExists {
    param([string]$PathToCheck, [string]$ErrorMessage)
    if (-not (Test-Path $PathToCheck)) {
        throw $ErrorMessage
    }
}

function Read-JsonFile {
    param([string]$PathToRead)
    Ensure-FileExists -PathToCheck $PathToRead -ErrorMessage "File not found: $PathToRead"
    $raw = Get-Content -Path $PathToRead -Raw
    return $raw | ConvertFrom-Json -AsHashtable
}

function Write-JsonFile {
    param(
        [string]$PathToWrite,
        [hashtable]$Payload
    )
    $json = $Payload | ConvertTo-Json -Depth 30
    Set-Content -Path $PathToWrite -Value ($json + "`n")
}

function New-SessionId {
    return (Get-Date).ToString("yyyyMMdd-HHmmss")
}

function Resolve-SessionArtifacts {
    param([string]$EnvName, [string]$SessionId)
    $baseDir = Join-Path $repoRoot "artifacts/release-signoff/$EnvName"
    $sessionDir = Join-Path $baseDir $SessionId
    $stateFile = Join-Path $sessionDir "state.json"
    $markdownFile = Join-Path $sessionDir "SIGNOFF.md"
    return @{
        BaseDir = $baseDir
        SessionDir = $sessionDir
        StateFile = $stateFile
        MarkdownFile = $markdownFile
    }
}

function Step-Included {
    param(
        [hashtable]$Step,
        [bool]$UsePayments,
        [bool]$UsePush,
        [bool]$UseNSFW,
        [bool]$UseMobile
    )

    $scope = [string]$Step.scope
    switch ($scope) {
        "core" { return $true }
        "payments" { return $UsePayments }
        "push" { return $UsePush }
        "nsfw" { return $UseNSFW }
        "mobile" { return $UseMobile }
        default { return $true }
    }
}

function Build-StatusIcon {
    param([string]$Status)
    switch ($Status) {
        "pass" { return "✅" }
        "fail" { return "❌" }
        "blocked" { return "⛔" }
        "warning" { return "⚠️" }
        "na" { return "➖" }
        default { return "⬜" }
    }
}

function Get-Counts {
    param([hashtable]$State)
    $counts = @{
        pending = 0
        pass = 0
        fail = 0
        blocked = 0
        warning = 0
        na = 0
    }
    foreach ($step in @($State.steps)) {
        $status = [string]$step.status
        if (-not $counts.ContainsKey($status)) {
            $counts[$status] = 0
        }
        $counts[$status]++
    }
    return $counts
}

function Get-RequiredIncomplete {
    param([hashtable]$State)
    return @($State.steps | Where-Object { $_.required -eq $true -and $_.status -ne "pass" })
}

function Write-SignoffMarkdown {
    param(
        [hashtable]$State,
        [string]$TargetPath
    )

    $counts = Get-Counts -State $State
    $requiredIncomplete = Get-RequiredIncomplete -State $State

    $lines = @()
    $lines += "# Release Execution Signoff"
    $lines += ""
    $lines += "- **Session**: $($State.session)"
    $lines += "- **Environment**: $($State.environment)"
    $lines += "- **Created**: $($State.createdAt)"
    $lines += "- **Updated**: $($State.updatedAt)"
    $lines += "- **Operator**: $($State.operator)"
    $lines += ""
    $lines += "## Summary"
    $lines += ""
    $lines += "- Pending: $($counts.pending)"
    $lines += "- Pass: $($counts.pass)"
    $lines += "- Fail: $($counts.fail)"
    $lines += "- Blocked: $($counts.blocked)"
    $lines += "- Warning: $($counts.warning)"
    $lines += "- N/A: $($counts.na)"
    $lines += "- Required steps incomplete: $($requiredIncomplete.Count)"
    $lines += ""
    $lines += "## Step Signoff Table"
    $lines += ""
    $lines += "| Step ID | Phase | Scope | Required | Status | Last Updated | Evidence | Notes |"
    $lines += "| --- | --- | --- | --- | --- | --- | --- | --- |"

    foreach ($step in @($State.steps)) {
        $status = [string]$step.status
        $icon = Build-StatusIcon -Status $status
        $requiredLabel = if ($step.required -eq $true) { "yes" } else { "no" }
        $lastUpdated = if ($step.lastUpdated) { [string]$step.lastUpdated } else { "-" }
        $evidenceText = if ($step.evidence) { [string]$step.evidence } else { "-" }
        $notesText = if ($step.notes) { [string]$step.notes } else { "-" }
        $lines += "| $($step.id) | $($step.phase) | $($step.scope) | $requiredLabel | $icon $status | $lastUpdated | $evidenceText | $notesText |"
    }

    $lines += ""
    $lines += "## Event History"
    $lines += ""
    foreach ($step in @($State.steps)) {
        if (@($step.history).Count -eq 0) {
            continue
        }
        $lines += "### $($step.id)"
        foreach ($entry in @($step.history)) {
            $lines += "- $($entry.timestamp) | $($entry.operator) | $($entry.result) | evidence: $($entry.evidence) | notes: $($entry.notes)"
        }
        $lines += ""
    }

    Set-Content -Path $TargetPath -Value (($lines -join "`n") + "`n")
}

function Load-State {
    param([string]$StatePath)
    return Read-JsonFile -PathToRead $StatePath
}

function Save-State {
    param(
        [string]$StatePath,
        [string]$MarkdownPath,
        [hashtable]$State
    )
    $State.updatedAt = (Get-Date).ToString("o")
    Write-JsonFile -PathToWrite $StatePath -Payload $State
    Write-SignoffMarkdown -State $State -TargetPath $MarkdownPath
}

function Find-StepIndex {
    param(
        [hashtable]$State,
        [string]$TargetStepId
    )
    for ($i = 0; $i -lt @($State.steps).Count; $i++) {
        if ([string]$State.steps[$i].id -eq $TargetStepId) {
            return $i
        }
    }
    return -1
}

if ($Action -eq "init") {
    $resolvedSession = if ([string]::IsNullOrWhiteSpace($Session)) { New-SessionId } else { $Session }
    $paths = Resolve-SessionArtifacts -EnvName $Environment -SessionId $resolvedSession
    $useMobile = -not $SkipMobile

    if ((Test-Path $paths.StateFile) -and (-not $Force)) {
        throw "Session already exists: $($paths.StateFile). Use -Force to overwrite."
    }

    New-Item -ItemType Directory -Path $paths.SessionDir -Force | Out-Null
    $config = Read-JsonFile -PathToRead $stepsConfigPath
    $selectedSteps = @()
    foreach ($step in @($config.steps)) {
        if (Step-Included -Step $step -UsePayments:$IncludePayments -UsePush:$IncludePush -UseNSFW:$IncludeNSFW -UseMobile:$useMobile) {
            $selectedSteps += $step
        }
    }

    $state = @{
        schemaVersion = 1
        session = $resolvedSession
        environment = $Environment
        operator = $Operator
        createdAt = (Get-Date).ToString("o")
        updatedAt = (Get-Date).ToString("o")
        options = @{
            includePayments = $IncludePayments
            includePush = $IncludePush
            includeNSFW = $IncludeNSFW
            includeMobile = $useMobile
        }
        steps = @()
    }

    foreach ($step in $selectedSteps) {
        $state.steps += @{
            id = [string]$step.id
            phase = [string]$step.phase
            scope = [string]$step.scope
            title = [string]$step.title
            required = [bool]$step.required
            status = "pending"
            lastUpdated = ""
            evidence = ""
            notes = ""
            history = @()
        }
    }

    Save-State -StatePath $paths.StateFile -MarkdownPath $paths.MarkdownFile -State $state
    Write-Host "Initialized signoff session: $resolvedSession" -ForegroundColor Green
    Write-Host "State file: $($paths.StateFile)"
    Write-Host "Markdown report: $($paths.MarkdownFile)"
    exit 0
}

if ([string]::IsNullOrWhiteSpace($Session)) {
    throw "Session is required for Action '$Action'."
}

$sessionPaths = Resolve-SessionArtifacts -EnvName $Environment -SessionId $Session
$state = Load-State -StatePath $sessionPaths.StateFile

switch ($Action) {
    "record" {
        if ([string]::IsNullOrWhiteSpace($StepId)) {
            throw "StepId is required for Action 'record'."
        }
        $index = Find-StepIndex -State $state -TargetStepId $StepId
        if ($index -lt 0) {
            $available = @($state.steps | ForEach-Object { $_.id }) -join ", "
            throw "Unknown StepId '$StepId'. Available: $available"
        }

        $now = (Get-Date).ToString("o")
        $entry = @{
            timestamp = $now
            operator = $Operator
            result = $Result
            evidence = $Evidence
            notes = $Notes
        }

        $step = $state.steps[$index]
        $history = @($step.history)
        $history += $entry
        $step.history = $history
        $step.status = $Result
        $step.lastUpdated = $now
        if (-not [string]::IsNullOrWhiteSpace($Evidence)) { $step.evidence = $Evidence }
        if (-not [string]::IsNullOrWhiteSpace($Notes)) { $step.notes = $Notes }
        $state.steps[$index] = $step

        Save-State -StatePath $sessionPaths.StateFile -MarkdownPath $sessionPaths.MarkdownFile -State $state
        Write-Host "Recorded $Result for $StepId" -ForegroundColor Green
        Write-Host "Updated report: $($sessionPaths.MarkdownFile)"
        exit 0
    }

    "status" {
        $counts = Get-Counts -State $state
        $requiredIncomplete = Get-RequiredIncomplete -State $state

        Write-Host "Session: $($state.session) ($($state.environment))" -ForegroundColor Cyan
        Write-Host "Updated: $($state.updatedAt)"
        Write-Host "Pending: $($counts.pending) | Pass: $($counts.pass) | Fail: $($counts.fail) | Blocked: $($counts.blocked) | Warning: $($counts.warning) | N/A: $($counts.na)"
        Write-Host "Required steps incomplete: $($requiredIncomplete.Count)"
        if ($requiredIncomplete.Count -gt 0) {
            Write-Host ""
            Write-Host "Required incomplete steps:" -ForegroundColor Yellow
            foreach ($step in $requiredIncomplete) {
                Write-Host " - $($step.id) [$($step.status)] $($step.title)"
            }
        }

        Save-State -StatePath $sessionPaths.StateFile -MarkdownPath $sessionPaths.MarkdownFile -State $state
        Write-Host ""
        Write-Host "Report: $($sessionPaths.MarkdownFile)"
        exit 0
    }

    "validate" {
        $requiredIncomplete = Get-RequiredIncomplete -State $state
        Save-State -StatePath $sessionPaths.StateFile -MarkdownPath $sessionPaths.MarkdownFile -State $state
        if ($requiredIncomplete.Count -eq 0) {
            Write-Host "Validation passed: all required steps are signed off." -ForegroundColor Green
            exit 0
        }

        Write-Host "Validation failed: required steps incomplete." -ForegroundColor Red
        foreach ($step in $requiredIncomplete) {
            Write-Host " - $($step.id) [$($step.status)] $($step.title)"
        }
        exit 1
    }
}

throw "Unhandled action: $Action"
