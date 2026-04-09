# Cubbit Slideshow

A modern photo slideshow app powered by S3-compatible storage. Upload photos from mobile, display them in a beautiful infinite-scrolling carousel.

## Features

- **Mobile-first upload**: Multi-photo selection with per-file progress tracking
- **Infinite carousel**: Configurable rows with alternating scroll directions and GPU-accelerated CSS animations
- **Real-time updates**: New photos appear in the slideshow within seconds, highlighted with a glow animation
- **Interactive slideshow**: Hover to pause rows, click to zoom, Space key to toggle pause
- **Photo management**: Download or delete photos from the zoom modal
- **Admin panel**: Configure S3 backend, slideshow settings, and change password — all persisted in SQLite
- **S3 health monitoring**: Live connectivity indicator in the slideshow header
- **Auto-generated thumbnails**: 480x480 JPEG thumbnails for fast carousel loading
- **Declarative configuration**: All settings configurable via environment variables
- **Kubernetes-ready**: Helm chart with PVC for persistent settings

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (for MinIO local dev)

### Local Development

```bash
# Start MinIO (S3-compatible storage)
docker compose up -d

# Copy and configure environment
cp .env.local.example .env.local

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open http://localhost:3000 — the admin password is logged to the console on first run.

### Configuration

All settings can be configured via environment variables (see `.env.local.example`) or through the admin panel at `/admin`.

| Variable | Default | Description |
|---|---|---|
| `S3_BUCKET_NAME` | `slideshow` | S3 bucket name |
| `S3_PREFIX` | `` | Key prefix for photos |
| `S3_ENDPOINT` | `` | S3 endpoint URL |
| `S3_REGION` | `eu-central-1` | S3 region |
| `S3_ACCESS_KEY_ID` | `` | S3 access key |
| `S3_SECRET_ACCESS_KEY` | `` | S3 secret key |
| `ADMIN_PASSWORD` | (generated) | Admin password (logged on first run if not set) |
| `JWT_SECRET` | (generated) | JWT signing secret |
| `SLIDESHOW_SPEED_S` | `200` | Animation speed in seconds |
| `SLIDESHOW_ROWS` | `3` | Number of carousel rows |
| `MAX_FILE_SIZE` | `10485760` | Max upload size in bytes |
| `DATA_DIR` | `./data` | SQLite database directory |
| `LOG_LEVEL` | `info` | Logging level |

## Docker

### Build

```bash
# Standard build
docker build -t cubbit/slideshow:latest .

# Multi-architecture (amd64 + arm64)
./build-multiarch.sh -v 2.0.0

# Build and push
./build-multiarch.sh -v 2.0.0 -p
```

### Run

```bash
docker run -p 3000:3000 \
  -e S3_ENDPOINT=https://s3.cubbit.eu \
  -e S3_BUCKET_NAME=my-bucket \
  -e S3_ACCESS_KEY_ID=key \
  -e S3_SECRET_ACCESS_KEY=secret \
  -v slideshow-data:/data \
  cubbit/slideshow:latest
```

## Kubernetes (Helm)

```bash
# Create values file
cp helm/values.yaml my-values.yaml
# Edit my-values.yaml with your S3 credentials

# Install
helm install slideshow ./helm -f my-values.yaml

# Upgrade
helm upgrade slideshow ./helm -f my-values.yaml
```

## Architecture

- **Next.js 15** with App Router, Server Components, and Server Actions
- **SQLite** (better-sqlite3) for persistent settings and auth
- **AWS SDK v3** for S3 operations with multipart upload support
- **sharp** for thumbnail generation on upload
- **jose** for Edge-compatible JWT authentication
- **Tailwind CSS v4** with Cubbit design system tokens

### Routes

| Route | Description |
|---|---|
| `/` | Slideshow (default) |
| `/upload` | Mobile-first photo upload |
| `/admin` | Admin panel (protected) |
| `/admin/login` | Admin login |
| `/admin/settings` | S3 and slideshow configuration |
| `/admin/password` | Change admin password |

## License

MIT
