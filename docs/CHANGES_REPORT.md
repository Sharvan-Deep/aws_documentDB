# Alignment Change Report
**Date:** 2026-10-04
**Branch:** `align-with-skill`

## 1. Summary
I successfully aligned the frontend and backend with `SKILL.md` rules and the presentation deck, strictly following the provided instructions. Security was strengthened by extracting a centralized operator allow-list (`validateQuery.js`), aggressively gating array/object injections, and securing template write routes. The frontend's `Bottlenecks` matrix was rebuilt to accurately reflect DocumentDB capabilities based on `SKILL.md` section 5, removing unsupported cost estimates and outdated claims. All missing error states were added across the React app for resilient UI behavior. Finally, a comprehensive unit test suite was added and verified passing for query validation logic.

## 2. Files Changed
| File | What Changed | Why | Source Requirement |
|---|---|---|---|
| `backend/utils/validateQuery.js` | Created file, extracted allow-list & `validateOperators`, added `$elemMatch`. | Centralize query security and allow precise array queries. | Task 1.1, 1.4, SKILL.md §4 |
| `backend/controllers/queryController.js` | Added strict string checks for nested query, projection validation, limit caps, exported allow-list route. | Prevent NoSQL injection and resource exhaustion. | Task 1.2, 1.3, SKILL.md §4 |
| `backend/controllers/reportController.js` | Stripped `_id`, `reportId`, `createdAt` from POST/PUT bodies. Improved ObjectId validation to return 400. | Prevent client overwrite of immutable fields. | Task 1.6, SKILL.md §2 |
| `backend/routes/templateRoutes.js` | Gated POST/PUT/DELETE behind `ENABLE_TEMPLATE_WRITES`. | Secure template structure from unauthorized edits. | Task 1.7, SKILL.md §4 |
| `backend/routes/reportRoutes.js` | Removed misleading comment about `/stats/overview` route order. | Improve code clarity and remove falsehoods. | Task 1.9 |
| `backend/routes/queryRoutes.js` | Added `GET /api/queries/allowed-operators`. | Expose allow-list dynamically to frontend. | Task 3.2 |
| `backend/server.js` | Added `GET /api/health/db` ping endpoint. | Enable load-balancer DB health checks. | Task 1.8 |
| `backend/config/database.js` | Corrected inline comments about `retryWrites` and `directConnection`. | Accurately reflect engine 5.0 constraints. | Task 1.9, SKILL.md §3/§5 |
| `backend/.env.example` | Added `ENABLE_TEMPLATE_WRITES`, noted URL-encoding for password. | Prevent deployment misconfiguration. | Task 1.10, SKILL.md §3 |
| `backend/package.json` | Added `"test"` script. | Enable native unit testing. | Task 1.11 |
| `backend/tests/validateQuery.test.js` | Built 8 test cases for operator validation. | Verify security logic prevents injection. | Task 1.11 |
| `frontend/src/pages/Bottlenecks.jsx` | Rebuilt matrix from SKILL.md §5, removed dollar costs, marked to-test items. | Align presentation facts with SKILL.md. | Task 3.1, SKILL.md §5/§7 |
| `frontend/src/pages/QueryPlayground.jsx` | Handled 403 (playground disabled) with hint, rendered allowed ops, noted 400 errors. | Graceful degradation and transparency. | Task 3.2, SKILL.md §4 |
| `frontend/src/pages/Dashboard.jsx` | Clarified schema-analysis panel label text. | Prevent misunderstanding of sample documents. | Task 3.3, SKILL.md §4 |
| `frontend/src/pages/Reports.jsx` | Added explicit `error` state and rendered UI banner on API failure. | Prevent misleading "No reports found" state. | Task 3.4 |
| `frontend/src/pages/CreateReport.jsx` | Added toast error notification on template fetch failure. | Improve UX during transient errors. | Task 3.4 |
| `frontend/src/api/api.js` | Added `queryAllowedOperators` and `getHealthDb` exports. | Wire frontend to new API routes. | Task 3.2, 1.8 |
| `README.md` | Synced compatibility table to SKILL.md §5, documented new variables and endpoints. | Maintain single source of truth. | Task 4.1 |
| `docs/skills/documentdb-inspection-app/SKILL.md` | Removed resolved `[confirm]` markers (§2), updated validation and limits (§4). | Reflect verified code realities. | Task 4.2 |

## 3. Checked and Already Correct
- **Date Validation:** `reportsByDateRange` (`queryController.js`) was already correctly validating input dates and returning 400 for `NaN`.
- **ObjectId Validation:** `getReportById`, `deleteReport`, and `addFinding` were already validating `ObjectId` and returning 400.
- **Seed Script Data:** The seed data canonical fields (`compliance.fireCode`) and type enumerations (`vehicle`, `building`, `food_safety`) perfectly matched the required naming convention.
- **Seed Script Idempotency:** The seed script correctly utilized `deleteMany({})` before inserting data, allowing it to be re-run cleanly.
- **File Uploads:** A full project grep confirmed zero mentions of file uploads, Excel, or attachments in the frontend UI.

## 4. Things Not Changed
- `backend/.env`: Completely untouched per the strict instructions (no secrets modified).
- `backend/seed/seedData.js`: Untouched, as it was already correct and idempotent.
- `docs/mcp.md` and `.pptx` presentation files: Untouched per the strict instruction block.
- Database Connection: The backend was never started and no database connection attempt was made.

## 5. Contradictions Found
- **Slide 14 (Speaker Notes) vs Code:** The slide notes claim that "The playground gate and operator allow-list are both in `queryController.js`." This contradicts the updated code structure. The playground gate is in `backend/controllers/queryController.js` (line 15), but the operator allow-list and validation engine have been extracted to `backend/utils/validateQuery.js` (lines 12-46) for better security isolation.
- **Slide 7 (Table) vs Code:** The table lists `GET /api/queries/nested` as the primary API call for the QueryPlayground. While true, the page also now initiates a primary call to `GET /api/queries/allowed-operators` which is mapped in `backend/routes/queryRoutes.js` (line 11) and exported in `frontend/src/api/api.js` (line 27). This new requirement is omitted from the slide.

## 6. Tests Run and Results
*Note: Absolutely nothing was tested against a live Amazon DocumentDB cluster.*

1. **Unit Tests (`npm test`):**
   - Command: `node --test tests/validateQuery.test.js`
   - Result: **8/8 tests passed** (duration: ~184ms).
   - Confirmed `$where`, `$function`, and unknown operators are strictly rejected. Confirmed `$elemMatch` and nested operators are permitted.
2. **Frontend Build (`npm run build`):**
   - Command: `npm --prefix frontend run build`
   - Result: **Succeeded** (duration: 12.02s).
   - Output: 2374 modules transformed. No ESLint errors or React warnings. Standard Vite chunk size warning (>500kB) was emitted.

## 7. Remaining `[confirm]` Items
**Needs the live cluster:**
- `SKILL.md` §4: Confirm `$elemMatch` allows two conditions on the same finding array element.
- `SKILL.md` §4: Confirm all pipeline operators (`$sum`, `$max`, `$addToSet`, etc.) run as expected.
- `SKILL.md` §5: Document `directConnection` behaviour inside the VPC.
- `SKILL.md` §5: Document `$lookup` (joins) and `$merge` behaviour on engine 5.0.
- `SKILL.md` §5: Document Change Streams behaviour.
- `SKILL.md` §7: Confirm AWS strictly auto-restarts a stopped cluster after exactly 7 days.

**Needs a decision from the team:**
- `SKILL.md` §4: Should the unused template write routes (POST, PUT, DELETE) be entirely removed instead of just gated?
- `SKILL.md` §5: Multi-document transactions (is the 4.0+ third-party claim relevant enough to our single-document mutation architecture to keep?).

## 8. Deploy Checklist
Before the live demo, verify the following on the EC2 server:
- [ ] Network: EC2 is inside the cluster's VPC with the `app-sg` security group assigned.
- [ ] TLS Certificate: The AWS CA bundle is downloaded precisely to `backend/global-bundle.pem`.
- [ ] Environment Variables:
  - `NODE_ENV=production`
  - `PORT` is mapped appropriately (e.g., 3000)
  - `DOCDB_HOST`, `DOCDB_PORT`, `DOCDB_USERNAME`, `DOCDB_PASSWORD`, `DOCDB_DATABASE` are correct.
  - `ENABLE_QUERY_PLAYGROUND=true` (Required to show custom querying).
  - `ENABLE_TEMPLATE_WRITES=false` (To prevent accidental schema template destruction during the demo).

## 9. Deck Slide Corrections Needed
- **Slide 14 (Speaker Notes):** Update the note "The playground gate and operator allow-list are both in queryController.js" to state that the operator allow-list and validation engine have been extracted to `utils/validateQuery.js`.
- **Slide 7 (Table):** Add a row for `QueryPlayground` calling `GET /api/queries/allowed-operators`.
