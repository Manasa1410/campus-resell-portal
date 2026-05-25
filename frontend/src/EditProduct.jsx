import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProductById, updateProduct } from "../../services/productService";
import Loader from "../../components/Loader";

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
        alert("Failed to load product data");
        navigate("/my-products");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setPreviews(files.map((file) => URL.createObjectURL(file)));
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
      alert("Product updated successfully ✅");
      navigate("/my-products");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update product");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Edit Product</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-600">Title</label>
            <input type="text" name="title" value={form.title} onChange={handleChange} className="w-full border p-2 rounded-lg mt-1" required />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-600">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="w-full border p-2 rounded-lg mt-1 h-24" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-600">Price (₹)</label>
              <input type="number" name="price" value={form.price} onChange={handleChange} className="w-full border p-2 rounded-lg mt-1" required />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Category</label>
              <select name="category" value={form.category} onChange={handleChange} className="w-full border p-2 rounded-lg mt-1">
                <option>Books</option>
                <option>Electronics</option>
                <option>Cycles</option>
                <option>Others</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-600">Update Images (Optional)</label>
            <input type="file" accept="image/*" multiple onChange={handleImageChange} className="w-full p-2 border rounded-lg mt-1 text-sm" />
            <div className="flex flex-wrap gap-2 mt-3">
              {previews.map((src, i) => (
                <img key={i} src={src} alt="preview" className="w-16 h-16 object-cover rounded-lg border" />
              ))}
            </div>
          </div>

          <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50">
            {submitting ? "Updating..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;