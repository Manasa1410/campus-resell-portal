import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { loginUser } from "../../services/authService";
import useAuth from "../../hooks/useAuth";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Icon from "../../components/ui/Icon";
import { isValidEmail } from "../../utils/emailValidation";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const normalizedEmail = form.email.toLowerCase().trim();

      if (!isValidEmail(normalizedEmail)) {
        toast.error("Use a valid public or institutional email");
        return;
      }

      const data = await loginUser({
        email: normalizedEmail,
        password: form.password,
      });

      if (!data?.token) {
        throw new Error("Unable to login");
      }

      login(data.token);
      toast.success("Welcome back");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 px-4 py-8 text-slate-900 dark:from-slate-950 dark:to-slate-900 dark:text-white">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_440px]">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <Link to="/" className="mb-10 inline-flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-blue-600 text-xl font-black text-white shadow-lg shadow-blue-200 dark:shadow-none">
                C
              </span>
              <span className="text-xl font-black">Campus Resell</span>
            </Link>
            <p className="text-sm font-bold uppercase tracking-widest text-blue-600">Campus marketplace</p>
            <h1 className="mt-4 text-5xl font-black leading-tight">Buy, sell, and chat with your campus community.</h1>
            <p className="mt-5 text-base leading-7 text-slate-600 dark:text-slate-400">
              Access your listings, saved products, and conversations from a polished workspace built for quick campus deals.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {["Verified users", "Fast listings", "Direct chats"].map((item) => (
                <Card key={item} className="p-4">
                  <Icon name="spark" className="mb-3 h-5 w-5 text-blue-600" />
                  <p className="text-sm font-bold text-slate-950 dark:text-white">{item}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <Card className="mx-auto w-full max-w-md p-6 shadow-lg sm:p-8">
          <div className="mb-8 text-center">
            <Link to="/" className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-blue-600 text-xl font-black text-white">
              C
            </Link>
            <h2 className="text-3xl font-black text-slate-950 dark:text-white">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Sign in to continue managing campus deals.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">College email</span>
              <input
                type="email"
                name="email"
                placeholder="you@college.edu"
                value={form.email}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-900"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Password</span>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-900"
              />
            </label>

            <div className="text-right">
              <Link to="/forgot-password" className="text-sm font-bold text-blue-600 hover:text-blue-700">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" disabled={loading} size="lg" className="w-full">
              {loading ? "Signing in..." : "Login"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-bold text-blue-600 hover:text-blue-700">
              Create one
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Login;
