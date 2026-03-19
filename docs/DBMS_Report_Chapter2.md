# CHAPTER 2

## Design of Relational Schemas, Creation of Database and Tables for AI Content Repurposer

---

### 2.1 Relational Schema for AI Content Repurposer

```
USER (user_id [PK], name, email [UNIQUE], password_hash, created_at, updated_at)
     │
     │ 1:M (user_id)
     ▼
CONTENT (content_id [PK], user_id [FK], original_text, source_url, language, title, created_at)
     │
     │ 1:M (content_id)
     ▼
REPURPOSE_JOB (job_id [PK], content_id [FK], target_platform, target_language, status, created_at, completed_at)
     │
     ├── 1:M (job_id)
     │        ▼
     │   GENERATED_OUTPUT (output_id [PK], job_id [FK], output_text, format_type, is_edited, created_at, updated_at)
     │
     └── 1:M (job_id)
              ▼
         JOB_AUDIT_LOG (log_id [PK], job_id [FK], old_status, new_status, changed_at)
```

**Figure 2.1: Relational Schema for AI Content Repurposer**

The figure 2.1 depicts the relational schema for the AI Content Repurposer. The schema follows a linear pipeline architecture: Users create Content, Content spawns Repurpose Jobs, and Jobs produce Generated Outputs. The Job Audit Log provides an auxiliary audit trail for job status transitions. All relationships are 1:M with cascade delete semantics, ensuring referential integrity is maintained throughout the content pipeline.

---

### 2.2 Description of Tables

**Table 2.1: users**
Purpose: Stores registered user profiles and authentication credentials.

| Column | Data Type | Size | Constraints | Description |
|--------|-----------|------|-------------|-------------|
| user_id | CHAR | 36 | PRIMARY KEY | UUID identifier |
| name | VARCHAR | 100 | NOT NULL, CHECK(CHAR_LENGTH > 0) | User's full name |
| email | VARCHAR | 255 | UNIQUE, NOT NULL | Email address |
| password_hash | VARCHAR | 255 | NOT NULL | Bcrypt hashed password |
| created_at | TIMESTAMP | - | DEFAULT CURRENT_TIMESTAMP | Registration date |
| updated_at | TIMESTAMP | - | NULL | Last update date |

**Table 2.2: contents**
Purpose: Stores original long-form content submitted for repurposing.

| Column | Data Type | Size | Constraints | Description |
|--------|-----------|------|-------------|-------------|
| content_id | CHAR | 36 | PRIMARY KEY | UUID identifier |
| user_id | CHAR | 36 | FK → users(user_id) ON DELETE CASCADE | Content owner |
| original_text | TEXT | - | NOT NULL | Raw content body |
| source_url | VARCHAR | 500 | NULL | Optional source URL |
| language | VARCHAR | 20 | NOT NULL, DEFAULT 'English', CHECK | Source language |
| title | VARCHAR | 255 | NULL | Content title |
| created_at | TIMESTAMP | - | DEFAULT CURRENT_TIMESTAMP | Creation date |

**Table 2.3: repurpose_jobs**
Purpose: Tracks each content transformation task through its lifecycle.

| Column | Data Type | Size | Constraints | Description |
|--------|-----------|------|-------------|-------------|
| job_id | CHAR | 36 | PRIMARY KEY | UUID identifier |
| content_id | CHAR | 36 | FK → contents(content_id) ON DELETE CASCADE | Source content |
| target_platform | VARCHAR | 50 | NOT NULL, CHECK | Target social platform |
| target_language | VARCHAR | 20 | NOT NULL, DEFAULT 'English' | Output language |
| status | VARCHAR | 20 | NOT NULL, DEFAULT 'pending', CHECK | Job status |
| created_at | TIMESTAMP | - | DEFAULT CURRENT_TIMESTAMP | Job creation date |
| completed_at | TIMESTAMP | - | NULL | Job completion date |

**Table 2.4: generated_outputs**
Purpose: Stores AI-generated platform-specific content outputs.

| Column | Data Type | Size | Constraints | Description |
|--------|-----------|------|-------------|-------------|
| output_id | CHAR | 36 | PRIMARY KEY | UUID identifier |
| job_id | CHAR | 36 | FK → repurpose_jobs(job_id) ON DELETE CASCADE | Parent job |
| output_text | TEXT | - | NOT NULL | Generated content |
| format_type | VARCHAR | 50 | NOT NULL | Output format |
| is_edited | BOOLEAN | - | NOT NULL, DEFAULT FALSE | Edit flag |
| created_at | TIMESTAMP | - | DEFAULT CURRENT_TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | - | NULL | Last edit date |

**Table 2.5: job_audit_log**
Purpose: Audit trail for job status transitions.

| Column | Data Type | Size | Constraints | Description |
|--------|-----------|------|-------------|-------------|
| log_id | INT | - | PRIMARY KEY, AUTO_INCREMENT | Log identifier |
| job_id | CHAR | 36 | NOT NULL, INDEX | Related job |
| old_status | VARCHAR | 20 | NULL | Previous status |
| new_status | VARCHAR | 20 | NULL | New status |
| changed_at | DATETIME | - | DEFAULT NOW() | Change timestamp |

---

### 2.3 Creation of Database and Tables – DDL Commands

```sql
CREATE DATABASE content_repurposer;
USE content_repurposer;

CREATE TABLE users (
    user_id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE contents (
    content_id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    original_text TEXT NOT NULL,
    source_url VARCHAR(500),
    language VARCHAR(20) NOT NULL DEFAULT 'English',
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE repurpose_jobs (
    job_id CHAR(36) PRIMARY KEY,
    content_id CHAR(36) NOT NULL,
    target_platform VARCHAR(50) NOT NULL,
    target_language VARCHAR(20) NOT NULL DEFAULT 'English',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (content_id) REFERENCES contents(content_id) ON DELETE CASCADE
);

CREATE TABLE generated_outputs (
    output_id CHAR(36) PRIMARY KEY,
    job_id CHAR(36) NOT NULL,
    output_text TEXT NOT NULL,
    format_type VARCHAR(50) NOT NULL,
    is_edited BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES repurpose_jobs(job_id) ON DELETE CASCADE
);

CREATE TABLE job_audit_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    job_id CHAR(36) NOT NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    changed_at DATETIME DEFAULT NOW(),
    INDEX idx_job_audit_job_id (job_id)
);
```

---

### 2.4 Insertion of Tuples into the Tables – DML Commands

#### Users Table (20 entries):

```sql
INSERT INTO users (user_id, name, email, password_hash, created_at) VALUES
('u001', 'Nikhil Sharma', 'nikhil@example.com', '$2b$12$abc1hashvalue', '2025-11-01 09:00:00'),
('u002', 'Priya Patel', 'priya@example.com', '$2b$12$abc2hashvalue', '2025-11-02 10:15:00'),
('u003', 'Arjun Reddy', 'arjun@example.com', '$2b$12$abc3hashvalue', '2025-11-05 11:30:00'),
('u004', 'Sneha Gupta', 'sneha@example.com', '$2b$12$abc4hashvalue', '2025-11-08 14:00:00'),
('u005', 'Rahul Verma', 'rahul@example.com', '$2b$12$abc5hashvalue', '2025-11-10 08:45:00'),
('u006', 'Ananya Singh', 'ananya@example.com', '$2b$12$abc6hashvalue', '2025-11-12 16:20:00'),
('u007', 'Vikram Joshi', 'vikram@example.com', '$2b$12$abc7hashvalue', '2025-11-15 12:00:00'),
('u008', 'Meera Nair', 'meera@example.com', '$2b$12$abc8hashvalue', '2025-11-18 09:30:00'),
('u009', 'Karan Malhotra', 'karan@example.com', '$2b$12$abc9hashvalue', '2025-11-20 13:45:00'),
('u010', 'Divya Iyer', 'divya@example.com', '$2b$12$ab10hashvalue', '2025-11-22 10:00:00'),
('u011', 'Amit Chauhan', 'amit@example.com', '$2b$12$ab11hashvalue', '2025-11-25 15:30:00'),
('u012', 'Roshni Das', 'roshni@example.com', '$2b$12$ab12hashvalue', '2025-12-01 08:00:00'),
('u013', 'Siddharth Rao', 'siddharth@example.com', '$2b$12$ab13hashvalue', '2025-12-03 11:15:00'),
('u014', 'Pooja Mehta', 'pooja@example.com', '$2b$12$ab14hashvalue', '2025-12-05 14:30:00'),
('u015', 'Rohit Kumar', 'rohit@example.com', '$2b$12$ab15hashvalue', '2025-12-08 09:00:00'),
('u016', 'Kavya Bhat', 'kavya@example.com', '$2b$12$ab16hashvalue', '2025-12-10 16:45:00'),
('u017', 'Aditya Saxena', 'aditya@example.com', '$2b$12$ab17hashvalue', '2025-12-12 12:30:00'),
('u018', 'Neha Tiwari', 'neha@example.com', '$2b$12$ab18hashvalue', '2025-12-15 10:00:00'),
('u019', 'Manish Dubey', 'manish@example.com', '$2b$12$ab19hashvalue', '2025-12-18 08:15:00'),
('u020', 'Shruti Kapoor', 'shruti@example.com', '$2b$12$ab20hashvalue', '2025-12-20 14:00:00');
```

**Users Table:**

| user_id | name | email | created_at |
|---------|------|-------|------------|
| u001 | Nikhil Sharma | nikhil@example.com | 2025-11-01 09:00:00 |
| u002 | Priya Patel | priya@example.com | 2025-11-02 10:15:00 |
| u003 | Arjun Reddy | arjun@example.com | 2025-11-05 11:30:00 |
| u004 | Sneha Gupta | sneha@example.com | 2025-11-08 14:00:00 |
| u005 | Rahul Verma | rahul@example.com | 2025-11-10 08:45:00 |
| u006 | Ananya Singh | ananya@example.com | 2025-11-12 16:20:00 |
| u007 | Vikram Joshi | vikram@example.com | 2025-11-15 12:00:00 |
| u008 | Meera Nair | meera@example.com | 2025-11-18 09:30:00 |
| u009 | Karan Malhotra | karan@example.com | 2025-11-20 13:45:00 |
| u010 | Divya Iyer | divya@example.com | 2025-11-22 10:00:00 |
| u011 | Amit Chauhan | amit@example.com | 2025-11-25 15:30:00 |
| u012 | Roshni Das | roshni@example.com | 2025-12-01 08:00:00 |
| u013 | Siddharth Rao | siddharth@example.com | 2025-12-03 11:15:00 |
| u014 | Pooja Mehta | pooja@example.com | 2025-12-05 14:30:00 |
| u015 | Rohit Kumar | rohit@example.com | 2025-12-08 09:00:00 |
| u016 | Kavya Bhat | kavya@example.com | 2025-12-10 16:45:00 |
| u017 | Aditya Saxena | aditya@example.com | 2025-12-12 12:30:00 |
| u018 | Neha Tiwari | neha@example.com | 2025-12-15 10:00:00 |
| u019 | Manish Dubey | manish@example.com | 2025-12-18 08:15:00 |
| u020 | Shruti Kapoor | shruti@example.com | 2025-12-20 14:00:00 |

---

#### Contents Table (20 entries):

```sql
INSERT INTO contents (content_id, user_id, original_text, source_url, language, title, created_at) VALUES
('c001', 'u001', 'Artificial Intelligence is transforming the way businesses operate by automating complex decision-making processes...', 'https://blog.example.com/ai-business', 'English', 'AI in Business Operations', '2025-11-10 09:30:00'),
('c002', 'u001', 'Cloud computing has revolutionized IT infrastructure, enabling organizations to scale dynamically...', 'https://blog.example.com/cloud-computing', 'English', 'Cloud Computing Guide', '2025-11-15 10:00:00'),
('c003', 'u002', 'Machine learning algorithms can be broadly categorized into supervised, unsupervised, and reinforcement learning...', NULL, 'English', 'ML Algorithm Overview', '2025-11-12 11:00:00'),
('c004', 'u002', 'La inteligencia artificial está transformando la manera en que las empresas operan...', NULL, 'Spanish', 'IA en Negocios', '2025-11-18 13:00:00'),
('c005', 'u003', 'The future of remote work is shaped by digital collaboration tools, asynchronous communication, and trust-based management...', 'https://medium.com/remote-work-future', 'English', 'Future of Remote Work', '2025-11-20 14:30:00'),
('c006', 'u003', 'Cybersecurity threats are evolving rapidly with the rise of AI-powered attacks and zero-day exploits...', NULL, 'English', 'Cybersecurity Trends 2026', '2025-11-25 09:00:00'),
('c007', 'u004', 'Sustainable technology practices are becoming essential for modern enterprises seeking to reduce their carbon footprint...', 'https://greenbiz.com/sustainable-tech', 'English', 'Green Tech Practices', '2025-11-28 10:30:00'),
('c008', 'u005', 'DevOps methodology bridges the gap between development and operations through continuous integration and delivery...', NULL, 'English', 'DevOps Best Practices', '2025-12-01 08:15:00'),
('c009', 'u005', 'Le cloud computing a révolutionné linfrastructure informatique...', NULL, 'French', 'Guide du Cloud Computing', '2025-12-03 12:00:00'),
('c010', 'u006', 'Data engineering pipelines form the backbone of modern analytics platforms, enabling real-time data processing...', 'https://datablog.io/pipelines', 'English', 'Data Engineering Pipelines', '2025-12-05 15:00:00'),
('c011', 'u007', 'Blockchain technology extends beyond cryptocurrency into supply chain management, healthcare records, and digital identity...', NULL, 'English', 'Blockchain Beyond Crypto', '2025-12-07 09:45:00'),
('c012', 'u008', 'User experience design principles focus on creating intuitive, accessible, and delightful digital interfaces...', 'https://uxdesign.cc/principles', 'English', 'UX Design Principles', '2025-12-09 11:30:00'),
('c013', 'u009', 'Edge computing brings computation closer to data sources, reducing latency and bandwidth consumption dramatically...', NULL, 'English', 'Edge Computing Explained', '2025-12-11 14:00:00'),
('c014', 'u010', 'Agile project management emphasizes iterative development, cross-functional teams, and continuous feedback loops...', 'https://agile.guide/overview', 'English', 'Agile Management Guide', '2025-12-13 10:15:00'),
('c015', 'u011', 'Natural Language Processing enables machines to understand, interpret, and generate human language at scale...', NULL, 'English', 'NLP Applications in 2026', '2025-12-15 13:00:00'),
('c016', 'u012', 'Kubernetes orchestration simplifies container management at scale offering automated scaling and self-healing...', 'https://k8s.io/intro', 'English', 'Kubernetes for Beginners', '2025-12-17 08:30:00'),
('c017', 'u013', 'Product-led growth strategies focus on using the product itself as the primary driver of customer acquisition...', NULL, 'English', 'Product-Led Growth', '2025-12-19 16:00:00'),
('c018', 'u014', 'GraphQL provides a flexible query language for APIs, allowing clients to request exactly the data they need...', 'https://graphql.org/learn', 'English', 'GraphQL vs REST', '2025-12-21 09:00:00'),
('c019', 'u015', 'KI im Geschäftsbetrieb verändert die Art wie Unternehmen komplexe Entscheidungen treffen...', NULL, 'German', 'KI im Geschäft', '2025-12-23 11:45:00'),
('c020', 'u016', 'Microservices architecture decomposes applications into small, independently deployable services for maximum flexibility...', NULL, 'English', 'Microservices Architecture', '2025-12-25 14:30:00');
```

**Contents Table:**

| content_id | user_id | language | title | created_at |
|------------|---------|----------|-------|------------|
| c001 | u001 | English | AI in Business Operations | 2025-11-10 09:30:00 |
| c002 | u001 | English | Cloud Computing Guide | 2025-11-15 10:00:00 |
| c003 | u002 | English | ML Algorithm Overview | 2025-11-12 11:00:00 |
| c004 | u002 | Spanish | IA en Negocios | 2025-11-18 13:00:00 |
| c005 | u003 | English | Future of Remote Work | 2025-11-20 14:30:00 |
| c006 | u003 | English | Cybersecurity Trends 2026 | 2025-11-25 09:00:00 |
| c007 | u004 | English | Green Tech Practices | 2025-11-28 10:30:00 |
| c008 | u005 | English | DevOps Best Practices | 2025-12-01 08:15:00 |
| c009 | u005 | French | Guide du Cloud Computing | 2025-12-03 12:00:00 |
| c010 | u006 | English | Data Engineering Pipelines | 2025-12-05 15:00:00 |
| c011 | u007 | English | Blockchain Beyond Crypto | 2025-12-07 09:45:00 |
| c012 | u008 | English | UX Design Principles | 2025-12-09 11:30:00 |
| c013 | u009 | English | Edge Computing Explained | 2025-12-11 14:00:00 |
| c014 | u010 | English | Agile Management Guide | 2025-12-13 10:15:00 |
| c015 | u011 | English | NLP Applications in 2026 | 2025-12-15 13:00:00 |
| c016 | u012 | English | Kubernetes for Beginners | 2025-12-17 08:30:00 |
| c017 | u013 | English | Product-Led Growth | 2025-12-19 16:00:00 |
| c018 | u014 | English | GraphQL vs REST | 2025-12-21 09:00:00 |
| c019 | u015 | German | KI im Geschäft | 2025-12-23 11:45:00 |
| c020 | u016 | English | Microservices Architecture | 2025-12-25 14:30:00 |

---

#### Repurpose Jobs Table (20 entries):

```sql
INSERT INTO repurpose_jobs (job_id, content_id, target_platform, target_language, status, created_at, completed_at) VALUES
('j001', 'c001', 'linkedin', 'English', 'completed', '2025-11-10 10:00:00', '2025-11-10 10:02:00'),
('j002', 'c001', 'twitter', 'English', 'completed', '2025-11-10 10:05:00', '2025-11-10 10:06:30'),
('j003', 'c002', 'email', 'English', 'completed', '2025-11-15 10:30:00', '2025-11-15 10:33:00'),
('j004', 'c003', 'linkedin', 'English', 'completed', '2025-11-12 11:30:00', '2025-11-12 11:32:00'),
('j005', 'c003', 'instagram', 'English', 'failed', '2025-11-12 11:45:00', NULL),
('j006', 'c004', 'twitter', 'Spanish', 'completed', '2025-11-18 13:30:00', '2025-11-18 13:31:30'),
('j007', 'c005', 'youtube_script', 'English', 'completed', '2025-11-20 15:00:00', '2025-11-20 15:05:00'),
('j008', 'c005', 'linkedin', 'English', 'completed', '2025-11-20 15:10:00', '2025-11-20 15:12:00'),
('j009', 'c006', 'twitter', 'English', 'pending', '2025-11-25 09:30:00', NULL),
('j010', 'c007', 'instagram', 'English', 'completed', '2025-11-28 11:00:00', '2025-11-28 11:02:00'),
('j011', 'c008', 'linkedin', 'English', 'completed', '2025-12-01 08:45:00', '2025-12-01 08:47:00'),
('j012', 'c009', 'email', 'French', 'failed', '2025-12-03 12:30:00', NULL),
('j013', 'c010', 'youtube_shorts', 'English', 'completed', '2025-12-05 15:30:00', '2025-12-05 15:32:00'),
('j014', 'c011', 'twitter', 'English', 'completed', '2025-12-07 10:15:00', '2025-12-07 10:16:30'),
('j015', 'c012', 'linkedin', 'English', 'pending', '2025-12-09 12:00:00', NULL),
('j016', 'c013', 'email', 'English', 'completed', '2025-12-11 14:30:00', '2025-12-11 14:33:00'),
('j017', 'c014', 'twitter', 'Hindi', 'completed', '2025-12-13 10:45:00', '2025-12-13 10:47:00'),
('j018', 'c015', 'youtube_script', 'English', 'processing', '2025-12-15 13:30:00', NULL),
('j019', 'c016', 'linkedin', 'English', 'completed', '2025-12-17 09:00:00', '2025-12-17 09:02:00'),
('j020', 'c017', 'instagram', 'English', 'failed', '2025-12-19 16:30:00', NULL);
```

**Repurpose Jobs Table:**

| job_id | content_id | target_platform | target_language | status | created_at |
|--------|------------|-----------------|-----------------|--------|------------|
| j001 | c001 | linkedin | English | completed | 2025-11-10 10:00:00 |
| j002 | c001 | twitter | English | completed | 2025-11-10 10:05:00 |
| j003 | c002 | email | English | completed | 2025-11-15 10:30:00 |
| j004 | c003 | linkedin | English | completed | 2025-11-12 11:30:00 |
| j005 | c003 | instagram | English | failed | 2025-11-12 11:45:00 |
| j006 | c004 | twitter | Spanish | completed | 2025-11-18 13:30:00 |
| j007 | c005 | youtube_script | English | completed | 2025-11-20 15:00:00 |
| j008 | c005 | linkedin | English | completed | 2025-11-20 15:10:00 |
| j009 | c006 | twitter | English | pending | 2025-11-25 09:30:00 |
| j010 | c007 | instagram | English | completed | 2025-11-28 11:00:00 |
| j011 | c008 | linkedin | English | completed | 2025-12-01 08:45:00 |
| j012 | c009 | email | French | failed | 2025-12-03 12:30:00 |
| j013 | c010 | youtube_shorts | English | completed | 2025-12-05 15:30:00 |
| j014 | c011 | twitter | English | completed | 2025-12-07 10:15:00 |
| j015 | c012 | linkedin | English | pending | 2025-12-09 12:00:00 |
| j016 | c013 | email | English | completed | 2025-12-11 14:30:00 |
| j017 | c014 | twitter | Hindi | completed | 2025-12-13 10:45:00 |
| j018 | c015 | youtube_script | English | processing | 2025-12-15 13:30:00 |
| j019 | c016 | linkedin | English | completed | 2025-12-17 09:00:00 |
| j020 | c017 | instagram | English | failed | 2025-12-19 16:30:00 |

---

#### Generated Outputs Table (20 entries):

```sql
INSERT INTO generated_outputs (output_id, job_id, output_text, format_type, is_edited, created_at) VALUES
('o001', 'j001', '🚀 AI is no longer a buzzword — it is the backbone of modern business operations. From predictive analytics to automated workflows, here is how enterprises are leveraging AI...', 'linkedin_post', FALSE, '2025-11-10 10:02:00'),
('o002', 'j002', '🤖 AI is transforming business! Predictive analytics, automated workflows, smarter decisions. The future is here. #AI #Business #Tech', 'tweet', FALSE, '2025-11-10 10:06:30'),
('o003', 'j003', 'Subject: Your Weekly Tech Brief — Cloud Computing Revolution\n\nDear Reader,\nCloud computing continues to reshape IT infrastructure...', 'email_newsletter', TRUE, '2025-11-15 10:33:00'),
('o004', 'j004', '📊 Understanding ML Algorithms: Supervised learning uses labeled data, unsupervised finds hidden patterns, and RL learns through trial and error...', 'linkedin_post', FALSE, '2025-11-12 11:32:00'),
('o005', 'j006', '🤖 La IA está transformando los negocios! Analítica predictiva, flujos automatizados y decisiones más inteligentes. #IA #Negocios', 'tweet', FALSE, '2025-11-18 13:31:30'),
('o006', 'j007', 'INTRO: Hey everyone! Today we are diving deep into the future of remote work. [PAUSE] Let me start with a question — how has your work setup changed in the last 3 years?...', 'youtube_script', TRUE, '2025-11-20 15:05:00'),
('o007', 'j008', '💻 Remote work is here to stay. But is your organization ready for the next wave? Three pillars define the future: async communication, digital collaboration, trust-based leadership...', 'linkedin_post', FALSE, '2025-11-20 15:12:00'),
('o008', 'j010', '🌿 Tech meets sustainability! Modern enterprises are reducing their carbon footprint through green cloud solutions, energy-efficient coding, and circular IT lifecycle management. #GreenTech', 'instagram_caption', FALSE, '2025-11-28 11:02:00'),
('o009', 'j011', '⚙️ DevOps is not just a methodology — it is a culture shift. CI/CD pipelines, infrastructure as code, and monitoring-first approaches are transforming software delivery...', 'linkedin_post', FALSE, '2025-12-01 08:47:00'),
('o010', 'j013', 'HOOK: Did you know data pipelines process BILLIONS of events per second? [CUT] Here are 3 tools every data engineer needs in 2026... #DataEngineering #Shorts', 'youtube_short', FALSE, '2025-12-05 15:32:00'),
('o011', 'j014', '🔗 Blockchain is NOT just crypto! Supply chain transparency, tamper-proof health records, and decentralized identity — the real applications are just beginning. #Blockchain #Web3', 'tweet', TRUE, '2025-12-07 10:16:30'),
('o012', 'j016', 'Subject: Edge Computing — The Next Frontier\n\nDear Subscriber,\nEdge computing is revolutionizing how we process data by bringing computation closer to the source...', 'email_newsletter', FALSE, '2025-12-11 14:33:00'),
('o013', 'j017', '🏃 एजाइल प्रोजेक्ट मैनेजमेंट: इटरेटिव डेवलपमेंट, क्रॉस-फंक्शनल टीमें और कंटीन्यूअस फीडबैक। सॉफ्टवेयर डिलीवरी का भविष्य! #Agile #Hindi', 'tweet', FALSE, '2025-12-13 10:47:00'),
('o014', 'j019', '☸️ Getting started with Kubernetes? Here is your roadmap: 1) Understand pods & services 2) Learn kubectl commands 3) Deploy your first app 4) Master scaling & monitoring...', 'linkedin_post', FALSE, '2025-12-17 09:02:00'),
('o015', 'j001', 'AI is reshaping enterprise operations through intelligent automation, predictive maintenance, and data-driven strategy. Here are 5 use cases every leader should know...', 'linkedin_article', FALSE, '2025-11-10 10:03:00'),
('o016', 'j003', 'Cloud computing enables elastic scaling, pay-as-you-go pricing, and global reach. This newsletter breaks down the top 5 cloud trends for 2026...', 'email_summary', FALSE, '2025-11-15 10:34:00'),
('o017', 'j007', '[OUTRO] Thanks for watching! If this video helped you think differently about remote work, hit that subscribe button. See you in the next one!', 'youtube_outro', FALSE, '2025-11-20 15:06:00'),
('o018', 'j004', 'ML algorithms demystified: supervised (classification, regression), unsupervised (clustering, dimensionality reduction), reinforcement (game AI, robotics). Which one fits your use case?', 'linkedin_carousel', TRUE, '2025-11-12 11:33:00'),
('o019', 'j011', 'Breaking down DevOps: 1. Version Control → Git 2. CI/CD → Jenkins/GitHub Actions 3. Containers → Docker 4. Orchestration → Kubernetes 5. Monitoring → Prometheus + Grafana', 'linkedin_carousel', FALSE, '2025-12-01 08:48:00'),
('o020', 'j014', 'Blockchain use cases beyond DeFi: Healthcare records, supply chain, government IDs, intellectual property, carbon credit trading. The technology is maturing rapidly.', 'tweet_thread', FALSE, '2025-12-07 10:17:00');
```

**Generated Outputs Table:**

| output_id | job_id | format_type | is_edited | created_at |
|-----------|--------|-------------|-----------|------------|
| o001 | j001 | linkedin_post | FALSE | 2025-11-10 10:02:00 |
| o002 | j002 | tweet | FALSE | 2025-11-10 10:06:30 |
| o003 | j003 | email_newsletter | TRUE | 2025-11-15 10:33:00 |
| o004 | j004 | linkedin_post | FALSE | 2025-11-12 11:32:00 |
| o005 | j006 | tweet | FALSE | 2025-11-18 13:31:30 |
| o006 | j007 | youtube_script | TRUE | 2025-11-20 15:05:00 |
| o007 | j008 | linkedin_post | FALSE | 2025-11-20 15:12:00 |
| o008 | j010 | instagram_caption | FALSE | 2025-11-28 11:02:00 |
| o009 | j011 | linkedin_post | FALSE | 2025-12-01 08:47:00 |
| o010 | j013 | youtube_short | FALSE | 2025-12-05 15:32:00 |
| o011 | j014 | tweet | TRUE | 2025-12-07 10:16:30 |
| o012 | j016 | email_newsletter | FALSE | 2025-12-11 14:33:00 |
| o013 | j017 | tweet | FALSE | 2025-12-13 10:47:00 |
| o014 | j019 | linkedin_post | FALSE | 2025-12-17 09:02:00 |
| o015 | j001 | linkedin_article | FALSE | 2025-11-10 10:03:00 |
| o016 | j003 | email_summary | FALSE | 2025-11-15 10:34:00 |
| o017 | j007 | youtube_outro | FALSE | 2025-11-20 15:06:00 |
| o018 | j004 | linkedin_carousel | TRUE | 2025-11-12 11:33:00 |
| o019 | j011 | linkedin_carousel | FALSE | 2025-12-01 08:48:00 |
| o020 | j014 | tweet_thread | FALSE | 2025-12-07 10:17:00 |

---
