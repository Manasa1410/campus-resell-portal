import API from "./api";

// 🔐 Register user
export const registerUser = async (formData) => {
  const { data } = await API.post("/auth/register", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

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

// 👤 Update profile data
export const updateProfile = async (profileData) => {
  const { data } = await API.put("/auth/profile", profileData);
  return data;
};

// 🖼️ Update profile avatar
export const updateAvatar = async (formData) => {
  const { data } = await API.put("/auth/profile/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

// 🔑 Update password
export const updatePassword = async (passwordData) => {
  const { data } = await API.put("/auth/password", passwordData);
  return data;
};