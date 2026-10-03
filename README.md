# 24CC3014-P070 | Amazon DocumentDB for a Document-Oriented Application

**Team:** T211 (4 Students)
**Hackathon Use Case:** Store variable-schema inspection reports & Query nested document structures.

## 🚀 Project Overview

This project is a modern, full-stack application designed to demonstrate the flexibility and power of **Amazon DocumentDB**. It allows users to generate, manage, and query "Inspection Reports" (e.g., Vehicle Inspections, Building Inspections) that share a single database collection despite having completely different internal data structures (Variable Schemas). 

### ✨ Key Capabilities Demonstrated
1. **Variable Schema Handling:** Creating documents with completely different fields in the exact same collection without schema migrations.
2. **Nested Querying:** Searching deep into nested arrays (e.g., `findings.severity = 'high'`).
3. **Aggregation Pipelines:** Grouping reports by status, type, and location to power the frontend dashboard.
4. **Driver Compatibility:** Configured specifically to avoid MongoDB feature compatibility gaps (e.g., explicitly disabling `retryWrites`).

---

## 🏗️ Tech Stack

* **Frontend:** React 18, Vite, Tailwind CSS (v3), Lucide React, Framer Motion, Chart.js.
* **Backend:** Node.js, Express.js.
* **Database:** Amazon DocumentDB (MongoDB API), `mongodb` native Node.js driver.

---

## 📊 Current Project Status

The codebase logic is **100% complete**. The UI and API are fully built. The next immediate step is to provision the Amazon DocumentDB cluster on AWS to bring the app to life.

- [ ] **Phase 1: AWS Infrastructure (Pending)** - Set up the Amazon DocumentDB cluster on the AWS Console.
- [ ] **Phase 2: Database Setup (Pending)** - Configure connection strings and run the seed script.
- [x] **Phase 3: Backend REST API (Completed)** - Full Express API with DocumentDB integrations.
- [x] **Phase 4: Frontend UI (Completed)** - Modern SaaS-style React Dashboard.

---

## 💻 How to Run Locally

*Note: The application will crash on startup until Phase 1 and 2 are completed (the database must exist).*

### 1. Configure the Backend (Amazon DocumentDB)
1. Complete the AWS Console setup for your DocumentDB cluster.
2. Download the RDS TLS certificate:
   ```bash
   wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
   ```
   *Place this file in the `backend/` directory.*
3. Copy `backend/.env.example` to `backend/.env` and fill in your AWS credentials:
   ```env
   DOCDB_HOST=your-cluster-url.cluster-XXXXXXXX.us-east-1.docdb.amazonaws.com
   DOCDB_PORT=27017
   DOCDB_USERNAME=docdbadmin
   DOCDB_PASSWORD=your_password_here
   DOCDB_DATABASE=inspectiondb
   PORT=3000
   NODE_ENV=production
   ENABLE_QUERY_PLAYGROUND=false
   ENABLE_TEMPLATE_WRITES=false
   ```
4. Install dependencies and start the backend:
   ```bash
   cd backend
   npm install
   npm run seed   # Run this once to populate fake data
   npm run dev    # Starts API on http://localhost:3000
   ```
   *Health checks are available at `/api/health` and `/api/health/db`.*

### 2. Run the Frontend
1. Open a new terminal instance.
2. Install dependencies and start the Vite dev server:
   ```bash
   cd frontend
   npm install
   npm run dev    # Starts UI on http://localhost:5173
   ```
3. Open your browser and navigate to `http://localhost:5173`.

### 3. Build & Deploy (Production on EC2)

```bash
# From the repo root — builds frontend/dist and starts Express on PORT 3000
npm run build          # builds React → frontend/dist/
cd backend && NODE_ENV=production npm start
```

> Express will serve both the API and the built React app on the same port.

---

## 🛑 Managing Cluster Cost (Stop / Start)

Amazon DocumentDB charges per instance-hour. Use the scripts below to stop the
cluster during off-hours and save 100 % of compute cost.

> **7-day auto-restart:** AWS automatically restarts a stopped DocumentDB cluster
> after 7 days. Plan accordingly.

### Setup

```bash
export DOCDB_CLUSTER_ID=inspection-docdb-cluster   # your cluster identifier
```

### Stop the cluster (0 $/hr compute while stopped)

```bash
bash scripts/docdb-stop.sh
```

### Start the cluster

```bash
bash scripts/docdb-start.sh
```

### Download the TLS certificate

```bash
bash scripts/get-cert.sh          # saves global-bundle.pem into backend/
```

---

## 🔬 MongoDB / Amazon DocumentDB Compatibility Gaps

The tables below record compatibility based on AWS documentation and SKILL.md.
Fill the **"Observed error (live cluster)"** column from your own run.

### Confirmed Compatibility

| Feature / Setting | MongoDB behaviour | DocumentDB behaviour | Our mitigation |
|---|---|---|---|
| `retryWrites=true` | Retries failed writes automatically | Supported only from engine 8.0.2 | Set `retryWrites=false` in connection URI (we use engine 5.0) |
| TLS — no CA bundle | Accepts self-signed or no TLS | Requires TLS with AWS global CA bundle | `tlsCAFile=global-bundle.pem` in URI; hard-exit in production if file missing |
| `mongodb` driver v6+ | Full support | Speculative auth handshake may fail | Pinned to `mongodb@^5.9.2` in `backend/package.json` |
| `$text` / text indexes | Full-text search | Supported, but tokenisation differs | Replaced with case-insensitive `$regex` to avoid tokenisation differences |
| Multi-document transactions | Full ACID across collections | Supported on 4.0+ [confirm] | All mutations are single-document (`$set`, `$push`) |

### To Test on Live Cluster

Must be tested on our cluster before claiming as a gap or confirming behaviour:

| Feature / Setting | Note | Observed error (live cluster) |
|---|---|---|
| `$lookup` (multi-stage joins) | Limited query shapes. Schema denormalized so joins aren't used. | _(fill from live run)_ |
| `$merge` pipeline stage | Writes pipeline output into collection. | _(fill from live run)_ |
| Change Streams | Real-time event stream. | _(fill from live run)_ |
| `directConnection` | directConnection=true bypasses replica-set topology discovery inside VPC. | _(fill from live run)_ |
