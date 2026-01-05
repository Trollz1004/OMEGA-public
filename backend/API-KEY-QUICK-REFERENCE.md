# API Authentication Quick Reference
**FOR THE KIDS - API Security Implementation**

---

## API Key Location

```bash
# File: api/.env
API_KEY=38d3e746ce7a6579c435407906d2f77d1d9f76b0c5c757e20523bdc81c890825
```

**NEVER commit this to git!** (Already in `.gitignore`)

---

## How to Use

### JavaScript/TypeScript

```javascript
// Method 1: Using header (RECOMMENDED)
fetch('https://api.aidoesitall.website/api/jules/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.API_KEY
  },
  body: JSON.stringify({ command: 'git status' })
});

// Method 2: Using query parameter (less secure)
fetch('https://api.aidoesitall.website/api/jules/execute?apiKey=' + process.env.API_KEY, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ command: 'git status' })
});
```

### PowerShell

```powershell
$headers = @{ "X-API-Key" = $env:API_KEY }
Invoke-RestMethod -Uri "https://api.aidoesitall.website/api/admin/status" -Headers $headers
```

### cURL

```bash
curl -H "X-API-Key: $API_KEY" https://api.aidoesitall.website/api/jules/execute
```

### Python

```python
import os
import requests

api_key = os.environ['API_KEY']
headers = {'X-API-Key': api_key}

response = requests.post(
    'https://api.aidoesitall.website/api/jules/execute',
    headers=headers,
    json={'command': 'git status'}
)
```

---

## Which Routes Need Authentication?

### ✅ PROTECTED (API Key Required)

- `/api/jules/*` - AI commands
- `/api/admin/*` - Admin operations
- `/api/campaign/*` - Campaign management
- `/api/payments/*` - Payment processing
- `/api/subscriptions/*` - Square subscriptions
- `/api/stripe/*` - Stripe operations
- `/api/merch/*` - Merch store
- `/api/droid/*` - Droid automation
- `/api/relay/*` - Internal relay
- `/api/infra/*` - Infrastructure expenses
- `/api/community/*` - Community management
- `/api/free-dao/*` - DAO operations
- `/api/dating/*` - Dating app backend
- `/api/affiliates/*` - Affiliate program

### 🌐 PUBLIC (No Key Needed)

- `/` - API welcome
- `/health` - Health check
- `/api/gospel` - Gospel split info
- `/api/age-verification/*` - Age verification
- `/api/consent/*` - Cookie consent
- `/api/transparency/*` - Public transparency
- `/api/kickstarter/*` - Campaign info
- `/api/verify-human/*` - Human verification
- `/api/webhooks/*` - External webhooks (have own validation)

---

## Error Responses

### 401 Unauthorized (Missing/Invalid Key)

```json
{
  "error": "Unauthorized",
  "message": "Valid API key required. Provide via X-API-Key header or apiKey query parameter.",
  "mission": "FOR THE KIDS - Security is paramount"
}
```

### 200 OK (Valid Key)

```json
{
  "success": true,
  "data": { ... }
}
```

---

## Testing

### Test Without Key (Should Fail)

```bash
curl -X POST https://api.aidoesitall.website/api/jules/execute \
  -H "Content-Type: application/json" \
  -d '{"command":"git status"}'
# Expected: 401 Unauthorized
```

### Test With Key (Should Work)

```bash
curl -X POST https://api.aidoesitall.website/api/jules/execute \
  -H "X-API-Key: 38d3e746ce7a6579c435407906d2f77d1d9f76b0c5c757e20523bdc81c890825" \
  -H "Content-Type: application/json" \
  -d '{"command":"git status"}'
# Expected: 200 OK with response
```

### Test Public Route (Should Work Without Key)

```bash
curl https://api.aidoesitall.website/health
# Expected: 200 OK
```

---

## Environment Setup

### For Local Development

```bash
# Create api/.env.local (if doesn't exist)
echo "API_KEY=38d3e746ce7a6579c435407906d2f77d1d9f76b0c5c757e20523bdc81c890825" >> api/.env.local

# Or export to shell
export API_KEY=38d3e746ce7a6579c435407906d2f77d1d9f76b0c5c757e20523bdc81c890825
```

### For Production

```bash
# On T5500 or EC2, add to ~/.bashrc or ~/.zshrc
echo 'export API_KEY=38d3e746ce7a6579c435407906d2f77d1d9f76b0c5c757e20523bdc81c890825' >> ~/.bashrc
source ~/.bashrc
```

---

## Rotating the API Key

### 1. Generate New Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Update .env

```bash
# Edit api/.env
API_KEY=<new_key_here>
```

### 3. Restart API Server

```bash
cd ~/AiCollabForTheKids/api
pm2 restart jules-api
```

### 4. Update All Clients

- Dashboard environment variables
- Automation scripts
- Droid configurations
- Mobile apps

---

## Security Notes

1. **NEVER hardcode the key** in source code
2. **NEVER commit** `.env` files to git
3. **NEVER share** the key publicly
4. **USE HTTPS** in production (already configured)
5. **ROTATE** the key if compromised
6. **MONITOR** logs for unauthorized attempts

---

## Need Help?

- **Full Documentation:** `API-AUTHENTICATION-REPORT.md`
- **Server Code:** `api/server.js` (lines 62-88)
- **Environment:** `api/.env` (line 163)

**Mission:** FOR THE KIDS
**Security Level:** CRITICAL
