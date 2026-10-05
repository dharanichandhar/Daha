import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "~/lib/api";
import { formatRupees, discountPercent } from "~/lib/format";
import { MaterialIcon } from "~/components/MaterialIcon";
import { useAuthStore } from "~/store/useAuthStore";
import { useCartStore } from "~/store/useCartStore";
import { useToastStore } from "~/store/useToastStore";

export function meta({ params }) {
  return [{ title: `${params.slug || "Product"} - DAHA Clothing Store Trichy` }];
}

export default function ProductDetail() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const addItem = useCartStore((s) => s.addItem);
  const pushToast = useToastStore((s) => s.push);
  const [imageIndex, setImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [wishlisted, setWishlisted] = useState(false);
  const [openSection, setOpenSection] = useState("details");
  const [pincode, setPincode] = useState("");
  const [delivery, setDelivery] = useState(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => api.get(`/products/${slug}`),
  });

  const p = product?.product || product;

  const { data: relatedData } = useQuery({
    queryKey: ["product-related", slug],
    queryFn: () => api.get(`/products/related/${slug}`),
    enabled: Boolean(p?._id),
  });

  useEffect(() => {
    if (!p) return;
    setImageIndex(0);
    setQuantity(1);
    setPincode("");
    setDelivery(null);
    setError("");
    const colors = uniqueColors(p);
    const first = colors[0];
    if (first) {
      setSelectedColor(first.color);
      const available = (p.variants || []).filter(
        (v) => v.color === first.color && v.stock > 0
      );
      const preferred = available.find((v) => ['M', 'L', 'S'].includes(v.size)) || available[0];
      setSelectedSize(preferred ? preferred.size : (p.variants || []).find((v) => v.color === first.color)?.size || null);
    }
  }, [p]);

  if (isLoading) {
    return <div className="container-daha py-16 text-center text-onsurface-variant">Loading...</div>;
  }
  if (!p) {
    return (
      <div className="container-daha py-16 text-center">
        <h1 className="font-display text-2xl">Product not found</h1>
        <Link to="/products" className="mt-4 inline-block text-primary">Browse products</Link>
      </div>
    );
  }

  const discount = p.discount ?? discountPercent(p.mrpPrice, p.sellingPrice);
  const images = p.images && p.images.length > 0 ? p.images : (p.primaryImage ? [p.primaryImage] : []);
  const img = images[imageIndex] || images[0];

  const colors = uniqueColors(p);
  const sizesForColor = selectedColor
    ? (p.variants || []).filter((v) => v.color === selectedColor)
    : (p.variants || []);
  const selectedVariant = sizesForColor.find((v) => v.size === selectedSize);
  const selectedStock = selectedVariant ? selectedVariant.stock : 0;
  const totalStock = (p.variants || []).reduce((s, v) => s + (v.stock || 0), 0);
  const outOfStock = totalStock === 0;

  const categoryObj = typeof p.category === "object" && p.category ? p.category : null;
  const categoryName = categoryObj ? categoryObj.name : p.category;
  const categorySlug = categoryObj ? categoryObj.slug : String(p.category || "");

  const validateSelection = () => {
    if (!selectedColor || !selectedSize) {
      const message = "Please select a colour and size.";
      setError(message);
      pushToast(message, "info");
      return null;
    }
    if (selectedStock === 0) {
      const message = "This size is sold out. Choose another size.";
      setError(message);
      pushToast(message, "error");
      return null;
    }
    return (p.variants || []).find((v) => v.color === selectedColor && v.size === selectedSize);
  };

  const handleAddToCart = async (goCheckout = false) => {
    const variant = validateSelection();
    if (!variant) return;
    if (!user) {
      pushToast("Please sign in to add items to your cart.", "info");
      navigate(`/login?redirect=${goCheckout ? "/checkout" : `/product/${p.slug}`}`);
      return;
    }
    setAdding(true);
    setError("");
    try {
      await addItem(p._id, variant._id || variant.sku, quantity, selectedSize, selectedColor);
      pushToast(`${p.name} added to your cart.`, "success");
      navigate(goCheckout ? "/checkout" : "/cart");
    } catch (e) {
      const message = e.message || "Could not add to cart.";
      setError(message);
      pushToast(message, "error");
    } finally {
      setAdding(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      pushToast("Please sign in to use your wishlist.", "info");
      navigate(`/login?redirect=/product/${p.slug}`);
      return;
    }
    try {
      await api.post(`/wishlist/toggle/${p._id}`);
      setWishlisted((w) => {
        const next = !w;
        pushToast(next ? "Added to wishlist." : "Removed from wishlist.", "success");
        return next;
      });
    } catch (e) {
      const message = e.message || "Could not update wishlist.";
      setError(message);
      pushToast(message, "error");
    }
  };

  const checkPincode = () => {
    if (!/^\d{6}$/.test(pincode)) {
      setDelivery({ ok: false, msg: "Enter a valid 6-digit pincode." });
      return;
    }
    setDelivery({
      ok: true,
      msg: "Delivery may be available to this pincode. DAHA will confirm the exact delivery or pickup details on WhatsApp.",
    });
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b border-hairline bg-surface">
        <div className="container-daha flex items-center gap-1.5 overflow-x-auto py-3 text-xs text-onsurface-variant no-scrollbar">
          <Link to="/" className="whitespace-nowrap hover:text-primary">Home</Link>
          <MaterialIcon name="chevron_right" size={14} />
          {categorySlug ? (
            <Link to={`/category/${categorySlug}`} className="whitespace-nowrap hover:text-primary">
              {categoryName || "Category"}
            </Link>
          ) : (
            <span className="whitespace-nowrap">{categoryName || "Category"}</span>
          )}
          <MaterialIcon name="chevron_right" size={14} />
          <span className="whitespace-nowrap text-onsurface">{p.name}</span>
        </div>
      </div>

      <div className="container-daha py-4 md:py-8">
        <div className="grid gap-6 md:grid-cols-2 md:gap-10">
          {/* Gallery */}
          <div>
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-surface-container">
              {img?.url && (
                <img
                  src={img.url}
                  alt={img.alt || p.name}
                  className="h-full w-full object-cover"
                />
              )}
              <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
                {p.isNew && (
                  <span className="rounded-full bg-secondarycontainer px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-onsecondarycontainer">
                    New Arrival
                  </span>
                )}
                {p.isBestSeller && (
                  <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-onprimary">
                    Bestseller
                  </span>
                )}
              </div>
              <button
                onClick={handleToggleWishlist}
                aria-label="Toggle wishlist"
                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface/80 text-onsurface backdrop-blur-sm transition-transform active:scale-90"
              >
                <MaterialIcon name="favorite" size={20} filled={wishlisted} style={wishlisted ? { color: "var(--color-primary)" } : undefined} />
              </button>
              {images.length > 1 && (
                <div className="absolute bottom-3 right-3 rounded-full bg-surface/80 px-2 py-0.5 text-[11px] font-semibold text-onsurface backdrop-blur-sm">
                  {imageIndex + 1}/{images.length}
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-2 grid grid-cols-4 gap-2 md:grid-cols-4">
                {images.map((im, i) => (
                  <button
                    key={i}
                    onClick={() => setImageIndex(i)}
                    className={`aspect-[3/4] overflow-hidden rounded-lg transition-all ${
                      i === imageIndex
                        ? "ring-2 ring-primary"
                        : "ring-1 ring-hairline hover:ring-onsurface-variant"
                    }`}
                  >
                    {im?.url && (
                      <img src={im.url} alt={im.alt || `${p.name} view ${i + 1}`} className="h-full w-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary">
                {categoryName}
              </p>
              {p.sku && (
                <span className="whitespace-nowrap text-xs text-onsurface-variant">SKU {p.sku}</span>
              )}
            </div>
            <h1 className="font-display mt-1 text-2xl leading-snug text-onsurface md:text-3xl">
              {p.name}
            </h1>
            <p className="mt-1 text-sm text-onsurface-variant">{p.subcategory}</p>

            {/* Price cluster */}
            <div className="mt-4 flex flex-wrap items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">{formatRupees(p.sellingPrice)}</span>
              <span className="text-base text-onsurface-variant line-through">{formatRupees(p.mrpPrice)}</span>
              {discount > 0 && (
                <span className="rounded bg-secondarycontainer px-1.5 py-0.5 text-xs font-bold text-onsecondarycontainer">
                  ({discount}% OFF)
                </span>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-onsurface-variant">
              <span className="inline-flex items-center gap-1">
                <MaterialIcon name="verified" size={14} />
                Inclusive of all taxes
              </span>
              {discount > 0 && p.mrpPrice > p.sellingPrice && (
                <span className="font-semibold text-success">
                  You save ₹{(Number(p.mrpPrice) - Number(p.sellingPrice)).toLocaleString("en-IN")}
                </span>
              )}
            </div>

            {/* Dispatch banner */}
            <div
              className={`mt-4 flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm ${
                outOfStock
                  ? "bg-surface-container text-error"
                  : selectedStock > 0 && selectedStock <= 5
                  ? "bg-secondarycontainer/60 text-onsurface"
                  : "bg-surface-container text-onsurface"
              }`}
            >
              <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${outOfStock ? "bg-error" : "animate-pulse bg-success"}`} />
              <p>
                {outOfStock ? (
                  <span className="font-semibold text-error">Sold out — Restocking soon.</span>
                ) : selectedStock > 0 && selectedStock <= 5 ? (
                  <>
                    <span className="font-semibold">Hurry!</span> Only {selectedStock} left in this size.{" "}
                    <span className="text-onsurface-variant">Ships from DAHA, Trichy.</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold">In stock.</span>{" "}
                    <span className="text-onsurface-variant">DAHA will confirm delivery or pickup details on WhatsApp.</span>
                  </>
                )}
              </p>
            </div>

            {/* Color selector */}
            {colors.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-onsurface">
                    Colour: <span className="font-normal capitalize text-onsurface-variant">{selectedColor}</span>
                  </p>
                  <span className="text-xs text-onsurface-variant">{colors.length} shades</span>
                </div>
                <div className="mt-2.5 flex gap-2.5">
                  {colors.map((c) => {
                    const active = selectedColor === c.color;
                    return (
                      <button
                        key={c.color}
                        onClick={() => {
                          setSelectedColor(c.color);
                          setSelectedSize(null);
                          setError("");
                          const available = (p.variants || []).filter(
                            (v) => v.color === c.color && v.stock > 0
                          );
                          const preferred =
                            available.find((v) => ["M", "L", "S"].includes(v.size)) || available[0];
                          setSelectedSize(
                            preferred ? preferred.size : (p.variants || []).find((v) => v.color === c.color)?.size || null
                          );
                        }}
                        aria-label={c.color}
                        className={`relative h-9 w-9 rounded-full transition-all ${
                          active ? "scale-110 ring-2 ring-primary ring-offset-2" : "ring-1 ring-hairline hover:scale-105"
                        }`}
                        style={{ backgroundColor: c.colorHex || "#ccc" }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size selector */}
            {selectedColor && sizesForColor.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-onsurface">
                    Size: <span className="font-normal text-onsurface-variant">{selectedSize || "Select"}</span>
                  </p>
                  <button
                    onClick={() => setOpenSection("fit")}
                    className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
                  >
                    Size guide
                  </button>
                </div>
                <div className="mt-2.5 grid max-w-md grid-cols-4 gap-2 sm:grid-cols-5">
                  {sizesForColor.map((v) => {
                    const soldOut = v.stock === 0;
                    const low = !soldOut && v.stock <= 5;
                    const active = selectedSize === v.size;
                    return (
                      <button
                        key={v.size}
                        onClick={() => {
                          setSelectedSize(v.size);
                          setError("");
                        }}
                        disabled={soldOut}
                        className={`relative flex min-h-14 flex-col items-center justify-center rounded-lg border px-1 py-2 font-semibold transition-colors ${
                          soldOut
                            ? "cursor-not-allowed border-hairline bg-surface text-onsurface-variant/50"
                            : active
                            ? "border-primary bg-primary text-onprimary shadow-sm"
                            : "border-hairline bg-surface text-onsurface hover:border-onsurface-variant"
                        }`}
                      >
                        <span className={soldOut ? "line-through" : ""}>{v.size}</span>
                        <span
                          className={`mt-0.5 text-[9px] font-medium uppercase tracking-wide ${
                            active ? "text-onprimary/80" : low ? "text-error" : "text-onsurface-variant"
                          }`}
                        >
                          {soldOut ? "Sold out" : low ? `${v.stock} left` : "In stock"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {error && <p className="mt-3 text-sm font-medium text-error">{error}</p>}

            {/* Quantity + delivery note */}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div>
                <p className="mb-1.5 text-sm font-bold text-onsurface">Quantity</p>
                <div className="flex items-center rounded-full bg-surface-container p-1">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-lg text-onsurface transition-colors hover:text-primary disabled:opacity-40"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-sm font-bold">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-lg text-onsurface transition-colors hover:text-primary"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
              <p className="mt-5 max-w-[10rem] text-xs leading-relaxed text-onsurface-variant">
                Delivery, pickup and availability are confirmed directly with DAHA on WhatsApp.
              </p>
            </div>

            {/* Pincode checker */}
            <div className="mt-6 rounded-xl bg-surface-container p-4">
              <p className="flex items-center gap-1.5 text-sm font-bold text-onsurface">
                <MaterialIcon name="local_shipping" size={18} />
                Delivery to pincode
              </p>
              <div className="mt-2 flex gap-2">
                <input
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="e.g. 620001"
                  inputMode="numeric"
                  className="w-32 rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-onsurface placeholder:text-onsurface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={checkPincode}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-onprimary transition-transform active:scale-[0.98]"
                >
                  Check
                </button>
              </div>
              {delivery && (
                <p className={`mt-2 text-xs font-medium ${delivery.ok ? "text-success" : "text-error"}`}>
                  {delivery.msg}
                </p>
              )}
            </div>

            {/* Accordions */}
            <div className="mt-6 divide-y divide-hairline border-y border-hairline">
              <Accordion
                id="details"
                open={openSection}
                onToggle={setOpenSection}
                title="Product details & silhouette"
              >
                <p className="text-sm leading-relaxed text-onsurface-variant">
                  {p.fullDescription || p.shortDescription}
                </p>
              </Accordion>
              <Accordion id="material" open={openSection} onToggle={setOpenSection} title="Material & gentle care">
                <div className="flex flex-col gap-2 text-sm leading-relaxed text-onsurface-variant">
                  {p.material && (
                    <p>
                      <span className="font-semibold text-onsurface">Material:</span> {p.material}
                    </p>
                  )}
                  {p.careInstructions && (
                    <p>
                      <span className="font-semibold text-onsurface">Care:</span> {p.careInstructions}
                    </p>
                  )}
                </div>
              </Accordion>
              <Accordion id="fit" open={openSection} onToggle={setOpenSection} title="The fit">
                <div className="flex flex-col gap-2 text-sm leading-relaxed text-onsurface-variant">
                  {p.fit && (
                    <p>
                      <span className="font-semibold text-onsurface">Fit:</span> {p.fit}
                    </p>
                  )}
                  {p.sizeGuide && (
                    <p>
                      <span className="font-semibold text-onsurface">Size guide:</span> {p.sizeGuide}
                    </p>
                  )}
                  <p>
                    Model are wearing their true size. Between two sizes? Choose the larger one for a relaxed
                    drape.
                  </p>
                </div>
              </Accordion>
              <Accordion
                id="shipping"
                open={openSection}
                onToggle={setOpenSection}
                title="Shipping, returns & Trichy alterations"
              >
                <div className="flex flex-col gap-2 text-sm leading-relaxed text-onsurface-variant">
                  <p>
                    Delivery and store-pickup options are confirmed by DAHA after the WhatsApp order request.
                  </p>
                  <p>Return or exchange eligibility follows the store policy shown on this website when configured by the shop.</p>
                  <p>
                    For exact availability or alterations, contact the{" "}
                    <Link to="/store" className="text-primary underline">DAHA Clothing Store in Trichy</Link>.
                  </p>
                </div>
              </Accordion>
            </div>

            {/* Desktop CTA */}
            <div className="mt-6 hidden gap-3 md:flex">
              <button
                onClick={() => handleAddToCart(false)}
                disabled={adding}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-surface text-sm font-bold text-primary ring-1 ring-hairline transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                <MaterialIcon name="shopping_bag" size={20} />
                {adding ? "Adding..." : "Add to Bag"}
              </button>
              <button
                onClick={() => handleAddToCart(true)}
                disabled={adding || outOfStock}
                className="flex h-14 flex-[1.2] items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-onprimary shadow-md transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                <MaterialIcon name="bolt" size={20} />
                Buy Now • {formatRupees(p.sellingPrice * quantity)}
              </button>
            </div>
          </div>
        </div>

        {/* Complete the Look */}
        {relatedData?.products && relatedData.products.length > 0 && (
          <section className="mt-12 md:mt-16">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="font-display text-xl text-onsurface">Complete the Look</h2>
                <p className="text-sm text-onsurface-variant">Pairs beautifully with these pieces</p>
              </div>
              {categorySlug && (
                <Link
                  to={`/category/${categorySlug}`}
                  className="flex items-center gap-0.5 text-sm font-semibold text-primary"
                >
                  View all
                  <MaterialIcon name="arrow_forward" size={16} />
                </Link>
              )}
            </div>
            <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-4 lg:grid-cols-6 md:px-0">
              {relatedData.products.map((r) => {
                const img = r.primaryImage || r.images?.[0];
                return (
                  <Link
                    key={r._id}
                    to={`/product/${r.slug}`}
                    className="group w-40 shrink-0 md:w-auto"
                  >
                    <div className="aspect-[3/4] overflow-hidden rounded-xl bg-surface-container">
                      {img?.url && (
                        <img
                          src={img.url}
                          alt={img.alt || r.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-snug text-onsurface">{r.name}</p>
                    <div className="mt-0.5 flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-primary">{formatRupees(r.sellingPrice)}</span>
                      {r.mrpPrice > r.sellingPrice && (
                        <span className="text-xs text-onsurface-variant line-through">{formatRupees(r.mrpPrice)}</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Sticky buy dock (mobile) */}
      <div className="fixed inset-x-0 bottom-16 z-40 border-t border-hairline bg-surface/95 backdrop-blur-xl md:hidden">
        <div className="container-daha flex gap-2 py-2">
          <button
            onClick={() => handleAddToCart(false)}
            disabled={adding || outOfStock}
            className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full bg-surface text-sm font-bold text-primary ring-1 ring-hairline transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            <MaterialIcon name="shopping_bag" size={19} />
            Add to Bag
          </button>
          <button
            onClick={() => handleAddToCart(true)}
            disabled={adding || outOfStock}
            className="flex h-12 flex-[1.3] items-center justify-center gap-1.5 rounded-full bg-primary text-sm font-bold text-onprimary shadow-md transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            <MaterialIcon name="bolt" size={19} />
            Buy Now • {formatRupees(p.sellingPrice * quantity)}
          </button>
        </div>
      </div>
      <div className="h-16 md:hidden" />
    </>
  );
}

function uniqueColors(p) {
  return Array.from(new Map((p.variants || []).map((v) => [v.color, v])).values());
}

function Accordion({ id, title, open, onToggle, children }) {
  const isOpen = open === id;
  return (
    <div>
      <button
        onClick={() => onToggle(isOpen ? null : id)}
        className="flex w-full items-center justify-between gap-2 py-4 text-left"
      >
        <span className="text-sm font-bold text-onsurface">{title}</span>
        <MaterialIcon
          name="expand_more"
          size={20}
          className={`text-onsurface-variant transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && <div className="pb-4">{children}</div>}
    </div>
  );
}