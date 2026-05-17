import { Link } from "react-router-dom";

const ProductCard = ({ product }) => {
  return (
    <div className="bg-white shadow-md rounded-2xl overflow-hidden hover:shadow-lg transition duration-300">
      
      {/* Product Image */}
      <img
        src={product.images?.[0] || "https://via.placeholder.com/300"}
        alt={product.title}
        className="w-full h-48 object-cover"
      />

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h2 className="text-lg font-semibold truncate">
          {product.title}
        </h2>

        {/* Price */}
        <p className="text-blue-600 font-bold mt-1">
          ₹{product.price}
        </p>

        {/* Category */}
        <p className="text-sm text-gray-500">
          {product.category}
        </p>

        {/* Status */}
        <p
          className={`text-sm mt-1 ${
            product.status === "available"
              ? "text-green-600"
              : "text-red-500"
          }`}
        >
          {product.status}
        </p>

        {/* Button */}
        <Link
          to={`/product/${product._id}`}
          className="block mt-3 text-center bg-blue-500 text-white py-1 rounded-lg hover:bg-blue-600"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;