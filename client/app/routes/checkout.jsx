import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { api } from "~/lib/api";
import { useCartStore } from "~/store/useCartStore";
import { useAuthStore } from "~/store/useAuthStore";
import { formatRupees } from "~/lib/format";
import { MaterialIcon } from "~/components/MaterialIcon";
import { useCoupon } from "~/lib/useCoupon";
import { useToastStore } from "~/store/useToastStore";

const EMPTY_ADDRESS = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pinCode: "",
};

export default function Checkout() {
  const cart = useCartStore((s) => s.cart);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const pushToast = useToastStore((state) => state.push);
  const { data: settingsData } = useQuery({
    queryKey: ["checkout-settings"],
    queryFn: () => api.get("/settings"),
    staleTime: 5 * 60 * 1000,
  });

  const [address, setAddress] = useState({
    ...EMPTY_ADDRESS,
    fullName: user?.name || "",
    phone: user?.phone || "",
  });
  const [storePickup, setStorePickup] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  if (!user) {
    return (
      <div className="container-daha py-16 text-center">
        <h1 className="font-display text-2xl text-onsurface">Checkout</h1>
        <p className="mt-2 text-sm text-onsurface-variant">
          Please sign in to place your order.
        </p>
        <Link
          to="/login?redirect=/checkout"
          className="mt-6 inline-block rounded-lg bg-primary px-8 py-3.5 text-sm font-semibold text-onprimary shadow-md"
        >
          Sign In
        </Link>
        <Link to="/cart" className="mt-3 block text-sm text-primary">
          Back to bag
        </Link>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container-daha py-16 text-center">
        <h1 className="font-display text-2xl text-onsurface">Your bag is empty</h1>
        <Link to="/products" className="mt-4 inline-block text-primary">
          Browse products
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
  const { applied, discount: couponDiscount, message, error: couponError, apply, remove } = useCoupon(subtotal);
  const storeSettings = settingsData?.settings || {};
  const configuredShipping = Number(storeSettings.shippingCharge || 0);
  const freeThreshold = Number(storeSettings.freeShippingThreshold || 0);
  const shipping = storePickup || (freeThreshold > 0 && subtotal >= freeThreshold) ? 0 : configuredShipping;
  const total = subtotal + shipping - couponDiscount;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setPlacing(true);
    try {
      const shippingAddress = { ...address, pinCode: address.pinCode };
      const { order, whatsapp } = await api.post("/orders", {
        shippingAddress,
        couponCode: applied?.code || undefined,
      });
      await fetchCart();

      pushToast("Order prepared. Opening WhatsApp for confirmation.", "success");
      if (typeof window !== "undefined" && whatsapp?.url) {
        window.open(whatsapp.url, "_blank", "noopener,noreferrer");
      }
      navigate(`/order-success?order=${order.orderNumber}&id=${order._id}`);
    } catch (err) {
      const message = err.message || "Could not place order.";
      setError(message);
      pushToast(message, "error");
      setPlacing(false);
    }
  };

  const field = (key, label, extra = "") => (
    <div className={extra}>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-onsurface-variant">
        {label}
      </label>
      <input
        required={key !== "addressLine2"}
        value={address[key]}
        onChange={(ev) => setAddress({ ...address, [key]: ev.target.value })}
        className="w-full rounded-lg bg-surface-container py-2.5 px-3 text-sm text-onsurface placeholder:text-onsurface-variant/50 focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );

  return (
    <div className="container-daha py-6">
      <div className="mx-auto max-w-6xl">
        {/* Stepper */}
        <div className="mb-5 rounded-xl bg-surface-container-low p-4 shadow-sm">
          <div className="relative flex items-center justify-between">
            <div className="absolute left-6 right-6 top-1/2 h-0.5 -translate-y-1/2 bg-surface-variant" />
            <div className="absolute left-6 top-1/2 h-0.5 w-1/2 -translate-y-1/2 bg-primary" />
            <Link to="/cart" className="relative z-10 flex flex-col items-center gap-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-onprimary">
                <MaterialIcon name="check" size={16} filled />
              </span>
              <span className="text-xs font-bold uppercase text-primary">Bag</span>
            </Link>
            <div className="relative z-10 flex flex-col items-center gap-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-onprimary">
                2
              </span>
              <span className="text-xs font-bold uppercase text-primary">Address</span>
            </div>
            <div className="relative z-10 flex flex-col items-center gap-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-container-highest text-xs font-bold text-onsurface-variant">
                3
              </span>
              <span className="text-xs font-medium uppercase text-onsurface-variant">WhatsApp</span>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2">
            {/* Delivery details */}
            <div className="flex flex-col gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondarycontainer text-onsecondarycontainer">
                    <MaterialIcon name="local_shipping" size={18} />
                  </span>
                  <div>
                    <h3 className="leading-tight text-onsurface">Delivery Details</h3>
                    <p className="text-sm text-onsurface-variant">
                      {storePickup
                        ? "Store pickup — confirm timing with DAHA"
                        : "Delivery details will be confirmed on WhatsApp"}
                    </p>
                  </div>
                </div>
                {(address.fullName || address.phone) && (
                  <span className="rounded bg-secondarycontainer px-2 py-0.5 text-xs font-medium text-primary">
                    Pre-filled
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span aria-hidden>🇮🇳</span>
                  <span className="text-sm text-onsurface">India</span>
                </div>
                <span className="text-sm text-onsurface-variant">Domestic</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {field("fullName", "Full Name")}
                {field("phone", "WhatsApp Number")}
                {field("addressLine1", "Address Line 1")}
                {field("addressLine2", "Landmark / Area")}
                <div className="grid grid-cols-3 gap-2">
                  {field("city", "City")}
                  {field("state", "State")}
                  {field("pinCode", "PIN")}
                </div>
              </div>

              <label className="mt-1 flex cursor-pointer select-none items-start gap-3 rounded-lg bg-surface-container-low p-3">
                <input
                  type="checkbox"
                  checked={storePickup}
                  onChange={(e) => setStorePickup(e.target.checked)}
                  className="mt-0.5 h-4 w-4 cursor-pointer accent-primary"
                />
                <div>
                  <span className="text-sm font-semibold text-onsurface">
                    Pick up from the DAHA store
                  </span>
                  <span className="mt-0.5 block text-sm text-onsurface-variant">
                    The store will confirm pickup timing and location on WhatsApp.
                  </span>
                </div>
              </label>

              {/* Coupon */}
              <div className="flex flex-col gap-2 rounded-xl bg-surface-container-low p-3">
                <label htmlFor="coupon-code" className="flex items-center gap-1.5 text-sm font-medium text-onsurface">
                  <MaterialIcon name="local_activity" size={18} className="text-secondary" />
                  Boutique Coupon &amp; Offers
                  {applied && (
                    <span className="ml-auto text-xs font-bold uppercase tracking-wider text-secondary">Applied</span>
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
                    <button onClick={remove} className="ml-2 text-xs font-medium text-error hover:underline">
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      id="coupon-code"
                      placeholder="ENTER CODE"
                      className="w-full rounded-lg bg-surface-container-lowest px-3 py-2.5 text-sm font-medium uppercase tracking-wider text-onsurface placeholder:text-onsurface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={(e) => apply(e.currentTarget.previousElementSibling.value)}
                      className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-onprimary transition-transform active:scale-95"
                    >
                      Apply
                    </button>
                  </div>
                )}
                {message && <p className="text-xs font-medium text-success">{message}</p>}
                {couponError && <p className="text-xs font-medium text-error">{couponError}</p>}
              </div>
            </div>

            {/* Order via WhatsApp */}
            <div className="flex flex-col gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondarycontainer text-onsecondarycontainer">
                    <MaterialIcon name="chat" size={18} />
                  </span>
                  <div>
                    <h3 className="leading-tight text-onsurface">Send Order on WhatsApp</h3>
                    <p className="text-sm text-onsurface-variant">
                      We confirm availability, delivery and payment on WhatsApp.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-secondary">No online payment</span>
              </div>

              <div className="flex flex-col gap-2.5 rounded-lg bg-surface-container-low p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-onsurface">How it works</span>
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    { title: "Review your bag", sub: "Your items and total are shown below." },
                    { title: "Send it on WhatsApp", sub: "Your order opens in WhatsApp, ready to send to DAHA." },
                    { title: "DAHA confirms", sub: "We verify stock and share payment & delivery options." },
                  ].map((step, i) => (
                    <div key={step.title} className="flex items-start gap-3 rounded-lg bg-surface-container-lowest p-2.5 shadow-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-onprimary">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-onsurface">{step.title}</p>
                        <p className="text-sm text-onsurface-variant">{step.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <p className="rounded bg-errorcontainer px-3 py-2 text-sm text-onerrorcontainer">{error}</p>
              )}

              <button
                type="submit"
                disabled={placing}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-4 text-sm font-bold text-onprimary shadow-md transition-all active:scale-[0.99] disabled:opacity-60"
              >
                <MaterialIcon name="chat" size={20} />
                {placing ? "Opening WhatsApp..." : "Send Order on WhatsApp"}
              </button>
              <div className="flex items-center justify-center gap-4 pt-1 text-xs text-onsurface-variant">
                <span className="flex items-center gap-1">
                  <MaterialIcon name="done_all" size={16} className="text-secondary" filled />
                  No prepayment required
                </span>
                <span className="text-surface-variant">•</span>
                <span className="flex items-center gap-1">
                  <MaterialIcon name="verified_user" size={16} className="text-secondary" filled />
                  Verified by our team
                </span>
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="h-fit rounded-xl bg-surface-container-low p-4 shadow-sm lg:sticky lg:top-20 flex flex-col gap-2">
            <h3 className="text-onsurface">Order Summary</h3>
            <div className="flex justify-between text-sm text-onsurface-variant">
              <span>Bag Total ({cart.items.length} item{cart.items.length > 1 ? "s" : ""})</span>
              <span className="text-onsurface">{formatRupees(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-onsurface-variant">
              <span>MRP Savings</span>
              <span className="font-semibold text-primary">-{formatRupees(mrpSavings)}</span>
            </div>
            {applied && (
              <div className="flex justify-between text-sm text-onsurface-variant">
                <span>Coupon Discount ({applied.code})</span>
                <span className="font-semibold text-primary">-{formatRupees(couponDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-onsurface-variant">
              <span className="flex items-center gap-1">
                Delivery
                <MaterialIcon name="info" size={16} className="text-secondary" />
              </span>
              <span className="text-xs font-bold text-secondary">
                {storePickup ? "Store pickup" : shipping > 0 ? formatRupees(shipping) : "Confirm on WhatsApp"}
              </span>
            </div>
            <div className="h-px bg-surface-variant my-1" />
            <div className="flex items-start justify-between pt-1">
              <div>
                <p className="text-sm font-bold text-onsurface">Order Total</p>
                <p className="text-xs text-onsurface-variant">Product total shown before store confirmation</p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xl font-bold text-primary">{formatRupees(total)}</span>
                <span className="text-xs font-medium text-secondary">
                  You save {formatRupees(mrpSavings + couponDiscount)} total
                </span>
              </div>
            </div>

          </div>
        </form>

        <div className="mt-4 flex items-center gap-3 rounded-xl bg-secondarycontainer/45 p-4">
          <MaterialIcon name="chat" size={24} className="text-secondary" />
          <div>
            <p className="text-sm font-bold text-onsecondarycontainer">Order confirmation happens on WhatsApp</p>
            <p className="text-sm text-onsecondarycontainer">
              DAHA verifies product availability, delivery or pickup details, and the next steps before confirming your order.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}