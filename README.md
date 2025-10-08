# Meeting Summary Dashboard

## Description

The **Meeting Summary Dashboard** helps you distil an online meeting transcripts into:
- Bullet-point summaries
- Actionable task lists

An external AI service (via Openrouter.ai) performs the summarisation and task extraction so you can focus on decisions, not note-taking. Authenticated users manage up to **20 summaries** in a clean two-column dashboard: new drafts on the left, accepted summaries on the right.

Core features:
- Paste a transcript and generate a summary in under 3 minutes
- Edit, accept or discard AI output before saving
- Browse, edit or delete accepted summaries (infinite scroll)
- Email + password authentication powered by Supabase
- Success analytics to measure summary acceptance rate
- Graceful error handling and retry workflow

## Table of Contents
1. [Description](#description)
2. [Tech Stack](#tech-stack)
3. [Getting Started](#getting-started)
4. [Available Scripts](#available-scripts)
5. [Project Scope](#project-scope)
6. [Project Status](#project-status)
7. [License](#license)

## Tech Stack
### Frontend
- [Astro 5](https://astro.build) for static-first performance
- [React 19](https://react.dev) components for interactivity
- [TypeScript 5](https://typescriptlang.org) for type safety
- [Tailwind 4](https://tailwindcss.com) utility-first styling
- [shadcn/ui](https://ui.shadcn.com) accessible UI primitives

### Backend / Infrastructure
- [Supabase](https://supabase.com) (PostgreSQL DB & Auth)
- **Openrouter.ai** API for AI summarisation
- GitHub Actions for CI/CD
- Docker deployment to DigitalOcean

### Runtime
- Node.js **22.14.0** (`.nvmrc`)
- Key packages: `astro`, `@astrojs/react`, `react@19`, `tailwindcss`, `lucide-react`, `clsx`

## Getting Started
### Prerequisites
- Node.js 22.14.0 + npm  
  (Run `nvm use` or `nvm install` if you use nvm.)

### Installation
```bash
# 1. Clone repository
git clone https://github.com/your-org/10x-summary-dashboard.git
cd 10x-summary-dashboard

# 2. Install dependencies
npm install
```

### Environment Variables
Create a `.env` file in the project root with at least:
```
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<your-supabase-anon-key>
OPENROUTER_API_KEY=<openrouter-api-key>
```

### Development
```bash
npm run dev        # start local dev server (http://localhost:4321)
```

### Production Build
```bash
npm run build      # generate static build into ./dist
npm run preview    # preview production build locally
```

## Available Scripts
- **`npm run dev`**: Starts the development server.
- **`npm run build`**: Builds the project for production.
- **`npm run preview`**: Previews the production build locally.
- **`npm run astro`**: Runs Astro CLI commands.
- **`npm run lint`**: Runs ESLint to check for linting issues.
- **`npm run lint:fix`**: Automatically fixes linting issues.
- **`npm run format`**: Formats the code using Prettier.

## Project Scope
### In Scope (MVP)
- Desktop & mobile viewport-responsive web dashboard
- English plain-text transcript input
- AI-powered summarisation & task extraction
- Edit / accept / delete summaries (≤ 20 per user)
- Email + password authentication
- Success analytics (generated vs accepted)

## Project Status
Version **0.0.1** – MVP in active development.  

## License
*License to be determined* – please see `LICENSE` once finalized.

---
