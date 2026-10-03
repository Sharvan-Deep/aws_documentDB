---
name: documentdb-inspection-app
description: Use when working on the T211 app that stores inspection reports of different types (vehicle, building, food safety) with different fields in one Amazon DocumentDB collection and queries their nested data. Covers the data model, queries, DB connection, AWS Learner Lab deployment, MongoDB compatibility gaps and cluster cost.
---

# DocumentDB Inspection App

## 1. Problem context
- We store inspection reports of different types in one DocumentDB collection.
- Each type has different fields, so a fixed relational table does not fit.
- Reports contain nested data (findings inside a report) and we query inside it.
- Two bottlenecks are in scope: DocumentDB is only MongoDB-compatible, and a cluster costs money while running.
- "Document" means a JSON record. There is no file or Excel upload feature. Do not add one.
- Stack: React/Vite frontend, Express backend, `mongodb` Node driver v5. Coding is done; AWS deployment is the remaining work.

## 2. Data model rules
- Collections: `reports` (every report type) and `templates` (default fields per type).
- Common fields used for listing, filtering and dashboards: `reportId`, `type`, `status`, `createdAt`, `overallRating`, `inspector` (`name`, `employeeId`, `department`), `location.city`, `tags` (array), `findings` (array). Never remove or rename them.
- Type-specific data lives in its own sub-object or array, for example `vehicleDetails`, `buildingDetails`, `compliance`, `temperatureLog`. Exactly matches seed data (e.g., `compliance.fireCode`).
- Known type values: `vehicle`, `building`, `food_safety`.
- `findings` is a nested array inside the report. Never move it to another collection.
- Adding a new report type must need no migration and no schema change.
- Clients must never overwrite `_id`, `reportId` or `createdAt`. The PUT and POST routes strip these fields.

## 3. Connection rules
- Driver: `mongodb` v5.x (see `backend/package.json`). Stay on v5 unless a newer version has been tested on our cluster.
- The connection is built only in `backend/config/database.js`. Use only the options defined there.
- Required for engine 5.0: `tls=true`, `tlsCAFile` pointing to `global-bundle.pem`, `retryWrites=false`.
- `directConnection=true` is what our code uses. Treat it as a choice, not a proven requirement, until tested on the cluster.
- Never set `tlsAllowInvalidCertificates=true`.
- The CA file must be at `backend/global-bundle.pem`. The path is resolved from the code file, not the working directory.
- In production (`NODE_ENV=production`), exit immediately if the CA file is missing.
- In development, a missing CA file removes TLS entirely, which fails against a real cluster.
- Credentials come only from environment variables: `DOCDB_HOST`, `DOCDB_PORT`, `DOCDB_USERNAME`, `DOCDB_PASSWORD`, `DOCDB_DATABASE`. Never hardcode them or commit `.env`.
- Write the password raw in `.env`. The code URL-encodes it, so pre-encoding breaks login.
- The cluster is reachable only from inside its VPC, so the app runs on EC2 in that VPC.
- If the connection fails the app exits. Under `pm2`, stop the app before stopping the cluster.

## 4. Query rules
- Use dot notation for nested fields (`findings.severity`). It matches a report if ANY array element matches.
- `$elemMatch` is in the playground allow-list, so two conditions on the same finding can be expressed. [confirm: test on the cluster]
- Operators used by the code: find with projection and sort, `distinct`, `$in`, `$gte`, `$lte`, and `$group` with `$sum`, `$max`, `$min`, `$first`, `$addToSet`, then `$sort`. Expected to work; confirm on the cluster.
- The playground endpoints (`GET /api/queries/nested`, `POST /api/queries/custom`) run only when `ENABLE_QUERY_PLAYGROUND=true`; otherwise they return 403.
- Every user-supplied filter, sort and projection is passed through `validateOperators` before reaching the driver. `$where`, `$function` and `$accumulator` are never allowed.
- `GET /api/queries/nested` builds its filter from the raw `field` parameter. It strictly rejects field names starting with `$` or containing a `$` segment.
- User-supplied queries have a capped `limit` (max 100, min 1).
- `schema-analysis` shows the fields of one sample document per type, not every possible field.
- Routers: `routes/reportRoutes.js`, `routes/queryRoutes.js`, `routes/templateRoutes.js`.
- There is no authentication. Restrict network access with the `app-sg` security group.
- The UI uses only `GET /api/templates/:type`. Template write routes (POST, PUT, DELETE) are gated behind `ENABLE_TEMPLATE_WRITES=true`.

## 5. Compatibility facts
Confirmed from AWS documentation:
- Retryable writes are supported only from engine 8.0.2. On engine 5.0 use `retryWrites=false`, and keep the cluster on 5.0.
- DocumentDB has native text indexes, but tokenisation differs from MongoDB and matching is case-insensitive. It is not an unsupported feature.

Reported by a third-party migration guide, not yet confirmed in AWS docs:
- Multi-document transactions are supported on 4.0 and later. [confirm]

Must be tested on our cluster before claiming as a gap:
- `directConnection` behaviour, `$lookup`, `$merge`, change streams, and any operator in the code not listed in section 4.

## 6. Deployment rules (AWS Academy Learner Lab)
- Only `us-east-1` and `us-west-2` work. Use `us-east-1`.
- Do not create IAM roles or users. Use `LabInstanceProfile` and the key pair `vockey` (us-east-1 only).
- Two security groups: `app-sg` (ports 3000 and 22 from known IPs only) and `docdb-sg` (port 27017 from `app-sg` only). Never open to `0.0.0.0/0`.
- Engine 5.0, one instance, small class.
- Whether DocumentDB is enabled in this lab is unverified. If the console shows an access error, ask the instructor.
- The app runs on EC2 with `NODE_ENV=production` and serves the built frontend.
- `ENABLE_QUERY_PLAYGROUND=true` on the demo server only.

## 7. Cost rules
- One instance. Stop the app first, then the cluster, when idle.
- A stopped cluster still bills for storage and backups, and AWS restarts it after 7 days. [confirm in AWS docs]
- Delete the cluster and the EC2 instance after the demo.
- Watch the Learner Lab budget shown on the lab page.

## 8. Honesty rules
- Never invent error messages, costs or test results.
- Write `[insert from live test]` for anything not tested.
- Write "per AWS docs, not tested" for claims we did not run.
- Keep this file's `[confirm]` markers until the item is checked against the code or the live cluster.

## 9. Definition of done
- Every API route works on the real cluster.
- Every compatibility claim has an observed error or a docs reference.
- Budget and cluster screenshots are captured.
- The deck and README match what was actually tested.