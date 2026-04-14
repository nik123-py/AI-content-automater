# STUDY & REVIEW QUESTIONS
## Chapter 4: Normalization | Chapter 5: Transactions & Concurrency Control
### AI Content Repurposer – DBMS Project

> **Exam Tip:** Questions are grouped by difficulty: ⭐ Basic | ⭐⭐ Intermediate | ⭐⭐⭐ Advanced.  
> Reviewer can ask any question from any section. Know both definitions AND project-specific examples.

---

# PART A — CHAPTER 4: NORMALIZATION

---

## SECTION 1 — Anomalies & Pitfalls ⭐

**Q1.** What is a database anomaly? Name and define the three main types of anomalies found in un-normalized relations.

> **Expected Answer:**
> A database anomaly is an undesirable side-effect that can occur during data manipulation operations on a poorly designed relation.
>
> - **Insertion Anomaly:** Cannot insert data about one entity without having data about another entity. (*In the AI Content Repurposer flat table, a new user cannot be inserted unless they also have at least one content, job, and output entry.*)
> - **Deletion Anomaly:** Deleting a record unintentionally destroys other important data. (*Deleting the only output `o005` linked to job `j006` would also erase all information about job `j006`, content `c004`, and user `u002`.*)
> - **Update Anomaly:** Updating one piece of data requires multiple rows to be changed. (*Changing Nikhil Sharma's email requires updating every row containing `u001`, causing inconsistency if any row is missed.*)

---

**Q2.** What is data redundancy? How does it relate to anomalies in the flat `content_repurposer_flat` table of your project?

> **Expected Answer:**
> Data redundancy means the same piece of information is stored in multiple places. In the flat table, user details (`user_name`, `user_email`, `password_hash`) are repeated for every row belonging to that user. Content details (`content_title`, `content_lang`) are repeated for every job created from that content. This redundancy directly causes update anomalies (must update in many places) and wastes storage.

---

**Q3.** Why are NULL values considered a pitfall in a flat relation? Give an example from your project.

> **Expected Answer:**
> NULL values indicate missing or inapplicable data. In the flat table, when a job fails (e.g., job `j005` for Instagram), the output columns (`output_id`, `output_text`, `format_type`, `is_edited`) must all be NULL. This creates sparse rows, complicates aggregate queries (e.g., `COUNT(output_id)` differs from `COUNT(*)`), and makes it hard to distinguish "no output yet" from "output does not apply."

---

## SECTION 2 — First Normal Form (1NF) ⭐

**Q4.** State the four conditions a relation must satisfy to be in First Normal Form (1NF).

> **Expected Answer:**
> 1. All attribute values must be **atomic** (indivisible — no lists, sets, or multi-valued cells).
> 2. Each column must contain values of a **single type**.
> 3. Each row must be **uniquely identifiable** (a primary key must exist).
> 4. There must be **no repeating groups** (no columns representing the same attribute at different positions, e.g., `platform1`, `platform2`, `platform3`).

---

**Q5.** What is a repeating group? Give an example of a repeating group that might appear in the context of your AI Content Repurposer project before 1NF is applied.

> **Expected Answer:**
> A repeating group is a set of columns that hold multiple values of the same type for a single entity. Example: Storing a user's job IDs as `"j001, j002, j003"` in a single column called `job_ids`, or having separate columns `job_id_1`, `job_id_2`, `job_id_3`. This violates atomicity. After 1NF, each job gets its own separate row.

---

**Q6.** After converting the flat table to 1NF, what was the composite primary key defined? Why is a composite key needed at this stage?

> **Expected Answer:**
> The composite primary key is **(user_id, content_id, job_id, output_id)**. A composite key is needed because no single attribute uniquely identifies a row in the 1NF table — a user can have multiple contents, a content can have multiple jobs, and a job can have multiple outputs. The four-attribute combination is the minimal set needed to uniquely identify every row.

---

**Q7.** Does the 1NF table still have problems after normalization? Explain.

> **Expected Answer:**
> Yes. The 1NF table still has **partial dependencies**. Non-key attributes depend only on *parts* of the composite primary key rather than the full key. For example, `user_name` depends only on `user_id`, not on the full key `(user_id, content_id, job_id, output_id)`. This redundancy is addressed by 2NF.

---

## SECTION 3 — Second Normal Form (2NF) ⭐⭐

**Q8.** Define Second Normal Form. What is a partial dependency? How is it different from a full functional dependency?

> **Expected Answer:**
> A relation is in **2NF** if it is in 1NF AND every non-key attribute is **fully functionally dependent** on the **entire** primary key.
>
> - **Partial Dependency:** A non-key attribute depends on only a *part* of the composite primary key. Example: `user_name` depends on `user_id` alone — it does not need the full key `(user_id, content_id, job_id, output_id)`.
> - **Full Functional Dependency:** A non-key attribute depends on the *whole* primary key and cannot be determined by any proper subset of it. Example: An attribute `combined_output_score` hypothetically depending on all four key components.

---

**Q9.** List all the partial dependencies found in the 1NF table of your project. Which non-key attributes depend on which parts of the key?

> **Expected Answer:**
>
> | Determinant (Partial Key) | Dependent Attributes |
> |---------------------------|----------------------|
> | `user_id` | user_name, user_email, user_pwd, created_at, updated_at |
> | `content_id` | content_title, content_lang, source_url, user_id |
> | `job_id` | target_platform, target_language, job_status, completed_at |
> | `output_id` | output_text, format_type, is_edited |

---

**Q10.** After applying 2NF to your project, how many separate relations were created? Name them and their primary keys.

> **Expected Answer:**
> Four relations:
> 1. **users** — PK: `user_id`
> 2. **contents** — PK: `content_id`, FK: `user_id → users`
> 3. **repurpose_jobs** — PK: `job_id`, FK: `content_id → contents`
> 4. **generated_outputs** — PK: `output_id`, FK: `job_id → repurpose_jobs`

---

**Q11.** Why does 2NF only matter for relations with composite primary keys?

> **Expected Answer:**
> Partial dependency means a non-key attribute depends on *part* of the key. If a relation has a **single-attribute primary key**, there is no "part" of the key — a non-key attribute either depends on the whole key or it doesn't belong in the relation at all. Therefore, any relation with a single-column PK that is already in 1NF is automatically in 2NF.

---

## SECTION 4 — Third Normal Form (3NF) ⭐⭐

**Q12.** Define Third Normal Form and explain what a transitive dependency is. Give a formula notation.

> **Expected Answer:**
> A relation is in **3NF** if it is in 2NF AND there are **no transitive dependencies** — no non-key attribute depends on another non-key attribute.
>
> **Transitive Dependency:** If `A → B` and `B → C` and `B` is NOT a candidate key, then `C` is transitively dependent on `A` through `B`. Notation: `A → B → C` (violation if B is non-key).
>
> Example from project: `content_id → content_lang → language_family`. Here `language_family` depends on `content_lang` (a non-key attribute), not directly on `content_id`.

---

**Q13.** What transitive dependency was identified in the `repurpose_jobs` table in your project? How was it resolved?

> **Expected Answer:**
> The transitive dependency was:
> `job_id → target_platform → platform_category`
>
> `platform_category` (e.g., "Social Media", "Email Marketing", "Video") is a fact about `target_platform`, not about `job_id` directly. This was resolved by extracting a new **`platforms`** table with `platform_name` as the primary key, storing `platform_category`, `max_char_limit`, and `supports_media`. The `repurpose_jobs` table now references `target_platform` as a foreign key to this new table.

---

**Q14.** Distinguish between 2NF violation and 3NF violation using the terminology of functional dependencies.

> **Expected Answer:**
>
> | Property | 2NF Violation | 3NF Violation |
> |----------|---------------|---------------|
> | Type | Partial dependence on key | Transitive dependence via non-key |
> | Pattern | Part of PK → non-key attribute | Non-key attr → non-key attr |
> | Applies to | Tables with composite PKs only | All tables (even single-column PK) |
> | Example | `user_id → user_name` (user_id is only part of PK) | `content_lang → language_family` (both non-key) |

---

**Q15.** After applying 3NF, what new tables were created from your project schema? Write their schemas.

> **Expected Answer:**
> Two new tables:
>
> **platforms** (PK: `platform_name`):
> `platform_name, platform_category, max_char_limit, supports_media`
>
> **supported_languages** (PK: `language_name`):
> `language_name, language_family, iso_code, rtl_support`
>
> The original tables retained their structure but now reference these new tables via foreign keys.

---

## SECTION 5 — Boyce-Codd Normal Form (BCNF) ⭐⭐

**Q16.** State the definition of BCNF. How is it different from 3NF?

> **Expected Answer:**
> A relation is in **BCNF** if for every functional dependency `X → Y`, `X` must be a **superkey** (i.e., X uniquely identifies all tuples in the relation).
>
> **Difference from 3NF:** 3NF allows a non-prime attribute to be determined by a non-superkey if the determinant is part of some candidate key. BCNF is stricter — it requires the left-hand side of EVERY functional dependency to be a superkey, with no exceptions. Therefore, every relation in BCNF is in 3NF, but not every 3NF relation is in BCNF.

---

**Q17.** Describe the BCNF violation found in your project. What relation had the violation, and what was the problematic functional dependency?

> **Expected Answer:**
> The violation was in the hypothetical `job_output_assignment` relation with schema:
> `(job_id, output_id, reviewer_email, reviewer_name)`
>
> Primary Key: `(job_id, output_id)`
>
> The problematic FD was: `reviewer_email → reviewer_name`
>
> Here `reviewer_email` determines `reviewer_name`, but `reviewer_email` alone is NOT a superkey of the relation (it doesn't uniquely identify each row since the same reviewer can review multiple job-output pairs). This violates BCNF.

---

**Q18.** Is every BCNF decomposition lossless? Is it always dependency-preserving? Explain.

> **Expected Answer:**
> - **Lossless:** BCNF decomposition is always **lossless** (the original relation can be reconstructed exactly via natural join of the decomposed relations without generating spurious tuples).
> - **Dependency-Preserving:** BCNF decomposition is **NOT always dependency-preserving**. Some functional dependencies may span across decomposed tables and cannot be checked without performing a join. This is a trade-off — BCNF gives stronger normalization but may require additional constraints to enforce cross-table FDs.

---

**Q19.** Can a relation be in 3NF but NOT in BCNF? Give a general example.

> **Expected Answer:**
> Yes. Consider a relation **Schedule(student, course, teacher)** where:
> - Each course is taught by exactly one teacher: `course → teacher`
> - Each teacher teaches only one course: `teacher → course`
> - A student can take multiple courses: `(student, course) → teacher`
>
> Candidate keys: `(student, course)` and `(student, teacher)`
> FD: `teacher → course` — `teacher` is NOT a superkey, but `course` is a prime attribute (part of a candidate key).
> In 3NF: `teacher → course` is allowed because `course` is prime.
> In BCNF: `teacher → course` is a violation because `teacher` is not a superkey.
> Hence the relation is in 3NF but NOT in BCNF.

---

## SECTION 6 — Fourth Normal Form (4NF) ⭐⭐⭐

**Q20.** Define a Multi-Valued Dependency (MVD). How is it different from a functional dependency?

> **Expected Answer:**
> A **Multi-Valued Dependency (MVD)** `A →→ B` exists in relation R(A, B, C) when for each value of A, the set of B values is independent of all C values. In other words, knowing A tells you a *set* of B values, regardless of C.
>
> | Property | Functional Dependency (FD) | Multi-Valued Dependency (MVD) |
> |----------|---------------------------|-------------------------------|
> | Output | One specific value | A **set** of values |
> | Notation | A → B | A →→ B |
> | Example | `user_id → user_name` (one name per user) | `user_id →→ target_platform` (a set of platforms per user) |
> | Redundancy | Causes repeating rows if B has multiple values | Causes cross-product rows if there are two independent MVDs |

---

**Q21.** What was the MVD violation identified in your AI Content Repurposer project, and how was it resolved?

> **Expected Answer:**
> In the `user_platform_language` relation, two MVDs existed:
> - `user_id →→ target_platform` (a user uses many platforms, independently of language)
> - `user_id →→ target_language` (a user outputs in many languages, independently of platform)
>
> Since both sets are independent of each other, storing them in one table forces a cross-product (2 platforms × 2 languages = 4 rows per user), causing redundancy.
>
> **Resolution:** Decomposed into two relations:
> - `user_platforms(user_id, target_platform)` — PK: (user_id, target_platform)
> - `user_languages(user_id, target_language)` — PK: (user_id, target_language)

---

**Q22.** Define 4NF formally. What condition must every relation satisfy to be in 4NF?

> **Expected Answer:**
> A relation R is in **4NF** if and only if:
> - R is in **BCNF**, AND
> - For every non-trivial multi-valued dependency `A →→ B` in R, **A is a superkey** of R.
>
> A trivial MVD is one where B ⊆ A or A ∪ B = R (the entire schema). Only non-trivial MVDs (where B is not a subset of A) need to be checked.

---

## SECTION 7 — Fifth Normal Form (5NF) ⭐⭐⭐

**Q23.** What is a Join Dependency? Define 5NF in your own words.

> **Expected Answer:**
> A **Join Dependency (JD)** `⋈{R1, R2, ..., Rn}` on relation R means that R can be **losslessly** decomposed into R1, R2, ..., Rn — and reconstructed exactly by their natural join.
>
> **5NF (Project-Join Normal Form):** A relation is in 5NF if it is in 4NF AND every non-trivial join dependency in R is implied by the candidate keys of R. In other words, R cannot be further decomposed without losing information, unless the decomposition is forced by the candidate keys themselves.

---

**Q24.** Describe the 5NF scenario from your project. What ternary relation was involved, and into what three binary relations was it decomposed?

> **Expected Answer:**
> The ternary relation was `user_content_platform_pref(user_id, content_id, target_platform)`.
>
> **Join Dependency:** This relation can be reconstructed by joining:
> - R1 ⋈ R2 ⋈ R3 (where join is on shared attributes)
>
> **Decomposition into three binary relations:**
> 1. `user_content_access(user_id, content_id)` — which user accesses which content
> 2. `content_platform_targets(content_id, target_platform)` — which platforms a content targets
> 3. `user_platform_approval(user_id, target_platform)` — which platforms a user has approved
>
> The lossless join SQL reconstructs the original exactly:
> ```sql
> SELECT r1.user_id, r2.content_id, r3.target_platform
> FROM user_content_access r1
> INNER JOIN content_platform_targets r2 ON r1.content_id = r2.content_id
> INNER JOIN user_platform_approval r3 ON r1.user_id = r3.user_id
>                                      AND r2.target_platform = r3.target_platform;
> ```

---

**Q25.** What is the difference between a lossy decomposition and a lossless decomposition? Why is lossless decomposition critical in normalization?

> **Expected Answer:**
> - **Lossless Decomposition:** When you join the decomposed sub-relations, you get back *exactly* the original relation — no spurious (fake) tuples are added, and no original tuples are lost.
> - **Lossy Decomposition:** Joining the decomposed relations produces *more or fewer* tuples than the original — spurious tuples appear because the join condition produces false combinations.
>
> **Why critical:** If decomposition is lossy, you cannot reconstruct the original data. The normalized schema would be incorrect — queries would return wrong results. Every normalization step must preserve the original data through lossless join.

---

## SECTION 8 — General Normalization ⭐⭐

**Q26.** Fill in the normalization hierarchy. What does each form add on top of the previous?

> **Expected Answer:**
>
> | Normal Form | Requirement Added Over Previous |
> |-------------|----------------------------------|
> | 1NF | Atomic values, single-valued columns, unique rows, no repeating groups |
> | 2NF | No partial dependencies (non-key attrs depend on FULL key) |
> | 3NF | No transitive dependencies (non-key attr must not depend on non-key attr) |
> | BCNF | Every FD determinant must be a superkey |
> | 4NF | No non-trivial multi-valued dependencies (determinant must be superkey) |
> | 5NF | No non-trivial join dependencies not implied by candidate keys |

---

**Q27.** What is the difference between a candidate key, a primary key, and a superkey?

> **Expected Answer:**
> - **Superkey:** Any set of attributes that *can* uniquely identify every tuple in a relation. Can contain extra attributes. Example: `{user_id, email, name}` is a superkey of `users`.
> - **Candidate Key:** A *minimal* superkey — removing any attribute from it would lose the uniqueness property. Example: `user_id` alone and `email` alone are both candidate keys of `users`.
> - **Primary Key:** The *chosen* candidate key — one specific candidate key selected by the designer to be the official identifier. Example: `user_id` is the primary key of `users`.

---

**Q28.** What is a prime attribute vs. a non-prime attribute? Why does the distinction matter in 2NF and 3NF?

> **Expected Answer:**
> - **Prime Attribute:** An attribute that is part of *any* candidate key of the relation.
> - **Non-Prime Attribute:** An attribute that is NOT part of any candidate key.
>
> **Why it matters:**
> - **2NF** requires that every *non-prime* attribute is fully functionally dependent on every candidate key (no partial dependence of non-prime attrs on part of a key).
> - **3NF** requires that no *non-prime* attribute transitively depends on any candidate key through another non-prime attribute.
> - BCNF is stricter — it applies the rule to ALL attributes (prime and non-prime), not just non-prime ones.

---

**Q29.** Can you explain why normalization beyond 3NF is rarely done in practice? When is it actually needed?

> **Expected Answer:**
> - **BCNF and beyond** are rarely applied in practice because:
>   - The violations (MVDs, JDs) are uncommon in typical business schemas
>   - Higher normal forms may break dependency preservation, requiring extra application-level enforcement
>   - Decomposed tables require more joins, potentially impacting query performance
>   - Real-world databases often "denormalize" intentionally for read performance (e.g., in analytics/data warehouses)
>
> - **When needed:**
>   - 4NF is needed when a table genuinely stores two independent many-to-many relationships about the same entity
>   - 5NF is needed in complex many-to-many-to-many ternary relationships where eliminating redundancy requires three-way decomposition

---

**Q30.** What is the overall effect of normalization on the AI Content Repurposer database schema? (State the number of tables at each stage.)

> **Expected Answer:**
>
> | Stage | Number of Relations | Relations |
> |-------|---------------------|-----------|
> | Flat (0NF) | 1 | content_repurposer_flat |
> | 1NF | 1 | content_repurposer_1NF (composite PK) |
> | 2NF | 4 | users, contents, repurpose_jobs, generated_outputs |
> | 3NF | 6 | +platforms, +supported_languages |
> | BCNF | 7 | +reviewers (from job_output_assignment) |
> | 4NF | 9 | +user_platforms, +user_languages |
> | 5NF | 11 | +user_content_access, +content_platform_targets, +user_platform_approval |

---

# PART B — CHAPTER 5: TRANSACTIONS & CONCURRENCY CONTROL

---

## SECTION 9 — Transaction Basics ⭐

**Q31.** What is a database transaction? Why are transactions necessary in the AI Content Repurposer system?

> **Expected Answer:**
> A **transaction** is a logical unit of work comprising one or more SQL operations that must be executed as a single atomic operation — either all operations succeed or none of them take effect.
>
> **Necessity in AI Content Repurposer:**
> When a user submits a repurposing request, three steps must happen atomically:
> 1. Insert the content record
> 2. Create the repurpose job
> 3. Store the AI-generated output
>
> If step 2 fails after step 1 succeeds (e.g., the AI engine is unavailable), the database would have a content record with no associated job — an inconsistent state. Transactions prevent this by rolling back all steps if any fails.

---

**Q32.** State and explain all four ACID properties with examples from your project.

> **Expected Answer:**
>
> | Property | Meaning | Project Example |
> |----------|---------|-----------------|
> | **Atomicity** | All-or-nothing execution | Inserting content (c021) + job (j021) + updating status — either all succeed or none persist. |
> | **Consistency** | DB moves between valid states | After any transaction, `status` in `repurpose_jobs` must still be one of: pending/processing/completed/failed (constraint maintained). |
> | **Isolation** | Concurrent txns appear serial | While Session A processes job j009, Session B cannot see the intermediate `status = 'processing'` state that hasn't been committed yet. |
> | **Durability** | Committed data survives crashes | After COMMIT in Transaction 3, the LinkedIn post for job j022 is permanently stored even if MySQL server crashes immediately after. |

---

**Q33.** Draw and explain the five states of a transaction. What triggers each transition?

> **Expected Answer:**
>
> ```
> ACTIVE → (all SQL executed) → PARTIALLY COMMITTED → (write to disk OK) → COMMITTED
>                                       ↓ (disk write fails)
>                                    FAILED → (ROLLBACK) → ABORTED
> ACTIVE → (error mid-transaction) → FAILED → (ROLLBACK) → ABORTED
> ```
>
> | State | Description | Trigger |
> |-------|-------------|---------|
> | **Active** | Executing SQL statements | `START TRANSACTION` |
> | **Partially Committed** | Last statement executed, awaiting flush to disk | All SQL statements done |
> | **Committed** | Changes permanently written, locks released | `COMMIT` success |
> | **Failed** | Error occurred, cannot proceed | Error during execution or commit |
> | **Aborted** | Changes undone, DB restored to pre-transaction state | `ROLLBACK` |

---

## SECTION 10 — TCL Commands ⭐

**Q34.** What does TCL stand for? List all TCL commands and their functions.

> **Expected Answer:**
> **TCL = Transaction Control Language**
>
> | Command | Function |
> |---------|----------|
> | `COMMIT` | Permanently saves all changes; releases all locks |
> | `ROLLBACK` | Undoes all uncommitted changes; releases all locks |
> | `SAVEPOINT name` | Sets an intermediate checkpoint within a transaction |
> | `ROLLBACK TO SAVEPOINT name` | Reverts to a specific savepoint without aborting the full transaction |
> | `RELEASE SAVEPOINT name` | Removes a savepoint (it can no longer be rolled back to) |
> | `SET TRANSACTION` | Sets transaction properties (isolation level, read-only mode, etc.) |

---

**Q35.** What is autocommit in MySQL? How do you disable it, and why would you want to?

> **Expected Answer:**
> **Autocommit** is a MySQL mode where each individual SQL statement is automatically committed immediately after execution. By default, `autocommit = 1` (ON) in MySQL.
>
> **To disable:**
> ```sql
> SET autocommit = 0;         -- Disables for the session
> -- OR start an explicit transaction:
> START TRANSACTION;          -- Temporarily disables autocommit for this one transaction
> ```
>
> **Why disable:** When you need to group multiple statements into one atomic operation. If autocommit is ON, running `INSERT + UPDATE` separately means the INSERT is committed before the UPDATE runs — if the UPDATE fails, the INSERT cannot be rolled back. Disabling autocommit lets both succeed or fail together.

---

**Q36.** Explain the purpose of SAVEPOINT with a real scenario from your project.

> **Expected Answer:**
> A **SAVEPOINT** sets an intermediate checkpoint within a transaction, allowing partial rollback without aborting the entire transaction.
>
> **Project Scenario (Transaction 2 — Batch Job Submission):**
> User `u001` queues three jobs for `content c001`:
> 1. LinkedIn job → **SAVEPOINT after_linkedin_job**
> 2. Twitter job → **SAVEPOINT after_twitter_job**
> 3. Instagram job → validation fails (content too long)
>
> Instead of rolling back everything (losing the LinkedIn and Twitter jobs), we `ROLLBACK TO SAVEPOINT after_twitter_job` — only the Instagram job is discarded. We then insert a valid YouTube Shorts job and commit. Savepoints enabled surgical recovery.

---

**Q37.** What is the difference between `ROLLBACK` and `ROLLBACK TO SAVEPOINT`?

> **Expected Answer:**
>
> | Feature | `ROLLBACK` | `ROLLBACK TO SAVEPOINT sp_name` |
> |---------|------------|----------------------------------|
> | Scope | Undoes **all** changes since `START TRANSACTION` | Undoes changes only **since the named savepoint** |
> | Transaction status | Transaction **ends** (aborted state) | Transaction remains **active** (still ongoing) |
> | Locks | **All locks released** | Locks from rolled-back operations released; others retained |
> | Use case | Complete failure, must start over | Partial failure, continue with rest of transaction |
> | Savepoints after it | All savepoints cleared | Only savepoints created **after** the target savepoint are cleared |

---

## SECTION 11 — Writing Transactions ⭐⭐

**Q38.** Write a transaction for your project that inserts a new user and their first content piece, with a savepoint between the two operations. Show what happens if the content insertion fails.

> **Expected Answer (Sample):**
> ```sql
> START TRANSACTION;
>
> INSERT INTO users (user_id, name, email, password_hash, created_at)
> VALUES ('u021', 'Ankit Rao', 'ankit@example.com', '$2b$12$hashvalue', NOW());
>
> SAVEPOINT after_user_insert;
>
> -- Attempt content insert (may fail if language constraint violated):
> INSERT INTO contents (content_id, user_id, original_text, language, title, created_at)
> VALUES ('c025', 'u021', 'Sample text about fintech...', 'Klingon', 'Fintech Overview', NOW());
> -- ERROR: 'Klingon' violates chk_content_language constraint
>
> -- Content insert failed; rollback to savepoint (user record preserved):
> ROLLBACK TO SAVEPOINT after_user_insert;
>
> -- Fix language and try again:
> INSERT INTO contents (content_id, user_id, original_text, language, title, created_at)
> VALUES ('c025', 'u021', 'Sample text about fintech...', 'English', 'Fintech Overview', NOW());
>
> COMMIT;
> ```

---

**Q39.** Explain the flow of Transaction 4 (Handle Failed Job) in your project. What would happen if you used ROLLBACK instead of ROLLBACK TO SAVEPOINT?

> **Expected Answer:**
> **Transaction 4 Flow:**
> 1. Update job `j012` to `processing`
> 2. Set `SAVEPOINT before_output_attempt`
> 3. Insert partial/corrupt output `o022`
> 4. AI error detected → `ROLLBACK TO SAVEPOINT before_output_attempt` (discards corrupt output)
> 5. Update job `j012` to `failed`
> 6. Insert audit log entry
> 7. `COMMIT` — only status change and audit log saved
>
> **If ROLLBACK (full) was used instead:**
> The entire transaction would be undone — the `status = 'processing'` update would also be reversed. The job would remain in its original state (already `failed` from before). The audit log entry would not be saved. This would be correct behavior for a complete restart, but less granular — we'd lose the ability to preserve the partial work of marking the job as processing before attempting the output.

---

**Q40.** From any of the 5 transactions in your project, identify: (a) the ACID property that each TCL command enforces, and (b) what data is at risk if that command is missing.

> **Expected Answer (Transaction 3 example):**
>
> | Step | Command | ACID Property Enforced | Risk if Missing |
> |------|---------|----------------------|-----------------|
> | Group all ops | `START TRANSACTION` | Atomicity | Each statement auto-commits; partial failures create orphan records |
> | After output insert | `SAVEPOINT after_output_insert` | Atomicity (partial) | If status update fails, no way to recover just the output — must rollback everything |
> | Finalize all | `COMMIT` | Durability | Changes stay in buffer only; lost on server restart |
> | On error | `ROLLBACK` | Consistency | Partial data (output without completed status) remains in DB |

---

## SECTION 12 — Concurrency Control ⭐⭐

**Q41.** What is concurrency control? Why is it especially important in the AI Content Repurposer system?

> **Expected Answer:**
> **Concurrency control** is the mechanism by which a DBMS ensures that multiple simultaneous transactions do not interfere with each other, keeping the database in a consistent state.
>
> **Importance in AI Content Repurposer:**
> - Multiple AI worker threads may simultaneously try to pick up and process pending repurpose jobs
> - Without concurrency control, two workers could both read job `j009` as `pending`, both update it to `processing`, and generate two duplicate outputs for the same job
> - Multiple users may simultaneously submit new content and jobs
> - Concurrent reads and writes to `repurpose_jobs` must be coordinated to avoid race conditions

---

**Q42.** Name and explain four concurrency problems that can occur without proper concurrency control.

> **Expected Answer:**
>
> | Problem | Description | Example in Project |
> |---------|-------------|-------------------|
> | **Dirty Read** | Transaction A reads uncommitted data from Transaction B. If B rolls back, A has read phantom data. | Session A sees job status as `processing` (set by Session B), but Session B rolls back — job is still `pending`. |
> | **Non-Repeatable Read** | A transaction reads the same row twice and gets different values because another transaction modified it between reads. | Dashboard reads output count = 5, then reads again = 7 after another session committed 2 new outputs. |
> | **Phantom Read** | A transaction executes the same range query twice and gets different rows because another session inserted/deleted rows in between. | A report counted 3 pending jobs; by second read, 5 pending jobs exist (2 newly inserted by another session). |
> | **Lost Update** | Two transactions read the same value, both modify it, and one overwrites the other's update. | Both workers update `status = 'completed'` for job `j009`; the second COMMIT overwrites the first's `completed_at` timestamp. |

---

**Q43.** Explain the difference between Row-Level Locking and Table-Level Locking. When would you use each in your project?

> **Expected Answer:**
>
> | Feature | Row-Level Locking | Table-Level Locking |
> |---------|-------------------|---------------------|
> | Scope | Locks specific rows only | Locks the entire table |
> | Command | `SELECT ... FOR UPDATE` | `LOCK TABLE tbl WRITE` / `LOCK TABLE tbl READ` |
> | Granularity | Fine | Coarse |
> | Concurrency | High — other rows unaffected | Low — all access to table blocked |
> | Overhead | Low | High |
> | Use in project | AI worker picks up one pending job (locks only that row) | Maintenance task marking all stale jobs as failed (locks full table) |

---

**Q44.** Explain `SELECT ... FOR UPDATE` with a concrete example from your project. What happens to other sessions when this lock is acquired?

> **Expected Answer:**
> `SELECT ... FOR UPDATE` acquires an **exclusive row lock** on the selected rows for the duration of the transaction.
>
> **Project Example:**
> ```sql
> START TRANSACTION;
> SELECT * FROM repurpose_jobs
> WHERE job_id = 'j018' FOR UPDATE;
> ```
>
> **Effect on other sessions:**
> - Sessions trying to `SELECT ... FOR UPDATE` on `j018` → **blocked** (wait for the lock to release)
> - Sessions doing plain `SELECT * FROM repurpose_jobs WHERE job_id = 'j018'` → **can read** (MVCC provides a snapshot of committed data)
> - Sessions doing `UPDATE repurpose_jobs SET status = ... WHERE job_id = 'j018'` → **blocked**
>
> Locks are released when the holding transaction issues `COMMIT` or `ROLLBACK`.

---

**Q45.** What is `SELECT ... FOR UPDATE SKIP LOCKED`? Why is it the optimal locking strategy for a job queue system?

> **Expected Answer:**
> `SELECT ... FOR UPDATE SKIP LOCKED` acquires an exclusive lock on rows found by the query, BUT **skips any rows that are already locked** by another session instead of waiting for them.
>
> **Why optimal for job queue:**
> - AI Worker 1 locks job `j009` for processing
> - Without SKIP LOCKED: AI Worker 2 would **wait** until Worker 1 commits (blocking, serializing workers)
> - With SKIP LOCKED: AI Worker 2 **automatically skips `j009`** and picks up the next available unlocked job (e.g., `j015`)
> - Result: Both workers process **different jobs concurrently** with zero blocking
>
> This pattern is the recommended approach for distributed task queue systems in MySQL.

---

**Q46.** Describe all five lock modes available in MySQL. Which would be appropriate for a read-only report on generated outputs in your project?

> **Expected Answer:**
>
> | Lock Mode | Description | Blocks |
> |-----------|-------------|--------|
> | **ROW SHARE** | Allows concurrent reads; prevents exclusive table locks | Exclusive table lock by others |
> | **ROW EXCLUSIVE** | Default for DML; prevents SHARE locks by others | SHARE and EXCLUSIVE table locks |
> | **SHARE** | Allows reads by others; blocks all DML (INSERT/UPDATE/DELETE) | All writes to the table |
> | **SHARE ROW EXCLUSIVE** | More restrictive; blocks all DML and other SHARE locks | All writes and SHARE locks |
> | **EXCLUSIVE** | Full table lock; no other session can read or write | All access by all other sessions |
>
> **For read-only report:** Use `LOCK TABLE generated_outputs READ` (SHARE mode). This allows other sessions to read simultaneously but blocks any writes that might change data mid-report, ensuring consistent aggregate counts across the report.

---

**Q47.** How does COMMIT release locks in a transaction? What happens to waiting sessions after COMMIT?

> **Expected Answer:**
> When `COMMIT` is issued:
> 1. All changes are permanently written to disk (WAL / redo log)
> 2. All **row-level locks** acquired during the transaction are automatically released by InnoDB
> 3. All **table-level locks** (if from LOCK TABLE) are released only if `UNLOCK TABLES` is called (LOCK TABLE doesn't follow transaction semantics in MySQL)
>
> **Effect on waiting sessions:**
> - Sessions that were blocked waiting for a lock on any released row are now unblocked
> - The first waiting session in the queue acquires the lock and proceeds
> - The committed data is now visible to all other sessions (the new consistent state)

---

**Q48.** How does ROLLBACK differ from COMMIT in terms of lock management and data persistence?

> **Expected Answer:**
>
> | Aspect | COMMIT | ROLLBACK |
> |--------|--------|----------|
> | **Data** | Changes are **permanently written** to DB | Changes are **discarded**; DB restored to pre-transaction state |
> | **Locks** | All locks **released** | All locks **released** (same as commit) |
> | **Redo Log** | Redo log entries written and confirmed | Undo log used to reverse all changes |
> | **Other sessions** | See the **new committed data** | See the **original data** (as if transaction never happened) |
> | **Savepoints** | All savepoints cleared | All savepoints cleared (full rollback) |
> | **Effect on waiting** | Unblocks waiting sessions; they see new data | Unblocks waiting sessions; they see original data |

---

## SECTION 13 — Concurrency Algorithms ⭐⭐⭐

**Q49.** Explain Two-Phase Locking (2PL). What are its two phases, and what property does it guarantee?

> **Expected Answer:**
> **Two-Phase Locking (2PL)** is a concurrency control protocol where transactions acquire and release locks in two distinct phases:
>
> 1. **Growing Phase:** The transaction may only **acquire** locks (shared or exclusive). It cannot release any locks during this phase.
> 2. **Shrinking Phase:** The transaction may only **release** locks. It cannot acquire any new locks.
>
> **Property Guaranteed:** 2PL guarantees **conflict serializability** — the concurrent execution of transactions is equivalent to some serial execution order, ensuring consistency.
>
> **Strict 2PL (InnoDB default):** All exclusive locks are held until `COMMIT` or `ROLLBACK`, preventing dirty reads and non-repeatable reads. This is the protocol MySQL InnoDB uses by default.

---

**Q50.** What is Multi-Version Concurrency Control (MVCC)? How does it work in MySQL InnoDB?

> **Expected Answer:**
> **MVCC (Multi-Version Concurrency Control)** is MySQL InnoDB's default concurrency mechanism. Instead of locking data on reads, InnoDB maintains **multiple versions** of each row.
>
> **How it works:**
> - Each row has hidden columns: `DB_TRX_ID` (transaction ID that last modified it) and `DB_ROLL_PTR` (pointer to undo log)
> - When a transaction reads a row, it sees the version that was **committed as of its transaction's start time** (consistent snapshot read)
> - When a transaction writes, it creates a **new version** of the row; the old version is preserved in the undo log
>
> **Benefits:**
> - **Readers never block writers** (reads see old version while write creates new version)
> - **Writers never block readers** (readers see snapshot; don't wait for locks)
> - Higher concurrency with consistency
>
> **In AI Content Repurposer:** While an AI worker updates `j009` to `processing`, other sessions reading `repurpose_jobs` see the old `pending` status until the worker commits — a clean, consistent read without any blocking.

---

**Q51.** Compare Lock-Based, Timestamp-Based, and Optimistic Concurrency Control methods.

> **Expected Answer:**
>
> | Method | Mechanism | When Conflict Detected | Action on Conflict | Best For |
> |--------|-----------|------------------------|-------------------|----------|
> | **Lock-Based (2PL)** | Transactions acquire locks before accessing data | At access time | Waiting (blocked) until lock released | Write-heavy workloads with frequent conflicts |
> | **Timestamp-Based** | Each transaction gets a unique timestamp; reads/writes validated against timestamps | At read/write time | Younger transaction rolled back | Medium concurrency; predictable access patterns |
> | **Optimistic (OCC)** | Execute freely without locks; validate at commit time | At COMMIT time | Rolled back and restarted if conflict found | Read-heavy workloads with rare conflicts |
> | **MVCC** | Multiple row versions maintained; readers see snapshot | Minimal conflicts due to versioning | Rarely needed — reads see committed snapshots | Mixed read-write workloads (default in InnoDB) |

---

## SECTION 14 — Scenario & Tricky Questions ⭐⭐⭐

**Q52.** If two sessions simultaneously execute `UPDATE repurpose_jobs SET status = 'completed' WHERE job_id = 'j009'` without any transaction control, what problem occurs? How does your project solve it?

> **Expected Answer:**
> **Problem:** Lost Update anomaly. Both sessions read `status = 'pending'`, both update to `completed`, but the second COMMIT silently overwrites the first's `completed_at` timestamp and any side effects (like audit log inserts). The first session's work is partially "lost."
>
> **Solution in Project:**
> ```sql
> START TRANSACTION;
> SELECT * FROM repurpose_jobs WHERE job_id = 'j009' FOR UPDATE;
> -- Other sessions blocked here until we commit
> UPDATE repurpose_jobs SET status = 'completed', completed_at = NOW() WHERE job_id = 'j009';
> INSERT INTO job_audit_log VALUES ...;
> COMMIT;
> ```
> `FOR UPDATE` ensures only one session can hold the exclusive lock on `j009` at a time — the other session waits, then reads the already-committed `completed` status and decides not to update again.

---

**Q53.** What is a deadlock? How could a deadlock occur in the AI Content Repurposer system? How does MySQL handle it?

> **Expected Answer:**
> A **deadlock** occurs when two or more transactions are each waiting for the other to release a lock — a circular lock dependency where no transaction can proceed.
>
> **Project Example:**
> - Session A: Locks `repurpose_jobs` row `j009`, then tries to lock `generated_outputs` row `o009`
> - Session B: Locks `generated_outputs` row `o009`, then tries to lock `repurpose_jobs` row `j009`
> - Both sessions wait for each other → **Deadlock**
>
> **How MySQL handles it:**
> MySQL InnoDB automatically detects deadlocks using a wait-for graph. When a cycle is detected:
> 1. MySQL selects the **victim transaction** (usually the one that rolled back fewest rows — least work)
> 2. The victim transaction is automatically **rolled back**
> 3. The other transaction proceeds
> 4. MySQL raises error: `ERROR 1213 (40001): Deadlock found when trying to get lock; try restarting transaction`
>
> **Prevention strategy:** Always acquire locks in the **same order** across all transactions (e.g., always lock `contents` before `repurpose_jobs` before `generated_outputs`).

---

**Q54.** What is a dirty read? Under what transaction isolation level does it occur? Which isolation level prevents it?

> **Expected Answer:**
> A **dirty read** occurs when Transaction A reads data that Transaction B has written but not yet committed. If B rolls back, A has read data that never officially existed.
>
> **Project Example:** Session A reads job `j021` as `processing` (set by Session B's uncommitted UPDATE). Session B rolls back — job is still `pending`. Session A now has wrong information.
>
> | Isolation Level | Dirty Read | Non-Repeatable Read | Phantom Read |
> |----------------|------------|---------------------|--------------|
> | READ UNCOMMITTED | ✅ Possible | ✅ Possible | ✅ Possible |
> | READ COMMITTED | ❌ Prevented | ✅ Possible | ✅ Possible |
> | REPEATABLE READ | ❌ Prevented | ❌ Prevented | ✅ Possible (partially in MySQL) |
> | SERIALIZABLE | ❌ Prevented | ❌ Prevented | ❌ Prevented |
>
> MySQL InnoDB default: **REPEATABLE READ** (dirty reads and non-repeatable reads prevented by MVCC).

---

**Q55.** In the context of your project, what is the significance of the `job_audit_log` table from a transaction recovery standpoint?

> **Expected Answer:**
> The `job_audit_log` table serves as an **application-level audit trail** that complements database-level transaction recovery:
>
> 1. **Post-failure analysis:** If a transaction fails and is rolled back, the audit log (committed in a separate transaction) shows which status changes succeeded before the failure
> 2. **Debugging:** Operations team can replay events from the audit log to understand why a job is in an unexpected state
> 3. **Compensating transactions:** If a rollback cannot be executed (e.g., network failure after partial commit), the audit log provides a basis for manually constructing compensating SQL to reverse partial changes
> 4. **Compliance & accountability:** In regulatory contexts, the audit log proves that status changes happened in the correct order and at the correct times
>
> **In Transaction 3 and Transaction 4:** The audit log INSERT is part of the same transaction as the status UPDATE — ensuring atomicity (both succeed or both fail together).

---

## SECTION 15 — Quick-Fire Definitions ⭐

*The reviewer may ask any of these as rapid-fire oral questions:*

| # | Question | Answer |
|---|----------|--------|
| Q56 | What does ACID stand for? | Atomicity, Consistency, Isolation, Durability |
| Q57 | What is the default isolation level in MySQL InnoDB? | REPEATABLE READ |
| Q58 | Can ROLLBACK be used after COMMIT? | No — once committed, changes are permanent |
| Q59 | What command releases all table locks in MySQL? | `UNLOCK TABLES` |
| Q60 | What is a phantom read? | New rows appearing in a repeated range query within the same transaction |
| Q61 | What does `FOR UPDATE` prevent? | Other sessions from locking (FOR UPDATE or FOR SHARE) or writing to the locked rows |
| Q62 | What is the difference between 3NF and BCNF? | 3NF allows non-superkey determinants if the dependent is a prime attribute; BCNF does not allow any non-superkey determinant |
| Q63 | What does MVD stand for? | Multi-Valued Dependency |
| Q64 | What normal form addresses MVDs? | Fourth Normal Form (4NF) |
| Q65 | What does 5NF also stand for? | Project-Join Normal Form (PJNF) |
| Q66 | Is MySQL's 1NF check automatic? | No — MySQL does not enforce 1NF automatically; it allows storing comma-separated values in TEXT columns (designer's responsibility) |
| Q67 | What is a spurious tuple? | A fake row generated by a lossy join that was not in the original relation |
| Q68 | What is `SKIP LOCKED` used for? | To skip rows already locked by other sessions, useful in job queue patterns |
| Q69 | What happens to locks when ROLLBACK is executed? | All locks held by the rolled-back transaction are released |
| Q70 | Which dependency does 2NF eliminate? | Partial functional dependency |

---

## BONUS — Project-Specific Viva Questions

**Q71.** "Your project uses UUID for primary keys. Does this affect normalization?" 

> UUIDs are still single-column primary keys. All normalization rules apply the same way. The advantage of UUIDs (globally unique, no enumeration attacks) is orthogonal to normalization. The 1NF composite key `(user_id, content_id, job_id, output_id)` still applies to the flat relation before decomposition.

---

**Q72.** "Why does your project have a `job_audit_log` table separate from `repurpose_jobs`? Is this a normalization decision?"

> Partially. The `job_audit_log` stores **historical** status change events — a job can have multiple audit entries (1:M). Storing old/new status pairs inside `repurpose_jobs` itself would require repeating groups (violation of 1NF). The separate table also satisfies 3NF — status transition data depends on `log_id` (its own PK) and `job_id` (FK), not transitively on any non-key attribute.

---

**Q73.** "In your concurrency transaction example, why did you use `SKIP LOCKED` instead of just `LIMIT 1 FOR UPDATE`?"

> With `LIMIT 1 FOR UPDATE` (without SKIP LOCKED), if Worker 1 has locked `j009`, Worker 2 would **block and wait** for Worker 1 to commit — serializing the workers. `SKIP LOCKED` makes Worker 2 immediately skip `j009` and pick the next unlocked pending job. This scales to N workers processing N jobs simultaneously with zero blocking — essential for high-throughput AI processing pipelines.

---

*— End of Study & Review Questions for Chapter 4 & 5 —*
