-- ============================================================================
-- WEEK 6: Functions, Triggers, Cursors & Exception Handling
-- Project: AI Content Repurposer
-- Database: content_repurposer (MySQL)
-- ============================================================================

-- ============================================================================
-- PART A: STORED FUNCTIONS
-- ============================================================================

-- ----------------------------------------
-- Function 1: Get user's job success rate (returns percentage)
-- ----------------------------------------
DELIMITER //
CREATE FUNCTION fn_user_success_rate(p_user_id CHAR(36))
RETURNS DECIMAL(5,2)
DETERMINISTIC
BEGIN
    DECLARE v_total_jobs INT DEFAULT 0;
    DECLARE v_completed_jobs INT DEFAULT 0;
    DECLARE v_success_rate DECIMAL(5,2) DEFAULT 0.00;

    SELECT COUNT(*), 
           SUM(CASE WHEN rj.status = 'completed' THEN 1 ELSE 0 END)
    INTO v_total_jobs, v_completed_jobs
    FROM repurpose_jobs rj
    INNER JOIN contents c ON rj.content_id = c.content_id
    WHERE c.user_id = p_user_id;

    IF v_total_jobs > 0 THEN
        SET v_success_rate = (v_completed_jobs / v_total_jobs) * 100;
    END IF;

    RETURN v_success_rate;
END //
DELIMITER ;

-- Usage:
-- SELECT name, email, fn_user_success_rate(user_id) AS success_rate FROM users;

-- ----------------------------------------
-- Function 2: Get total content count for a user
-- ----------------------------------------
DELIMITER //
CREATE FUNCTION fn_user_content_count(p_user_id CHAR(36))
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE v_count INT DEFAULT 0;

    SELECT COUNT(*) INTO v_count
    FROM contents
    WHERE user_id = p_user_id;

    RETURN v_count;
END //
DELIMITER ;

-- Usage:
-- SELECT name, fn_user_content_count(user_id) AS content_count FROM users;


-- ============================================================================
-- PART B: STORED PROCEDURES
-- ============================================================================

-- ----------------------------------------
-- Procedure 1: Generate a user activity report
-- ----------------------------------------
DELIMITER //
CREATE PROCEDURE sp_user_report(IN p_user_id CHAR(36))
BEGIN
    -- Declare variables for exception handling
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SELECT 'Error: User not found or database error occurred' AS error_message;
    END;

    -- Result Set 1: User Information
    SELECT user_id, name, email, created_at AS member_since
    FROM users 
    WHERE user_id = p_user_id;

    -- Result Set 2: Content Summary
    SELECT 
        COUNT(*) AS total_contents,
        MIN(created_at) AS first_content_date,
        MAX(created_at) AS last_content_date
    FROM contents 
    WHERE user_id = p_user_id;

    -- Result Set 3: Platform-wise Job Breakdown
    SELECT 
        rj.target_platform,
        COUNT(*) AS total_jobs,
        SUM(CASE WHEN rj.status = 'completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN rj.status = 'failed' THEN 1 ELSE 0 END) AS failed
    FROM repurpose_jobs rj
    INNER JOIN contents c ON rj.content_id = c.content_id
    WHERE c.user_id = p_user_id
    GROUP BY rj.target_platform;

    -- Result Set 4: Recent Outputs
    SELECT 
        go.format_type,
        LEFT(go.output_text, 80) AS output_preview,
        go.is_edited,
        go.created_at
    FROM generated_outputs go
    INNER JOIN repurpose_jobs rj ON go.job_id = rj.job_id
    INNER JOIN contents c ON rj.content_id = c.content_id
    WHERE c.user_id = p_user_id
    ORDER BY go.created_at DESC
    LIMIT 5;
END //
DELIMITER ;

-- Usage:
-- CALL sp_user_report('paste-a-user-uuid-here');

-- ----------------------------------------
-- Procedure 2: Cleanup old failed jobs (with exception handling)
-- ----------------------------------------
DELIMITER //
CREATE PROCEDURE sp_cleanup_failed_jobs(IN p_days_old INT)
BEGIN
    DECLARE v_deleted_count INT DEFAULT 0;

    -- Exception handling
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error: Failed to cleanup jobs. Transaction rolled back.' AS error_message;
    END;

    START TRANSACTION;

    -- Count records to be deleted
    SELECT COUNT(*) INTO v_deleted_count
    FROM repurpose_jobs
    WHERE status = 'failed'
    AND created_at < DATE_SUB(NOW(), INTERVAL p_days_old DAY);

    -- Delete failed jobs older than specified days
    DELETE FROM repurpose_jobs
    WHERE status = 'failed'
    AND created_at < DATE_SUB(NOW(), INTERVAL p_days_old DAY);

    COMMIT;

    SELECT CONCAT('Successfully deleted ', v_deleted_count, ' failed jobs older than ', p_days_old, ' days') AS result;
END //
DELIMITER ;

-- Usage:
-- CALL sp_cleanup_failed_jobs(30);  -- Delete failed jobs older than 30 days


-- ============================================================================
-- PART C: TRIGGERS
-- ============================================================================

-- ----------------------------------------
-- Trigger 1: Auto-update updated_at timestamp on user modification
-- ----------------------------------------
DELIMITER //
CREATE TRIGGER trg_user_updated
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END //
DELIMITER ;

-- ----------------------------------------
-- Trigger 2: Audit log for job status changes
-- ----------------------------------------

-- First, create the audit log table
CREATE TABLE IF NOT EXISTS job_audit_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    job_id CHAR(36) NOT NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    changed_at DATETIME DEFAULT NOW(),
    INDEX idx_job_audit_job_id (job_id)
);

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

-- ----------------------------------------
-- Trigger 3: Prevent deletion of users with existing content
-- ----------------------------------------
DELIMITER //
CREATE TRIGGER trg_prevent_user_delete
BEFORE DELETE ON users
FOR EACH ROW
BEGIN
    DECLARE v_content_count INT;

    SELECT COUNT(*) INTO v_content_count 
    FROM contents 
    WHERE user_id = OLD.user_id;

    IF v_content_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete user with existing content. Delete content first.';
    END IF;
END //
DELIMITER ;

-- ----------------------------------------
-- Trigger 4: Auto-set completed_at when job status changes to 'completed'
-- ----------------------------------------
DELIMITER //
CREATE TRIGGER trg_job_completed_timestamp
BEFORE UPDATE ON repurpose_jobs
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        SET NEW.completed_at = NOW();
    END IF;
END //
DELIMITER ;


-- ============================================================================
-- PART D: CURSORS WITH EXCEPTION HANDLING
-- ============================================================================

-- ----------------------------------------
-- Cursor Procedure: Generate platform summary report for all users
-- ----------------------------------------
DELIMITER //
CREATE PROCEDURE sp_platform_summary_report()
BEGIN
    -- Variable declarations
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_user_id CHAR(36);
    DECLARE v_name VARCHAR(100);
    DECLARE v_email VARCHAR(255);

    -- Cursor declaration: iterate over all users
    DECLARE user_cursor CURSOR FOR
        SELECT user_id, name, email FROM users;

    -- Handler: when no more rows to fetch
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    -- Handler: for any SQL exception
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        DROP TEMPORARY TABLE IF EXISTS tmp_user_report;
        SELECT 'Error occurred during report generation. Transaction rolled back.' AS error_message;
    END;

    -- Create temporary table for results
    DROP TEMPORARY TABLE IF EXISTS tmp_user_report;
    CREATE TEMPORARY TABLE tmp_user_report (
        user_name VARCHAR(100),
        user_email VARCHAR(255),
        total_contents INT DEFAULT 0,
        total_jobs INT DEFAULT 0,
        completed_jobs INT DEFAULT 0,
        failed_jobs INT DEFAULT 0,
        total_outputs INT DEFAULT 0,
        success_rate DECIMAL(5,2) DEFAULT 0.00
    );

    START TRANSACTION;

    -- Open cursor
    OPEN user_cursor;

    -- Loop through each user
    read_loop: LOOP
        FETCH user_cursor INTO v_user_id, v_name, v_email;

        IF v_done THEN
            LEAVE read_loop;
        END IF;

        -- Insert aggregated data for this user
        INSERT INTO tmp_user_report (
            user_name, user_email, total_contents, total_jobs,
            completed_jobs, failed_jobs, total_outputs, success_rate
        )
        SELECT 
            v_name,
            v_email,
            COUNT(DISTINCT c.content_id),
            COUNT(DISTINCT rj.job_id),
            COALESCE(SUM(CASE WHEN rj.status = 'completed' THEN 1 ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN rj.status = 'failed' THEN 1 ELSE 0 END), 0),
            COUNT(DISTINCT go.output_id),
            CASE 
                WHEN COUNT(DISTINCT rj.job_id) > 0 
                THEN ROUND(
                    SUM(CASE WHEN rj.status = 'completed' THEN 1 ELSE 0 END) 
                    / COUNT(DISTINCT rj.job_id) * 100, 2
                )
                ELSE 0.00
            END
        FROM contents c
        LEFT JOIN repurpose_jobs rj ON c.content_id = rj.content_id
        LEFT JOIN generated_outputs go ON rj.job_id = go.job_id
        WHERE c.user_id = v_user_id;
    END LOOP;

    -- Close cursor
    CLOSE user_cursor;

    COMMIT;

    -- Return final report
    SELECT * FROM tmp_user_report ORDER BY total_contents DESC;

    -- Cleanup
    DROP TEMPORARY TABLE IF EXISTS tmp_user_report;
END //
DELIMITER ;

-- Usage:
-- CALL sp_platform_summary_report();


-- ----------------------------------------
-- Cursor Procedure 2: Mark stale pending jobs as failed
-- ----------------------------------------
DELIMITER //
CREATE PROCEDURE sp_mark_stale_jobs(IN p_hours_threshold INT)
BEGIN
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_job_id CHAR(36);
    DECLARE v_created_at DATETIME;
    DECLARE v_updated_count INT DEFAULT 0;

    -- Cursor: find pending jobs older than threshold
    DECLARE stale_cursor CURSOR FOR
        SELECT job_id, created_at
        FROM repurpose_jobs
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
        FETCH stale_cursor INTO v_job_id, v_created_at;

        IF v_done THEN
            LEAVE update_loop;
        END IF;

        -- Update each stale job to 'failed'
        UPDATE repurpose_jobs
        SET status = 'failed'
        WHERE job_id = v_job_id;

        SET v_updated_count = v_updated_count + 1;
    END LOOP;

    CLOSE stale_cursor;

    COMMIT;

    SELECT CONCAT('Marked ', v_updated_count, ' stale pending jobs as failed (older than ', p_hours_threshold, ' hours)') AS result;
END //
DELIMITER ;

-- Usage:
-- CALL sp_mark_stale_jobs(24);  -- Mark pending jobs older than 24 hours as failed

-- ============================================================================
-- END OF WEEK 6
-- ============================================================================
