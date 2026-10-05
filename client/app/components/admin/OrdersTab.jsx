import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "~/lib/api";
import { formatRupees } from "~/lib/format";
import { MaterialIcon } from "~/components/MaterialIcon";
import { useToastStore } from "~/store/useToastStore";

const STATUSES = ["pending_confirmation", "placed", "confirmed", "packed", "ready", "shipped", "out_for_delivery", "delivered", "cancelled", "refunded"];

export function OrdersTab() {
  const { data, refetch } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => api.get("/orders/admin/all?limit=100"),
    retry: false,
  });
  const orders = data?.orders || data?.data || [];
  const [openId, setOpenId] = useState(null);
  const [busy, setBusy] = useState(false);
  const pushToast = useToastStore((state) => state.push);

  const updateStatus = async (id, status) => {
    setBusy(true);
    try {
      await api.put(`/orders/admin/${id}/status`, { status });
      await refetch();
      pushToast(`Order status updated to ${status.replace(/_/g, " ")}.`, "success");
    } catch (e) {
      pushToast(e.message || "Could not update order status.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-onsurface">Orders ({orders.length})</h2>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1 rounded bg-surface px-3 py-1.5 text-sm text-onsurface ring-1 ring-hairline"
        >
          <MaterialIcon name="refresh" size={16} /> Refresh
        </button>
      </div>

      {orders.length === 0 && (
        <p className="py-8 text-center text-sm text-onsurface-variant">No orders yet.</p>
      )}

      <div className="mt-3 space-y-2">
        {orders.map((o) => (
          <div key={o._id} className="rounded-xl bg-surface-container-low p-3 shadow-sm">
            <button
              onClick={() => setOpenId(openId === o._id ? null : o._id)}
              className="flex w-full items-center justify-between text-left"
            >
              <div>
                <p className="text-sm font-bold text-onsurface">#{o.orderNumber}</p>
                <p className="text-xs text-onsurface-variant">
                  {o.customerSnapshot?.name || "-"} · {new Date(o.createdAt).toLocaleDateString()}
                </p>
                {o.source === "whatsapp" && (
                  <span className="mt-0.5 inline-flex items-center gap-1 rounded bg-secondarycontainer px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-onsecondarycontainer">
                    <MaterialIcon name="chat" size={11} /> WhatsApp
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-right text-sm font-bold text-onsurface">
                  {formatRupees(o.total)}
                </span>
                <MaterialIcon
                  name={openId === o._id ? "expand_less" : "expand_more"}
                  size={18}
                  className="text-onsurface-variant"
                />
              </div>
            </button>

            {openId === o._id && (
              <div className="mt-3 border-t border-hairline pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-onsurface-variant">Status:</span>
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      disabled={busy}
                      onClick={() => updateStatus(o._id, s)}
                      className={`rounded-full px-2.5 py-1 text-xs capitalize transition-colors ${
                        o.orderStatus === s
                          ? "bg-primary text-onprimary"
                          : "bg-surface text-onsurface ring-1 ring-hairline hover:bg-surface-container"
                      }`}
                    >
                      {s.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>

                {(o.customerWhatsAppNumber || o.shippingAddress?.phone) && (
                  <a
                    href={`https://wa.me/${String(o.customerWhatsAppNumber || o.shippingAddress.phone).replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-1.5 text-xs font-semibold text-success ring-1 ring-success/30"
                  >
                    <MaterialIcon name="chat" size={14} />
                    Chat Customer on WhatsApp
                  </a>
                )}

                {o.shippingAddress && (
                  <div className="mt-2 rounded bg-surface px-3 py-2 text-xs text-onsurface-variant">
                    {[o.shippingAddress.addressLine1, o.shippingAddress.addressLine2, o.shippingAddress.city, o.shippingAddress.state, o.shippingAddress.pinCode]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                )}

                {o.items && o.items.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {o.items.map((it, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-onsurface-variant">
                        {it.productImage && (
                          <img src={it.productImage} alt="" className="h-8 w-6 rounded object-cover" />
                        )}
                        <span className="flex-1 text-onsurface">{it.productName}</span>
                        <span>
                          {it.color && `${it.color} · `}
                          {it.size && `Size ${it.size} · `}
                          x{it.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}