import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { api } from "~/lib/api";
import { ProductCard } from "~/components/ProductCard";
import { MaterialIcon } from "~/components/MaterialIcon";

export default function Wishlist() {
  const [refetchKey, setRefetchKey] = useState(0);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["wishlist", refetchKey],
    queryFn: () => api.get("/wishlist"),
    retry: false,
  });

  const items = data?.products || data?.items || data?.wishlist?.products || [];

  const remove = async (id) => {
    await api.post(`/wishlist/toggle/${id}`);
    refetch();
  };

  if (!isLoading && items.length === 0) {
    return (
      <div className="container-daha py-20 text-center">
        <MaterialIcon name="favorite_border" size={48} className="mx-auto text-outline" />
        <h1 className="font-display mt-4 text-2xl text-onsurface">Your wishlist is empty</h1>
        <p className="mt-2 text-sm text-onsurface-variant">Save items you love for later.</p>
        <Link
          to="/products"
          className="mt-6 inline-block rounded bg-primary px-6 py-3 text-sm font-semibold text-onprimary"
        >
          Explore Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container-daha py-6">
      <h1 className="font-display mb-4 text-2xl text-onsurface">My Wishlist</h1>
      {isLoading ? (
        <p className="py-10 text-center text-onsurface-variant">Loading...</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <div key={p._id} className="relative">
              <ProductCard product={p} variant="grid" />
              <button
                onClick={() => remove(p._id)}
                className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-surface shadow-md text-error"
                aria-label="Remove from wishlist"
              >
                <MaterialIcon name="favorite" size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}