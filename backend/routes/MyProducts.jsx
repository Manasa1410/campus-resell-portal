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
      alert("Product deleted successfully ✅");
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Listed Products</h1>
        <Link to="/add-product" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Add New</Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed">
          <p className="text-gray-500">You haven't listed any products yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product._id} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
              <div className="relative">
                <img src={product.images[0] || "/default-product.png"} alt={product.title} className="w-full h-48 object-cover" />
                <span className={`absolute top-2 right-2 text-[10px] px-2 py-1 rounded-full uppercase font-bold shadow-sm ${product.status === 'available' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                  {product.status}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg truncate mb-1">{product.title}</h3>
                <p className="text-blue-600 font-bold mb-4">₹{product.price}</p>
                
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Link to={`/edit-product/${product._id}`} className="flex-1 text-center text-xs bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition">
                      Edit
                    </Link>
                    <button onClick={() => toggleStatus(product._id, product.status)} className="flex-1 text-xs bg-gray-800 text-white py-2 rounded-lg hover:bg-black transition">
                      {product.status === "available" ? "Mark Sold" : "Mark Available"}
                    </button>
                  </div>
                  <button onClick={() => handleDelete(product._id)} className="w-full text-xs border border-red-500 text-red-500 py-2 rounded-lg hover:bg-red-50 transition">
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