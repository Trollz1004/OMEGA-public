# BFG Git History Purge - Issue #43
## FOR THE KIDS Platform - Gospel v1.4.1 SURVIVAL MODE

**Generated:** 2026-01-14
**Status:** READY FOR APPROVAL
**Priority:** LOW (Private repos - only Opus/authorized access)

---

## PREREQUISITE CHECKLIST

### 1. Install BFG Repo-Cleaner
BFG is not currently installed. Download from: https://rtyley.github.io/bfg-repo-cleaner/

```powershell
# Option A: Download BFG jar directly
Invoke-WebRequest -Uri "https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar" -OutFile "C:\Tools\bfg.jar"

# Option B: Using Chocolatey (if available)
choco install bfg-repo-cleaner
```

### 2. Verify Java Installation
```powershell
java -version
# Requires Java 8 or higher
```

### 3. Backup Current Repos
```powershell
# Create backup directory
mkdir C:\GitBackups\issue-43-purge

# Clone bare repos for backup
git clone --mirror https://github.com/Ai-Solutions-Store/AiCollabForTheKids.git C:\GitBackups\issue-43-purge\AiCollabForTheKids.git
git clone --mirror https://github.com/Trollz1004/OPUStrustForTheKidsPlatform.git C:\GitBackups\issue-43-purge\OPUStrustForTheKidsPlatform.git
```

---

## SECRET KEYS TO PURGE (KEY NAMES ONLY)

The following environment variable patterns need to be removed from git history:

### HIGH PRIORITY - API Keys & Tokens
| Key Name | Service |
|----------|---------|
| GITHUB_TOKEN | GitHub API |
| SENDGRID_API_KEY | SendGrid Email |
| CLOUDFLARE_API_TOKEN | Cloudflare |
| CLOUDFLARE_API_TOKEN_WORKERS | Cloudflare Workers |
| CLOUDFLARE_API_TOKEN_DNS | Cloudflare DNS |
| CLOUDFLARE_GLOBAL_API_KEY | Cloudflare Global |
| GEMINI_API_KEY | Google Gemini |
| OPENAI_API_KEY | OpenAI |
| XAI_API_KEY | xAI Grok |
| PERPLEXITY_API_KEY | Perplexity |
| AZURE_OPENAI_API_KEY | Azure OpenAI |
| STABILITY_API_KEY | Stability AI |
| REPLICATE_API_TOKEN | Replicate |
| PRINTFUL_API_TOKEN | Printful |
| SQUARE_ACCESS_TOKEN | Square Payments |
| SQUARE_WEBHOOK_SECRET | Square Webhooks |
| TELEGRAM_BOT_TOKEN | Telegram |
| DEV_TO_API_KEY | Dev.to |
| HASHNODE_API_KEY | Hashnode |
| PLAID_SECRET | Plaid IDV |
| TWITTER_API_KEY | Twitter/X |
| TWITTER_API_SECRET | Twitter/X |
| TWITTER_BEARER_TOKEN | Twitter/X |
| TWITTER_ACCESS_TOKEN | Twitter/X |
| TWITTER_ACCESS_TOKEN_SECRET | Twitter/X |

### MEDIUM PRIORITY - Database & Auth
| Key Name | Service |
|----------|---------|
| DATABASE_URL | PostgreSQL Connection |
| POSTGRES_PASSWORD | PostgreSQL |
| JWT_SECRET | JWT Auth |
| SESSION_SECRET | Session Auth |
| API_KEY | Internal API |

### LOWER PRIORITY - Account IDs (Less Sensitive)
| Key Name | Service |
|----------|---------|
| TWILIO_ACCOUNT_SID | Twilio |
| CLOUDFLARE_ACCOUNT_ID | Cloudflare |
| SQUARE_APP_ID | Square |
| SQUARE_LOCATION_ID | Square |

---

## BFG PURGE COMMANDS

### Step 1: Create passwords.txt file
Create a file with the actual secret values to purge (one per line).

```powershell
# Create the purge list file (MANUALLY - DO NOT AUTOMATE)
# File: C:\Tools\bfg-purge-list.txt
# Add each secret VALUE (not key name) on its own line
```

### Step 2: Clone Repos as Bare (Mirror)
```powershell
# Repo 1: AiCollabForTheKids
git clone --mirror https://github.com/Ai-Solutions-Store/AiCollabForTheKids.git C:\GitPurge\AiCollabForTheKids.git

# Repo 2: OPUStrustForTheKidsPlatform
git clone --mirror https://github.com/Trollz1004/OPUStrustForTheKidsPlatform.git C:\GitPurge\OPUStrustForTheKidsPlatform.git
```

### Step 3: Run BFG on Each Repo
```powershell
# Purge secrets from AiCollabForTheKids
java -jar C:\Tools\bfg.jar --replace-text C:\Tools\bfg-purge-list.txt C:\GitPurge\AiCollabForTheKids.git

# Purge secrets from OPUStrustForTheKidsPlatform
java -jar C:\Tools\bfg.jar --replace-text C:\Tools\bfg-purge-list.txt C:\GitPurge\OPUStrustForTheKidsPlatform.git
```

### Step 4: Clean Up and Expire Old Refs
```powershell
# AiCollabForTheKids
cd C:\GitPurge\AiCollabForTheKids.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# OPUStrustForTheKidsPlatform
cd C:\GitPurge\OPUStrustForTheKidsPlatform.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Step 5: Force Push to Remote
```powershell
# AiCollabForTheKids
cd C:\GitPurge\AiCollabForTheKids.git
git push --force

# OPUStrustForTheKidsPlatform
cd C:\GitPurge\OPUStrustForTheKidsPlatform.git
git push --force
```

---

## ALTERNATIVE: Delete Specific Files from History

If credentials were in specific files (like .env files that got committed):

```powershell
# Remove .env files from entire history
java -jar C:\Tools\bfg.jar --delete-files .env C:\GitPurge\AiCollabForTheKids.git
java -jar C:\Tools\bfg.jar --delete-files .env C:\GitPurge\OPUStrustForTheKidsPlatform.git

# Remove MASTER-PLATFORM-ENV.env if committed
java -jar C:\Tools\bfg.jar --delete-files MASTER-PLATFORM-ENV.env C:\GitPurge\AiCollabForTheKids.git
java -jar C:\Tools\bfg.jar --delete-files MASTER-PLATFORM-ENV.env C:\GitPurge\OPUStrustForTheKidsPlatform.git
```

---

## POST-PURGE CHECKLIST

### Immediate Actions
- [ ] Verify BFG completed successfully (check BFG report)
- [ ] Force push completed for both repos
- [ ] Delete local clones used for purging

### Credential Rotation (RECOMMENDED)
Even though repos are private, best practice is to rotate exposed credentials:

- [ ] GITHUB_TOKEN - Regenerate at github.com/settings/tokens
- [ ] CLOUDFLARE_* tokens - Regenerate at Cloudflare dashboard
- [ ] SENDGRID_API_KEY - Regenerate at SendGrid
- [ ] SQUARE_ACCESS_TOKEN - Regenerate at Square Developer
- [ ] OPENAI_API_KEY - Regenerate at OpenAI
- [ ] Other AI API keys as needed

### Team Notification
```
NOTIFICATION TEMPLATE:
----------------------
Subject: Git History Purge Completed - Issue #43

The git history for the following repos has been purged:
- Ai-Solutions-Store/AiCollabForTheKids
- Trollz1004/OPUStrustForTheKidsPlatform

ACTION REQUIRED:
Anyone with local clones must:
1. Delete their local clone
2. Re-clone fresh from GitHub
   OR
1. git fetch --all
2. git reset --hard origin/main

DO NOT merge old local branches - they contain the purged history.
```

---

## ROLLBACK PLAN

If something goes wrong:

### From Backup
```powershell
# Restore from backup (if force push already done)
cd C:\GitBackups\issue-43-purge\AiCollabForTheKids.git
git push --force --mirror https://github.com/Ai-Solutions-Store/AiCollabForTheKids.git

cd C:\GitBackups\issue-43-purge\OPUStrustForTheKidsPlatform.git
git push --force --mirror https://github.com/Trollz1004/OPUStrustForTheKidsPlatform.git
```

### GitHub Support
If backups fail, contact GitHub Support - they maintain backups for a limited time after force pushes.

---

## COMPLETE SCRIPT (Single Execution)

Save as `C:\Tools\run-bfg-purge.ps1`:

```powershell
# BFG Git History Purge Script - Issue #43
# FOR THE KIDS Platform
# REQUIRES: Manual creation of C:\Tools\bfg-purge-list.txt with actual secret values

$ErrorActionPreference = "Stop"

# Configuration
$BFG_JAR = "C:\Tools\bfg.jar"
$PURGE_LIST = "C:\Tools\bfg-purge-list.txt"
$WORK_DIR = "C:\GitPurge"
$BACKUP_DIR = "C:\GitBackups\issue-43-purge"

# Repos
$REPOS = @(
    @{Name="AiCollabForTheKids"; URL="https://github.com/Ai-Solutions-Store/AiCollabForTheKids.git"},
    @{Name="OPUStrustForTheKidsPlatform"; URL="https://github.com/Trollz1004/OPUStrustForTheKidsPlatform.git"}
)

# Pre-flight checks
Write-Host "=== BFG Purge Script - Issue #43 ===" -ForegroundColor Cyan

if (!(Test-Path $BFG_JAR)) {
    Write-Error "BFG not found at $BFG_JAR. Download from https://rtyley.github.io/bfg-repo-cleaner/"
    exit 1
}

if (!(Test-Path $PURGE_LIST)) {
    Write-Error "Purge list not found at $PURGE_LIST. Create file with secret values to purge."
    exit 1
}

# Create directories
New-Item -ItemType Directory -Force -Path $WORK_DIR | Out-Null
New-Item -ItemType Directory -Force -Path $BACKUP_DIR | Out-Null

foreach ($repo in $REPOS) {
    Write-Host "`n=== Processing: $($repo.Name) ===" -ForegroundColor Yellow

    $repoPath = Join-Path $WORK_DIR "$($repo.Name).git"
    $backupPath = Join-Path $BACKUP_DIR "$($repo.Name).git"

    # Backup
    Write-Host "Creating backup..." -ForegroundColor Green
    if (Test-Path $backupPath) { Remove-Item -Recurse -Force $backupPath }
    git clone --mirror $repo.URL $backupPath

    # Clone for purge
    Write-Host "Cloning for purge..." -ForegroundColor Green
    if (Test-Path $repoPath) { Remove-Item -Recurse -Force $repoPath }
    git clone --mirror $repo.URL $repoPath

    # Run BFG
    Write-Host "Running BFG..." -ForegroundColor Green
    java -jar $BFG_JAR --replace-text $PURGE_LIST $repoPath

    # Cleanup
    Write-Host "Cleaning refs..." -ForegroundColor Green
    Push-Location $repoPath
    git reflog expire --expire=now --all
    git gc --prune=now --aggressive
    Pop-Location

    # Force push (COMMENTED OUT - Uncomment when ready)
    # Write-Host "Force pushing..." -ForegroundColor Red
    # Push-Location $repoPath
    # git push --force
    # Pop-Location

    Write-Host "Completed: $($repo.Name)" -ForegroundColor Green
}

Write-Host "`n=== PURGE COMPLETE ===" -ForegroundColor Cyan
Write-Host "Backups saved to: $BACKUP_DIR"
Write-Host "NEXT STEP: Review BFG reports, then uncomment force push section and re-run"
```

---

## APPROVAL

**Prepared by:** Claude Opus 4.5
**Date:** 2026-01-14
**Issue:** #43 - Git History Purge

- [ ] Josh approves execution
- [ ] Backups verified
- [ ] Purge list created with actual values
- [ ] Ready to execute

---

**"Until no kid is in need"**
