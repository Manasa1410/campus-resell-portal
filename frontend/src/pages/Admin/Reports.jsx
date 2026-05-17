import { useEffect, useState } from "react";
import API from "../../services/api";
import Loader from "../../components/Loader";
import {
  getReports,
  updateReportStatus,
  banUser,
} from "../../services/reportService";

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // 📥 Fetch reports
  const fetchReports = async () => {
    try {
      const { data } = await API.get("/reports");
      setReports(data.reports);
    } catch (err) {
      alert(err.response?.data?.message || "Error fetching reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // 🔄 Update report status
  const updateStatus = async (id, status) => {
    try {
      await API.put(`/reports/${id}`, { status });
      alert("Status updated");
      fetchReports();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  // 🔨 Ban user
  const banUser = async (userId) => {
    try {
      await API.put(`/reports/ban/${userId}`);
      alert("User banned successfully");
    } catch (err) {
      alert("Failed to ban user");
    }
  };

  const loadReports = async () => {
  const data = await getReports();
  setReports(data.reports);
};

  if (loading) return <Loader />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Reports</h1>

      {reports.length === 0 ? (
        <p>No reports found</p>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report._id}
              className="bg-white p-4 rounded-lg shadow"
            >
              <p><strong>Reason:</strong> {report.reason}</p>

              <p>
                <strong>Reported User:</strong>{" "}
                {report.reportedUser?.name} ({report.reportedUser?.email})
              </p>

              <p>
                <strong>Reported By:</strong>{" "}
                {report.reportedBy?.name}
              </p>

              <p>
                <strong>Product:</strong>{" "}
                {report.product?.title || "N/A"}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={
                    report.status === "pending"
                      ? "text-yellow-500"
                      : "text-green-600"
                  }
                >
                  {report.status}
                </span>
              </p>

              {/* Buttons */}
              <div className="mt-3 flex gap-3">
                
                <button
                  onClick={() =>
                    updateStatus(report._id, "reviewed")
                  }
                  className="bg-green-500 text-white px-3 py-1 rounded"
                >
                  Mark Reviewed
                </button>

                <button
                  onClick={() =>
                    banUser(report.reportedUser._id)
                  }
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Ban User
                </button>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reports;