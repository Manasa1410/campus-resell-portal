/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect */
import { createContext, useEffect, useState } from "react";
import API from "../services/api";
import { socket } from "../sockets/socket";

export const AuthContext = createContext(); // 👈 IMPORTANT export

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        setUser(null);
        return;
      }

      const { data } = await API.get("/auth/profile");
      setUser(data.user || data);
      // Connect socket after user is loaded
      socket.connect();
    } catch (err) {
      console.error("Failed to load user", err);
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = (token) => {
    localStorage.setItem("token", token);
    loadUser();
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    socket.disconnect();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        loading,
        isLoggedIn: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};