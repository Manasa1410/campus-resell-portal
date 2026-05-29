import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import API from "../../services/api";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleVerify = async (event) => {
    event.preventDefault();

    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }

    try {
      setLoading(true);
      await API.post("/auth/verify-reset-otp", { otp });
      toast.success("OTP verified successfully. You can now reset your password.");
      setIsVerified(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (event) => {
    event.preventDefault();

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await API.put(`/auth/reset-password/${otp}`, { password });
      toast.success("Password reset successful");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 px-4 py-8 text-slate-900 dark:from-slate-950 dark:to-slate-900 dark:text-white">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-md place-items-center">
        <Card className="w-full p-6 shadow-lg sm:p-8">
          <div className="mb-8 text-center">
            <Link to="/" className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-blue-600 text-xl font-black text-white">
              C
            </Link>
            <h1 className="text-3xl font-black text-slate-950 dark:text-white">Reset password</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {!isVerified
                ? "Enter the code sent to your email to verify your identity."
                : "Create a new password for your account."}
            </p>
          </div>

          {!isVerified ? (
            <form onSubmit={handleVerify} className="space-y-4">
              <input
                type="text"
                maxLength="6"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-900"
                required
              />
              <Button type="submit" disabled={loading} size="lg" className="w-full">
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-center text-xs font-semibold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
                ✓ OTP Verified (Code: {otp})
              </div>
              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-900"
                required
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-900"
                required
              />
              <Button type="submit" disabled={loading} size="lg" className="w-full">
                {loading ? "Updating..." : "Reset Password"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
