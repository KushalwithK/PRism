export const API_BASE_URL = process.env.API_URL!;
export const WEBSITE_URL = process.env.WEBSITE_URL!;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'prism_access_token',
  REFRESH_TOKEN: 'prism_refresh_token',
  USER: 'prism_user',
} as const;
