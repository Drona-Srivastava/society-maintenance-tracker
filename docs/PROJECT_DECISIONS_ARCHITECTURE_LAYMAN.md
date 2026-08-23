# Society Maintenance Tracker — Project Decisions & Architecture (Layman Version)

**Purpose:** A complete, plain-English record of what was built, why the major choices were made, how everything connects, and how a future deployment should work.

**Project:** Society Maintenance Tracker  
**Frontend:** React + Vite  
**Backend:** FastAPI + Python  
**Database:** PostgreSQL  
**Frontend hosting:** Vercel  
**Backend hosting:** Azure Container Apps  
**Container registry:** Azure Container Registry (ACR)  
**File storage:** Azure Blob Storage  
**Email:** Brevo  
**Source control / CI:** GitHub + GitHub Actions  
**Production frontend:** `https://society-maintenance-tracker-drona.vercel.app`  
**Production backend:** `https://society-backend.politefield-6b5113f7.centralindia.azurecontainerapps.io`  
**Document date:** 23 August 2026

---

## 1. What this project is

Society Maintenance Tracker is a web application for managing maintenance activities in a residential society.

A resident can create an account, log in, recover a forgotten password, manage their profile, upload a profile picture, submit maintenance complaints, attach complaint images, see complaint status/history, and view notices.

An administrator can manage operational information such as complaints, notices and dashboard information.

The important decision was to make this a real deployed application rather than only a local college project. The system therefore has a real frontend, API, database, persistent file storage, email delivery, automated builds and a documented rollback path.

---

## 2. The whole system in simple terms

Think of the application like a society office.

```text
Resident's phone/laptop
        |
        v
     Website
        |
        v
   Backend/API
     /     \
    v       v
 Database   File Storage
    |
    v
   Email service
```

The website is what residents see.

The backend is the office worker that receives requests and decides what should happen.

The database is the filing cabinet.

Blob Storage is the cupboard for large files such as images.

Brevo is the postman for application emails.

GitHub is the source-code cupboard.

GitHub Actions is the automated worker that tests and packages the application.

Vercel serves the website.

Azure Container Apps runs the backend.

---

## 3. High-level architecture

```text
                         DEVELOPMENT / SOURCE
┌───────────────────┐       ┌──────────────┐       ┌──────────────────┐
│ Developer Laptop  │ ────> │ GitHub       │ ────> │ GitHub Actions   │
│ React + FastAPI   │ git   │ main branch  │       │ Test / Build     │
│ Docker / tests    │       └──────────────┘       │ Scan / Deploy    │
└───────────────────┘                              └────────┬─────────┘
                                                           |
                                      ┌────────────────────┴─────────────┐
                                      v                                  v
                              ┌─────────────────┐                ┌──────────────┐
                              │ Azure Container  │                │ Vercel       │
                              │ Registry (ACR)   │                │ Frontend     │
                              │ Docker images     │                │ React/Vite   │
                              └────────┬──────────┘                └──────┬───────┘
                                       |                                  |
                                       v                                  |
                              ┌────────────────────┐                       |
                              │ Azure Container    │ <─────────────────────┘
                              │ Apps               │      HTTPS API
                              │ FastAPI/Uvicorn    │
                              │ Revisions/Traffic  │
                              └──────┬─────┬───────┘
                                     |     |     |
                         ┌───────────┘     |     └─────────────┐
                         v                 v                   v
                  ┌────────────┐   ┌──────────────┐   ┌────────────┐
                  │ PostgreSQL │   │ Azure Blob   │   │ Brevo      │
                  │ application│   │ images/files │   │ emails     │
                  │ data       │   │              │   │            │
                  └────────────┘   └──────────────┘   └────────────┘
```

The application also uses Azure Container App secrets and managed identity for sensitive configuration and Azure resource access.

---

## 4. How local development stays synchronized with production

The local machine is where code is written and tested. GitHub is the common source of truth. Production is not manually copied from the laptop.

```text
LOCAL CODE
   |
   | git add / commit / push
   v
GITHUB MAIN
   |
   | workflow trigger
   v
GITHUB ACTIONS
   |
   +--> tests
   +--> Docker build
   +--> Trivy security scan
   +--> ACR push
   +--> migration/deployment
   |
   v
AZURE BACKEND

LOCAL FRONTEND
      |
      v
GITHUB MAIN
      |
      v
VERCEL
      |
      v
PRODUCTION FRONTEND
```

This is safer than manually uploading files to a server because the deployed version can be traced back to source control.

---

## 5. Why GitHub is the source of truth

Git gives us history, rollback, collaboration, branch management and traceability.

Backend images use Git commit SHA values as release identifiers. This means a deployed image can be connected to the exact source revision that produced it.

Using a commit-based tag is safer than relying only on a floating `latest` tag.

---

## 6. Why React + Vite was chosen

React provides component-based UI development. Vite provides a fast development server and build system.

Advantages:

- fast local development
- reusable components
- simple builds
- large ecosystem
- easy Vercel deployment
- relatively small configuration footprint

A framework such as Next.js could provide server-side rendering and more built-in SEO capabilities, but the main product is an authenticated dashboard rather than a content-heavy website. React + Vite keeps the project easier to understand at student scale.

The trade-off is that SPA routing and public-page SEO need explicit configuration.

---

## 7. Why Vercel was chosen

Vercel is a strong fit for the React/Vite frontend.

Advantages:

- Git-based deployments
- HTTPS
- preview deployments
- environment variables
- low infrastructure management
- simple static/SPA hosting

Azure Static Web Apps would also have been valid. Vercel was chosen because it gives a particularly simple frontend deployment workflow while Azure remains responsible for the backend/data side.

---

## 8. The Vercel routing problem

Initially the root URL worked, but directly opening or refreshing `/login` returned:

```text
404 NOT_FOUND
```

The problem was not the React login page. The hosting layer was receiving `/login` as a server path.

The fix was:

```text
frontend/vercel.json
```

with a rewrite to:

```text
/index.html
```

The request then becomes:

```text
GET /login
    ↓
index.html
    ↓
React application
    ↓
React Router
    ↓
Login page
```

This is an important lesson: a browser-side route still needs hosting-layer fallback support.

---

## 9. Why FastAPI was chosen

FastAPI provides Python, request validation, dependency injection, clean API routing and automatic OpenAPI/Swagger documentation.

The `/docs` and `/openapi.json` endpoints were especially useful during deployment debugging because they showed which endpoints were actually present in the revision receiving traffic.

Express/Node would also have worked, but FastAPI fits well with Python and the project's wider ML interests.

---

## 10. Why PostgreSQL was chosen

The application has strongly related data:

```text
User
 ├── Complaints
 │     └── History
 └── Password reset records

Admin
 └── Notices
```

PostgreSQL is a natural fit because it provides relational integrity, transactions, SQL, mature tooling and strong SQLAlchemy support.

MongoDB would also be possible, but the application's relationships are clearer in a relational model.

---

## 11. Why SQLAlchemy was used

SQLAlchemy provides the database abstraction between Python and PostgreSQL.

Advantages include:

- reusable models
- structured queries
- transactions
- database abstraction
- integration with migration tooling

---

## 12. Why Docker was chosen

Docker packages the application and runtime dependencies into one artifact:

```text
Application
+
Python runtime
+
Dependencies
+
Startup command
=
Container image
```

The same image can be tested locally, pushed to ACR and run by Azure Container Apps.

This reduces "works on my machine" differences.

---

## 13. Why Azure Container Registry was chosen

ACR stores the backend Docker images.

The flow is:

```text
GitHub Actions
      |
      v
Docker image
      |
      v
Azure Container Registry
      |
      v
Azure Container Apps
```

ACR was chosen because it integrates naturally with the Azure deployment environment. Docker Hub would also work, but ACR keeps the registry close to the backend infrastructure.

---

## 14. Why Azure Container Apps was chosen

Container Apps is a middle ground between a manually managed virtual machine and a full Kubernetes platform.

It provides:

- container execution
- HTTPS ingress
- revisions
- traffic control
- scaling options
- secrets
- Azure integration

A VM would require operating-system, reverse-proxy, TLS and process management. AKS would introduce Kubernetes cluster management that is unnecessary for one student project. Azure Functions would require restructuring the cohesive FastAPI API into separate functions.

---

## 15. Why Azure Blob Storage was chosen for images

Images are not treated as permanent container files.

The database stores metadata and the actual file lives in Blob Storage:

```text
PostgreSQL → metadata
Blob Storage → image bytes
```

This is preferable to putting large binaries into PostgreSQL or relying on container-local storage.

Container filesystems can disappear when containers are replaced, so persistent uploads belong in external object storage.

---

## 16. Why Brevo was chosen

Brevo handles transactional email, especially password-reset emails.

The backend generates the OTP and sends it through Brevo.

Running an SMTP server would introduce deliverability, DNS, reputation and maintenance work that is unnecessary for this project.

The Brevo API key belongs in backend secrets, never in the frontend.

---

## 17. Why JWT authentication was chosen

The backend uses bearer-token authentication:

```text
Login
  ↓
Validate credentials
  ↓
Create JWT
  ↓
Frontend
  ↓
Authorization header
  ↓
Protected API
```

JWT is a reasonable fit for a separately deployed React SPA and API.

Traditional server-side sessions could also work, but JWT avoids requiring a session store for every authenticated request.

---

## 18. Password reset decision

The reset flow is:

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

Security measures include OTP hashing, expiration, invalidation of previous unused OTPs, attempt limits and a generic forgot-password response that does not reveal whether an account exists.

---

## 19. CORS decision

The frontend and backend have different origins:

```text
Vercel frontend
        |
        v
Azure API
```

The browser therefore requires explicit CORS permission.

The final setup uses:

```text
FastAPI CORSMiddleware
+
Azure Container Apps ingress CORS
```

The production frontend origin is:

```text
https://society-maintenance-tracker-drona.vercel.app
```

The final configuration was verified using `curl` with an `Origin` header.

---

## 20. Azure revision decision

A revision represents a deployed version of the backend.

The project eventually used Multiple revision mode so traffic could be explicitly controlled.

Example:

```text
Old revision → 0%
New revision → 100%
```

If the new revision fails:

```text
Old revision → 100%
New revision → 0%
```

This makes rollback practical.

---

## 21. Failed revision incident

A revision entered:

```text
ActivationFailed
```

The working revision was kept alive instead of being deleted.

The failing container logs showed missing configuration required by Pydantic Settings:

```text
DATABASE_URL
JWT_SECRET
BREVO_API_KEY
EMAIL_FROM
```

The existing Azure secrets included the database and JWT secrets, but the Brevo-related secrets had not yet been configured.

The missing secrets were added, after which a new revision started successfully.

The lesson is important:

> A correct Docker image can still fail in Azure if required runtime configuration is missing.

---

## 22. Why Azure secrets are used

Actual values for:

```text
DATABASE_URL
JWT_SECRET
BREVO_API_KEY
EMAIL_FROM
```

must not be committed to Git.

The code knows the names; Azure stores the values.

This separates:

```text
configuration contract
```

from:

```text
secret value
```

---

## 23. Why managed identity is used

Managed identity lets Azure workloads authenticate to supported Azure resources without embedding long-lived credentials in application code.

The project uses an Azure client identity for relevant Azure resource access.

This is safer and easier to manage than hard-coded storage credentials.

---

## 24. Why GitHub Actions was chosen

The repository already lives on GitHub, so GitHub Actions provides a natural CI/CD system.

The intended sequence is:

```text
Push
 ↓
Tests
 ↓
Docker build
 ↓
Container smoke test
 ↓
Trivy scan
 ↓
ACR push
 ↓
Migration/deployment
 ↓
Azure revision
```

Jenkins would require another service to operate. Azure DevOps would also be valid, but GitHub Actions keeps source and CI configuration together.

---

## 25. Why Trivy was included

The Docker image is scanned for known vulnerabilities before release.

This makes the pipeline a basic DevSecOps pipeline rather than only a build pipeline.

---

## 26. Why migrations are automated

Database schema changes must travel with the application release.

The intended relationship is:

```text
Application code
      +
Migration
      ↓
same release
```

Without migration automation, new application code can be deployed against an old database schema.

---

## 27. Local Docker lesson

A local test of the production image initially failed because required runtime variables were not supplied.

The container then worked when test values were provided.

This established that local container testing must reproduce the required configuration shape, even if fake/test values are used.

---

## 28. Health endpoints

The backend provides:

```text
GET /health
GET /health/db
```

`/health` checks application availability.

`/health/db` checks database connectivity.

These are simple operational tests before moving traffic to a new revision.

---

## 29. OpenAPI as a deployment verification tool

Swagger is also a deployment verification mechanism.

If code contains a new endpoint but production `/openapi.json` does not show it, investigate:

- which revision is active
- which revision has traffic
- which image is deployed

This helped identify the password-reset endpoint visibility issue as a deployment/revision problem rather than a missing source-code feature.

---

## 30. What belongs where

| Item | Location |
|---|---|
| React/FastAPI source | GitHub |
| migrations | GitHub |
| frontend build | Vercel |
| Docker image | ACR |
| backend runtime | Azure Container Apps |
| structured data | PostgreSQL |
| images/uploads | Azure Blob Storage |
| email delivery | Brevo |
| backend secrets | Azure Container Apps secrets |
| frontend public config | Vercel environment variables |
| source history | Git |

---

## 31. Things deliberately not over-engineered

The project intentionally did not add:

- Kubernetes
- self-managed VMs
- self-hosted Jenkins
- self-hosted SMTP
- a custom file server
- multiple backend microservices
- a service mesh
- a complex API gateway

The principle was:

> Use the simplest architecture that solves the real problem reliably.

---

## 32. Final deployment mental model

```text
WRITE CODE
   ↓
TEST LOCALLY
   ↓
COMMIT
   ↓
PUSH TO GITHUB
   ↓
GITHUB ACTIONS
   ↓
TEST + BUILD + SCAN
   ↓
ACR
   ↓
AZURE CONTAINER APPS
   ↓
CHECK REVISION
   ↓
MOVE TRAFFIC
   ↓
PRODUCTION
```

And:

```text
React
  ↓
Vercel
  ↓
Browser
  ↓
FastAPI
  ├── PostgreSQL
  ├── Blob Storage
  └── Brevo
```

---

## 33. What this project taught

The project covered:

- frontend development
- REST APIs
- JWT authentication
- password-reset security
- PostgreSQL
- ORM concepts
- migrations
- Docker
- CI/CD
- vulnerability scanning
- container registries
- Azure Container Apps
- revisions
- traffic routing
- CORS
- secret management
- managed identity
- cloud storage
- transactional email
- Vercel deployment
- SPA routing
- production debugging
- rollback

The important part is that several of these were real deployment problems rather than only theoretical topics.

---

## 34. Final project state

The production foundation includes:

- frontend deployment
- backend deployment
- PostgreSQL
- persistent image storage
- authentication
- password reset
- email integration
- CORS
- CI/CD
- Docker
- ACR
- Azure Container Apps
- revision management
- rollback capability
- SPA refresh routing
- deployment documentation

Further work is mainly product polish and feature expansion rather than fundamental infrastructure.

---

## 35. Interview-ready explanation

> Society Maintenance Tracker is a React/Vite frontend with a FastAPI backend. The frontend is deployed on Vercel, while the backend is containerized with Docker and deployed to Azure Container Apps. PostgreSQL stores relational application data, Azure Blob Storage stores uploaded images, and Brevo handles transactional email. GitHub Actions runs tests, builds and scans the container, pushes the image to Azure Container Registry and performs deployment/migration steps. Azure Container Apps revisions are used to validate releases and control traffic/rollback. Backend secrets are stored outside Git using Azure Container App secrets, while managed identity is used for Azure resource access where appropriate.

---

## 36. Future improvements

If the application grows, reasonable additions could include:

- Azure Front Door
- Azure Key Vault
- centralized monitoring
- rate limiting
- background jobs
- queue-based notifications
- staging environment
- automated rollback gates
- custom domain
- stronger automated frontend testing
- API versioning
- more formal observability

These should be added only when requirements justify them.

---

## 37. Final decision matrix

| Area | Decision | Reason |
|---|---|---|
| UI | React | component-based SPA |
| Build | Vite | fast/simple React workflow |
| Frontend host | Vercel | Git-native frontend deployment |
| API | FastAPI | Python + validation + OpenAPI |
| DB | PostgreSQL | relational application model |
| ORM | SQLAlchemy | Python database abstraction |
| Container | Docker | reproducible runtime |
| Registry | ACR | Azure-native image storage |
| Backend host | Container Apps | managed containers + revisions |
| Files | Blob Storage | persistent object storage |
| Email | Brevo | transactional email |
| Auth | JWT | SPA/API bearer authentication |
| Reset | OTP | email verification flow |
| CI/CD | GitHub Actions | repository-native automation |
| Security scan | Trivy | container vulnerability scanning |
| Source control | GitHub | versioning/collaboration |
| Release control | ACA revisions | rollback/traffic control |
| Secrets | ACA secrets | secrets outside Git |
| Azure access | Managed identity | avoid embedded credentials |

---

## 38. References

The Azure side of this architecture relies on documented Container Apps capabilities including revisions, traffic splitting, ingress/CORS, secrets and managed identities.

The official Azure revision documentation describes revisions as versioned immutable snapshots and explains single versus multiple revision modes.

The traffic-splitting documentation describes assigning percentage weights to revisions and using them for controlled releases.

The secrets documentation describes application-level secrets, while the managed identity documentation describes credential-free Azure resource authentication.

---

# End of document
