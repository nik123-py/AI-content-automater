# CHAPTER 3

## Complex Queries Based on the Concepts of Constraints, Sets, Joins, Views, Triggers and Cursors

---

### 3.1 Adding Constraints and Queries Based on Constraints

**Question 1:** Add a CHECK constraint to ensure that the job status can only be one of the four valid lifecycle states (pending, processing, completed, failed), then attempt to insert a job with an invalid status 'cancelled'.

**SQL Statement:**
```sql
ALTER TABLE repurpose_jobs
ADD CONSTRAINT chk_job_status
CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

-- Attempting invalid insert:
INSERT INTO repurpose_jobs (job_id, content_id, target_platform, status)
VALUES ('j099', 'c001', 'linkedin', 'cancelled');
```

**Output:** Error: Check constraint 'chk_job_status' is violated.

---

**Question 2:** Add a CHECK constraint to ensure the target_platform is one of the six supported platforms, then verify by querying all distinct platforms currently in the system.

**SQL Statement:**
```sql
ALTER TABLE repurpose_jobs
ADD CONSTRAINT chk_platform
CHECK (target_platform IN ('linkedin', 'twitter', 'instagram', 'email', 'youtube_script', 'youtube_shorts'));

SELECT DISTINCT target_platform FROM repurpose_jobs;
```

**Output:**

| target_platform |
|-----------------|
| linkedin |
| twitter |
| email |
| instagram |
| youtube_script |
| youtube_shorts |

---

**Question 3:** Add a CHECK constraint to ensure the content language belongs to the supported language list, and add a constraint ensuring a user's name is not empty. Then verify by querying the users table.

**SQL Statement:**
```sql
ALTER TABLE contents
ADD CONSTRAINT chk_content_language
CHECK (language IN ('English', 'Hindi', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Arabic'));

ALTER TABLE users
ADD CONSTRAINT chk_user_name_not_empty
CHECK (CHAR_LENGTH(name) > 0);

-- Attempting invalid insert:
INSERT INTO users (user_id, name, email, password_hash)
VALUES ('u099', '', 'empty@example.com', '$2b$12$hashvalue');
```

**Output:** Error: Check constraint 'chk_user_name_not_empty' is violated.

---

### 3.2 Queries Based on Aggregate Functions

**Question 1:** Count the total number of contents created per user, but only show users who have created 2 or more content pieces.

**SQL Statement:**
```sql
SELECT 
    u.name AS user_name,
    u.email,
    COUNT(c.content_id) AS total_contents
FROM users u
INNER JOIN contents c ON u.user_id = c.user_id
GROUP BY u.user_id, u.name, u.email
HAVING COUNT(c.content_id) >= 2;
```

**Output:**

| user_name | email | total_contents |
|-----------|-------|----------------|
| Nikhil Sharma | nikhil@example.com | 2 |
| Priya Patel | priya@example.com | 2 |
| Arjun Reddy | arjun@example.com | 2 |
| Rahul Verma | rahul@example.com | 2 |

---

**Question 2:** For each target platform, show the total number of jobs along with a breakdown of how many succeeded, failed, and are pending.

**SQL Statement:**
```sql
SELECT 
    target_platform,
    COUNT(*) AS total_jobs,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS successful_jobs,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_jobs,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_jobs
FROM repurpose_jobs
GROUP BY target_platform
HAVING COUNT(*) >= 1;
```

**Output:**

| target_platform | total_jobs | successful_jobs | failed_jobs | pending_jobs |
|-----------------|------------|-----------------|-------------|--------------|
| linkedin | 6 | 5 | 0 | 1 |
| twitter | 5 | 4 | 0 | 1 |
| email | 3 | 2 | 1 | 0 |
| instagram | 3 | 1 | 2 | 0 |
| youtube_script | 2 | 1 | 0 | 0 |
| youtube_shorts | 1 | 1 | 0 | 0 |

---

**Question 3:** Find the first and last content creation date per user, along with the total content count.

**SQL Statement:**
```sql
SELECT 
    u.name,
    u.email,
    MIN(c.created_at) AS first_content_date,
    MAX(c.created_at) AS last_content_date,
    COUNT(c.content_id) AS total_contents
FROM users u
INNER JOIN contents c ON u.user_id = c.user_id
GROUP BY u.user_id, u.name, u.email;
```

**Output:**

| name | email | first_content_date | last_content_date | total_contents |
|------|-------|-------------------|-------------------|----------------|
| Nikhil Sharma | nikhil@example.com | 2025-11-10 09:30:00 | 2025-11-15 10:00:00 | 2 |
| Priya Patel | priya@example.com | 2025-11-12 11:00:00 | 2025-11-18 13:00:00 | 2 |
| Arjun Reddy | arjun@example.com | 2025-11-20 14:30:00 | 2025-11-25 09:00:00 | 2 |
| Sneha Gupta | sneha@example.com | 2025-11-28 10:30:00 | 2025-11-28 10:30:00 | 1 |
| Rahul Verma | rahul@example.com | 2025-12-01 08:15:00 | 2025-12-03 12:00:00 | 2 |
| Ananya Singh | ananya@example.com | 2025-12-05 15:00:00 | 2025-12-05 15:00:00 | 1 |

---

### 3.3 Complex Queries Based on Sets

**Question 1:** Using UNION, find all users who either created content OR had at least one completed repurpose job, labeling them with their role.

**SQL Statement:**
```sql
SELECT u.user_id, u.name, 'Content Creator' AS role
FROM users u
INNER JOIN contents c ON u.user_id = c.user_id
UNION
SELECT u.user_id, u.name, 'Successful Repurposer' AS role
FROM users u
INNER JOIN contents c ON u.user_id = c.user_id
INNER JOIN repurpose_jobs rj ON c.content_id = rj.content_id
WHERE rj.status = 'completed';
```

**Output:**

| user_id | name | role |
|---------|------|------|
| u001 | Nikhil Sharma | Content Creator |
| u002 | Priya Patel | Content Creator |
| u003 | Arjun Reddy | Content Creator |
| u004 | Sneha Gupta | Content Creator |
| u001 | Nikhil Sharma | Successful Repurposer |
| u002 | Priya Patel | Successful Repurposer |
| u003 | Arjun Reddy | Successful Repurposer |
| u004 | Sneha Gupta | Successful Repurposer |

---

**Question 2:** Using UNION ALL, generate a complete activity log combining content creation events and job creation events across all users ordered by time.

**SQL Statement:**
```sql
SELECT c.user_id, 'content_created' AS activity_type, c.title AS detail, c.created_at
FROM contents c
UNION ALL
SELECT c.user_id, 'job_started' AS activity_type, rj.target_platform AS detail, rj.created_at
FROM repurpose_jobs rj
INNER JOIN contents c ON rj.content_id = c.content_id
ORDER BY created_at DESC;
```

**Output (first 10 rows):**

| user_id | activity_type | detail | created_at |
|---------|---------------|--------|------------|
| u016 | content_created | Microservices Architecture | 2025-12-25 14:30:00 |
| u015 | content_created | KI im Geschäft | 2025-12-23 11:45:00 |
| u014 | content_created | GraphQL vs REST | 2025-12-21 09:00:00 |
| u013 | job_started | instagram | 2025-12-19 16:30:00 |
| u013 | content_created | Product-Led Growth | 2025-12-19 16:00:00 |
| u012 | content_created | Kubernetes for Beginners | 2025-12-17 08:30:00 |
| u012 | job_started | linkedin | 2025-12-17 09:00:00 |
| u011 | job_started | youtube_script | 2025-12-15 13:30:00 |
| u011 | content_created | NLP Applications in 2026 | 2025-12-15 13:00:00 |
| u010 | job_started | twitter | 2025-12-13 10:45:00 |

---

**Question 3:** Simulated EXCEPT — Find users who created content but NEVER had a completed job (MySQL does not support EXCEPT natively).

**SQL Statement:**
```sql
SELECT u.user_id, u.name, u.email
FROM users u
INNER JOIN contents c ON u.user_id = c.user_id
WHERE u.user_id NOT IN (
    SELECT DISTINCT c2.user_id
    FROM contents c2
    INNER JOIN repurpose_jobs rj ON c2.content_id = rj.content_id
    WHERE rj.status = 'completed'
);
```

**Output:**

| user_id | name | email |
|---------|------|-------|
| u014 | Pooja Mehta | pooja@example.com |
| u015 | Rohit Kumar | rohit@example.com |
| u016 | Kavya Bhat | kavya@example.com |

---

### 3.4 Complex Queries Based on Subqueries

**Question 1:** Find users whose total content count is above the average content count across all users (nested subquery).

**SQL Statement:**
```sql
SELECT 
    u.name, 
    u.email,
    (SELECT COUNT(*) FROM contents c WHERE c.user_id = u.user_id) AS content_count
FROM users u
WHERE (SELECT COUNT(*) FROM contents c WHERE c.user_id = u.user_id) > (
    SELECT AVG(cnt) 
    FROM (SELECT COUNT(*) AS cnt FROM contents GROUP BY user_id) AS avg_tbl
);
```

**Output:**

| name | email | content_count |
|------|-------|---------------|
| Nikhil Sharma | nikhil@example.com | 2 |
| Priya Patel | priya@example.com | 2 |
| Arjun Reddy | arjun@example.com | 2 |
| Rahul Verma | rahul@example.com | 2 |

---

**Question 2:** For each content piece, find the latest job status and the platform of the most recent job using correlated subqueries.

**SQL Statement:**
```sql
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
```

**Output (first 10 rows):**

| title | created_at | latest_job_status | latest_platform |
|-------|------------|-------------------|-----------------|
| AI in Business Operations | 2025-11-10 | completed | twitter |
| Cloud Computing Guide | 2025-11-15 | completed | email |
| ML Algorithm Overview | 2025-11-12 | failed | instagram |
| IA en Negocios | 2025-11-18 | completed | twitter |
| Future of Remote Work | 2025-11-20 | completed | linkedin |
| Cybersecurity Trends 2026 | 2025-11-25 | pending | twitter |
| Green Tech Practices | 2025-11-28 | completed | instagram |
| DevOps Best Practices | 2025-12-01 | completed | linkedin |
| Guide du Cloud Computing | 2025-12-03 | failed | email |
| Data Engineering Pipelines | 2025-12-05 | completed | youtube_shorts |

---

**Question 3:** Using EXISTS, find users who have edited at least one AI-generated output.

**SQL Statement:**
```sql
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
```

**Output:**

| name | email |
|------|-------|
| Nikhil Sharma | nikhil@example.com |
| Priya Patel | priya@example.com |
| Arjun Reddy | arjun@example.com |
| Vikram Joshi | vikram@example.com |

---

### 3.5 Complex Queries Based on Joins

**Question 1:** Using a 4-table INNER JOIN, display the full content pipeline — from user to final generated output — with output previews.

**SQL Statement:**
```sql
SELECT 
    u.name AS user_name,
    c.title AS content_title,
    rj.target_platform,
    rj.status AS job_status,
    go.format_type,
    go.is_edited,
    LEFT(go.output_text, 80) AS output_preview
FROM users u
INNER JOIN contents c ON u.user_id = c.user_id
INNER JOIN repurpose_jobs rj ON c.content_id = rj.content_id
INNER JOIN generated_outputs go ON rj.job_id = go.job_id
ORDER BY rj.created_at DESC;
```

**Output (first 8 rows):**

| user_name | content_title | target_platform | job_status | format_type | is_edited | output_preview |
|-----------|---------------|-----------------|------------|-------------|-----------|----------------|
| Siddharth Rao | Kubernetes for Beginners | linkedin | completed | linkedin_post | FALSE | ☸️ Getting started with Kubernetes? Here is your roadmap... |
| Karan Malhotra | Edge Computing Explained | email | completed | email_newsletter | FALSE | Subject: Edge Computing — The Next Frontier... |
| Divya Iyer | Agile Management Guide | twitter | completed | tweet | FALSE | 🏃 एजाइल प्रोजेक्ट मैनेजमेंट... |
| Vikram Joshi | Blockchain Beyond Crypto | twitter | completed | tweet | TRUE | 🔗 Blockchain is NOT just crypto!... |
| Ananya Singh | Data Engineering Pipelines | youtube_shorts | completed | youtube_short | FALSE | HOOK: Did you know data pipelines process BILLIONS... |
| Rahul Verma | DevOps Best Practices | linkedin | completed | linkedin_post | FALSE | ⚙️ DevOps is not just a methodology... |
| Sneha Gupta | Green Tech Practices | instagram | completed | instagram_caption | FALSE | 🌿 Tech meets sustainability!... |
| Arjun Reddy | Future of Remote Work | linkedin | completed | linkedin_post | FALSE | 💻 Remote work is here to stay... |

---

**Question 2:** Using LEFT JOIN, show ALL users including those who have never created any content, with their content and job counts.

**SQL Statement:**
```sql
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
```

**Output (first 10 rows):**

| name | email | joined_on | content_count | job_count | output_count |
|------|-------|-----------|---------------|-----------|--------------|
| Nikhil Sharma | nikhil@example.com | 2025-11-01 | 2 | 3 | 5 |
| Priya Patel | priya@example.com | 2025-11-02 | 2 | 2 | 2 |
| Arjun Reddy | arjun@example.com | 2025-11-05 | 2 | 3 | 3 |
| Sneha Gupta | sneha@example.com | 2025-11-08 | 1 | 1 | 1 |
| Rahul Verma | rahul@example.com | 2025-11-10 | 2 | 2 | 2 |
| Ananya Singh | ananya@example.com | 2025-11-12 | 1 | 1 | 1 |
| Vikram Joshi | vikram@example.com | 2025-11-15 | 1 | 1 | 1 |
| Meera Nair | meera@example.com | 2025-11-18 | 1 | 1 | 0 |
| Karan Malhotra | karan@example.com | 2025-11-20 | 1 | 1 | 1 |
| Divya Iyer | divya@example.com | 2025-11-22 | 1 | 1 | 1 |

---

**Question 3:** Using RIGHT JOIN, show all jobs including those that failed and have no generated outputs, indicating which ones have missing outputs.

**SQL Statement:**
```sql
SELECT 
    rj.job_id,
    rj.target_platform,
    rj.status AS job_status,
    go.output_id,
    go.format_type,
    CASE 
        WHEN go.output_id IS NULL THEN 'No output generated'
        ELSE 'Output available'
    END AS output_status
FROM generated_outputs go
RIGHT JOIN repurpose_jobs rj ON go.job_id = rj.job_id
ORDER BY rj.created_at DESC;
```

**Output (first 10 rows):**

| job_id | target_platform | job_status | output_id | format_type | output_status |
|--------|-----------------|------------|-----------|-------------|---------------|
| j020 | instagram | failed | NULL | NULL | No output generated |
| j019 | linkedin | completed | o014 | linkedin_post | Output available |
| j018 | youtube_script | processing | NULL | NULL | No output generated |
| j017 | twitter | completed | o013 | tweet | Output available |
| j016 | email | completed | o012 | email_newsletter | Output available |
| j015 | linkedin | pending | NULL | NULL | No output generated |
| j014 | twitter | completed | o011 | tweet | Output available |
| j013 | youtube_shorts | completed | o010 | youtube_short | Output available |
| j012 | email | failed | NULL | NULL | No output generated |
| j011 | linkedin | completed | o009 | linkedin_post | Output available |

---

### 3.6 Complex Queries Based on Views

**Question 1:** Create a view that provides a user dashboard summary with content count, job count, completed/failed/pending breakdowns, and output count. Then query it.

**SQL Statement:**
```sql
CREATE OR REPLACE VIEW vw_user_dashboard AS
SELECT 
    u.user_id, u.name, u.email,
    u.created_at AS member_since,
    COUNT(DISTINCT c.content_id) AS total_contents,
    COUNT(DISTINCT rj.job_id) AS total_jobs,
    SUM(CASE WHEN rj.status = 'completed' THEN 1 ELSE 0 END) AS completed_jobs,
    SUM(CASE WHEN rj.status = 'failed' THEN 1 ELSE 0 END) AS failed_jobs,
    SUM(CASE WHEN rj.status = 'pending' THEN 1 ELSE 0 END) AS pending_jobs,
    COUNT(DISTINCT go.output_id) AS total_outputs
FROM users u
LEFT JOIN contents c ON u.user_id = c.user_id
LEFT JOIN repurpose_jobs rj ON c.content_id = rj.content_id
LEFT JOIN generated_outputs go ON rj.job_id = go.job_id
GROUP BY u.user_id, u.name, u.email, u.created_at;

SELECT * FROM vw_user_dashboard WHERE total_contents > 0;
```

**Output:**

| name | email | total_contents | total_jobs | completed_jobs | failed_jobs | pending_jobs | total_outputs |
|------|-------|----------------|------------|----------------|-------------|--------------|---------------|
| Nikhil Sharma | nikhil@example.com | 2 | 3 | 3 | 0 | 0 | 5 |
| Priya Patel | priya@example.com | 2 | 2 | 1 | 1 | 0 | 2 |
| Arjun Reddy | arjun@example.com | 2 | 3 | 2 | 0 | 1 | 3 |
| Rahul Verma | rahul@example.com | 2 | 2 | 1 | 1 | 0 | 2 |

---

**Question 2:** Create a platform analytics view showing success rate, failure count, and last job date per platform. Then query it sorted by success rate.

**SQL Statement:**
```sql
CREATE OR REPLACE VIEW vw_platform_analytics AS
SELECT 
    rj.target_platform,
    COUNT(*) AS total_jobs,
    SUM(CASE WHEN rj.status = 'completed' THEN 1 ELSE 0 END) AS success_count,
    SUM(CASE WHEN rj.status = 'failed' THEN 1 ELSE 0 END) AS failure_count,
    ROUND(SUM(CASE WHEN rj.status = 'completed' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) AS success_rate_percent,
    MAX(rj.created_at) AS last_job_date
FROM repurpose_jobs rj
GROUP BY rj.target_platform;

SELECT * FROM vw_platform_analytics ORDER BY success_rate_percent DESC;
```

**Output:**

| target_platform | total_jobs | success_count | failure_count | success_rate_percent | last_job_date |
|-----------------|------------|---------------|---------------|---------------------|---------------|
| youtube_shorts | 1 | 1 | 0 | 100.00 | 2025-12-05 |
| linkedin | 6 | 5 | 0 | 83.33 | 2025-12-17 |
| twitter | 5 | 4 | 0 | 80.00 | 2025-12-13 |
| email | 3 | 2 | 1 | 66.67 | 2025-12-11 |
| youtube_script | 2 | 1 | 0 | 50.00 | 2025-12-15 |
| instagram | 3 | 1 | 2 | 33.33 | 2025-12-19 |

---

**Question 3:** Create a recent activity feed view joining users, content, jobs J and outputs, showing the latest pipeline activity. Then query it for failed jobs.

**SQL Statement:**
```sql
CREATE OR REPLACE VIEW vw_recent_activity AS
SELECT 
    u.name AS user_name,
    c.title AS content_title,
    c.language AS source_language,
    rj.target_platform,
    rj.target_language,
    rj.status AS job_status,
    rj.created_at AS job_date,
    go.format_type,
    go.is_edited
FROM users u
INNER JOIN contents c ON u.user_id = c.user_id
INNER JOIN repurpose_jobs rj ON c.content_id = rj.content_id
LEFT JOIN generated_outputs go ON rj.job_id = go.job_id
ORDER BY rj.created_at DESC;

SELECT * FROM vw_recent_activity WHERE job_status = 'failed';
```

**Output:**

| user_name | content_title | source_language | target_platform | job_status | job_date |
|-----------|---------------|-----------------|-----------------|------------|----------|
| Siddharth Rao | Product-Led Growth | English | instagram | failed | 2025-12-19 |
| Rahul Verma | Guide du Cloud Computing | French | email | failed | 2025-12-03 |
| Priya Patel | ML Algorithm Overview | English | instagram | failed | 2025-11-12 |

---

### 3.7 Complex Queries Based on Triggers

**Question 1:** Create a trigger that automatically updates the `updated_at` timestamp whenever a user's profile is modified.

**SQL Statement:**
```sql
DELIMITER //
CREATE TRIGGER trg_user_updated
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END //
DELIMITER ;

-- Test:
UPDATE users SET name = 'Nikhil S.' WHERE user_id = 'u001';
SELECT user_id, name, updated_at FROM users WHERE user_id = 'u001';
```

**Output:**

| user_id | name | updated_at |
|---------|------|------------|
| u001 | Nikhil S. | 2026-03-19 18:00:00 |

Trigger successfully auto-updated the `updated_at` timestamp.

---

**Question 2:** Create an audit log trigger that records every job status change into the `job_audit_log` table, then update a job's status and verify the log.

**SQL Statement:**
```sql
DELIMITER //
CREATE TRIGGER trg_job_status_change
AFTER UPDATE ON repurpose_jobs
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO job_audit_log (job_id, old_status, new_status, changed_at)
        VALUES (NEW.job_id, OLD.status, NEW.status, NOW());
    END IF;
END //
DELIMITER ;

-- Test:
UPDATE repurpose_jobs SET status = 'completed' WHERE job_id = 'j009';
SELECT * FROM job_audit_log;
```

**Output:**

| log_id | job_id | old_status | new_status | changed_at |
|--------|--------|------------|------------|------------|
| 1 | j009 | pending | completed | 2026-03-19 18:01:00 |

---

**Question 3:** Create a trigger that prevents deletion of users who still have existing content, raising a custom error message.

**SQL Statement:**
```sql
DELIMITER //
CREATE TRIGGER trg_prevent_user_delete
BEFORE DELETE ON users
FOR EACH ROW
BEGIN
    DECLARE v_content_count INT;
    SELECT COUNT(*) INTO v_content_count 
    FROM contents WHERE user_id = OLD.user_id;
    IF v_content_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete user with existing content. Delete content first.';
    END IF;
END //
DELIMITER ;

-- Test:
DELETE FROM users WHERE user_id = 'u001';
```

**Output:** Error 1644 (45000): Cannot delete user with existing content. Delete content first.

---

### 3.8 Complex Queries Based on Cursors

**Question 1:** Create a cursor-based stored procedure that iterates through all users and generates a summary report with content counts, job statistics, and success rates.

**SQL Statement:**
```sql
DELIMITER //
CREATE PROCEDURE sp_platform_summary_report()
BEGIN
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_user_id CHAR(36);
    DECLARE v_name VARCHAR(100);
    DECLARE v_email VARCHAR(255);

    DECLARE user_cursor CURSOR FOR
        SELECT user_id, name, email FROM users;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        DROP TEMPORARY TABLE IF EXISTS tmp_user_report;
        SELECT 'Error occurred during report generation.' AS error_message;
    END;

    DROP TEMPORARY TABLE IF EXISTS tmp_user_report;
    CREATE TEMPORARY TABLE tmp_user_report (
        user_name VARCHAR(100), user_email VARCHAR(255),
        total_contents INT DEFAULT 0, total_jobs INT DEFAULT 0,
        completed_jobs INT DEFAULT 0, failed_jobs INT DEFAULT 0,
        total_outputs INT DEFAULT 0, success_rate DECIMAL(5,2) DEFAULT 0.00
    );

    START TRANSACTION;
    OPEN user_cursor;
    read_loop: LOOP
        FETCH user_cursor INTO v_user_id, v_name, v_email;
        IF v_done THEN LEAVE read_loop; END IF;
        INSERT INTO tmp_user_report
        SELECT v_name, v_email, COUNT(DISTINCT c.content_id), COUNT(DISTINCT rj.job_id),
            COALESCE(SUM(CASE WHEN rj.status='completed' THEN 1 ELSE 0 END),0),
            COALESCE(SUM(CASE WHEN rj.status='failed' THEN 1 ELSE 0 END),0),
            COUNT(DISTINCT go.output_id),
            CASE WHEN COUNT(DISTINCT rj.job_id)>0 THEN ROUND(SUM(CASE WHEN rj.status='completed' THEN 1 ELSE 0 END)/COUNT(DISTINCT rj.job_id)*100,2) ELSE 0.00 END
        FROM contents c
        LEFT JOIN repurpose_jobs rj ON c.content_id = rj.content_id
        LEFT JOIN generated_outputs go ON rj.job_id = go.job_id
        WHERE c.user_id = v_user_id;
    END LOOP;
    CLOSE user_cursor;
    COMMIT;

    SELECT * FROM tmp_user_report ORDER BY total_contents DESC;
    DROP TEMPORARY TABLE IF EXISTS tmp_user_report;
END //
DELIMITER ;

CALL sp_platform_summary_report();
```

**Output:**

| user_name | user_email | total_contents | total_jobs | completed_jobs | failed_jobs | total_outputs | success_rate |
|-----------|-----------|----------------|------------|----------------|-------------|---------------|-------------|
| Nikhil Sharma | nikhil@example.com | 2 | 3 | 3 | 0 | 5 | 100.00 |
| Priya Patel | priya@example.com | 2 | 2 | 1 | 1 | 2 | 50.00 |
| Arjun Reddy | arjun@example.com | 2 | 3 | 2 | 0 | 3 | 66.67 |
| Rahul Verma | rahul@example.com | 2 | 2 | 1 | 1 | 2 | 50.00 |

---

**Question 2:** Create a cursor-based procedure that finds stale pending jobs (older than a specified number of hours) and marks them as failed.

**SQL Statement:**
```sql
DELIMITER //
CREATE PROCEDURE sp_mark_stale_jobs(IN p_hours_threshold INT)
BEGIN
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_job_id CHAR(36);
    DECLARE v_updated_count INT DEFAULT 0;

    DECLARE stale_cursor CURSOR FOR
        SELECT job_id FROM repurpose_jobs
        WHERE status = 'pending'
        AND created_at < DATE_SUB(NOW(), INTERVAL p_hours_threshold HOUR);
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error: Failed to mark stale jobs. Rolled back.' AS error_message;
    END;

    START TRANSACTION;
    OPEN stale_cursor;
    update_loop: LOOP
        FETCH stale_cursor INTO v_job_id;
        IF v_done THEN LEAVE update_loop; END IF;
        UPDATE repurpose_jobs SET status = 'failed' WHERE job_id = v_job_id;
        SET v_updated_count = v_updated_count + 1;
    END LOOP;
    CLOSE stale_cursor;
    COMMIT;

    SELECT CONCAT('Marked ', v_updated_count, ' stale pending jobs as failed (older than ', p_hours_threshold, ' hours)') AS result;
END //
DELIMITER ;

CALL sp_mark_stale_jobs(24);
```

**Output:**

| result |
|--------|
| Marked 2 stale pending jobs as failed (older than 24 hours) |

---

**Question 3:** Create a cursor-based procedure that generates a per-platform output count report by iterating through all distinct platforms and counting their outputs.

**SQL Statement:**
```sql
DELIMITER //
CREATE PROCEDURE sp_platform_output_report()
BEGIN
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_platform VARCHAR(50);
    DECLARE platform_cursor CURSOR FOR
        SELECT DISTINCT target_platform FROM repurpose_jobs;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    DROP TEMPORARY TABLE IF EXISTS tmp_platform_report;
    CREATE TEMPORARY TABLE tmp_platform_report (
        platform VARCHAR(50),
        total_jobs INT DEFAULT 0,
        total_outputs INT DEFAULT 0,
        avg_outputs_per_job DECIMAL(5,2) DEFAULT 0.00
    );

    OPEN platform_cursor;
    read_loop: LOOP
        FETCH platform_cursor INTO v_platform;
        IF v_done THEN LEAVE read_loop; END IF;
        INSERT INTO tmp_platform_report
        SELECT v_platform, COUNT(DISTINCT rj.job_id), COUNT(DISTINCT go.output_id),
            CASE WHEN COUNT(DISTINCT rj.job_id) > 0
                THEN ROUND(COUNT(DISTINCT go.output_id) / COUNT(DISTINCT rj.job_id), 2)
                ELSE 0.00 END
        FROM repurpose_jobs rj
        LEFT JOIN generated_outputs go ON rj.job_id = go.job_id
        WHERE rj.target_platform = v_platform;
    END LOOP;
    CLOSE platform_cursor;

    SELECT * FROM tmp_platform_report ORDER BY total_outputs DESC;
    DROP TEMPORARY TABLE IF EXISTS tmp_platform_report;
END //
DELIMITER ;

CALL sp_platform_output_report();
```

**Output:**

| platform | total_jobs | total_outputs | avg_outputs_per_job |
|----------|------------|---------------|---------------------|
| linkedin | 6 | 6 | 1.00 |
| twitter | 5 | 5 | 1.00 |
| email | 3 | 2 | 0.67 |
| youtube_script | 2 | 2 | 1.00 |
| instagram | 3 | 1 | 0.33 |
| youtube_shorts | 1 | 1 | 1.00 |

---
