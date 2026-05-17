import Product from "../models/productModel.js";

const formatImageUrl = (req, imagePath) => {
  if (!imagePath) return imagePath;

  const hostUrl = `${req.protocol}://${req.get("host")}`;

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath.replace(/^https?:\/\/[^/]+/, hostUrl);
  }

  if (imagePath.startsWith("/")) {
    return `${hostUrl}${imagePath}`;
  }

  return `${hostUrl}/uploads/${imagePath}`;
};

const formatImages = (req, images = []) => {
  return images.map((image) => formatImageUrl(req, image));
};

//
// ➕ Create Product
//
export const createProduct = async (req, res) => {
  try {
    const { title, description, price, category } = req.body;

    const images = (req.files || []).map((file) => `/uploads/${file.filename}`);

    const product = await Product.create({
      title,
      description,
      price,
      category,
      images,
      seller: req.user.id,
    });

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//
// 📦 Get All Products (with search + filter)
//
export const getProducts = async (req, res) => {
  try {
    const { keyword, category, status } = req.query;

    let query = {};

    // Search by title
    if (keyword) {
      query.title = { $regex: keyword, $options: "i" };
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Optional status filter (available or sold)
    if (status && ["available", "sold"].includes(status)) {
      query.status = status;
    }

    const products = await Product.find(query)
      .populate("seller", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const formattedProducts = products.map((product) => ({
      ...product,
      images: formatImages(req, product.images),
    }));

    res.json({
      success: true,
      count: formattedProducts.length,
      products: formattedProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//
// 🔍 Get Single Product
//
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("seller", "name email avatar")
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      product: {
        ...product,
        images: formatImages(req, product.images),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//
// ✏️ Update Product
//
export const updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Only seller can update
    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//
// ❌ Delete Product
//
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Only seller can delete
    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    await product.deleteOne();

    res.json({
      success: true,
      message: "Product deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//
// ✅ Update product availability status
//
export const updateProductStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["available", "sold"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Only seller can change status
    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    product.status = status;
    await product.save();

    res.json({
      success: true,
      message: `Product marked as ${status}`,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//
// ✅ Mark Product as Sold (legacy route)
//
export const markAsSold = async (req, res) => {
  req.body.status = "sold";
  return updateProductStatus(req, res);
};
