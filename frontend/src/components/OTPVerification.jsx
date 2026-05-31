/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import API from "../services/api";
import Button from "./ui/Button";
import Card from "./ui/Card";
import Icon from "./ui/Icon";
import { isValidEmail } from "../utils/emailValidation";

const OTPVerification = ({ user, onVerificationSuccess }) => {
  const [email, setEmail] = useState(user?.email || "");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1 = Enter Email/Send OTP, 2 = Verify OTP
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const COOLDOWN_KEY = `otp_cooldown_end_${user?._id || "guest"}`;

  useEffect(() => {
    // Check if there is an active cooldown saved in localStorage
    const savedEnd = localStorage.getItem(COOLDOWN_KEY);
    if (savedEnd) {
      const remaining = Math.ceil((Number(savedEnd) - Date.now()) / 1000);
      if (remaining > 0) {
        setCooldown(remaining);
        setStep(2); // If cooldown is active, they probably already requested it
      } else {
        localStorage.removeItem(COOLDOWN_KEY);
      }
    }
  }, [COOLDOWN_KEY]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          localStorage.removeItem(COOLDOWN_KEY);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown, COOLDOWN_KEY]);

  const handleSendOTP = async (e) => {
    e?.preventDefault();
    const normalizedEmail = email.toLowerCase().trim();

    if (!isValidEmail(normalizedEmail)) {
      toast.error("Use a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await API.post("/auth/send-otp", { email: normalizedEmail });
      
      // Set 30 seconds cooldown
      setStep(2);
      const cooldownEnd = Date.now() + 30 * 1000;
      localStorage.setItem(COOLDOWN_KEY, cooldownEnd.toString());
      setCooldown(30);
      toast.success(response.data?.message || "Verification code sent successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error("Please enter a 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await API.post("/auth/verify-otp", { otp, newEmail: email.toLowerCase().trim() });
      toast.success(data.message || "Email verified successfully!");
      localStorage.removeItem(COOLDOWN_KEY);
      if (onVerificationSuccess) {
        onVerificationSuccess(data.user);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Verification failed. Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-200">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-200">
          <Icon name="spark" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-black text-slate-950 dark:text-white">Verify College Email</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Get the verified campus member badge by validating your .edu or .edu.in email address.
          </p>

          {step === 1 ? (
            <form onSubmit={handleSendOTP} className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">College Email Address</span>
                <input
                  type="email"
                  placeholder="name@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  required
                />
              </label>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Sending Code..." : "Send Verification Code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="mt-4 space-y-4">
              <div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-3 text-xs text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="truncate">Code sent to <b>{email}</b></span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-blue-600 hover:text-blue-700 font-bold ml-2 shrink-0"
                  disabled={loading}
                >
                  Change Email
                </button>
              </div>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">6-Digit Verification Code</span>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="mt-2 w-full text-center tracking-[0.75em] font-mono rounded-xl border border-slate-200 bg-slate-50 p-3 text-lg text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  required
                />
              </label>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Button type="submit" disabled={loading || otp.length !== 6} className="flex-1">
                  {loading ? "Verifying..." : "Verify Code"}
                </Button>
                
                <Button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={loading || cooldown > 0}
                  variant="secondary"
                  className="sm:w-auto"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Card>
  );
};

export default OTPVerification;
