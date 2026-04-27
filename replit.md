# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

- `artifacts/api-server` — Shared Express API server (port 8080). Routes registered in `src/routes/index.ts`.
- `artifacts/voiceforge` — VoiceForge AI: dark-themed, single-page React + Vite SaaS at `/` that turns text into studio-quality voice via ElevenLabs Text-to-Speech. Stateless, no DB. Custom binary fetch hook (`useGenerateVoiceAudio`) downloads MP3 blob; voice list comes from `useListVoices` (curated 6-voice set served by the backend).
- `artifacts/mockup-sandbox` — Component preview sandbox.

## Backend ↔ ElevenLabs

- Secret: `ELEVENLABS_API_KEY`.
- `GET /api/voices` returns a curated list of 6 ElevenLabs library voices.
- `POST /api/generate-voice` validates the request with Zod, applies an in-tone wrapper (`motivational`, `storytelling`, `educational`, or `plain`), calls `eleven_multilingual_v2`, and streams back `audio/mpeg`. Upstream ElevenLabs error messages are passed through to the client (e.g. free-plan limitations).
