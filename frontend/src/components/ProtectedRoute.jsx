import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import Loader from "./Loader";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <Loader />;
  }

  const token = localStorage.getItem("token");

  // If no token → redirect to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // If admin only and user is not admin → redirect to home
  if (adminOnly && !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  // If logged in → show page
  return children;
};

export default ProtectedRoute;