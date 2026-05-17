import { useEffect, useState } from "react";
import API from "../../services/api";
import ProductCard from "../../components/ProductCard";
import Loader from "../../components/Loader";

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priceFilter, setPriceFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  // 📥 Fetch products from backend
  const fetchProducts = async () => {
    try {
      const { data } = await API.get("/products");
      setProducts(data.products || []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const categories = [
    "All",
    ...Array.from(new Set(products.map((product) => product.category).filter(Boolean)))
  ];

  const filteredProducts = products.filter((product) => {
    const price = Number(product.price);

    if (categoryFilter !== "All" && product.category !== categoryFilter) {
      return false;
    }

    if (availabilityFilter !== "all" && product.status !== availabilityFilter) {
      return false;
    }

    if (priceFilter === "under-500" && price >= 500) {
      return false;
    }

    if (priceFilter === "500-999" && (price < 500 || price > 999)) {
      return false;
    }

    if (priceFilter === "1000+" && price < 1000) {
      return false;
    }

    return true;
  });

  // ⏳ Loading state
  if (loading) return <Loader />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <section className="rounded-4xl bg-linear-to-r from-slate-900 via-indigo-700 to-sky-600 text-white p-10 shadow-xl mb-8 overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr] items-center">
          <div>
            <p className="uppercase tracking-[0.35em] text-sm text-slate-200 mb-4">
              Campus Resell Marketplace
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              Shop smart. Sell fast. Buy campus essentials.
            </h1>
            <p className="mt-4 text-slate-200 max-w-xl leading-7">
              Discover quality products listed by students near you, connect directly with sellers, and keep your campus shopping experience fast, secure, and affordable.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-3xl font-semibold">{products.length}</p>
                <p className="text-sm text-slate-200">Active Listings</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-3xl font-semibold">{products.filter((item) => item.status === "available").length}</p>
                <p className="text-sm text-slate-200">Available Now</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-3xl font-semibold">4.8/5</p>
                <p className="text-sm text-slate-200">Trusted Campus Deals</p>
              </div>
            </div>
          </div>

          <div className="rounded-4xl bg-white/10 p-6 backdrop-blur-xl border border-white/10">
            <h2 className="text-xl font-semibold mb-4">Featured Picks</h2>
            <div className="space-y-4">
              {products.slice(0, 3).map((product) => (
                <div key={product._id} className="rounded-3xl bg-slate-900/70 p-4">
                  <p className="font-semibold">{product.title}</p>
                  <p className="text-sm text-slate-300">₹{product.price}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500 mb-1">
              Explore Listings
            </p>
            <h2 className="text-3xl font-bold">Latest Campus Finds</h2>
          </div>
          <p className="text-sm text-slate-600">
            Browse by category, price, and availability.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-5 mb-6 shadow-sm border border-slate-200">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-600">Category</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="mt-2 block w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-slate-900"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-600">Price</span>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="mt-2 block w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-slate-900"
              >
                <option value="all">All prices</option>
                <option value="under-500">Under ₹500</option>
                <option value="500-999">₹500 - ₹999</option>
                <option value="1000+">₹1000+</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-600">Availability</span>
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="mt-2 block w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-slate-900"
              >
                <option value="all">All statuses</option>
                <option value="available">Available</option>
                <option value="sold">Sold</option>
              </select>
            </label>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
            No products match your filter choices.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;