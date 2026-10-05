import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { api } from "~/lib/api";
import { ProductCard } from "~/components/ProductCard";
import { MaterialIcon } from "~/components/MaterialIcon";

export function meta() {
  return [
    { title: "All Products - DAHA Clothing Store Trichy" },
    {
      name: "description",
      content: "Browse clothing for men, women and kids at DAHA Clothing Store Trichy.",
    },
  ];
}

export function useProducts(params = {}) {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");

  return useQuery({
    queryKey: ["products", query],
    queryFn: () => api.get(`/products?${query}`),
  });
}

export function ProductGrid({ products }) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl bg-surface-container-low px-5 py-12 text-center">
        <MaterialIcon name="checkroom" size={38} className="mx-auto text-outline" />
        <p className="mt-2 text-sm text-onsurface-variant">No products found. Try another category or filter.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} variant="grid" />
      ))}
    </div>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;

  return (
    <div className="mt-7 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-surface-container-lowest text-onsurface disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Previous page"
      >
        <MaterialIcon name="chevron_left" size={20} />
      </button>
      <span className="min-w-24 text-center text-sm text-onsurface-variant">
        Page <strong className="text-onsurface">{page}</strong> of {pages}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(pages, page + 1))}
        disabled={page >= pages}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-surface-container-lowest text-onsurface disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Next page"
      >
        <MaterialIcon name="chevron_right" size={20} />
      </button>
    </div>
  );
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [page, setPage] = useState(Number(searchParams.get("page") || 1));

  const { data: categoriesData } = useQuery({
    queryKey: ["products-page-categories"],
    queryFn: () => api.get("/categories"),
    staleTime: 5 * 60 * 1000,
  });

  const categories = (categoriesData?.categories || []).filter((item) => item.active !== false);

  useEffect(() => {
    const params = {};
    if (category) params.category = category;
    if (sort) params.sort = sort;
    if (page > 1) params.page = String(page);
    setSearchParams(params, { replace: true });
  }, [category, sort, page, setSearchParams]);

  const { data, isLoading } = useProducts({
    category,
    sort,
    page: String(page),
    limit: "15",
    publishStatus: "active",
  });

  const products = data?.products || [];
  const pagination = data?.pagination || { page, pages: 1, total: products.length };

  return (
    <div className="container-daha py-7 md:py-10">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">DAHA Collection</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.025em] text-onsurface">All Products</h1>
          <p className="mt-1 text-sm text-onsurface-variant">Browse 15 products per page for a cleaner shopping experience.</p>
        </div>
        <select
          value={sort}
          onChange={(event) => {
            setSort(event.target.value);
            setPage(1);
          }}
          className="w-full rounded-lg border border-hairline bg-surface-container-lowest px-3 py-2.5 text-sm text-onsurface outline-none focus:border-primary md:w-auto"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="featured">Featured</option>
          <option value="bestseller">Best Sellers</option>
        </select>
      </div>

      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => {
            setCategory("");
            setPage(1);
          }}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${
            !category ? "bg-primary text-onprimary" : "bg-surface-container-low text-onsurface"
          }`}
        >
          All
        </button>
        {categories.map((item) => (
          <button
            key={item.slug}
            type="button"
            onClick={() => {
              setCategory(item.slug);
              setPage(1);
            }}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${
              category === item.slug
                ? "bg-primary text-onprimary"
                : "bg-surface-container-low text-onsurface hover:bg-surface-container"
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between text-sm text-onsurface-variant">
        <span>{isLoading ? "Loading products..." : `${pagination.total || products.length} products`}</span>
        <span>{!isLoading && pagination.pages > 1 ? `15 per page` : ""}</span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="aspect-[3/4] animate-pulse rounded-xl bg-surface-container" />
          ))}
        </div>
      ) : (
        <ProductGrid products={products} />
      )}

      <Pagination
        page={pagination.page || page}
        pages={pagination.pages || 1}
        onChange={(nextPage) => {
          setPage(nextPage);
          if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </div>
  );
}
