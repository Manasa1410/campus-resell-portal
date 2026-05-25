import Product from "../models/productModel.js";
import User from "../models/userModel.js";
import Notification from "../models/notificationModel.js";

const formatImageUrl = (req, imagePath) => {
  if (!imagePath) return imagePath;

  const host = req.get("host") || "localhost:5001";
  const hostUrl = `${req.protocol}://${host}`;

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
      seller: req.user._id || req.user.id,
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
    const { keyword, category, status, minPrice, maxPrice, sort } = req.query;

    let query = {};

    // Search by title
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } }
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Price Range Filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Optional status filter (available or sold)
    if (status && ["available", "sold"].includes(status)) {
      query.status = status;
    }

    // Sorting Logic
    let sortOptions = { createdAt: -1 }; // Default Newest
    if (sort === "oldest") sortOptions = { createdAt: 1 };
    if (sort === "priceLowHigh") sortOptions = { price: 1 };
    if (sort === "priceHighLow") sortOptions = { price: -1 };

    const products = await Product.find(query)
      .populate("seller", "name email")
      .sort(sortOptions)
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
// 👤 Get Products added by the logged-in user
//
export const getMyProducts = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const products = await Product.find({ seller: userId })
      .sort({ createdAt: -1 })
      .lean();

    const formattedProducts = products.map((product) => ({
      ...product,
      images: formatImages(req, product.images),
    }));

    res.json({
      success: true,
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
// � Get Single Product
//
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("seller", "name email avatar isBanned")
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
    const userId = req.user._id || req.user.id;
    if (product.seller.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const updateData = { ...req.body };

    // If new images are uploaded, update the images array
    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map((file) => `/uploads/${file.filename}`);
    }

    product = await Product.findByIdAndUpdate(req.params.id, updateData, {
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

    // Only seller or admin can delete
    const userId = req.user._id || req.user.id;
    if (product.seller.toString() !== userId.toString() && !req.user.isAdmin) {
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
    const userId = req.user._id || req.user.id;
    if (product.seller.toString() !== userId.toString()) {
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

//
// ❤️ Toggle Wishlist
//
export const toggleWishlist = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);
    const productId = req.params.id;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Ensure wishlist array exists
    if (!user.wishlist) user.wishlist = [];

    const isWishlisted = user.wishlist.some((id) => id.toString() === productId.toString());

    if (isWishlisted) {
      user.wishlist = user.wishlist.filter((id) => id.toString() !== productId.toString());
    } else {
      user.wishlist.push(productId);
      
      // 🔔 Notify seller that someone added their product to wishlist
      if (product.seller.toString() !== userId.toString()) {
        const notification = await Notification.create({
          recipient: product.seller,
          sender: userId,
          product: product._id,
          type: "wishlist",
          message: `${req.user.name} added your product "${product.title}" to their wishlist!`,
        });
        
        // Emit real-time event if socket.io is configured
        // req.app.get("socketio").to(product.seller.toString()).emit("newNotification", notification);
      }
    }

    await user.save();
    res.json({
      success: true,
      message: isWishlisted ? "Removed from wishlist" : "Added to wishlist",
      wishlist: user.wishlist,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//
// ⭐ Add Rating and Review
//
export const createProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const userId = req.user.id || req.user._id;

    // Ensure reviews array exists
    if (!product.reviews) {
      product.reviews = [];
    }

    // Check if user already reviewed
    const alreadyReviewed = product.reviews.find((r) => r.user.toString() === userId.toString());

    if (alreadyReviewed) {
      return res.status(400).json({ success: false, message: "Product already reviewed" });
    }

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: userId,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;

    const totalRating = product.reviews.reduce((acc, item) => item.rating + acc, 0);
    product.rating = Number((totalRating / product.reviews.length).toFixed(1));

    await product.save();

    // 🔔 Create a notification for the seller
    await Notification.create({
      recipient: product.seller,
      sender: userId,
      product: product._id,
      type: "review",
      message: `${req.user.name} left a ${rating}-star review on your product: ${product.title}`,
    });

    res.status(201).json({ 
      success: true, 
      message: "Review added",
      reviews: product.reviews,
      rating: product.rating,
      numReviews: product.numReviews
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//
// 💖 Get User's Wishlist Products
//
export const getWishlistProducts = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId)
      .populate({
        path: "wishlist",
        model: "Product",
        populate: {
          path: "seller",
          select: "name email",
        },
      })
      .lean(); // Use lean for faster processing and plain JS objects

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Format image URLs for each product in the wishlist
    const formattedWishlist = (user.wishlist || [])
      .filter((product) => product !== null) // Filter out any deleted products still in the array
      .map((product) => ({
        ...product,
        images: formatImages(req, product.images),
      }));

    res.json({ success: true, wishlist: formattedWishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
