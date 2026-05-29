import { Link } from "react-router-dom";
import Card from "./ui/Card";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Icon from "./ui/Icon";
import { BACKEND_URL } from "../services/api";

const getImageSrc = (src) => {
  if (!src) return "/default-product.png";
  if (src.startsWith("http") || src.startsWith("/")) return src;
  return `${BACKEND_URL}/${src}`;
};

const ProductCard = ({ product, onRemoveFromWishlist, onWishlistToggle }) => {
  const statusTone = product.status === "available" ? "available" : "sold";

  return (
    <Card className="group overflow-hidden rounded-3xl glass-panel transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)]">
      <div className="relative overflow-hidden bg-slate-800">
        <img
          src={getImageSrc(product.images?.[0])}
          alt={product.title}
          className="h-52 w-full object-cover transition duration-300 group-hover:scale-105"
        />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <Badge tone={statusTone}>{product.status || "available"}</Badge>
          {product.isFeatured && <Badge tone="featured">Featured</Badge>}
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
          <h2 className="truncate text-lg font-bold tracking-tight text-text-primary dark:text-white">{product.title}</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {product.category || "Campus item"} {product.condition ? `- ${product.condition}` : ""}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xl font-black text-accent-indigo transition-colors dark:text-indigo-400">INR {product.price}</p>
          <p className="text-xs font-bold text-text-secondary">{product.views || 0} views</p>
        </div>

        <Button as={Link} to={`/product/${product._id}`} className="w-full">
          View Details
        </Button>

        {onRemoveFromWishlist && (
          <Button variant="danger" className="mt-2 w-full" onClick={() => onRemoveFromWishlist(product._id)}>
            Remove
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ProductCard;
