# Society Maintenance Tracker — Backend Documentation

**Backend:** FastAPI  
**Runtime:** Python 3.12  
**Database:** PostgreSQL  
**Container:** Docker  
**Registry:** Azure Container Registry  
**Hosting:** Azure Container Apps  
**Storage:** Azure Blob Storage  
**Email:** Brevo  
**Production backend:** `https://society-backend.politefield-6b5113f7.centralindia.azurecontainerapps.io`  
**Last documented:** 23 August 2026

---

## 1. Purpose

The backend is the API and business-logic layer of Society Maintenance Tracker.

It provides:

- Authentication
- JWT authorization
- User profiles
- Password reset/OTP flow
- Complaint management
- Complaint history
- Complaint image storage/retrieval
- Notices
- Dashboard/admin functionality
- Health checks
- Database connectivity
- Email integration
- Azure Blob Storage integration

The API is built with FastAPI and served with Uvicorn.

---

## 2. Technology Stack

- Python 3.12
- FastAPI
- Uvicorn
- SQLAlchemy
- PostgreSQL
- Pydantic / Pydantic Settings
- JWT authentication
- Docker
- Azure Container Registry
- Azure Container Apps
- Azure Blob Storage
- Managed Identity
- Brevo email API
- GitHub Actions
- Trivy security scanning

---

## 3. Backend Structure

The backend uses an application package similar to:

```text
backend/
└── app/
    ├── main.py
    ├── core/
    │   ├── config.py
    │   ├── database.py
    │   └── security.py
    ├── models/
    │   ├── user.py
    │   ├── password_reset.py
    │   └── ...
    ├── routers/
    │   ├── auth.py
    │   ├── complaints.py
    │   ├── admin.py
    │   ├── notices.py
    │   └── dashboard.py
    ├── schemas/
    │   ├── auth.py
    │   └── ...
    └── services/
        ├── email.py
        ├── storage.py
        └── ...
```

The exact file list may change as the project evolves.

---

## 4. Application Entry Point

The FastAPI application is created in:

```text
backend/app/main.py
```

The application:

- creates the FastAPI instance
- mounts `/uploads`
- configures CORS
- includes routers
- exposes `/health`
- exposes `/health/db`

Current health endpoint:

```text
GET /health
```

Expected:

```json
{
  "status": "healthy",
  "service": "society-maintenance-tracker"
}
```

Database health:

```text
GET /health/db
```

---

## 5. API Documentation

Swagger UI:

```text
https://society-backend.politefield-6b5113f7.centralindia.azurecontainerapps.io/docs
```

OpenAPI:

```text
https://society-backend.politefield-6b5113f7.centralindia.azurecontainerapps.io/openapi.json
```

Use `/openapi.json` when checking whether a newly deployed revision actually contains an endpoint.

For example:

```bash
curl -s \
  "https://society-backend.politefield-6b5113f7.centralindia.azurecontainerapps.io/openapi.json" \
  | grep -Eo 'forgot-password|verify-reset-otp|reset-password' \
  | sort -u
```

---

## 6. Authentication API

Current authentication routes include:

```text
POST  /api/auth/register
POST  /api/auth/login
GET   /api/auth/me
PATCH /api/auth/profile
POST  /api/auth/profile-picture
POST  /api/auth/forgot-password
POST  /api/auth/verify-reset-otp
POST  /api/auth/reset-password
```

The exact request/response schemas should always be checked in Swagger/OpenAPI before integrating a new client.

---

## 7. Password Reset Flow

The backend implements an OTP-based password reset flow.

Conceptually:

```text
Forgot password
      ↓
Generate OTP
      ↓
Hash OTP
      ↓
Store reset record
      ↓
Send email
      ↓
Verify OTP
      ↓
Reset password
      ↓
Invalidate reset record
```

Security characteristics already implemented include:

- OTP is hashed before storage
- previous unused OTPs are invalidated
- OTPs expire
- failed verification attempts are limited
- password reset does not reveal whether an email exists

Never log the actual OTP or reset secrets in production.

---

## 8. Configuration

`backend/app/core/config.py` uses Pydantic Settings.

Required:

```text
DATABASE_URL
JWT_SECRET
BREVO_API_KEY
EMAIL_FROM
```

Optional/defaulted:

```text
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
COMPLAINT_OVERDUE_DAYS=3
TEST_DATABASE_URL=<optional>
```

Azure-specific environment values currently include:

```text
AZURE_STORAGE_ACCOUNT
AZURE_STORAGE_CONTAINER
AZURE_CLIENT_ID
```

Do not commit secret values.

---

## 9. Azure Container App Configuration

Current resource:

```text
Resource Group:
society-maintenance-rg

Container App:
society-backend

ACR:
societymaintenanceacr.azurecr.io

Container image:
society-maintenance-tracker:<commit-sha>
```

The application listens on:

```text
8000
```

Azure ingress is external and targets port 8000.

---

## 10. Azure Secrets

Current Container App secret names include:

```text
database-url
jwt-secret
brevo-api-key
email-from
```

Secret values must never be written into Git, documentation, screenshots, or chat transcripts.

To inspect secret names:

```bash
az containerapp secret list \
  --name society-backend \
  --resource-group society-maintenance-rg \
  -o table
```

To update secrets:

```bash
az containerapp secret set \
  --name society-backend \
  --resource-group society-maintenance-rg \
  --secrets \
    brevo-api-key="$BREVO_API_KEY" \
    email-from="$EMAIL_FROM"
```

Azure may require a new revision/restart for secret changes to take effect.

---

## 11. Important Lesson: Required Secrets Must Match Code

The backend's `Settings` class requires:

```text
DATABASE_URL
JWT_SECRET
BREVO_API_KEY
EMAIL_FROM
```

If a container starts without one of these values, Pydantic Settings can fail during application import.

This caused a real Azure revision failure in this project:

```text
ActivationFailed
```

because the newer revision did not initially have the Brevo-related secrets.

### Rule

Whenever a new required setting is added to `config.py`:

1. Add it to local `.env.example`.
2. Add the corresponding Azure secret/environment configuration.
3. Update deployment documentation.
4. Test a container startup.
5. Only then rely on production deployment.

---

## 12. CORS

FastAPI uses `CORSMiddleware`.

The production frontend origin is:

```text
https://society-maintenance-tracker-drona.vercel.app
```

Azure Container Apps ingress also has a CORS policy configured for the production frontend.

Test:

```bash
curl -i \
  "https://society-backend.politefield-6b5113f7.centralindia.azurecontainerapps.io/health" \
  -H "Origin: https://society-maintenance-tracker-drona.vercel.app"
```

A valid production response should contain:

```text
access-control-allow-origin: https://society-maintenance-tracker-drona.vercel.app
```

If changing the frontend domain, update both application and Azure ingress CORS configuration.

---

## 13. Azure Revision Model

The Container App can use multiple revisions.

Useful command:

```bash
az containerapp revision list \
  --name society-backend \
  --resource-group society-maintenance-rg \
  --query "[].{name:name,active:properties.active,traffic:properties.trafficWeight,running:properties.runningState,image:properties.template.containers[0].image}" \
  -o table
```

A safe deployment pattern is:

```text
Old revision
    ↓
New revision created
    ↓
New revision starts successfully
    ↓
Health/OpenAPI checked
    ↓
Traffic moved to new revision
```

---

## 14. Switching Traffic

If the application is in Multiple revision mode:

```bash
az containerapp ingress traffic set \
  --name society-backend \
  --resource-group society-maintenance-rg \
  --revision-weight <REVISION_NAME>=100
```

Example:

```bash
az containerapp ingress traffic set \
  --name society-backend \
  --resource-group society-maintenance-rg \
  --revision-weight society-backend--0000017=100
```

Check:

```bash
az containerapp ingress traffic show \
  --name society-backend \
  --resource-group society-maintenance-rg \
  -o table
```

### Rollback

If the new revision is broken:

```bash
az containerapp ingress traffic set \
  --name society-backend \
  --resource-group society-maintenance-rg \
  --revision-weight <KNOWN_GOOD_REVISION>=100
```

Then verify:

```bash
curl -i \
  "https://society-backend.politefield-6b5113f7.centralindia.azurecontainerapps.io/health"
```

---

## 15. Do Not Delete a Broken Revision First

If a new revision fails:

1. Keep the known-good revision.
2. Move traffic back to the known-good revision.
3. Inspect the failed revision.
4. Fix configuration/code.
5. Deploy again.
6. Test the new revision.
7. Move traffic only after validation.

A failed revision does not need to receive traffic.

---

## 16. Local Docker Validation

Build:

```bash
docker build -t society-maintenance-tracker:local .
```

Run with required test environment variables:

```bash
docker run -d \
  --name society-backend-test \
  -p 8001:8000 \
  -e DATABASE_URL="postgresql+psycopg://test:test@localhost:5432/test" \
  -e JWT_SECRET="test-secret" \
  -e BREVO_API_KEY="test-key" \
  -e EMAIL_FROM="test@example.com" \
  society-maintenance-tracker:local
```

Check:

```bash
docker ps
docker logs society-backend-test
```

Health:

```bash
curl -i http://localhost:8001/health
```

CORS:

```bash
curl -i \
  "http://localhost:8001/health" \
  -H "Origin: https://society-maintenance-tracker-drona.vercel.app"
```

Remove:

```bash
docker rm -f society-backend-test
```

---

## 17. Azure Container Image Verification

Check which image is receiving traffic:

```bash
az containerapp show \
  --name society-backend \
  --resource-group society-maintenance-rg \
  --query "properties.template.containers[0].image" \
  -o tsv
```

The image tag is based on the Git commit SHA.

This is useful for proving that a specific commit reached Azure.

---

## 18. Database Migrations

The project includes automated deployment/migration work in CI.

Before changing database models:

1. Understand the current schema.
2. Create/review the migration.
3. Test the migration locally where possible.
4. Commit migration files with the code.
5. Push.
6. Watch CI.
7. Confirm the migration succeeds.
8. Confirm the application revision starts.

Never casually delete or rewrite an already-applied production migration.

If a migration fails, fix the migration/database state rather than repeatedly redeploying blindly.

---

## 19. Azure Storage

Complaint/profile image persistence uses Azure Blob Storage.

Current configuration:

```text
Storage account:
societymntstorage2026

Container:
uploads
```

The backend uses:

```text
AZURE_STORAGE_ACCOUNT
AZURE_STORAGE_CONTAINER
AZURE_CLIENT_ID
```

The managed identity/client ID is used for Azure access rather than placing a storage account key in frontend code.

---

## 20. Health Checks

Basic:

```bash
curl -i \
  "https://society-backend.politefield-6b5113f7.centralindia.azurecontainerapps.io/health"
```

Database:

```bash
curl -i \
  "https://society-backend.politefield-6b5113f7.centralindia.azurecontainerapps.io/health/db"
```

Use `/health` first when diagnosing an application startup problem.

Use `/health/db` when specifically testing database connectivity.

---

## 21. Troubleshooting

### Revision shows `ActivationFailed`

Check:

```bash
az containerapp revision list \
  --name society-backend \
  --resource-group society-maintenance-rg \
  -o table
```

Then inspect revision logs/replicas where available.

Common causes:

- missing required environment variable
- missing secret
- bad database URL
- application import failure
- container startup command failure
- image/configuration issue

First compare the failing revision's environment configuration against the previous working revision.

---

### New endpoints are missing from Swagger

Check which revision has traffic:

```bash
az containerapp ingress traffic show \
  --name society-backend \
  --resource-group society-maintenance-rg \
  -o table
```

Then check the active revision image.

If necessary, retrieve the revision-specific FQDN and inspect:

```text
/openapi.json
```

This project previously had a situation where password-reset endpoints existed in the image but were absent from the public Swagger because the old revision still had traffic.

---

### CORS error

Check:

```bash
curl -i \
  "https://society-backend.politefield-6b5113f7.centralindia.azurecontainerapps.io/health" \
  -H "Origin: https://society-maintenance-tracker-drona.vercel.app"
```

Expected:

```text
access-control-allow-origin: https://society-maintenance-tracker-drona.vercel.app
```

Also check Azure:

```bash
az containerapp show \
  --name society-backend \
  --resource-group society-maintenance-rg \
  --query "properties.configuration.ingress" \
  -o yaml
```

---

### Container works in Azure but fails locally

This can happen because Azure injects secrets/environment variables that are not present in a local `docker run`.

If the log says:

```text
ValidationError
Field required
```

check `config.py` and provide every required setting to the local container.

---

## 22. Security Rules

Never commit:

```text
.env
DATABASE_URL
JWT_SECRET
BREVO_API_KEY
storage credentials
Azure service principal credentials
private keys
```

Use:

- local `.env` for development
- Vercel Environment Variables for frontend configuration
- Azure Container App secrets for backend secrets
- managed identity for Azure resources where supported

The frontend must never receive backend secrets.

---

## 23. Backend Deployment Checklist

Before deployment:

```text
[ ] Tests pass
[ ] Migration reviewed
[ ] Docker build succeeds
[ ] Required settings identified
[ ] Azure secrets exist
[ ] No secrets committed
[ ] CORS origin is correct
```

After deployment:

```text
[ ] New revision Provisioned
[ ] New revision Running
[ ] /health = 200
[ ] /health/db = healthy
[ ] /openapi.json contains expected endpoints
[ ] Correct image SHA is deployed
[ ] Correct revision receives traffic
[ ] Frontend can reach API
[ ] Authentication works
[ ] Password reset works
[ ] File uploads work
```

---

## 24. Safe Production Deployment Procedure

Use this order every time:

```text
1. Make code change
2. Run tests
3. Review git diff
4. Check migration if database changed
5. Push to main
6. Watch GitHub Actions
7. Confirm image pushed to ACR
8. Confirm Azure revision created
9. Confirm revision is Running
10. Verify required secrets/config
11. Test revision health
12. Test revision OpenAPI
13. Move traffic to new revision
14. Test production API
15. Test frontend critical flow
16. Keep previous revision available until confident
```

Do not skip directly from `git push` to assuming production is healthy.

---

## 25. Emergency Rollback

If production breaks immediately after deployment:

```bash
az containerapp revision list \
  --name society-backend \
  --resource-group society-maintenance-rg \
  -o table
```

Identify the previous known-good revision.

Switch traffic:

```bash
az containerapp ingress traffic set \
  --name society-backend \
  --resource-group society-maintenance-rg \
  --revision-weight <KNOWN_GOOD_REVISION>=100
```

Verify:

```bash
curl -i \
  "https://society-backend.politefield-6b5113f7.centralindia.azurecontainerapps.io/health"
```

Then investigate the failed revision before attempting another production deployment.

---

## 26. Final Backend Checklist

```text
[ ] API health works
[ ] Database health works
[ ] Authentication works
[ ] Password reset works
[ ] Email works
[ ] Profile image works
[ ] Complaint images work
[ ] Complaint history works
[ ] Admin endpoints work
[ ] Notices work
[ ] CORS works
[ ] Required secrets exist
[ ] Current revision is healthy
[ ] Correct revision has 100% traffic
[ ] CI/CD succeeds
[ ] Database migration succeeds
[ ] Previous revision available for rollback
```

---

## 27. Most Important Operational Rules

### Rule 1 — Never deploy blindly

Always check the revision after deployment.

### Rule 2 — Never delete the known-good revision before validating the new one

Rollback is much easier when the old revision still exists.

### Rule 3 — Every required setting must exist in production

Adding:

```python
NEW_REQUIRED_SETTING: str
```

to `Settings` without configuring Azure can make the whole container fail to start.

### Rule 4 — Verify OpenAPI after deployment

It is a quick way to confirm that the expected code is actually serving traffic.

### Rule 5 — Treat migrations as production changes

Database migrations cannot simply be treated like ordinary source-code edits.

### Rule 6 — Never store secrets in Git

Use Azure secrets or the appropriate deployment platform's secret store.

---

# Quick Reference

## Frontend

```text
Production:
https://society-maintenance-tracker-drona.vercel.app

Vercel root:
frontend

SPA config:
frontend/vercel.json
```

## Backend

```text
Production:
https://society-backend.politefield-6b5113f7.centralindia.azurecontainerapps.io

Swagger:
/docs

OpenAPI:
/openapi.json

Health:
/health

Database health:
/health/db
```

## Azure

```text
Resource Group:
society-maintenance-rg

Container App:
society-backend

ACR:
societymaintenanceacr.azurecr.io

Storage Account:
societymntstorage2026

Storage Container:
uploads
```

---

**End of documentation.**
