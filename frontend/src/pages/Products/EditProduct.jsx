import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProductById, updateProduct } from "../../services/productService";
import Loader from "../../components/Loader";
import { toast } from "react-hot-toast";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", price: "", category: "" });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(id);
        const { title, description, price, category, images: existingImages } = data.product;
        setForm({ title, description, price, category });
        setPreviews(existingImages); // Show existing images as initial previews
      } catch (err) {
        navigate("/my-products");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const newFiles = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
    
    if (images.length + newFiles.length > 5) {
      toast.error("You can only upload up to 5 images");
      return;
    }

    const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));
    setImages((prev) => [...prev, ...newFiles]);
    setPreviews((prev) => [...prev, ...newPreviewUrls]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("price", form.price);
      formData.append("category", form.category);
      images.forEach((img) => formData.append("images", img));

      await updateProduct(id, formData);
      toast.success("Product updated successfully ✅");
      navigate("/my-products");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update product");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="flex justify-center items-center py-6 px-4 transition-colors"> {/* Added transition-colors for smooth theme change */}
      <form onSubmit={handleSubmit} className="glass-panel p-10 rounded-3xl shadow-2xl shadow-slate-900/10 w-full max-w-xl">
        <h2 className="text-2xl font-black mb-6 text-center text-text-primary dark:text-white tracking-tight">
          Edit Product
        </h2>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm font-bold text-text-secondary dark:text-white">Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full bg-muted/50 text-text-primary dark:text-white p-4 rounded-2xl focus:bg-card focus:ring-4 focus:ring-accent-indigo/10 outline-none transition-all mt-1"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-bold text-text-secondary dark:text-white">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full bg-muted/50 text-text-primary dark:text-white p-4 rounded-2xl focus:bg-card focus:ring-4 focus:ring-accent-indigo/10 outline-none transition-all mt-1 h-40"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Price */}
            <div>
              <label className="text-sm font-bold text-text-secondary dark:text-white">Price (₹)</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                className="w-full bg-muted/50 text-text-primary dark:text-white p-4 rounded-2xl focus:bg-card focus:ring-4 focus:ring-accent-indigo/10 outline-none transition-all mt-1"
                required
              />
            </div>
            {/* Category */}
            <div>
              <label className="text-sm font-bold text-text-secondary dark:text-white">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full bg-muted/50 text-text-primary dark:text-white p-4 rounded-2xl focus:bg-card focus:ring-4 focus:ring-accent-indigo/10 outline-none transition-all mt-1"
              >
                <option>Books</option>
                <option>Electronics</option>
                <option>Cycles</option>
                <option>Others</option>
              </select>
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="text-sm font-bold text-text-secondary dark:text-white">Update Images (Optional)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="w-full bg-muted/50 text-text-primary dark:text-white p-4 rounded-2xl focus:bg-card focus:ring-4 focus:ring-accent-indigo/10 outline-none transition-all mt-1 text-sm"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {previews.map((src, i) => (
                <img key={i} src={src} alt="preview" className="w-16 h-16 object-cover rounded-xl shadow-sm" />
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-accent-indigo text-white py-3 rounded-xl font-bold hover:bg-accent-indigo/90 shadow-lg shadow-accent-indigo/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? "Updating..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;