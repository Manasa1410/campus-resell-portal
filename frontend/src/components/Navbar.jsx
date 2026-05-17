import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-md px-6 py-3 flex justify-between items-center">
      
      {/* Logo */}
      <Link to="/" className="text-xl font-bold text-blue-600">
        Campus Resell
      </Link>

      {/* Links */}
      <div className="flex items-center gap-4">

        <Link to="/" className="hover:text-blue-500">
          Home
        </Link>

        {/* 🔐 AUTHENTICATED USER */}
        {user ? (
          <>
            <Link to="/add-product" className="hover:text-blue-500">
              Add Product
            </Link>

            <Link to="/chat" className="hover:text-blue-500">
              Chat
            </Link>

            <Link to="/profile" className="hover:text-blue-500">
              Profile
            </Link>

            {/* 👑 ADMIN LINKS */}
            {user.isAdmin && (
              <>
                <Link to="/admin/reports" className="hover:text-blue-500">
                  Admin Reports
                </Link>

                <Link to="/admin/users" className="hover:text-blue-500">
                  Admin Users
                </Link>
              </>
            )}

            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
            >
              Logout
            </button>
          </>
        ) : (
          /* 🚫 GUEST USER */
          <>
            <Link to="/login" className="hover:text-blue-500">
              Login
            </Link>

            <Link
              to="/register"
              className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600"
            >
              Register
            </Link>
          </>
        )}

      </div>
    </nav>
  );
};

export default Navbar;