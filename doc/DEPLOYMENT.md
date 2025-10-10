# Deployment Guide

## Azure Static Web Apps Deployment

### Current Deployment
- **Production URL**: https://icy-glacier-0f757cb0f.1.azurestaticapps.net/
- **Platform**: Azure Static Web Apps
- **API Runtime**: Node.js 20

### Deployment Process

1. **Automatic Deployment via GitHub Actions**
   - Push to `main` branch triggers automatic deployment
   - Workflow file: `.github/workflows/azure-static-web-apps.yml`
   - Build steps:
     - Builds client application
     - Compiles shared TypeScript files
     - Deploys API functions

2. **Manual Deployment**
   ```bash
   # Install SWA CLI
   npm install -g @azure/static-web-apps-cli

   # Deploy
   swa deploy
   ```

### Configuration Files

#### `client/staticwebapp.config.json`
- Defines API runtime (Node 20)
- Sets up routing rules
- Configures Content Security Policy headers
- MIME type mappings

#### Content Security Policy
```json
{
  "content-security-policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self';"
}
```

Key CSP directives:
- `default-src 'self'`: Only allow resources from same origin
- `script-src 'self' 'unsafe-inline'`: Allow inline scripts (for modules)
- `style-src 'self' 'unsafe-inline'`: Allow inline styles
- `img-src 'self' data:`: Allow images from same origin and data URIs
- `connect-src 'self'`: Allow API calls to same origin only

### API Client Configuration

The `ApiClient` class uses relative paths by default:
- **Production**: `/api` resolves to `https://icy-glacier-0f757cb0f.1.azurestaticapps.net/api`
- **Development**: `/api` is proxied by SWA CLI to local Azure Functions

For local development with Azure Functions Core Tools (without SWA CLI), pass the localhost URL explicitly:
```typescript
const apiClient = new ApiClient('http://localhost:7071/api');
```

### Local Development

#### Option 1: SWA CLI (Recommended)
```bash
# Install dependencies
npm install

# Build shared code
npm run build:shared

# Start SWA emulator (runs both client and API)
npm run dev
```

The SWA CLI automatically:
- Serves the client on `http://localhost:4280`
- Proxies `/api` requests to Azure Functions on port 7071
- Handles authentication and configuration

#### Option 2: Separate Servers
```bash
# Terminal 1: Start API
cd api
npm run start

# Terminal 2: Serve client
cd client
npx http-server -p 8080
```

Then update the `ApiClient` instantiation to use `http://localhost:7071/api`.

### Troubleshooting

#### CSP Errors
If you see "Content Security Policy" errors in production:
1. Check that API calls use relative paths (`/api/...`)
2. Verify CSP headers in `staticwebapp.config.json`
3. Ensure `connect-src 'self'` is present in CSP

#### API Not Found (404)
1. Verify API functions are in `api/src/functions/` directory
2. Check `api/src/index.ts` exports all functions
3. Ensure build completes successfully in GitHub Actions
4. Check function metadata in `api/dist/src/functions/`

#### CORS Issues
Azure Static Web Apps automatically handles CORS for `/api/*` routes. No additional configuration needed.

### Environment Variables

Set in Azure Static Web Apps configuration:
- `AZURE_STORAGE_CONNECTION_STRING`: Connection string for Table Storage
- (Other environment variables as needed)

### Monitoring

- View logs in Azure Portal → Static Web Apps → Log Stream
- Check GitHub Actions for build/deployment logs
- Use browser DevTools to inspect API calls and CSP violations

## Version History

### 2025-10-10: Azure Functions v4 Deployment Fix
- **Issue**: Deployment failing with "Failed to deploy the Azure Functions"
- **Root Cause**: Forbidden app setting `AzureWebJobsStorage` in Static Web App configuration
- **Solution**: Removed `AzureWebJobsStorage` from Azure Portal application settings
- **Details**: Azure Static Web Apps uses Managed Functions, which automatically handles storage. Setting `AzureWebJobsStorage` manually conflicts with the managed system and causes deployment rejection.
- **Fix Location**: Azure Portal → Static Web App → Configuration → Application Settings
- **Result**: ✅ Deployment successful, API functions operational

**Important**: For Static Web Apps Managed Functions, DO NOT set `AzureWebJobsStorage` in application settings. Azure manages this automatically.

### 2025-01-09: CSP Fix
- Fixed Content Security Policy blocking API calls in production
- Changed `ApiClient` default from `http://localhost:7071/api` to `/api`
- Added explicit `connect-src 'self'` to CSP headers
- Production deployment now works correctly with relative API paths
