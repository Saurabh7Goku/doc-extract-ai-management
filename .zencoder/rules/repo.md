---
description: Repository Information Overview
alwaysApply: true
---

# Repository Information Overview

## Repository Summary
**Saas PDF** is a full-stack SaaS application for processing and managing PDF documents with AI capabilities. The application features a Next.js frontend with TypeScript and a FastAPI backend with async support, PostgreSQL database, Redis caching, and Celery task queue. It includes admin and member portals with authentication, WebSocket support for real-time updates, and PDF processing utilities with OCR and AI integration.

## Repository Structure
The project is organized as a monorepo with separate frontend and backend services, containerized using Docker:

### Main Repository Components
- **backend/**: Python FastAPI application handling API endpoints, authentication, PDF processing, and Celery tasks
- **frontend/**: Next.js application with TypeScript, providing admin dashboard and member interface
- **docker-compose.yml**: Multi-service container orchestration (PostgreSQL, Redis, Backend API, Celery, Frontend, Nginx)
- **nginx.conf**: Reverse proxy configuration for serving frontend and backend
- **uploads/**: Directory for storing processed PDFs and temporary files

---

## Projects

### Backend (Python/FastAPI)
**Configuration File**: `backend/requirements.txt`, `backend/Dockerfile`

#### Language & Runtime
**Language**: Python  
**Version**: 3.12  
**Runtime**: Python 3.12-slim Docker image  
**Framework**: FastAPI  
**Server**: Uvicorn  

#### Dependencies
**Main Dependencies**:
- fastapi - Web framework
- uvicorn - ASGI server
- sqlalchemy - ORM for database operations
- psycopg2-binary - PostgreSQL driver
- pydantic - Data validation
- python-jose[cryptography] - JWT authentication
- passlib[argon2] - Password hashing
- celery[gevent] - Async task queue
- redis - Cache and message broker
- pytesseract - OCR text extraction
- PyPDF2 - PDF manipulation
- pdf2image - PDF to image conversion
- google-generativeai - AI integration
- websockets - WebSocket support
- alembic - Database migrations
- pytest - Testing framework

#### Architecture
**Main Entry Point**: `backend/app/main.py` - FastAPI application initialized with `/app.api.v1` routes  
**Application Structure**:
- `app/api/v1/` - API endpoints (auth, users, jobs)
- `app/core/` - Configuration, database, security, WebSocket management
- `app/models.py` - SQLAlchemy database models
- `app/schemas.py` - Pydantic request/response schemas
- `app/crud.py` - Database operations
- `app/tasks.py` - Celery async tasks for PDF processing
- `app/auth.py` - Authentication logic

#### Build & Installation
```bash
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
python celery_worker.py  # Start Celery worker for async tasks
```

#### Docker
**Dockerfile**: `backend/Dockerfile`  
**Base Image**: python:3.12-slim  
**Build Steps**:
- Install system dependencies (tesseract-ocr, libtesseract-dev, poppler-utils)
- Copy requirements and install Python packages
- Copy application code
- Configure port 8000

**Service Configuration (docker-compose)**:
- Container name: backend
- Port mapping: 8000:8000
- Volumes: `./backend:/app` (hot reload)
- Environment: DATABASE_URL, REDIS_URL, SECRET_KEY
- Depends on: PostgreSQL, Redis

#### Testing
**Framework**: pytest  
**Test Location**: `backend/tests/`  
**Test Files**:
- `test_auth.py` - Authentication tests
- `test_jobs.py` - Job processing tests
- `test_tasks.py` - Celery task tests

**Run Command**:
```bash
pytest backend/tests/
```

---

### Frontend (TypeScript/Next.js)
**Configuration File**: `frontend/package.json`, `frontend/Dockerfile`

#### Language & Runtime
**Language**: TypeScript  
**Version**: 5.x  
**JavaScript Runtime**: Node.js 18  
**Framework**: Next.js  
**Version**: 14.0.0  
**React Version**: 18.x  

#### Dependencies
**Main Dependencies**:
- react@^18 - UI library
- react-dom@^18 - React DOM renderer
- next@14.0.0 - Framework and build system
- typescript@^5 - Type checking
- axios@^1.6.0 - HTTP client
- react-dropzone@^14.2.3 - File upload component
- react-hot-toast@^2.6.0 - Toast notifications
- tailwindcss@^3.3.0 - Utility-first CSS framework

**Development Dependencies**:
- @types/node@^20 - Node type definitions
- @types/react@^18 - React type definitions
- @types/react-dom@^18 - React DOM type definitions
- eslint@^8 - Code linting
- eslint-config-next@14.0.0 - Next.js ESLint configuration
- postcss@^8 - CSS processor for Tailwind
- autoprefixer@^10 - CSS vendor prefixing

#### Architecture
**Application Structure**:
- `app/` - Next.js App Router directory with pages and layouts
  - `admin/` - Admin dashboard interface (dashboard, jobs management, login, register)
  - `member/` - Member portal interface (login, working area)
  - `api/` - API route handlers and WebSocket client
- `components/` - Reusable React components
- `hooks/` - Custom React hooks
- `lib/` - Utility functions and helpers
- `globals.css` - Global styles
- `layout.tsx` - Root layout component
- `page.tsx` - Home/index page

**Configuration Files**:
- `next.config.js` - Next.js build configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `tsconfig.json` - TypeScript configuration

#### Build & Installation
```bash
npm install
npm run dev      # Development server on port 3000
npm run build    # Production build
npm start        # Production server
npm run lint     # Run ESLint
```

#### Docker
**Dockerfile**: `frontend/Dockerfile`  
**Base Image**: node:18-alpine  
**Build Steps**:
- Copy package files
- Install dependencies
- Copy application source
- Build Next.js application
- Expose port 3000

**Service Configuration (docker-compose)**:
- Container name: frontend
- Port mapping: 3000:3000
- Volumes: `./frontend:/app` (hot reload)
- Depends on: backend

#### Testing
**No formal testing framework configured in package.json** - ESLint is available for code quality checks
```bash
npm run lint
```

---

### Database & Infrastructure

#### PostgreSQL
**Service**: PostgreSQL 15  
**Configuration**:
- Database: `saas_db`
- Port: 5432
- Credentials: user/password (configured via environment)
- Health check: pg_isready validation
- Volume: Persistent storage via Docker volume

#### Redis
**Service**: Redis 7-alpine  
**Configuration**:
- Port: 6379
- Database: 0 (default)
- Purpose: Cache layer and Celery message broker

#### Celery Worker
**Service**: Python/Celery task queue  
**Configuration**:
- Docker image: Custom built from backend Dockerfile
- Environment: DATABASE_URL, REDIS_URL
- Depends on: PostgreSQL, Redis
- Purpose: Async PDF processing tasks

#### Nginx
**Service**: nginx:alpine  
**Configuration**: `nginx.conf`  
**Purpose**: Reverse proxy and static file serving  
**Port**: 80  
**Upstream Routing**:
- Frontend: 3000
- Backend API: 8000  
**Static Files**: `/uploads` directory serving

### Docker Compose Setup
**File**: `docker-compose.yml`  
**Services**: 6 containers (PostgreSQL, Redis, Backend API, Celery Worker, Frontend, Nginx)  
**Network**: Default bridge network with service discovery  
**Volumes**: Source code mounts for hot reload development  
**Ports Exposed**: 80 (Nginx), 5432 (PostgreSQL), 6379 (Redis)

---

## Development Workflow

### Setup
```bash
# Clone and install
cd backend && pip install -r requirements.txt
cd ../frontend && npm install

# Configure environment
cp backend/.env.example backend/.env
# Edit .env with DATABASE_URL, REDIS_URL, SECRET_KEY, etc.
```

### Local Development
```bash
# Start all services
docker-compose up

# Or run individually:
# Backend
cd backend && uvicorn app.main:app --reload

# Frontend
cd frontend && npm run dev

# Celery worker
cd backend && python celery_worker.py
```

### Environment Variables
**Backend** (.env):
- DATABASE_URL: PostgreSQL connection string
- REDIS_URL: Redis connection string
- SECRET_KEY: JWT secret
- ADMIN_SECRET_KEY: Admin authentication
- Various API keys for AI services

**Frontend** (.env):
- API endpoints and configuration

---

## Key Features
- **PDF Processing**: OCR, text extraction, image conversion
- **AI Integration**: Google Generative AI for intelligent document analysis
- **Real-time Updates**: WebSocket support for live job status
- **Authentication**: JWT-based with role-based access (Admin/Member)
- **Async Processing**: Celery task queue for long-running PDF operations
- **Database**: SQLAlchemy ORM with PostgreSQL
- **Containerization**: Docker Compose for reproducible environments