# Chapter 1: Constraints, Aggregate Functions & Set Operations

## Project: AI Content Repurposer
## Database: MySQL (content_repurposer)

---

## 1.1 Introduction

This chapter demonstrates the implementation of SQL constraints, aggregate functions, and set operations in the **AI Content Repurposer** project. The project uses a MySQL database with 4 interrelated tables: `users`, `contents`, `repurpose_jobs`, and `generated_outputs`.

### Database Schema Overview

```
users (user_id PK, name, email UNIQUE, password_hash, created_at, updated_at)
   │
   └──→ contents (content_id PK, user_id FK, title, original_text, source_url, language, created_at)
           │
           └──→ repurpose_jobs (job_id PK, content_id FK, target_platform, target_language, status, created_at, completed_at)
                   │
                   └──→ generated_outputs (output_id PK, job_id FK, output_text, format_type, is_edited, created_at, updated_at)
```

---

## 1.2 Constraints

Constraints enforce data integrity rules at the database level. Our project uses the following types:

### 1.2.1 PRIMARY KEY Constraint
Ensures each row in a table is uniquely identifiable.

```sql
-- Each table has a UUID-based primary key
-- users.user_id, contents.content_id, repurpose_jobs.job_id, generated_outputs.output_id
```

**Purpose in our project:** Every user, content, job, and output has a globally unique identifier (UUID), ensuring there are no duplicate records.

### 1.2.2 FOREIGN KEY Constraint
Maintains referential integrity between related tables.

```sql
-- contents.user_id → users.user_id (ON DELETE CASCADE)
-- repurpose_jobs.content_id → contents.content_id (ON DELETE CASCADE)
-- generated_outputs.job_id → repurpose_jobs.job_id (ON DELETE CASCADE)
```

**Purpose in our project:** When a user is deleted, all their content, jobs, and outputs are automatically removed (CASCADE). This prevents orphan records.

### 1.2.3 UNIQUE Constraint
Prevents duplicate values in a column.

```sql
-- users.email is UNIQUE
-- Ensures no two users can register with the same email
```

### 1.2.4 NOT NULL Constraint
Ensures a column always has a value.

```sql
-- users: name, email, password_hash, created_at are NOT NULL
-- contents: user_id, original_text, language, created_at are NOT NULL
-- repurpose_jobs: content_id, target_platform, status, created_at are NOT NULL
```

### 1.2.5 DEFAULT Constraint
Provides a default value when none is specified.

```sql
-- contents.language DEFAULT 'English'
-- repurpose_jobs.status DEFAULT 'pending'
-- generated_outputs.is_edited DEFAULT FALSE
```

### 1.2.6 CHECK Constraint (Added)
Validates that column values meet specific conditions.

```sql
-- Ensures job status is only one of the valid states
ALTER TABLE repurpose_jobs
ADD CONSTRAINT chk_job_status
CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

-- Ensures only supported platforms are used
ALTER TABLE repurpose_jobs
ADD CONSTRAINT chk_platform
CHECK (target_platform IN ('linkedin', 'twitter', 'instagram', 'email', 'youtube_script', 'youtube_shorts'));

-- Ensures language is from the supported list
ALTER TABLE contents
ADD CONSTRAINT chk_content_language
CHECK (language IN ('English', 'Hindi', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Arabic'));
```

**Purpose in our project:** Prevents invalid data (e.g., a job with status "xyz" or platform "tiktok") from being inserted, maintaining data consistency.

---

## 1.3 Aggregate Functions

Aggregate functions perform calculations on groups of rows and return a single summary value.

### 1.3.1 COUNT with GROUP BY and HAVING

```sql
-- Count of contents per user (only users with 2+ contents)
SELECT u.name, u.email, COUNT(c.content_id) AS total_contents
FROM users u
INNER JOIN contents c ON u.user_id = c.user_id
GROUP BY u.user_id, u.name, u.email
HAVING COUNT(c.content_id) >= 2;
```

**Explanation:** Groups contents by user and counts them. `HAVING` filters out users with fewer than 2 contents (unlike `WHERE`, `HAVING` filters after aggregation).

### 1.3.2 COUNT + SUM (Conditional Aggregation)

```sql
-- Jobs per platform with success/failure breakdown
SELECT target_platform,
       COUNT(*) AS total_jobs,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS successful_jobs,
       SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_jobs
FROM repurpose_jobs
GROUP BY target_platform
HAVING COUNT(*) >= 1;
```

**Explanation:** Uses `CASE` within `SUM` to count specific statuses per platform. This creates a breakdown of job outcomes.

### 1.3.3 AVG (Average)

```sql
-- Average outputs per job, grouped by platform
SELECT rj.target_platform,
       COUNT(DISTINCT rj.job_id) AS total_jobs,
       COUNT(go.output_id) AS total_outputs,
       ROUND(COUNT(go.output_id) / COUNT(DISTINCT rj.job_id), 2) AS avg_outputs_per_job
FROM repurpose_jobs rj
LEFT JOIN generated_outputs go ON rj.job_id = go.job_id
GROUP BY rj.target_platform;
```

**Explanation:** Calculates average outputs per job for each platform. Uses `ROUND()` for clean decimal output.

### 1.3.4 MAX and MIN

```sql
-- First and last content creation date per user
SELECT u.name, u.email,
       MIN(c.created_at) AS first_content_date,
       MAX(c.created_at) AS last_content_date,
       COUNT(c.content_id) AS total_contents
FROM users u
INNER JOIN contents c ON u.user_id = c.user_id
GROUP BY u.user_id, u.name, u.email;
```

**Explanation:** `MIN` and `MAX` find the earliest and latest content creation timestamps for each user.

### 1.3.5 Platform Success Rate with HAVING Filter

```sql
-- Platforms with more than 50% success rate
SELECT target_platform, COUNT(*) AS total_jobs,
       ROUND(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2)
       AS success_rate_percent
FROM repurpose_jobs
GROUP BY target_platform
HAVING ROUND(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) > 50;
```

**Explanation:** Combines `SUM`, `COUNT`, and `HAVING` to filter platforms based on calculated success rates.

---

## 1.4 Set Operations

Set operations combine results from multiple `SELECT` statements.

### 1.4.1 UNION (Removes Duplicates)

```sql
-- All users who either created content OR had completed jobs
SELECT u.user_id, u.name, 'Content Creator' AS role
FROM users u INNER JOIN contents c ON u.user_id = c.user_id
UNION
SELECT u.user_id, u.name, 'Successful Repurposer' AS role
FROM users u INNER JOIN contents c ON u.user_id = c.user_id
INNER JOIN repurpose_jobs rj ON c.content_id = rj.content_id
WHERE rj.status = 'completed';
```

**Explanation:** Combines two result sets, removing duplicate rows. Shows users categorized by their activity.

### 1.4.2 UNION ALL (Keeps Duplicates)

```sql
-- Complete activity log combining content creation and job starts
SELECT c.user_id, 'content_created' AS activity_type, c.title AS detail, c.created_at
FROM contents c
UNION ALL
SELECT c.user_id, 'job_started' AS activity_type, rj.target_platform AS detail, rj.created_at
FROM repurpose_jobs rj INNER JOIN contents c ON rj.content_id = c.content_id
ORDER BY created_at DESC;
```

**Explanation:** Unlike `UNION`, `UNION ALL` retains all rows including duplicates, useful for creating a complete chronological activity log.

### 1.4.3 Simulated EXCEPT (MySQL)

```sql
-- Users who created content but NEVER had a completed job
SELECT u.user_id, u.name, u.email
FROM users u INNER JOIN contents c ON u.user_id = c.user_id
WHERE u.user_id NOT IN (
    SELECT DISTINCT c2.user_id
    FROM contents c2 INNER JOIN repurpose_jobs rj ON c2.content_id = rj.content_id
    WHERE rj.status = 'completed'
);
```

**Explanation:** MySQL doesn't have `EXCEPT` directly, so we simulate it with `NOT IN`. This finds users present in the first set but absent from the second.

### 1.4.4 Simulated INTERSECT (MySQL)

```sql
-- Users who have BOTH LinkedIn AND Twitter jobs
SELECT DISTINCT u.user_id, u.name
FROM users u INNER JOIN contents c ON u.user_id = c.user_id
INNER JOIN repurpose_jobs rj ON c.content_id = rj.content_id
WHERE rj.target_platform = 'linkedin'
AND u.user_id IN (
    SELECT c2.user_id FROM contents c2
    INNER JOIN repurpose_jobs rj2 ON c2.content_id = rj2.content_id
    WHERE rj2.target_platform = 'twitter'
);
```

**Explanation:** Simulates `INTERSECT` using `IN` subquery. Finds users common to both result sets.

---

## 1.5 Conclusion

This chapter demonstrated the use of constraints (PRIMARY KEY, FOREIGN KEY, UNIQUE, NOT NULL, DEFAULT, CHECK) for data integrity, aggregate functions (COUNT, SUM, AVG, MAX, MIN) with GROUP BY/HAVING for data analysis, and set operations (UNION, UNION ALL, simulated EXCEPT/INTERSECT) for combining query results — all applied to the AI Content Repurposer database.
