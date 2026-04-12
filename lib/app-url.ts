import { getOptionalEnv } from "@/lib/env";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function buildOriginFromHeaders(headers: Headers) {
  const origin = headers.get("origin");
  if (origin) {
    return trimTrailingSlash(origin);
  }

  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!host) {
    return undefined;
  }

  const protocol =
    headers.get("x-forwarded-proto") ??
    (host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return trimTrailingSlash(`${protocol}://${host}`);
}

export function getAppUrl(headers?: Headers) {
  const headerOrigin = headers ? buildOriginFromHeaders(headers) : undefined;
  if (headerOrigin) {
    return headerOrigin;
  }

  const explicitOrigin = getOptionalEnv("APP_URL") ?? getOptionalEnv("NEXT_PUBLIC_APP_URL");
  if (explicitOrigin) {
    return trimTrailingSlash(explicitOrigin);
  }

  const vercelOrigin =
    getOptionalEnv("VERCEL_PROJECT_PRODUCTION_URL") ?? getOptionalEnv("VERCEL_URL");
  if (vercelOrigin) {
    return `https://${trimTrailingSlash(vercelOrigin)}`;
  }

  return "http://localhost:3000";
}

export function buildAppUrl(path: string, headers?: Headers) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getAppUrl(headers)}${normalizedPath}`;
}
