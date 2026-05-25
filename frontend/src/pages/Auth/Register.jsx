import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { registerUser } from "../../services/authService";
import useAuth from "../../hooks/useAuth";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Icon from "../../components/ui/Icon";
import { isValidEmail } from "../../utils/emailValidation";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

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

      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("email", normalizedEmail);
      formData.append("password", form.password);

      if (image) {
        formData.append("avatar", image);
      }

      const data = await registerUser(formData);

      if (!data?.token) {
        throw new Error("Unable to register");
      }

      login(data.token);
      toast.success("Account created");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);

    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 px-4 py-8 text-slate-900 dark:from-slate-950 dark:to-slate-900 dark:text-white">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[440px_1fr]">
        <Card className="mx-auto w-full max-w-md p-6 shadow-lg sm:p-8">
          <div className="mb-8 text-center">
            <Link to="/" className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-blue-600 text-xl font-black text-white">
              C
            </Link>
            <h2 className="text-3xl font-black text-slate-950 dark:text-white">Create account</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Join the campus marketplace in under a minute.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Full name</span>
              <input
                type="text"
                name="name"
                placeholder="Your name"
                value={form.name}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-900"
              />
            </label>

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
                placeholder="Create a strong password"
                value={form.password}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-900"
              />
            </label>

            <label className="block rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center transition hover:border-blue-300 dark:border-slate-800 dark:bg-slate-950">
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-200">
                <Icon name="user" />
              </div>
              <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">Upload profile picture</p>
              <p className="mt-1 text-xs text-slate-400">Optional JPG or PNG</p>
            </label>

            {preview && (
              <div className="flex items-center justify-center">
                <img src={preview} alt="Preview" className="h-24 w-24 rounded-full border-4 border-blue-50 object-cover shadow-md dark:border-slate-800" />
              </div>
            )}

            <Button type="submit" disabled={loading} size="lg" className="w-full">
              {loading ? "Creating account..." : "Register"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700">
              Login
            </Link>
          </p>
        </Card>

        <section className="hidden lg:block">
          <div className="max-w-xl justify-self-end">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-600">Start selling smarter</p>
            <h1 className="mt-4 text-5xl font-black leading-tight">Turn unused campus essentials into quick, trusted deals.</h1>
            <p className="mt-5 text-base leading-7 text-slate-600 dark:text-slate-400">
              Create listings, save products, and message buyers from a modern dashboard designed for students.
            </p>
            <div className="mt-8 grid gap-4">
              {["Create beautiful listings", "Chat directly with buyers", "Track wishlist and products"].map((item) => (
                <Card key={item} className="flex items-center gap-4 p-4">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-200">
                    <Icon name="spark" />
                  </span>
                  <p className="font-bold text-slate-950 dark:text-white">{item}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Register;
