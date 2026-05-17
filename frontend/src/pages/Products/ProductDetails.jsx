import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../../services/api";
import { createChat } from "../../services/chatService";
import { deleteProduct, updateProductStatus } from "../../services/productService";
import useAuth from "../../hooks/useAuth";
import Loader from "../../components/Loader";

const ProductDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [markingSold, setMarkingSold] = useState(false);

  // 📥 Fetch product by ID
  const fetchProduct = async () => {
    try {
      const { data } = await API.get(`/products/${id}`);
      setProduct(data.product);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    const confirmationMessage =
      newStatus === "sold"
        ? "Are you sure you want to mark this product as sold?"
        : "Are you sure you want to mark this product as available again?";

    if (!window.confirm(confirmationMessage)) {
      return;
    }

    setMarkingSold(true);

    try {
      await updateProductStatus(id, newStatus);
      alert(`Product marked as ${newStatus}`);
      fetchProduct();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update product status");
    } finally {
      setMarkingSold(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!window.confirm("Do you want to permanently delete this product?")) {
      return;
    }

    try {
      await deleteProduct(id);
      alert("Product deleted successfully");
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete product");
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  if (loading) return <Loader />;

  if (!product) {
    return (
      <div className="p-6 text-center text-red-500">
        Product not found
      </div>
    );
  }

  return (
    <div className="p-6 grid md:grid-cols-2 gap-6">
      
      {/* 📸 Images */}
      <div>
        <img
          src={product.images?.[0] || "https://via.placeholder.com/400"}
          alt={product.title}
          className="w-full h-80 object-cover rounded-xl"
        />
      </div>

      {/* 📄 Details */}
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">{product.title}</h1>

        <p className="text-blue-600 text-xl font-semibold">
          ₹{product.price}
        </p>

        <p className="text-gray-600">{product.description}</p>

        <p>
          <span className="font-semibold">Category:</span>{" "}
          {product.category}
        </p>

        <p>
          <span className="font-semibold">Status:</span>{" "}
          <span
            className={
              product.status === "available"
                ? "text-green-600"
                : "text-red-500"
            }
          >
            {product.status}
          </span>
        </p>

        {/* 👤 Seller */}
        <p>
          <span className="font-semibold">Seller:</span>{" "}
          {product.seller?.name || "Unknown"}
        </p>

        {user && product.seller?._id === user._id && (
          <button
            disabled={markingSold}
            className={`mt-4 text-white px-4 py-2 rounded-lg disabled:opacity-50 ${
              product.status === "available"
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            }`}
            onClick={() =>
              handleStatusChange(
                product.status === "available" ? "sold" : "available"
              )
            }
          >
            {markingSold
              ? "Updating status..."
              : product.status === "available"
              ? "Mark as Sold"
              : "Mark as Available"}
          </button>
        )}

        {/* 💬 Chat Button */}
        <button
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          onClick={async () => {
            if (!product.seller?._id) {
              return alert("Seller details unavailable");
            }

            try {
              const { chat } = await createChat(id, product.seller._id);
              navigate(`/chat?chatId=${chat._id}`);
            } catch (err) {
              alert(err.response?.data?.message || "Unable to start chat");
            }
          }}
        >
          Chat with Seller
        </button>

        {user && product.seller?._id === user._id && (
          <button
            className="mt-3 w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            onClick={handleDeleteProduct}
          >
            Delete Product
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;