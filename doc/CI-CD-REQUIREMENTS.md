# CI/CD Requirements (Future Implementation)

This document outlines the requirements and setup for continuous integration and deployment of the Async Ricochet Robots project.

## Current Status

✅ **Testing Infrastructure Ready**
- 208 unit and integration tests implemented
- Test structure organized (unit/, integration/, helpers/)
- API integration tests framework in place (skipped by default)
- Manual testing documentation complete

⏳ **CI/CD Not Yet Implemented**
- GitHub Actions workflow needs to be created
- Azure deployment pipeline pending
- Automated testing in CI environment not configured

## Planned CI/CD Pipeline

### GitHub Actions Workflow

**Trigger Events:**
- Push to `main` branch
- Pull requests to `main` branch
- Manual workflow dispatch

**Pipeline Stages:**

#### 1. **Build & Test (All Commits)**
```yaml
- Checkout code
- Setup Node.js 18+
- Install dependencies (npm ci)
- Build TypeScript (npm run build)
- Run unit tests (npm test unit/)
- Run integration tests (npm test integration/game-integration)
- Generate coverage report
- Upload coverage to Codecov (optional)
```

#### 2. **API Integration Tests (PR only)**
```yaml
- Start Azurite in container
- Build API (cd api && npm run build)
- Start Azure Functions emulator
- Run API integration tests (remove .skip)
- Stop services
```

#### 3. **Deploy to Azure (main branch only)**
```yaml
- Build production artifacts
- Deploy Static Web App (frontend)
- Deploy Azure Functions (backend)
- Run smoke tests against production
```

## Required GitHub Secrets

```
AZURE_CREDENTIALS          # Azure service principal
AZURE_STATIC_WEB_APPS_TOKEN # Static Web Apps deployment token
AZURE_FUNCTIONS_PUBLISH_PROFILE # Functions app publish profile
```

## Azure Resources Needed

### Development Environment
- Azure Storage Account (for Azurite emulation baseline)
- Azure Functions App (consumption plan)
- Azure Static Web App (free tier)

### Production Environment
- Azure Storage Account
- Azure Functions App
- Azure Static Web App
- Application Insights (optional, for monitoring)

## Test Execution Strategy

### Local Development
```bash
# Run unit tests (fast, always run)
npm test unit/

# Run integration tests
npm test integration/

# Run API tests manually (requires services)
# 1. azurite --silent --location azurite
# 2. cd api && npm start
# 3. Remove .skip from api-integration.test.ts
# 4. npm test api-integration
```

### CI Environment
```bash
# Install + Build
npm ci
npm run build
cd api && npm ci && npm run build

# Unit Tests (always run)
npm test -- --coverage --ci

# Integration Tests (with Azurite)
azurite --silent --location ./azurite &
cd api && func start &
sleep 5  # Wait for services
npm test integration/api-integration  # Remove .skip in CI
```

### PR Checks (Required)
- ✅ All unit tests pass
- ✅ Code coverage >90%
- ✅ TypeScript compilation succeeds
- ✅ Integration tests pass
- ✅ No ESLint errors (when configured)

### Deployment Checks (main branch)
- ✅ All PR checks pass
- ✅ API integration tests pass
- ✅ Deployment succeeds
- ✅ Smoke tests pass

## Coverage Requirements

**Minimum Coverage Targets:**
- Statements: 90%
- Branches: 85%
- Functions: 95%
- Lines: 90%

**Current Coverage:**
- Statements: 96.46% ✅
- Branches: 90% ✅
- Functions: 100% ✅
- Lines: 98.27% ✅

## Deployment Strategy

### Frontend (Static Web App)
- Automatic deployment on push to main
- Preview deployments for pull requests
- Rollback capability via Azure Portal

### Backend (Azure Functions)
- Staged deployment (staging slot → production)
- Blue-green deployment pattern
- Automatic rollback on health check failure

## Monitoring & Alerts

### Application Insights
- Track API request rates
- Monitor function execution times
- Alert on error rate spikes
- Track custom events (game created, round completed)

### Health Checks
- `/api/health` endpoint (to be implemented)
- Check database connectivity
- Validate environment configuration

## Environment Variables

### Development (local.settings.json)
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "NODE_ENV": "development"
  }
}
```

### Production (Azure Configuration)
```
AzureWebJobsStorage     # Connection string to storage account
FUNCTIONS_WORKER_RUNTIME # node
NODE_ENV                 # production
WEBSITE_NODE_DEFAULT_VERSION # 18-lts
```

## Security Considerations

### Secrets Management
- Use Azure Key Vault for sensitive data
- Rotate access keys regularly
- Never commit secrets to repository
- Use managed identities where possible

### CORS Configuration
- Whitelist allowed origins
- Restrict to production domains in prod
- Allow localhost in development

## Performance Benchmarks

### Test Execution Times
- Unit tests: < 5 seconds
- Integration tests: < 10 seconds
- API integration tests: < 30 seconds (with services)
- Full test suite: < 1 minute

### Deployment Times
- Frontend build: < 2 minutes
- Backend build: < 3 minutes
- Total deployment: < 10 minutes

## Next Steps for Implementation

1. **Create GitHub Actions Workflow**
   - File: `.github/workflows/ci-cd.yml`
   - Configure build, test, deploy stages
   - Add environment-specific configurations

2. **Configure Azure Resources**
   - Set up development environment
   - Configure deployment credentials
   - Enable Application Insights

3. **Implement Health Endpoint**
   - Create `/api/health` function
   - Check storage connectivity
   - Return service status

4. **Add ESLint Configuration**
   - Install ESLint + TypeScript plugin
   - Configure rules for code quality
   - Add to CI pipeline

5. **Set Up Coverage Reporting**
   - Configure Codecov or similar
   - Add coverage badges to README
   - Enforce coverage thresholds

6. **Create Deployment Documentation**
   - Step-by-step deployment guide
   - Rollback procedures
   - Troubleshooting guide

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Azure Static Web Apps CI/CD](https://docs.microsoft.com/en-us/azure/static-web-apps/github-actions-workflow)
- [Azure Functions CI/CD](https://docs.microsoft.com/en-us/azure/azure-functions/functions-how-to-github-actions)
- [Jest CI Configuration](https://jestjs.io/docs/configuration#ci-boolean)
