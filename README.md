# 🔍 Inspection Report System — Amazon DocumentDB

> **Project 24CC3014-P070** | Team T211 | AWS Hackathon

A document-oriented inspection report management system powered by **Amazon DocumentDB**, demonstrating variable-schema storage and nested document querying.

## 🎯 Use Cases

1. **Store variable-schema inspection reports** — Vehicle, Building, and Food Safety reports with completely different fields, all in the same collection
2. **Query nested document structures** — Search inside deeply nested objects and arrays

## 🏗️ Architecture

```
[Browser] → [Node.js + Express (EC2)] → [Amazon DocumentDB (VPC)]
```

## 🚀 Setup & Run

### Prerequisites
- AWS account with DocumentDB cluster (see `PROJECT_PLAN.md` Phase 1)
- EC2 instance in the same VPC
- Node.js 18+ installed

### Installation
```bash
# Clone/copy the project to EC2
cd ~/inspection-app

# Install dependencies
npm install

# Download DocumentDB TLS certificate
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

# Edit .env with your DocumentDB credentials
nano .env

# Seed the database
npm run seed

# Start the server
npm start
# or for development with auto-reload:
npm run dev
```

### Access
Open `http://<EC2-PUBLIC-IP>:3000` in your browser.

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reports` | List reports (filter: `?type=`, `?status=`, `?city=`) |
| `GET` | `/api/reports/:id` | Get single report |
| `POST` | `/api/reports` | Create report (any schema) |
| `PUT` | `/api/reports/:id` | Update report |
| `DELETE` | `/api/reports/:id` | Delete report |
| `PATCH` | `/api/reports/:id/findings` | Add finding to report |
| `GET` | `/api/reports/stats/overview` | Dashboard statistics |
| `GET` | `/api/queries/nested?field=X&value=Y` | Query nested fields |
| `GET` | `/api/queries/by-type` | Reports by type |
| `GET` | `/api/queries/high-severity` | High severity reports |
| `GET` | `/api/queries/search-tags?tags=X,Y` | Search by tags |
| `POST` | `/api/queries/custom` | Custom query |
| `GET` | `/api/queries/schema-analysis` | Variable schema proof |
| `GET` | `/api/health` | Health check |

## ⚠️ DocumentDB Compatibility Notes

- `retryWrites=false` is **required** (DocumentDB does not support retryable writes)
- `$text` search is not supported — use `$regex` instead
- TLS is required — use `global-bundle.pem`

## 👥 Team T211

| Student | Role |
|---------|------|
| Student 1 | AWS Infrastructure Setup |
| Student 2 | Backend API (CRUD) |
| Student 3 | Backend API (Queries) + Advanced Features |
| Student 4 | Frontend + Testing |
