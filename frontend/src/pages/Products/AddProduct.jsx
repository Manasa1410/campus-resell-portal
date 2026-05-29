import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import { createProduct } from "../../services/productService";
import Loader from "../../components/Loader";
import { toast } from "react-hot-toast";

const AddProduct = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "Books",
    condition: "used",
    location: "",
  });

  const [isDragging, setIsDragging] = useState(false);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestedPrice, setSuggestedPrice] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  
  const [previews, setPreviews] = useState([]);

  // Fetch products to analyze prices
  useEffect(() => {
    const loadPrices = async () => {
      try {
        const { data } = await API.get("/products");
        setAllProducts(data.products || []);
      } catch (err) {}
    };
    loadPrices();
  }, []);

  // 📝 handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === "category") {
      const categoryProducts = allProducts.filter(p => p.category === value);
      if (categoryProducts.length > 0) {
        const avg = categoryProducts.reduce((acc, curr) => acc + curr.price, 0) / categoryProducts.length;
        setSuggestedPrice(Math.round(avg));
      } else {
        setSuggestedPrice(null);
      }
    }
  };

  // 📸 handle images
  const handleFiles = (files) => {
    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (images.length + newFiles.length > 5) {
      toast.error("You can only upload up to 5 images in total");
      return;
    }

    const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));
    setImages((prev) => [...prev, ...newFiles]);
    setPreviews((prev) => [...prev, ...newPreviewUrls]);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  // 🚀 submit product
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("price", form.price);
      formData.append("category", form.category);
      formData.append("condition", form.condition);
      formData.append("location", form.location);

      // images
      images.forEach((img) => {
        formData.append("images", img);
      });

      await createProduct(formData);

      toast.success("Product added successfully ✅");

      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader /></div>;

  return (
    <div className="flex justify-center items-center py-6 px-4 transition-colors">
      <form
        onSubmit={handleSubmit}
        className="glass-panel p-8 rounded-3xl shadow-2xl shadow-slate-900/10 w-full max-w-xl"
      >
        <h2 className="text-2xl mb-6 text-center font-black text-text-primary dark:text-white">
          Add Product
        </h2>

        {/* Title */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-text-secondary dark:text-white ml-1">Title</label>
            <input
              type="text"
              name="title"
              placeholder="Enter product title..."
              value={form.title}
              onChange={handleChange}
              className="w-full bg-muted/50 text-text-primary dark:text-white p-3 rounded-2xl focus:bg-card focus:ring-4 focus:ring-accent-indigo/10 outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="text-sm font-bold text-text-secondary dark:text-white ml-1">Description</label>
            <textarea
              name="description"
              placeholder="Describe your product details..."
              value={form.description}
              onChange={handleChange}
              className="w-full bg-muted/50 text-text-primary dark:text-white p-3 rounded-2xl focus:bg-card focus:ring-4 focus:ring-accent-indigo/10 outline-none transition-all h-32"
              required
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm font-bold text-text-secondary dark:text-white ml-1">Price (₹)</label>
          <input
            type="number"
            name="price"
            placeholder="Amount"
            value={form.price}
            onChange={handleChange}
              className="w-full bg-muted/50 text-text-primary dark:text-white p-3 rounded-2xl focus:bg-card focus:ring-4 focus:ring-accent-indigo/10 outline-none transition-all"
            required
          />
        </div>
        {suggestedPrice && (
          <p className="text-xs text-indigo-400 mb-3 italic">
            💡 Suggested price for {form.category}: ₹{suggestedPrice} (based on similar listings)
          </p>
        )}

        {/* Category */}
        <div className="mt-4 mb-6">
          <label className="text-sm font-bold text-text-secondary dark:text-white ml-1">Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full bg-muted/50 text-text-primary dark:text-white p-3 rounded-2xl focus:bg-card focus:ring-4 focus:ring-accent-indigo/10 outline-none transition-all mt-1"
          >
            <option>Books</option>
            <option>Electronics</option>
            <option>Cycles</option>
            <option>Others</option>
          </select>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="ml-1 text-sm font-bold text-text-secondary dark:text-white">Condition</label>
            <select
              name="condition"
              value={form.condition}
              onChange={handleChange}
              className="mt-1 w-full rounded-2xl bg-muted/50 p-3 text-text-primary outline-none transition-all focus:bg-card focus:ring-4 focus:ring-accent-indigo/10 dark:text-white"
            >
              <option value="new">New</option>
              <option value="used">Used</option>
            </select>
          </div>
          <div>
            <label className="ml-1 text-sm font-bold text-text-secondary dark:text-white">Campus Location</label>
            <input
              type="text"
              name="location"
              placeholder="Hostel, block, or campus"
              value={form.location}
              onChange={handleChange}
              className="mt-1 w-full rounded-2xl bg-muted/50 p-3 text-text-primary outline-none transition-all focus:bg-card focus:ring-4 focus:ring-accent-indigo/10 dark:text-white"
            />
          </div>
        </div>

        {/* Images */}
        <div
          className={`relative rounded-2xl p-6 text-center transition-all ${
            isDragging ? "bg-accent-indigo/10 ring-2 ring-accent-indigo" : "bg-muted/50 hover:bg-muted"
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div className="space-y-1 text-center">
            <p className="text-text-secondary dark:text-white">
              <span className="font-semibold text-accent-indigo">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-text-secondary dark:text-slate-400">PNG, JPG, JPEG up to 5 images</p>
          </div>
        </div>

        {previews.length > 0 && (
          <div className="grid grid-cols-5 gap-3 mt-4 mb-6">
            {previews.map((src, index) => (
              <img
                key={index}
                src={src}
                alt="preview"
                className="w-full aspect-square object-cover rounded-xl shadow-sm"
              />
            ))}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-accent-indigo text-white py-3 rounded-xl font-bold hover:bg-accent-indigo/90 shadow-lg shadow-accent-indigo/20 transition-all active:scale-[0.98]"
        >
          Add Product
        </button>
      </form>
    </div>
  );
};

export default AddProduct;
