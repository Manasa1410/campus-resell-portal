// This file is assumed to exist based on usage in other components.
// Create this file if it doesn't exist, or update your existing one.

export const resolveMediaUrl = (path, defaultPath = "") => {
  if (!path) return defaultPath;

  // If the path is already an absolute URL (e.g., from Cloudinary), return it directly.
  if (typeof path === "string" && (path.startsWith("http://") || path.startsWith("https://"))) {
    return path;
  }

  // Otherwise, assume it's a relative path (e.g., for local default avatars)
  // and prepend your API base URL.
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ""; // Ensure this is set in your .env

  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

export const withCacheBust = (url, version) => {
  if (!url) return "";
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${version}`;
};