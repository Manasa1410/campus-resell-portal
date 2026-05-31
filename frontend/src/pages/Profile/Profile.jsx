/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import API from "../../services/api";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Icon from "../../components/ui/Icon";
import SkeletonBlock from "../../components/ui/Skeleton";
import useAuth from "../../hooks/useAuth";
import { resolveMediaUrl, withCacheBust } from "../../utils/mediaUrl";

const Profile = () => {
  const { user, setUser, loading: authLoading } = useAuth(); // Use user and setUser from AuthContext
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [updating, setUpdating] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(() => Date.now());

  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Revoke existing preview URL to avoid memory leaks
      if (preview) URL.revokeObjectURL(preview);
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  // Cleanup preview URL on component unmount
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await API.put("/auth/profile", { name, email });
      setUser((prev) => ({ ...prev, name, email })); // Update global user state
      setIsEditing(false);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await API.put("/auth/password", { oldPassword, newPassword });
      setOldPassword("");
      setNewPassword("");
      setShowPassModal(false);
      toast.success("Password updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Password update failed");
    } finally {
      setUpdating(false);
    }
  };

  const updateProfileImage = async () => {
    if (!file) {
      toast.error("Please select an image");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const { data } = await API.put("/auth/profile/avatar", formData);

      const newAvatar = data.avatar || data.user?.avatar;
      if (!newAvatar) throw new Error("Server did not return image URL");

      // Update state directly from response to avoid redundant GET request race conditions
      setUser?.((prev) => ({
        ...prev,
        ...(data.user || {}),
        avatar: newAvatar,
        updatedAt: Date.now()
      }));

      setPreview(null);
      setFile(null);
      setAvatarVersion(Date.now());
      toast.success("Profile image updated");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Failed to update image");
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const loading = authLoading; // Use the loading state from AuthContext

  if (loading || !user) { // If AuthContext is still loading or user is not available yet
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <SkeletonBlock className="h-52" />
        <div className="grid gap-6 lg:grid-cols-3">
          <SkeletonBlock className="h-96" />
          <SkeletonBlock className="h-96 lg:col-span-2" />
        </div>
      </div>
    );
  }

  const getAvatarSrc = (avatar) => {
    if (preview) return preview;
    if (!avatar) return "/default-avatar.svg";

    // If the backend already provided a full URL (starting with http), 
    // skip resolveMediaUrl to prevent double-prefixing the host.
    const resolvedUrl = typeof avatar === "string" && avatar.startsWith("http")
      ? avatar
      : resolveMediaUrl(avatar, "/default-avatar.svg");

    return withCacheBust(resolvedUrl, avatarVersion);
  };

  const stats = [ // Ensure user is not null before accessing properties
    { label: "Products", value: user.totalListings ?? 0 },
    { label: "Wishlist", value: user.wishlist?.length ?? 0 },
    { label: "Chats", value: "Open" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Card className="overflow-hidden">
        <div className="bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-widest text-blue-200">Profile</p>
          <h1 className="mt-2 text-3xl font-black">Account Settings</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Manage your identity, seller profile, and account security from one clean workspace.
          </p>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="p-6 text-center">
          <div className="relative mx-auto w-36">
            <img
              key={`avatar-${avatarVersion}`}
              src={getAvatarSrc(user?.avatar)}
              alt={user?.name}
              onError={(event) => {
                event.currentTarget.src = "/default-avatar.svg";
              }}
              className="h-36 w-36 rounded-full border-4 border-blue-50 object-cover shadow-lg dark:border-slate-800"
            />
            <label className="absolute bottom-2 right-2 grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-blue-600 text-white shadow-lg transition hover:scale-105 hover:bg-blue-700">
              <Icon name="edit" className="h-4 w-4" />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>

          <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">{user.name}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
          <div className="mt-3 flex justify-center gap-2 flex-wrap">
            <Badge tone={user.isAdmin ? "purple" : "blue"}>{user.isAdmin ? "Admin" : "Campus member"}</Badge>
            {user.isVerified && <Badge tone="available">✓ Verified Member</Badge>}
          </div>

          <div className="mt-4 flex justify-center gap-2">
            <Badge tone="purple">{Number(user.averageRating || 0).toFixed(1)} rating</Badge>
          </div>

          {file && (
            <Button type="button" onClick={updateProfileImage} className="mt-5 w-full">
              Save New Avatar
            </Button>
          )}

          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
                <p className="text-lg font-black text-slate-950 dark:text-white">{stat.value}</p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-950 dark:text-white">Profile Details</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Keep your public seller information up to date.</p>
              </div>
              {!isEditing && (
                <Button 
                  type="button" 
                  onClick={() => {
                    setName(user?.name || ""); // Initialize with current user data
                    setEmail(user?.email || ""); // Initialize with current user data
                    setIsEditing(true);
                  }} 
                  variant="secondary"
                >
                  <Icon name="edit" className="h-4 w-4" />
                  Edit Profile
                </Button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Full name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Email address</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    required
                  />
                </label>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={updating}>
                    {updating ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button type="button" onClick={() => setIsEditing(false)} variant="secondary">
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Name</p>
                  <p className="mt-1 font-bold text-slate-950 dark:text-white">{user.name}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Email</p>
                  <p className="mt-1 truncate font-bold text-slate-950 dark:text-white">{user.email}</p>
                </div>
              </div>
            )}

            <div className="mt-6">
              <Button type="button" onClick={() => setShowPassModal(true)} variant="danger">
                Change Password
              </Button>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card as={Link} to="/my-products" hover className="p-6">
              <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-200">
                <Icon name="bag" />
              </span>
              <h3 className="font-black text-slate-950 dark:text-white">My Listings</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Edit, sell, or remove your products.</p>
            </Card>
            <Card as={Link} to="/chat" hover className="p-6">
              <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200">
                <Icon name="chat" />
              </span>
              <h3 className="font-black text-slate-950 dark:text-white">Chats</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Continue conversations with buyers and sellers.</p>
            </Card>
          </div>
        </div>
      </div>

      <Modal open={showPassModal} title="Change Password" onClose={() => setShowPassModal(false)}>
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <input
            type="password"
            placeholder="Old password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-100 dark:text-slate-950"
            required
          />
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-100 dark:text-slate-950"
            required
          />
          <Button type="submit" disabled={updating} className="w-full">
            {updating ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default Profile;
