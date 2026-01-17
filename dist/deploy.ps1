$env:CLOUDFLARE_API_TOKEN = 'HFRLaBoWL4qJDQqZQsbQsZuES7n8jF9qw19c4edP'
$env:CLOUDFLARE_ACCOUNT_ID = '516a3a855f44f5ad8453636d163ae25d'

Write-Host "=== CLOUDFLARE PAGES DEPLOYMENT ===" -ForegroundColor Cyan
Write-Host "Project: youandinotai" -ForegroundColor Yellow
Write-Host "Directory: $PWD" -ForegroundColor Yellow
Write-Host ""

Get-ChildItem -Filter "*.html" | ForEach-Object {
    Write-Host "  $($_.Name)" -ForegroundColor Green
}

Write-Host ""
npx wrangler pages deploy . --project-name=youandinotai --commit-dirty=true
