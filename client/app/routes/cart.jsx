import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { useCartStore } from "~/store/useCartStore";
import { formatRupees } from "~/lib/format";
import { MaterialIcon } from "~/components/MaterialIcon";
import { useCoupon } from "~/lib/useCoupon";
import { useToastStore } from "~/store/useToastStore";
import { api } from "~/lib/api";

export default function Cart() {
  const cart = useCartStore((s) => s.cart);
  const updateItem = useCartStore((s) => s.updateItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const navigate = useNavigate();
  const pushToast = useToastStore((state) => state.push);
  const { data: settingsData } = useQuery({
    queryKey: ["cart-settings"],
    queryFn: () => api.get("/settings"),
    staleTime: 5 * 60 * 1000,
  });
  const [couponInput, setCouponInput] = useState("");

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container-daha py-20 text-center">
        <MaterialIcon name="shopping_bag" size={48} className="mx-auto text-outline" />
        <h1 className="font-display mt-4 text-2xl text-onsurface">Your bag is empty</h1>
        <p className="mt-2 text-sm text-onsurface-variant">
          Discover fresh arrivals and everyday essentials.
        </p>
        <Link
          to="/products"
          className="mt-6 inline-block rounded-lg bg-primary px-8 py-3.5 text-sm font-semibold text-onprimary shadow-md"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  const subtotal = cart.items.reduce(
    (sum, it) => sum + (it?.product?.sellingPrice ?? it.sellingPrice ?? it.price ?? 0) * it.quantity,
    0
  );
  const mrpTotal = cart.items.reduce(
    (sum, it) => sum + (it?.product?.mrpPrice ?? it.mrpPrice ?? it?.product?.sellingPrice ?? it.sellingPrice ?? 0) * it.quantity,
    0
  );
  const mrpSavings = mrpTotal - subtotal;
  const storeSettings = settingsData?.settings || {};
  const configuredShipping = Number(storeSettings.shippingCharge || 0);
  const freeThreshold = Number(storeSettings.freeShippingThreshold || 0);
  const shipping = freeThreshold > 0 && subtotal >= freeThreshold ? 0 : configuredShipping;
  const { applied, discount: couponDiscount, message, error, apply, remove } = useCoupon(subtotal);
  const total = subtotal + shipping - couponDiscount;

  const stockFor = (item) => {
    const variants = item?.product?.variants || item?.variants;
    if (!Array.isArray(variants)) return null;
    const v = variants.find((x) => (x._id || x.sku) === (item.variantId || item._id));
    const stock = v ? v.stock : variants.reduce((s, x) => s + (x.stock || 0), 0);
    return stock;
  };

  return (
    <div className="container-daha py-6">
      <div className="mx-auto max-w-6xl">
        {/* Editorial header */}
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h1 className="font-display text-2xl text-onsurface">Express Bag</h1>
            <p className="text-sm text-onsurface-variant">
              {cart.items.length} boutique handcrafted selection{cart.items.length > 1 ? "s" : ""}
            </p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
            Order via WhatsApp
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Items */}
          <div className="flex flex-col gap-3 lg:col-span-2">
            {cart.items.map((item) => {
              const id = item.variantId || item._id;
              const prod = item?.product;
              const name = prod?.name || item.name || item.productName || "Product";
              const img = prod?.images?.[0]?.url || item.image || item.productImage;
              const selling = prod?.sellingPrice ?? item.sellingPrice ?? item.price ?? 0;
              const mrp = prod?.mrpPrice ?? item.mrpPrice ?? selling;
              const stock = stockFor(item);
              return (
                <div
                  key={id || name}
                  className="flex gap-4 rounded-xl bg-surface-container-lowest p-4 shadow-sm"
                >
                  <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-container">
                    {img && <img src={img} alt={name} className="h-full w-full object-cover" />}
                    {prod?.isNew && (
                      <span className="absolute left-1.5 top-1.5 rounded bg-surface-container-lowest/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary backdrop-blur-sm">
                        New
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-1 leading-tight text-onsurface">{name}</h3>
                      <button
                        onClick={async () => {
                          if (!id) return;
                          try {
                            await removeItem(String(id));
                            pushToast("Item removed from cart.", "success");
                          } catch (err) {
                            pushToast(err.message || "Could not remove item.", "error");
                          }
                        }}
                        aria-label="Remove item"
                        className="p-1 text-onsurface-variant transition-colors hover:text-error"
                      >
                        <MaterialIcon name="close" size={18} />
                      </button>
                    </div>
                    <p className="mt-0.5 text-sm text-onsurface-variant">
                      Color: {item.color || "—"} · Size: {item.size || "—"}
                    </p>
                    <div className="mt-1.5">
                      {stock !== null ? (
                        stock === 0 ? (
                          <span className="rounded-full bg-errorcontainer px-2 py-0.5 text-xs font-semibold text-onerrorcontainer">
                            Sold out
                          </span>
                        ) : stock <= 5 ? (
                          <span className="rounded-full bg-errorcontainer px-2 py-0.5 text-xs font-semibold text-onerrorcontainer">
                            Only {stock} left
                          </span>
                        ) : (
                          <span className="rounded-full bg-secondarycontainer px-2 py-0.5 text-xs font-medium text-onsecondarycontainer">
                            In Stock
                          </span>
                        )
                      ) : (
                        <span className="rounded-full bg-secondarycontainer px-2 py-0.5 text-xs font-medium text-onsecondarycontainer">
                          In Stock
                        </span>
                      )}
                    </div>

                    <div className="-mx-4 -mb-4 mt-2 flex items-center justify-between rounded-b-xl bg-surface-container-low/40 px-4 py-2.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-bold text-primary">{formatRupees(selling * item.quantity)}</span>
                        {mrp > selling && (
                          <span className="text-xs text-outline line-through">{formatRupees(mrp * item.quantity)}</span>
                        )}
                      </div>
                      <div className="flex items-center rounded-lg bg-surface-container-highest p-0.5">
                        <button
                          onClick={async () => {
                            if (!id) return;
                            try {
                              await updateItem(String(id), Math.max(1, item.quantity - 1));
                              pushToast("Cart updated.", "success", 1800);
                            } catch (err) {
                              pushToast(err.message || "Could not update cart.", "error");
                            }
                          }}
                          aria-label="Decrease quantity"
                          className="flex h-6 w-6 items-center justify-center text-onsurface transition-colors hover:text-primary active:scale-95"
                        >
                          <MaterialIcon name="remove" size={16} />
                        </button>
                        <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={async () => {
                            if (!id) return;
                            try {
                              await updateItem(String(id), item.quantity + 1);
                              pushToast("Cart updated.", "success", 1800);
                            } catch (err) {
                              pushToast(err.message || "Could not update cart.", "error");
                            }
                          }}
                          aria-label="Increase quantity"
                          className="flex h-6 w-6 items-center justify-center text-onsurface transition-colors hover:text-primary active:scale-95"
                        >
                          <MaterialIcon name="add" size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Coupon */}
            <div className="flex flex-col gap-2 rounded-xl bg-surface-container-low p-4 shadow-sm">
              <label htmlFor="coupon-code" className="flex items-center gap-1.5 text-sm font-medium text-onsurface">
                <MaterialIcon name="local_activity" size={18} className="text-secondary" />
                Boutique Coupon &amp; Offers
                {applied && (
                  <span className="ml-auto text-xs font-bold uppercase tracking-wider text-secondary">
                    Applied
                  </span>
                )}
              </label>
              {applied ? (
                <div className="flex items-center justify-between rounded-lg bg-surface-container-lowest px-3 py-2">
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="check_circle" size={18} className="text-primary" filled />
                    <p className="text-sm text-onsurface">
                      <span className="font-bold text-primary">{applied.code}</span> applied (-
                      {formatRupees(couponDiscount)} off your boutique order)
                    </p>
                  </div>
                  <button onClick={() => { remove(); setCouponInput(""); }} className="ml-2 text-xs font-medium text-error hover:underline">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      id="coupon-code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="ENTER CODE"
                      className="w-full rounded-lg bg-surface-container-lowest px-3 py-2.5 text-sm font-medium uppercase tracking-wider text-onsurface placeholder:text-onsurface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <button
                    onClick={() => apply(couponInput)}
                    className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-onprimary transition-transform active:scale-95"
                  >
                    Apply
                  </button>
                </div>
              )}
              {message && <p className="text-xs font-medium text-success">{message}</p>}
              {error && <p className="text-xs font-medium text-error">{error}</p>}
            </div>
          </div>

          {/* Summary */}
          <div className="h-fit rounded-xl bg-surface-container-low p-4 shadow-sm lg:sticky lg:top-20">
            <h2 className="font-display mb-3 text-lg text-onsurface">Order Summary</h2>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-onsurface-variant">
                <span>Bag Total ({cart.items.length} item{cart.items.length > 1 ? "s" : ""})</span>
                <span className="text-onsurface">{formatRupees(subtotal)}</span>
              </div>
              <div className="flex justify-between text-onsurface-variant">
                <span>MRP Savings</span>
                <span className="font-semibold text-primary">− {formatRupees(mrpSavings)}</span>
              </div>
              {applied && (
                <div className="flex justify-between text-onsurface-variant">
                  <span>Coupon Discount ({applied.code})</span>
                  <span className="font-semibold text-primary">− {formatRupees(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-onsurface-variant">
                <span className="flex items-center gap-1">
                  Delivery
                  <MaterialIcon name="info" size={16} className="text-secondary" />
                </span>
                <span className="text-xs font-bold text-secondary">{shipping > 0 ? formatRupees(shipping) : "Confirm on WhatsApp"}</span>
              </div>
              <div className="h-px bg-surface-variant my-1" />
              <div className="flex items-start justify-between pt-1">
                <div>
                  <p className="text-sm font-bold text-onsurface">Order Total</p>
                  <p className="text-xs text-onsurface-variant">Final delivery details are confirmed by the store</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">{formatRupees(total)}</p>
                  <p className="text-xs font-medium text-secondary">
                    You save {formatRupees(mrpSavings + couponDiscount)} total
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate("/checkout")}
              className="mt-4 w-full rounded-lg bg-primary py-3.5 text-center text-sm font-semibold text-onprimary shadow-md transition-transform active:scale-[0.98]"
            >
              Proceed to Checkout
            </button>
            <Link to="/products" className="mt-2 block text-center text-sm text-primary">
              Continue Shopping
            </Link>
            <div className="mt-3 flex items-center justify-center gap-1 text-xs text-onsurface-variant">
              <MaterialIcon name="chat" size={14} className="text-secondary" filled />
              Final availability and delivery are confirmed on WhatsApp
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}