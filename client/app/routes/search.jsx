import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router";
import { api } from "~/lib/api";
import { ProductCard } from "~/components/ProductCard";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const [input, setInput] = useState(q);

  const { data, isLoading } = useQuery({
    queryKey: ["products", { search: q }],
    enabled: Boolean(q),
    queryFn: () => api.get(`/products?search=${encodeURIComponent(q)}`),
  });

  const results = data?.products || data?.data || [];

  const submit = (e) => {
    e.preventDefault();
    setSearchParams({ q: input });
  };

  return (
    <div className="container-daha py-6">
      <h1 className="font-display mb-4 text-2xl text-onsurface">Search</h1>
      <form onSubmit={submit} className="mb-6 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search for kurta, jeans, saree..."
          className="flex-1 rounded border border-hairline bg-surface px-3 py-2.5 focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          className="rounded bg-primary px-5 py-2.5 text-sm font-semibold text-onprimary"
        >
          Search
        </button>
      </form>

      {q && (
        <p className="mb-4 text-sm text-onsurface-variant">
          {isLoading
            ? "Searching..."
            : `${results.length} result${results.length === 1 ? "" : "s"} for "${q}"`}
        </p>
      )}

      {!q ? (
        <p className="py-10 text-center text-onsurface-variant">
          Search across our full men's, women's and kids' collections.
        </p>
      ) : results.length === 0 && !isLoading ? (
        <div className="py-10 text-center">
          <p className="text-onsurface-variant">No results found for "{q}".</p>
          <Link to="/products" className="mt-2 inline-block text-sm text-primary">
            Browse all products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p._id} product={p} variant="grid" />
          ))}
        </div>
      )}
    </div>
  );
}