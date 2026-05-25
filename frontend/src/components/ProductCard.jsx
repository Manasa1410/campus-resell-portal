import { Link } from "react-router-dom";
import Card from "./ui/Card";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Icon from "./ui/Icon";

const getImageSrc = (src) => {
  if (!src) return "/default-product.png";
  if (src.startsWith("http") || src.startsWith("/")) return src;
  return `http://localhost:5001/${src}`;
};

const ProductCard = ({ product, onRemoveFromWishlist, onWishlistToggle }) => {
  const statusTone = product.status === "available" ? "available" : "sold";

  return (
    <Card className="group overflow-hidden glass-panel rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)]">
      <div className="relative overflow-hidden bg-slate-800">
        <img
          src={getImageSrc(product.images?.[0])}
          alt={product.title}
          className="h-52 w-full object-cover transition duration-300 group-hover:scale-105 "
        />

        <div className="absolute left-3 top-3">
          <Badge tone={statusTone}>{product.status || "available"}</Badge>
        </div>

        {(onWishlistToggle || onRemoveFromWishlist) && (
          <button
            type="button"
            onClick={() => (onRemoveFromWishlist ? onRemoveFromWishlist(product._id) : onWishlistToggle(product._id))}
            className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-red-500 shadow-md backdrop-blur transition hover:scale-105 hover:bg-white dark:bg-slate-950/90"
            aria-label={onRemoveFromWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Icon name="heart" className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h2 className="truncate text-lg font-bold text-text-primary dark:text-white tracking-tight">{product.title}</h2>
          <p className="mt-1 text-sm text-text-secondary">{product.category || "Campus item"}</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xl font-black text-accent-indigo dark:text-indigo-400 transition-colors">₹{product.price}</p>
          <p className="text-xs font-semibold text-text-secondary">
            {product.rating ? product.rating.toFixed(1) : "0.0"} ({product.numReviews || 0})
          </p>
        </div>

        <Button as={Link} to={`/product/${product._id}`} className="w-full bg-accent-indigo hover:bg-[#4F46E5] text-white rounded-xl py-2.5 font-bold transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
          View Details
        </Button>

        {onRemoveFromWishlist && (
          <Button
            variant="danger"
            className="w-full mt-2"
            onClick={() => onRemoveFromWishlist(product._id)}
          >
            Remove
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ProductCard;
