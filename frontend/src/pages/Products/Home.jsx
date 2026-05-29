/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";
import ProductCard from "../../components/ProductCard";
import useAuth from "../../hooks/useAuth";
import { toast } from "react-hot-toast";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Icon from "../../components/ui/Icon";
import { ProductGridSkeleton } from "../../components/ui/Skeleton";

const categories = [
  { name: "Books", icon: "book", tone: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200" },
  { name: "Electronics", icon: "laptop", tone: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-200" },
  { name: "Cycles", icon: "cycle", tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200" },
  { name: "Others", icon: "spark", tone: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200" },
];

const locations = ["All", "North Campus", "South Campus", "East Block", "West Block", "Hostel Area"];

const Home = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("All");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [suggestions, setSuggestions] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const recentlyViewed = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("recentlyViewed")) || [];
    } catch {
      return [];
    }
  }, [products.length]);

  const fetchProducts = async () => {
    try {
      const { data } = await API.get("/products");
      setProducts(data.products || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!keyword.trim()) {
        setSuggestions([]);
        return;
      }

      try {
        const { data } = await API.get("/products/suggestions", { params: { keyword } });
        setSuggestions(data.suggestions || []);
      } catch {
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const { data } = await API.get("/products/recommended", {
          params: categoryFilter !== "All" ? { category: categoryFilter } : {},
        });
        setRecommendedProducts(data.products || []);
      } catch {
        setRecommendedProducts([]);
      }
    };

    loadRecommendations();
  }, [categoryFilter]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const dynamicCategories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((product) => product.category).filter(Boolean)))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        if (user && product.seller?._id === user._id) return false;

        const price = Number(product.price);
        const title = product.title?.toLowerCase() || "";

        if (keyword && !title.includes(keyword.toLowerCase())) return false;
        if (categoryFilter !== "All" && product.category !== categoryFilter) return false;
        if (availabilityFilter !== "all" && product.status !== availabilityFilter) return false;
        if (conditionFilter !== "all" && product.condition !== conditionFilter) return false;
        if (locationFilter !== "All" && product.location !== locationFilter) return false;
        if (minPrice && price < Number(minPrice)) return false;
        if (maxPrice && price > Number(maxPrice)) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "priceLowHigh") return a.price - b.price;
        if (sortBy === "priceHighLow") return b.price - a.price;
        if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [products, user, keyword, categoryFilter, availabilityFilter, conditionFilter, locationFilter, minPrice, maxPrice, sortBy]);

  const recentlyAdded = filteredProducts.slice(0, 6);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="h-72 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        <ProductGridSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <section className="overflow-hidden rounded-3xl bg-card text-text-primary shadow-2xl shadow-indigo-500/5">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
          <div className="flex flex-col justify-center">
            <p className="mb-4 text-sm font-bold uppercase tracking-widest text-accent-indigo">Campus marketplace</p>
            <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl dark:text-white">Buy & Sell Easily on Campus</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-text-secondary">
              Discover books, gadgets, cycles, and daily essentials from students around you. List products fast, chat safely, and close deals with confidence.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button as="a" href="#products" size="lg">
                Browse Products
              </Button>
              <Button as={Link} to={user ? "/add-product" : "/login"} variant="secondary" size="lg">
                Sell Product
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <Card className="bg-muted/50 p-5 text-text-primary backdrop-blur">
              <p className="text-3xl text-black dark:text-white">{products.length}</p>
              <p className="text-sm text-black dark:text-white">Total listings</p>
            </Card>
            <Card className="bg-muted/50 p-5 text-text-primary backdrop-blur">
              <p className="text-3xl text-black dark:text-white">{products.filter((item) => item.status === "available").length}</p>
              <p className="text-sm text-black dark:text-white">Available now</p>
            </Card>
            <Card className="bg-muted/50 p-5 text-text-primary backdrop-blur">
              <p className="text-3xl text-black dark:text-white">{dynamicCategories.length - 1}</p>
              <p className="text-sm text-black dark:text-white">Categories</p>
            </Card>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5">
          <p className="text-sm font-bold uppercase tracking-widest text-text-secondary dark:text-white">Categories</p>
          <h2 className="text-2xl font-black text-text-primary dark:text-white tracking-tight">Shop by Category</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {categories.map((category) => (
            <button
              type="button"
              key={category.name}
              onClick={() => setCategoryFilter(category.name)}
              className="rounded-2xl bg-card p-5 text-left shadow-lg shadow-slate-200/40 dark:shadow-none transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:hover:bg-slate-800/50"
            >
              <span className={`mb-4 grid h-12 w-12 place-items-center rounded-xl ${category.tone}`}>
                <Icon name={category.icon} />
              </span>
              <span className="font-bold text-text-primary dark:text-white">{category.name}</span>
              <span className="mt-1 block text-sm text-text-secondary">
                {products.filter((product) => product.category === category.name).length} listings
              </span>
            </button>
          ))}
        </div>
      </section>

      <section id="products" className="space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-text-secondary dark:text-white">Recently added</p>
            <h2 className="text-2xl font-black text-text-primary dark:text-white tracking-tight">Browse Products</h2>
          </div>
          <p className="text-sm text-text-secondary">{filteredProducts.length} products found</p>
        </div>

        <Card className="p-4 sm:p-5 shadow-xl shadow-slate-200/30 dark:shadow-none">
          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr]">
            <label className="relative block">
              <Icon name="search" className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search by title..."
                className="w-full rounded-xl bg-muted py-3 pl-10 pr-4 text-sm outline-none transition focus:bg-card focus:ring-4 focus:ring-accent-indigo/10 text-text-primary dark:text-white"
              />
              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                  {suggestions.map((suggestion) => (
                    <Link
                      key={suggestion._id}
                      to={`/product/${suggestion._id}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted"
                    >
                      <span className="truncate font-bold text-text-primary">{suggestion.title}</span>
                      <span className="shrink-0 text-xs font-semibold text-text-secondary">INR {suggestion.price}</span>
                    </Link>
                  ))}
                </div>
              )}
            </label>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl bg-muted p-3 text-sm outline-none focus:ring-4 focus:ring-accent-indigo/10 text-text-primary dark:text-white"
            >
              {dynamicCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl bg-muted p-3 text-sm outline-none focus:ring-4 focus:ring-accent-indigo/10 text-text-primary dark:text-white"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priceLowHigh">Price: Low to High</option>
              <option value="priceHighLow">Price: High to Low</option>
            </select>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-5">
            <input
              type="number"
              placeholder="Min price"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="rounded-xl bg-muted p-3 text-sm outline-none focus:ring-4 focus:ring-accent-indigo/10 text-text-primary dark:text-white"
            />
            <input
              type="number"
              placeholder="Max price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="rounded-xl bg-muted p-3 text-sm outline-none focus:ring-4 focus:ring-accent-indigo/10 text-text-primary dark:text-white"
            />
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="rounded-xl bg-muted p-3 text-sm outline-none focus:ring-4 focus:ring-accent-indigo/10 text-text-primary dark:text-white"
            >
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="rounded-xl bg-muted p-3 text-sm outline-none focus:ring-4 focus:ring-accent-indigo/10 text-text-primary dark:text-white"
            >
              <option value="all">All statuses</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
            </select>
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="rounded-xl bg-muted p-3 text-sm outline-none focus:ring-4 focus:ring-accent-indigo/10 text-text-primary dark:text-white"
            >
              <option value="all">All conditions</option>
              <option value="new">New</option>
              <option value="used">Used</option>
            </select>
          </div>
        </Card>

        {recentlyAdded.length === 0 ? (
          <EmptyState
            title="No products match your filters"
            description="Try changing the category, price range, or search term to find more campus deals."
            icon={<Icon name="search" />}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {recentlyAdded.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {recentlyViewed.length > 0 && (
        <section className="space-y-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-text-secondary dark:text-white">Recently viewed</p>
            <h2 className="text-2xl font-black text-text-primary dark:text-white tracking-tight">Pick Up Where You Left Off</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {recentlyViewed.slice(0, 4).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      {recommendedProducts.length > 0 && (
        <section className="space-y-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-text-secondary dark:text-white">Recommended</p>
            <h2 className="text-2xl font-black text-text-primary dark:text-white tracking-tight">More Campus Finds</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {recommendedProducts.slice(0, 4).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
