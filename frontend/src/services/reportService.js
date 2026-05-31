import API from "./api";

// 🚨 Create a report (user reports another user/product)
export const createReport = async (reportData) => {
  const { data } = await API.post("/reports", reportData);
  return data;
};

// 📋 Get all reports (Admin only)
export const getReports = async () => {
  const { data } = await API.get("/reports/admin/all");
  return data;
};
  
// 🔄 Update report status (Admin)
export const updateReportStatus = async (id, status, adminNote = "") => {
  const { data } = await API.put(`/reports/status/${id}`, { status, adminNote });
  return data;
};

// 🔨 Ban user (Admin action)
export const banUser = async (userId) => {
  const { data } = await API.put(`/reports/ban/${userId}`);
  return data;
};

// 🔓 Unban user (Admin action)
export const unbanUser = async (userId) => {
  const { data } = await API.put(`/reports/unban/${userId}`);
  return data;
};