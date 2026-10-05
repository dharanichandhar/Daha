import { useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "~/lib/api";
import { useProducts, ProductGrid, Pagination } from "./products";

const CATEGORY_META = {
  men: { name: "Men", blurb: "Shirts, tees, jeans, trousers, kurtas and jackets for men." },
  women: { name: "Women", blurb: "Kurtis, sarees, dresses, tops and ethnic sets for women." },
  kids: { name: "Kids", blurb: "Comfortable everyday and occasion wear for kids." },
};

export function meta({ params }) {
  const fallback = CATEGORY_META[params.slug || ""] || {
    name: (params.slug || "Collection").replace(/-/g, " "),
    blurb: "Explore the collection at DAHA Clothing Store Trichy.",
  };
  return [
    { title: `${fallback.name} Collection - DAHA Clothing Store Trichy` },
    { name: "description", content: fallback.blurb },
  ];
}

export default function Category() {
  const { slug = "" } = useParams();
  const [page, setPage] = useState(1);

  const { data: catData } = useQuery({
    queryKey: ["category-meta", slug],
    queryFn: () => api.get(`/categories/${slug}`),
    enabled: Boolean(slug),
    staleTime: 10 * 60 * 1000,
  });

  const category = catData?.category;
  const fallback = CATEGORY_META[slug] || {
    name: slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    blurb: "Explore the collection.",
  };
  const metaInfo = category
    ? { name: category.name, blurb: category.description || `Explore the ${category.name} collection.` }
    : fallback;

  const { data, isLoading } = useProducts({
    category: slug,
    page: String(page),
    limit: "15",
    publishStatus: "active",
  });

  const products = data?.products || [];
  const pagination = data?.pagination || { page, pages: 1, total: products.length };

  return (
    <div className="container-daha py-7 md:py-10">
      <header className="mb-6 border-b border-hairline pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">DAHA Collection</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-[-0.025em] text-onsurface">{metaInfo.name}</h1>
            <p className="mt-1 max-w-xl text-sm leading-6 text-onsurface-variant">{metaInfo.blurb}</p>
          </div>
          {!isLoading && (
            <span className="text-sm text-onsurface-variant">{pagination.total || products.length} products</span>
          )}
        </div>
      </header>

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
