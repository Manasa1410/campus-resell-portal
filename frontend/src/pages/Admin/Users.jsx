import { useEffect, useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import API from "../../services/api";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import Badge from "../../components/ui/Badge";
import SkeletonBlock from "../../components/ui/Skeleton";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updating, setUpdating] = useState(null); // Tracks the ID of the user currently being toggled

  const fetchUsers = async () => {
    try {
      const { data } = await API.get("/users/admin/all");
      setUsers(data.users || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Efficiently filter users by email based on search input
  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
  }, [users, searchTerm]);

  const handleToggleBan = async (id) => {
    setUpdating(id);
    try {
      // Calls the toggleBanUser logic in userController.js
      const { data } = await API.put(`/users/admin/ban/${id}`);
      toast.success(data.message);
      
      // Update local state to reflect the change immediately
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, isBanned: data.isBanned } : u))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <div className="p-6 space-y-4"><SkeletonBlock className="h-20" /><SkeletonBlock className="h-96" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-950 dark:text-white leading-tight">Campus Users</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage member access and community safety.</p>
          </div>
          <div className="relative w-full max-w-md">
            <Icon name="search" className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search users by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 pl-10 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-900"
            />
          </div>
        </div>

        <Card className="overflow-hidden shadow-xl border-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900/50">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider">User Details</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right font-bold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone={user.isAdmin ? "purple" : "blue"}>{user.isAdmin ? "Admin" : "Student"}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone={user.isBanned ? "danger" : "success"}>{user.isBanned ? "Banned" : "Active"}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!user.isAdmin && (
                          <Button variant={user.isBanned ? "secondary" : "danger"} size="sm" disabled={updating === user._id} onClick={() => handleToggleBan(user._id)}>
                            {updating === user._id ? "..." : user.isBanned ? "Unban User" : "Ban User"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" className="px-6 py-20 text-center text-slate-400 italic">No users found matching "{searchTerm}"</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Users;