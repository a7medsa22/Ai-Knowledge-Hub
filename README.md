# 🤖 AI Knowledge Hub

> A powerful AI-powered knowledge management and research platform built with NestJS, featuring document management, intelligent summarization, Q&A capabilities, and MCP (Model Context Protocol) integration.

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Modules Overview](#-modules-overview)
- [MCP Integration](#-mcp-integration)
- [Environment Variables](#-environment-variables)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

AI Knowledge Hub is a comprehensive platform designed for researchers, students, and knowledge workers to manage their documents, notes, and tasks with the power of artificial intelligence. The platform supports:

- **Document Management**: Upload files (PDF, Word, text) or write content directly
- **AI-Powered Analysis**: Automatic summarization, Q&A, and semantic search
- **Note Taking**: Organized notes linked to documents
- **Task Management**: Track research tasks and deadlines
- **MCP Integration**: AI agents can interact with your knowledge base through standardized tools

---

## ✨ Features

### 🔐 Authentication & User Management
- JWT-based authentication
- User registration and login
- Profile management
- Role-based access control (USER, ADMIN)

### 📄 Document Management
- Create documents with rich text or upload files (PDF, Word, TXT)
- Automatic text extraction from uploaded files
- Tagging system for organization
- Public/private document control
- Full-text search with filtering
- Advanced sorting and pagination

### 📝 Notes System
- Create standalone notes or attach to documents
- Search across all notes
- Link notes to specific documents
- Recent notes dashboard

### 🤖 AI Services
- **Text Summarization**: Generate short, medium, or detailed summaries
- **Question & Answer**: Ask questions about document content
- **Semantic Search**: AI-powered similarity search (with fallback)
- **Key Point Extraction**: Automatically extract important points
- **Bulk Operations**: Process multiple documents at once
- **Provider Flexibility**: Switch between Ollama (local/free) and OpenAI

### ✅ Task Management
- Create and manage research tasks
- Priority levels (LOW, MEDIUM, HIGH, URGENT)
- Status tracking (TODO, IN_PROGRESS, DONE, CANCELLED)
- Due date tracking with overdue detection
- Task statistics and completion rates

### 🔌 MCP (Model Context Protocol)
- Standardized tool interface for AI agents
- Available tools:
  - `searchDocs`: Search through documents
  - `getDocument`: Retrieve specific documents
  - `addNote`: Create notes
  - `createTask`: Create tasks
  - `listTasks`: Query tasks
  - `getUserStats`: Get comprehensive statistics
- Batch execution support
- Quick action endpoints

### 📁 File Management
- Upload images, PDFs, Word documents, and text files
- Automatic text extraction for supported formats
- File linking to documents
- File statistics and organization
- Serve files for download/viewing

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│  (Swagger UI, Postman, Frontend Apps, AI Agents)            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway (NestJS)                   │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐   │
│  │   Auth   │   Docs   │   Notes  │   Tasks  │   MCP    │   │
│  │  Module  │  Module  │  Module  │  Module  │  Module  │   │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘   │
│  ┌──────────┬──────────┬──────────────────────────────┐     │
│  │    AI    │  Files   │         Users                │     │
│  │  Module  │  Module  │         Module               │     │
│  └──────────┴──────────┴──────────────────────────────┘     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Prisma ORM (Database Abstraction)                 │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ PostgreSQL   │  │ File System  │  │  AI Provider │       │
│  │  (Docker)    │  │  (./uploads) │  │ (Ollama/API) │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

### Backend
- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 15
- **ORM**: Prisma 5.x
- **Authentication**: JWT (Passport)
- **Validation**: class-validator, class-transformer
- **File Upload**: Multer
- **API Documentation**: Swagger/OpenAPI

### AI Integration
- **Local AI**: Ollama (llama3.1:8b, Mistral)
- **Cloud AI**: OpenAI GPT-3.5/4, Anthropic Claude (optional)
- **Text Extraction**: pdf-parse, mammoth

### Development Tools
- **Testing**: Jest
- **Linting**: ESLint
- **Formatting**: Prettier
- **Containerization**: Docker & Docker Compose

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/a7medsa22/ai-knowledge-hub.git
cd ai-knowledge-hub
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration (see [Environment Variables](#-environment-variables))

4. **Start PostgreSQL with Docker**
```bash
docker-compose up -d
```

5. **Run database migrations**
```bash
npx prisma generate
npx prisma db push
```

6. **Create uploads directory**
```bash
mkdir uploads
```

7. **Start the development server**
```bash
npm run start:dev
```

8. **Access the application**
- API: http://localhost:3000
- Swagger Documentation: http://localhost:3000/api
- pgAdmin (optional): http://localhost:8080

### Quick Start with Ollama (Local AI)

1. **Install Ollama** (https://ollama.ai)

2. **Pull a model**
```bash
ollama pull llama3.1:8b
# or
ollama pull mistral:7b
```

3. **Start Ollama**
```bash
ollama serve
```

4. **Verify in .env**
```env
AI_PROVIDER=ollama
AI_MODEL=llama3.1:8b
AI_BASE_URL=http://localhost:11434
```

---

## 📚 API Documentation

### Interactive Documentation

Once the server is running, visit:
- **Swagger UI**: https://ai-research-weathered-waterfall-4110.fly.dev/api/docs

### Authentication

Most endpoints require authentication. To authenticate:

1. **Register a user**
```bash
POST /users/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

2. **Login**
```bash
POST /users/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

3. **Use the JWT token**
```bash
Authorization: Bearer <your_jwt_token>
```

In Swagger, click the 🔓 **Authorize** button and paste your token.

---

## 🧩 Modules Overview

### 1. Auth Module
**Endpoints:**
- `POST /users/auth/register` - Register new user
- `POST /users/auth/login` - Login and get JWT token
- `POST /users/auth/verify-email` - Verify email with OTP
- `POST /users/auth/refresh` - Refresh access token
- `POST /users/auth/forgot-password` - Request password reset
- `GET /users/auth/sessions` - Get active sessions
- `DELETE /users/auth/sessions/:tokenId` - Revoke a session

### 2. Users Module
**Endpoints:**
- `GET /users/profile` - Get current user profile
- `PUT /users/profile` - Update profile
- `DELETE /users/profile` - Delete account
- `GET /users` - Get all users (admin only)

### 3. Documents Module
**Endpoints:**
- `POST /docs` - Create document (text or file upload)
- `GET /docs` - Search public documents
- `GET /docs/my-docs` - Get user's documents
- `GET /docs/tags` - Get all tags
- `GET /docs/stats` - Get statistics
- `GET /docs/:id` - Get specific document
- `PATCH /docs/:id` - Update document
- `DELETE /docs/:id` - Delete document

**Example: Create document from file**
```bash
POST /docs
Content-Type: multipart/form-data

title: "Research Paper"
file: research.pdf
tags: ai,research,ml
isPublic: true
```

### 4. Notes Module
**Endpoints:**
- `POST /notes` - Create note
- `GET /notes` - Get all notes
- `GET /notes/stats` - Get notes statistics
- `GET /notes/recent` - Get recent notes
- `GET /notes/document/:docId` - Get notes for document
- `GET /notes/:id` - Get specific note
- `PATCH /notes/:id` - Update note
- `DELETE /notes/:id` - Delete note

### 5. AI Module
**Endpoints:**
- `GET /ai/status` - Check AI service availability
- `POST /ai/summarize` - Summarize text or document
- `POST /ai/qa` - Ask questions about content
- `POST /ai/search` - Semantic search
- `POST /ai/extract-key-points` - Extract key points
- `POST /ai/bulk-summarize` - Summarize multiple documents

**Example: Summarize document**
```json
POST /ai/summarize
{
  "docId": "doc123",
  "length": "medium"
}
```

**Example: Q&A**
```json
POST /ai/qa
{
  "docId": "doc123",
  "question": "What are the main findings?"
}
```

### 6. Tasks Module
**Endpoints:**
- `POST /tasks` - Create task
- `GET /tasks` - Get all tasks with filters
- `GET /tasks/stats` - Get task statistics
- `GET /tasks/upcoming` - Get upcoming tasks
- `GET /tasks/overdue` - Get overdue tasks
- `GET /tasks/:id` - Get specific task
- `PATCH /tasks/:id` - Update task
- `PATCH /tasks/:id/status` - Update task status
- `DELETE /tasks/:id` - Delete task

### 7. MCP Module
**Endpoints:**
- `GET /mcp/tools` - List available tools
- `GET /mcp/health` - Health check
- `POST /mcp/execute` - Execute single tool
- `POST /mcp/execute-batch` - Execute multiple tools
- Quick actions:
  - `POST /mcp/quick/search-docs`
  - `POST /mcp/quick/add-note`
  - `POST /mcp/quick/create-task`
  - `GET /mcp/quick/user-stats`

**Example: Execute tool**
```json
POST /mcp/execute
{
  "toolName": "searchDocs",
  "parameters": {
    "query": "machine learning",
    "limit": 5
  }
}
```

### 8. Files Module
**Endpoints:**
- `POST /files/upload` - Upload file
- `POST /files/upload-and-extract` - Upload file and create document
- `GET /files` - Get all files
- `GET /files/stats` - Get file statistics
- `GET /files/document/:docId` - Get files for document
- `GET /files/:id` - Get file metadata
- `GET /files/serve/:filename` - Serve/download file
- `DELETE /files/:id` - Delete file

---

## 🔌 MCP Integration

The Model Context Protocol (MCP) allows AI agents to interact with your knowledge base through standardized tools.

### Available Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `searchDocs` | Search documents | query, limit, tags |
| `getDocument` | Get specific document | docId |
| `addNote` | Create a note | content, docId (optional) |
| `createTask` | Create a task | title, description, priority, dueDate |
| `listTasks` | List tasks with filters | status, priority, limit |
| `getUserStats` | Get user statistics | none |

### Example Usage

```javascript
// Execute a single tool
const response = await fetch('http://localhost:3000/mcp/execute', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    toolName: 'searchDocs',
    parameters: {
      query: 'neural networks',
      limit: 3
    }
  })
});

// Batch execution
const batchResponse = await fetch('http://localhost:3000/mcp/execute-batch', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tools: [
      { toolName: 'searchDocs', parameters: { query: 'AI' } },
      { toolName: 'listTasks', parameters: { status: 'TODO' } },
      { toolName: 'getUserStats' }
    ]
  })
});
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://your-db-user:your-db-password@localhost:5432/your-db-name?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Application
NODE_ENV="development"
PORT=3000
APP_URL="http://localhost:3000"

# AI Configuration
AI_PROVIDER="ollama"              # ollama | openai | anthropic
AI_MODEL="llama3.1:8b"            # Model name
AI_API_KEY=""                     # Empty for Ollama, required for OpenAI/Anthropic
AI_BASE_URL="http://localhost:11434"  # Ollama URL or API endpoint

# File Upload
MAX_FILE_SIZE=10485760            # 10MB in bytes
```

### AI Providers

**Ollama (Local, Free)**
```env
AI_PROVIDER=ollama
AI_MODEL=llama3.1:8b
AI_BASE_URL=http://localhost:11434
AI_API_KEY=
```

**OpenAI**
```env
AI_PROVIDER=openai
AI_MODEL=gpt-3.5-turbo
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=sk-your-api-key-here
```

**Anthropic Claude**
```env
AI_PROVIDER=anthropic
AI_MODEL=claude-3-sonnet
AI_BASE_URL=https://api.anthropic.com
AI_API_KEY=your-anthropic-api-key
```

---

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

### Test Structure

```
src/
├── mcp/
│   ├── mcp.service.spec.ts      # Unit tests
│   └── mcp.controller.spec.ts   # Unit tests
test/
└── mcp.e2e-spec.ts               # Integration tests
```

# the rest of the tests in next version 

---

## 🚀 Deployment

### Production URL
The application is deployed and live at:
- **API Base URL**: [https://ai-research-weathered-waterfall-4110.fly.dev](https://ai-research-weathered-waterfall-4110.fly.dev)
- **Swagger Documentation**: [https://ai-research-weathered-waterfall-4110.fly.dev/api/docs](https://ai-research-weathered-waterfall-4110.fly.dev/api/docs)
- **GraphQL Endpoint**: [https://ai-research-weathered-waterfall-4110.fly.dev/graphql](https://ai-research-weathered-waterfall-4110.fly.dev/graphql)

### Fly.io Deployment
The application is hosted on Fly.io.

1. **Deploying Updates**
```bash
fly deploy
```

2. **Managing Secrets**
```bash
fly secrets set KEY=VALUE
```

### Docker Production Build

1. **Build the image**
```bash
docker build -t ai-knowledge-hub .
```

2. **Run with docker-compose**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment

1. **Build the application**
```bash
npm run build
```

2. **Run migrations**
```bash
npx prisma migrate deploy
```

3. **Start production server (Optional)** 
```bash
npm run start:prod
```

### Ready to deploy (Optional)

- **Railway**: Direct deployment from GitHub
- **Render**: Free tier available
- **Heroku**: With PostgreSQL add-on
- **DigitalOcean**: App Platform or Droplets
- **AWS**: EC2, ECS, or Elastic Beanstalk

---


## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Ahmed Salah Sotohy**
- GitHub: [@a7medsa22](https://github.com/a7medsa22)
- LinkedIn: [Ahmed Salah](https://linkedin.com/in/ahmed-salah-54822625a)
- Email: abostohy123@gmail.com

---

## 🙏 Acknowledgments

- NestJS team for the amazing framework
- Prisma team for the excellent ORM
- Ollama for making local AI accessible
- The open-source community

---

## 📞 Support

For support, email abostohy123@gmail.com or join our discord channel.

---

**⭐ Star this repo if you find it helpful!**
