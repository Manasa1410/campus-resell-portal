/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import API from "../../services/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { toast } from "react-hot-toast";
import SkeletonBlock from "../../components/ui/Skeleton";

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // 📥 Fetch reports
  const fetchReports = async () => {
    try {
      const { data } = await API.get("/reports/admin/all");
      setReports(data.reports || []);
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
      await API.put(`/reports/status/${id}`, { status: "resolved" });
      toast.success("Report resolved ✅");
      fetchReports();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  // 🔨 Ban user
  const handleBanUser = async (userId) => {
    if (!window.confirm("Change ban status for this user?")) return;
    try {
      const { data } = await API.put(`/users/admin/ban/${userId}`);
      toast.success(data.message);
      fetchReports();
    } catch (err) {
      console.error(err);
      toast.error("Failed to ban user");
    }
  };

  // 🗑️ Delete report record
  const handleDeleteReport = async (id) => {
    if (!window.confirm("Are you sure you want to remove this report record? This won't affect the user or product, only the report itself.")) return;
    try {
      await API.delete(`/reports/admin/${id}`);
      toast.success("Report deleted successfully ✅");
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete report");
    }
  };

  // ❌ Delete product
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;
    try {
      await API.delete(`/products/${productId}`);
      toast.success("Product deleted successfully ✅");
      fetchReports(); // Refresh list to show updated target status
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete product");
    }
  };

  if (loading) return <div className="p-6 space-y-4"><SkeletonBlock className="h-20" /><SkeletonBlock className="h-96" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-slate-950 dark:text-white leading-tight">Moderation Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Review community reports and take action on products or users.</p>
        </div>

        {reports.length === 0 ? (
          <Card className="text-center py-20 border-dashed border-2">
            <p className="text-slate-500 dark:text-slate-400">Clean slate! No pending reports found.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report._id} className="group hover:border-blue-500/30 transition-all shadow-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge tone={report.targetType === "User" ? "purple" : "blue"}>{report.targetType} Report</Badge>
                      <Badge tone={report.status === "pending" ? "warning" : "success"}>{report.status}</Badge>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Reason: <span className="font-normal text-slate-600 dark:text-slate-300">{report.reason}</span>
                    </h3>
                    
                    <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                      <p className="text-slate-500 italic">Target: 
                        <span className="ml-2 font-bold not-italic text-slate-900 dark:text-white">
                          {report.targetType === "Product" 
                            ? (report.targetId?.title || "Deleted Product") 
                            : (report.targetId?.name || "Deleted User")}
                        </span>
                      </p>
                      <p className="text-slate-500 italic">Reporter: 
                        <span className="ml-2 font-bold not-italic text-slate-900 dark:text-white">{report.reporter?.name}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                    {report.status === "pending" && (
                      <Button onClick={() => handleResolve(report._id)} size="sm" variant="success">
                        Resolve
                      </Button>
                    )}

                    <Button onClick={() => handleDeleteReport(report._id)} size="sm" variant="secondary">
                      Discard Report
                    </Button>

                    {report.targetType === "Product" && report.targetId && (
                      <Button onClick={() => handleDeleteProduct(report.targetId._id || report.targetId)} size="sm" variant="danger">
                        Remove Product
                      </Button>
                    )}

                    {report.targetType === "User" && (
                      <Button 
                        onClick={() => handleBanUser(report.targetId?._id || report.targetId)} 
                        size="sm" 
                        variant={report.targetId?.isBanned ? "success" : "danger"}
                      >
                        {report.targetId?.isBanned ? "Unban User" : "Ban User"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;