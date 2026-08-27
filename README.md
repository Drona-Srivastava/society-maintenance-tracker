# Society Maintenance Tracker

A full-stack society maintenance management application built with React/Vite and FastAPI, with PostgreSQL for structured data and Azure Blob Storage for persistent uploads.

## Production Architecture

- **Frontend:** React + Vite
- **Frontend Hosting:** Vercel
- **Backend:** FastAPI + Python
- **Backend Hosting:** Azure Container Apps
- **Container Registry:** Azure Container Registry (ACR)
- **Database:** PostgreSQL
- **File Storage:** Azure Blob Storage
- **Email:** Brevo
- **CI/CD:** GitHub Actions
- **Container Security:** Trivy
- **Authentication:** JWT
- **Database Migrations:** Alembic
- **Source Control:** GitHub

### Production URLs

Frontend:

`https://society-maintenance-tracker-drona.vercel.app`

Backend:

`https://society-backend.politefield-6b5113f7.centralindia.azurecontainerapps.io`

Backend health check:

`https://society-backend.politefield-6b5113f7.centralindia.azurecontainerapps.io/health`

API documentation:

`https://society-backend.politefield-6b5113f7.centralindia.azurecontainerapps.io/docs`

---

# Documentation

Before changing or deploying the project, read the relevant documentation.

| Document | Purpose |
|---|---|
| `FRONTEND.md` | Frontend architecture, Vercel deployment, routing, environment variables, testing, SEO and troubleshooting |
| `BACKEND.md` | FastAPI, Docker, ACR, Azure Container Apps, secrets, migrations, revisions, traffic, CORS and rollback |
| `FRONTEND.docx` | Word version of frontend documentation |
| `BACKEND.docx` | Word version of backend documentation |
| `PROJECT_DECISIONS_ARCHITECTURE_LAYMAN.md` | Complete project decisions and architecture explained in simple language |
| `PROJECT_DECISIONS_ARCHITECTURE_STUDENT.md` | Student-level technical architecture and engineering decisions |
| `PROJECT_DECISIONS_ARCHITECTURE_LAYMAN.docx` | Word version of layman architecture documentation |
| `PROJECT_DECISIONS_ARCHITECTURE_STUDENT.docx` | Word version of student architecture documentation |

**Do not skip `BACKEND.md` before changing Azure deployment configuration.**

## Demo access

Use these mock accounts to review the submitted assignment. They are demo-only credentials and should not be reused outside this project.

| Role | Email | Password |
|---|---|---|
| Resident | `aarav.mehta.demo@example.com` | `demo@society` |
| Resident | `priya.sharma.demo@example.com` | `demo@society` |
| Resident | `rohan.iyer.demo@example.com` | `demo@society` |
| Administrator | `admin@society.local` | `Admin@12345` |

The resident accounts can create and track complaints. The administrator account can review complaints, update their status and priority, and manage notices.
---

# Important Rule Before Pushing

The safest deployment workflow is:

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
Build + test + security scan
        ↓
Docker image → ACR
        ↓
Azure Container Apps
        ↓
New revision
        ↓
Verify revision
        ↓
Move traffic
        ↓
Production
