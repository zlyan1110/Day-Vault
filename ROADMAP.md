# Roadmap

## Overview

This project serves two goals: building a personalized daily history feed, and systematically learning inference infrastructure (vLLM, SGLang, TensorRT-LLM, Triton). Each phase adds product features while introducing a new inference stack.

**Timeline**: ~12-16 weeks total | **Budget**: ~$200-400 total

---

## V0 — Core Feed MVP (Weeks 1-3)

**Goal**: Open the app, see a personalized "On This Day" feed.

### Product Scope

- User registration/login (Supabase Auth)
- Onboarding: select 3-5 interest tags
- Daily feed page: 5-10 personalized history event cards
- Each card: title, year, personalized reason, image
- Like / Not Interested buttons
- Mobile-responsive design

### Recommendation Logic (Simplified)

1. Query today's historical events from database (by month/day)
2. Filter candidates by user's interest tags
3. Send candidates + user tags to GPT-4o-mini for ranking + reason generation
4. Return top 8 as the daily feed

### Tech Stack

- Frontend: Next.js + Tailwind + shadcn/ui → Vercel
- Backend: FastAPI → Railway
- Database: Supabase (PostgreSQL + Auth)
- LLM: OpenAI API (GPT-4o-mini)
- No vector DB, no Redis, no async queue

### Cost: ~$5-15/month

### Definition of Done

- [ ] User can register, login, select interest tags
- [ ] User sees personalized daily feed
- [ ] Cards show title, year, personalized reason, image
- [ ] Like/Not Interested buttons work and persist
- [ ] Deployed and accessible via mobile browser

---

## V1 — Embedding Retrieval + User Profile Evolution (Weeks 4-6)

**Goal**: Recommendation quality significantly improves; system learns from user behavior.

### New Product Features

- Behavior tracking (click, read duration, like, skip)
- User profile page (view LLM-generated natural language profile)
- Feed diversity (not all cards from the same category)
- 1-2 exploration cards per feed (expand interest boundaries)

### Recommendation Logic Upgrade

1. Pre-compute embeddings for all historical events
2. User profile → embedding → vector search for top 30-50 candidates
3. LLM reranking + personalized content generation (unchanged)
4. Weekly batch job: LLM updates user's natural language profile based on recent behavior

### Tech Stack Additions

- Vector DB: Qdrant Cloud free tier
- Embedding: OpenAI text-embedding-3-small
- Async: FastAPI BackgroundTasks or cron job for profile updates

### Cost: ~$10-20/month

### Definition of Done

- [ ] User interactions are tracked (clicks, likes, skips with timestamps)
- [ ] Embedding-based candidate retrieval is working
- [ ] User profile page shows LLM-generated natural language profile
- [ ] Profile updates weekly based on behavior
- [ ] Feed shows noticeable personalization improvement over V0

---

## V2 — Self-hosted Inference: vLLM + SGLang (Weeks 7-10)

**Goal**: Replace OpenAI API with self-hosted open-source models. Deep dive into inference serving.

### Product Changes

- No new user-facing features; pure infra swap
- Inference Gateway abstraction: one-click backend switch

### vLLM (Weeks 7-8)

Deploy Llama 3.1 8B + BGE-large, learn core concepts:

- [ ] Deploy vLLM server, run recommendation pipeline end-to-end
- [ ] Enable prefix caching, benchmark with/without
- [ ] Compare offline batch inference vs online serving
- [ ] Experiment with INT4/INT8 quantization (AWQ, GPTQ)

**Key concepts**: PagedAttention, continuous batching, KV cache management, prefix caching, quantization

### SGLang (Weeks 9-10)

Rewrite the recommendation pipeline using SGLang's programming model:

- [ ] Use SGLang frontend DSL for multi-step recommendation
- [ ] Constrained decoding for structured JSON output
- [ ] Benchmark: vLLM vs SGLang on same workload (throughput, latency, cache hit rate)

**Key concepts**: RadixAttention, constrained decoding, LLM program abstraction

### Tech Stack Additions

- GPU: RunPod / Modal on-demand (A10G)
- Monitoring: Prometheus + Grafana
- Models: Llama 3.1 8B (LLM), BGE-large (embedding)

### Cost: ~$50-80/month

---

## V3 — TensorRT-LLM + Triton + New Features (Weeks 11-14)

**Goal**: Deep dive into compilation-based optimization and production model orchestration. Add Learning Path module.

### New Product Features

- Learning Path module: set a learning goal, get daily resource recommendations
- Meme of the Day: a fun card related to today's historical events

### TensorRT-LLM (Weeks 11-12)

Compile and deploy the same Llama 8B model:

- [ ] Build-time optimization (graph optimization, kernel fusion)
- [ ] INT8/FP8 calibration-based quantization
- [ ] Benchmark: vLLM vs SGLang vs TRT-LLM (TTFT, ITL, throughput, memory)

**Key concepts**: Ahead-of-time compilation, kernel fusion, calibration-based quantization, in-flight batching

### Triton Inference Server (Weeks 13-14)

Orchestrate the full recommendation pipeline:

- [ ] Ensemble pipeline: Embedding (ONNX) → Retrieval (Python) → LLM Rerank (TRT-LLM)
- [ ] Multi-backend deployment (ONNX + TRT-LLM + Python)
- [ ] Dynamic batching configuration
- [ ] Model versioning setup

**Key concepts**: Model ensemble, multi-backend orchestration, pipeline-level batching, model versioning

### Cost: ~$80-120/month

---

## V4 — Benchmark Report + Polish (Weeks 15-16)

**Goal**: Produce a comprehensive inference engine comparison report.

### Benchmark Report

Unified workload: 100 users × 10 candidates each

| Metric | Measured across all 4 engines |
| ------ | ----------------------------- |
| TTFT (Time to First Token) | p50 / p95 / p99 |
| ITL (Inter-Token Latency) | p50 / p95 / p99 |
| Throughput | requests/sec, tokens/sec |
| GPU Memory | peak usage |
| Recommendation Quality | LLM-as-judge scoring |

Additional comparisons:
- Quantization: FP16 vs INT8 vs INT4 × 4 engines
- Prefix caching: on vs off × 4 engines
- Batch size impact on throughput

### Deliverables

- [ ] Benchmark report (blog post or GitHub README)
- [ ] Clean codebase with documentation
- [ ] Architecture diagrams
- [ ] Switch daily operation back to OpenAI API (cost saving)

### Cost: back to ~$10-15/month
