import { useEffect, useState } from "react";
import API from "../../services/api";
import Loader from "../../components/Loader";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await API.get("/users/admin/stats");
        setStats(data.stats);
      } catch (err) {
        console.error("Failed to load stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <Loader />;

  const cards = [
    { label: "Total Users", value: stats?.users, color: "bg-blue-500", link: "/admin/users" },
    { label: "Total Products", value: stats?.products, color: "bg-indigo-500", link: "/" },
    { label: "Available Items", value: stats?.available, color: "bg-green-500", link: "/" },
    { label: "Active Reports", value: "Review", color: "bg-red-500", link: "/admin/reports" },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-slate-800">Admin Command Center</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <Link to={card.link} key={i} className={`${card.color} p-6 rounded-2xl text-white shadow-lg transform hover:scale-105 transition`}>
            <p className="text-sm font-bold opacity-80 uppercase mb-1">{card.label}</p>
            <p className="text-4xl font-black">{card.value}</p>
          </Link>
        ))}
      </div>
      <div className="mt-10 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <p className="text-slate-500 mb-6">Use the side links in the Navbar to manage specific sections or click the tiles above.</p>
      </div>
    </div>
  );
};

export default AdminDashboard;