# Chapter 3: Functions, Triggers, Cursors & Exception Handling

## Project: AI Content Repurposer
## Database: MySQL (content_repurposer)

---

## 3.1 Introduction

This chapter demonstrates the implementation of stored functions, stored procedures, triggers, cursors, and exception handling in MySQL. These PL/SQL-equivalent features enable server-side business logic, automated data processing, and robust error handling within the AI Content Repurposer database.

---

## 3.2 Stored Functions

A stored function is a reusable routine that takes parameters, performs a computation, and **returns a single value**. Functions can be used directly in SQL statements.

### 3.2.1 User Success Rate Function

```sql
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
```

**Explanation:**
- **DECLARE:** Defines local variables with types and defaults
- **SELECT INTO:** Stores query results into variables
- **IF/THEN:** Prevents division by zero
- **RETURN:** Sends back the computed value
- **Usage:** `SELECT name, fn_user_success_rate(user_id) AS rate FROM users;`

### 3.2.2 Content Count Function

```sql
DELIMITER //
CREATE FUNCTION fn_user_content_count(p_user_id CHAR(36))
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE v_count INT DEFAULT 0;
    SELECT COUNT(*) INTO v_count FROM contents WHERE user_id = p_user_id;
    RETURN v_count;
END //
DELIMITER ;
```

**Explanation:** A simpler function that returns the number of contents created by a specific user. `DETERMINISTIC` means the same input always produces the same output.

---

## 3.3 Stored Procedures

Unlike functions, stored procedures can return **multiple result sets**, modify data, and use `OUT` parameters. They are called with `CALL`.

### 3.3.1 User Report Procedure

```sql
DELIMITER //
CREATE PROCEDURE sp_user_report(IN p_user_id CHAR(36))
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SELECT 'Error: User not found or database error' AS error_message;
    END;

    -- Result Set 1: User info
    SELECT user_id, name, email, created_at FROM users WHERE user_id = p_user_id;

    -- Result Set 2: Content summary
    SELECT COUNT(*) AS total_contents, MIN(created_at) AS first, MAX(created_at) AS last
    FROM contents WHERE user_id = p_user_id;

    -- Result Set 3: Platform breakdown
    SELECT rj.target_platform, COUNT(*) AS total_jobs,
           SUM(CASE WHEN rj.status = 'completed' THEN 1 ELSE 0 END) AS completed
    FROM repurpose_jobs rj INNER JOIN contents c ON rj.content_id = c.content_id
    WHERE c.user_id = p_user_id GROUP BY rj.target_platform;
END //
DELIMITER ;
```

**Explanation:**
- **IN parameter:** Input-only parameter (user ID)
- **EXIT HANDLER:** If any SQL error occurs, catch it and return a friendly message
- **Multiple result sets:** Returns user info, content summary, and platform breakdown in one call
- **Usage:** `CALL sp_user_report('uuid-here');`

### 3.3.2 Cleanup Failed Jobs Procedure (with Transaction)

```sql
DELIMITER //
CREATE PROCEDURE sp_cleanup_failed_jobs(IN p_days_old INT)
BEGIN
    DECLARE v_deleted_count INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error: Failed to cleanup. Rolled back.' AS error_message;
    END;

    START TRANSACTION;

    SELECT COUNT(*) INTO v_deleted_count
    FROM repurpose_jobs WHERE status = 'failed'
    AND created_at < DATE_SUB(NOW(), INTERVAL p_days_old DAY);

    DELETE FROM repurpose_jobs WHERE status = 'failed'
    AND created_at < DATE_SUB(NOW(), INTERVAL p_days_old DAY);

    COMMIT;

    SELECT CONCAT('Deleted ', v_deleted_count, ' failed jobs older than ', p_days_old, ' days') AS result;
END //
DELIMITER ;
```

**Explanation:**
- **START TRANSACTION / COMMIT:** Groups operations into an atomic unit
- **ROLLBACK in exception handler:** If anything fails, all changes are undone
- **DATE_SUB:** Calculates the cutoff date dynamically

### Functions vs Procedures

| Feature | Function | Procedure |
|---------|----------|-----------|
| Return | Single value | Multiple result sets |
| Usage | In SELECT statements | With CALL keyword |
| DML Operations | Read-only recommended | Can INSERT/UPDATE/DELETE |
| Transaction | Cannot control | Can use transactions |

---

## 3.4 Triggers

Triggers are special routines that execute automatically **before** or **after** a specific DML event (INSERT, UPDATE, DELETE).

### 3.4.1 Auto-Update Timestamp Trigger

```sql
DELIMITER //
CREATE TRIGGER trg_user_updated
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END //
DELIMITER ;
```

**Explanation:**
- **BEFORE UPDATE:** Fires before the update is written to disk
- **NEW.updated_at:** References the new value being written
- **Purpose:** Automatically sets the `updated_at` timestamp whenever any user field changes

### 3.4.2 Audit Log Trigger

```sql
-- Audit trail table
CREATE TABLE IF NOT EXISTS job_audit_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    job_id CHAR(36) NOT NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    changed_at DATETIME DEFAULT NOW()
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
```

**Explanation:**
- **AFTER UPDATE:** Fires after the update completes
- **OLD vs NEW:** `OLD.status` is the value before update, `NEW.status` is value after
- **Purpose:** Tracks every job status transition for auditing (e.g., pending → processing → completed)

### 3.4.3 Prevent User Deletion Trigger

```sql
DELIMITER //
CREATE TRIGGER trg_prevent_user_delete
BEFORE DELETE ON users
FOR EACH ROW
BEGIN
    DECLARE v_content_count INT;
    SELECT COUNT(*) INTO v_content_count FROM contents WHERE user_id = OLD.user_id;

    IF v_content_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete user with existing content.';
    END IF;
END //
DELIMITER ;
```

**Explanation:**
- **SIGNAL SQLSTATE '45000':** Raises a custom error that aborts the DELETE
- **Purpose:** Business rule enforcement — users must delete their content before account deletion

### 3.4.4 Auto-Set Completion Timestamp

```sql
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
```

**Purpose:** Automatically records when a job reaches 'completed' status without requiring the application code to set it.

---

## 3.5 Cursors

A cursor allows **row-by-row processing** of query results within a stored procedure. Unlike set-based SQL operations, cursors process one record at a time.

### 3.5.1 User Report Cursor Procedure

```sql
DELIMITER //
CREATE PROCEDURE sp_platform_summary_report()
BEGIN
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_user_id CHAR(36);
    DECLARE v_name VARCHAR(100);
    DECLARE v_email VARCHAR(255);

    -- Cursor declaration
    DECLARE user_cursor CURSOR FOR
        SELECT user_id, name, email FROM users;

    -- Exception handlers
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        DROP TEMPORARY TABLE IF EXISTS tmp_user_report;
        SELECT 'Error during report generation' AS error_message;
    END;

    -- Temporary table for results
    CREATE TEMPORARY TABLE tmp_user_report (
        user_name VARCHAR(100), user_email VARCHAR(255),
        total_contents INT, total_jobs INT,
        completed_jobs INT, total_outputs INT
    );

    START TRANSACTION;
    OPEN user_cursor;

    read_loop: LOOP
        FETCH user_cursor INTO v_user_id, v_name, v_email;
        IF v_done THEN LEAVE read_loop; END IF;

        INSERT INTO tmp_user_report
        SELECT v_name, v_email,
               COUNT(DISTINCT c.content_id), COUNT(DISTINCT rj.job_id),
               SUM(CASE WHEN rj.status = 'completed' THEN 1 ELSE 0 END),
               COUNT(DISTINCT go.output_id)
        FROM contents c
        LEFT JOIN repurpose_jobs rj ON c.content_id = rj.content_id
        LEFT JOIN generated_outputs go ON rj.job_id = go.job_id
        WHERE c.user_id = v_user_id;
    END LOOP;

    CLOSE user_cursor;
    COMMIT;
    SELECT * FROM tmp_user_report;
    DROP TEMPORARY TABLE IF EXISTS tmp_user_report;
END //
DELIMITER ;
```

**Explanation of Cursor Lifecycle:**

1. **DECLARE CURSOR:** Defines the query whose results will be iterated
2. **OPEN:** Executes the query and prepares the result set
3. **FETCH:** Retrieves the next row into variables
4. **LOOP/LEAVE:** Continues until all rows are processed (`NOT FOUND` handler sets `v_done = TRUE`)
5. **CLOSE:** Releases the cursor resources

---

## 3.6 Exception Handling

MySQL exception handling uses `DECLARE HANDLER` syntax within stored programs.

### Types of Handlers

| Handler Type | Behavior |
|---|---|
| **CONTINUE HANDLER** | Handles the condition and resumes execution at the next statement |
| **EXIT HANDLER** | Handles the condition and terminates the current `BEGIN...END` block |

### Common Conditions

| Condition | Description |
|---|---|
| `NOT FOUND` | No more rows to fetch (cursor end) |
| `SQLEXCEPTION` | Any SQL error |
| `SQLWARNING` | Any SQL warning |
| `SQLSTATE '45000'` | Custom user-defined error |

### Exception Handling Pattern Used in This Project

```sql
-- Pattern: Transaction with rollback on error
DECLARE EXIT HANDLER FOR SQLEXCEPTION
BEGIN
    ROLLBACK;                    -- Undo all changes
    SELECT 'Error occurred' AS error_message;  -- Return error info
END;

START TRANSACTION;
-- ... operations ...
COMMIT;

-- Pattern: Cursor end detection
DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
```

**Purpose in our project:** Every stored procedure that modifies data uses transactional exception handling to ensure data consistency. If any operation fails, the entire transaction is rolled back to its original state.

---

## 3.7 Conclusion

This chapter demonstrated the implementation of:
- **Stored Functions:** Reusable calculations (success rate, content count) callable from SQL queries
- **Stored Procedures:** Complex business logic with multiple result sets and data modification
- **Triggers:** Automatic enforcement of business rules (audit logging, timestamp updates, deletion prevention)
- **Cursors:** Row-by-row processing for generating comprehensive reports
- **Exception Handling:** CONTINUE and EXIT handlers with transactional rollback for data safety

All features were integrated into the AI Content Repurposer project's MySQL database, demonstrating practical application of PL/SQL concepts.
