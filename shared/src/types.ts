// ── User & Auth ──

export type Plan = 'FREE' | 'PRO' | 'MAX';

export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING';

export interface ProductSubscription {
  productSlug: string;
  productName: string;
  plan: Plan;
  status: SubscriptionStatus;
  usageCount: number;
  usageLimit: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  defaultTemplateId: string | null;
  createdAt: string;
  subscriptions: ProductSubscription[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

// ── Templates ──

export interface Template {
  id: string;
  userId: string | null;
  name: string;
  description: string;
  body: string;
  isPredefined: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateRequest {
  name: string;
  description: string;
  body: string;
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  body?: string;
}

// ── Generation ──

export type Platform = 'github' | 'gitlab';

export interface GenerateRequest {
  diff: string;
  platform: Platform;
  repoUrl: string;
  baseBranch?: string;
  compareBranch?: string;
  templateId?: string;
  additionalPrompt?: string;
}

export interface UpdateGenerationRequest {
  prTitle?: string;
  prDescription?: string;
}

export interface UpdateGenerationResponse {
  id: string;
  prTitle: string;
  prDescription: string;
}

export interface GenerateResponse {
  title: string;
  description: string;
  generation: {
    id: string;
    templateName: string;
  };
  usage: UsageStats;
}

// ── History ──

export interface Generation {
  id: string;
  userId: string;
  templateId: string | null;
  platform: Platform;
  repoUrl: string;
  baseBranch: string | null;
  compareBranch: string | null;
  prTitle: string;
  prDescription: string;
  diffSummary: string;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  createdAt: string;
  template?: { name: string } | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Usage ──

export interface UsageStats {
  product: string;
  used: number;
  limit: number;
  plan: Plan;
  remaining: number;
  periodEnd: string;
}

// ── AI Provider ──

export interface PlaceholderDef {
  key: string;
  description: string;
}

export interface AIGenerationResult {
  title: string;
  placeholders: Record<string, string>;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ── Messages (Extension) ──

export type MessageType =
  | 'GET_AUTH_STATE'
  | 'LOGIN'
  | 'REGISTER'
  | 'LOGOUT'
  | 'REFRESH_TOKEN'
  | 'GENERATE'
  | 'GET_TEMPLATES'
  | 'GET_HISTORY'
  | 'GET_USAGE'
  | 'GET_PROFILE'
  | 'SET_DEFAULT_TEMPLATE'
  | 'UPDATE_GENERATION'
  | 'CREATE_TEMPLATE'
  | 'UPDATE_TEMPLATE'
  | 'DELETE_TEMPLATE'
  | 'GET_UPGRADE_URL';

export interface ExtensionMessage {
  type: MessageType;
  payload?: unknown;
}

export interface ExtensionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ── API Error ──

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}
