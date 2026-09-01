# ⚡ Performance Engineering — Executive Summary

## 1. Overview & Evaluation Scope

The AI Knowledge Hub backend was benchmarked under synthetic multi-user workloads using k6. The evaluation focused on characterization of key application subsystems, vector database similarity search performance, background job queue throughput, and external AI provider latency.

- **Target Backend**: NestJS (v11) / Node.js 22 on Windows host
- **Database**: PostgreSQL 15.16 with `pgvector` v0.8.1 (Port 5433)
- **Cache & Queue**: Redis 7-alpine with BullMQ 5.x (Port 6379)
- **External AI**: OpenRouter API (`mistralai/ministral-14b-2512`)

---

## 2. Benchmark Scale & Dataset Notice

> [!NOTE]
> **Synthetic Vector Notice**: The benchmark dataset contains **6,969 1536-dimensional vector embedding rows** generated synthetic/randomly. This validates database query execution, memory footprint, and vector index performance — **not** semantic relevance or embedding model accuracy.

- **Active Users**: 210 pre-seeded active user accounts with JWT tokens
- **Documents**: 500 documents with relational categories, notes, and tasks
- **Embeddings**: 6,969 `vector(1536)` rows stored in PostgreSQL
- **Redis Queue Keys**: 3,344+ BullMQ job records

---

## 3. Subsystem Performance Findings

| Subsystem / Workload | Concurrent Load (VUs) | Measured Latency p(50) | Measured Latency p(95) | Error Rate | Primary Bottleneck / Observation |
|----------------------|-----------------------|------------------------|------------------------|------------|-----------------------------------|
| **Baseline REST Endpoints** | 1 – 10 VUs | 89.6 ms | 390.7 ms | 10.1%* | *404/403 errors on random document lookup iterations |
| **pgvector Similarity Search** | 5 – 30 VUs | 527.9 ms | 743.9 ms | **0.00%** | Full-table vector distance comparison under concurrency |
| **BullMQ Ingestion Queue** | 5 – 20 VUs | 552.4 ms | 1,416.0 ms | **0.00%** | Database write transaction duration during document creation |
| **External AI Operations** | 2 – 5 VUs | 1,124.5 ms | 1,822.0 ms | 25.0%* | OpenRouter external HTTP API round-trip + inference latency; *RAG QA payload schema error caught |

---

## 4. Key Performance Optimization: HNSW Indexing

Query execution plans were captured before and after applying an HNSW index (`idx_embeddings_hnsw`, `m=16`, `ef_construction=64`) on the 1536-dimensional `embeddings.vector` column using `EXPLAIN (ANALYZE, BUFFERS)`:

- **Before HNSW Index**: Vector cosine distance query executed in **376.05 ms** (Sequential Scan on 6,969 embedding rows, `shared hit=21272` buffer blocks).
- **After HNSW Index**: Query execution time dropped to **41.41 ms** (`shared hit=21246` buffer blocks).
- **Measured Execution Time Reduction**: **334.64 ms faster (-89.0% query execution time)** on exact query structure.

---

## 5. Verification Status Summary

| Component | Code Implementation | Runtime Verified | Benchmark Verified |
|-----------|:------------------:|:----------------:|:------------------:|
| **PostgreSQL 15** | ✅ | ✅ `15.16 (Debian)` | ✅ baseline CRUD workload |
| **pgvector 0.8.1** | ✅ `vector(1536)` | ✅ 6,969 vector rows | ✅ p(95) = 743.95ms @ 30 VUs |
| **HNSW Index** | ✅ `idx_embeddings_hnsw` | ✅ EXPLAIN plan verified | ✅ Exec time 376ms → 41.4ms |
| **Redis 7** | ✅ `ioredis` | ✅ PING PONG, 3.9MB memory | ✅ Queue state tracking |
| **BullMQ Worker** | ✅ `@Processor('embedding')` | ✅ Controlled job → 2 chunks in DB | ✅ 893 jobs enqueued @ 8.46/sec |
| **OpenRouter AI** | ✅ `openRouter.provider.ts` | ✅ Real request: 86 in / 104 out tokens | ✅ p(95) = 1,822ms @ 5 VUs |
| **MCP Integration** | ✅ `mcp.controller.ts` | ✅ Tool registry active | ✅ REST endpoint verification |

---

## 6. Important System Limitations

1. **Localhost Environment**: All benchmarks were executed on a single developer machine with local database/redis containers. Network latency to remote cloud hosting (e.g. Fly.io, AWS) is not reflected.
2. **AI Latency Composition**: AI endpoint latency (1,497ms – 1,822ms) includes local NestJS HTTP handling, local network overhead, external OpenRouter API network round-trip, and model inference time.
3. **Database Connection Limit**: PostgreSQL `max_connections` is configured to 100. Connection pool utilization must be monitored when concurrency exceeds 50 VUs.
