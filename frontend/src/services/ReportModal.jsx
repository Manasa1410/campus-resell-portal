import { useState } from "react";
import { createReport } from "../services/reportService";
import { toast } from "react-hot-toast";

const ReportModal = ({ isOpen, onClose, reportedUser, product }) => {
  const [reason, setReason] = useState("Spam");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createReport({ reportedUser, product, reason, description });
      toast.success("Report submitted successfully");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          Report {product ? "Product" : "User"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <select 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
            >
              <option value="Spam">Spam</option>
              <option value="Fake product">Fake product</option>
              <option value="Abuse">Abuse / Harassment</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us more about the issue..."
              className="w-full border rounded-lg p-2.5 h-32 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-semibold hover:bg-red-700 transition disabled:bg-red-300"
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;