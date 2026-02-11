# AI Content Repurposer - Full-Stack MVP

A professional web-based AI Content Repurposer that transforms long-form content into social media posts, email newsletters, and video scripts using local Ollama AI.

## System Architecture

```mermaid
graph TD
    subgraph Client["Client Layer"]
        A[User Browser]
        B[Next.js Frontend]
    end
    
    subgraph Server["Server Layer"]
        C[FastAPI Backend]
        D[JWT Auth Service]
        E[Content Service]
        F[Repurpose Service]
    end
    
    subgraph Data["Data Layer"]
        G[(MySQL Database)]
    end
    
    subgraph AI["AI Layer"]
        H[Ollama AI Engine<br/>localhost:11434]
    end
    
    A --> B
    B <-->|REST API| C
    C --> D
    C --> E
    C --> F
    E <-->|SQLAlchemy ORM| G
    F <-->|HTTP POST| H
    F <-->|Save Results| G
    
    style A fill:#1a1a2e,stroke:#00d9ff,color:#fff
    style B fill:#16213e,stroke:#00d9ff,color:#fff
    style C fill:#0f3460,stroke:#e94560,color:#fff
    style D fill:#0f3460,stroke:#e94560,color:#fff
    style E fill:#0f3460,stroke:#e94560,color:#fff
    style F fill:#0f3460,stroke:#e94560,color:#fff
    style G fill:#533483,stroke:#00d9ff,color:#fff
    style H fill:#e94560,stroke:#fff,color:#fff
```

## Application Flowchart

```mermaid
flowchart TD
    START([User Opens App]) --> AUTH{Authenticated?}
    AUTH -->|No| LOGIN[Login / Signup Page]
    LOGIN --> VALIDATE{Valid Credentials?}
    VALIDATE -->|No| LOGIN
    VALIDATE -->|Yes| DASHBOARD
    AUTH -->|Yes| DASHBOARD[Dashboard]
    
    DASHBOARD --> CREATE[Create New Repurpose Job]
    CREATE --> INPUT[Input Content<br/>Text or URL]
    INPUT --> SELECT[Select Output Types<br/>& Target Language]
    SELECT --> GENERATE[Generate Button]
    
    GENERATE --> BACKEND[Backend Receives Request]
    BACKEND --> PROMPT[Build AI Prompt]
    PROMPT --> OLLAMA[Send to Ollama API]
    OLLAMA --> RESPONSE[Receive Generated Content]
    RESPONSE --> SAVE[Save to PostgreSQL]
    SAVE --> DISPLAY[Display Results]
    
    DISPLAY --> ACTIONS{User Action}
    ACTIONS -->|Edit| EDIT[Edit Output]
    ACTIONS -->|Export| EXPORT[Export / Copy]
    ACTIONS -->|New Job| CREATE
    ACTIONS -->|Logout| LOGOUT[Logout]
    
    EDIT --> SAVE
    EXPORT --> DASHBOARD
    LOGOUT --> LOGIN
    
    style START fill:#00d9ff,stroke:#fff,color:#000
    style DASHBOARD fill:#16213e,stroke:#00d9ff,color:#fff
    style OLLAMA fill:#e94560,stroke:#fff,color:#fff
    style SAVE fill:#533483,stroke:#00d9ff,color:#fff
```

## User Flow Diagram

```mermaid
flowchart LR
    subgraph Entry["Entry Point"]
        LP[Landing Page]
    end
    
    subgraph Auth["Authentication"]
        LG[Login]
        SU[Signup]
    end
    
    subgraph Main["Main Application"]
        DB[Dashboard]
        NJ[New Job]
        CT[Content Input]
        ST[Select Types]
        GN[Generate]
        RV[Review Outputs]
    end
    
    subgraph Actions["Output Actions"]
        ED[Edit]
        SV[Save]
        EX[Export]
        CP[Copy]
    end
    
    LP --> LG
    LP --> SU
    SU --> LG
    LG --> DB
    
    DB --> NJ
    NJ --> CT
    CT --> ST
    ST --> GN
    GN --> RV
    
    RV --> ED
    RV --> SV
    RV --> EX
    RV --> CP
    
    ED --> SV
    SV --> DB
    EX --> DB
    CP --> DB
    
    style LP fill:#1a1a2e,stroke:#00d9ff,color:#fff
    style DB fill:#16213e,stroke:#00d9ff,color:#fff
    style GN fill:#e94560,stroke:#fff,color:#fff
    style RV fill:#533483,stroke:#00d9ff,color:#fff
```

## Entity Relationship Diagram

```mermaid
erDiagram
    USER {
        uuid user_id PK "Primary Key"
        string name
        string email UK "Unique"
        string password_hash
        timestamp created_at
        timestamp updated_at
    }
    
    CONTENT {
        uuid content_id PK "Primary Key"
        uuid user_id FK "Foreign Key"
        text original_text
        string source_url
        string language
        string title
        timestamp created_at
    }
    
    REPURPOSE_JOB {
        uuid job_id PK "Primary Key"
        uuid content_id FK "Foreign Key"
        string target_platform
        string target_language
        string status
        timestamp created_at
        timestamp completed_at
    }
    
    GENERATED_OUTPUT {
        uuid output_id PK "Primary Key"
        uuid job_id FK "Foreign Key"
        text output_text
        string format_type
        boolean is_edited
        timestamp created_at
        timestamp updated_at
    }
    
    USER ||--o{ CONTENT : "creates"
    CONTENT ||--o{ REPURPOSE_JOB : "has"
    REPURPOSE_JOB ||--o{ GENERATED_OUTPUT : "produces"
```

## Tech Stack

### Backend
- Python 3.11
- FastAPI
- SQLAlchemy (async)
- MySQL
- JWT Authentication
- Ollama REST API

### Frontend
- Next.js 14
- React 18
- Tailwind CSS
- Framer Motion
- TypeScript

## Project Structure

```
ai-content-repurposer/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── auth.py
│   │   │   │   ├── content.py
│   │   │   │   └── repurpose.py
│   │   │   └── deps.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── ollama.py
│   │   ├── db/
│   │   │   ├── base.py
│   │   │   └── session.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── content.py
│   │   │   └── output.py
│   │   ├── schemas/
│   │   │   ├── user.py
│   │   │   ├── content.py
│   │   │   └── output.py
│   │   └── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   └── package.json
└── README.md
```

## Quick Start

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Ollama Setup
```bash
# Install Ollama from https://ollama.ai
ollama pull llama3
ollama serve
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=mysql+aiomysql://root:password@localhost:3306/content_repurposer
SECRET_KEY=your-secret-key-here
OLLAMA_BASE_URL=http://localhost:11434
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## MVP Features

- [x] User authentication (JWT)
- [x] Content input (text or URL)
- [x] AI-powered repurposing via Ollama
- [x] Multi-language output support
- [x] Save & manage generated content
- [x] Export / copy outputs
- [ ] Billing (future)
- [ ] Team collaboration (future)
- [ ] Analytics (future)

## License

MIT License
# AI-content-automater
