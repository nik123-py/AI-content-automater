# CHAPTER 1

## PROBLEM UNDERSTANDING, IDENTIFICATION OF ENTITY AND RELATIONSHIPS, CONSTRUCTION OF DB USING ER MODEL FOR THE 'AI Content Repurposer'

---

### 1.1 Introduction

In today's fast-paced digital landscape, content creation has become a cornerstone of brand visibility, audience engagement, and marketing strategy. Organizations and individuals alike produce long-form content — blog posts, articles, whitepapers, and video transcripts — that holds immense potential for reuse across multiple platforms. However, manually transforming a single piece of content into platform-specific formats (LinkedIn posts, Twitter threads, Instagram captions, email newsletters, YouTube scripts) is extremely time-consuming, repetitive, and inconsistent in quality.

The **AI Content Repurposer** is a full-stack web application designed to solve this problem by leveraging local AI (Ollama LLM) to automatically transform long-form content into multiple social media and marketing formats. The system provides a centralized platform where users can input original content, select target platforms and languages, and receive AI-generated outputs tailored for each channel — all managed through a secure, user-friendly interface backed by a robust MySQL database.

---

### 1.2 Motivation

The motivation behind developing the AI Content Repurposer stems from several key industry challenges:

**Content Overload:** Content marketers spend an average of 6–8 hours per week repurposing content manually. This inefficiency diverts resources from strategic planning and creative ideation. The AI Content Repurposer automates this process, freeing creators to focus on high-value tasks.

**Platform-Specific Requirements:** Each social media platform has unique formatting requirements — character limits on Twitter, professional tone on LinkedIn, visual-first approach on Instagram, and long-form scripts for YouTube. Manual adaptation is error-prone and inconsistent. The system encodes platform-specific rules into AI prompts, ensuring output quality across all channels.

**Multilingual Content Demand:** As businesses expand globally, the need for content in multiple languages grows. Manually translating and adapting content for different linguistic audiences is costly and slow. The AI Content Repurposer supports multi-language output generation, enabling instant localization.

**Tracking and Accountability:** Without a centralized system, organizations lose track of which content pieces have been repurposed, for which platforms, and with what results. The database-driven architecture of this project provides complete audit trails and historical records.

**Cost Efficiency:** By using a locally hosted Ollama AI engine instead of expensive cloud APIs, the system dramatically reduces operational costs while maintaining data privacy — no content is sent to third-party servers.

---

### 1.3 Scope

The scope of the AI Content Repurposer project encompasses:

**Content Management:** Users can submit original long-form content either as raw text or via URL. Each content piece is stored with metadata including title, language, source URL, and creation timestamp. The system supports content in multiple languages (English, Hindi, Spanish, French, German, Chinese, Japanese, Arabic).

**AI-Powered Repurposing:** The core feature allows users to create repurpose jobs targeting specific platforms (LinkedIn, Twitter, Instagram, Email Newsletter, YouTube Script, YouTube Shorts). Each job is tracked through a status pipeline: pending → processing → completed/failed. The AI engine generates platform-optimized outputs preserving the original message's intent.

**Output Management:** Generated outputs are stored with format type metadata and can be edited, exported, or copied by the user. The system tracks whether an output has been manually edited post-generation, providing transparency in the content pipeline.

**User Authentication & Security:** JWT-based authentication ensures that each user's content and outputs are private and secure. Password hashing, token-based sessions, and user-specific data isolation are implemented throughout.

**Analytics & Monitoring:** The system provides views and reports on platform performance, user activity, job success rates, and content pipeline status, enabling data-driven decisions about content strategy.

**API-First Architecture:** A RESTful FastAPI backend serves as the core, enabling integration with any frontend framework and supporting future expansion to mobile applications or third-party integrations.

---

### 1.4 Problem Statement

Content creators, digital marketers, and businesses face significant challenges in efficiently repurposing long-form content across multiple digital platforms. Without an automated system, they encounter:

- **Time-intensive manual rewriting** of content for each platform's unique format, tone, and character requirements
- **Inconsistent brand messaging** when different team members adapt the same content independently
- **No centralized tracking** of which content has been repurposed, for which platforms, and the success/failure status of each transformation
- **Language barriers** preventing content from reaching global audiences due to the cost and complexity of manual translation
- **Loss of historical data** — organizations cannot analyze which platforms yield the best results or track content evolution over time
- **High dependency on expensive cloud AI APIs** that raise both cost and data privacy concerns
- **Inability to edit and refine** AI-generated outputs within the same workflow, leading to fragmented toolchains
- **No audit trail** for content transformations, making it difficult to maintain quality standards and compliance
- **Scalability issues** when content volume increases, as manual processes cannot keep pace with growing publishing demands
- **Lack of job status visibility** — creators have no way to monitor whether a repurposing task is pending, in progress, completed, or failed

Therefore, there is a critical need for an intelligent, database-driven content repurposing system that automates multi-platform content transformation, provides real-time job tracking, maintains complete content history, and supports multilingual output — all while keeping data secure and costs minimal through local AI processing.

---

### 1.5 Project Requirements

#### Functional Requirements:

**1. User Management**
- Users must be able to register with a unique name, email, and password
- Each user must have a unique identifier (user_id) using UUID format for global uniqueness
- User authentication via JWT tokens for secure, stateless API access
- Profile management including updating name, email, and password
- Automatic tracking of account creation and last update timestamps

**2. Content Management**
- Submit original content as raw text or via URL extraction
- Each content piece stores: title, original text, source URL, language, and creation timestamp
- Default language is English with support for 8 languages
- Content is linked to the owning user via foreign key relationship
- Cascade deletion ensures content is removed when a user account is deleted
- Search and filter capabilities by title, language, or date range

**3. Repurpose Job Management**
- Create repurpose jobs specifying target platform and target language
- Supported platforms: LinkedIn, Twitter, Instagram, Email Newsletter, YouTube Script, YouTube Shorts
- Job status tracking through lifecycle states: pending, processing, completed, failed
- Automatic timestamping of job creation and completion
- Jobs are linked to content pieces, enabling traceability from source to output
- Cascade deletion ensures jobs are removed when parent content is deleted

**4. Output Management**
- Store AI-generated outputs with format type metadata
- Track whether outputs have been manually edited by users
- Support viewing, editing, exporting, and copying generated content
- Outputs are linked to their parent job, enabling full pipeline traceability
- Cascade deletion ensures outputs are removed when parent jobs are deleted
- Automatic tracking of creation and last update timestamps

**5. Analytics & Reporting**
- Dashboard views showing per-user content counts, job counts, and success rates
- Platform-level analytics with success/failure breakdowns
- Recent activity feeds for monitoring system-wide content pipeline
- Monthly content creation statistics and trends

#### Non-Functional Requirements:

**1. Performance**
- API response time under 500ms for standard CRUD operations
- Efficient database queries with proper indexing on foreign keys and frequently queried columns
- Support for concurrent users without performance degradation

**2. Security**
- UUID-based identifiers to prevent enumeration attacks
- Password hashing using industry-standard algorithms
- JWT token-based authentication with configurable expiration
- User data isolation — each user can only access their own content

**3. Reliability**
- Database transactions for data consistency during multi-step operations
- Error handling with meaningful error messages and HTTP status codes
- Trigger-based audit logging for critical state changes

**4. Scalability**
- Stateless API design enabling horizontal scaling
- Database schema designed for efficient growth in users, content, and jobs
- Modular architecture supporting addition of new platforms and languages

**5. Usability**
- Clean REST API with consistent JSON response formats
- Comprehensive API documentation via FastAPI's auto-generated Swagger UI
- Meaningful validation messages for invalid inputs

---

### 1.6 Identification of Entity and Relationships

#### Entities:

**1. User**
Represents a registered system user who creates and manages content.
Attributes: user_id, name, email, password_hash, created_at, updated_at
This entity stores all authentication and profile information and serves as the primary owner of all content data in the system.

**2. Content**
Represents an original piece of long-form content submitted by a user.
Attributes: content_id, user_id, original_text, source_url, language, title, created_at
This entity captures the raw input content along with metadata such as the source language and optional URL from which the content was extracted.

**3. Repurpose Job**
Represents a specific content transformation task targeting a particular platform and language.
Attributes: job_id, content_id, target_platform, target_language, status, created_at, completed_at
This entity tracks each repurposing request through its lifecycle, recording the target platform, desired output language, and current processing status.

**4. Generated Output**
Represents the AI-generated content produced by a repurpose job.
Attributes: output_id, job_id, output_text, format_type, is_edited, created_at, updated_at
This entity stores the final transformed content along with metadata about its format and whether it has been manually edited by the user.

**5. Job Audit Log**
Represents an audit record tracking status changes in repurpose jobs.
Attributes: log_id, job_id, old_status, new_status, changed_at
This entity provides a complete audit trail of all job status transitions for monitoring and debugging purposes.

#### Relationships:

**1. User–Content Relationship**
- One User can create many Contents (1:M)
- Each Content belongs to exactly one User
- Foreign key: user_id in Content table references User table
- ON DELETE CASCADE: All content is removed when a user is deleted

**2. Content–Repurpose Job Relationship**
- One Content can have many Repurpose Jobs (1:M)
- Each Repurpose Job belongs to exactly one Content
- Foreign key: content_id in Repurpose Job table references Content table
- ON DELETE CASCADE: All jobs are removed when parent content is deleted

**3. Repurpose Job–Generated Output Relationship**
- One Repurpose Job can produce many Generated Outputs (1:M)
- Each Generated Output belongs to exactly one Repurpose Job
- Foreign key: job_id in Generated Output table references Repurpose Job table
- ON DELETE CASCADE: All outputs are removed when parent job is deleted

**4. Repurpose Job–Job Audit Log Relationship**
- One Repurpose Job can have many Audit Log entries (1:M)
- Each Audit Log entry references exactly one Repurpose Job
- Foreign key: job_id in Job Audit Log table references Repurpose Job table
- Provides complete history of status transitions for each job

---

### 1.7 Construction of DB Using ER Model for the 'AI Content Repurposer'

#### Figure 1.1: ER Diagram of AI Content Repurposer

```
┌─────────────────────┐          ┌─────────────────────────┐
│       USER          │          │        CONTENT           │
│─────────────────────│          │─────────────────────────│
│ • user_id (PK)      │──1:M───▶│ • content_id (PK)        │
│ • name              │          │ • user_id (FK)           │
│ • email (UNIQUE)    │          │ • original_text          │
│ • password_hash     │          │ • source_url             │
│ • created_at        │          │ • language               │
│ • updated_at        │          │ • title                  │
└─────────────────────┘          │ • created_at             │
                                 └────────────┬────────────┘
                                              │
                                             1:M
                                              │
                                              ▼
                                 ┌─────────────────────────┐
                                 │    REPURPOSE_JOB         │
                                 │─────────────────────────│
                                 │ • job_id (PK)            │
                                 │ • content_id (FK)        │
                                 │ • target_platform        │
                                 │ • target_language        │
                                 │ • status                 │
                                 │ • created_at             │
                                 │ • completed_at           │
                                 └──────┬──────────┬───────┘
                                        │          │
                                       1:M        1:M
                                        │          │
                                        ▼          ▼
                          ┌──────────────────┐  ┌──────────────────┐
                          │ GENERATED_OUTPUT  │  │  JOB_AUDIT_LOG   │
                          │──────────────────│  │──────────────────│
                          │ • output_id (PK)  │  │ • log_id (PK)    │
                          │ • job_id (FK)     │  │ • job_id (FK)    │
                          │ • output_text     │  │ • old_status     │
                          │ • format_type     │  │ • new_status     │
                          │ • is_edited       │  │ • changed_at     │
                          │ • created_at      │  └──────────────────┘
                          │ • updated_at      │
                          └──────────────────┘
```

---

#### Table 1.1: Entity Definitions

| Entity | Description | Key Attributes |
|--------|-------------|----------------|
| User | Registered system user who manages content | user_id (PK), name, email, password_hash |
| Content | Original long-form content submitted by a user | content_id (PK), user_id (FK), original_text, title, language |
| Repurpose Job | Content transformation task for a specific platform | job_id (PK), content_id (FK), target_platform, target_language, status |
| Generated Output | AI-generated platform-specific content | output_id (PK), job_id (FK), output_text, format_type, is_edited |
| Job Audit Log | Audit trail of job status changes | log_id (PK), job_id (FK), old_status, new_status, changed_at |

---

#### Table 1.2: User Schema

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| user_id | CHAR(36) | PRIMARY KEY | Unique user identifier (UUID) |
| name | VARCHAR(100) | NOT NULL | User's full name |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User's email address |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt-hashed password |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last profile update timestamp |

---

#### Table 1.3: Content Schema

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| content_id | CHAR(36) | PRIMARY KEY | Unique content identifier (UUID) |
| user_id | CHAR(36) | FOREIGN KEY REFERENCES users(user_id) ON DELETE CASCADE | Owner of content |
| original_text | TEXT | NOT NULL | Original long-form content body |
| source_url | VARCHAR(500) | NULL | URL source of the content (optional) |
| language | VARCHAR(20) | NOT NULL, DEFAULT 'English' | Source content language |
| title | VARCHAR(255) | NULL | Content title |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Content creation timestamp |

---

#### Table 1.4: Repurpose Job Schema

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| job_id | CHAR(36) | PRIMARY KEY | Unique job identifier (UUID) |
| content_id | CHAR(36) | FOREIGN KEY REFERENCES contents(content_id) ON DELETE CASCADE | Source content for job |
| target_platform | VARCHAR(50) | NOT NULL | Target platform (linkedin, twitter, etc.) |
| target_language | VARCHAR(20) | NOT NULL, DEFAULT 'English' | Desired output language |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | Job status (pending/processing/completed/failed) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Job creation timestamp |
| completed_at | TIMESTAMP | NULL | Job completion timestamp |

---

#### Table 1.5: Generated Output Schema

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| output_id | CHAR(36) | PRIMARY KEY | Unique output identifier (UUID) |
| job_id | CHAR(36) | FOREIGN KEY REFERENCES repurpose_jobs(job_id) ON DELETE CASCADE | Parent job |
| output_text | TEXT | NOT NULL | AI-generated content |
| format_type | VARCHAR(50) | NOT NULL | Output format type |
| is_edited | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether user has edited the output |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Output creation timestamp |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last edit timestamp |

---
