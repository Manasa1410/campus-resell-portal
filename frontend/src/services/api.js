import axios from "axios";

// 🖼️ Base URL for images and static assets
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

// 🌐 Base URL of backend
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

// 🔐 Automatically attach token to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  req.headers = req.headers || {};

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export default API;