# 📘 Knowledge Platform – Docs, Notes & AI


<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>
<!-- #DATABASE_URL="prisma+postgres://localhost:51213/?api_key=eyJkYXRhYmFzZVVybCI6InBvc3RncmVzOi8vcG9zdGdyZXM6cG9zdGdyZXNAbG9jYWxob3N0OjUxMjE0L3RlbXBsYXRlMT9zc2xtb2RlPWRpc2FibGUmY29ubmVjdGlvbl9saW1pdD0xJmNvbm5lY3RfdGltZW91dD0wJm1heF9pZGxlX2Nvbm5lY3Rpb25fbGlmZXRpbWU9MCZwb29sX3RpbWVvdXQ9MCZzaW5nbGVfdXNlX2Nvbm5lY3Rpb25zPXRydWUmc29ja2V0X3RpbWVvdXQ9MCIsIm5hbWUiOiJkZWZhdWx0Iiwic2hhZG93RGF0YWJhc2VVcmwiOiJwb3N0Z3JlczovL3Bvc3RncmVzOnBvc3RncmVzQGxvY2FsaG9zdDo1MTIxNS90ZW1wbGF0ZTE_c3NsbW9kZT1kaXNhYmxlJmNvbm5lY3Rpb25fbGltaXQ9MSZjb25uZWN0X3RpbWVvdXQ9MCZtYXhfaWRsZV9jb25uZWN0aW9uX2xpZmV0aW1lPTAmcG9vbF90aW1lb3V0PTAmc2luZ2xlX3VzZV9jb25uZWN0aW9ucz10cnVlJnNvY2tldF90aW1lb3V0PTAifQ"DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/ai_knowledge_hub?schema=public" -->

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->


## 🚀 Overview

A lightweight platform to manage **Documents, Notes, and Files** with integrated **AI features**:

* Summarize documents and notes.
* Generate Q\&A from text.
* Perform semantic search across stored data.

It is built with:

* **NestJS + Prisma + PostgreSQL**
* **AI Integration** (local Ollama or external providers)
* **MCP Tool Server** to allow AI to execute system actions (e.g., searchDocs, addNote).

---

## 🛠️ Tech Stack

* **Backend:** NestJS (REST APIs)
* **Database:** PostgreSQL + Prisma ORM
* **AI:** Ollama (local, free) or external providers (OpenAI, Anthropic, OpenRouter)
* **MCP:** Node Tool Server (interacts with the API)
* **Docs:** Swagger + Postman Collection

---

## 📂 Project Structure

```
apps/api (NestJS backend)
  src/
    auth/        → Authentication (JWT)
    users/       → User management
    knowledge/   → Docs, Notes, Tags
    files/       → File uploads
    ai/          → Summarization / QA / Semantic Search
    mcp/         → Tool definitions
    common/      → Shared utils
    prisma/      → PrismaService + schema

prisma/schema.prisma → Database schema

tools/mcp-server (Node Tool Server)
```

---

## 🔌 API Endpoints (Samples)

### Auth

* `POST /auth/signup` – Create a new user
* `POST /auth/login` – Login with JWT

### Knowledge

* `POST /docs` – Create document
* `GET /docs/:id` – Fetch document
* `POST /docs/:id/notes` – Add note to document
* `GET /notes` – List/search notes

### AI

* `POST /ai/summarize` → Get summary for text/doc
* `POST /ai/qa` → Ask question and get answer from doc
* `POST /ai/search` → Semantic search over docs/notes

### MCP Tools

* `POST /mcp/tools/searchDocs` → Search documents
* `POST /mcp/tools/addNote` → Add note to doc
* `POST /mcp/tools/listTasks` → List user tasks

---

## ⚙️ Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Run PostgreSQL (via Docker)**

   ```bash
   docker-compose up -d
   ```

3. **Apply database migrations**

   ```bash
   npx prisma migrate dev
   ```

4. **Start API server**

   ```bash
   npm run start:dev
   ```

5. **Run MCP Tool Server**

   ```bash
   cd tools/mcp-server
   npm run start
   ```

---

## 🪜 Contribution Guide

* Each issue will specify a feature or bugfix (e.g., `Add GET /files endpoint`).
* Create a **new branch** with the issue ID.
* Submit a **Pull Request** with a short description of changes.
* Ensure before merging:

  * ✅ Tests pass
  * ✅ Swagger docs updated
  * ✅ ESLint/Prettier clean

---

## 💡 Why this project?

* Combines **Backend + AI + MCP** in a single project.
* Showcases experience in **modern AI integration (LLMs + Tool Use)**.
* Easy to demo with **Swagger, README, and seed data**.
