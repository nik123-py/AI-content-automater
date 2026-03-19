-- ============================================================================
-- WEEK 4: Constraints, Aggregate Functions & Set Operations
-- Project: AI Content Repurposer
-- Database: content_repurposer (MySQL)
-- ============================================================================

-- ============================================================================
-- PART A: CONSTRAINTS
-- ============================================================================

-- 1. PRIMARY KEY constraints (already defined during table creation)
--    users.user_id, contents.content_id, repurpose_jobs.job_id, generated_outputs.output_id

-- 2. FOREIGN KEY constraints (already defined during table creation)
--    contents.user_id → users.user_id (ON DELETE CASCADE)
--    repurpose_jobs.content_id → contents.content_id (ON DELETE CASCADE)
--    generated_outputs.job_id → repurpose_jobs.job_id (ON DELETE CASCADE)

-- 3. UNIQUE constraint (already defined during table creation)
--    users.email is UNIQUE

-- 4. NOT NULL constraints (already defined during table creation)
--    users: name, email, password_hash, created_at
--    contents: user_id, original_text, language, created_at
--    repurpose_jobs: content_id, target_platform, target_language, status, created_at
--    generated_outputs: job_id, output_text, format_type, is_edited, created_at

-- 5. DEFAULT constraints (already defined during table creation)
--    contents.language DEFAULT 'English'
--    repurpose_jobs.status DEFAULT 'pending'
--    repurpose_jobs.target_language DEFAULT 'English'
--    generated_outputs.is_edited DEFAULT FALSE

-- ----------------------------------------
-- Adding CHECK constraints
-- ----------------------------------------

-- CHECK: Ensure job status is one of the valid values
ALTER TABLE repurpose_jobs
ADD CONSTRAINT chk_job_status
CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

-- CHECK: Ensure target_platform is a supported platform
ALTER TABLE repurpose_jobs
ADD CONSTRAINT chk_platform
CHECK (target_platform IN ('linkedin', 'twitter', 'instagram', 'email', 'youtube_script', 'youtube_shorts'));

-- CHECK: Ensure language is from supported list
ALTER TABLE contents
ADD CONSTRAINT chk_content_language
CHECK (language IN ('English', 'Hindi', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Arabic'));

-- CHECK: Ensure user's name is not empty
ALTER TABLE users
ADD CONSTRAINT chk_user_name_not_empty
CHECK (CHAR_LENGTH(name) > 0);

-- Verify constraints by trying an invalid insert (should fail):
-- INSERT INTO repurpose_jobs (job_id, content_id, target_platform, status)
-- VALUES ('test-id', 'content-id', 'tiktok', 'pending');
-- Expected: ERROR - check constraint 'chk_platform' is violated


-- ============================================================================
-- PART B: AGGREGATE FUNCTIONS (COUNT, SUM, AVG, MAX, MIN with GROUP BY / HAVING)
-- ============================================================================

-- ----------------------------------------
-- Query 1: COUNT - Total contents created per user (only users with 2+ contents)
-- ----------------------------------------
SELECT 
    u.name AS user_name,
    u.email,
    COUNT(c.content_id) AS total_contents
FROM users u
INNER JOIN contents c ON u.user_id = c.user_id
GROUP BY u.user_id, u.name, u.email
HAVING COUNT(c.content_id) >= 2;

-- ----------------------------------------
-- Query 2: COUNT + SUM - Jobs per platform with success/failure breakdown
-- ----------------------------------------
SELECT 
    target_platform,
    COUNT(*) AS total_jobs,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS successful_jobs,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_jobs,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_jobs
FROM repurpose_jobs
GROUP BY target_platform
HAVING COUNT(*) >= 1;

-- ----------------------------------------
-- Query 3: AVG - Average number of outputs generated per job, grouped by platform
-- ----------------------------------------
SELECT 
    rj.target_platform,
    COUNT(DISTINCT rj.job_id) AS total_jobs,
    COUNT(go.output_id) AS total_outputs,
    ROUND(COUNT(go.output_id) / COUNT(DISTINCT rj.job_id), 2) AS avg_outputs_per_job
FROM repurpose_jobs rj
LEFT JOIN generated_outputs go ON rj.job_id = go.job_id
GROUP BY rj.target_platform;

-- ----------------------------------------
-- Query 4: MAX, MIN - First and last content creation date per user
-- ----------------------------------------
SELECT 
    u.name,
    u.email,
    MIN(c.created_at) AS first_content_date,
    MAX(c.created_at) AS last_content_date,
    COUNT(c.content_id) AS total_contents
FROM users u
INNER JOIN contents c ON u.user_id = c.user_id
GROUP BY u.user_id, u.name, u.email;

-- ----------------------------------------
-- Query 5: Monthly content creation stats (with HAVING)
-- ----------------------------------------
SELECT 
    DATE_FORMAT(c.created_at, '%Y-%m') AS month,
    COUNT(c.content_id) AS contents_created,
    COUNT(DISTINCT c.user_id) AS active_users
FROM contents c
GROUP BY DATE_FORMAT(c.created_at, '%Y-%m')
HAVING COUNT(c.content_id) >= 1
ORDER BY month DESC;

-- ----------------------------------------
-- Query 6: Platform success rate (HAVING to filter platforms > 50% success)
-- ----------------------------------------
SELECT 
    target_platform,
    COUNT(*) AS total_jobs,
    ROUND(
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*) * 100, 
        2
    ) AS success_rate_percent
FROM repurpose_jobs
GROUP BY target_platform
HAVING ROUND(
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2
) > 50;


-- ============================================================================
-- PART C: SET OPERATIONS (UNION, UNION ALL, simulated INTERSECT & EXCEPT)
-- ============================================================================

-- ----------------------------------------
-- Query 1: UNION - All users who either created content OR had completed jobs
-- ----------------------------------------
SELECT u.user_id, u.name, 'Content Creator' AS role
FROM users u
INNER JOIN contents c ON u.user_id = c.user_id
UNION
SELECT u.user_id, u.name, 'Successful Repurposer' AS role
FROM users u
INNER JOIN contents c ON u.user_id = c.user_id
INNER JOIN repurpose_jobs rj ON c.content_id = rj.content_id
WHERE rj.status = 'completed';

-- ----------------------------------------
-- Query 2: UNION ALL - Complete activity log (content creation + job creation)
-- ----------------------------------------
SELECT c.user_id, 'content_created' AS activity_type, c.title AS detail, c.created_at
FROM contents c
UNION ALL
SELECT c.user_id, 'job_started' AS activity_type, rj.target_platform AS detail, rj.created_at
FROM repurpose_jobs rj
INNER JOIN contents c ON rj.content_id = c.content_id
ORDER BY created_at DESC;

-- ----------------------------------------
-- Query 3: Simulated EXCEPT - Users who created content but NEVER had a completed job
-- (MySQL doesn't support EXCEPT directly, so we use NOT IN)
-- ----------------------------------------
SELECT u.user_id, u.name, u.email
FROM users u
INNER JOIN contents c ON u.user_id = c.user_id
WHERE u.user_id NOT IN (
    SELECT DISTINCT c2.user_id
    FROM contents c2
    INNER JOIN repurpose_jobs rj ON c2.content_id = rj.content_id
    WHERE rj.status = 'completed'
);

-- ----------------------------------------
-- Query 4: Simulated INTERSECT - Users who have BOTH linkedin AND twitter jobs
-- (MySQL doesn't support INTERSECT directly, so we use IN with subquery)
-- ----------------------------------------
SELECT DISTINCT u.user_id, u.name
FROM users u
INNER JOIN contents c ON u.user_id = c.user_id
INNER JOIN repurpose_jobs rj ON c.content_id = rj.content_id
WHERE rj.target_platform = 'linkedin'
AND u.user_id IN (
    SELECT c2.user_id
    FROM contents c2
    INNER JOIN repurpose_jobs rj2 ON c2.content_id = rj2.content_id
    WHERE rj2.target_platform = 'twitter'
);

-- ============================================================================
-- END OF WEEK 4
-- ============================================================================
