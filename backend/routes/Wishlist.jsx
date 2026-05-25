import { useEffect, useState } from "react";
import { getWishlistProducts } from "../services/productService";
import Loader from "../components/Loader";
import ProductCard from "../components/ProductCard";

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const { wishlist: fetchedWishlist } = await getWishlistProducts();
        setWishlist(fetchedWishlist);
      } catch (err) {
        console.error("Failed to fetch wishlist", err);
        alert(err.response?.data?.message || "Failed to load wishlist");
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Wishlist</h1>

      {wishlist.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed">
          <p className="text-gray-500">Your wishlist is empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;