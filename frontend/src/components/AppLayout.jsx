import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import NotificationDropdown from "./NotificationDropdown";
import useAuth from "../hooks/useAuth";
import Icon from "./ui/Icon";

const pageTitles = {
  "/": "Dashboard",
  "/add-product": "Add Product",
  "/my-products": "Products",
  "/wishlist": "Wishlist",
  "/chat": "Chats",
  "/profile": "Profile",
  "/admin/dashboard": "Admin Dashboard",
  "/admin/reports": "Reports",
  "/admin/users": "Users",
};

const AppLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme === "dark";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });
  const { user } = useAuth();
  const location = useLocation();
  const isAuthRoute = ["/login", "/register", "/forgot-password"].includes(location.pathname) || location.pathname.startsWith("/reset-password/");

  const toggleDarkMode = () => {
    setIsDark((value) => !value);
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  if (isAuthRoute) {
    return <div className="min-h-screen bg-primary-bg text-text-primary">{children}</div>;
  }

  const title = pageTitles[location.pathname] || (location.pathname.startsWith("/product/") ? "Product Details" : "Campus Resell");

  return (
    <div className="min-h-screen bg-primary-bg text-text-primary transition-colors duration-300">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onToggleCollapse={() => setCollapsed((value) => !value)}
      />

      <div className={`min-h-screen transition-all duration-300 ${collapsed ? "lg:pl-20" : "lg:pl-72"}`}>
        <header className="sticky top-0 z-30 border-b border-border bg-card/70 px-4 py-3 shadow-sm backdrop-blur-xl lg:px-8 transition-colors duration-300">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-xl border border-border p-2 text-text-secondary transition hover:bg-muted/50 lg:hidden"
                aria-label="Open sidebar"
              >
                <span className="block h-0.5 w-5 bg-current" />
                <span className="mt-1.5 block h-0.5 w-5 bg-current" />
                <span className="mt-1.5 block h-0.5 w-5 bg-current" />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">Campus Resell Portal</p>
                <h1 className="truncate text-xl font-black text-text-primary sm:text-2xl tracking-tight">{title}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleDarkMode}
                className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-text-secondary transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-indigo/50 active:scale-95"
                aria-label="Toggle dark mode"
              >
                <Icon name={isDark ? "sun" : "moon"} />
              </button>
              {user && <NotificationDropdown user={user} />}
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
