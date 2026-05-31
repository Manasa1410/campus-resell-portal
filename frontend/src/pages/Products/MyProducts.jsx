import { useEffect, useState } from "react";
import { getMyProducts, deleteProduct, updateProductStatus } from "../../services/productService";
import Loader from "../../components/Loader";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import useAuth from "../../hooks/useAuth";
import { resolveMediaUrl } from "../../utils/mediaUrl";

const MyProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setUser } = useAuth();

  useEffect(() => {
    const fetchUserProducts = async () => {
      try {
        const data = await getMyProducts();
        // Safely access products and default to empty array
        setProducts(data?.products || []);
        if (setUser && data?.products) {
          setUser(prev => ({ ...prev, totalListings: data.products.length }));
        }
      } catch (err) {
        console.error("Failed to fetch products", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProducts();
  }, [setUser]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(id);
      setProducts(products.filter((p) => p._id !== id));
      if (setUser) {
        setUser(prev => ({ ...prev, totalListings: Math.max(0, (prev.totalListings || 1) - 1) }));
      }
      toast.success("Product deleted successfully ✅");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete product");
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "available" ? "sold" : "available";
    try {
      await updateProductStatus(id, newStatus);
      setProducts(products.map(p => p._id === id ? { ...p, status: newStatus } : p));
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black text-text-primary dark:text-white tracking-tight">My Listed Products</h1>
        <Link to="/add-product" className="bg-accent-indigo text-white px-4 py-2 rounded-xl font-bold hover:bg-[#4F46E5] shadow-lg shadow-indigo-500/20 transition-all active:scale-95">+ Add New</Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-2xl border border-dashed border-slate-700">
          <p className="text-slate-400">You haven't listed any products yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product._id} className="glass-panel rounded-2xl overflow-hidden shadow-2xl transition hover:border-accent-indigo/30">
              <div className="relative overflow-hidden bg-slate-800">
                <img 
                  src={resolveMediaUrl(product.images?.[0], "/default-product.png")} // resolveMediaUrl handles absolute Cloudinary URLs
                  alt={product.title} 
                  className="w-full h-48 object-cover transition duration-300 hover:scale-105" 
                />
                <span className={`absolute top-2 right-2 text-[10px] px-2 py-1 rounded-full uppercase font-bold shadow-sm ${product.status === 'available' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                  {product.status}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg text-text-primary dark:text-white truncate mb-1">{product.title}</h3>

                {/* ⭐ Rating Display */}
                <div className="flex items-center gap-1 text-xs mb-2">
                  <span className="text-yellow-500">{"★".repeat(Math.round(product.rating || 0))}</span>
                  <span className="text-text-secondary">({product.numReviews || 0})</span>
                </div>

                <p className="text-accent-indigo dark:text-indigo-400 font-black text-xl mb-4">₹{product.price}</p>
                
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Link to={`/edit-product/${product._id}`} className="flex-1 text-center text-xs bg-muted text-text-primary dark:text-white py-2 rounded-xl font-bold hover:bg-muted-foreground/20 transition">
                      Edit
                    </Link>
                    <button onClick={() => toggleStatus(product._id, product.status)} className="flex-1 text-xs bg-slate-800 text-white py-2.5 rounded-xl font-bold hover:bg-slate-700 transition">
                      {product.status === "available" ? "Mark Sold" : "Mark Available"}
                    </button>
                  </div>
                  <button onClick={() => handleDelete(product._id)} className="w-full text-xs border border-red-500/30 text-red-400 py-2.5 rounded-xl font-bold hover:bg-red-500/10 transition">
                    Delete Product
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyProducts;