# FashionMirror - AI-Powered Fashion Try-On Application

## Overview

FashionMirror is a modern web application that leverages Google Gemini's AI image generation capabilities to provide virtual fashion try-on experiences. Users can register accounts, upload their photos, and see how different clothing items would look on them using advanced AI image processing. The application features user authentication with email verification, personalized fashion libraries with shared and private collections, and user-specific activity history with complete data isolation for privacy and security.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### September 10, 2025 - Text Prompt Functionality Implementation
- **Added complete text prompt functionality for creative control** - Users can now provide custom instructions for pose changes, background modifications, and styling preferences
- **Enhanced AI generation capabilities** - All generation workflows (progressive, simultaneous, batch, single-item) now incorporate user text prompts as "USER CREATIVE INSTRUCTIONS" 
- **Frontend enhancements** - Added text input field in TryOnWorkspace component with 500-character limit and real-time character counter
- **Complete API integration** - Updated all client-side API methods and backend endpoints to handle text prompt parameter with proper validation
- **Data persistence** - Text prompts are stored in try-on result metadata for future reference and displayed in user galleries
- **Server-side validation** - Added robust validation with proper error handling (400 Bad Request) for invalid text prompts

### September 10, 2025 - User Authentication and Data Isolation Implementation
- Implemented complete user authentication system with email verification
- Added user-specific activity history - each user sees only their own try-on results  
- Created personalized fashion libraries with shared default items + user private collections
- Applied security hardening with session fixation protection and robust data isolation
- Updated all frontend components to use authenticated user context
- Implemented server-side authentication middleware preventing cross-user data access

## System Architecture

### Frontend Architecture
The client-side is built using **React 18** with **TypeScript** and follows a component-based architecture. The application uses **Vite** as the build tool for fast development and optimized production builds. State management is handled through **React Query (@tanstack/react-query)** for server state and React's built-in state management for local component state.

**UI Component System**: The application uses **shadcn/ui** components built on top of **Radix UI** primitives, providing a consistent and accessible design system. Styling is implemented using **Tailwind CSS** with a custom design token system that supports both light and dark themes.

**Routing**: Client-side routing is managed by **Wouter**, a lightweight routing library that provides declarative route definitions without the complexity of larger routing solutions.

### Backend Architecture
The server follows a **Node.js/Express** architecture pattern with TypeScript support. The API is structured as a RESTful service with dedicated route handlers for different resource types (fashion items, try-on results, user management).

**Authentication System**: The application implements **session-based authentication** with secure session management using PostgreSQL storage. Features include user registration, email verification, secure login/logout with session fixation protection, and authentication middleware that ensures data isolation between users.

**Development Setup**: The application uses **Vite middleware integration** during development, allowing the Express server to serve both API routes and the frontend application seamlessly. This eliminates the need for separate development servers.

**File Upload Handling**: **Multer** middleware processes image uploads with memory storage, implementing file size limits (10MB) and type validation to ensure only image files are accepted.

### Data Storage Solutions
The application implements a **dual storage strategy**:

**Production Database**: **PostgreSQL** with **Drizzle ORM** for type-safe database operations. The schema defines three main entities with user ownership and data isolation:
- Users (authentication, email verification, and user management)
- Fashion Items (shared default collection + user-specific private uploads with userId and isShared fields)
- Try-On Results (user-isolated AI-generated virtual try-on images)

**Development Storage**: **In-memory storage implementation** using JavaScript Maps for rapid development and testing without database dependencies. This includes pre-seeded fashion items for immediate functionality.

**Database Migrations**: Drizzle Kit handles schema migrations with automatic UUID generation for primary keys and proper foreign key relationships.

### External Dependencies

**AI Image Generation**: **Google Gemini 2.5 Flash** API provides the core virtual try-on functionality. The service accepts model images and fashion item images, then generates realistic composite images showing the person wearing the selected clothing.

**Database Hosting**: **Neon Database** provides the PostgreSQL database service with serverless scaling capabilities. Connection pooling is handled through the Neon serverless driver.

**Session Management**: **connect-pg-simple** manages user sessions with PostgreSQL storage, providing persistent login states across browser sessions.

**Image Processing**: The application converts images to base64 format for AI processing while maintaining image quality and handling various input formats.

**Font Integration**: **Google Fonts** provides typography with multiple font families including DM Sans, Fira Code, Geist Mono, and Architects Daughter for diverse design elements.

**Development Tools**: 
- **Replit integration** with runtime error handling and development banner
- **ESBuild** for production builds with Node.js platform targeting
- **PostCSS** with Autoprefixer for CSS processing