# Society Maintenance Tracker

A full-stack society maintenance management application built with React/Vite and FastAPI, with PostgreSQL for structured data and Azure Blob Storage for persistent uploads.

> **Purpose of this README:** This is the safe, repeatable "how do I work on and deploy this project without breaking it?" guide. It complements the detailed frontend/backend documentation and the architecture decision documents.

---

## 1. Project Stack

| Component | Technology |
|---|---|
| Frontend | React + Vite |
| Frontend hosting | Vercel |
| Backend | FastAPI + Python |
| Backend hosting | Azure Container Apps |
| Container registry | Azure Container Registry (ACR) |
| Database | PostgreSQL |
| File storage | Azure Blob Storage |
| Email | Brevo |
| CI/CD | GitHub Actions |
| Container security | Trivy |
| Authentication | JWT |
| Database migrations | Alembic |
| Source control | GitHub |

### Production URLs

**Frontend**

`https://society-maintenance-tracker-drona.vercel.app`

**Backend**

`https://society-backend.politefield-6b5113f7.centralindia.azurecontainerapps.io`

**Backend health**

`https://society-backend.politefield-6b5113f7.centralindia.azurecontainerapps.io/health`

**Swagger / OpenAPI**

`https://society-backend.politefield-6b5113f7.centralindia.azurecontainerapps.io/docs`

---

# 2. Repository Structure

The repository contains the frontend and backend separately.

```text
society-maintenance-tracker/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   └── vercel.json
│
├── backend/
│   ├── app/
│   ├── migrations/
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
│
├── .github/
│   └── workflows/
│
├── FRONTEND.md
├── FRONTEND.docx
├── BACKEND.md
├── BACKEND.docx
├── PROJECT_DECISIONS_ARCHITECTURE_LAYMAN.md
├── PROJECT_DECISIONS_ARCHITECTURE_LAYMAN.docx
├── PROJECT_DECISIONS_ARCHITECTURE_STUDENT.md
├── PROJECT_DECISIONS_ARCHITECTURE_STUDENT.docx
└── README.md
```

---

# 3. Read the Documentation Before Changing Infrastructure

Use these documents as the detailed reference:

| File | Purpose |
|---|---|
| `FRONTEND.md` | Frontend architecture, Vercel deployment, routing, environment variables, testing, SEO and troubleshooting |
| `BACKEND.md` | FastAPI, Docker, ACR, Azure Container Apps, secrets, migrations, revisions, traffic, CORS and rollback |
| `FRONTEND.docx` | Word version of frontend documentation |
| `BACKEND.docx` | Word version of backend documentation |
| `PROJECT_DECISIONS_ARCHITECTURE_LAYMAN.md` | Project decisions and architecture in plain language |
| `PROJECT_DECISIONS_ARCHITECTURE_STUDENT.md` | Student-level technical architecture and engineering decisions |
| `PROJECT_DECISIONS_ARCHITECTURE_LAYMAN.docx` | Word version of layman architecture documentation |
| `PROJECT_DECISIONS_ARCHITECTURE_STUDENT.docx` | Word version of student architecture documentation |

**If you are changing Azure, Docker, migrations, secrets, revisions, traffic, or CI/CD, read `BACKEND.md` first.**

---

# 4. Architecture

The intended production flow is:

```text
                         DEVELOPMENT / SOURCE
┌───────────────────┐       ┌──────────────┐       ┌──────────────────┐
│ Developer Laptop  │ ────> │ GitHub       │ ────> │ GitHub Actions   │
│ React + FastAPI   │  git  │ main branch  │       │ Test / Build     │
│ Docker / tests    │       └──────────────┘       │ Scan / Deploy     │
└───────────────────┘                              └────────┬─────────┘
                                                            │
                            ┌───────────────────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │ Azure Container  │
                  │ Registry (ACR)   │
                  └────────┬─────────┘
                           │ Docker image
                           ▼
                  ┌──────────────────┐
                  │ Azure Container  │
                  │ Apps             │
                  │ FastAPI backend  │
                  └───────┬──────────┘
                          │
             ┌────────────┼─────────────┐
             │            │             │
             ▼            ▼             ▼
       PostgreSQL    Azure Blob       Brevo
       application   Storage          email
       data          uploads

       ┌─────────────────────────────────────┐
       │ Vercel                              │
       │ React/Vite frontend                 │
       └──────────────────┬──────────────────┘
                          │
                          │ HTTPS / API
                          ▼
                  Azure Container Apps
```

### Important principle

A production release is **not only a Docker image**.

It is:

```text
Source code
    +
Docker image
    +
Runtime configuration
    +
Secrets
    +
Database schema
    +
Networking
    +
Azure revision
    +
Traffic configuration
```

A failure in any one of these can break production.

---

# 5. The Safe Development Workflow

Use this workflow whenever possible:

```text
Make changes locally
        ↓
Test locally
        ↓
Review git diff
        ↓
Commit
        ↓
Push to GitHub
        ↓
GitHub Actions
        ↓
Test + build + security scan
        ↓
Docker image → ACR
        ↓
Azure Container Apps
        ↓
New revision
        ↓
Verify revision
        ↓
Move traffic if required
        ↓
Verify production
```

**Do not manually change production first and then try to make Git match it.**

GitHub should remain the source of truth.

---

# 6. Before Starting Work

Check your current branch:

```bash
git branch --show-current
```

Update your local repository:

```bash
git pull origin main
```

Check the working tree:

```bash
git status
```

Ideally:

```text
nothing to commit, working tree clean
```

If there are existing changes, understand them before doing anything else.

---

# 7. Create a Feature Branch

For normal feature/fix work, use a branch:

```bash
git checkout -b feature/<short-description>
```

Examples:

```bash
git checkout -b feature/complaint-notifications
git checkout -b fix/password-reset
git checkout -b chore/update-documentation
```

Check:

```bash
git branch --show-current
```

---

# 8. Never Commit Secrets

Never commit:

```text
.env
.env.*
database passwords
JWT secrets
Brevo API keys
Azure credentials
private keys
service-account credentials
production connection strings
```

Do not put real secrets in:

- source code
- README files
- documentation
- Dockerfiles
- frontend code
- GitHub commits
- screenshots
- example commands

Use placeholders in documentation.

For example:

```text
DATABASE_URL=<your-database-url>
JWT_SECRET=<your-jwt-secret>
BREVO_API_KEY=<your-brevo-api-key>
EMAIL_FROM=<your-sender-email>
```

### Important frontend rule

Anything shipped in a Vite frontend bundle can potentially be viewed by users.

Therefore, **never put backend secrets into frontend environment variables**.

---

# 9. Frontend Development

Go to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build before pushing:

```bash
npm run build
```

If linting exists:

```bash
npm run lint
```

---

# 10. Frontend Routing

The project is a React SPA.

Vercel therefore needs to send frontend routes back to `index.html`.

This is handled by:

```text
frontend/vercel.json
```

The configuration should contain a rewrite equivalent to:

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

### Why this matters

Without this configuration:

```text
/login
/dashboard
/profile
```

can work when navigating inside the application but return:

```text
404 NOT_FOUND
```

when the browser directly reloads the URL.

Always test direct refreshes after frontend routing changes.

---

# 11. Frontend Test Checklist

Before pushing frontend changes:

```text
[ ] Homepage loads
[ ] Login loads
[ ] Registration loads
[ ] Dashboard loads
[ ] Profile loads
[ ] Direct /login refresh works
[ ] Direct dashboard refresh works
[ ] Authentication works
[ ] API requests work
[ ] Images load
[ ] Build succeeds
```

Test a direct route manually:

```text
https://society-maintenance-tracker-drona.vercel.app/login
```

Then press:

```text
Ctrl + R
```

It must continue to load.

---

# 12. Backend Development

Go to the backend:

```bash
cd backend
```

Activate the project's Python environment if one is configured:

```bash
source .venv/bin/activate
```

Run the backend using the project's documented development command.

Check:

```text
/health
/docs
```

The exact local database/environment setup is documented in `BACKEND.md`.

---

# 13. Backend Testing

Run:

```bash
pytest
```

Do not push if expected tests are failing.

Also test important API flows:

```text
[ ] Health check
[ ] Registration
[ ] Login
[ ] Authentication
[ ] Profile
[ ] Complaints
[ ] Admin functions
[ ] File upload
[ ] Password reset
[ ] Email flow
```

---

# 14. Password Reset Verification

The production API currently includes:

```text
POST /api/auth/forgot-password
POST /api/auth/verify-reset-otp
POST /api/auth/reset-password
```

After backend deployments, verify that these endpoints exist in:

```text
/docs
```

or:

```text
/openapi.json
```

A useful production check:

```bash
curl -s \
  "https://society-backend.politefield-6b5113f7.centralindia.azurecontainerapps.io/openapi.json" \
  | grep -Eo 'forgot-password|verify-reset-otp|reset-password' \
  | sort -u
```

Expected:

```text
forgot-password
reset-password
verify-reset-otp
```

---

# 15. Database Changes

If you modify:

- models
- tables
- columns
- relationships
- constraints
- indexes
- enums

you must consider database migrations.

The intended flow is:

```text
Model change
      ↓
Migration
      ↓
Commit migration
      ↓
CI/CD
      ↓
Production migration
```

Do **not** manually modify production schema simply to make the application work.

Use the migration process documented in `BACKEND.md`.

---

# 16. Docker Testing

If backend code changes, build the Docker image locally.

Example:

```bash
docker build -t society-backend:local ./backend
```

Run it with safe local test configuration.

The backend requires runtime configuration including:

```text
DATABASE_URL
JWT_SECRET
BREVO_API_KEY
EMAIL_FROM
```

Do not use production secrets just to perform a local container smoke test.

Test:

```text
/health
```

and, when appropriate:

```text
/docs
```

---

# 17. Review Git Before Committing

Run:

```bash
git status
```

Then:

```bash
git diff
```

Look for accidental:

```text
.env
node_modules/
.venv/
database dumps
large binaries
Docker artifacts
credentials
API keys
debug files
generated files
```

---

# 18. Stage Only What You Intend to Commit

Prefer explicit staging when you are unsure:

```bash
git add frontend/src/...
git add backend/app/...
```

If you are certain everything in the working tree should be committed:

```bash
git add .
```

Then inspect the staged changes:

```bash
git diff --cached
```

**This is a mandatory safety check.**

---

# 19. Commit

Use a meaningful commit message.

Examples:

```bash
git commit -m "feat: add complaint notification emails"
```

```bash
git commit -m "fix: handle expired reset OTP"
```

```bash
git commit -m "fix: configure Vercel SPA routing"
```

```bash
git commit -m "docs: update deployment instructions"
```

Avoid:

```text
update
changes
final
final2
fixed
stuff
```

---

# 20. Push to GitHub

For a feature branch:

```bash
git push -u origin feature/<short-description>
```

Example:

```bash
git push -u origin feature/complaint-notifications
```

If intentionally pushing directly to production `main`:

```bash
git push origin main
```

Only do this after completing the checks above.

---

# 21. What Happens After Push

The intended backend pipeline is approximately:

```text
Git push
   ↓
GitHub Actions
   ↓
Run tests
   ↓
Build Docker image
   ↓
Container smoke test
   ↓
Trivy vulnerability scan
   ↓
Push image to ACR
   ↓
Deployment / migration
   ↓
Azure Container Apps revision
```

The frontend is deployed through Vercel.

---

# 22. Never Assume CI Success Means Production Is Correct

A successful GitHub Actions run means the workflow completed successfully.

It does **not** automatically prove that:

```text
the correct Azure revision has traffic
the database migration succeeded
all secrets are present
CORS is correct
the frontend can reach the backend
the production routes work
```

Always perform production verification.

---

# 23. Check Azure Revisions

List revisions:

```bash
az containerapp revision list \
  --name society-backend \
  --resource-group society-maintenance-rg \
  --query "[].{name:name,active:properties.active,traffic:properties.trafficWeight,running:properties.runningState,image:properties.template.containers[0].image}" \
  -o table
```

You need to know:

```text
Which revision is running?
Which revision is healthy?
Which revision has traffic?
Which image is that revision using?
```

Do not assume:

```text
latest revision = production revision
```

---

# 24. Check Traffic

Run:

```bash
az containerapp ingress traffic show \
  --name society-backend \
  --resource-group society-maintenance-rg \
  -o table
```

A known-good production configuration should have the intended revision receiving:

```text
100%
```

If using multiple revision mode, verify the traffic explicitly.

---

# 25. Verify the Backend

Production health check:

```bash
curl -i \
  "https://society-backend.politefield-6b5113f7.centralindia.azurecontainerapps.io/health"
```

Expected:

```text
HTTP/2 200
```

with a response similar to:

```json
{
  "status": "healthy",
  "service": "society-maintenance-tracker"
}
```

---

# 26. Verify OpenAPI

Run:

```bash
curl -s \
  "https://society-backend.politefield-6b5113f7.centralindia.azurecontainerapps.io/openapi.json"
```

Confirm expected endpoints are present.

Also open:

```text
https://society-backend.politefield-6b5113f7.centralindia.azurecontainerapps.io/docs
```

Swagger should show the currently deployed API.

This is especially important after backend changes because an older Azure revision may still be serving traffic.

---

# 27. Verify CORS

The frontend and backend use different origins.

Test:

```bash
curl -i \
  "https://society-backend.politefield-6b5113f7.centralindia.azurecontainerapps.io/health" \
  -H "Origin: https://society-maintenance-tracker-drona.vercel.app"
```

Expected response should include:

```text
access-control-allow-origin: https://society-maintenance-tracker-drona.vercel.app
```

and, where required:

```text
access-control-allow-credentials: true
```

CORS can exist at two levels:

```text
FastAPI CORSMiddleware
+
Azure Container Apps ingress CORS
```

If CORS breaks, check both.

---

# 28. Verify Frontend Production

Test:

```text
[ ] Homepage
[ ] Login
[ ] Register
[ ] Dashboard
[ ] Profile
[ ] Complaints
[ ] Admin functionality
[ ] Image uploads
[ ] Password reset
```

Also test direct URLs:

```text
/login
/register
/dashboard
/profile
```

Refresh each one.

---

# 29. Production Smoke Test

After every meaningful deployment:

### Frontend

```text
[ ] Homepage loads
[ ] Login works
[ ] Registration works
[ ] Direct route refresh works
[ ] Authentication works
[ ] Dashboard works
[ ] Profile works
[ ] Images work
[ ] Important user flows work
```

### Backend

```text
[ ] /health returns 200
[ ] /docs loads
[ ] /openapi.json is correct
[ ] Authentication works
[ ] Database operations work
[ ] File upload works
[ ] File retrieval works
[ ] Password reset works
[ ] Email flow works
```

### Azure

```text
[ ] New revision exists
[ ] Revision is running
[ ] Correct image is deployed
[ ] Correct revision has traffic
[ ] CORS works
[ ] No startup errors
[ ] Database migration succeeded
```

---

# 30. Secrets and Runtime Configuration

Azure Container Apps stores production secrets separately from the Docker image.

The backend uses secret-backed configuration such as:

```text
DATABASE_URL
JWT_SECRET
BREVO_API_KEY
EMAIL_FROM
```

The environment configuration should reference Azure secrets rather than hard-coding values into the image.

Check configured environment variable references:

```bash
az containerapp show \
  --name society-backend \
  --resource-group society-maintenance-rg \
  --query "properties.template.containers[0].env" \
  -o yaml
```

List secret names:

```bash
az containerapp secret list \
  --name society-backend \
  --resource-group society-maintenance-rg \
  -o table
```

Never print or commit the actual secret values.

---

# 31. Important Secret Lesson

A Docker image can work locally while failing in Azure if its runtime environment is incomplete.

For example, the production application requires configuration that is not baked into the Docker image.

Therefore:

```text
Docker image
      +
Azure runtime secrets
      +
Azure environment variables
```

are all part of the deployment.

---

# 32. If a New Azure Revision Fails

Do **not** immediately delete the previous revision.

First:

```bash
az containerapp revision list \
  --name society-backend \
  --resource-group society-maintenance-rg \
  -o table
```

Determine:

```text
current production revision
new revision
running state
image
traffic
```

Common causes:

```text
Missing environment variable
Missing secret
Database connection failure
Migration failure
Incorrect startup command
Container crash
Port configuration
Wrong Docker image
Wrong revision receiving traffic
CORS configuration
```

---

# 33. Rollback

If a new revision is broken and a known-good revision exists, restore traffic to the known-good revision.

First switch to multiple revision mode if necessary.

Then:

```bash
az containerapp ingress traffic set \
  --name society-backend \
  --resource-group society-maintenance-rg \
  --revision-weight <KNOWN_GOOD_REVISION>=100
```

Verify:

```bash
az containerapp ingress traffic show \
  --name society-backend \
  --resource-group society-maintenance-rg \
  -o table
```

Then:

```bash
curl -i \
  "https://society-backend.politefield-6b5113f7.centralindia.azurecontainerapps.io/health"
```

Once production is stable, investigate the failed revision.

**Do not delete the known-good revision until you are certain it is no longer needed.**

---

# 34. Deployment Incident Lessons

Several important lessons came from the actual deployment.

### Vercel SPA routing

Without the Vercel rewrite, direct refreshes such as:

```text
/login
```

could return:

```text
404 NOT_FOUND
```

The fix is the `frontend/vercel.json` SPA rewrite.

### CORS

CORS must be correct for the actual production frontend origin.

The production frontend is:

```text
https://society-maintenance-tracker-drona.vercel.app
```

### Azure revisions

A Docker image existing in ACR does not mean that image is serving production.

Always check:

```text
revision
running state
image
traffic
```

### Missing production secrets

The password reset code existed in the deployed source/image, but the production runtime did not initially have the required Brevo configuration.

The missing runtime configuration prevented the intended password-reset functionality from appearing in the production API.

The lesson:

> Source code, Docker image and runtime configuration must all be correct.

### Local Docker testing

A production image may require environment variables that are supplied by Azure.

Running:

```bash
docker run ...
```

without those variables can cause the container to exit during startup.

Use safe local test values when testing the image locally.

---

# 35. If Something Suddenly Disappears From Swagger

If an endpoint exists locally:

```bash
curl -s http://localhost:8001/openapi.json \
  | grep -E 'forgot-password|verify-reset-otp|reset-password'
```

but does not exist in production:

```bash
curl -s \
  "https://society-backend.politefield-6b5113f7.centralindia.azurecontainerapps.io/openapi.json" \
  | grep -E 'forgot-password|verify-reset-otp|reset-password'
```

do not immediately rewrite the backend.

First check:

```bash
az containerapp revision list \
  --name society-backend \
  --resource-group society-maintenance-rg \
  -o table
```

The production application may simply be serving an older revision.

---

# 36. If the Container Starts Locally but Fails in Azure

Check:

```text
[ ] Environment variables
[ ] Azure secrets
[ ] Database connectivity
[ ] Container port
[ ] Startup command
[ ] Docker image
[ ] Managed identity permissions
[ ] Storage configuration
[ ] Migration
```

Remember:

```text
Local success ≠ production success
```

---

# 37. If Production Is Broken

**STOP changing random things.**

Determine these facts first:

```text
1. What code was deployed?
2. What Docker image is deployed?
3. Which Azure revision is running?
4. Which revision has traffic?
5. Did the migration succeed?
6. Are all required secrets present?
7. Is the container healthy?
8. Is the backend reachable?
9. Is CORS correct?
10. Can the frontend reach the backend?
```

Then make one change at a time.

If a known-good revision exists:

```text
Restore traffic first.
Investigate second.
```

---

# 38. Standard Deployment Checklist

Use this checklist every time.

## Git

```text
[ ] Correct branch
[ ] Pulled latest main
[ ] Working tree understood
[ ] No secrets
[ ] No accidental files
[ ] Changes tested
[ ] git diff reviewed
[ ] git diff --cached reviewed
[ ] Meaningful commit message
[ ] Push succeeded
```

## Frontend

```text
[ ] npm install works
[ ] npm run build works
[ ] Lint passes if configured
[ ] Homepage works
[ ] Login works
[ ] Register works
[ ] Dashboard works
[ ] Direct route refresh works
[ ] API connection works
```

## Backend

```text
[ ] pytest passes
[ ] Docker build works
[ ] Container starts
[ ] /health works
[ ] /docs works
[ ] Database works
[ ] Migrations are included
[ ] Password reset works
[ ] Email functionality works
```

## CI/CD

```text
[ ] GitHub Actions passes
[ ] Tests pass
[ ] Docker build passes
[ ] Container smoke test passes
[ ] Trivy scan passes
[ ] Image reaches ACR
```

## Azure

```text
[ ] New revision exists
[ ] Revision is running
[ ] Correct image is deployed
[ ] Required secrets exist
[ ] Required environment variables exist
[ ] Database migration succeeds
[ ] Correct revision has traffic
[ ] /health returns 200
[ ] /docs is correct
[ ] CORS works
```

## Production

```text
[ ] Frontend loads
[ ] Authentication works
[ ] Dashboard works
[ ] Profile works
[ ] Complaints work
[ ] Images work
[ ] Password reset works
[ ] Email works
[ ] Direct route refresh works
```

---

# 39. Direct Push to Main

If this project is intentionally using direct pushes to `main`, use:

```bash
git pull origin main
git status
```

Make changes.

Then:

```bash
# test

git diff
git add .
git diff --cached
git commit -m "type: meaningful description"
git push origin main
```

After the push:

```text
DO NOT immediately assume deployment worked.
```

Check:

```text
GitHub Actions
      ↓
ACR
      ↓
Azure revision
      ↓
Traffic
      ↓
Backend
      ↓
Frontend
```

---

# 40. Recommended Feature Branch Workflow

The safer long-term workflow is:

```text
main
 │
 ├── feature/new-feature
 │       │
 │       ├── development
 │       ├── tests
 │       └── push
 │
 └──── Pull Request ────> main
```

Advantages:

- easier review
- safer production changes
- easier rollback
- cleaner history
- less chance of pushing broken code directly to production

---

# 41. Updating Documentation

When frontend architecture changes:

```text
FRONTEND.md
FRONTEND.docx
```

should be reviewed.

When backend/infrastructure changes:

```text
BACKEND.md
BACKEND.docx
```

should be reviewed.

When major engineering decisions change:

```text
PROJECT_DECISIONS_ARCHITECTURE_STUDENT.md
PROJECT_DECISIONS_ARCHITECTURE_LAYMAN.md
```

should be updated.

Keep the Word versions synchronized when documentation is finalized.

---

# 42. Things That Should Not Be Changed Casually

Avoid casually changing:

```text
Azure resource names
ACR configuration
Container Apps revision mode
traffic configuration
production secrets
database schema
migration history
JWT configuration
CORS configuration
storage configuration
GitHub Actions deployment configuration
Vercel routing configuration
```

Read the relevant documentation first.

---

# 43. Final Safe Workflow

When you want to deploy a new feature:

```text
1. Pull latest main
        ↓
2. Create feature branch
        ↓
3. Make changes
        ↓
4. Test locally
        ↓
5. Test frontend build
        ↓
6. Run backend tests
        ↓
7. Test Docker if backend changed
        ↓
8. Check migrations
        ↓
9. git status
        ↓
10. git diff
        ↓
11. git add
        ↓
12. git diff --cached
        ↓
13. git commit
        ↓
14. git push
        ↓
15. Watch GitHub Actions
        ↓
16. Verify ACR image
        ↓
17. Verify Azure revision
        ↓
18. Verify traffic
        ↓
19. Check /health
        ↓
20. Check /docs
        ↓
21. Test CORS
        ↓
22. Test frontend
        ↓
23. Test direct route refresh
        ↓
24. Test important user flows
        ↓
25. Only then call deployment complete
```

---

# 44. The Three Rules to Remember

If you forget everything else, remember these:

### Rule 1 — Review before pushing

```bash
git status
git diff
git diff --cached
```

Never blindly run:

```bash
git add .
git commit
git push
```

without reviewing the changes.

### Rule 2 — Verify Azure traffic

A new revision existing does not mean it is serving users.

Always check:

```bash
az containerapp revision list ...
az containerapp ingress traffic show ...
```

### Rule 3 — Production verification is mandatory

After deployment:

```text
/health
/docs
frontend
login
important user flows
```

must be tested.

---

# 45. Final Project State

The project uses:

```text
React + Vite
       │
       ▼
     Vercel
       │
       │ HTTPS
       ▼
FastAPI + Docker
       │
       ▼
Azure Container Apps
       │
       ├── PostgreSQL
       ├── Azure Blob Storage
       └── Brevo

GitHub
   │
   ▼
GitHub Actions
   │
   ├── Tests
   ├── Docker build
   ├── Trivy scan
   └── ACR / deployment
```

This gives the project:

- reproducible deployments
- versioned backend releases
- containerized runtime
- persistent database storage
- persistent file storage
- external email delivery
- automated testing
- container security scanning
- revision-based rollback
- documented operational procedures

---

# 46. Final Reminder

**Before every push:**

```text
TEST
  ↓
REVIEW
  ↓
STAGE
  ↓
REVIEW AGAIN
  ↓
COMMIT
  ↓
PUSH
  ↓
WATCH CI/CD
  ↓
VERIFY AZURE
  ↓
VERIFY PRODUCTION
```

Never skip the second review of staged changes.

Never assume the newest revision is serving production.

Never commit secrets.

Never delete the last known-good deployment until the new deployment has been verified.

If production breaks, stabilize first and investigate second.
