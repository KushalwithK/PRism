import { cookies } from "next/headers";

const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
}

export function setAuthCookies(
  response: Response,
  accessToken: string,
  refreshToken: string
) {
  response.headers.append(
    "Set-Cookie",
    `${ACCESS_TOKEN_COOKIE}=${accessToken}; ${cookieString({
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60, // 15 minutes
    })}`
  );
  response.headers.append(
    "Set-Cookie",
    `${REFRESH_TOKEN_COOKIE}=${refreshToken}; ${cookieString({
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })}`
  );
}

export function clearAuthCookies(response: Response) {
  response.headers.append(
    "Set-Cookie",
    `${ACCESS_TOKEN_COOKIE}=; ${cookieString({
      ...COOKIE_OPTIONS,
      maxAge: 0,
    })}`
  );
  response.headers.append(
    "Set-Cookie",
    `${REFRESH_TOKEN_COOKIE}=; ${cookieString({
      ...COOKIE_OPTIONS,
      maxAge: 0,
    })}`
  );
}

function cookieString(options: {
  httpOnly: boolean;
  secure: boolean;
  sameSite: string;
  path: string;
  maxAge: number;
}): string {
  const parts = [`Path=${options.path}`, `Max-Age=${options.maxAge}`];
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  parts.push(`SameSite=${options.sameSite}`);
  return parts.join("; ");
}
