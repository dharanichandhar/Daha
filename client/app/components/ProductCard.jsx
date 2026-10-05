import { Link } from "react-router";
import { formatRupees, discountPercent } from "~/lib/format";
import { MaterialIcon } from "./MaterialIcon";

export function ProductCard({ product, variant = "carousel" }) {
  const img = product.primaryImage || product.images?.[0];
  const discount = product.discount ?? discountPercent(product.mrpPrice, product.sellingPrice);
  const stockStatus = product.stockStatus ?? "in_stock";

  return (
    <Link
      to={`/product/${product.slug}`}
      className={`group flex flex-col overflow-hidden rounded-xl border border-black/[0.04] bg-surface-container-lowest shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] ${
        variant === "carousel" ? "min-w-[178px] max-w-[178px] sm:min-w-[190px] sm:max-w-[190px]" : "w-full"
      }`}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-container">
        {img?.url && (
          <img
            src={img.url}
            alt={img.alt || product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
          />
        )}

        {(product.isNew || product.isBestSeller) && (
          <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
            {product.isNew && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-onprimary">
                New
              </span>
            )}
            {product.isBestSeller && (
              <span className="rounded-full bg-surface-container-lowest/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-primary backdrop-blur-sm">
                Best Seller
              </span>
            )}
          </div>
        )}

        <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-surface/90 text-onsurface shadow-sm backdrop-blur-sm">
          <MaterialIcon name="favorite_border" size={16} />
        </span>

        {stockStatus === "out_of_stock" ? (
          <span className="absolute bottom-2 left-2 rounded-md bg-surface-container-lowest/92 px-2 py-1 text-[10px] font-bold text-error backdrop-blur-sm">
            Out of Stock
          </span>
        ) : stockStatus === "low_stock" ? (
          <span className="absolute bottom-2 left-2 rounded-md bg-surface-container-lowest/92 px-2 py-1 text-[10px] font-bold text-error backdrop-blur-sm">
            Few Left
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-2.5">
        <h3 className="line-clamp-1 text-[13px] font-semibold leading-5 text-onsurface">{product.name}</h3>
        {product.subcategory && (
          <p className="mt-0.5 line-clamp-1 text-[11px] text-onsurface-variant">{product.subcategory}</p>
        )}
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="text-sm font-bold text-onsurface">{formatRupees(product.sellingPrice)}</span>
          {product.mrpPrice > product.sellingPrice && (
            <>
              <span className="text-[10px] text-onsurface-variant line-through">{formatRupees(product.mrpPrice)}</span>
              <span className="text-[10px] font-bold text-primary">{discount}% off</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
