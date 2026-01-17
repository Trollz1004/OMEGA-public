# Set Cloudflare credentials
$env:CLOUDFLARE_API_TOKEN = 'HFRLaBoWL4qJDQqZQsbQsZuES7n8jF9qw19c4edP'
$env:CLOUDFLARE_ACCOUNT_ID = '516a3a855f44f5ad8453636d163ae25d'

Write-Host "Deploying to Cloudflare Pages..." -ForegroundColor Cyan
Write-Host "Project: youandinotai" -ForegroundColor Yellow
Write-Host "Directory: $PWD" -ForegroundColor Yellow

# List files being deployed (excluding node_modules)
Write-Host "`nFiles to deploy:" -ForegroundColor Green
Get-ChildItem -Path . -Filter "*.html" | ForEach-Object { Write-Host "  $($_.Name)" }

# Run wrangler deploy
npx wrangler pages deploy . --project-name=youandinotai --commit-dirty=true

Write-Host "`nDeployment complete!" -ForegroundColor Green
