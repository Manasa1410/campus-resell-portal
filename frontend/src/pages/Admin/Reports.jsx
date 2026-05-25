import { useEffect, useState } from "react";
import Loader from "../../components/Loader";
import {
  getReports,
  updateReportStatus,
  banUser,
} from "../../services/reportService";
import { deleteProduct } from "../../services/productService";
import { toast } from "react-hot-toast";

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // 📥 Fetch reports
  const fetchReports = async () => {
    try {
      const data = await getReports();
      setReports(data.reports);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error fetching reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // 🔄 Update report status
  const handleResolve = async (id) => {
    try {
      await updateReportStatus(id, "resolved");
      toast.success("Report resolved ✅");
      fetchReports();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // 🔨 Ban user
  const handleBanUser = async (userId) => {
    try {
      const data = await banUser(userId);
      toast.success(data.message);
      fetchReports();
    } catch (err) {
      toast.error("Failed to ban user");
    }
  };

  // ❌ Delete product
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;
    try {
      await deleteProduct(productId);
      toast.success("Product deleted successfully ✅");
      fetchReports(); // Refresh list to show updated target status
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete product");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Reports</h1>

      {reports.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed">
          <p className="text-gray-500">No reports found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report._id}
              className="bg-white p-4 rounded-lg shadow"
            >
              <p className="text-xs font-bold text-blue-600 uppercase mb-1">{report.targetType} Report</p>
              <p><strong>Reason:</strong> {report.reason}</p>
              <p>
                <strong>Target:</strong>{" "}
                {report.targetType === "Product" 
                  ? (report.targetId?.title || "Deleted Product") 
                  : (report.targetId?.name || "Deleted User")}
              </p>
              <p>
                <strong>Reported By:</strong>{" "}
                {report.reporter?.name}
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
                  onClick={() => handleResolve(report._id)}
                  className="bg-green-500 text-white px-3 py-1 rounded"
                >
                  Resolve
                </button>

                {report.targetType === "Product" && report.targetId && (
                  <button
                    onClick={() => handleDeleteProduct(report.targetId._id || report.targetId)}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    Delete Product
                  </button>
                )}

                {report.targetType === "User" && (
                  <button
                    onClick={() => handleBanUser(report.targetId?._id || report.targetId)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Ban/Unban User
                  </button>
                )}

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reports;