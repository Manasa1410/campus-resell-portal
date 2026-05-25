import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import NotificationDropdown from "./NotificationDropdown";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-md px-6 py-3 flex justify-between items-center">
  
  <Link to="/" className="text-xl font-bold text-blue-600">
    Campus Resell
  </Link>

  <div className="flex items-center gap-4">

    <Link to="/" className="hover:text-blue-500">
      Home
    </Link>

    {user ? (
      <>
        <Link to="/add-product">Add Product</Link>
        <Link to="/my-products" className="text-blue-500">My Products</Link>
        <Link to="/wishlist" className="hover:text-blue-500">Wishlist</Link>
        <Link to="/chat">Chat</Link>
        <Link to="/profile">Profile</Link>

        {/* 🔔 Notifications */}
        <NotificationDropdown user={user} />

        {user.isAdmin && (
          <>
            <Link to="/admin/dashboard" className="hover:text-blue-500 font-bold text-indigo-600">Admin Dashboard</Link>
            <Link to="/admin/reports">Admin Reports</Link>
            <Link to="/admin/users">Admin Users</Link>
          </>
        )}

        {/* ✅ SINGLE Avatar ONLY */}
        <Link to="/profile">
          <img
            src={
              user?.avatar
                ? `http://localhost:5001/${user.avatar}`
                : "/default-avatar.png"
            }
            alt="avatar"
            className="w-9 h-9 rounded-full object-cover border cursor-pointer"
          />
        </Link>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-3 py-1 rounded-lg"
        >
          Logout
        </button>
      </>
    ) : (
      <>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </>
    )}

  </div>
</nav>
  );
};

export default Navbar;