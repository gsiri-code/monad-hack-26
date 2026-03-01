graph TD
    subgraph Clients
        UI["Next.js Web UI<br/>- User Dashboard<br/>- Manage Friends<br/>- Tx History"]:::client
        OC["OpenClaw Telegram Agent<br/>- NLP Intent Parsing<br/>- Conversational Tx"]:::client
    end

    subgraph Middleware
        API["Authentication & API Gateway<br/>- Session Management<br/>- Request Routing"]:::mid
    end

    subgraph BackendLayer
        BE["Core Backend Service<br/>- Privacy Routing Logic<br/>- Selective Tx Disclosure<br/>- Chat CRUD"]:::backend
    end

    subgraph DataLayer
        DB[("Database<br/>- Social Graph (Friends)<br/>- Off-chain Chat Logs<br/>- User Profiles")]:::storage
    end

    subgraph Web3Layer
        SC{"UnLink Smart Contracts (Monad)<br/>- Private Stablecoin Transfers<br/>- Stealth Address Resolution"}:::crypto
    end

    UI -->|Dashboard & Manual Tx| API
    OC -->|NLP Payment Commands| API
    API -->|Verified Requests| BE
    
    BE -->|Store Chat / Read Social Graph| DB
    DB -->|Return Visibility State| BE
    
    BE -->|Initiate Private Transfer| SC
    SC -.->|Query Off-chain Auth/State| BE

    classDef client fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef mid fill:#fff3e0,stroke:#e65100,stroke-width:2px;
    classDef backend fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px;
    classDef storage fill:#f3e5f5,stroke:#4a148c,stroke-width:2px;
    classDef crypto fill:#fff9c4,stroke:#f57f17,stroke-width:2px;