import API from "./api";

// 🔐 Register user
export const registerUser = async (userData) => {
  const { data } = await API.post("/auth/register", userData);
  return data;
};

// 🔑 Login user
export const loginUser = async (userData) => {
  const { data } = await API.post("/auth/login", userData);
  return data;
};

// 👤 Get logged-in user profile
export const getProfile = async () => {
  const { data } = await API.get("/auth/profile");
  return data;
};