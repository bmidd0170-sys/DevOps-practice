# Application Features (TS.5.3)

## Overview
Docker Lab - Notes API is a full-stack web application built with Next.js that provides a RESTful API for managing notes. The application is containerized with Docker for seamless development and production deployments.

---

## Core Features

Students will use these key features in the application:

### 1. Create New Notes
Users can create new notes by providing a title and content. Each note is automatically timestamped with creation date and time. The API validates input and stores the note in the database.

**API Endpoint**: `POST /api/notes`

### 2. View All Notes
Users can retrieve a complete list of all notes in the system, sorted by most recent notes first. This allows users to see their note library and browse previously created notes.

**API Endpoint**: `GET /api/notes`

### 3. View Individual Notes
Users can retrieve a specific note by its unique ID. This allows focused reading and reference of particular notes without viewing the entire library.

**API Endpoint**: `GET /api/notes/[id]`

### 4. Update Existing Notes
Users can modify the title and content of existing notes. The application tracks when each update occurs with an automatic timestamp, maintaining a record of when notes were last modified.

**API Endpoint**: `PUT /api/notes/[id]`

### 5. Delete Notes
Users can permanently remove notes from the system. This allows users to manage their note collection and remove outdated or unnecessary notes.

**API Endpoint**: `DELETE /api/notes/[id]`

### 6. System Health Monitoring
Users and administrators can check if the application and database are functioning properly. The health check endpoint returns the system status and database connectivity status.

**API Endpoint**: `GET /api/health`

---

## System Needs (Technical Requirements)

The application requires the following technical components and configurations to function properly:

### 1. Database Connectivity
- **Requirement**: PostgreSQL database must be running and accessible
- **Details**: The application uses PostgreSQL for persistent data storage. A valid `DATABASE_URL` environment variable must be configured that points to an accessible PostgreSQL instance
- **Impact**: Without database connectivity, the application cannot store or retrieve notes
- **Configuration**: Specified in `.env.local` or Docker Compose environment variables

### 2. Application Server Runtime
- **Requirement**: Node.js 18+ runtime environment
- **Details**: The application is built on Next.js which requires Node.js. The server must have npm/yarn package manager to install dependencies
- **Impact**: Without Node.js, the application cannot run or execute API endpoints
- **Configuration**: Install Node.js and npm before running locally

### 3. Container Orchestration (Docker)
- **Requirement**: Docker and Docker Compose for containerized deployment
- **Details**: The application includes Dockerfile and docker-compose.yml for containerized development and production. Docker Compose manages multi-container setup including the app and PostgreSQL database
- **Impact**: Enables consistent development environments across team members and simplifies deployment
- **Configuration**: Run with `docker-compose up --build`

### 4. Type Safety and Build Tools
- **Requirement**: TypeScript compiler and build pipeline
- **Details**: The entire codebase is written in TypeScript. The build process compiles TypeScript to JavaScript before deployment
- **Impact**: Ensures type safety, catches errors at compile time, and produces optimized production builds
- **Configuration**: Run `npm run build` to generate production build

### 5. Environment Variables
- **Requirement**: Proper environment configuration for different deployment stages
- **Details**: The application requires environment variables such as `DATABASE_URL`, `NODE_ENV`, and other configuration values
- **Impact**: Allows the same codebase to work in development, staging, and production with different configurations
- **Configuration**: Create `.env.local` for local development, `.env.production` for production

### 3. Technology Stack

#### Frontend Technologies
- **Next.js 16.1.6**: Modern React framework with Server-Side Rendering (SSR) and Static Site Generation (SSG)
- **React 19.2.3**: Library for building interactive user interfaces
- **TypeScript 5**: Strongly-typed JavaScript for safer code development
- **Tailwind CSS 4**: Utility-first CSS framework for responsive styling
- **PostCSS**: CSS processing tool for advanced styling transformations

#### Backend Technologies
- **Next.js API Routes**: Serverless backend functions for REST API endpoints
- **Prisma 6.19.2**: Modern Object-Relational Mapping (ORM) for database operations
- **Prisma Adapter for PostgreSQL**: Bridge between Prisma and PostgreSQL database
- **Node.js pg module 8.18.0**: PostgreSQL client for direct database communication

#### Database Technologies
- **PostgreSQL**: Enterprise-grade relational database for data persistence
- **Prisma Migrations**: Version control system for database schema changes
- **Connection Pooling**: Efficient database connection management

#### DevOps/Deployment Technologies
- **Docker**: Container platform for application isolation and deployment
- **Docker Compose**: Tool for defining and running multi-container applications
- **Environment Variables**: Configuration management for different deployment stages

### 4. Data Model

#### Note Schema Definition
The application uses the following data model for storing notes in PostgreSQL:

```plaintext
Model: Note
├── id (Integer)
│   ├── Function: Unique identifier for each note
│   └── Properties: Auto-incrementing, Primary Key
├── title (String)
│   ├── Function: Brief title or heading for the note
│   └── Properties: Required field
├── content (String)
│   ├── Function: Main body text of the note
│   └── Properties: Required field
├── createdAt (DateTime)
│   ├── Function: Records when the note was created
│   └── Properties: Auto-set to current timestamp, immutable
└── updatedAt (DateTime)
    ├── Function: Tracks when the note was last modified
    └── Properties: Auto-updated on any change
```

---

## Getting Started

### Prerequisites
- **Node.js 18+**: Required for running the application
- **npm/yarn**: Package manager for installing dependencies
- **PostgreSQL**: Database server (can be run via Docker Compose)
- **Docker and Docker Compose** (optional): For containerized development

### Quick Start - Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file with your database URL:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/notesdb"
   ```

3. **Run database migrations:**
   ```bash
   npx prisma migrate dev
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   Open [http://localhost:3000](http://localhost:3000) in your browser

### Quick Start - Docker Development

Run the entire application stack in Docker:

```bash
docker-compose up --build
```

The application will be available at [http://localhost:3000](http://localhost:3000)

---

## Development Features

### Type Safety & Code Quality
- Full TypeScript support across frontend and backend
- Type-safe Prisma client with auto-generated types
- React component type definitions with @types packages
- Compile-time type checking prevents runtime errors

### Database Management
- Automated migrations with Prisma Migrate
- Database schema versioning and history tracking
- Support for rolling back migrations
- Development database auto-setup

### Development Tools
- Hot reload with Next.js development server
- Automatic TypeScript compilation
- Built-in development error overlay
- Integrated Next.js debugging capabilities

### Production Optimization
- Optimized Next.js production build
- Code splitting and lazy loading
- Image optimization
- CSS and JavaScript minification

---

## Future Enhancement Opportunities

- User authentication and authorization system
- Note sharing and collaboration features
- Search functionality with keyword indexing
- Note tagging and categorization
- Rich text editor with formatting
- File attachments and media support
- Real-time synchronization with WebSockets
- Export notes to PDF, Markdown, or Word formats
- Note versioning and revision history
- Dark mode support
- Mobile-responsive design improvements
