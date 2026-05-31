import { Link, NavLink, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { withCacheBust } from "../utils/mediaUrl";

const icons = {
  dashboard: (
    <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z" />
  ),
  products: (
    <path d="M6 7h12l-1 14H7L6 7Zm3 0a3 3 0 0 1 6 0M9 11h6" />
  ),
  add: (
    <path d="M12 5v14M5 12h14" />
  ),
  heart: (
    <path d="M20.5 8.5c0 5-8.5 10-8.5 10s-8.5-5-8.5-10A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 8.5 2.5Z" />
  ),
  chat: (
    <path d="M4 5h16v11H8l-4 4V5Z" />
  ),
  user: (
    <path d="M20 21a8 8 0 0 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
  ),
  admin: (
    <path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3Z" />
  ),
  reports: (
    <path d="M5 4h10l4 4v12H5V4Zm10 0v5h5M8 13h8M8 17h5" />
  ),
  users: (
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  ),
  login: (
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
  ),
  logout: (
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  ),
};

const Icon = ({ name }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5 shrink-0 text-icon-color transition-colors"
    aria-hidden="true"
  >
    {icons[name]}
  </svg>
);

const getAvatarSrc = (avatar, lastUpdated) => {
  return withCacheBust(avatar, lastUpdated || "1");
};

const Sidebar = ({ collapsed, mobileOpen, onCloseMobile, onToggleCollapse }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const primaryItems = [
    { label: "Dashboard", path: "/", icon: "dashboard" },
    { label: "Products", path: "/my-products", icon: "products", auth: true },
    { label: "Add Product", path: "/add-product", icon: "add", auth: true },
    { label: "Wishlist", path: "/wishlist", icon: "heart", auth: true },
    { label: "Chats", path: "/chat", icon: "chat", auth: true },
    { label: "Profile", path: "/profile", icon: "user", auth: true },
  ];

  const adminItems = [
    { label: "Admin", path: "/admin/dashboard", icon: "admin" },
    { label: "Reports", path: "/admin/reports", icon: "reports" },
    { label: "Users", path: "/admin/users", icon: "users" },
  ];

  const handleLogout = () => {
    logout();
    onCloseMobile();
    navigate("/login");
  };

  const navLinkClass = ({ isActive }) =>
    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-200 ease-out hover:translate-x-1.5 ${
      isActive
        ? "bg-accent-indigo text-white active-glow shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:bg-accent-indigo/90"
        : "text-text-secondary hover:text-text-primary hover:bg-muted/50"
    }`;

  const renderItem = (item) => (
    <NavLink key={item.path} to={item.path} onClick={onCloseMobile} className={navLinkClass}>
      <Icon name={item.icon} />
      <span className={`${collapsed ? "lg:hidden" : "block"} truncate`}>{item.label}</span>
    </NavLink>
  );

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm transition-opacity lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onCloseMobile}
      />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col bg-card border-r border-border text-text-primary shadow-2xl transition-all duration-300 ease-out ${
          collapsed ? "lg:w-20!" : "lg:w-72!"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} dark:bg-bg-gradient`}
      >
        <div className="flex h-full flex-col p-4">
          <div className={`mb-6 flex items-center ${collapsed ? "lg:flex-col lg:gap-3" : "justify-between"}`}>
            <Link to="/" onClick={onCloseMobile} className={`flex items-center gap-3 ${collapsed ? "lg:justify-center" : ""}`}>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-indigo text-lg font-black shadow-lg shadow-accent-indigo/20">
                C
              </span>
              <span className={`${collapsed ? "lg:hidden" : "block"} text-lg font-black tracking-tight text-text-primary`}>
                Campus Resell
              </span>
            </Link>

            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-muted/50 text-text-secondary transition hover:bg-muted/70 hover:text-text-primary lg:grid"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <span className="block h-0.5 w-4 bg-current" />
              <span className="mt-1 block h-0.5 w-4 bg-current" />
              <span className="mt-1 block h-0.5 w-4 bg-current" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto">
            {primaryItems.filter((item) => !item.auth || user).map(renderItem)}

            {!user && (
              <div className="pt-4">
                {renderItem({ label: "Login", path: "/login", icon: "login" })}
                {renderItem({ label: "Register", path: "/register", icon: "user" })}
              </div>
            )}

            {user?.isAdmin && (
              <div className="pt-6">
                <p className={`${collapsed ? "lg:hidden" : "block"} px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary`}>
                  Admin
                </p>
                <div className="space-y-1">{adminItems.map(renderItem)}</div>
              </div>
            )}
          </nav>

          {user && (
            <div className="border-t border-border pt-4">
              <div className={`mb-3 flex items-center gap-3 rounded-xl bg-muted/50 p-3 border border-border ${collapsed ? "lg:justify-center" : ""}`}>
                <img
                  src={getAvatarSrc(user?.avatar, user?.updatedAt)}
                  alt={user?.name || "User"}
                  onError={(event) => {
                    event.currentTarget.src = "/default-avatar.svg";
                  }}
                  className="h-10 w-10 rounded-full border border-indigo-500/20 dark:border-indigo-500/30 object-cover"
                />
                <div className={`${collapsed ? "lg:hidden" : "block"} min-w-0`}>
                  <p className="truncate text-sm font-bold text-text-primary">{user?.name || "Campus User"}</p>
                  <p className="truncate text-xs text-text-secondary">{user?.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 dark:text-red-200 transition hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-100"
              >
                <Icon name="logout" />
                <span className={`${collapsed ? "lg:hidden" : "block"}`}>Logout</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
