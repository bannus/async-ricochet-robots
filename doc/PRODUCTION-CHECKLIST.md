# Production Deployment Checklist

This document lists critical items that **must** be completed before deploying to production.

---

## 1. CORS Configuration

**Current State:** Development mode allows all origins (`*`)  
**Action Required:** Restrict CORS to production domain only

### Location
`api/host.json`

### Change Required
```json
// BEFORE (Development)
"cors": {
  "allowedOrigins": ["*"],
  "supportCredentials": false
}

// AFTER (Production)
"cors": {
  "allowedOrigins": ["https://your-app.azurestaticapps.net"],
  "supportCredentials": false
}
```

### How to Verify
- [ ] `api/host.json` contains only production domain
- [ ] Test that requests from other origins are blocked
- [ ] Verify production frontend can access API

---

## 2. Azure Table Storage Configuration

**Current State:** Uses local Azurite emulator  
**Action Required:** Configure production Azure Table Storage connection

### Environment Variables Required

**Development:**
```bash
AzureWebJobsStorage="UseDevelopmentStorage=true"
```

**Production:**
```bash
AzureWebJobsStorage="DefaultEndpointsProtocol=https;AccountName=<account>;AccountKey=<key>;EndpointSuffix=core.windows.net"
```

### Steps
1. Create Azure Storage Account (if not already created)
2. Get connection string from Azure Portal
3. Configure in Azure Static Web Apps:
   - Go to your Static Web App in Azure Portal
   - Navigate to **Configuration** → **Application settings**
   - Add `AzureWebJobsStorage` with production connection string
4. Test that API can connect to production storage

### How to Verify
- [ ] Production storage account created
- [ ] Connection string configured in Azure
- [ ] Test API endpoints work with production storage
- [ ] Verify data persists between API restarts

---

## 10. Remove Debug Code

**Action Required:** Remove all development/debug code

### Items to Remove

1. **Console Statements**
   ```bash
   # Search for console.log across all files
   grep -r "console\." --include="*.ts" --include="*.js" .
   ```

2. **Debug Comments**
   - Remove `// TODO` comments (or resolve them)
   - Remove `// DEBUG` markers
   - Remove commented-out code blocks

3. **Development-Only Code**
   - Remove test data generators (if any)
   - Remove debugging endpoints
   - Remove verbose error messages that expose internals

### How to Verify
- [ ] No `console.log`, `console.error`, `console.warn` in source
- [ ] No commented-out code blocks
- [ ] No TODO comments (or documented in backlog)
- [ ] Error messages are user-friendly, not technical

---

## 11. Code Quality - Linting & Formatting

**Action Required:** Ensure consistent code style and quality

### Run Linting

```bash
# API
cd api
npm run lint     # (if lint script exists, otherwise skip)

# Client
cd client
npm run lint     # (if lint script exists, otherwise skip)

# Root (if applicable)
npm run lint
```

### Run Formatting

```bash
# Format all TypeScript files
npx prettier --write "**/*.{ts,js,json,css,html}"
```

### TypeScript Strict Mode

Verify TypeScript compiles without errors:
```bash
# API
cd api
npm run build

# Client
cd client
npm run build:once
```

### How to Verify
- [ ] All lint warnings resolved or documented
- [ ] Code formatted consistently
- [ ] TypeScript compiles with zero errors
- [ ] No `any` types (or justified with comments)

---

## 12. Security Audit

**Action Required:** Check for known vulnerabilities in dependencies

### Run Security Audit

```bash
# Root project
npm audit

# API
cd api
npm audit

# Client
cd client
npm audit
```

### Fix Vulnerabilities

```bash
# Automatic fixes (use with caution)
npm audit fix

# Manual review required for breaking changes
npm audit fix --force
```

### How to Verify
- [ ] `npm audit` shows 0 high/critical vulnerabilities
- [ ] All dependencies up to date (or documented why not)
- [ ] Review `npm audit` report for any remaining issues
- [ ] Test application still works after updates

---

## CI/CD Configuration

**Action Required:** Set up automated deployment pipeline

### Azure Static Web Apps Workflow

Azure Static Web Apps automatically creates a GitHub Actions workflow when connected to your repository.

### Required Configuration

1. **Workflow File Location:** `.github/workflows/azure-static-web-apps-*.yml`

2. **Build Configuration:**
   ```yaml
   app_location: "/client"
   api_location: "/api"
   output_location: "dist"
   ```

3. **Environment Variables:**
   - Configure in Azure Portal → Static Web Apps → Configuration
   - Add all required environment variables
   - Separate staging/production environments

4. **Build Commands:**
   - API: `npm run build` (automatically runs `copy:shared` pre-build)
   - Client: `npm run build:once`

### Deployment Slots

Consider using **staging slots** for testing before production:
- Deploy to staging slot first
- Verify functionality
- Swap to production

### How to Verify
- [ ] GitHub Actions workflow exists and runs successfully
- [ ] Builds complete without errors
- [ ] Environment variables configured in Azure
- [ ] Deployment succeeds to staging/production
- [ ] Application works in deployed environment

### Additional Resources
See `doc/CI-CD-REQUIREMENTS.md` for detailed CI/CD setup instructions.

---

## Final Verification Checklist

Before going live, verify ALL items:

- [ ] **1. CORS** - Production domain configured
- [ ] **2. Storage** - Azure Table Storage connection string set
- [ ] **10. Debug Code** - All console.log and debug code removed
- [ ] **11. Code Quality** - Linting passed, code formatted
- [ ] **12. Security** - No high/critical npm vulnerabilities
- [ ] **CI/CD** - Automated deployment working

### Additional Recommended Checks
- [ ] End-to-end testing completed
- [ ] Browser compatibility tested (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsive testing
- [ ] Performance testing (load times, API response times)
- [ ] Error handling works correctly
- [ ] User documentation complete

---

## Post-Deployment

After deploying to production:

1. **Monitor Application Insights** for errors
2. **Test critical user flows** in production
3. **Verify CORS** is working correctly
4. **Check Azure Table Storage** for data persistence
5. **Monitor performance metrics**
6. **Have rollback plan ready**

---

## Emergency Rollback

If issues occur after deployment:

1. **Azure Static Web Apps:** Revert to previous deployment in Azure Portal
2. **GitHub:** Revert commit and trigger new deployment
3. **Manual:** Deploy previous stable version

Always test rollback procedure before needing it!
