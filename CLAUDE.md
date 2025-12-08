# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
# Development
npm run dev              # Start dev server (runs tsx server/index.ts)

# Production build
npm run build            # Build client and server
npm run build:client     # Build Vite frontend only
npm run build:server     # Bundle server with esbuild
npm start                # Run production build

# Database
npm run db:push          # Push Drizzle schema to PostgreSQL

# Type checking
npm run check            # Run TypeScript type checking
```

## Architecture Overview

This is a full-stack TypeScript application for AI-powered virtual fashion try-on using Google Gemini and OpenAI APIs.

### Stack
- **Frontend**: React 18 + Vite, wouter (routing), TanStack Query, Tailwind CSS, shadcn/ui (Radix primitives)
- **Backend**: Express.js with TypeScript (tsx in dev, esbuild bundle in prod)
- **Database**: PostgreSQL via Neon serverless + Drizzle ORM
- **AI Services**: Google Gemini (image generation), OpenAI GPT-4o (instruction generation)

### Project Structure
```
client/src/
├── components/          # React components (UI in components/ui/)
├── contexts/           # AuthContext for session management
├── hooks/              # Custom hooks (use-toast, use-mobile)
├── lib/                # API client, queryClient, utils
└── pages/              # Route pages (home.tsx, not-found.tsx)

server/
├── index.ts            # Express app entry, session setup
├── routes.ts           # API routes (/api/auth/*, /api/try-on/*, /api/fashion-items/*)
├── storage.ts          # IStorage interface with MemStorage and DatabaseStorage implementations
├── middleware/         # Auth middleware (requireAuth, optionalAuth)
└── services/           # gemini.ts (AI try-on), mediaStorage.ts, emailVerification.ts

shared/
└── schema.ts           # Drizzle schema + Zod validation (users, tryOnResults, fashionItems)
```

### Key Patterns

**Storage Abstraction**: `server/storage.ts` defines `IStorage` interface with two implementations:
- `MemStorage`: In-memory for development/fallback
- `DatabaseStorage`: Drizzle ORM with Neon PostgreSQL

Use `getStorage()` to get the singleton instance (async initialization).

**Authentication Flow**: Session-based with express-session + connect-pg-simple. Auth state managed via `AuthContext` on frontend, `requireAuth`/`optionalAuth` middleware on backend.

**Virtual Try-On Generation**: Three modes in `server/services/gemini.ts`:
- `generateVirtualTryOn`: Single item application
- `generateSimultaneousTryOn`: Multiple items at once
- `generateProgressiveTryOn`: Layer items sequentially (uses previous result as input)

**Path Aliases** (vite.config.ts):
- `@/` → `client/src/`
- `@shared/` → `shared/`
- `@assets/` → `attached_assets/`

### Environment Variables

Required:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `GOOGLE_API_KEY` - Google Gemini API key
- `OPENAI_API_KEY` - OpenAI API key (for instruction generation)

Optional:
- `SESSION_SECRET` - Express session secret
- `MEDIA_ROOT` - File upload directory (default: ./uploads)
- `PORT` - Server port (default: 5000)