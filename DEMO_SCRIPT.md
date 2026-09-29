# 🎤 Phase 6 — Demo Script & Testing Guide

> **Project:** 24CC3014-P070 — Amazon DocumentDB for a Document-Oriented Application  
> **Team:** T211 (4 Students)  
> **Duration:** 8–10 minutes  

---

## 🎬 Demo Flow (Recommended Order)

### Slide 1: Introduction (1 min)
**What to say:**
> "Our project demonstrates Amazon DocumentDB as a document-oriented database for managing inspection reports. The key challenge we solve is storing reports with completely different internal structures — vehicle inspections, building inspections, and food safety inspections — all in a single collection, without any schema migrations."

**Show:** The README.md or a title slide with project name and team.

---

### Slide 2: AWS Architecture (1 min)
**What to show:**
1. Open AWS Console → **Amazon DocumentDB** → Show your running cluster
2. Show the cluster endpoint, instance class (db.t3.medium), engine version (5.0)
3. Briefly flash **EC2** → Show the running `docdb-app-server` instance
4. Mention: "Both resources are in the same VPC and Security Group for connectivity."

---

### Slide 3: Dashboard Overview (1 min)
**What to show:**
1. Open `http://<EC2-IP>:5173` → Dashboard loads
2. Point out the **stat cards** (total reports, completed, failed, report types)
3. Point out the **3 charts** (Doughnut by type, Bar by status, Polar by rating)
4. Scroll to **Recent Reports** table
5. Point out the **Variable Schema Proof** panel on the right

**Key talking point:**
> "Notice the Variable Schema Proof panel — each report type has completely different fields like `vehicleDetails`, `buildingDetails`, or `temperatureLog`, yet they all coexist in the same `reports` collection."

---

### Slide 4: Create a Vehicle Report (2 min)
**What to do:**
1. Click **"Create Report"** button
2. Select type: **Vehicle Inspection**
3. Fill in: Status = Completed, Rating = Pass, City = Delhi, Inspector = "Demo User"
4. **Point out** the template-specific fields that appeared automatically
5. Add a finding: Component = "brakes", Condition = "good", Severity = "low"
6. **Add a Custom Field:** Key = `mileage`, Value = `45000`
7. **Point out the Live JSON Preview** on the right updating in real-time
8. Click **Save Report**

**Key talking point:**
> "Notice the Live JSON Preview — the document we're building is a pure JSON object. The custom field `mileage` was added without any schema change. This is the power of DocumentDB's flexible document model."

---

### Slide 5: Create a Completely Different Type (1 min)
**What to do:**
1. Click **"New Report"** again
2. Select type: **Custom (No Template)**
3. Type name: `electrical`
4. Add custom fields: `voltage` = `220`, `circuitBreakers` = `15`, `earthing` = `proper`
5. Click **Save Report**

**Key talking point:**
> "We just created an entirely new report type — electrical — with completely different fields. No migrations, no ALTER TABLE statements, no downtime. This is exactly why a document database like DocumentDB is ideal for variable-schema use cases."

---

### Slide 6: Report Detail & Nested JSON (1 min)
**What to do:**
1. Navigate to **Reports** → Click on a **building** inspection report
2. Show the **Inspector**, **Location**, and **Schema Info** cards
3. Scroll to the **Raw Document Tree** (JSON viewer)
4. Point out deeply nested structures like `findings[].items[]`

**Key talking point:**
> "This building report has a `compliance` object and deeply nested `findings` with sub-arrays — structure that would require 5+ tables in a relational database but lives naturally as one document here."

---

### Slide 7: Query Playground (2 min)
**What to do — run these presets one by one:**

1. **"High Severity Findings"** → Shows nested array querying (`findings.severity = "high"`)
2. **"Reports by Type"** → Shows aggregation pipeline (`$group`)
3. **"Inspector Stats"** → Shows complex aggregation with `$addToSet`
4. **"$exists: Has Temperature Log"** → Shows schema flexibility (`temperatureLog` only exists on food_safety reports)
5. **"$regex: Cities starting with B"** → Shows DocumentDB's regex support (workaround for missing `$text`)

Then switch to **Custom Query** tab:
6. Type a custom filter: `{ "type": "vehicle", "overallRating": "fail" }`
7. Click **Run Query** → show results

**Key talking point:**
> "DocumentDB supports the same query operators as MongoDB — dot notation for nested fields, `$in` for arrays, `$regex` for text search. The Query Playground lets us run any MongoDB-style query directly against DocumentDB."

---

### Slide 8: Bottleneck Handling (1 min)
**What to show:**
1. Navigate to the **Bottlenecks** page (or show the compatibility table)
2. Point out the MongoDB vs DocumentDB compatibility table
3. Highlight `retryWrites=false` — "This is the #1 compatibility fix"
4. Show the **Cost Optimization** panel

**Key talking points:**
> "The two bottlenecks we addressed: First, MongoDB driver compatibility — the `retryWrites` feature breaks on DocumentDB, so we explicitly disable it. Second, cost — we use a single db.t3.medium instance instead of the default 3-instance cluster, saving ~66% on compute costs."

---

## 🧪 Testing Checklist (Pre-Demo)

Run these `curl` commands from your EC2 instance to verify everything works:

```bash
# 1. Health check
curl http://localhost:5000/api/health

# 2. Get all reports
curl http://localhost:5000/api/reports

# 3. Filter by type
curl "http://localhost:5000/api/reports?type=vehicle"

# 4. Nested query
curl "http://localhost:5000/api/queries/nested?field=findings.severity&value=high"

# 5. Aggregation by type
curl http://localhost:5000/api/queries/by-type

# 6. Aggregation by city
curl http://localhost:5000/api/queries/by-city

# 7. Inspector stats
curl http://localhost:5000/api/queries/inspector-stats

# 8. Schema analysis
curl http://localhost:5000/api/queries/schema-analysis

# 9. Create a brand-new type (variable schema proof)
curl -X POST http://localhost:5000/api/reports \
  -H "Content-Type: application/json" \
  -d '{"type":"electrical","status":"completed","inspector":{"name":"Test"},"voltage":"220V","circuitBreakers":15}'

# 10. Custom query
curl -X POST http://localhost:5000/api/queries/custom \
  -H "Content-Type: application/json" \
  -d '{"filter":"{\"type\":\"vehicle\"}","limit":5}'
```

All 10 should return `{"success": true, ...}`.

---

## 📸 Screenshots to Capture

Take these screenshots for your documentation/submission:

1. AWS Console → DocumentDB cluster (showing "Available" status)
2. AWS Console → EC2 instance (showing "Running" status)
3. Dashboard page (with charts populated)
4. Create Report page (with Live JSON Preview visible)
5. Report Detail page (showing nested JSON tree)
6. Query Playground (showing a query result)
7. Bottlenecks page (showing compatibility table)
8. Terminal showing `mongosh` connected to DocumentDB

---

## ✅ Phase 6 Completion Checklist

- [ ] All 10 API endpoints tested with curl
- [ ] Frontend pages all load without errors
- [ ] Dashboard charts render correctly
- [ ] Create Report flow works end-to-end
- [ ] Query Playground returns results for all presets
- [ ] Bottleneck/compatibility info visible in app
- [ ] README.md finalized
- [ ] Demo rehearsed at least once
- [ ] Screenshots captured
- [ ] DocumentDB cluster is running and accessible
