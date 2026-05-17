import { useEffect, useState } from "react";
import API from "../../services/api";
import Loader from "../../components/Loader";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // 📥 Fetch profile
  const fetchProfile = async () => {
    try {
      const { data } = await API.get("/auth/profile");
      setUser(data);
    } catch (err) {
      alert("Failed to load profile");
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // 🚪 Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) return <Loader />;

  if (!user) {
    return (
      <div className="p-6 text-center text-red-500">
        User not found
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      
      <div className="bg-white p-6 rounded-xl shadow-md w-96 text-center">

        {/* Avatar */}
        <img
          src={
            user.avatar ||
            "https://via.placeholder.com/150"
          }
          alt="profile"
          className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
        />

        {/* Name */}
        <h2 className="text-xl font-bold">{user.name}</h2>

        {/* Email */}
        <p className="text-gray-600">{user.email}</p>

        {/* ID */}
        <p className="text-sm text-gray-400 mt-2">
          ID: {user._id}
        </p>

        {/* Button */}
        <button
          onClick={handleLogout}
          className="mt-5 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
        >
          Logout
        </button>

      </div>
    </div>
  );
};

export default Profile;