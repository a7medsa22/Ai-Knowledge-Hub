# 🏛️ AI Knowledge Hub — System Architecture & Design Documentation

## 1. Executive Summary

AI Knowledge Hub is an enterprise-grade research and knowledge management platform built with NestJS and TypeScript. The platform combines relational document and task management with Retrieval-Augmented Generation (RAG), vector similarity search, asynchronous background queue processing, and Model Context Protocol (MCP) agent tool integration.

---

## 2. Architectural Paradigm & System Overview

The system implements **Layered / Clean Architecture** principles within a NestJS modular structure.

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│ (Swagger UI, Web App, REST Clients, AI MCP Agents)          │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP / JSON (REST API v1)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 Application Gateway (NestJS)                │
│ ┌──────────────┬──────────────┬──────────────┬────────────┐ │
│ │ Auth Module  │ Docs Module  │ Notes Module │Task Module │ │
│ ├──────────────┼──────────────┼──────────────┼────────────┤ │
│ │ AI Module    │ MCP Module   │ Files Module │CategoryMod │ │
│ └──────────────┴──────────────┴──────────────┴────────────┘ │
│ ┌────────────────────────────┬────────────────────────────┐ │
│ │ Throttler Guards (Rate)    │ Passport JWT Auth Strategy │ │
│ └────────────────────────────┴────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
┌───────────────────┐       ┌───────────────────┐
│ Database Layer    │       │ Background Queue  │
│ (PostgreSQL 15 +  │       │ (Redis 7 +        │
│  pgvector 0.8.1)  │       │  BullMQ 5.x)      │
└────────┬──────────┘       └────────┬──────────┘
         │                           │
         ▼                           ▼
┌───────────────────┐       ┌───────────────────┐
│ Prisma ORM        │       │ Embedding Worker  │
│ Data Access       │       │ Processor         │
└───────────────────┘       └────────┬──────────┘
                                     │ Outbound HTTP
                                     ▼
                            ┌───────────────────┐
                            │ External AI       │
                            │ Provider          │
                            │ (OpenRouter /     │
                            │  Ollama / OpenAI) │
                            └───────────────────┘
```

---

## 3. Core Subsystems & Modules

### 3.1 Authentication & Session Management (`src/auth`, `src/users`)
- **Token Mechanism**: Dual-token architecture using short-lived JWT Access Tokens (15m) and long-lived Refresh Tokens (7d).
- **Session Tracking**: Persists device metadata (`deviceName`, `ipAddress`, `userAgent`) per session in `auth_tokens`.
- **Security Control**: Supports explicit token revocation and session deletion via REST endpoints.
- **Passcode Hashing**: Synchronous/asynchronous bcrypt password hashing (cost factor 10).

### 3.2 Document & Knowledge Base (`src/docs`, `src/categories`)
- **Document Model**: Rich text articles with titles, content, summaries, tags, and public/private visibility controls.
- **Relational Categorization**: Many-to-many relationship via `CategoryDoc` junction table linking documents to user categories.
- **Async Embedding Trigger**: Document creation and update events trigger BullMQ ingestion jobs for automated chunking and vector embedding.

### 3.3 Vector Search & RAG Pipeline (`src/ai`, `prisma/schema.prisma`)
- **Vector Storage**: PostgreSQL column `vector` defined as `Unsupported("vector(1536)")` using `pgvector` 0.8.1.
- **Similarity Search**: Cosine similarity evaluation using pgvector's `<=>` distance operator (`1 - (e.vector <=> queryVector)`).
- **HNSW Indexing**: Hierarchical Navigable Small World index (`idx_embeddings_hnsw`) configured with `m=16`, `ef_construction=64` for accelerated approximate nearest neighbor (ANN) vector retrieval.
- **Text Chunking**: Configurable sliding window chunking (`RAG_CONFIG`: 500 characters, 50 character overlap).

### 3.4 Asynchronous Background Processing (`src/queues`, `src/workers`)
- **Queue Engine**: BullMQ backed by Redis 7.
- **Embedding Worker**: `@Processor('embedding')` listens on the `embedding` queue.
- **Lifecycle**:
  1. API receives document write request → returns HTTP 201 immediately.
  2. Document ID enqueued into Redis `bull:embedding:waiting`.
  3. Worker fetches job → splits content into chunks via `Chunker`.
  4. Worker calls `EmbeddingService` → generates 1536-dimensional vectors.
  5. Worker clears existing embeddings and bulk-inserts new chunks into `embeddings` table.

### 3.5 External AI Provider Abstraction (`src/ai/providers`)
- **Factory Pattern**: `AiProviderFactory` dynamically registers and instantiates providers based on `AI_PROVIDER` environment variable.
- **Supported Providers**:
  - `OpenRouterProvider`: Primary production provider (`mistralai/ministral-14b-2512`) via real outbound HTTP requests to `https://openrouter.ai/api/v1`.
  - `OllamaProvider`: Local LLM provider (`http://127.0.0.1:11434`).
  - `OpenAiProvider` & `GroqProvider`: Additional cloud provider options.
- **Fallback Chain**: Fallback order `ollama → openai → groq → openrouter` if the primary provider checks fail.

### 3.6 Model Context Protocol (MCP) Integration (`src/mcp`)
- **Agent Interoperability**: Standardized MCP tool execution endpoint (`/mcp/execute` and `/mcp/execute-batch`).
- **Tool Registry**: Registered tools include `searchDocs`, `getDocument`, `addNote`, `createTask`, `listTasks`, and `getUserStats`.
- **Quick Action Wrappers**: Dedicated REST endpoints for low-overhead single-tool execution.

---

## 4. Key Design Decisions & Technical Trade-Offs

| Decision | Rationale | Trade-Off |
|----------|-----------|-----------|
| **pgvector inside PostgreSQL** | Eliminates secondary vector database infra; transactional consistency | Slightly higher CPU/memory overhead on main database compared to dedicated vector DBs at sub-million scale |
| **HNSW Indexing (`m=16, ef=64`)** | Fast approximate nearest neighbor search; low latency query execution | Higher memory consumption during index build and storage footprint |
| **BullMQ Async Ingestion** | Prevents API thread blocking during embedding generation; decouples write latency from LLM latency | Eventual consistency: vector search results lag document creation by a brief worker processing window |
| **Factory Provider Pattern** | Multi-LLM flexibility without changing service call sites | Minor runtime overhead in health check/provider resolution |

---

## 5. Architectural Boundaries

- **Controller Layer**: Handles HTTP validation (`ValidationPipe`), authentication guards (`JwtAuthGuard`), rate limiting (`ThrottlerGuard`), and API serialization.
- **Service Layer**: Implements business domain rules, transactional orchestration, and ORM query execution.
- **Provider Layer**: Isolated outbound HTTP client abstractions for external APIs (OpenRouter, Redis, SMTP, Cloudinary).
