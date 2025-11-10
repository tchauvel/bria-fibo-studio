# 🧠 Bria FIBO Studio

Brand-aware, JSON-native creative engine that learns and reproduces a brand's visual DNA, with Playground, Style Extractor, Film Recipes, and Batch Campaigns.

## 🎯 Features

- **Playground**: Interactive preview with parameter mapping and JSON editing
- **Style Extractor**: Upload 5 images to extract brand style profiles
- **Film Recipes**: Apply film-like effects (LUT, grain, halation, bloom)
- **Batch Campaigns**: Process multiple images with manifest generation
- **Presets Library**: Save and load creative presets
- **Provenance**: EXIF metadata and compliance tracking

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │  React/Next.js with TypeScript
│   (Port 3000)   │  Modern UI with tabs and JSON panel
└────────┬────────┘
         │
┌────────▼────────┐
│   Backend API   │  Node.js/Express with TypeScript
│   (Port 3001)   │  API proxy with retries and backoff
└────────┬────────┘
         │
┌────────▼────────┐
│   Bria API     │  External FIBO API
└────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install all dependencies
npm run install:all

# Copy environment template
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Edit .env files with your Bria API credentials
```

### Development

```bash
# Run both frontend and backend
npm run dev

# Or run separately
npm run dev:backend  # Backend on http://localhost:3001
npm run dev:frontend # Frontend on http://localhost:3000
```

### Production Build

```bash
npm run build
```

## 📁 Project Structure

```
.
├── backend/          # Express API server
│   ├── src/
│   │   ├── api/      # API routes
│   │   ├── schemas/  # Zod validation schemas
│   │   ├── services/ # Bria API proxy
│   │   └── utils/    # Utilities
│   └── package.json
├── frontend/         # Next.js React app
│   ├── src/
│   │   ├── app/      # Next.js app router
│   │   ├── components/
│   │   └── lib/      # Utilities
│   └── package.json
└── package.json      # Root workspace config
```

## 🔌 API Endpoints

### Preview
- `POST /api/preview` - One shot preview render
- Maps Preset to FIBO, polls status, returns images and request id

### Presets
- `POST /api/presets` - Create or update preset
- `GET /api/presets` - List presets (paginated)

### Style Extraction
- `POST /api/style-extract` - Upload 5 images
- Returns StyleProfile JSON

### Batch Jobs
- `POST /api/batch` - Start batch job
- `GET /api/batch/:jobId` - Job status and links
- Returns zip and manifest when complete

## 🔐 Authentication

All endpoints require Bearer token authentication. The token should be configured in your `.env` file.

## 📊 Key Performance Indicators

- Preview p95 latency: < 12s on 1024px
- Batch stability: 100 assets with < 1% error rate
- Style Extractor: Usable profile in < 2 minutes

## 📝 License

Private - Bria AI FIBO Studio

