# AI Content Repurposer - DBMS Project Review Q&A Guide

This document contains expected questions and suggested answers for your DBMS Project Review 2. The questions are categorized by the specific database concepts you are required to demonstrate (Weeks 4-6).

---

## 📌 Section 1: Constraints & Aggregate Functions (Week 4)

**Q1: What are Constraints in a database, and which ones did you use in your project?**
**Answer:** Constraints are rules applied to columns to enforce data integrity and reliability. In my project, I used:
*   `PRIMARY KEY`: On UUID columns (e.g., `user_id`, `job_id`) to uniquely identify records.
*   `FOREIGN KEY`: To link tables (e.g., `user_id` in `contents` referencing the `users` table) with `ON DELETE CASCADE` to prevent orphaned records.
*   `UNIQUE`: On the `email` column in the `users` table so no two users can register with the same email.
*   `NOT NULL`: To ensure required fields like `name`, `original_text`, and `target_platform` cannot be left empty.
*   `CHECK`: To restrict values. For example, ensuring `status` in `repurpose_jobs` can only be 'pending', 'processing', 'completed', or 'failed'.

```sql
ALTER TABLE repurpose_jobs
ADD CONSTRAINT chk_job_status
CHECK (status IN ('pending', 'processing', 'completed', 'failed'));
```

**Q2: Explain how `ON DELETE CASCADE` works in your schema.**
**Answer:** Because our data flows in a pipeline (User -> Content -> Job -> Output), if a parent record is deleted, all dependent child records should also be deleted. For example, if a user deletes their account, the `ON DELETE CASCADE` constraint automatically deletes their source content, which then cascades to delete the associated jobs, which finally cascades to delete the generated social media posts.

```sql
FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
```

**Q3: What is the difference between the `WHERE` clause and the `HAVING` clause? Can you show where you used it?**
**Answer:** The `WHERE` clause filters rows *before* any grouping or aggregation happens. The `HAVING` clause filters the result set *after* the `GROUP BY` aggregation has been applied. 
In my project, I wrote a query to find users who have submitted more than one piece of content. I grouped by `user_id` and used `HAVING COUNT(content_id) >= 2`. I couldn't use `WHERE` because the count is an aggregated value.

```sql
SELECT u.name AS user_name, u.email, COUNT(c.content_id) AS total_contents
FROM users u
INNER JOIN contents c ON u.user_id = c.user_id
GROUP BY u.user_id, u.name, u.email
HAVING COUNT(c.content_id) >= 2;
```

---

## 📌 Section 2: Set Operations (Week 4)

**Q4: Can you explain the difference between `UNION` and `UNION ALL`?**
**Answer:** Both are used to combine the result sets of two or more `SELECT` statements. 
*   `UNION` removes any duplicate rows from the combined result.
*   `UNION ALL` keeps all rows, including duplicates. It is generally faster because it doesn't spend resources sorting and deduplicating.
I used `UNION ALL` to create an "Activity Feed" that chronological lists both when a user created content and when they started a new job. 

```sql
SELECT c.user_id, 'content_created' AS activity_type, c.title AS detail, c.created_at
FROM contents c
UNION ALL
SELECT rj.content_id, 'job_started' AS activity_type, rj.target_platform AS detail, rj.created_at
FROM repurpose_jobs rj
INNER JOIN contents c ON rj.content_id = c.content_id
ORDER BY created_at DESC;
```

**Q5: MySQL doesn't natively support `EXCEPT` or `INTERSECT`. How did you simulate `EXCEPT`?**
**Answer:** To find records in Query A that do not exist in Query B (which is what `EXCEPT` does), I used the `NOT IN` clause combined with a subquery, or alternatively a `LEFT JOIN` where the right side `IS NULL`. I used this to find "Users who have created content but have *never* had a successfully completed job."

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

---

## 📌 Section 3: Subqueries & Joins (Week 5)

**Q6: What is a Subquery? Did you use a correlated subquery?**
**Answer:** A subquery is a query nested inside another query. A standard subquery executes once and passes its results to the outer query. 
A **correlated subquery**, however, depends on values from the outer query, meaning it has to execute once for *every single row* returned by the outer query. I used a correlated subquery in my `contents` query to fetch the *most recent* job status for each specific content piece by referencing the outer table's `content_id`.

```sql
SELECT c.title, c.created_at,
    (SELECT rj.status 
     FROM repurpose_jobs rj 
     WHERE rj.content_id = c.content_id 
     ORDER BY rj.created_at DESC 
     LIMIT 1) AS latest_job_status
FROM contents c;
```

**Q7: Explain the difference between `INNER JOIN` and `LEFT JOIN` in the context of your application.**
**Answer:** 
*   An `INNER JOIN` only returns rows where there is a match in both tables. I used this to show the full pipeline (User -> Content -> Job -> Output), returning only completed chains.
*   A `LEFT JOIN` returns *all* rows from the left table, and matching rows from the right table. If there is no match, it returns NULLs. I used a `LEFT JOIN` to generate an admin report showing *every registered user*, even if they haven't submitted any content or jobs yet.

```sql
-- INNER JOIN Pipeline Example
SELECT u.name, c.title, rj.target_platform, rj.status
FROM users u
INNER JOIN contents c ON u.user_id = c.user_id
INNER JOIN repurpose_jobs rj ON c.content_id = rj.content_id;

-- LEFT JOIN Admin Report Example
SELECT u.name, u.email, u.created_at AS registration_date, COUNT(c.content_id) as contents_count
FROM users u
LEFT JOIN contents c ON u.user_id = c.user_id
GROUP BY u.user_id, u.name, u.email, u.created_at;
```

---

## 📌 Section 4: Views (Week 5)

**Q8: What is a View, and why did you use one instead of just writing the query in your frontend/backend code?**
**Answer:** A View is a virtual table based on the result-set of a predefined SQL query. 
I created views like `vw_user_dashboard` to abstract complex logic. Instead of writing a massive 4-table join with multiple aggregate functions (to calculate job success rates) inside my application code, I saved it as a View in the database. When the backend needs the dashboard data, it just runs a simple `SELECT * FROM vw_user_dashboard`, making the application code cleaner, more secure, and easier to maintain.

```sql
CREATE OR REPLACE VIEW vw_user_dashboard AS
SELECT 
    u.user_id, u.name, u.email,
    COUNT(DISTINCT c.content_id) AS total_contents,
    COUNT(DISTINCT rj.job_id) AS total_jobs,
    SUM(CASE WHEN rj.status = 'completed' THEN 1 ELSE 0 END) AS completed_jobs
FROM users u
LEFT JOIN contents c ON u.user_id = c.user_id
LEFT JOIN repurpose_jobs rj ON c.content_id = rj.content_id
GROUP BY u.user_id, u.name, u.email;

SELECT * FROM vw_user_dashboard;
```

---

## 📌 Section 5: Triggers (Week 6)

**Q9: What is a Trigger, and give an example of one you implemented.**
**Answer:** A Trigger is a stored program that automatically executes (or "fires") in response to a specific database event (`INSERT`, `UPDATE`, or `DELETE`).
I implemented an **audit log trigger** (`trg_job_status_change`). It is an `AFTER UPDATE` trigger on the `repurpose_jobs` table. Whenever a job's status changes from 'pending' to 'completed', the trigger detects the change (`IF OLD.status != NEW.status`) and automatically inserts a record into the `job_audit_log` table, recording the exact timestamp and what the status changed to. 

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
```

**Q10: Can a trigger be used for validation?**
**Answer:** Yes. I implemented a `BEFORE DELETE` trigger on the `users` table. Instead of letting `ON DELETE CASCADE` blindly wipe out all a user's data, this trigger checks if the user currently has active content. If they do, the trigger uses `SIGNAL SQLSTATE` to throw a custom exception, blocking the deletion to prevent accidental data loss.

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
        SET MESSAGE_TEXT = 'Cannot delete user with existing content. Delete content first.';
    END IF;
END //
DELIMITER ;
```

---

## 📌 Section 6: Cursors & Exception Handling (Week 6)

**Q11: What is a Cursor used for in MySQL?**
**Answer:** By default, SQL operations run on entire sets of data at once. A Cursor allows a Stored Procedure to fetch and process rows one-by-one iteratively. 
I used a Cursor in my `sp_platform_output_report` procedure. It fetches each distinct platform from the database, runs complex calculations to figure out the average outputs generated per job for that specific platform, and inserts the calculated results into a temporary reporting table row-by-row.

```sql
DECLARE v_done INT DEFAULT FALSE;
DECLARE platform_cursor CURSOR FOR SELECT DISTINCT target_platform FROM repurpose_jobs;
DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

OPEN platform_cursor;
read_loop: LOOP
    FETCH platform_cursor INTO v_platform_name;
    IF v_done THEN
        LEAVE read_loop;
    END IF;
    -- Complex calculations & INSERT into temporary table happen here...
END LOOP;
CLOSE platform_cursor;
```

**Q12: How did you implement Exception Handling inside your stored procedures?**
**Answer:** While looping through a Cursor, errors can occur or the loop can run out of rows. 
I used a `DECLARE CONTINUE HANDLER FOR NOT FOUND` to gracefully exit the `WHILE` loop when the cursor reaches the end of the data. 
I also used a `DECLARE EXIT HANDLER FOR SQLEXCEPTION`. If a serious database error occurs during the script execution, this handler catches the error, forces a `ROLLBACK` of the transaction so no partial/corrupted data is saved, and drops any temporary tables to clean up memory.

```sql
DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

DECLARE EXIT HANDLER FOR SQLEXCEPTION
BEGIN
    ROLLBACK;
    DROP TEMPORARY TABLE IF EXISTS tmp_user_report;
    SELECT 'Error occurred algorithm execution. Transaction rolled back.' AS error_message;
END;
```

---

### 💡 Tips for the Presentation:
1.  **Keep the ER Diagram open:** Reviewers are visual. Pointing to the tables while explaining your JOINS or CASCADE limits confusion.
2.  **Speak about the "Business problem":** Don't just say "I used a Left Join." Say, "I needed to see all users, including inactive ones, so I used a Left Join."
3.  **Run queries live:** If the reviewer asks about a trigger, actually open MySQL, run an `UPDATE` on a job status, and then `SELECT * FROM job_audit_log` to prove it worked in real-time.
