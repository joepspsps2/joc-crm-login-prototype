# Overview

This is a full-stack React application with an Express backend that provides a unified identity system for QR code-based authentication and file management. The application allows users to authenticate through multiple providers (Google, Apple, Facebook, LINE, email) and manage orders with associated file downloads. It features a mobile-first design with QR code integration for seamless user onboarding.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and React Context for authentication
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Firebase Authentication with JWT token verification
- **Session Management**: Express sessions with PostgreSQL session store
- **API Design**: RESTful endpoints under `/api` prefix
- **Error Handling**: Centralized error middleware with structured error responses

## Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Schema Management**: Drizzle migrations with schema definitions in shared directory
- **In-Memory Fallback**: MemStorage implementation for development/testing

## Database Schema Design
The system uses three main entities:
- **Users**: Unified identity across multiple auth providers with Firebase UID mapping
- **Orders**: File delivery system with status tracking and file metadata
- **Activity Logs**: Audit trail for user actions across different providers

## Authentication and Authorization
- **Multi-Provider Support**: Firebase Authentication handling Google, Apple, Facebook, LINE, and email/password
- **Unified Identity**: Custom user management system that maps Firebase UIDs to internal unified IDs
- **Token Verification**: JWT middleware for API endpoint protection
- **Account Linking**: Support for linking multiple authentication providers to single accounts

## External Dependencies

### Authentication Services
- **Firebase Authentication**: Multi-provider authentication (Google, Apple, Facebook, LINE, email)
- **Firebase Firestore**: Document database for Firebase integration
- **Firebase Storage**: File storage service

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL dialect

### Development Tools
- **Vite**: Frontend build tool with HMR and plugin ecosystem
- **Replit Integration**: Development environment plugins for cartographer and dev banner
- **ESBuild**: Backend bundling for production builds

### UI and Styling
- **Radix UI**: Headless component primitives for accessibility
- **shadcn/ui**: Pre-built component library built on Radix UI
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography

### Form and Validation
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: TypeScript-first schema validation library
- **@hookform/resolvers**: Integration between React Hook Form and Zod

The architecture follows a monorepo structure with shared types and schemas, enabling type safety across the full stack while maintaining clear separation between client and server concerns.

# Recent Changes

## Apple ID Authentication System Completion (September 19, 2025)

Successfully implemented and tested complete Apple ID OAuth authentication flow:

### Key Achievements
- **Complete Apple OAuth Integration**: Successfully configured Apple ID login with proper App ID, Service ID, and Firebase Console setup
- **Authentication Flow Resolution**: Fixed AuthContext dependency issues that were preventing proper React context initialization
- **API Authentication Fix**: Enhanced queryClient to automatically attach Firebase JWT tokens to all API requests, resolving 401 Unauthorized errors
- **End-to-End Testing**: Verified complete flow from QR landing → auth selection → Apple OAuth → dashboard with successful user creation
- **Code Quality**: Added comprehensive logging for debugging and error handling throughout the authentication pipeline

### Technical Implementation
- Removed unnecessary authentication providers (LINE, Facebook, phone) to streamline the system
- Enhanced Apple provider configuration with email and name scopes for better user data collection
- Implemented automatic navigation to dashboard after successful authentication and unified user record creation
- Fixed React context hierarchy issues by removing useLocation dependency from AuthProvider
- Updated both apiRequest() and getQueryFn() to include Authorization headers with Firebase ID tokens

### Testing Results
- Apple OAuth redirect flow completes successfully
- Dashboard loads with authenticated user information (name, email)
- File portal and protected API endpoints return 200 status codes instead of 401
- Console logs confirm "✅ Firebase token attached" for all authenticated requests
- Unified user record creation and updates work correctly via /api/users endpoint