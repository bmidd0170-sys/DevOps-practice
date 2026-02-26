# Application Features

## Overview
Docker Lab - Notes API is a full-stack web application built with Next.js that provides a RESTful API for managing notes. The application is containerized with Docker for seamless development and production deployments.

## Core Features

### 1. Notes Management
- **Create Notes**: Add new notes with title and content
- **Read Notes**: Retrieve all notes or specific notes by ID
- **Update Notes**: Modify existing note content and title
- **Delete Notes**: Remove notes from the system
- **Timestamps**: Automatic tracking of creation and update times

### 2. REST API Endpoints

#### Health Check
- **GET /api/health**
  - Verifies application and database connectivity
  - Returns health status and database connection status
  - Includes server timestamp for synchronization

#### Notes Management
- **GET /api/notes**
  - Retrieve all notes sorted by most recent first
  - Returns complete note data with timestamps
  
- **POST /api/notes**
  - Create a new note
  - Requires title and content in request body
  
- **GET /api/notes/[id]**
  - Retrieve a specific note by ID
  
- **PUT /api/notes/[id]**
  - Update an existing note by ID
  
- **DELETE /api/notes/[id]**
  - Remove a note from the system

### 3. Technology Stack

#### Frontend
- **Next.js 16.1.6**: Modern React framework with SSR/SSG capabilities
- **React 19.2.3**: User interface components
- **TypeScript 5**: Type-safe JavaScript
- **Tailwind CSS 4**: Utility-first CSS framework
- **PostCSS**: CSS processing and transformations

#### Backend
- **Next.js API Routes**: Serverless backend functions
- **Prisma 6.19.2**: Modern ORM with type safety
- **Prisma Adapter for PostgreSQL**: Database connectivity layer

#### Database
- **PostgreSQL**: Relational database for persistent data storage
- **pg 8.18.0**: PostgreSQL Node.js client
- **Prisma Migrations**: Version-controlled database schema management

#### DevOps
- **Docker**: Containerization for consistent environments
- **Docker Compose**: Multi-container orchestration
- **Environment Variable Management**: Secure configuration handling

### 4. Data Model

#### Note Schema
```
- id (Integer): Unique identifier, auto-incrementing
- title (String): Note title
- content (String): Note body content
- createdAt (DateTime): Creation timestamp
- updatedAt (DateTime): Last modification timestamp
```

### 5. Development Features

#### Type Safety
- Full TypeScript support across frontend and backend
- Type-safe Prisma client for database queries
- React component type definitions

#### Database Management
- Automated migrations with Prisma Migrate
- Development database prepared with migration locks
- Support for schema versioning and rollbacks

#### Development Server
- Hot reload with Next.js dev server
- Automatic TypeScript compilation
- Built-in ESLint support

#### Production Ready
- Optimized Next.js build system
- Production-grade database connections
- Docker containerization for scalability

### 6. Docker Support

#### Development Environment
- Containerized development setup
- PostgreSQL service in Docker Compose
- Network isolation and connectivity
- Volume mounts for hot code reloading

#### Production Deployment
- Multi-stage Dockerfile for optimized images
- Minimal final image size
- Security best practices

## Getting Started

### Prerequisites
- Node.js 18+
- Docker and Docker Compose (for containerized development)
- PostgreSQL (or use Docker Compose)

### Quick Start

**Local Development:**
```bash
npm install
npx prisma migrate dev
npm run dev
```

**Docker Development:**
```bash
docker-compose up --build
```

## Future Enhancement Opportunities

- User authentication and authorization
- Note sharing and collaboration features
- Note tagging and search functionality
- Rich text editing support
- Note attachments and media
- Real-time synchronization with WebSockets
- Export notes to multiple formats (PDF, Markdown)
- Note versioning and revision history
