# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Campaign Performance Analyzer - a Next.js 15.4.5 application that helps digital marketing professionals analyze multi-channel campaign performance with AI-powered insights. The app uses React 19, TypeScript, and Tailwind CSS 4.

## Commands

```bash
# Development server with Turbopack
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## Architecture

The application follows Next.js App Router architecture with a single-page application structure:

- **Main Application**: `src/app/page.tsx` - Contains the entire campaign analyzer component including:
  - Campaign JSON file upload and parsing
  - CSV performance table uploads for various tactics (Display, Meta, SEM, YouTube, etc.)
  - AI analysis using Anthropic Claude API
  - Data visualization with Recharts
  - Custom benchmark modifiers with local storage persistence

- **Layout**: `src/app/layout.tsx` - Root layout with Geist font configuration
- **Styling**: Tailwind CSS with custom red theme (#cf0e0f)

## Key Features to Consider

1. **Multi-file Upload System**: The app expects:
   - One JSON file with campaign data structure
   - Multiple CSV files for different campaign tactics performance data

2. **AI Integration**: Uses Anthropic API key from `.env.local`:
   ```
   ANTHROPIC_API_KEY=your_key_here
   ```

3. **Supported Campaign Tactics**:
   - Targeted Display, TrueView, AAT, RTG
   - Meta (Facebook/Instagram)
   - Geofencing, SEM, Streaming TV, YouTube

4. **Data Visualization**: Uses Recharts for interactive charts (Bar, Line, Pie, Area)

5. **Error Handling**: Implements React Error Boundary pattern for resilient user experience

6. **State Management**: Uses React hooks and local storage for modifier settings persistence

## Development Notes

- TypeScript path mapping is configured with `@/*` alias for `src/*`
- No testing framework is currently set up
- ESLint is configured with Next.js TypeScript rules
- The app uses client-side rendering for all functionality
- All campaign analysis happens in the browser using the Anthropic API directly