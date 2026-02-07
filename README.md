# PRism

AI-powered browser extension that auto-generates pull request titles and descriptions from your diff. Works on GitHub and GitLab.

PRism reads the code changes, runs them through Gemini, and fills in your PR form — so you spend less time writing boilerplate and more time shipping.

## How It Works

1. Navigate to a PR/MR creation page on GitHub or GitLab
2. Click the **Generate PR Description** button injected next to the form
3. Pick a template (or use the default), add optional instructions
4. PRism extracts the diff, sends it to the backend, and the AI generates a structured title + description
5. Review/edit the result in the modal, then click **Use This** to fill the form

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Browser Extension (Manifest V3)                        │
│  ┌──────────┐  ┌────────────┐  ┌─────────────────────┐ │
│  │  Popup   │  │ Background │  │  Content Script     │ │
│  │ (Auth,   │◄─┤ (Service   │◄─┤ (Injects button,   │ │
│  │ History, │  │  Worker,   │  │  extracts diff,     │ │
│  │Settings) │  │  API calls)│  │  fills PR form)     │ │
│  └──────────┘  └─────┬──────┘  └─────────────────────┘ │
└────────────────────────┼────────────────────────────────┘
                         │ REST API
┌────────────────────────┼────────────────────────────────┐
│  Backend (Fastify)     ▼                                │
│  ┌──────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ Auth │ │ Generate │ │Templates │ │ History/Usage │  │
│  │(JWT) │ │(AI call) │ │ (CRUD)   │ │  (tracking)   │  │
│  └──┬───┘ └────┬─────┘ └────┬─────┘ └───────┬───────┘  │
│     │          │             │                │          │
│     ▼          ▼             ▼                ▼          │
│  ┌─────────────────────────────────────────────────┐    │
│  │              PostgreSQL (Prisma)                 │    │
│  └─────────────────────────────────────────────────┘    │
│                    │                                     │
│                    ▼                                     │
│            ┌──────────────┐                              │
│            │  Gemini API  │                              │
│            └──────────────┘                              │
└──────────────────────────────────────────────────────────┘
```

**Monorepo** with three npm workspaces:

| Package | Path | Purpose |
|---------|------|---------|
| `@prism/backend` | `backend/` | Fastify 5 REST API, Prisma ORM, JWT auth, AI generation |
| `@prism/extension` | `extension/` | Manifest V3 browser extension (Chrome + Firefox) |
| `@prism/shared` | `shared/` | Types, constants, and templates shared by both |

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js, Fastify 5, TypeScript, Prisma 6 |
| Database | PostgreSQL |
| Auth | JWT (15min access + 7-day rotating refresh tokens), bcrypt |
| AI | Google Gemini 2.5 Flash (pluggable provider interface) |
| Extension | Manifest V3, vanilla TypeScript, Shadow DOM |
| Build | esbuild (extension), tsc (backend + shared) |
| Monorepo | npm workspaces |

## Prerequisites

- **Node.js** >= 18
- **PostgreSQL** running locally (or a remote instance)
- **Gemini API key** — free tier from [Google AI Studio](https://aistudio.google.com/apikey)
- **Chrome** or **Firefox** for loading the extension

## Setup

### 1. Clone and install

```bash
git clone <repo-url> prism
cd prism
npm install
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/prism?schema=public"
JWT_SECRET="generate-a-random-secret-here"
JWT_REFRESH_SECRET="generate-a-different-secret-here"
GEMINI_API_KEY="your-gemini-api-key"
PORT=3000
HOST="0.0.0.0"
CORS_ORIGIN="*"
NODE_ENV="development"
```

> For the JWT secrets, any random string works in development. In production, use `openssl rand -base64 32`.

### 3. Set up the database

```bash
npm run db:migrate    # Run Prisma migrations
npm run db:seed       # Seed predefined templates
```

### 4. Build shared package

The shared package must be built first — both backend and extension depend on it:

```bash
npm run shared:build
```

### 5. Start the backend

```bash
npm run backend:dev
```

The API starts at `http://localhost:3000`. Verify with:

```bash
curl http://localhost:3000/health
# → {"status":"ok"}
```

### 6. Build and load the extension

For local development (points at `localhost:3000` by default):

```bash
npm run extension:build
```

For production / EC2 deployment, pass `API_URL` at build time:

```bash
API_URL=https://your-ec2-domain.com npm run extension:build
```

The URL is baked into the bundle at build time via esbuild `define` — no runtime config needed.

**Chrome:**
1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extension/dist/` directory

**Firefox:**
```bash
BROWSER=firefox API_URL=https://your-ec2-domain.com npm run extension:build
```
1. Go to `about:debugging#/runtime/this-device`
2. Click **Load Temporary Add-on**
3. Select `extension/dist/manifest.json`

### 7. Use it

1. Click the PRism extension icon in your browser toolbar
2. Register an account or log in
3. Navigate to a GitHub PR creation page (e.g., `github.com/<owner>/<repo>/compare/main...feature`)
4. Click the **Generate PR Description** button that appears near the form
5. Configure options and click **Generate**

## Development

### Running in dev mode

```bash
# Terminal 1 — shared (watches for changes)
npm run shared:build    # or: npm run dev --workspace=@prism/shared

# Terminal 2 — backend (auto-restarts on changes)
npm run backend:dev

# Terminal 3 — extension (rebuilds on changes)
npm run extension:dev
```

After the extension rebuilds, reload it in `chrome://extensions` to pick up changes.

### All scripts

| Script | What it does |
|--------|-------------|
| `npm run shared:build` | Build the shared package |
| `npm run backend:dev` | Start backend with tsx watch (auto-restart) |
| `npm run backend:build` | Compile backend to `backend/dist/` |
| `npm run backend:start` | Run compiled backend (`node dist/index.js`) |
| `npm run extension:dev` | Build extension with esbuild watch |
| `npm run extension:build` | Production build of extension (set `API_URL` env var to override backend URL) |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed predefined templates |
| `npm run db:studio` | Open Prisma Studio (DB browser) |

### Type-checking

```bash
# Backend
cd backend && npx tsc --noEmit

# Extension
cd extension && npx tsc --noEmit
```

## API Reference

All endpoints are prefixed at the root. Auth-protected routes require `Authorization: Bearer <access_token>`.

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create account (`email`, `password`, `name`) |
| POST | `/api/auth/login` | No | Login (`email`, `password`) → tokens + profile |
| POST | `/api/auth/refresh` | No | Exchange refresh token for new token pair |
| GET | `/api/auth/profile` | Yes | Get current user profile |

### Generation

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/generate` | Yes | Generate PR description from diff |

Request body:
```json
{
  "diff": "string (the unified diff)",
  "platform": "github | gitlab",
  "repoUrl": "https://github.com/owner/repo",
  "templateId": "optional — override default template",
  "additionalPrompt": "optional — extra instructions for the AI"
}
```

### Templates

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/templates` | Yes | List all templates (predefined + custom) |
| GET | `/api/templates/:id` | Yes | Get single template |
| POST | `/api/templates` | Yes | Create custom template |
| PUT | `/api/templates/:id` | Yes | Update custom template |
| DELETE | `/api/templates/:id` | Yes | Delete custom template |
| PATCH | `/api/templates/:id/set-default` | Yes | Set as default template |

### History & Usage

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/history` | Yes | List generations (paginated) |
| GET | `/api/history/:id` | Yes | Get single generation |
| PATCH | `/api/history/:id` | Yes | Update generation title/description |
| GET | `/api/usage` | Yes | Get usage stats (used / limit / plan) |

### Rate Limits

| Scope | Limit |
|-------|-------|
| Global | 100 requests/min per IP |
| Auth endpoints | 10 requests/min per IP |
| Generate endpoint | 5 requests/min per user |

## Database Schema

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    User      │       │   Template   │       │  Generation  │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (uuid)    │──┐    │ id (uuid)    │──┐    │ id (uuid)    │
│ email        │  │    │ userId?      │  │    │ userId       │
│ passwordHash │  │    │ name         │  │    │ templateId?  │
│ name         │  │    │ description  │  │    │ platform     │
│ plan (enum)  │  │    │ body         │  │    │ repoUrl      │
│ usageCount   │  │    │ isPredefined │  │    │ prTitle      │
│ defaultTplId │──┘    │ createdAt    │  │    │ prDescription│
│ createdAt    │       │ updatedAt    │  │    │ diffSummary  │
│ updatedAt    │       └──────────────┘  │    │ createdAt    │
└──────┬───────┘                         │    └──────────────┘
       │           ┌──────────────┐      │
       │           │ RefreshToken │      │
       │           ├──────────────┤      │
       └──────────►│ id (uuid)    │      │
                   │ userId       │      │
                   │ tokenHash    │◄─────┘
                   │ expiresAt    │
                   │ createdAt    │
                   └──────────────┘

Plan: FREE (5/mo) │ PRO (50/mo) │ MAX (unlimited)
```

## Templates

PRism ships with 5 predefined templates:

| Template | Use case | Sections |
|----------|----------|----------|
| **Minimal** | Small, obvious changes | Summary, what changed, tests |
| **Standard** (default) | Everyday PRs | Summary, what changed, env changes, tests |
| **Feature** | New features | Summary, feature description, implementation, deps, breaking changes, test plan |
| **Bugfix** | Bug fixes | Bug summary, root cause, fix, affected areas, test plan |
| **Enterprise** | Large teams / compliance | Summary, business context, approach, user-facing changes, compliance, rollback plan |

Users can create custom templates using `{placeholder}` syntax. 22 built-in placeholders are available (see `shared/src/constants.ts`).

## Auth Flow

```
Register/Login ──► Access Token (15min) + Refresh Token (7 days)
                                │
                 Protected API call with Bearer token
                                │
              Token expired? ──► POST /api/auth/refresh
                                │
                      New token pair issued
                      Old refresh token hash deleted
                                │
              Reuse detected? ──► All user sessions revoked
```

- Access tokens are short-lived JWTs (15 min)
- Refresh tokens are long-lived JWTs (7 days), stored as SHA-256 hashes in the DB
- Token rotation: each refresh consumes the old token and issues a new pair
- Reuse detection: if a consumed token is replayed, all sessions for that user are revoked

## Extension Structure

```
extension/src/
├── background/
│   ├── index.ts              # Service worker entry
│   ├── auth-manager.ts       # Login, register, logout, token refresh
│   ├── api-client.ts         # Backend fetch wrapper
│   └── message-handler.ts    # Route messages from content/popup
├── content/
│   ├── index.ts              # Entry — detects platform, injects button
│   ├── platform-detector.ts  # GitHub vs GitLab detection
│   ├── ui-injector.ts        # Modal UI (Shadow DOM)
│   └── platforms/
│       ├── platform-adapter.ts   # Interface
│       ├── github.ts             # GitHub diff extraction + form fill
│       └── gitlab.ts             # GitLab diff extraction + form fill
├── popup/
│   ├── popup.ts              # Popup controller
│   ├── popup.html / .css     # Popup markup + styles
│   └── views/                # Login, register, main, settings, history
├── shared/
│   ├── compat.ts             # Chrome/Firefox API abstraction
│   ├── constants.ts          # API base URL, storage keys
│   ├── storage.ts            # chrome.storage.local wrapper
│   └── types.ts              # Message types
└── manifest.json
```

Key design decisions:
- **Shadow DOM** for the content script modal — prevents CSS conflicts with GitHub/GitLab
- **Native value setter** pattern for filling React-controlled form fields
- **MutationObserver** for SPA navigation detection (GitHub Turbo/pjax)
- **chrome.runtime.sendMessage** for content script ↔ background communication

## Adding an AI Provider

The backend uses a pluggable provider interface. To add a new provider:

1. Create `backend/src/providers/your-provider.ts` implementing:

```typescript
interface AIProvider {
  readonly name: string;
  generate(prompt: string): Promise<AIGenerationResult>;
}
```

2. Update the factory in `backend/src/providers/factory.ts` to return your provider

The current Gemini provider uses `gemini-2.5-flash` with temperature 0.3 and 4096 max tokens. The AI returns structured JSON with a title and placeholder values that get rendered into the selected template.

## Project Layout

```
prism/
├── backend/
│   ├── src/
│   │   ├── index.ts          # Entry point
│   │   ├── app.ts            # Fastify app factory
│   │   ├── config.ts         # Env config (custom .env loader)
│   │   ├── plugins/          # Auth, CORS, DB, rate-limit, errors
│   │   ├── middleware/        # Usage guard
│   │   ├── routes/           # Auth, generate, templates, history, usage
│   │   ├── providers/        # AI providers (Gemini)
│   │   └── utils/            # Errors, passwords, template rendering
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── extension/                 # (see Extension Structure above)
│   ├── src/
│   ├── esbuild.config.ts
│   ├── package.json
│   └── tsconfig.json
├── shared/
│   ├── src/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   └── constants.ts
│   ├── package.json
│   └── tsconfig.json
├── package.json               # Monorepo root
└── tsconfig.base.json
```

## License

MIT
