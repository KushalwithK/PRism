import type { Plan, PlaceholderDef } from './types.js';

// ── Plan Limits ──

export const PLAN_LIMITS: Record<Plan, number> = {
  FREE: 5,
  PRO: 50,
  MAX: Infinity,
};

// ── Placeholder Definitions ──

export const PLACEHOLDERS: Record<string, PlaceholderDef> = {
  summary: {
    key: 'summary',
    description: 'Concise 2-3 sentence summary of what this PR does and why. Focus on intent and outcome.',
  },
  what_changed: {
    key: 'what_changed',
    description: 'Bullet-point list of specific changes made, grouped logically. Include affected file or module in parentheses where helpful.',
  },
  test_cases: {
    key: 'test_cases',
    description: 'Brief bullet-point list of what was tested or should be tested — unit tests, integration tests, and manual verification.',
  },
  test_plan: {
    key: 'test_plan',
    description: 'Step-by-step numbered instructions a reviewer can follow to verify the changes. Include preconditions, exact steps, and expected outcomes.',
  },
  env_changes: {
    key: 'env_changes',
    description: 'New or changed environment variables, config files, feature flags, or infrastructure dependencies. Include variable name, purpose, and example value. Output "None" if not applicable.',
  },
  breaking_changes: {
    key: 'breaking_changes',
    description: 'Breaking changes to public APIs, interfaces, data formats, or behavior with migration steps. Output "None" if not applicable.',
  },
  feature_description: {
    key: 'feature_description',
    description: 'Clear description of the new feature — what it enables that was not possible before.',
  },
  implementation_details: {
    key: 'implementation_details',
    description: 'Bullet-point list of key implementation decisions, architectural approach, design patterns used, and technical trade-offs.',
  },
  third_party_changes: {
    key: 'third_party_changes',
    description: 'New, updated, or removed third-party dependencies with version numbers. Output "None" if not applicable.',
  },
  bug_summary: {
    key: 'bug_summary',
    description: 'Concise description of the bug: incorrect behavior, who was affected, and under what conditions it occurred.',
  },
  root_cause: {
    key: 'root_cause',
    description: 'Technical explanation of why the bug occurred — faulty logic, race condition, missing validation, or incorrect assumption in the code.',
  },
  fix_description: {
    key: 'fix_description',
    description: 'How the bug was fixed, the approach taken, and why it is the correct solution.',
  },
  affected_areas: {
    key: 'affected_areas',
    description: 'Modules, components, endpoints, or features affected by this bug and its fix (blast radius).',
  },
  business_context: {
    key: 'business_context',
    description: 'Business problem or user need this PR addresses. Written for a product manager audience, avoid technical jargon.',
  },
  solution_approach: {
    key: 'solution_approach',
    description: 'Technical approach, architecture decisions, trade-offs considered, and why this approach was chosen.',
  },
  user_facing_changes: {
    key: 'user_facing_changes',
    description: 'Changes visible to end users: UI updates, new functionality, behavior changes, API modifications. Output "None" if not applicable.',
  },
  compliance_notes: {
    key: 'compliance_notes',
    description: 'Security, privacy, accessibility, or regulatory considerations. Note if security review or audit is needed. Output "None" if not applicable.',
  },
  rollback_plan: {
    key: 'rollback_plan',
    description: 'How to safely revert these changes if issues arise in production — migrations to reverse, flags to toggle, config to undo.',
  },
};

// ── Predefined Templates ──

export const PREDEFINED_TEMPLATES = [
  {
    name: 'Minimal',
    description: 'Quick and concise for small, self-explanatory changes',
    body: '## Summary\n{summary}\n\n## Changes\n{what_changed}\n\n## Testing\n{test_cases}',
  },
  {
    name: 'Standard',
    description: 'Balanced template for everyday PRs',
    body: '## Summary\n{summary}\n\n## Changes\n{what_changed}\n\n## Environment Changes\n{env_changes}\n\n## Testing\n{test_cases}',
  },
  {
    name: 'Feature',
    description: 'Comprehensive template for new features with dependencies and verification',
    body: '## Summary\n{summary}\n\n## Feature Description\n{feature_description}\n\n## Implementation Details\n{implementation_details}\n\n## Environment Changes\n{env_changes}\n\n## Third-Party Changes\n{third_party_changes}\n\n## Breaking Changes\n{breaking_changes}\n\n## How to Test\n{test_plan}',
  },
  {
    name: 'Bugfix',
    description: 'Structured for bug fixes with root cause analysis and blast radius',
    body: '## Bug Summary\n{bug_summary}\n\n## Root Cause\n{root_cause}\n\n## Fix\n{fix_description}\n\n## Affected Areas\n{affected_areas}\n\n## How to Test\n{test_plan}',
  },
  {
    name: 'Enterprise',
    description: 'Full-detail for enterprise teams with business context, compliance, and rollback',
    body: '## Summary\n{summary}\n\n## Business Context\n{business_context}\n\n## Solution Approach\n{solution_approach}\n\n## User-Facing Changes\n{user_facing_changes}\n\n## Breaking Changes\n{breaking_changes}\n\n## Compliance & Security\n{compliance_notes}\n\n## How to Test\n{test_plan}\n\n## Rollback Plan\n{rollback_plan}',
  },
] as const;

// ── API Paths ──

export const API_PATHS = {
  AUTH_REGISTER: '/api/auth/register',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REFRESH: '/api/auth/refresh',
  AUTH_PROFILE: '/api/auth/profile',
  TEMPLATES: '/api/templates',
  GENERATE: '/api/generate',
  HISTORY: '/api/history',
  USAGE: '/api/usage',
} as const;

// ── Defaults ──

export const DEFAULT_TEMPLATE_NAME = 'Standard';

export const MAX_DIFF_LENGTH = 100_000; // 100KB max diff size

// ── Sample Placeholder Values (for client-side preview) ──

export const SAMPLE_PLACEHOLDER_VALUES: Record<string, string> = {
  summary:
    'Add JWT-based authentication with access and refresh token support. This enables secure user sessions with automatic token rotation and reuse detection to prevent token theft.',
  what_changed:
    '- Add `/auth/register` and `/auth/login` endpoints (`routes/auth.ts`)\n- Implement JWT access token (15min) and refresh token (7-day) generation (`services/token.ts`)\n- Add refresh token rotation with SHA-256 hash storage and reuse detection (`services/refresh.ts`)\n- Create `authenticate` middleware for protected routes (`middleware/auth.ts`)\n- Add `RefreshToken` model with `userId`, `tokenHash`, and `expiresAt` columns (`prisma/schema.prisma`)',
  test_cases:
    '- Unit tests for JWT generation, validation, and expiry edge cases\n- Integration tests for register, login, and refresh flows\n- Manual verification of token rotation and reuse detection behavior',
  test_plan:
    '1. **Precondition:** Start the dev server with `npm run dev` and ensure the database is seeded.\n2. Register a new user via `POST /auth/register` with email and password — expect `201` with access and refresh tokens.\n3. Call `GET /auth/profile` with the access token — expect `200` with user data.\n4. Wait 15 minutes (or set `ACCESS_TOKEN_TTL=5s` for testing) and retry — expect `401`.\n5. Call `POST /auth/refresh` with the refresh token — expect new access + refresh tokens.\n6. Retry the old refresh token — expect `401` (reuse detection should revoke all tokens for the user).',
  env_changes:
    '- `JWT_SECRET` (required): Secret key for signing tokens. Example: `openssl rand -hex 32`\n- `ACCESS_TOKEN_TTL` (optional, default `15m`): Access token lifetime.\n- `REFRESH_TOKEN_TTL` (optional, default `7d`): Refresh token lifetime.',
  breaking_changes: 'None',
  feature_description:
    'Adds a complete authentication system that was not previously available. Users can now register, log in, and maintain secure sessions. The refresh token rotation pattern ensures that stolen tokens are detected and all sessions are revoked if reuse is attempted.',
  implementation_details:
    '- Chose JWT over session cookies for stateless API authentication\n- Access tokens are short-lived (15min) to limit exposure window\n- Refresh tokens are stored as SHA-256 hashes in the database — raw tokens never persisted\n- Token rotation: each refresh issues a new pair and invalidates the old refresh token\n- Reuse detection: if a previously-used refresh token is presented, all tokens for that user are revoked',
  third_party_changes:
    '- Added `jsonwebtoken` v9.0.2 (JWT signing and verification)\n- Added `bcrypt` v5.1.1 (password hashing)\n- Added `@types/jsonwebtoken` v9.0.6 and `@types/bcrypt` v5.0.2 (dev)',
  bug_summary:
    'Users were logged out unexpectedly when their access token expired, even though they had a valid refresh token. This affected all users with sessions longer than 15 minutes and was reported by 12 users in the past week.',
  root_cause:
    'The `authenticate` middleware returned `401` immediately on token expiry without checking for a valid refresh token. The refresh flow was only triggered client-side, but the frontend retry logic had a race condition where concurrent requests would both fail before the refresh completed.',
  fix_description:
    'Added server-side token refresh in the `authenticate` middleware. When an expired (but otherwise valid) access token is detected, the middleware now checks for a refresh token in the request cookies, issues a new token pair, and attaches the new access token to the response headers. This eliminates the client-side race condition entirely.',
  affected_areas:
    '- `middleware/auth.ts` — core change to authentication flow\n- `routes/auth.ts` — updated refresh endpoint to support cookie-based tokens\n- `services/token.ts` — added `refreshIfExpired()` helper\n- All protected API routes (no code changes, but behavior changes on expired tokens)',
  business_context:
    'User retention data shows a 15% drop-off correlated with session expiry. Support tickets about "random logouts" have increased 3x this quarter. This PR addresses the core authentication reliability issue to reduce user friction and support burden.',
  solution_approach:
    '- Server-side refresh eliminates the client-side race condition without requiring frontend changes\n- Considered alternative: extending access token TTL (rejected — increases security exposure)\n- Considered alternative: client-side token queue (rejected — adds complexity to every API consumer)\n- Chose middleware-level solution for transparency to route handlers',
  user_facing_changes:
    '- Users will no longer experience unexpected logouts during active sessions\n- Login sessions now persist for up to 7 days of activity (previously 15 minutes)\n- No UI changes — the improvement is transparent to end users',
  compliance_notes:
    '- Refresh tokens are hashed (SHA-256) before storage — raw tokens are never persisted\n- Token reuse detection prevents replay attacks\n- No PII is stored in JWT payloads (only `userId` and `plan`)\n- Recommend security review of the token rotation implementation before production deployment',
  rollback_plan:
    '1. Revert this PR\'s commits from `main`\n2. Run `npx prisma migrate deploy` — the down migration drops the `RefreshToken` table\n3. Restart the server — users will need to log in again (existing refresh tokens become invalid)\n4. No feature flags to toggle; the change is all-or-nothing',
};

// ── Template Renderer (shared with extension for preview) ──

export function renderTemplate(body: string, values: Record<string, string>): string {
  return body.replace(/\{(\w+)\}/g, (full, key: string) => {
    return values[key] ?? full;
  });
}
