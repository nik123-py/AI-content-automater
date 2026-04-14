# CHAPTER 5

## IMPLEMENTATION OF CONCURRENCY CONTROL AND RECOVERY MECHANISMS

---

### 5.1 Introduction to Transactions

A **transaction** is a logical unit of work in a database that consists of one or more SQL operations (SELECT, INSERT, UPDATE, DELETE) that are executed as a single atomic operation. In the AI Content Repurposer system, transactions are critical to ensure that multi-step operations — such as submitting content, creating a repurpose job, and generating an output — either complete entirely or do not affect the database at all.

**Example context for this project:** When a user submits a repurposing request, the system must (1) validate and insert the content, (2) create a repurpose job, and (3) eventually insert the generated output. If any step fails (e.g., the AI engine returns an error), all changes must be rolled back to maintain database consistency.

---

#### 5.1.1 Properties of Transactions (ACID Properties)

Transactions must satisfy the **ACID** properties to guarantee reliability:

| Property | Full Name | Description | Example in AI Content Repurposer |
|----------|-----------|-------------|-----------------------------------|
| **A** | Atomicity | All operations in a transaction succeed together or all are rolled back. | A job insert and output insert succeed together, or neither is saved. |
| **C** | Consistency | A transaction takes the database from one valid state to another valid state, preserving all constraints. | After a job transaction, the `status` field must still be one of the valid values (pending/processing/completed/failed). |
| **I** | Isolation | Concurrent transactions execute as if they were serial — intermediate states are hidden from other transactions. | While a repurposing job is being recorded, another session cannot see the half-inserted row. |
| **D** | Durability | Once a transaction is committed, its changes persist permanently, even in the event of a system crash. | After `COMMIT`, the generated LinkedIn post is safely stored even if the server crashes immediately after. |

---

#### 5.1.2 States of a Transaction

A transaction progresses through the following states during its lifecycle:

```
                     ┌─────────────┐
                     │   ACTIVE    │  ◄── Transaction begins (BEGIN / START TRANSACTION)
                     └──────┬──────┘
                            │ Partial commit (all operations executed)
                            ▼
                     ┌─────────────┐
                     │  PARTIALLY  │  ◄── All SQL statements executed, awaiting COMMIT
                     │  COMMITTED  │
                     └──────┬──────┘
               ┌────────────┴────────────┐
               │ Commit succeeds         │ Commit fails / Error
               ▼                         ▼
        ┌─────────────┐          ┌─────────────────┐
        │  COMMITTED  │          │    FAILED       │
        │  (Durable)  │          │  (Must Rollback)│
        └─────────────┘          └────────┬────────┘
                                          │ ROLLBACK executed
                                          ▼
                                  ┌──────────────┐
                                  │  ABORTED /   │
                                  │  ROLLED BACK │
                                  └──────────────┘
```

| State | Description |
|-------|-------------|
| **Active** | The transaction is executing. DML operations are being performed on the database. |
| **Partially Committed** | The final statement has been executed. The changes are in the buffer but not yet written to disk. |
| **Committed** | The transaction has been successfully completed and all changes are permanently written to the database. |
| **Failed** | An error occurred during execution. The transaction cannot proceed to commit. |
| **Aborted / Rolled Back** | The transaction has been rolled back. The database is restored to its state before the transaction began. |

---

### 5.2 Transaction Control Language (TCL)

**Transaction Control Language (TCL)** refers to the set of SQL commands used to manage database transactions. TCL commands control the saving and restoring of data manipulation operations performed within a transaction.

| TCL Command | Description |
|-------------|-------------|
| `COMMIT` | Permanently saves all changes made during the current transaction |
| `ROLLBACK` | Undoes all changes made during the current transaction (or to a savepoint) |
| `SAVEPOINT` | Sets an intermediate checkpoint within a transaction to allow partial rollbacks |
| `RELEASE SAVEPOINT` | Removes a savepoint, making it no longer available for rollback |
| `SET TRANSACTION` | Sets the characteristics of the current transaction (isolation level, read-only, etc.) |

---

#### 5.2.1 SAVEPOINT

A **SAVEPOINT** is a named intermediate point within a transaction. It allows a transaction to be partially rolled back to that specific point without aborting the entire transaction. This is particularly useful in long-running transactions where some operations may fail but earlier successful operations should be preserved.

**Syntax:**
```sql
SAVEPOINT savepoint_name;
ROLLBACK TO savepoint_name;   -- Rolls back to this point only
RELEASE SAVEPOINT savepoint_name;  -- Removes the savepoint
```

**Use in AI Content Repurposer:**
When a user submits three repurpose jobs in one batch — say for LinkedIn, Twitter, and Instagram — a savepoint can be set after each successful job insertion. If the Instagram job fails (e.g., due to a constraint violation), the system can roll back to the savepoint after the Twitter job was inserted, preserving the LinkedIn and Twitter jobs while discarding the failed Instagram job.

---

#### 5.2.2 COMMIT

**COMMIT** permanently saves all changes made during the current transaction to the database. Once a COMMIT is issued, the changes cannot be undone using ROLLBACK. The database enters a consistent state, and all locks held by the transaction are released.

**Syntax:**
```sql
COMMIT;
-- or equivalently:
COMMIT WORK;
```

**Use in AI Content Repurposer:**
After successfully inserting a new content entry, creating a repurpose job, and receiving/storing the AI-generated output, a COMMIT is issued to permanently record the entire pipeline result. If any step fails before COMMIT, a ROLLBACK can undo everything.

**Autocommit Mode:**
MySQL operates in `autocommit = ON` mode by default, meaning each individual statement is automatically committed. To group multiple statements into one transaction, either:
- Use `START TRANSACTION;` to temporarily disable autocommit for that transaction, OR
- Disable autocommit globally: `SET autocommit = 0;`

---

#### 5.2.3 ROLLBACK

**ROLLBACK** undoes all uncommitted changes made during the current transaction, restoring the database to its previous consistent state. ROLLBACK can be applied to the beginning of the transaction or to a specific savepoint.

**Syntax:**
```sql
ROLLBACK;                          -- Full rollback to transaction start
ROLLBACK TO SAVEPOINT sp_name;    -- Partial rollback to savepoint
```

**Use in AI Content Repurposer:**
If the AI engine returns an error (e.g., `status = 'failed'`) during a repurpose job, a ROLLBACK ensures that the partially inserted records (such as a `status = 'processing'` job entry) are removed, preventing stale or inconsistent data from persisting in the database.

---

### 5.3 Create 5 Transactions for This Project and Execute

The following five transactions demonstrate real-world scenarios from the AI Content Repurposer system, each incorporating `SAVEPOINT`, `COMMIT`, and `ROLLBACK` commands.

> **Note for Execution:** To ensure these transactions are fully executable in a fresh database session without hitting Foreign Key constraints, execute this setup script first to populate the necessary parent records:
> ```sql
> -- ---------------------------------------------------------
> -- SETUP DATA SCRIPT (Run this first before the transactions)
> -- ---------------------------------------------------------
> INSERT IGNORE INTO users (user_id, name, email, password_hash, created_at) VALUES 
> ('u001-aaaa-bbbb-cccc-000000000001', 'Nikhil Sharma', 'nikhil.test1@example.com', 'hash', NOW()),
> ('u002-aaaa-bbbb-cccc-000000000002', 'Priya Patel', 'priya.test2@example.com', 'hash', NOW()),
> ('u005-aaaa-bbbb-cccc-000000000005', 'Rahul Verma', 'rahul.test5@example.com', 'hash', NOW()),
> ('u006-aaaa-bbbb-cccc-000000000006', 'Ananya Singh', 'ananya.test6@example.com', 'hash', NOW()),
> ('u008-aaaa-bbbb-cccc-000000000008', 'Meera Nair', 'meera.test8@example.com', 'hash', NOW());
> 
> INSERT IGNORE INTO contents (content_id, user_id, original_text, language, title, created_at) VALUES 
> ('c001-aaaa-bbbb-cccc-000000000001', 'u001-aaaa-bbbb-cccc-000000000001', 'Sample original text', 'English', 'Sample Title', NOW()),
> ('c004-aaaa-bbbb-cccc-000000000004', 'u002-aaaa-bbbb-cccc-000000000002', 'Spanish text', 'Spanish', 'IA en Negocios', NOW()),
> ('c006-aaaa-bbbb-cccc-000000000006', 'u006-aaaa-bbbb-cccc-000000000006', 'Cybersecurity text', 'English', 'Cybersecurity', NOW()),
> ('c009-aaaa-bbbb-cccc-000000000009', 'u005-aaaa-bbbb-cccc-000000000005', 'French text', 'French', 'Cloud Computing', NOW()),
> ('c012-aaaa-bbbb-cccc-000000000012', 'u008-aaaa-bbbb-cccc-000000000008', 'UX text', 'English', 'UX Design', NOW());
> 
> INSERT IGNORE INTO repurpose_jobs (job_id, content_id, target_platform, target_language, status, created_at) VALUES 
> ('j009-aaaa-bbbb-cccc-000000000009', 'c006-aaaa-bbbb-cccc-000000000006', 'twitter', 'English', 'pending', NOW()),
> ('j012-aaaa-bbbb-cccc-000000000012', 'c009-aaaa-bbbb-cccc-000000000009', 'email', 'French', 'failed', NOW()),
> ('j015-aaaa-bbbb-cccc-000000000015', 'c012-aaaa-bbbb-cccc-000000000012', 'linkedin', 'English', 'pending', NOW());
> -- ---------------------------------------------------------
> ```

---

#### 5.3.1 Transaction 1: Submit New Content and Create a Repurpose Job

**Scenario:** User `u005-aaaa-bbbb-cccc-000000000005 (Rahul Verma)` submits a new article on "Generative AI Trends" and immediately queues a LinkedIn repurpose job. A savepoint is set after content insertion. If the job creation fails, only the job is rolled back; the content is preserved.

```sql
-- Transaction 1: Submit Content + Queue Repurpose Job
START TRANSACTION;

-- Step 1: Insert new content entry
INSERT INTO contents (content_id, user_id, original_text, source_url, language, title, created_at)
VALUES (
    'c021-aaaa-bbbb-cccc-000000000021',
    'u005-aaaa-bbbb-cccc-000000000005',
    'Generative AI is reshaping the creative landscape, enabling models to produce text, images, and code autonomously. Key trends in 2026 include multimodal LLMs, AI agents, and on-device inference...',
    'https://techblog.io/genai-trends-2026',
    'English',
    'Generative AI Trends 2026',
    NOW()
);

-- Step 2: Set savepoint after successful content insertion
SAVEPOINT after_content_insert;

-- Step 3: Create a linked LinkedIn repurpose job
INSERT INTO repurpose_jobs (job_id, content_id, target_platform, target_language, status, created_at)
VALUES (
    'j021-aaaa-bbbb-cccc-000000000021',
    'c021-aaaa-bbbb-cccc-000000000021',
    'linkedin',
    'English',
    'pending',
    NOW()
);

-- Step 4: Simulate error check — verify job inserted correctly
-- (In a real system, application layer would check AI engine availability here)
-- Suppose AI engine is available: proceed

-- Step 5: Update job status to 'processing' after AI engine accepts the job
UPDATE repurpose_jobs
SET status = 'processing'
WHERE job_id = 'j021-aaaa-bbbb-cccc-000000000021';

-- Step 6: Commit all changes — content saved, job queued and processing
COMMIT;

-- Verify the result
SELECT c.title, c.language, rj.target_platform, rj.status
FROM contents c
INNER JOIN repurpose_jobs rj ON c.content_id = rj.content_id
WHERE c.content_id = 'c021-aaaa-bbbb-cccc-000000000021';
```

**Output:**

| title | language | target_platform | status |
|-------|----------|-----------------|--------|
| Generative AI Trends 2026 | English | linkedin | processing |

**Explanation:**
- Content `c021-aaaa-bbbb-cccc-000000000021` successfully inserted and committed
- Job `j021-aaaa-bbbb-cccc-000000000021` created and status updated to `processing`
- SAVEPOINT `after_content_insert` was available in case job creation failed (would have rolled back only the job)
- Final COMMIT makes all changes permanent

---

#### 5.3.2 Transaction 2: Batch Job Submission with Partial Rollback

**Scenario:** User `u001-aaaa-bbbb-cccc-000000000001 (Nikhil Sharma)` queues repurpose jobs for three platforms for existing content `c001-aaaa-bbbb-cccc-000000000001`. The Instagram job fails a validation check. The system rolls back to the savepoint after the Twitter job insertion, then inserts a YouTube Shorts job instead.

```sql
-- Transaction 2: Batch job submission with savepoints
START TRANSACTION;

-- Step 1: Insert LinkedIn job for content c001
INSERT INTO repurpose_jobs (job_id, content_id, target_platform, target_language, status, created_at)
VALUES ('j022-aaaa-bbbb-cccc-000000000022', 'c001-aaaa-bbbb-cccc-000000000001', 'linkedin', 'English', 'pending', NOW());

-- Step 2: Savepoint after LinkedIn job
SAVEPOINT after_linkedin_job;

-- Step 3: Insert Twitter job
INSERT INTO repurpose_jobs (job_id, content_id, target_platform, target_language, status, created_at)
VALUES ('j023-aaaa-bbbb-cccc-000000000023', 'c001-aaaa-bbbb-cccc-000000000001', 'twitter', 'English', 'pending', NOW());

-- Step 4: Savepoint after Twitter job
SAVEPOINT after_twitter_job;

-- Step 5: Attempt Instagram job — simulate a validation failure
-- (e.g., content too long for Instagram caption limit — application detects this)
INSERT INTO repurpose_jobs (job_id, content_id, target_platform, target_language, status, created_at)
VALUES ('j024-aaaa-bbbb-cccc-000000000024', 'c001-aaaa-bbbb-cccc-000000000001', 'instagram', 'English', 'pending', NOW());

-- Step 6: Rollback Instagram job — content is too long for Instagram
ROLLBACK TO SAVEPOINT after_twitter_job;

-- Step 7: Insert a valid YouTube Shorts job instead
INSERT INTO repurpose_jobs (job_id, content_id, target_platform, target_language, status, created_at)
VALUES ('j024-aaaa-bbbb-cccc-000000000024', 'c001-aaaa-bbbb-cccc-000000000001', 'youtube_shorts', 'English', 'pending', NOW());

-- Step 8: Commit LinkedIn, Twitter, and YouTube Shorts jobs
COMMIT;

-- Verify result
SELECT job_id, target_platform, status
FROM repurpose_jobs
WHERE content_id = 'c001-aaaa-bbbb-cccc-000000000001'
ORDER BY created_at DESC
LIMIT 5;
```

**Output:**

| job_id | target_platform | status |
|--------|-----------------|--------|
| j024-aaaa-bbbb-cccc-000000000024 | youtube_shorts | pending |
| j023-aaaa-bbbb-cccc-000000000023 | twitter | pending |
| j022-aaaa-bbbb-cccc-000000000022 | linkedin | pending |
| j002-aaaa-bbbb-cccc-000000000002 | twitter | completed |
| j001-aaaa-bbbb-cccc-000000000001 | linkedin | completed |

**Explanation:**
- LinkedIn (j022-aaaa-bbbb-cccc-000000000022) and Twitter (j023-aaaa-bbbb-cccc-000000000023) jobs were successfully queued
- Instagram job was rolled back via `ROLLBACK TO SAVEPOINT after_twitter_job`
- A replacement YouTube Shorts job (j024-aaaa-bbbb-cccc-000000000024) was inserted and committed
- SAVEPOINT enabled fine-grained recovery within the transaction

---

#### 5.3.3 Transaction 3: Store AI-Generated Output and Mark Job Completed

**Scenario:** The AI engine successfully generates a LinkedIn post for job `j022-aaaa-bbbb-cccc-000000000022`. The system, in a single transaction, stores the output, updates the job status to `completed`, sets the completion timestamp, and logs the status change in the audit log. If storing the output fails, everything is rolled back.

```sql
-- Transaction 3: Store generated output and finalize job
START TRANSACTION;

-- Step 1: Insert the AI-generated output for job j022
INSERT INTO generated_outputs (output_id, job_id, output_text, format_type, is_edited, created_at)
VALUES (
    'o021-aaaa-bbbb-cccc-000000000021',
    'j022-aaaa-bbbb-cccc-000000000022',
    '🤖 Generative AI is no longer science fiction. In 2026, multimodal LLMs are writing code, generating design mockups, and answering complex questions. Here is what every tech leader needs to know about the GenAI revolution... #AI #GenAI #LinkedIn',
    'linkedin_post',
    FALSE,
    NOW()
);

-- Step 2: Set savepoint after output insertion
SAVEPOINT after_output_insert;

-- Step 3: Update job status to 'completed'
UPDATE repurpose_jobs
SET status = 'completed',
    completed_at = NOW()
WHERE job_id = 'j022-aaaa-bbbb-cccc-000000000022';

-- Step 4: Insert audit log entry for status change
INSERT INTO job_audit_log (job_id, old_status, new_status, changed_at)
VALUES ('j022-aaaa-bbbb-cccc-000000000022', 'pending', 'completed', NOW());

-- Step 5: Verify the job status update was applied
-- (Application checks: if rows affected = 0, something went wrong)
-- Assume success: commit all changes
COMMIT;

-- Verify
SELECT rj.job_id, rj.status, rj.completed_at, go.format_type, go.output_text
FROM repurpose_jobs rj
INNER JOIN generated_outputs go ON rj.job_id = go.job_id
WHERE rj.job_id = 'j022-aaaa-bbbb-cccc-000000000022';
```

**Output:**

| job_id | status | completed_at | format_type | output_text |
|--------|--------|--------------|-------------|-------------|
| j022-aaaa-bbbb-cccc-000000000022 | completed | 2026-04-13 21:00:00 | linkedin_post | 🤖 Generative AI is no longer science fiction... |

**Explanation:**
- Output `o021-aaaa-bbbb-cccc-000000000021` inserted and linked to job `j022-aaaa-bbbb-cccc-000000000022`
- Job `j022-aaaa-bbbb-cccc-000000000022` status updated from `pending` → `completed` with timestamp
- Audit log entry recorded the status transition
- SAVEPOINT protects the output insert in case the UPDATE fails
- Single COMMIT atomically finalizes the entire pipeline step

---

#### 5.3.4 Transaction 4: Handle Failed Job and Rollback with Error Flag

**Scenario:** A repurposing job for content `c009-aaaa-bbbb-cccc-000000000009` (French language) is being processed but the AI engine returns an error. The transaction must (1) set the job status to `failed`, (2) log the failure in the audit table, and (3) rollback any partially stored output that may have been attempted. This simulates the error recovery workflow.

```sql
-- Transaction 4: Handle job failure and rollback partial output
START TRANSACTION;

-- Step 1: Update job status to 'processing' (job was previously 'failed', re-attempting)
UPDATE repurpose_jobs
SET status = 'processing'
WHERE job_id = 'j012-aaaa-bbbb-cccc-000000000012';   -- French email job

-- Step 2: Set savepoint before attempting output insertion
SAVEPOINT before_output_attempt;

-- Step 3: Attempt to insert output (simulating AI processing)
INSERT INTO generated_outputs (output_id, job_id, output_text, format_type, is_edited, created_at)
VALUES (
    'o022-aaaa-bbbb-cccc-000000000022',
    'j012-aaaa-bbbb-cccc-000000000012',
    '[PARTIAL OUTPUT] Objet: Révolution du Cloud Computing...',
    'email_newsletter',
    FALSE,
    NOW()
);

-- Step 4: AI engine reports a critical error — output is incomplete/corrupt
-- Rollback to before_output_attempt to discard the partial output
ROLLBACK TO SAVEPOINT before_output_attempt;

-- Step 5: Mark job as 'failed' since output generation failed
UPDATE repurpose_jobs
SET status = 'failed',
    completed_at = NULL
WHERE job_id = 'j012-aaaa-bbbb-cccc-000000000012';

-- Step 6: Log the failure in the audit table
INSERT INTO job_audit_log (job_id, old_status, new_status, changed_at)
VALUES ('j012-aaaa-bbbb-cccc-000000000012', 'processing', 'failed', NOW());

-- Step 7: Commit — only the status update and audit log are saved
COMMIT;

-- Verify: output should NOT exist, job should be 'failed'
SELECT j.job_id, j.status, j.completed_at,
       (SELECT COUNT(*) FROM generated_outputs go WHERE go.job_id = j.job_id) AS output_count
FROM repurpose_jobs j
WHERE j.job_id = 'j012-aaaa-bbbb-cccc-000000000012';
```

**Output:**

| job_id | status | completed_at | output_count |
|--------|--------|--------------|--------------|
| j012-aaaa-bbbb-cccc-000000000012 | failed | NULL | 0 |

**Explanation:**
- Job `j012-aaaa-bbbb-cccc-000000000012` was set to `processing` status
- Partial output `o022-aaaa-bbbb-cccc-000000000022` was inserted but then rolled back to `before_output_attempt`
- Job was marked `failed` and audit log records the transition
- Final state: job is `failed`, no output stored (clean failure)
- This demonstrates how savepoints enable surgical rollback within a transaction

---

#### 5.3.5 Transaction 5: User Profile Update with Content Language Migration

**Scenario:** User `u002-aaaa-bbbb-cccc-000000000002 (Priya Patel)` updates her email address. Simultaneously, the system migrates her content `c004-aaaa-bbbb-cccc-000000000004` from `Spanish` to `English` language (re-classification). Both updates must succeed atomically — if the email update fails (e.g., duplicate email), the content reclassification must also be reversed.

```sql
-- Transaction 5: User profile update + content reclassification
START TRANSACTION;

-- Step 1: Savepoint before any changes
SAVEPOINT transaction_start;

-- Step 2: Update user email address
UPDATE users
SET email = 'priya.patel.new@example.com',
    updated_at = NOW()
WHERE user_id = 'u002-aaaa-bbbb-cccc-000000000002';

-- Step 3: Savepoint after email update
SAVEPOINT after_email_update;

-- Step 4: Reclassify content c004 from Spanish to English
UPDATE contents
SET language = 'English',
    title = 'AI in Business (EN)'
WHERE content_id = 'c004-aaaa-bbbb-cccc-000000000004'
AND user_id = 'u002-aaaa-bbbb-cccc-000000000002';

-- Step 5: Update any pending jobs for this content to use English
UPDATE repurpose_jobs
SET target_language = 'English'
WHERE content_id = 'c004-aaaa-bbbb-cccc-000000000004'
AND status = 'pending';

-- Step 6: Set savepoint after all updates
SAVEPOINT after_all_updates;

-- Step 7: Verify no duplicate email exists (application-layer check)
-- In this case, email is unique — no conflict
-- Proceed to commit all changes

-- Step 8: Insert an audit note in job_audit_log for admin tracking
-- (Re-using audit log to flag content reclassification)
INSERT INTO job_audit_log (job_id, old_status, new_status, changed_at)
SELECT job_id, 'target_lang_es', 'target_lang_en', NOW()
FROM repurpose_jobs
WHERE content_id = 'c004-aaaa-bbbb-cccc-000000000004';

-- Step 9: Commit all changes
COMMIT;

-- Verify results
SELECT u.name, u.email, u.updated_at,
       c.title, c.language
FROM users u
INNER JOIN contents c ON u.user_id = c.user_id
WHERE u.user_id = 'u002-aaaa-bbbb-cccc-000000000002'
AND c.content_id = 'c004-aaaa-bbbb-cccc-000000000004';
```

**Output:**

| name | email | updated_at | title | language |
|------|-------|------------|-------|----------|
| Priya Patel | priya.patel.new@example.com | 2026-04-13 21:05:00 | AI in Business (EN) | English |

**Explanation:**
- User email successfully updated to new address
- Content `c004-aaaa-bbbb-cccc-000000000004` reclassified from Spanish to English with updated title
- Pending jobs for that content updated to target English language
- Audit log entries created to track the language migration
- All changes committed atomically — if the email update had failed, ROLLBACK TO `transaction_start` would undo everything

---

**Sample Output Screenshot (Simulated MySQL Workbench style):**

```
mysql> START TRANSACTION;
Query OK, 0 rows affected (0.00 sec)

mysql> INSERT INTO contents VALUES ('c021', 'u005', 'Generative AI...', ...);
Query OK, 1 row affected (0.02 sec)

mysql> SAVEPOINT after_content_insert;
Query OK, 0 rows affected (0.00 sec)

mysql> INSERT INTO repurpose_jobs VALUES ('j021', 'c021', 'linkedin', 'English', 'pending', NOW());
Query OK, 1 row affected (0.01 sec)

mysql> UPDATE repurpose_jobs SET status = 'processing' WHERE job_id = 'j021';
Query OK, 1 row affected (0.01 sec)
Rows matched: 1  Changed: 1  Warnings: 0

mysql> COMMIT;
Query OK, 0 rows affected (0.04 sec)
```

---

### 5.3 Concurrency Control

**Concurrency control** is the mechanism by which a DBMS manages simultaneous access to shared data by multiple transactions, ensuring that the database remains in a consistent state. In the AI Content Repurposer system, multiple users may concurrently submit new content, queue repurpose jobs, and retrieve generated outputs. Without proper concurrency control, race conditions and data anomalies would occur.

**Common Concurrency Problems Prevented by Concurrency Control:**

| Problem | Description | Example in AI Content Repurposer |
|---------|-------------|-----------------------------------|
| **Dirty Read** | A transaction reads data written by another uncommitted transaction | Session A reads job status as `processing`, but Session B never committed that update |
| **Non-Repeatable Read** | Data read twice within a transaction returns different values | A dashboard reads output count as 5, then reads it as 6 before the transaction ends |
| **Phantom Read** | New rows appear between two reads of the same query within a transaction | A report transaction misses newly inserted jobs between its two SELECT statements |
| **Lost Update** | Two transactions overwrite each other's updates | Two sessions simultaneously mark job `j001` as `completed`, one overwriting the other |

---

#### 5.3.1 Concurrency Control Algorithms

**1. Lock-Based Protocols:**
The most common concurrency control technique in MySQL/InnoDB. Transactions acquire locks on data items before accessing them, preventing conflicts.

- **Two-Phase Locking (2PL):** Transactions acquire all locks in the "growing phase" before releasing any in the "shrinking phase." This ensures serializability.
- **Strict 2PL:** All exclusive locks are held until the transaction commits or rolls back — the default behavior in InnoDB.

**2. Timestamp-Based Protocols:**
Each transaction is assigned a unique timestamp at the start. Read/write operations are validated against timestamps to ensure serial order. If a conflict is detected, the younger transaction is rolled back.

**3. Optimistic Concurrency Control (OCC):**
Transactions execute freely without locks, then validate at commit time whether any conflicts occurred. If conflicts exist, the transaction is restarted. Suitable for read-heavy workloads.

**4. Multi-Version Concurrency Control (MVCC):**
MySQL InnoDB's default mechanism. Multiple versions of a data item are maintained, allowing readers to access old versions while writers create new ones. Readers never block writers and writers never block readers.

---

#### 5.3.2 Locking Commands

MySQL InnoDB provides several locking mechanisms to control concurrent access:

##### a. Row-Level Locking – `SELECT ... FOR UPDATE`

Acquires an **exclusive lock** on the selected rows, preventing other transactions from modifying or locking those rows until the current transaction is committed or rolled back.

```sql
-- Row-Level Lock: Lock a specific job row before updating it
START TRANSACTION;

SELECT * FROM repurpose_jobs
WHERE job_id = 'j018'
FOR UPDATE;

-- Other sessions cannot modify j018 until this transaction ends
UPDATE repurpose_jobs
SET status = 'completed', completed_at = NOW()
WHERE job_id = 'j018';

COMMIT;
```

**Use Case in AI Content Repurposer:** The AI processing engine acquires a row-level lock on a job before updating its status to `processing`. This ensures two concurrent AI worker threads cannot both pick up the same job simultaneously.

##### b. Table-Level Locking – `LOCK TABLE`

Acquires a lock on an **entire table**, preventing other sessions from performing certain operations on the table depending on the lock mode.

```sql
-- Table-Level Lock: Lock repurpose_jobs for batch status update
LOCK TABLE repurpose_jobs WRITE;

-- Perform batch update safely
UPDATE repurpose_jobs
SET status = 'failed'
WHERE status = 'pending'
AND created_at < DATE_SUB(NOW(), INTERVAL 48 HOUR);

UNLOCK TABLES;
```

**Use Case:** The system's maintenance task that marks stale pending jobs as failed uses a WRITE lock on `repurpose_jobs` to prevent new job insertions during the batch update.

##### Lock Modes

| Lock Mode | Description | Typical Use |
|-----------|-------------|-------------|
| **ROW SHARE** | Allows concurrent read access; prevents other sessions from locking the table exclusively. Other sessions can still read and DML. | `SELECT ... LOCK IN SHARE MODE` — reading with intent to update |
| **ROW EXCLUSIVE** | Prevents other sessions from locking in SHARE mode. Used automatically for DML (INSERT, UPDATE, DELETE). | Implicit with any DML operation in InnoDB |
| **SHARE** | Allows queries by other sessions but blocks all UPDATE, DELETE, and INSERT operations on the table. | Used when generating consistent reports from a table |
| **SHARE ROW EXCLUSIVE** | More restrictive than SHARE; prevents any other SHARE or DML locks. Only one session can hold this lock. | Used when performing complex read + conditional write operations |
| **EXCLUSIVE** | Prevents all other access — full table lock. No other session can read or write. | Used for DDL-like bulk operations that must run in complete isolation |

```sql
-- Example: SHARE mode — allow reads, prevent writes during report generation
LOCK TABLE generated_outputs READ;

SELECT format_type, COUNT(*) AS output_count, 
       SUM(is_edited) AS edited_count
FROM generated_outputs
GROUP BY format_type;

UNLOCK TABLES;
```

**Output:**

| format_type | output_count | edited_count |
|-------------|--------------|--------------|
| linkedin_post | 5 | 0 |
| tweet | 4 | 1 |
| email_newsletter | 2 | 1 |
| youtube_script | 1 | 1 |
| instagram_caption | 1 | 0 |
| youtube_short | 1 | 0 |

##### c. COMMIT – Release All Locks

When a transaction issues a `COMMIT`, all row-level and table-level locks acquired during that transaction are **automatically released**. Other waiting transactions can then proceed.

```sql
START TRANSACTION;

-- Locks acquired on repurpose_jobs row j021
SELECT * FROM repurpose_jobs WHERE job_id = 'j021-aaaa-bbbb-cccc-000000000021' FOR UPDATE;
UPDATE repurpose_jobs SET status = 'completed', completed_at = NOW() WHERE job_id = 'j021-aaaa-bbbb-cccc-000000000021';

COMMIT;
-- All locks on j021-aaaa-bbbb-cccc-000000000021 are now released
-- Other sessions that were waiting can now access j021
```

**Key Point:** InnoDB does not support manual lock release commands — locks are always tied to the transaction lifecycle. COMMIT (or ROLLBACK) is the only way to release row-level locks.

##### d. ROLLBACK – Undo Changes and Release Locks

`ROLLBACK` simultaneously undoes all uncommitted changes AND releases all locks held by the current transaction. This is critical in the AI Content Repurposer for error recovery — if an AI engine call fails, the ROLLBACK ensures:
1. No partial data persists in the database
2. All locked rows (jobs, outputs) are released immediately for other sessions

```sql
START TRANSACTION;

-- Lock job j023 for processing
SELECT * FROM repurpose_jobs WHERE job_id = 'j023-aaaa-bbbb-cccc-000000000023' FOR UPDATE;
UPDATE repurpose_jobs SET status = 'processing' WHERE job_id = 'j023-aaaa-bbbb-cccc-000000000023';

-- Attempt to insert output — AI engine returns error
INSERT INTO generated_outputs (output_id, job_id, output_text, format_type, is_edited)
VALUES ('o099-aaaa-bbbb-cccc-000000000099', 'j023-aaaa-bbbb-cccc-000000000023', '[ERROR OUTPUT]', 'tweet', FALSE);

-- AI error detected: rollback everything
ROLLBACK;
-- j023 is back to 'pending', lock is released, o099 never persisted
```

---

##### 5.3.2 Example: Concurrency Control in AI Content Repurposer

**Scenario:** Two concurrent AI worker threads (Session A and Session B) both try to pick up and process pending repurpose jobs. Without proper locking, both could pick up the same job. Using `SELECT ... FOR UPDATE` with a transaction, only one session gets the lock; the other waits and then fetches a different job.

```sql
-- ================================================================
-- SESSION A: AI Worker Thread 1 — Picks up first pending job
-- ================================================================

-- Session A starts transaction and locks the first pending job
START TRANSACTION;

-- SELECT FOR UPDATE: locks the row, Session B cannot touch this row now
SELECT job_id, content_id, target_platform, target_language, status
FROM repurpose_jobs
WHERE status = 'pending'
ORDER BY created_at ASC
LIMIT 1
FOR UPDATE;
```

**Session A Output (locked row):**

| job_id | content_id | target_platform | target_language | status |
|--------|------------|-----------------|-----------------|--------|
| j009-aaaa-bbbb-cccc-000000000009 | c006-aaaa-bbbb-cccc-000000000006 | twitter | English | pending |

```sql
-- Session A: Mark the job as processing
UPDATE repurpose_jobs
SET status = 'processing'
WHERE job_id = 'j009-aaaa-bbbb-cccc-000000000009';

-- ================================================================
-- SESSION B: AI Worker Thread 2 — Concurrently tries to pick a job
-- (Runs simultaneously with Session A)
-- ================================================================

-- Session B also starts transaction and tries to lock first pending job
-- Since j009 is locked by Session A, Session B WAITS or skips to next
START TRANSACTION;

SELECT job_id, content_id, target_platform, target_language, status
FROM repurpose_jobs
WHERE status = 'pending'
ORDER BY created_at ASC
LIMIT 1
FOR UPDATE SKIP LOCKED;  -- SKIP LOCKED: skip rows locked by other sessions
```

**Session B Output (gets next available unlocked row):**

| job_id | content_id | target_platform | target_language | status |
|--------|------------|-----------------|-----------------|--------|
| j015-aaaa-bbbb-cccc-000000000015 | c012-aaaa-bbbb-cccc-000000000012 | linkedin | English | pending |

```sql
-- Session B: Marks its own job as processing (no conflict with Session A)
UPDATE repurpose_jobs
SET status = 'processing'
WHERE job_id = 'j015-aaaa-bbbb-cccc-000000000015';

-- ================================================================
-- SESSION A: Completes processing, inserts output, commits
-- ================================================================

INSERT INTO generated_outputs (output_id, job_id, output_text, format_type, is_edited)
VALUES (
    'o023-aaaa-bbbb-cccc-000000000023',
    'j009-aaaa-bbbb-cccc-000000000009',
    '⚠️ Cybersecurity in 2026: AI-powered attacks are outpacing traditional defenses. Zero-trust architecture is no longer optional. #CyberSecurity #AI #InfoSec',
    'tweet',
    FALSE
);

UPDATE repurpose_jobs
SET status = 'completed', completed_at = NOW()
WHERE job_id = 'j009-aaaa-bbbb-cccc-000000000009';

INSERT INTO job_audit_log (job_id, old_status, new_status, changed_at)
VALUES ('j009-aaaa-bbbb-cccc-000000000009', 'processing', 'completed', NOW());

COMMIT;  -- Session A releases all locks on j009-aaaa-bbbb-cccc-000000000009

-- ================================================================
-- SESSION B: Completes its job and commits
-- ================================================================

INSERT INTO generated_outputs (output_id, job_id, output_text, format_type, is_edited)
VALUES (
    'o024-aaaa-bbbb-cccc-000000000024',
    'j015-aaaa-bbbb-cccc-000000000015',
    '🎨 UX is not just about looks — it is about behavior, cognition, and empathy. Here are the 5 UX principles every product designer must master in 2026...',
    'linkedin_post',
    FALSE
);

UPDATE repurpose_jobs
SET status = 'completed', completed_at = NOW()
WHERE job_id = 'j015-aaaa-bbbb-cccc-000000000015';

INSERT INTO job_audit_log (job_id, old_status, new_status, changed_at)
VALUES ('j015-aaaa-bbbb-cccc-000000000015', 'processing', 'completed', NOW());

COMMIT;  -- Session B releases all locks on j015-aaaa-bbbb-cccc-000000000015

-- ================================================================
-- Final Verification: Both jobs completed without conflict
-- ================================================================

SELECT job_id, target_platform, status, completed_at
FROM repurpose_jobs
WHERE job_id IN ('j009-aaaa-bbbb-cccc-000000000009', 'j015-aaaa-bbbb-cccc-000000000015');
```

**Final Output:**

| job_id | target_platform | status | completed_at |
|--------|-----------------|--------|--------------|
| j009-aaaa-bbbb-cccc-000000000009 | twitter | completed | 2026-04-13 21:10:00 |
| j015-aaaa-bbbb-cccc-000000000015 | linkedin | completed | 2026-04-13 21:10:05 |

**Concurrency Control Summary:**

| Mechanism Used | Purpose | Result |
|----------------|---------|--------|
| `START TRANSACTION` | Begin isolated transaction for each worker | Each worker's changes are isolated |
| `SELECT ... FOR UPDATE` | Acquire exclusive row lock on pending job | Prevents two workers picking same job |
| `SKIP LOCKED` | Skip rows already locked by other sessions | Session B automatically gets next available job |
| `COMMIT` | Finalize all changes and release locks | Other sessions unblocked after commit |
| `ROLLBACK` (on error) | Undo partial changes and release locks | Database remains consistent on failure |

**Key Takeaway:** Using `SELECT ... FOR UPDATE SKIP LOCKED` is the optimal pattern for a job queue system like the AI Content Repurposer, where multiple concurrent AI workers must process distinct jobs without stepping on each other's data. This is superior to application-level locking because MySQL guarantees atomicity at the database level.

---

*End of Chapter 5*
