import API from "./api";

// 📦 Get all products
export const getProducts = async () => {
  const { data } = await API.get("/products");
  return data;
};

// 🔍 Get single product by ID
export const getProductById = async (id) => {
  const { data } = await API.get(`/products/${id}`);
  return data;
};

// 👤 Get products added by the logged-in user
export const getMyProducts = async () => {
  const { data } = await API.get("/products/my-products");
  return data;
};

// ➕ Create new product
export const createProduct = async (formData) => {
  const { data } = await API.post("/products", formData);
  return data;
};

// ❌ Delete product (optional admin/seller feature)
export const deleteProduct = async (id) => {
  const { data } = await API.delete(`/products/${id}`);
  return data;
};

// ✏️ Update product (optional)
export const updateProduct = async (id, updatedData) => {
  const { data } = await API.put(`/products/${id}`, updatedData);
  return data;
};

// ✅ Change product sold/available status (seller only)
export const updateProductStatus = async (id, status) => {
  const { data } = await API.put(`/products/${id}/status`, { status });
  return data;
};

// ✅ Mark a product as sold (seller only)
export const markProductAsSold = async (id) => {
  const { data } = await API.put(`/products/${id}/sold`);
  return data;
};

export const getWishlistProducts = async () => {
  const { data } = await API.get("/products/wishlist");
  return data;
};

export const toggleWishlist = async (id) => {
  const { data } = await API.post(`/products/${id}/wishlist`);
  return data;
};