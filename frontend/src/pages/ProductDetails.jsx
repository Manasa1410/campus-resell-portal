/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../../services/api";
import { createChat } from "../../services/chatService";
import { deleteProduct, updateProductStatus, toggleWishlist } from "../../services/productService";
import useAuth from "../../hooks/useAuth";
import ReportModal from "../../services/ReportModal";
import Loader from "../../components/Loader";
import ProductCard from "../../components/ProductCard";
import { toast } from "react-hot-toast";

const ProductDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { user, setUser } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [markingSold, setMarkingSold] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [wishlisted, setWishlisted] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [sellerIsBanned, setSellerIsBanned] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);

  const fetchProduct = async () => {
    try {
      const { data } = await API.get(`/products/${id}`);
      setProduct(data.product);
      setSellerIsBanned(data.product.seller?.isBanned || false);

      const viewed = JSON.parse(localStorage.getItem("recentlyViewed")) || [];
      const filtered = viewed.filter((p) => p._id !== data.product._id);
      localStorage.setItem("recentlyViewed", JSON.stringify([data.product, ...filtered].slice(0, 10)));

      const { data: allData } = await API.get("/products");
      const similar = allData.products.filter((p) => p.category === data.product.category && p._id !== id).slice(0, 4);
      setSimilarProducts(similar);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    const confirmationMessage =
      newStatus === "sold"
        ? "Are you sure you want to mark this product as sold?"
        : "Are you sure you want to mark this product as available again?";

    if (!window.confirm(confirmationMessage)) return;

    setMarkingSold(true);

    try {
      await updateProductStatus(id, newStatus);
      toast.success(`Product marked as ${newStatus}`);
      fetchProduct();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update product status");
    } finally {
      setMarkingSold(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!window.confirm("Do you want to permanently delete this product?")) return;

    try {
      await deleteProduct(id);
      toast.success("Product deleted successfully");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete product");
    }
  };

  const handleWishlistToggle = async () => {
    try {
      const data = await toggleWishlist(id);
      setWishlisted(!wishlisted);

      if (user && setUser && data.wishlist) {
        setUser(prev => ({ ...prev, wishlist: data.wishlist }));
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating wishlist");
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const { data } = await API.post(`/products/${id}/reviews`, { rating, comment });
      toast.success("Review submitted");
      setComment("");
      setProduct((prev) => ({
        ...prev,
        reviews: data.reviews,
        rating: data.rating,
        numReviews: data.numReviews,
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Error submitting review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleToggleSellerBan = async () => {
    if (!window.confirm(`Are you sure you want to ${sellerIsBanned ? "unban" : "ban"} this seller?`)) return;
    try {
      const { data } = await API.put(`/users/admin/ban/${product.seller._id}`);
      toast.success(data.message);
      setSellerIsBanned(!sellerIsBanned);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update seller status");
    }
  };

  useEffect(() => {
    if (user?._id && user.wishlist) {
      const isAdded = user.wishlist.some((wishId) => (typeof wishId === "string" ? wishId : wishId._id) === id);
      setWishlisted(isAdded);
    } else {
      setWishlisted(false);
    }
  }, [user?._id, user?.wishlist?.length, id]);

  useEffect(() => {
    fetchProduct();
    setCurrentImageIndex(0);
  }, [id]);

  if (loading) return <Loader />;

  if (!product) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center font-semibold text-red-600 shadow-sm">
        Product not found
      </div>
    );
  }

  const isOwner = user && product.seller?._id === user._id;
  const canContactSeller = user && product.seller?._id && !isOwner;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl glass-panel shadow-2xl shadow-slate-900/5">
            <div className="relative grid aspect-4/3 place-items-center bg-slate-900/40">
              <img
                src={product.images?.[currentImageIndex] || "/default-product.png"}
                alt={product.title}
                className="h-full w-full object-contain p-4"
              />

              {product.images?.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))}
                    className="absolute left-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-lg font-bold text-slate-700 shadow-md transition hover:bg-white"
                    aria-label="Previous image"
                  >
                    {"<"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))}
                    className="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-lg font-bold text-slate-700 shadow-md transition hover:bg-white"
                    aria-label="Next image"
                  >
                    {">"}
                  </button>
                </>
              )}
            </div>
          </div>

          {product.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {product.images.map((img, index) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setCurrentImageIndex(index)}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-muted/50 transition ${
                    currentImageIndex === index ? "border-blue-600 shadow-md" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt={`${product.title} thumbnail ${index + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl glass-panel p-6 shadow-2xl shadow-indigo-500/5 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 inline-flex rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                {product.category || "Campus item"}
              </p>
              <h1 className="text-3xl font-black leading-tight text-text-primary dark:text-white tracking-tight">{product.title}</h1>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-bold ${
                product.status === "available" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
              }`}
            >
              {product.status}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <p className="text-3xl font-black text-accent-indigo transition-colors">INR {product.price}</p>
            <p className="rounded-full bg-muted/50 px-4 py-1.5 text-sm font-semibold text-text-secondary">
              Rating {product.rating ? product.rating.toFixed(1) : "0.0"} / 5 ({product.numReviews || 0})
            </p>
          </div>

          <p className="mt-6 leading-7 text-text-secondary">{product.description}</p>

          <div className="mt-8 grid gap-4 rounded-2xl bg-muted/30 p-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-white">Seller</p>
              <p className="mt-1 font-bold text-text-primary dark:text-white">{product.seller?.name || "Unknown"}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-text-secondary dark:text-white">Category</p>
              <p className="mt-1 font-bold text-text-primary dark:text-white">{product.category || "General"}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {canContactSeller && (
              <button
                type="button"
                className="rounded-xl bg-accent-indigo px-5 py-3 text-sm font-bold text-white shadow-lg shadow-accent-indigo/20 transition hover:bg-accent-indigo/90 active:scale-95"
                onClick={async () => {
                  try {
                    const { chat } = await createChat(id, product.seller._id);
                    navigate(`/chat?chatId=${chat._id}`);
                  } catch (err) {
                    toast.error(err.response?.data?.message || "Unable to start chat");
                  }
                }}
              >
                Chat with Seller
              </button>
            )}

            {user && (
              <button
                type="button"
                onClick={handleWishlistToggle}
                className={`rounded-xl border px-5 py-3 text-sm font-bold transition active:scale-95 ${
                  wishlisted
                    ? "border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20" // Red for wishlisted
                    : "border-border bg-muted/50 text-text-secondary hover:border-accent-indigo/50 hover:text-accent-indigo" // Default for not wishlisted
                }`}
              >
                {wishlisted ? "Wishlisted" : "Add to Wishlist"}
              </button>
            )}
          </div>

          {isOwner && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={markingSold}
                className={`rounded-xl px-5 py-3 text-sm font-bold text-white transition disabled:opacity-50 ${
                  product.status === "available" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
                onClick={() => handleStatusChange(product.status === "available" ? "sold" : "available")}
              >
                {markingSold ? "Updating..." : product.status === "available" ? "Mark as Sold" : "Mark as Available"}
              </button>
              <button
                type="button"
                className="rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500/20"
                onClick={handleDeleteProduct}
              >
                Delete Product
              </button>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-4">
            {user && product.seller?._id !== user._id && (
              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="text-sm font-bold text-text-secondary transition hover:text-red-600"
              >
                Report this listing
              </button>
            )}

            {user?.isAdmin && product.seller?._id !== user._id && (
              <button
                type="button"
                onClick={handleToggleSellerBan} // Assuming these colors are fine for admin actions
                className={`text-sm font-bold transition ${sellerIsBanned ? "text-emerald-500" : "text-red-500"}`}
              >
                {sellerIsBanned ? "Unban Seller" : "Ban Seller"}
              </button>
            )}
          </div>

          {user && <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} product={product._id} />}
        </div>
      </section>

      {similarProducts.length > 0 && (
        <section className="rounded-2xl border border-border glass-panel p-6 shadow-2xl">
          <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-text-secondary dark:text-white">More like this</p>
              <h2 className="text-2xl font-black text-text-primary dark:text-white tracking-tight">Similar Products</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {similarProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <form onSubmit={submitReview} className="rounded-2xl border border-border glass-panel p-6 shadow-2xl">
          <p className="text-sm font-bold uppercase tracking-widest text-text-secondary dark:text-white">Ratings</p>
          <h2 className="mt-1 text-2xl font-black text-text-primary dark:text-white tracking-tight">Write a Review</h2>

          {user ? (
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-text-secondary dark:text-white">Rating</span>
                <select
                  className="mt-2 w-full rounded-xl border border-border bg-muted/50 p-3 outline-none transition focus:border-accent-indigo focus:ring-4 focus:ring-accent-indigo/20 text-text-primary dark:text-white"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                >
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Very Good</option>
                  <option value="3">3 - Good</option>
                  <option value="2">2 - Fair</option>
                  <option value="1">1 - Poor</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-text-secondary dark:text-white">Comment</span>
                <textarea
                  className="mt-2 h-28 w-full rounded-xl border border-border bg-muted/50 p-3 outline-none transition focus:border-accent-indigo focus:ring-4 focus:ring-accent-indigo/20 text-text-primary dark:text-white"
                  placeholder="Share your thoughts about the product or seller..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                />
              </label>
              <button
                type="submit"
                disabled={submittingReview}
                className="rounded-xl bg-text-primary text-primary-bg px-5 py-3 text-sm font-bold transition hover:bg-text-primary/90 active:scale-95 disabled:opacity-50 shadow-lg"
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          ) : (
            <p className="mt-5 rounded-xl bg-muted/50 p-4 text-sm font-medium text-text-secondary">Please login to write a review.</p>
          )}
        </form>

        <div className="rounded-2xl border border-border glass-panel p-6 shadow-2xl">
          <p className="text-sm font-bold uppercase tracking-widest text-text-secondary dark:text-white">Community feedback</p>
          <h2 className="mt-1 text-2xl font-black text-text-primary dark:text-white tracking-tight">Reviews</h2>

          <div className="mt-5 space-y-4">
            {!product.reviews || product.reviews.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm font-medium text-text-secondary">
                No reviews yet.
              </p>
            ) : (
              product.reviews.map((review, index) => ( // Assuming review card is fine with glass-panel
                <div key={`${review.name}-${index}`} className="rounded-xl border border-border bg-muted/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-text-primary dark:text-white">{review.name}</p>
                    <p className="text-sm font-bold text-amber-600">{review.rating}/5</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">{review.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductDetails;
