$ErrorActionPreference = "Stop"
$src = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $src "HANDOFF.md"))) {
  $src = "C:\Users\Jared Visser\Documents\HAMMOQ\Hammoq AI Build\store-thru-listing"
}
$zip = "C:\Users\Jared Visser\Desktop\store-thru-listing-handoff-20260804.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }

$gitSize = (Get-ChildItem "$src\.git" -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
Write-Host ("git_MB={0:N1}" -f ($gitSize/1MB))

$stage = Join-Path $env:TEMP "store-thru-listing-handoff-stage"
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage | Out-Null

& robocopy $src $stage /E /NFL /NDL /NJH /NJS /nc /ns /np /XD node_modules .next .wip-parallel .agents /XF .env .env.local
if ($LASTEXITCODE -ge 8) { throw "robocopy failed: $LASTEXITCODE" }
$global:LASTEXITCODE = 0

Get-ChildItem $stage -Force -Recurse -File -Filter ".env*" | Where-Object { $_.Name -ne ".env.example" } | ForEach-Object {
  Write-Host "Removing: $($_.FullName)"
  Remove-Item $_.FullName -Force
}

$includeGit = $gitSize -lt 80MB
Write-Host "include_git=$includeGit"
if (-not $includeGit -and (Test-Path "$stage\.git")) { Remove-Item "$stage\.git" -Recurse -Force }

Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $zip -CompressionLevel Optimal -Force
$zipInfo = Get-Item $zip
Write-Host ("zip_path={0}" -f $zipInfo.FullName)
Write-Host ("zip_MB={0:N1}" -f ($zipInfo.Length/1MB))

Add-Type -AssemblyName System.IO.Compression.FileSystem
$z = [System.IO.Compression.ZipFile]::OpenRead($zip)
try {
  $bad = $z.Entries | Where-Object { $_.FullName -match '(^|/|\\)\.env(?!\.example)|(^|/|\\)node_modules(/|\\)|(^|/|\\)\.next(/|\\)' }
  if ($bad) { Write-Host "WARN bad entries:"; $bad | Select-Object -First 15 -ExpandProperty FullName } else { Write-Host "OK: scrub clean" }
  $hasGit = ($z.Entries | Where-Object { $_.FullName -match '\.git/' } | Select-Object -First 1) -ne $null
  $hasHandoff = ($z.Entries | Where-Object { $_.FullName -match 'HANDOFF\.md$' } | Select-Object -First 1) -ne $null
  Write-Host "has_git=$hasGit has_handoff=$hasHandoff entries=$($z.Entries.Count)"
} finally { $z.Dispose() }

Remove-Item $stage -Recurse -Force
Write-Host "DONE"
