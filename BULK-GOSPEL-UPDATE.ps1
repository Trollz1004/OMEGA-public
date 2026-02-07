# Gospel V1.4.1 SURVIVAL MODE - Bulk Update Script
# Run this to update remaining marketing files
# Created: 2026-01-14 by Claude Opus 4.5

$marketingPath = "C:\AntiAI_DAO_Master_Launch\AiCollabForTheKids\marketing"

Write-Host "Gospel V1.4.1 SURVIVAL MODE - Bulk Update" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Get all .md files
$files = Get-ChildItem -Path $marketingPath -Filter "*.md" -Recurse

$totalFiles = $files.Count
$updatedFiles = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue

    if ($null -eq $content) { continue }

    $originalContent = $content

    # Replace Gospel V1.3 -> Gospel V1.4.1 SURVIVAL MODE
    $content = $content -replace "Gospel V1\.3", "Gospel V1.4.1 SURVIVAL MODE"
    $content = $content -replace "Gospel v1\.3", "Gospel V1.4.1 SURVIVAL MODE"

    # Replace Gospel V2.0 -> Gospel V1.4.1 SURVIVAL MODE
    $content = $content -replace "Gospel V2\.0", "Gospel V1.4.1 SURVIVAL MODE"
    $content = $content -replace "Gospel v2\.0", "Gospel V1.4.1 SURVIVAL MODE"

    # Replace 60/30/10 -> 100% to verified pediatric charities
    $content = $content -replace "60/30/10", "100% to verified pediatric charities"
    $content = $content -replace "60%/30%/10%", "100% to verified pediatric charities"

    # Replace St. Jude -> verified pediatric charities
    $content = $content -replace "St\. Jude", "verified pediatric charities"
    $content = $content -replace "St\.Jude", "verified pediatric charities"

    # Replace Shriners -> verified pediatric charities
    $content = $content -replace "Shriners Children's Hospital", "verified pediatric charities"
    $content = $content -replace "Shriners", "verified pediatric charities"

    # Only write if changes were made
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $updatedFiles++
        Write-Host "Updated: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Complete!" -ForegroundColor Green
Write-Host "Files scanned: $totalFiles" -ForegroundColor Yellow
Write-Host "Files updated: $updatedFiles" -ForegroundColor Yellow
Write-Host ""
Write-Host "Gospel V1.4.1 SURVIVAL MODE - FOR THE KIDS" -ForegroundColor Magenta
