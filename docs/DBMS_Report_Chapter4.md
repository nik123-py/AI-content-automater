# CHAPTER 4

## ANALYZING THE PITFALLS, IDENTIFYING THE DEPENDENCIES, AND APPLYING NORMALIZATIONS

---

### 4.1 Analyse the Pitfalls in Relations

Before applying normalization, it is critical to identify anomalies in an un-normalized or partially normalized relation. Consider a single flat (un-normalized) table that combines all data about Users, Content, Jobs, and Outputs into one relation. This initial flat relation is used throughout this chapter to demonstrate each normalization step.

#### Initial Flat (Un-normalized) Table: `content_repurposer_flat`

| user_id | user_name | user_email | user_pwd | content_id | content_title | content_lang | job_id | target_platform | job_status | completed_at | output_id | output_text | format_type | is_edited |
|---------|-----------|------------|----------|------------|---------------|--------------|--------|-----------------|------------|--------------|-----------|-------------|-------------|-----------|
| u001 | Nikhil Sharma | nikhil@example.com | $2b$12$abc1 | c001 | AI in Business Operations | English | j001 | linkedin | completed | 2025-11-10 10:02:00 | o001 | 🚀 AI is no longer a buzzword... | linkedin_post | FALSE |
| u001 | Nikhil Sharma | nikhil@example.com | $2b$12$abc1 | c001 | AI in Business Operations | English | j002 | twitter | completed | 2025-11-10 10:06:30 | o002 | 🤖 AI is transforming business! | tweet | FALSE |
| u001 | Nikhil Sharma | nikhil@example.com | $2b$12$abc1 | c002 | Cloud Computing Guide | English | j003 | email | completed | 2025-11-15 10:33:00 | o003 | Subject: Your Weekly Tech Brief | email_newsletter | TRUE |
| u002 | Priya Patel | priya@example.com | $2b$12$abc2 | c003 | ML Algorithm Overview | English | j004 | linkedin | completed | 2025-11-12 11:32:00 | o004 | 📊 Understanding ML Algorithms | linkedin_post | FALSE |
| u002 | Priya Patel | priya@example.com | $2b$12$abc2 | c003 | ML Algorithm Overview | English | j005 | instagram | failed | NULL | NULL | NULL | NULL | NULL |

#### Pitfalls Identified in the Flat Relation:

**1. Insertion Anomaly:**
A new user cannot be added to the system unless they also have at least one piece of content, a job, and an output. For example, if user `u021 (Ankit Rao)` registers but has not yet submitted any content, there is no way to insert their record without fabricating dummy values for `content_id`, `job_id`, and `output_id`. This violates the integrity of the database.

**2. Deletion Anomaly:**
If the only output associated with a particular job is deleted, we inadvertently lose all information about that job, the content, and the user. For instance, deleting `output o005` (the only output for job `j006`) would also erase all history of job `j006`, content `c004`, and even user `u002 (Priya Patel)` if no other records remain. Data that should persist is lost unintentionally.

**3. Update Anomaly:**
User information (name, email) is repeated across multiple rows. If `Nikhil Sharma` changes his email address, every single row containing `u001` must be updated. If even one row is missed, the database becomes inconsistent — some rows show the old email and others show the new one. This problem scales linearly with the amount of content and jobs created.

**4. Data Redundancy:**
User details (`user_name`, `user_email`, `user_pwd`) are stored repeatedly for every content, job, and output record belonging to that user. Similarly, `content_title` and `content_lang` are duplicated across every job spawned from that content. This wastes storage and increases the risk of inconsistencies.

**5. NULL Value Problems:**
When a job fails and produces no output, the `output_id`, `output_text`, `format_type`, and `is_edited` columns must be set to NULL. This creates sparse rows and complicates aggregate queries, as SQL aggregate functions require special handling for NULL values (e.g., `COUNT(output_id)` vs `COUNT(*)`).

**Summary of Pitfalls:**

| Pitfall | Description | Affected Columns |
|---------|-------------|------------------|
| Insertion Anomaly | Cannot insert user without content/job/output | user_id, content_id, job_id, output_id |
| Deletion Anomaly | Deleting output erases job/content/user info | All columns |
| Update Anomaly | Changing email requires multi-row update | user_email, user_name, user_pwd |
| Data Redundancy | User and content data repeated for every job | user_*, content_title, content_lang |
| NULL Values | Failed jobs create sparse rows | output_id, output_text, format_type, is_edited |

---

### 4.2 First Normal Form (1NF)

#### 4.2.1 Identify Dependency

**Definition of 1NF:** A relation is in First Normal Form if:
- All attributes contain only **atomic (indivisible)** values
- Each column contains values of a **single type**
- Each row is **uniquely identifiable** (a primary key exists)
- There are **no repeating groups or arrays**

**Violations Found in the Flat Table:**

In the flat `content_repurposer_flat` table, the following 1NF violations exist:

1. **Repeating Groups:** A single user-content pair can have multiple jobs (j001, j002) and each job can have multiple outputs. These are implicitly multi-valued in the flat structure, violating atomicity if represented as comma-separated lists.

2. **Multi-valued Columns (if in a conceptual un-normalized form):** Imagine a version of the table where `job_ids` is stored as `"j001, j002, j003"` in a single cell — this violates atomicity.

3. **No Unique Primary Key:** The flat table has no single attribute that uniquely identifies each row. The combination `(user_id, content_id, job_id, output_id)` is needed.

**Functional Dependencies at this stage (before 1NF):**
```
{ user_id, content_id, job_id, output_id } → { all other attributes }
user_id → { user_name, user_email, user_pwd }
content_id → { content_title, content_lang, user_id }
job_id → { target_platform, job_status, completed_at, content_id }
output_id → { output_text, format_type, is_edited, job_id }
```

#### 4.2.2 Apply Normalization to 1NF

**Action Taken:**
- Ensure every column is atomic (no lists, no repeating groups)
- Define a composite primary key: `(user_id, content_id, job_id, output_id)`
- Each row represents exactly one output produced by one job

**Table BEFORE 1NF (Flat Relation with Conceptual Repeating Groups):**

| user_id | user_name | email | content_ids | job_ids | output_texts |
|---------|-----------|-------|-------------|---------|--------------|
| u001 | Nikhil Sharma | nikhil@example.com | c001, c002 | j001, j002, j003 | o001, o002, o003 |
| u002 | Priya Patel | priya@example.com | c003, c004 | j004, j005, j006 | o004, o005 |

**Table AFTER 1NF (Atomic values, composite primary key, no repeating groups):**

*Relation: `content_repurposer_1NF`*
Primary Key: **(user_id, content_id, job_id, output_id)**

| **user_id** | **content_id** | **job_id** | **output_id** | user_name | user_email | content_title | content_lang | target_platform | job_status | completed_at | output_text | format_type | is_edited |
|-------------|----------------|------------|---------------|-----------|------------|---------------|--------------|-----------------|------------|--------------|-------------|-------------|-----------|
| u001 | c001 | j001 | o001 | Nikhil Sharma | nikhil@example.com | AI in Business Ops | English | linkedin | completed | 2025-11-10 10:02:00 | 🚀 AI is no longer... | linkedin_post | FALSE |
| u001 | c001 | j001 | o015 | Nikhil Sharma | nikhil@example.com | AI in Business Ops | English | linkedin | completed | 2025-11-10 10:02:00 | AI is reshaping... | linkedin_article | FALSE |
| u001 | c001 | j002 | o002 | Nikhil Sharma | nikhil@example.com | AI in Business Ops | English | twitter | completed | 2025-11-10 10:06:30 | 🤖 AI is transforming! | tweet | FALSE |
| u001 | c002 | j003 | o003 | Nikhil Sharma | nikhil@example.com | Cloud Computing Guide | English | email | completed | 2025-11-15 10:33:00 | Subject: Your Weekly... | email_newsletter | TRUE |
| u001 | c002 | j003 | o016 | Nikhil Sharma | nikhil@example.com | Cloud Computing Guide | English | email | completed | 2025-11-15 10:33:00 | Cloud computing enables... | email_summary | FALSE |
| u002 | c003 | j004 | o004 | Priya Patel | priya@example.com | ML Algorithm Overview | English | linkedin | completed | 2025-11-12 11:32:00 | 📊 Understanding ML... | linkedin_post | FALSE |
| u002 | c003 | j005 | NULL | Priya Patel | priya@example.com | ML Algorithm Overview | English | instagram | failed | NULL | NULL | NULL | NULL |

**Changes Made:**
- All multi-valued attributes eliminated; each cell now contains exactly one atomic value
- Composite primary key `(user_id, content_id, job_id, output_id)` uniquely identifies every row
- Rows with failed jobs (no output) retain NULL for output columns — this is acceptable in 1NF
- The relation is now in **First Normal Form**

> **Note:** The table is now in 1NF, but there are still partial dependencies (non-key attributes depend on subsets of the composite key). These are addressed in 2NF.

---

### 4.3 Second Normal Form (2NF)

#### 4.3.1 Identify Dependency

**Definition of 2NF:** A relation is in Second Normal Form if:
- It is already in **1NF**
- Every non-key attribute is **fully functionally dependent** on the **entire** primary key (no partial dependencies)

**Primary Key of 1NF Table:** `(user_id, content_id, job_id, output_id)`

**Partial Dependencies Found:**

A partial dependency exists when a non-key attribute depends on only *part* of the composite primary key, not the whole key.

```
user_id           → user_name, user_email, user_pwd            [PARTIAL: only user_id]
content_id        → content_title, content_lang, user_id       [PARTIAL: only content_id]
job_id            → target_platform, job_status, completed_at  [PARTIAL: only job_id]
output_id         → output_text, format_type, is_edited        [PARTIAL: only output_id]
```

| Non-Key Attribute | Depends On | Dependency Type |
|-------------------|------------|-----------------|
| user_name | user_id | **Partial** (violation) |
| user_email | user_id | **Partial** (violation) |
| user_pwd | user_id | **Partial** (violation) |
| content_title | content_id | **Partial** (violation) |
| content_lang | content_id | **Partial** (violation) |
| target_platform | job_id | **Partial** (violation) |
| job_status | job_id | **Partial** (violation) |
| completed_at | job_id | **Partial** (violation) |
| output_text | output_id | **Partial** (violation) |
| format_type | output_id | **Partial** (violation) |
| is_edited | output_id | **Partial** (violation) |

#### 4.3.2 Apply Normalization to 2NF

**Action Taken:** Decompose the 1NF relation into separate relations, one for each partial dependency group, eliminating all partial dependencies.

**Table BEFORE 2NF** (1NF table with partial dependencies — same as 1NF output above):

| **user_id** | **content_id** | **job_id** | **output_id** | user_name | user_email | content_title | content_lang | target_platform | job_status | output_text | format_type | is_edited |
|-------------|----------------|------------|---------------|-----------|------------|---------------|--------------|-----------------|------------|-------------|-------------|-----------|
| u001 | c001 | j001 | o001 | Nikhil Sharma | nikhil@example.com | AI in Business Ops | English | linkedin | completed | 🚀 AI is no longer... | linkedin_post | FALSE |
| u001 | c001 | j002 | o002 | Nikhil Sharma | nikhil@example.com | AI in Business Ops | English | twitter | completed | 🤖 AI is transforming! | tweet | FALSE |
| u002 | c003 | j004 | o004 | Priya Patel | priya@example.com | ML Algorithm Overview | English | linkedin | completed | 📊 Understanding ML... | linkedin_post | FALSE |

**Tables AFTER 2NF** (Partial dependencies removed, decomposed into 4 relations):

**R1: users** — Attributes depending only on `user_id`
Primary Key: **user_id**

| **user_id** | user_name | user_email | user_pwd | created_at | updated_at |
|-------------|-----------|------------|----------|------------|------------|
| u001 | Nikhil Sharma | nikhil@example.com | $2b$12$abc1 | 2025-11-01 | NULL |
| u002 | Priya Patel | priya@example.com | $2b$12$abc2 | 2025-11-02 | NULL |
| u003 | Arjun Reddy | arjun@example.com | $2b$12$abc3 | 2025-11-05 | NULL |

**R2: contents** — Attributes depending only on `content_id`
Primary Key: **content_id** | Foreign Key: user_id → users

| **content_id** | user_id | content_title | content_lang | source_url | created_at |
|----------------|---------|---------------|--------------|------------|------------|
| c001 | u001 | AI in Business Operations | English | https://blog.example.com/ai-business | 2025-11-10 |
| c002 | u001 | Cloud Computing Guide | English | https://blog.example.com/cloud | 2025-11-15 |
| c003 | u002 | ML Algorithm Overview | English | NULL | 2025-11-12 |

**R3: repurpose_jobs** — Attributes depending only on `job_id`
Primary Key: **job_id** | Foreign Key: content_id → contents

| **job_id** | content_id | target_platform | target_language | job_status | created_at | completed_at |
|------------|------------|-----------------|-----------------|------------|------------|--------------|
| j001 | c001 | linkedin | English | completed | 2025-11-10 10:00:00 | 2025-11-10 10:02:00 |
| j002 | c001 | twitter | English | completed | 2025-11-10 10:05:00 | 2025-11-10 10:06:30 |
| j004 | c003 | linkedin | English | completed | 2025-11-12 11:30:00 | 2025-11-12 11:32:00 |

**R4: generated_outputs** — Attributes depending only on `output_id`
Primary Key: **output_id** | Foreign Key: job_id → repurpose_jobs

| **output_id** | job_id | output_text | format_type | is_edited | created_at | updated_at |
|---------------|--------|-------------|-------------|-----------|------------|------------|
| o001 | j001 | 🚀 AI is no longer a buzzword... | linkedin_post | FALSE | 2025-11-10 10:02:00 | NULL |
| o002 | j002 | 🤖 AI is transforming business! | tweet | FALSE | 2025-11-10 10:06:30 | NULL |
| o004 | j004 | 📊 Understanding ML Algorithms... | linkedin_post | FALSE | 2025-11-12 11:32:00 | NULL |

> **Result:** All partial dependencies are eliminated. Each relation has a single-attribute primary key, and every non-key attribute depends fully on that key. The schema is now in **Second Normal Form (2NF)**.

---

### 4.4 Third Normal Form (3NF)

#### 4.4.1 Identify Dependency

**Definition of 3NF:** A relation is in Third Normal Form if:
- It is already in **2NF**
- There are **no transitive dependencies** (non-key attribute depending on another non-key attribute)

**Analysis of 2NF Relations for Transitive Dependencies:**

Examining the four 2NF relations:

**In R2 (contents):**
```
content_id → user_id              (direct dependency — OK)
content_id → content_title        (direct dependency — OK)
content_id → content_lang         (direct dependency — OK)
```
No transitive dependencies found in R2.

**In R3 (repurpose_jobs):**
Imagine if we stored `user_name` and `user_email` derived from `content_id → user_id → user_name`:
```
job_id → content_id → user_id → user_name   (TRANSITIVE — violation if stored here)
```
However, since we only store `content_id` (FK), not `user_name` directly, R3 is clean.

**Potential Transitive Dependency (Illustrative Example):**
Suppose we added a `platform_category` column (e.g., 'Social Media', 'Email', 'Video') to `repurpose_jobs`:
```
job_id → target_platform → platform_category   (TRANSITIVE violation)
```
Here `platform_category` is a fact about `target_platform`, not about `job_id` directly.

**Another Example in contents:**
If we added `language_family` (e.g., 'Indo-European', 'Afro-Asiatic') to contents:
```
content_id → content_lang → language_family   (TRANSITIVE violation)
```
Here `language_family` depends on `content_lang`, not directly on `content_id`.

**Transitive Dependencies Identified:**

| Relation | Transitive Dependency | Description |
|----------|-----------------------|-------------|
| repurpose_jobs | job_id → target_platform → platform_category | platform_category is a fact about platform, not job |
| contents | content_id → content_lang → language_family | language_family is a fact about language, not content |

#### 4.4.2 Apply Normalization to 3NF

**Action Taken:** Decompose relations to eliminate transitive dependencies by extracting the transitively dependent attributes into new relations.

**Table BEFORE 3NF** (2NF with transitive dependencies added for illustration):

*`repurpose_jobs` (with transitive dependency):*

| **job_id** | content_id | target_platform | platform_category | job_status | created_at |
|------------|------------|-----------------|-------------------|------------|------------|
| j001 | c001 | linkedin | Social Media | completed | 2025-11-10 |
| j002 | c001 | twitter | Social Media | completed | 2025-11-10 |
| j003 | c002 | email | Email Marketing | completed | 2025-11-15 |
| j007 | c005 | youtube_script | Video | completed | 2025-11-20 |
| j013 | c010 | youtube_shorts | Video | completed | 2025-12-05 |

**Tables AFTER 3NF** (Transitive dependencies removed):

**New Relation: platforms**
Primary Key: **platform_name**

| **platform_name** | platform_category | max_char_limit | supports_media |
|-------------------|-------------------|----------------|----------------|
| linkedin | Social Media | 3000 | TRUE |
| twitter | Social Media | 280 | TRUE |
| email | Email Marketing | NULL | FALSE |
| instagram | Social Media | 2200 | TRUE |
| youtube_script | Video | NULL | TRUE |
| youtube_shorts | Video | NULL | TRUE |

**Modified R3: repurpose_jobs** (platform_category removed; FK to platforms table added)
Primary Key: **job_id** | Foreign Keys: content_id → contents, target_platform → platforms

| **job_id** | content_id | target_platform | target_language | job_status | created_at | completed_at |
|------------|------------|-----------------|-----------------|------------|------------|--------------|
| j001 | c001 | linkedin | English | completed | 2025-11-10 10:00:00 | 2025-11-10 10:02:00 |
| j002 | c001 | twitter | English | completed | 2025-11-10 10:05:00 | 2025-11-10 10:06:30 |
| j003 | c002 | email | English | completed | 2025-11-15 10:30:00 | 2025-11-15 10:33:00 |
| j007 | c005 | youtube_script | English | completed | 2025-11-20 15:00:00 | 2025-11-20 15:05:00 |

**Similarly for contents (language_family removed):**

**New Relation: supported_languages**
Primary Key: **language_name**

| **language_name** | language_family | iso_code | rtl_support |
|-------------------|-----------------|----------|-------------|
| English | Indo-European | en | FALSE |
| Hindi | Indo-European | hi | FALSE |
| Spanish | Indo-European | es | FALSE |
| French | Indo-European | fr | FALSE |
| German | Indo-European | de | FALSE |
| Chinese | Sino-Tibetan | zh | FALSE |
| Japanese | Japonic | ja | FALSE |
| Arabic | Afro-Asiatic | ar | TRUE |

> **Result:** All transitive dependencies are eliminated. The schema is now in **Third Normal Form (3NF)**.

---

### 4.5 Boyce-Codd Normal Form (BCNF)

#### 4.5.1 Identify Dependency

**Definition of BCNF:** A relation is in Boyce-Codd Normal Form if:
- It is already in **3NF**
- For every functional dependency `X → Y`, **X must be a superkey** (i.e., X alone uniquely determines every tuple in the relation)

BCNF is a stronger version of 3NF. While 3NF allows a non-prime attribute to be determined by a key, BCNF requires that the *determinant* of every functional dependency must itself be a superkey.

**Analysis of 3NF Relations for BCNF Violations:**

Consider a hypothetical composite relation `job_output_assignment` that tracks which user (editor) is responsible for reviewing an output:

**Hypothetical Relation: `job_output_assignment`**

| job_id | output_id | reviewer_email | reviewer_name |
|--------|-----------|----------------|---------------|
| j001 | o001 | nikhil@example.com | Nikhil Sharma |
| j001 | o015 | priya@example.com | Priya Patel |
| j002 | o002 | nikhil@example.com | Nikhil Sharma |
| j004 | o004 | arjun@example.com | Arjun Reddy |

**Functional Dependencies in this relation:**
```
(job_id, output_id) → reviewer_email          [Composite key — OK]
(job_id, output_id) → reviewer_name           [Composite key — OK]
reviewer_email       → reviewer_name           [BCNF violation! reviewer_email is NOT a superkey]
```

**BCNF Violation:** `reviewer_email → reviewer_name` — Here `reviewer_email` determines `reviewer_name`, but `reviewer_email` alone is NOT a superkey of the relation (it doesn't uniquely identify every row). This violates BCNF.

**Also in the `platforms` relation (from 3NF):**
```
platform_name → platform_category     (platform_name is PK — OK)
platform_category → max_char_limit?   (NO — category doesn't determine char limit)
```
The `platforms` relation is already in BCNF.

#### 4.5.2 Apply Normalization to BCNF

**Action Taken:** Decompose the violating relation so that every determinant is a superkey.

**Table BEFORE BCNF** (`job_output_assignment` with BCNF violation):

| **job_id** | **output_id** | reviewer_email | reviewer_name |
|------------|---------------|----------------|---------------|
| j001 | o001 | nikhil@example.com | Nikhil Sharma |
| j001 | o015 | priya@example.com | Priya Patel |
| j002 | o002 | nikhil@example.com | Nikhil Sharma |
| j004 | o004 | arjun@example.com | Arjun Reddy |

**Tables AFTER BCNF** (Determinant `reviewer_email` extracted into its own relation):

**New Relation: reviewers**
Primary Key: **reviewer_email**

| **reviewer_email** | reviewer_name |
|--------------------|---------------|
| nikhil@example.com | Nikhil Sharma |
| priya@example.com | Priya Patel |
| arjun@example.com | Arjun Reddy |

**Modified Relation: `job_output_assignment`**
Primary Key: **(job_id, output_id)** | Foreign Key: reviewer_email → reviewers

| **job_id** | **output_id** | reviewer_email |
|------------|---------------|----------------|
| j001 | o001 | nikhil@example.com |
| j001 | o015 | priya@example.com |
| j002 | o002 | nikhil@example.com |
| j004 | o004 | arjun@example.com |

**Verification:**
- In `reviewers`: `reviewer_email → reviewer_name` and `reviewer_email` IS the primary key (superkey) ✅
- In `job_output_assignment`: `(job_id, output_id) → reviewer_email` and `(job_id, output_id)` IS the primary key (superkey) ✅

> **Result:** All functional dependency determinants are now superkeys. The schema is in **Boyce-Codd Normal Form (BCNF)**.

---

### 4.6 Fourth Normal Form (4NF)

#### 4.6.1 Identify Dependency

**Definition of 4NF:** A relation is in Fourth Normal Form if:
- It is already in **BCNF**
- It has **no non-trivial multi-valued dependencies** (MVDs) that are not also functional dependencies

A multi-valued dependency (MVD) exists when, for a given value of attribute A, there is a set of values of attribute B that are independent of all other attributes C in the relation. Notation: `A →→ B`

**Scenario:** Consider a relation `user_platform_language` that tracks which platforms and which output languages each user has ever used:

**Relation: `user_platform_language`**

| user_id | target_platform | target_language |
|---------|-----------------|-----------------|
| u001 | linkedin | English |
| u001 | linkedin | Hindi |
| u001 | twitter | English |
| u001 | twitter | Hindi |
| u002 | linkedin | English |
| u002 | linkedin | Spanish |
| u002 | twitter | English |
| u002 | twitter | Spanish |

**Multi-valued Dependencies (MVDs) Found:**
```
user_id →→ target_platform    (A user can use many platforms, independent of language)
user_id →→ target_language    (A user can output in many languages, independent of platform)
```

**Why this is an MVD violation:**
User `u001` uses platforms `{linkedin, twitter}` AND languages `{English, Hindi}`. These two sets are completely independent of each other — the fact that `u001` uses LinkedIn has nothing to do with whether they use English or Hindi. But in the combined table, we must add all combinations (2 platforms × 2 languages = 4 rows), which causes redundancy.

If `u001` adds a new platform `instagram`, we must add 2 new rows (instagram+English, instagram+Hindi), repeating all language information again.

#### 4.6.2 Apply Normalization to 4NF

**Action Taken:** Decompose the relation with MVDs into two separate relations, one per independent multi-valued fact.

**Table BEFORE 4NF** (`user_platform_language` with MVD violation):

| **user_id** | **target_platform** | **target_language** |
|-------------|---------------------|---------------------|
| u001 | linkedin | English |
| u001 | linkedin | Hindi |
| u001 | twitter | English |
| u001 | twitter | Hindi |
| u002 | linkedin | English |
| u002 | linkedin | Spanish |
| u002 | twitter | English |
| u002 | twitter | Spanish |

**Tables AFTER 4NF** (MVDs decomposed into separate relations):

**New Relation: `user_platforms`** — tracks which platforms a user has used
Primary Key: **(user_id, target_platform)**

| **user_id** | **target_platform** |
|-------------|---------------------|
| u001 | linkedin |
| u001 | twitter |
| u002 | linkedin |
| u002 | twitter |
| u003 | youtube_script |
| u003 | linkedin |

**New Relation: `user_languages`** — tracks which output languages a user has used
Primary Key: **(user_id, target_language)**

| **user_id** | **target_language** |
|-------------|---------------------|
| u001 | English |
| u001 | Hindi |
| u002 | English |
| u002 | Spanish |
| u003 | English |
| u005 | French |

**Benefits of 4NF Decomposition:**
- Adding a new platform for a user requires only 1 row in `user_platforms` (no language duplication)
- Adding a new language for a user requires only 1 row in `user_languages` (no platform duplication)
- Redundancy is eliminated; each fact is stored exactly once

> **Result:** All non-trivial multi-valued dependencies are eliminated. The schema is now in **Fourth Normal Form (4NF)**.

---

### 4.7 Fifth Normal Form (5NF)

#### 4.7.1 Identify Dependency

**Definition of 5NF:** A relation is in Fifth Normal Form (also called **Project-Join Normal Form, PJNF**) if:
- It is already in **4NF**
- It cannot be further decomposed without loss of information — i.e., it has **no non-trivial join dependencies** that are not implied by its candidate keys

A join dependency `{R1, R2, R3}` for relation R exists if R can be reconstructed exactly by joining R1, R2, and R3 together. If such a decomposition is possible without being forced by candidate keys, it is a 5NF violation.

**Scenario:** Consider a ternary relation `user_content_platform_preference` that records which users have approved which content pieces for which platforms:

**Relation: `user_content_platform_pref`**

| user_id | content_id | target_platform |
|---------|------------|-----------------|
| u001 | c001 | linkedin |
| u001 | c001 | twitter |
| u001 | c002 | linkedin |
| u002 | c003 | linkedin |
| u002 | c003 | instagram |
| u003 | c005 | youtube_script |
| u003 | c005 | linkedin |

**Join Dependency Found:**
The relation R(user_id, content_id, target_platform) can be exactly reconstructed by joining:
- R1(user_id, content_id) ⋈ R2(content_id, target_platform) ⋈ R3(user_id, target_platform)

This is a **non-trivial join dependency** because no single candidate key implies it — the ternary combination must be stored to preserve all information correctly.

**Why this matters:**
If we decompose into R1 and R2 only (without R3), the natural join would generate spurious tuples — rows that were never in the original relation but appear after rejoining. This is the "*lossless-join*" concern that 5NF addresses.

#### 4.7.2 Apply Normalization to 5NF

**Action Taken:** Verify that the join dependency is implied by candidate keys. If not, decompose into three separate binary relations.

**Table BEFORE 5NF** (ternary join dependency present):

| **user_id** | **content_id** | **target_platform** |
|-------------|----------------|---------------------|
| u001 | c001 | linkedin |
| u001 | c001 | twitter |
| u001 | c002 | linkedin |
| u002 | c003 | linkedin |
| u002 | c003 | instagram |
| u003 | c005 | youtube_script |
| u003 | c005 | linkedin |

**Tables AFTER 5NF** (Decomposed into three binary relations):

**R1: `user_content_access`** — which user owns/accesses which content
Primary Key: **(user_id, content_id)**

| **user_id** | **content_id** |
|-------------|----------------|
| u001 | c001 |
| u001 | c002 |
| u002 | c003 |
| u003 | c005 |

**R2: `content_platform_targets`** — which platforms a content is targeted for
Primary Key: **(content_id, target_platform)**

| **content_id** | **target_platform** |
|----------------|---------------------|
| c001 | linkedin |
| c001 | twitter |
| c002 | linkedin |
| c003 | linkedin |
| c003 | instagram |
| c005 | youtube_script |
| c005 | linkedin |

**R3: `user_platform_approval`** — which platforms each user has approved
Primary Key: **(user_id, target_platform)**

| **user_id** | **target_platform** |
|-------------|---------------------|
| u001 | linkedin |
| u001 | twitter |
| u002 | linkedin |
| u002 | instagram |
| u003 | youtube_script |
| u003 | linkedin |

**Lossless Reconstruction Verification:**
```sql
-- Reconstructing original relation by joining all three:
SELECT r1.user_id, r2.content_id, r3.target_platform
FROM user_content_access r1
INNER JOIN content_platform_targets r2 ON r1.content_id = r2.content_id
INNER JOIN user_platform_approval r3 ON r1.user_id = r3.user_id
                                     AND r2.target_platform = r3.target_platform;
```
This lossless join exactly reconstructs the original `user_content_platform_pref` table without generating spurious tuples.

> **Result:** All join dependencies are now implied by candidate keys. The schema is in **Fifth Normal Form (5NF)**. The AI Content Repurposer database is fully normalized.

#### Summary of Normalization Progression:

| Normal Form | Violation Addressed | Action Taken |
|-------------|---------------------|--------------|
| 1NF | Repeating groups, non-atomic values | Made all cells atomic; defined composite PK |
| 2NF | Partial dependencies on composite key | Decomposed into users, contents, repurpose_jobs, generated_outputs |
| 3NF | Transitive dependencies | Extracted platforms and supported_languages tables |
| BCNF | Non-superkey determinants | Decomposed job_output_assignment; extracted reviewers table |
| 4NF | Multi-valued dependencies | Separated user_platforms and user_languages tables |
| 5NF | Join dependencies | Decomposed ternary relation into three binary relations |

---
