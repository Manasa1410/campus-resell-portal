import axios from "axios";

// Always expect FULL API URL from env
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001/api";

// 🖼️ Base URL for images and static assets
export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

// 🌐 Axios instance
const API = axios.create({
  baseURL: API_BASE_URL,
});

// 🔐 Attach token
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export default API;