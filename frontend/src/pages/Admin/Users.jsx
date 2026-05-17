import { useEffect, useState } from "react";
import API from "../../services/api";
import Loader from "../../components/Loader";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 📥 Fetch all users
  const fetchUsers = async () => {
    try {
      const { data } = await API.get("/auth/users"); // make sure backend route exists
      setUsers(data.users);
    } catch (err) {
      alert(err.response?.data?.message || "Error fetching users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 🔨 Ban / Unban User
  const toggleBan = async (userId, isBanned) => {
    try {
      if (isBanned) {
        await API.put(`/auth/unban/${userId}`);
        alert("User unbanned");
      } else {
        await API.put(`/reports/ban/${userId}`);
        alert("User banned");
      }
      fetchUsers();
    } catch (err) {
      alert("Action failed");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Users</h1>

      {users.length === 0 ? (
        <p>No users found</p>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user._id}
              className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
            >
              {/* User Info */}
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>

                <p
                  className={`text-sm ${
                    user.isBanned ? "text-red-500" : "text-green-600"
                  }`}
                >
                  {user.isBanned ? "Banned" : "Active"}
                </p>
              </div>

              {/* Actions */}
              <button
                onClick={() => toggleBan(user._id, user.isBanned)}
                className={`px-4 py-1 rounded text-white ${
                  user.isBanned
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {user.isBanned ? "Unban" : "Ban"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Users;