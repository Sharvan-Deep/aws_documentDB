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
3. Rename `backend/.env.example` to `backend/.env` (or create one) and insert your AWS credentials:
   ```env
   PORT=5000
   DB_HOST=your-cluster-url.docdb.amazonaws.com
   DB_PORT=27017
   DB_USER=your_db_username
   DB_PASS=your_db_password
   ```
4. Install dependencies and start the backend:
   ```bash
   cd backend
   npm install
   npm run seed   # Run this once to populate fake data
   npm run dev    # Starts API on http://localhost:5000
   ```

### 2. Run the Frontend
1. Open a new terminal instance.
2. Install dependencies and start the Vite dev server:
   ```bash
   cd frontend
   npm install
   npm run dev    # Starts UI on http://localhost:5173
   ```
3. Open your browser and navigate to `http://localhost:5173`.
