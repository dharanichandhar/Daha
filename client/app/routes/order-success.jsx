import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { api } from "~/lib/api";
import { useAuthStore } from "~/store/useAuthStore";
import { useCartStore } from "~/store/useCartStore";
import { formatRupees } from "~/lib/format";
import { MaterialIcon } from "~/components/MaterialIcon";

export default function OrderSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const orderId = params.get("id");
  const [order, setOrder] = useState(null);
  const [whatsapp, setWhatsapp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCart();
    if (!user) {
      navigate("/login?redirect=/order-success" + window.location.search);
      return;
    }
    if (!orderId) {
      setError("Order not found.");
      setLoading(false);
      return;
    }
    api
      .get(`/orders/success/${orderId}`)
      .then((res) => {
        setOrder(res.order);
        setWhatsapp(res.whatsapp);
      })
      .catch((err) => setError(err.message || "Order not found."))
      .finally(() => setLoading(false));
  }, [orderId, user, navigate, fetchCart]);

  if (loading) {
    return (
      <div className="container-daha flex min-h-page flex-col items-center justify-center py-16 text-onsurface-variant">
        <MaterialIcon name="hourglass_top" size={40} className="animate-spin text-secondary" />
        <p className="mt-3 text-sm">Loading your order…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container-daha flex justify-center py-16">
        <div className="max-w-md text-center">
          <MaterialIcon name="error_outline" size={56} className="mx-auto text-error" />
          <h1 className="font-display mt-4 text-2xl text-onsurface">Order not found</h1>
          <p className="mt-2 text-sm text-onsurface-variant">{error || "We could not load this order."}</p>
          <div className="mt-6 flex flex-col gap-2">
            <Link to="/account?tab=orders" className="rounded bg-primary py-3 text-center text-sm font-semibold text-onprimary">
              View My Orders
            </Link>
            <Link to="/products" className="text-sm text-primary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const orderTotal = order.total || 0;

  return (
    <div className="container-daha flex justify-center py-12">
      <div className="w-full max-w-lg text-center">
        <MaterialIcon name="forum" size={56} className="mx-auto text-secondary" />
        <h1 className="font-display mt-4 text-2xl text-onsurface">Order sent to WhatsApp</h1>
        <p className="mt-2 text-sm text-onsurface-variant">
          Your order <span className="font-semibold text-onsurface">{order.orderNumber}</span> has been
          prepared. Send the WhatsApp message to DAHA to confirm it.
        </p>

        <div className="mt-6 flex flex-col gap-2 rounded-xl bg-surface-container-low p-4 text-left shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-onsurface-variant">Order</span>
            <span className="text-sm font-semibold text-onsurface">{order.orderNumber}</span>
          </div>
          {order.items?.map((it) => (
            <div key={it.variantId} className="flex items-center justify-between gap-3 py-1">
              <div className="flex items-center gap-2">
                {it.productImage && (
                  <img src={it.productImage} alt={it.productName} className="h-10 w-8 rounded object-cover" />
                )}
                <div>
                  <p className="text-sm font-medium text-onsurface">{it.productName}</p>
                  <p className="text-xs text-onsurface-variant">
                    {it.color} / {it.size} × {it.quantity}
                  </p>
                </div>
              </div>
              <span className="text-sm text-onsurface">{formatRupees(it.lineTotal)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-surface-variant pt-2">
            <span className="text-sm font-bold text-onsurface">Order Total</span>
            <span className="text-lg font-bold text-primary">{formatRupees(orderTotal)}</span>
          </div>
        </div>

        {whatsapp?.url && (
          <a
            href={whatsapp.url}
            target="_blank"
            rel="noreferrer"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded bg-primary py-3.5 text-sm font-semibold text-onprimary shadow-md"
          >
            <MaterialIcon name="chat" size={20} />
            Open WhatsApp Again
          </a>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <Link to="/account?tab=orders" className="text-sm text-primary">
            View My Orders
          </Link>
          <Link to="/products" className="text-sm text-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}