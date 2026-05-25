import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import API from "../../services/api";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { isValidEmail } from "../../utils/emailValidation";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.toLowerCase().trim();

    if (!isValidEmail(normalizedEmail)) {
      toast.error("Use a valid email address");
      return;
    }

    try {
      setLoading(true);
      await API.post("/auth/forgot-password", { email: normalizedEmail });
      toast.success("OTP sent to your email");
      navigate("/reset-password");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error sending reset link");
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
            <h1 className="text-3xl font-black text-slate-950 dark:text-white">Forgot password?</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Enter your account email and we will send you a 6-digit OTP to reset your password.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="you@college.edu"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-900"
            />
            <Button type="submit" disabled={loading} size="lg" className="w-full">
              {loading ? "Sending..." : "Send OTP"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Remember your password?{" "}
            <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700">
              Login
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
