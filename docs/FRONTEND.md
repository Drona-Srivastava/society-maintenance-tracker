# Society Maintenance Tracker — Frontend Documentation

**Project:** Society Maintenance Tracker  
**Frontend:** React + Vite  
**Deployment:** Vercel  
**Production URL:** `https://society-maintenance-tracker-drona.vercel.app`  
**Repository directory:** `frontend/`  
**Last documented:** 23 August 2026

---

## 1. Purpose

The frontend is the resident/admin web application for Society Maintenance Tracker.

It communicates with the FastAPI backend deployed on Azure Container Apps and provides the UI for:

- Authentication and registration
- Password recovery
- Resident profile management
- Profile picture upload
- Complaint creation and tracking
- Complaint history
- Notices
- Admin functionality
- Dashboard functionality

The frontend is a Vite application and is deployed independently from the backend.

---

## 2. Technology Stack

- React
- Vite
- JavaScript / JSX
- React Router (for client-side routing)
- CSS / project-specific styling
- Vercel for production hosting
- GitHub for source control

The frontend should remain independent of Azure-specific backend implementation details. It should only need the backend API base URL.

---

## 3. Repository Structure

The frontend lives under:

```text
frontend/
├── public/
│   ├── favicon.svg
│   └── ...
├── src/
│   ├── ...
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
└── vercel.json
```

The exact component/page structure may evolve. When adding a feature, keep API access, reusable UI, pages, and authentication concerns separated rather than putting large amounts of logic into a single component.

---

## 4. Local Development

From the repository root:

```bash
cd frontend
npm install
npm run dev
```

Vite normally starts the development server at:

```text
http://localhost:5173
```

The backend must also be running locally if the frontend is expected to make API calls to a local backend.

Do not commit `.env` files containing secrets.

---

## 5. Environment Variables

The frontend should use a Vite environment variable for the backend API base URL.

Typical configuration:

```env
VITE_API_URL=http://localhost:8000
```

For production, this should point to the Azure Container App backend:

```env
VITE_API_URL=https://society-backend.politefield-6b5113f7.centralindia.azurecontainerapps.io
```

**Important:** Vite variables prefixed with `VITE_` are exposed to browser code. Never put:

- database passwords
- JWT signing secrets
- Brevo API keys
- Azure credentials
- storage account secrets

inside frontend environment variables.

After changing a Vercel environment variable, trigger a new deployment.

---

## 6. Production Deployment on Vercel

The Vercel project is configured with:

```text
Root Directory: frontend
```

The repository contains:

```text
frontend/vercel.json
```

with the SPA rewrite:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Why this exists

Without the rewrite, a direct request such as:

```text
https://society-maintenance-tracker-drona.vercel.app/login
```

can reach Vercel as a request for a real `/login` file/path and return:

```text
404: NOT_FOUND
```

The rewrite sends the request to the React application's `index.html`, allowing React Router to resolve `/login`.

### Important

Whenever a new client-side route is added, test it both by navigating inside the app and by directly opening/refeshing its URL.

---

## 7. Deploying Frontend Changes

Normal workflow:

```bash
git status
git add frontend/
git commit -m "describe frontend change"
git push origin main
```

Vercel should detect the GitHub push and deploy the frontend automatically.

After deployment:

1. Open the production URL.
2. Check the deployment is successful.
3. Test the changed feature.
4. Directly open important routes.
5. Refresh those routes.
6. Check browser console/network errors.

---

## 8. Routing / Refresh Checklist

For every important client-side route, verify:

```text
/
 /login
 /register
 /forgot-password
 /dashboard
 /complaints
 /profile
 /notices
```

The exact route list depends on the current application.

For each route:

- navigate to it from the application
- paste the URL into a new browser tab
- refresh the page
- test while logged out if applicable
- test while logged in if applicable

If direct refresh returns Vercel `404 NOT_FOUND`, check `frontend/vercel.json` and confirm Vercel's Root Directory is still `frontend`.

---

## 9. Backend API Configuration

The frontend currently talks to the Azure backend:

```text
https://society-backend.politefield-6b5113f7.centralindia.azurecontainerapps.io
```

Health endpoint:

```text
GET /health
```

Expected response:

```json
{
  "status": "healthy",
  "service": "society-maintenance-tracker"
}
```

Swagger/OpenAPI:

```text
/docs
```

OpenAPI JSON:

```text
/openapi.json
```

---

## 10. CORS

The production frontend origin is:

```text
https://society-maintenance-tracker-drona.vercel.app
```

The backend currently has FastAPI CORS configuration and Azure Container Apps ingress CORS configuration.

When the production frontend domain changes, update the backend CORS configuration and Azure ingress CORS policy.

Do not use unrestricted CORS in production unless there is a deliberate reason.

---

## 11. Authentication Expectations

Authentication is handled by the backend.

The frontend should:

- store the returned access token according to the application's current implementation
- send the token with protected API requests
- handle expired/invalid sessions
- redirect unauthenticated users away from protected pages
- clear authentication state during logout
- avoid exposing tokens in URLs or logs

Important flows to test:

```text
Register
  ↓
Login
  ↓
Authenticated API requests
  ↓
Logout
```

Password recovery:

```text
Forgot password
  ↓
OTP sent
  ↓
Verify OTP
  ↓
Reset password
  ↓
Login using new password
```

---

## 12. Frontend Testing Checklist

### Authentication

- [ ] Register valid user
- [ ] Reject duplicate email
- [ ] Login with valid credentials
- [ ] Reject invalid credentials
- [ ] Logout
- [ ] Access protected route while logged out
- [ ] Forgot password
- [ ] Verify OTP
- [ ] Reset password
- [ ] Login using new password
- [ ] Test expired/invalid OTP

### Resident

- [ ] View profile
- [ ] Update profile
- [ ] Upload profile picture
- [ ] Create complaint
- [ ] Upload complaint image
- [ ] View complaints
- [ ] View complaint details
- [ ] View complaint history
- [ ] View notices

### Admin

- [ ] Admin authentication
- [ ] Dashboard
- [ ] View complaints
- [ ] Update complaint state
- [ ] Assign/manage complaints
- [ ] View history
- [ ] Manage notices
- [ ] Analytics if enabled

### Production

- [ ] Production URL loads
- [ ] Direct `/login` works
- [ ] Refresh `/login` works
- [ ] Protected routes work
- [ ] API requests reach Azure
- [ ] CORS works
- [ ] Images load
- [ ] Password reset email flow works
- [ ] Mobile layout works

---

## 13. Branding / Metadata

`frontend/index.html` should contain the real application identity, not the Vite default.

At minimum:

```html
<title>Society Maintenance Tracker</title>
```

Also maintain:

- favicon
- Apple touch icon
- theme color
- meta description
- canonical URL
- OpenGraph title/description/image
- robots configuration
- sitemap

The default Vite favicon should not remain in the final production build.

---

## 14. SEO Guidance

SEO primarily matters for public pages. Private dashboards should not be the main SEO target.

Recommended public-page setup:

```text
/
```

with:

- descriptive title
- useful meta description
- semantic headings
- OpenGraph metadata
- canonical URL
- `robots.txt`
- `sitemap.xml`
- fast loading
- mobile responsiveness
- accessible HTML

Do not put private dashboard URLs into the public sitemap.

---

## 15. Common Frontend Problems

### Vercel returns `404: NOT_FOUND` on refresh

Check:

```text
Vercel Root Directory = frontend
frontend/vercel.json exists
```

Expected rewrite:

```json
{
  "source": "/(.*)",
  "destination": "/index.html"
}
```

Then redeploy.

### API request fails with CORS

Check:

1. Browser `Origin`.
2. Backend FastAPI `allow_origins`.
3. Azure Container Apps ingress CORS.
4. Production frontend URL.
5. Whether the request is reaching the intended backend revision.

### API returns 401 after working previously

Check:

- token still exists
- token is not expired
- Authorization header is being sent
- backend JWT secret did not accidentally change
- user is still valid

### Images do not load

Check:

- API response contains the expected image URL
- Azure storage configuration is valid
- backend endpoint is reachable
- browser Network tab for 401/403/404/CORS errors

---

## 16. Safe Frontend Change Workflow

Before making a significant change:

```bash
git status
git pull --rebase origin main
```

Make the change.

Then:

```bash
npm run build
```

Fix build errors before pushing.

Then:

```bash
git status
git diff
git add frontend/
git commit -m "..."
git push origin main
```

After deployment, test the production flow.

---

## 17. Final Frontend Deployment Checklist

```text
[ ] Local build succeeds
[ ] No secrets committed
[ ] Correct VITE_API_URL
[ ] Vercel Root Directory = frontend
[ ] vercel.json present
[ ] Production deployment succeeds
[ ] / works
[ ] /login direct navigation works
[ ] /login refresh works
[ ] Authentication works
[ ] API calls work
[ ] CORS works
[ ] Images work
[ ] Mobile UI checked
[ ] Browser console checked
```

---
