import axios from "axios";

// 🌐 Base URL of backend
const API = axios.create({
  baseURL: "http://localhost:5001/api",
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