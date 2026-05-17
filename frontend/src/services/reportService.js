import API from "./api";

// 🚨 Create a report (user reports another user/product)
export const createReport = async (reportData) => {
  const { data } = await API.post("/reports", reportData);
  return data;
};

// 📋 Get all reports (Admin only)
export const getReports = async () => {
  const { data } = await API.get("/reports");
  return data;
};

// 🔄 Update report status (Admin)
export const updateReportStatus = async (id, status) => {
  const { data } = await API.put(`/reports/${id}`, {
    status,
  });
  return data;
};

// 🔨 Ban user (Admin action)
export const banUser = async (userId) => {
  const { data } = await API.put(`/reports/ban`, {
    userId,
  });
  return data;
};