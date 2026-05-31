import { BACKEND_URL } from "../services/api";

const DEFAULT_AVATAR = "/default-avatar.svg";

const getBackendOrigin = () => {
  if (!BACKEND_URL) return "";

  try {
    return new URL(BACKEND_URL, window.location.origin).origin;
  } catch {
    return BACKEND_URL.replace(/\/api\/?$/, "").replace(/\/$/, "");
  }
};

export const resolveMediaUrl = (src, fallback = DEFAULT_AVATAR) => {
  if (!src) return fallback;

  const cleanSrc = String(src).replace(/\\/g, "/").trim();
  const backendOrigin = getBackendOrigin();

  if (/^https?:\/\//i.test(cleanSrc)) {
    try {
      const url = new URL(cleanSrc);
      const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
      const currentIsLocalhost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

      if (isLocalhost && !currentIsLocalhost && backendOrigin) {
        return `${backendOrigin}${url.pathname}${url.search}`;
      }

      return cleanSrc;
    } catch {
      return cleanSrc;
    }
  }

  if (cleanSrc.startsWith("/uploads/")) {
    return backendOrigin ? `${backendOrigin}${cleanSrc}` : cleanSrc;
  }

  if (cleanSrc.startsWith("uploads/")) {
    if (import.meta.env.DEV) {
      return `/${cleanSrc}`;
    }
    return backendOrigin ? `${backendOrigin}/${cleanSrc}` : `/${cleanSrc}`;
  }

  if (cleanSrc.startsWith("/")) {
    return cleanSrc;
  }

  return backendOrigin ? `${backendOrigin}/${cleanSrc.replace(/^\/+/, "")}` : cleanSrc;
};

export const withCacheBust = (src, version) => {
  const resolvedSrc = resolveMediaUrl(src);
  if (!version || resolvedSrc === DEFAULT_AVATAR) return resolvedSrc;

  return `${resolvedSrc}${resolvedSrc.includes("?") ? "&" : "?"}v=${version}`;
};
