import { useEffect, useState } from "react";
import { getWishlistProducts, toggleWishlist } from "../../services/productService";
import ProductCard from "../../components/ProductCard";
import useAuth from "../../hooks/useAuth";
import { toast } from "react-hot-toast";
import EmptyState from "../../components/ui/EmptyState";
import Icon from "../../components/ui/Icon";
import { ProductGridSkeleton } from "../../components/ui/Skeleton";

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, setUser } = useAuth();

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const { wishlist: fetchedWishlist } = await getWishlistProducts();
        setWishlist(fetchedWishlist);
        if (setUser) {
          setUser(prev => ({ ...prev, wishlist: fetchedWishlist }));
        }
      } catch (err) {
        console.error("Failed to fetch wishlist", err);
        toast.error(err.response?.data?.message || "Failed to load wishlist");
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  const handleRemoveFromWishlist = async (productId) => {
    try {
      const { wishlist: updatedUserWishlist } = await toggleWishlist(productId);
      setWishlist((prevWishlist) => prevWishlist.filter((product) => product._id !== productId));
      if (setUser) {
        setUser(prev => ({ ...prev, wishlist: updatedUserWishlist }));
      }
      toast.success("Removed from wishlist");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove from wishlist");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-9 w-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        <ProductGridSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-text-secondary dark:text-white">Saved items</p>
        <h1 className="text-3xl font-black text-text-primary dark:text-white">Wishlist</h1>
        <p className="mt-2 text-sm text-text-secondary dark:text-white">Keep track of campus deals you want to revisit.</p>
      </div>

      {wishlist.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          description="Save products while browsing and they will appear here for quick access."
          icon={<Icon name="heart" />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {wishlist.map((product) => (
            <ProductCard key={product._id} product={product} onRemoveFromWishlist={handleRemoveFromWishlist} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
