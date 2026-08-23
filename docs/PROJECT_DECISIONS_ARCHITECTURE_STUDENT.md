# Society Maintenance Tracker — Project Decisions, Architecture & Engineering Rationale

**Audience:** Student / interview / technical-project documentation  
**Project:** Society Maintenance Tracker  
**Frontend:** React + Vite  
**Backend:** FastAPI + Python 3.12  
**Database:** PostgreSQL  
**ORM:** SQLAlchemy  
**Containerization:** Docker  
**Container Registry:** Azure Container Registry (ACR)  
**Backend Hosting:** Azure Container Apps  
**Frontend Hosting:** Vercel  
**Object/File Storage:** Azure Blob Storage  
**Email:** Brevo  
**CI/CD:** GitHub Actions  
**Security scanning:** Trivy  
**Authentication:** JWT bearer authentication  
**Password recovery:** Email OTP + hashed OTP storage  
**Production frontend:** `https://society-maintenance-tracker-drona.vercel.app`  
**Production backend:** `https://society-backend.politefield-6b5113f7.centralindia.azurecontainerapps.io`  
**Primary Azure region used:** Central India  
**Document date:** 23 August 2026

---

## 1. Document purpose

This document records the important engineering decisions made while building and deploying Society Maintenance Tracker.

It is intended to serve as:

1. an architecture reference,
2. a decision log,
3. a deployment-learning record,
4. an interview preparation document, and
5. a future reconstruction guide.

The "why not X?" sections are engineering rationale based on this project's scale and constraints. They are not claims that alternatives are universally inferior.

---

## 2. Architecture overview

```text
                         ┌──────────────────────────────┐
                         │        Developer PC          │
                         │                              │
                         │ React/Vite + FastAPI         │
                         │ Docker + tests + CLI tools   │
                         └──────────────┬───────────────┘
                                        │
                                  git commit/push
                                        │
                                        v
                         ┌──────────────────────────────┐
                         │           GitHub              │
                         │       main branch             │
                         │ source + migrations + CI      │
                         └──────────────┬───────────────┘
                                        │
                                   workflow trigger
                                        │
                                        v
                         ┌──────────────────────────────┐
                         │       GitHub Actions          │
                         │                              │
                         │ pytest → Docker → Trivy       │
                         │ → ACR → migration/deploy     │
                         └──────────┬───────────┬───────┘
                                    │           │
                         frontend   │           │ backend image
                                    v           v
                         ┌──────────────┐   ┌──────────────┐
                         │    Vercel    │   │     ACR      │
                         │ React/Vite   │   │ Docker image │
                         └──────┬───────┘   └──────┬───────┘
                                │                  │
                                │ HTTPS            │ pull
                                v                  v
                         ┌────────────────────────────────┐
                         │       Azure Container Apps      │
                         │                                │
                         │ FastAPI + Uvicorn              │
                         │ External HTTPS ingress          │
                         │ CORS                            │
                         │ Revision management              │
                         │ Traffic control                  │
                         └──────────────┬─────────────────┘
                                        │
                 ┌──────────────────────┼─────────────────────┐
                 │                      │                     │
                 v                      v                     v
        ┌────────────────┐     ┌─────────────────┐    ┌─────────────┐
        │  PostgreSQL    │     │ Azure Blob      │    │   Brevo     │
        │ relational     │     │ object storage  │    │ transactional│
        │ application DB │     │ images/uploads  │    │ email        │
        └────────────────┘     └─────────────────┘    └─────────────┘

        Azure Container App secrets + managed identity
        provide protected runtime configuration/access.
```

---

## 3. Local-to-production synchronization model

The project follows a Git-centric delivery model.

```text
LOCAL DEVELOPMENT
       |
       | commit/push
       v
GITHUB MAIN
       |
       | workflow trigger
       v
GITHUB ACTIONS
       |
       +--> pytest
       +--> Docker build
       +--> container smoke test
       +--> Trivy
       +--> ACR push
       +--> migration/deployment
       |
       v
AZURE CONTAINER APPS
       |
       +--> new revision
       |
       +--> health verification
       |
       +--> traffic switch
       |
       v
PRODUCTION

Frontend:
LOCAL React → GitHub → Vercel → production SPA
```

The objective is reproducibility: a release should be generated from version-controlled source through a known pipeline rather than assembled manually.

---

## 4. Technology decisions

### 4.1 React + Vite

**Decision:** React for UI and Vite for development/build.

**Reasoning:**

- component-oriented UI
- fast development cycle
- straightforward build output
- good ecosystem
- easy deployment to Vercel
- appropriate complexity for a student project

**Trade-off:** React/Vite is primarily a client-side SPA. Route fallback and public SEO require explicit handling.

---

### 4.2 Why not Next.js?

Next.js provides SSR, static generation and framework-level routing.

Those are useful, especially for SEO-heavy public sites. However, the primary application is an authenticated dashboard/API client rather than a content publishing platform.

React + Vite therefore minimizes framework overhead.

The `/login` refresh issue demonstrated the main trade-off: the hosting layer must be configured for SPA fallback.

---

### 4.3 Vercel

**Decision:** Vercel for frontend deployment.

**Advantages:**

- Git integration
- automatic deployments
- preview environments
- HTTPS
- simple environment configuration
- low infrastructure maintenance

**Alternative:** Azure Static Web Apps would also fit. Vercel was selected because it provides a particularly direct React/Vite deployment workflow.

---

### 4.4 FastAPI + Uvicorn

**Decision:** FastAPI for the API, Uvicorn as the application server.

FastAPI provides:

- Pydantic validation
- dependency injection
- route organization
- automatic OpenAPI generation
- Swagger UI
- async support

The automatic `/docs` and `/openapi.json` endpoints were useful not only for API consumers but also for deployment verification.

**Alternative:** Express.js would have been equally viable. FastAPI aligns better with the project's Python/ML direction and reduces the amount of manual API schema/documentation work.

---

### 4.5 PostgreSQL

**Decision:** PostgreSQL.

The data model contains explicit relationships:

```text
User
 ├── Complaint
 │     └── Complaint History
 └── PasswordResetOTP

Notice
Admin/User relationships
```

PostgreSQL provides:

- ACID transactions
- foreign keys
- relational integrity
- indexing
- mature SQL tooling
- strong SQLAlchemy integration

**Alternative:** MongoDB would be reasonable for document-oriented data, but this application's domain is relational.

---

### 4.6 SQLAlchemy

SQLAlchemy was chosen as the database abstraction.

Benefits:

- Python-native models/queries
- transactions
- reusable database layer
- mature ecosystem
- migration compatibility

---

### 4.7 Docker

**Decision:** Dockerize the backend.

The container becomes the release artifact:

```text
Source
  +
Runtime
  +
Dependencies
  +
Startup configuration
  =
Versioned image
```

That image is tested locally and then stored in ACR.

This provides a much stronger local-to-production consistency model than installing dependencies independently on a cloud VM.

---

### 4.8 Azure Container Registry

**Decision:** ACR.

ACR is used as the private image registry:

```text
GitHub Actions
      ↓
Docker image
      ↓
ACR
      ↓
Container Apps
```

The registry is Azure-native and integrates naturally with the selected backend hosting model.

**Alternative:** Docker Hub. It would work, but ACR keeps image management within the Azure deployment boundary.

---

### 4.9 Azure Container Apps

**Decision:** Azure Container Apps.

This was selected as the backend runtime because the application is already a containerized FastAPI service and needs:

- external HTTPS ingress
- revisions
- controlled traffic
- managed runtime
- scaling options
- Azure secrets
- identity integration

**Alternative — VM:** too much OS/server administration for the project's scope.

**Alternative — AKS:** much greater operational complexity than required.

**Alternative — Azure Functions:** would require decomposing the existing FastAPI API into function-oriented handlers.

Container Apps is therefore a practical middle layer between "manage the server yourself" and "operate Kubernetes."

---

## 5. Data architecture

### 5.1 PostgreSQL

Structured data:

- users
- authentication-related records
- complaints
- complaint history
- notices
- reset records
- application metadata

### 5.2 Azure Blob Storage

Binary/object data:

- profile pictures
- complaint images
- persistent uploads

### 5.3 Brevo

External transactional email delivery.

This separation follows a common principle:

> Use the relational database for relational information and object storage for large binary objects.

---

## 6. Why images are not stored on the container

Container local storage is not a durable storage strategy.

Containers can be recreated during:

- deployment
- scaling
- failure recovery
- revision changes

Therefore:

```text
Container filesystem
       = ephemeral

Azure Blob Storage
       = persistent
```

This architecture also avoids putting large image blobs directly inside PostgreSQL.

---

## 7. Authentication architecture

The backend uses JWT bearer authentication.

```text
POST /api/auth/login
        |
        v
credential validation
        |
        v
JWT generation
        |
        v
frontend
        |
        v
Authorization: Bearer <token>
        |
        v
FastAPI authentication dependency
        |
        v
current user
```

JWT was selected because frontend and backend are independently deployed.

A traditional session-based architecture could work, but would typically require a server-side session store or equivalent shared state.

---

## 8. Password-reset architecture

The password reset implementation uses an email OTP.

```text
Forgot password
      ↓
Find account
      ↓
Generate OTP
      ↓
SHA-256 hash OTP
      ↓
Persist reset record
      ↓
Brevo sends email
      ↓
Verify OTP
      ↓
Update password
      ↓
Mark reset record used
```

Security decisions include:

- no plain OTP storage
- expiration
- previous unused OTP invalidation
- attempt limits
- generic forgot-password response
- password hashing before persistence

This is stronger than simply storing a raw six-digit code in the database.

---

## 9. CORS architecture

The browser sees:

```text
Origin:
https://society-maintenance-tracker-drona.vercel.app
```

The API is hosted at:

```text
https://society-backend.politefield-6b5113f7.centralindia.azurecontainerapps.io
```

Because the origins differ, CORS must be configured.

Final architecture:

```text
Browser
   |
   v
Azure ingress CORS
   |
   v
FastAPI CORSMiddleware
   |
   v
API
```

Both layers were verified during debugging.

Azure Container Apps also supports ingress-level CORS configuration. citeturn0search8turn0search2

---

## 10. Revision and release architecture

Azure Container Apps revisions provide versioned backend deployments.

The project moved to Multiple revision mode.

Example:

```text
Revision A → 100%
Revision B →   0%
```

After verification:

```text
Revision A → 0%
Revision B → 100%
```

This supports controlled releases and rollback.

Azure documents revisions as immutable/versioned application snapshots and supports explicit traffic allocation in multiple revision mode. citeturn0search0turn0search1

---

## 11. Why multiple revisions were important in this project

A new revision failed to activate.

If the deployment had simply replaced the working application, recovery would have been more difficult.

Instead:

```text
known-good revision
        |
        +---- 100% traffic

failed revision
        |
        +---- 0% traffic
```

The known-good version remained available.

This is a concrete reason revision management is more than an Azure feature to memorize: it provides an operational safety mechanism.

---

## 12. Incident: missing runtime secrets

The failing revision showed:

```text
ActivationFailed
```

The container logs indicated that Pydantic Settings could not construct the configuration because required variables were missing.

Required backend settings included:

```text
DATABASE_URL
JWT_SECRET
BREVO_API_KEY
EMAIL_FROM
```

The Azure Container App initially had the database and JWT secrets but did not yet have the Brevo-related secrets.

The fix:

```text
brevo-api-key
email-from
```

were added as Azure secrets, and a new revision was started.

### Engineering lesson

Application configuration is part of deployment.

A release is not just:

```text
Docker image
```

It is:

```text
Docker image
+
runtime configuration
+
secrets
+
database state
+
networking
```

---

## 13. Secret management decision

Actual secret values stay outside Git.

Repository:

```text
DATABASE_URL = required
JWT_SECRET = required
BREVO_API_KEY = required
EMAIL_FROM = required
```

Azure:

```text
actual secret values
```

Azure Container Apps supports application-level secrets that revisions can reference. citeturn0search3

---

## 14. Managed identity decision

Azure managed identity is used for appropriate Azure resource authentication.

Benefits:

- no embedded Azure credentials
- RBAC-based permissions
- Azure-managed identity lifecycle
- cleaner application configuration

Azure documents managed identities as a mechanism for authenticating to supported Azure services without managing credentials directly in application code. citeturn0search12turn0search5

---

## 15. CI/CD architecture

The intended release pipeline is:

```text
git push
   |
   v
GitHub Actions
   |
   +--> pytest
   |
   +--> Docker build
   |
   +--> container smoke test
   |
   +--> Trivy
   |
   +--> ACR push
   |
   +--> migration/deployment
   |
   v
Azure Container Apps
```

The frontend has a separate Git-to-Vercel deployment path.

---

## 16. Why GitHub Actions

GitHub Actions was chosen because:

- source is already on GitHub
- workflow files live with the repository
- no separate CI server is required
- secrets can be managed through GitHub
- deployments can be tied to commits

**Alternative — Jenkins:** powerful but requires operating Jenkins infrastructure.

**Alternative — Azure DevOps:** strong for enterprise Azure environments, but adds a separate platform when GitHub already provides repository-native CI/CD.

---

## 17. Why Trivy

The pipeline includes container vulnerability scanning.

The security sequence is:

```text
Build image
    ↓
Scan image
    ↓
Publish/deploy acceptable image
```

This makes the pipeline a basic DevSecOps workflow rather than a build-only pipeline.

---

## 18. Database migration decision

Migrations are part of the release lifecycle.

```text
Code change
   +
schema change
   |
   v
migration
   |
   v
deployment
```

A new application version should not assume an old database schema.

This is particularly important for production because the database persists independently of container revisions.

---

## 19. Local Docker testing incident

The production image was pulled locally and initially failed to start.

The reason was missing environment variables.

Once test values were provided:

```text
DATABASE_URL
JWT_SECRET
BREVO_API_KEY
EMAIL_FROM
```

the container remained running.

This established a local testing rule:

> Test the container with the same required configuration interface as production, but use safe test values.

---

## 20. Health-check strategy

The API exposes:

```text
GET /health
GET /health/db
```

Use:

```text
/health
```

to answer:

> Is the API process responding?

Use:

```text
/health/db
```

to answer:

> Can the API reach the database?

This creates a simple release gate.

---

## 21. OpenAPI verification

FastAPI generates:

```text
/docs
/openapi.json
```

These became operational verification tools.

For example:

```text
source code
  ↓
Docker image
  ↓
revision
  ↓
traffic
  ↓
openapi.json
```

If a newly implemented endpoint is absent from production OpenAPI, the investigation should include revision and traffic state.

This was exactly what happened with:

```text
/api/auth/forgot-password
/api/auth/verify-reset-otp
/api/auth/reset-password
```

The endpoints existed in the code/image but initially were not visible through the public production OpenAPI because the intended revision was not receiving traffic.

---

## 22. Incident: CORS debugging

The production API initially returned:

```text
HTTP 400
Disallowed CORS origin
```

The debugging process checked:

1. actual browser origin,
2. source `CORSMiddleware`,
3. Docker image contents,
4. active revision,
5. revision traffic,
6. Azure ingress configuration,
7. actual HTTP response headers.

Eventually the Azure ingress CORS policy was configured for:

```text
https://society-maintenance-tracker-drona.vercel.app
```

and the response returned:

```text
access-control-allow-origin:
https://society-maintenance-tracker-drona.vercel.app
```

The lesson is to trace the complete request path rather than assuming source code alone determines production behavior.

---

## 23. Incident: Vercel SPA routing

The application worked through navigation but direct `/login` refresh returned Vercel:

```text
404 NOT_FOUND
```

The cause was missing SPA fallback.

Fix:

```text
frontend/vercel.json
```

This is a hosting configuration issue rather than a React component issue.

---

## 24. Incident timeline summary

### CORS

Production browser requests were blocked. Source, image, revision, ingress and headers were checked. Azure ingress CORS was configured and verified.

### SPA routing

Direct `/login` failed. A Vercel rewrite to `index.html` fixed the issue.

### Password-reset endpoints

Endpoints existed in the source but were missing from production OpenAPI because traffic was not reaching the expected revision. A healthy revision containing the endpoints was deployed and traffic was moved to it.

### Activation failure

A revision failed because required Brevo configuration was missing. Azure secrets were added and a subsequent revision started successfully.

### Local container startup

The image failed without required environment variables. Test values were supplied and the container started.

---

## 25. Technology decision matrix

| Area | Selected | Rationale |
|---|---|---|
| UI | React | reusable component architecture |
| Build | Vite | fast/simple SPA tooling |
| Frontend hosting | Vercel | Git-native frontend deployment |
| API | FastAPI | Python + validation + OpenAPI |
| Server | Uvicorn | ASGI runtime for FastAPI |
| DB | PostgreSQL | relational domain |
| ORM | SQLAlchemy | Python database layer |
| Container | Docker | reproducible artifact |
| Registry | ACR | Azure-native registry |
| Backend runtime | Container Apps | managed containers + revisions |
| File storage | Blob Storage | persistent object storage |
| Email | Brevo | transactional delivery |
| Auth | JWT | SPA/API bearer model |
| Reset | OTP | email verification |
| CI/CD | GitHub Actions | repository-native automation |
| Security | Trivy | container vulnerability scanning |
| Secrets | ACA secrets | no credentials in Git |
| Azure access | Managed identity | credential-free Azure auth |
| Source control | GitHub | history + release traceability |

---

## 26. Why the architecture is appropriate for a student project

The architecture is intentionally between two extremes.

### Too simple

```text
Laptop
  ↓
manual upload
  ↓
one server
```

Problems:

- hard to reproduce
- weak rollback
- manual mistakes
- poor separation of concerns
- no real CI/CD

### Too complex

```text
Kubernetes
+ service mesh
+ multiple microservices
+ queues
+ API gateway
+ dedicated observability stack
+ separate CI server
```

Problems:

- excessive operational burden
- more failure points
- difficult to explain
- unnecessary for current scale

### Current approach

```text
React/Vite
+
FastAPI
+
PostgreSQL
+
Docker
+
GitHub Actions
+
Vercel
+
Azure Container Apps
+
Blob Storage
```

This provides meaningful production engineering without unnecessary infrastructure.

---

## 27. What would change at larger scale

Potential additions:

- Azure Front Door
- Azure Key Vault
- centralized application monitoring
- distributed tracing
- rate limiting
- background workers
- queues
- staging environment
- blue-green deployment automation
- automated rollback gates
- custom domain
- API versioning
- stronger automated UI tests

These should be requirement-driven.

---

## 28. Deployment procedure

### Before push

```text
[ ] tests pass
[ ] frontend builds
[ ] migration reviewed
[ ] secrets identified
[ ] Docker build works
[ ] no secrets committed
```

### After push

```text
[ ] GitHub Actions succeeds
[ ] Docker image exists in ACR
[ ] migration succeeds
[ ] Azure revision is Running
[ ] /health = 200
[ ] /health/db = healthy
[ ] expected OpenAPI endpoints exist
[ ] expected revision has traffic
[ ] frontend can authenticate
```

### After deployment

Keep the previous known-good revision until confidence is established.

---

## 29. Rollback procedure

```text
Identify known-good revision
          ↓
Set it to 100% traffic
          ↓
Verify /health
          ↓
Verify frontend
          ↓
Investigate failed revision
          ↓
Fix
          ↓
Deploy new revision
```

Example:

```bash
az containerapp ingress traffic set \
  --name society-backend \
  --resource-group society-maintenance-rg \
  --revision-weight <KNOWN_GOOD_REVISION>=100
```

Azure supports explicit revision traffic weights for this type of controlled release/rollback. citeturn0search1turn0search6

---

## 30. What belongs where

```text
GitHub
 ├── source
 ├── migrations
 ├── GitHub Actions
 └── documentation

Vercel
 └── frontend build

ACR
 └── versioned Docker images

Azure Container Apps
 ├── FastAPI runtime
 ├── ingress
 ├── revisions
 ├── traffic
 └── runtime configuration

PostgreSQL
 └── structured application data

Azure Blob Storage
 └── uploaded images/files

Brevo
 └── transactional email

Azure secrets
 └── sensitive runtime values
```

---

## 31. Things deliberately not selected

The project did not require:

- Kubernetes/AKS
- manually managed VMs
- Jenkins
- self-hosted SMTP
- MongoDB
- local persistent upload storage
- a microservice architecture
- a service mesh
- a custom API gateway

The reason is not that these technologies are bad. The reason is that they solve problems the current application does not yet have.

---

## 32. Core engineering principles established

### Reproducibility

The same source revision should produce a traceable release artifact.

### Separation of concerns

Frontend, API, database, object storage and email have distinct responsibilities.

### Persistence outside containers

Application files that must survive deployment belong in external storage.

### Secrets outside Git

Repository code describes configuration requirements; secret stores hold secret values.

### Verify before switching traffic

A new revision should be healthy before it receives production traffic.

### Keep rollback available

Do not destroy the known-good release before validating the new one.

### Automate repetitive release steps

Tests, image building, scanning and deployment should not depend on remembering a manual sequence.

---

## 33. Interview explanation

> I developed a React/Vite frontend and FastAPI backend for a society maintenance-management platform. The frontend is deployed on Vercel and the backend is containerized with Docker and deployed on Azure Container Apps. PostgreSQL handles relational data, Azure Blob Storage handles persistent uploads, and Brevo handles transactional email. GitHub Actions runs the automated release pipeline, including tests, Docker build, Trivy scanning, ACR publishing and deployment/migration steps. Azure Container Apps revisions provide controlled rollout and rollback. Secrets are kept outside Git using Azure Container App secrets, and managed identity is used for Azure resource access where appropriate.

---

## 34. Skills demonstrated by the project

This project provides practical exposure to:

- React
- Vite
- REST API design
- FastAPI
- Pydantic
- SQLAlchemy
- PostgreSQL
- JWT
- password-reset security
- Docker
- Git
- GitHub
- GitHub Actions
- CI/CD
- Trivy
- Azure Container Registry
- Azure Container Apps
- revisions
- traffic management
- CORS
- Azure Blob Storage
- managed identity
- secret management
- transactional email
- Vercel
- SPA deployment
- production debugging
- rollback

---

## 35. Final assessment

The project has moved beyond:

```text
"it works on my laptop"
```

toward:

```text
"the application has a reproducible release path and documented operational model"
```

The important achievement is not that every enterprise feature exists. It is that the architecture has clear boundaries, versioned releases, automated validation, persistent data, protected secrets, cloud hosting and a practical rollback strategy.

---

## 36. References

The most relevant official Azure documentation covers Container Apps revisions, traffic splitting, ingress/CORS, secrets and managed identities.

Azure describes revisions as versioned/immutable snapshots and documents multiple revision mode for controlled deployment workflows. citeturn0search0

Azure documents weighted traffic splitting between revisions for controlled rollout and blue-green/A/B-style scenarios. citeturn0search1

Azure Container Apps supports application-level secrets and managed identity-based authentication to supported Azure resources. citeturn0search3turn0search12

---

# End of document
