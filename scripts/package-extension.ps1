$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$source = Join-Path $projectRoot 'extension'
$manifest = Get-Content -LiteralPath (Join-Path $source 'manifest.json') -Raw | ConvertFrom-Json
$archivePath = Join-Path $projectRoot "site/downloads/CaptureAsk-extension-v$($manifest.version)-full-screen.zip"
Compress-Archive -Path (Join-Path $source '*') -DestinationPath $archivePath -CompressionLevel Optimal -Force
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead($archivePath)
try {
    foreach ($entry in $archive.Entries) {
        $stream = $entry.Open()
        $memory = [System.IO.MemoryStream]::new()
        try {
            $stream.CopyTo($memory)
            $zipHash = [Convert]::ToHexString([System.Security.Cryptography.SHA256]::HashData($memory.ToArray()))
            $sourceHash = (Get-FileHash -LiteralPath (Join-Path $source $entry.FullName) -Algorithm SHA256).Hash
            if ($zipHash -ne $sourceHash) { throw "ZIP entry differs from source: $($entry.FullName)" }
        } finally { $stream.Dispose(); $memory.Dispose() }
    }
    Write-Output "PASS: all $($archive.Entries.Count) ZIP entries match v$($manifest.version) source."
} finally { $archive.Dispose() }
