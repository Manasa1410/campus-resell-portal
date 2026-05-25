import { useEffect, useState } from "react";
import { getMyProducts, deleteProduct, updateProductStatus } from "../../services/productService";
import Loader from "../../components/Loader";
import { Link } from "react-router-dom";

const MyProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUserProducts = async () => {
    try {
      const data = await getMyProducts();
      setProducts(data.products);
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(id);
      setProducts(products.filter((p) => p._id !== id));
      alert("Product deleted successfully");
    } catch (err) {
      alert("Failed to delete product");
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "available" ? "sold" : "available";
    try {
      await updateProductStatus(id, newStatus);
      setProducts(products.map(p => p._id === id ? { ...p, status: newStatus } : p));
    } catch (err) {
      alert("Failed to update status");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Listed Products</h1>
      {products.length === 0 ? (
        <p className="text-gray-500 text-center py-10">You haven't listed any products yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product._id} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
              <img 
                src={product.images[0] || "/default-product.png"} 
                alt={product.title} 
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg truncate">{product.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full uppercase font-bold ${product.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {product.status}
                  </span>
                </div>
                <p className="text-blue-600 font-bold mb-4">₹{product.price}</p>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleStatus(product._id, product.status)}
                    className="flex-1 text-xs bg-gray-800 text-white py-2 rounded-lg hover:bg-black transition"
                  >
                    {product.status === "available" ? "Mark as Sold" : "Mark Available"}
                  </button>
                  <button 
                    onClick={() => handleDelete(product._id)}
                    className="px-3 text-xs border border-red-500 text-red-500 py-2 rounded-lg hover:bg-red-50 transition"
                  >
                    Delete
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