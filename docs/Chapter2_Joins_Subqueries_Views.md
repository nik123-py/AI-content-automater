# Chapter 2: Complex Queries — Subqueries, Joins & Views

## Project: AI Content Repurposer
## Database: MySQL (content_repurposer)

---

## 2.1 Introduction

This chapter demonstrates the implementation of complex SQL queries using joins, subqueries, and views in the AI Content Repurposer project. These concepts allow us to retrieve data from multiple related tables, perform advanced filtering, and create simplified data access layers.

### Table Relationships

```
users ──(1:N)──→ contents ──(1:N)──→ repurpose_jobs ──(1:N)──→ generated_outputs
```

---

## 2.2 Joins

Joins combine rows from two or more tables based on a related column (usually foreign keys).

### 2.2.1 INNER JOIN

Returns only rows where there is a match in **both** tables.

```sql
-- 4-table INNER JOIN: Full content pipeline details
SELECT u.name AS user_name, u.email,
       c.title AS content_title, c.language AS source_language,
       rj.target_platform, rj.status AS job_status,
       go.format_type, LEFT(go.output_text, 100) AS output_preview
FROM users u
INNER JOIN contents c ON u.user_id = c.user_id
INNER JOIN repurpose_jobs rj ON c.content_id = rj.content_id
INNER JOIN generated_outputs go ON rj.job_id = go.job_id
ORDER BY rj.created_at DESC;
```

**Explanation:** Chains 4 tables together to show the complete pipeline: who created what content, which platform it was repurposed for, and the generated output. Only rows with data in ALL 4 tables appear.

### 2.2.2 LEFT JOIN

Returns **all rows** from the left table, with `NULL` for non-matching right-table columns.

```sql
-- Show ALL users, even those with no content
SELECT u.name, u.email, u.created_at AS joined_on,
       COUNT(DISTINCT c.content_id) AS content_count,
       COUNT(DISTINCT rj.job_id) AS job_count,
       COUNT(DISTINCT go.output_id) AS output_count
FROM users u
LEFT JOIN contents c ON u.user_id = c.user_id
LEFT JOIN repurpose_jobs rj ON c.content_id = rj.content_id
LEFT JOIN generated_outputs go ON rj.job_id = go.job_id
GROUP BY u.user_id, u.name, u.email, u.created_at;
```

**Explanation:** Unlike INNER JOIN, this includes users who haven't created any content yet (their counts show as 0). Essential for dashboard statistics.

```sql
-- Find users who registered but NEVER created content
SELECT u.name, u.email, u.created_at AS registration_date
FROM users u
LEFT JOIN contents c ON u.user_id = c.user_id
WHERE c.content_id IS NULL;
```

**Explanation:** By checking for `NULL` in the join result, we identify users with no matching content records — users who registered but haven't used the app.

### 2.2.3 RIGHT JOIN

Returns **all rows** from the right table, with `NULL` for non-matching left-table columns.

```sql
-- Show ALL jobs, including those without generated outputs (failed jobs)
SELECT rj.job_id, rj.target_platform, rj.status AS job_status,
       go.output_id, go.format_type,
       CASE WHEN go.output_id IS NULL THEN 'No output generated'
            ELSE 'Output available'
       END AS output_status
FROM generated_outputs go
RIGHT JOIN repurpose_jobs rj ON go.job_id = rj.job_id;
```

**Explanation:** Shows all repurpose jobs even if the AI generation failed and no output was produced. The `CASE` statement labels the output availability.

---

## 2.3 Subqueries

Subqueries are queries nested inside other queries. They enable complex filtering and calculations.

### 2.3.1 Nested Subquery

A subquery used within the `WHERE` clause.

```sql
-- Users whose content count is above the average
SELECT u.name, u.email,
       (SELECT COUNT(*) FROM contents c WHERE c.user_id = u.user_id) AS content_count
FROM users u
WHERE (SELECT COUNT(*) FROM contents c WHERE c.user_id = u.user_id) > (
    SELECT AVG(cnt) FROM (SELECT COUNT(*) AS cnt FROM contents GROUP BY user_id) AS avg_tbl
);
```

**Explanation:** Three levels of nesting:
1. **Innermost:** Counts contents per user
2. **Middle:** Calculates the average of those counts
3. **Outermost:** Compares each user's count against the average

### 2.3.2 Correlated Subquery

A subquery that references the outer query — executed once per outer row.

```sql
-- Latest job status for each content
SELECT c.title, c.created_at,
       (SELECT rj.status FROM repurpose_jobs rj
        WHERE rj.content_id = c.content_id
        ORDER BY rj.created_at DESC LIMIT 1) AS latest_job_status,
       (SELECT rj.target_platform FROM repurpose_jobs rj
        WHERE rj.content_id = c.content_id
        ORDER BY rj.created_at DESC LIMIT 1) AS latest_platform
FROM contents c;
```

**Explanation:** For each content row, the subquery runs to find the most recent job. The `WHERE rj.content_id = c.content_id` creates the correlation between inner and outer queries.

### 2.3.3 EXISTS / NOT EXISTS

Tests for the existence (or absence) of rows in a subquery.

```sql
-- Users who have edited at least one generated output
SELECT u.name, u.email
FROM users u
WHERE EXISTS (
    SELECT 1 FROM contents c
    INNER JOIN repurpose_jobs rj ON c.content_id = rj.content_id
    INNER JOIN generated_outputs go ON rj.job_id = go.job_id
    WHERE c.user_id = u.user_id AND go.is_edited = TRUE
);

-- Contents that have NEVER been repurposed
SELECT c.content_id, c.title, c.created_at
FROM contents c
WHERE NOT EXISTS (
    SELECT 1 FROM repurpose_jobs rj WHERE rj.content_id = c.content_id
);
```

**Explanation:** `EXISTS` returns `TRUE` if the subquery has any rows. It is often faster than `IN` for large datasets because it stops as soon as the first match is found.

### 2.3.4 Derived Table (Subquery in FROM)

A subquery used as a temporary table in the `FROM` clause.

```sql
-- Platform performance ranking
SELECT platform_stats.target_platform, platform_stats.total_jobs,
       platform_stats.success_rate,
       RANK() OVER (ORDER BY platform_stats.success_rate DESC) AS platform_rank
FROM (
    SELECT target_platform, COUNT(*) AS total_jobs,
           ROUND(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2)
           AS success_rate
    FROM repurpose_jobs GROUP BY target_platform
) AS platform_stats;
```

**Explanation:** The inner query calculates platform statistics, and the outer query applies a `RANK()` window function to rank platforms by success rate.

---

## 2.4 Views

Views are virtual tables defined by stored queries. They simplify complex queries and provide a layer of data access control.

### 2.4.1 User Dashboard Summary View

```sql
CREATE OR REPLACE VIEW vw_user_dashboard AS
SELECT u.user_id, u.name, u.email, u.created_at AS member_since,
       COUNT(DISTINCT c.content_id) AS total_contents,
       COUNT(DISTINCT rj.job_id) AS total_jobs,
       SUM(CASE WHEN rj.status = 'completed' THEN 1 ELSE 0 END) AS completed_jobs,
       SUM(CASE WHEN rj.status = 'failed' THEN 1 ELSE 0 END) AS failed_jobs,
       COUNT(DISTINCT go.output_id) AS total_outputs
FROM users u
LEFT JOIN contents c ON u.user_id = c.user_id
LEFT JOIN repurpose_jobs rj ON c.content_id = rj.content_id
LEFT JOIN generated_outputs go ON rj.job_id = go.job_id
GROUP BY u.user_id, u.name, u.email, u.created_at;
```

**Purpose:** Instead of writing a complex 4-table join every time the dashboard needs user statistics, we simply query: `SELECT * FROM vw_user_dashboard;`

### 2.4.2 Platform Analytics View

```sql
CREATE OR REPLACE VIEW vw_platform_analytics AS
SELECT rj.target_platform, COUNT(*) AS total_jobs,
       SUM(CASE WHEN rj.status = 'completed' THEN 1 ELSE 0 END) AS success_count,
       ROUND(SUM(CASE WHEN rj.status = 'completed' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2)
       AS success_rate_percent,
       COUNT(DISTINCT go.output_id) AS outputs_generated
FROM repurpose_jobs rj
LEFT JOIN generated_outputs go ON rj.job_id = go.job_id
GROUP BY rj.target_platform;
```

**Purpose:** Provides a quick analytics dashboard for platform performance. Hides the complexity of joins and aggregations from the application layer.

### 2.4.3 Recent Activity View

```sql
CREATE OR REPLACE VIEW vw_recent_activity AS
SELECT u.name AS user_name, c.title AS content_title,
       rj.target_platform, rj.status AS job_status,
       rj.created_at AS job_date, go.format_type, go.is_edited
FROM users u
INNER JOIN contents c ON u.user_id = c.user_id
INNER JOIN repurpose_jobs rj ON c.content_id = rj.content_id
LEFT JOIN generated_outputs go ON rj.job_id = go.job_id
ORDER BY rj.created_at DESC;
```

**Purpose:** Creates a live activity feed for monitoring. Usage: `SELECT * FROM vw_recent_activity WHERE job_status = 'failed';`

### Advantages of Views
1. **Simplification:** Complex queries become simple `SELECT * FROM view_name`
2. **Security:** Users can access views without direct table access
3. **Reusability:** Same complex query used in multiple places without duplication
4. **Abstraction:** Application code doesn't need to know the underlying table structure

---

## 2.5 Conclusion

This chapter demonstrated the use of INNER/LEFT/RIGHT JOINs for combining data across 4 tables, nested, correlated, and EXISTS subqueries for advanced filtering, and views for creating reusable query layers — all tailored to the AI Content Repurposer project's schema.
