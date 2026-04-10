# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cubbit Slideshow — a Next.js 15 web app for uploading photos to S3-compatible storage and displaying them in an infinite-scrolling carousel. Features mobile-first upload, admin panel with persistent settings (SQLite), real-time photo updates, and Kubernetes deployment.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (Turbopack) at localhost:3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run type-check   # TypeScript type checking
npm run format       # Prettier format all files

# Local dev infrastructure
docker compose up -d     # Start MinIO (S3) on ports 9002/9003
docker compose down      # Stop MinIO

# Docker
./build-multiarch.sh -v 2.0.0      # Multi-arch build
./build-multiarch.sh -v 2.0.0 -p   # Build and push

# Helm
helm install slideshow ./helm -f my-values.yaml
```

## Architecture

**Stack**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, SQLite (better-sqlite3), AWS SDK v3, jose (JWT), sharp (thumbnails), Winston (logging), Zod (validation).

**Key patterns**:

- Server Components by default; `'use client'` only for interactive components
- Server Actions for admin mutations (settings, password)
- API routes for uploads (XHR progress) and GET endpoints
- SQLite for persistent settings/auth — seeded from env vars on first run, managed via admin UI
- In-memory caching layer over SQLite (invalidated on writes)
- S3 client recreated when endpoint changes
- Thumbnails (480x480 JPEG) generated on upload via sharp, stored in `.thumbnails/` prefix
- Photos organized by date: `{prefix}/YYYY/MM/DD/{uuid}.{ext}`
- Edge middleware (jose) protects `/admin/*` routes
- SSE endpoint for real-time photo notifications, polling fallback

**Pages**: `/` (slideshow), `/upload`, `/admin/login`, `/admin/settings`, `/admin/password`

**Persistence**: SQLite at `$DATA_DIR/slideshow.db` with two single-row tables: `settings` and `auth`. First run generates admin password (logged to stdout).

## Cubbit Branding

Primary blue: `#0065FF`. Full color scale and dark/light mode tokens defined in `src/app/globals.css`. Font: Source Sans 3.
