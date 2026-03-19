-- ============================================================================
-- WEEK 5: Complex Queries — Subqueries, Joins & Views
-- Project: AI Content Repurposer
-- Database: content_repurposer (MySQL)
-- ============================================================================

-- ============================================================================
-- PART A: JOINS (INNER JOIN, LEFT JOIN, RIGHT JOIN)
-- ============================================================================

-- ----------------------------------------
-- Query 1: INNER JOIN (4-table join) — Full content pipeline details
-- ----------------------------------------
SELECT 
    u.name AS user_name,
    u.email,
    c.title AS content_title,
    c.language AS source_language,
    rj.target_platform,
    rj.target_language,
    rj.status AS job_status,
    go.format_type,
    go.is_edited,
    LEFT(go.output_text, 100) AS output_preview,
    rj.created_at AS job_date
FROM users u
INNER JOIN contents c ON u.user_id = c.user_id
INNER JOIN repurpose_jobs rj ON c.content_id = rj.content_id
INNER JOIN generated_outputs go ON rj.job_id = go.job_id
ORDER BY rj.created_at DESC;

-- ----------------------------------------
-- Query 2: LEFT JOIN — Show ALL users, even those with no content
-- ----------------------------------------
SELECT 
    u.name,
    u.email,
    u.created_at AS joined_on,
    COUNT(DISTINCT c.content_id) AS content_count,
    COUNT(DISTINCT rj.job_id) AS job_count,
    COUNT(DISTINCT go.output_id) AS output_count
FROM users u
LEFT JOIN contents c ON u.user_id = c.user_id
LEFT JOIN repurpose_jobs rj ON c.content_id = rj.content_id
LEFT JOIN generated_outputs go ON rj.job_id = go.job_id
GROUP BY u.user_id, u.name, u.email, u.created_at;

-- ----------------------------------------
-- Query 3: RIGHT JOIN — Show all jobs, including those without outputs (failed jobs)
-- ----------------------------------------
SELECT 
    rj.job_id,
    rj.target_platform,
    rj.status AS job_status,
    rj.created_at AS job_date,
    go.output_id,
    go.format_type,
    CASE 
        WHEN go.output_id IS NULL THEN 'No output generated'
        ELSE 'Output available'
    END AS output_status
FROM generated_outputs go
RIGHT JOIN repurpose_jobs rj ON go.job_id = rj.job_id
ORDER BY rj.created_at DESC;

-- ----------------------------------------
-- Query 4: LEFT JOIN — Find users who registered but never created any content
-- ----------------------------------------
SELECT 
    u.name,
    u.email,
    u.created_at AS registration_date
FROM users u
LEFT JOIN contents c ON u.user_id = c.user_id
WHERE c.content_id IS NULL;

-- ----------------------------------------
-- Query 5: Self-referencing style — Compare content creation across same user
-- (contents created in different languages by the same user)
-- ----------------------------------------
SELECT 
    c1.title AS content_1,
    c1.language AS language_1,
    c2.title AS content_2,
    c2.language AS language_2
FROM contents c1
INNER JOIN contents c2 ON c1.user_id = c2.user_id 
    AND c1.content_id < c2.content_id
    AND c1.language != c2.language;


-- ============================================================================
-- PART B: SUBQUERIES (Nested, Correlated, EXISTS)
-- ============================================================================

-- ----------------------------------------
-- Query 6: Nested Subquery — Users whose content count is above average
-- ----------------------------------------
SELECT 
    u.name, 
    u.email,
    (SELECT COUNT(*) FROM contents c WHERE c.user_id = u.user_id) AS content_count
FROM users u
WHERE (SELECT COUNT(*) FROM contents c WHERE c.user_id = u.user_id) > (
    SELECT AVG(cnt) 
    FROM (SELECT COUNT(*) AS cnt FROM contents GROUP BY user_id) AS avg_tbl
);

-- ----------------------------------------
-- Query 7: Correlated Subquery — Latest job status for each content
-- ----------------------------------------
SELECT 
    c.title,
    c.created_at,
    (
        SELECT rj.status 
        FROM repurpose_jobs rj 
        WHERE rj.content_id = c.content_id 
        ORDER BY rj.created_at DESC 
        LIMIT 1
    ) AS latest_job_status,
    (
        SELECT rj.target_platform
        FROM repurpose_jobs rj
        WHERE rj.content_id = c.content_id
        ORDER BY rj.created_at DESC
        LIMIT 1
    ) AS latest_platform
FROM contents c;

-- ----------------------------------------
-- Query 8: Nested Subquery — Contents with failed jobs that have no outputs
-- ----------------------------------------
SELECT 
    c.title, 
    c.created_at,
    c.language
FROM contents c
WHERE c.content_id IN (
    SELECT rj.content_id
    FROM repurpose_jobs rj
    WHERE rj.status = 'failed'
    AND rj.job_id NOT IN (
        SELECT go.job_id FROM generated_outputs go
    )
);

-- ----------------------------------------
-- Query 9: EXISTS — Users who have edited at least one generated output
-- ----------------------------------------
SELECT 
    u.name, 
    u.email
FROM users u
WHERE EXISTS (
    SELECT 1 
    FROM contents c
    INNER JOIN repurpose_jobs rj ON c.content_id = rj.content_id
    INNER JOIN generated_outputs go ON rj.job_id = go.job_id
    WHERE c.user_id = u.user_id 
    AND go.is_edited = TRUE
);

-- ----------------------------------------
-- Query 10: NOT EXISTS — Contents that have never been repurposed
-- ----------------------------------------
SELECT 
    c.content_id,
    c.title,
    c.created_at
FROM contents c
WHERE NOT EXISTS (
    SELECT 1 FROM repurpose_jobs rj WHERE rj.content_id = c.content_id
);

-- ----------------------------------------
-- Query 11: Subquery in FROM (Derived Table) — Platform performance ranking
-- ----------------------------------------
SELECT 
    platform_stats.target_platform,
    platform_stats.total_jobs,
    platform_stats.completed_jobs,
    platform_stats.success_rate,
    RANK() OVER (ORDER BY platform_stats.success_rate DESC) AS platform_rank
FROM (
    SELECT 
        target_platform,
        COUNT(*) AS total_jobs,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_jobs,
        ROUND(
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2
        ) AS success_rate
    FROM repurpose_jobs
    GROUP BY target_platform
) AS platform_stats;


-- ============================================================================
-- PART C: VIEWS
-- ============================================================================

-- ----------------------------------------
-- View 1: User Dashboard Summary
-- Purpose: Simplifies the query needed to show user statistics on the dashboard
-- ----------------------------------------
CREATE OR REPLACE VIEW vw_user_dashboard AS
SELECT 
    u.user_id,
    u.name,
    u.email,
    u.created_at AS member_since,
    COUNT(DISTINCT c.content_id) AS total_contents,
    COUNT(DISTINCT rj.job_id) AS total_jobs,
    SUM(CASE WHEN rj.status = 'completed' THEN 1 ELSE 0 END) AS completed_jobs,
    SUM(CASE WHEN rj.status = 'failed' THEN 1 ELSE 0 END) AS failed_jobs,
    SUM(CASE WHEN rj.status = 'pending' THEN 1 ELSE 0 END) AS pending_jobs,
    COUNT(DISTINCT go.output_id) AS total_outputs,
    SUM(CASE WHEN go.is_edited = TRUE THEN 1 ELSE 0 END) AS edited_outputs
FROM users u
LEFT JOIN contents c ON u.user_id = c.user_id
LEFT JOIN repurpose_jobs rj ON c.content_id = rj.content_id
LEFT JOIN generated_outputs go ON rj.job_id = go.job_id
GROUP BY u.user_id, u.name, u.email, u.created_at;

-- Using the view:
SELECT * FROM vw_user_dashboard;
SELECT * FROM vw_user_dashboard WHERE total_contents > 2;

-- ----------------------------------------
-- View 2: Platform Analytics
-- Purpose: Quick access to per-platform success metrics (secure data access)
-- ----------------------------------------
CREATE OR REPLACE VIEW vw_platform_analytics AS
SELECT 
    rj.target_platform,
    COUNT(*) AS total_jobs,
    SUM(CASE WHEN rj.status = 'completed' THEN 1 ELSE 0 END) AS success_count,
    SUM(CASE WHEN rj.status = 'failed' THEN 1 ELSE 0 END) AS failure_count,
    ROUND(
        SUM(CASE WHEN rj.status = 'completed' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2
    ) AS success_rate_percent,
    COUNT(DISTINCT go.output_id) AS outputs_generated,
    MAX(rj.created_at) AS last_job_date
FROM repurpose_jobs rj
LEFT JOIN generated_outputs go ON rj.job_id = go.job_id
GROUP BY rj.target_platform;

-- Using the view:
SELECT * FROM vw_platform_analytics ORDER BY success_rate_percent DESC;

-- ----------------------------------------
-- View 3: Recent Activity Feed
-- Purpose: Shows the latest activity across all users for admin or monitoring
-- ----------------------------------------
CREATE OR REPLACE VIEW vw_recent_activity AS
SELECT 
    u.name AS user_name,
    c.title AS content_title,
    c.language AS source_language,
    rj.target_platform,
    rj.target_language,
    rj.status AS job_status,
    rj.created_at AS job_date,
    rj.completed_at,
    go.format_type,
    go.is_edited
FROM users u
INNER JOIN contents c ON u.user_id = c.user_id
INNER JOIN repurpose_jobs rj ON c.content_id = rj.content_id
LEFT JOIN generated_outputs go ON rj.job_id = go.job_id
ORDER BY rj.created_at DESC;

-- Using the view:
SELECT * FROM vw_recent_activity LIMIT 20;
SELECT * FROM vw_recent_activity WHERE job_status = 'failed';

-- ============================================================================
-- END OF WEEK 5
-- ============================================================================
