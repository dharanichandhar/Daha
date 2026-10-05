import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { api } from "~/lib/api";
import { formatRupees } from "~/lib/format";
import { MaterialIcon } from "~/components/MaterialIcon";

const STATUS_LABELS = {
  pending_confirmation: "Pending Confirmation",
  placed: "Placed",
  confirmed: "Confirmed",
  packed: "Packed",
  ready: "Ready",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
  refunded: "Refunded",
};

const STATUS_OPTIONS = [
  "pending_confirmation",
  "confirmed",
  "packed",
  "ready",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

export function DashboardTab() {
  const { data, refetch } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => api.get("/admin/dashboard"),
    retry: false,
  });

  const stats = data?.stats || {};

  return (
    <div className="flex flex-col gap-4">
      {/* Store Pulse */}
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-lg text-onsurface">Store Pulse</h2>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-secondary">
          <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
          Live Real-time
        </span>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-2">
        <div className="flex flex-col justify-between rounded-xl bg-surface-container-low p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-onsurface-variant">Today's Order Value</span>
            <MaterialIcon name="payments" size={20} className="text-secondary" />
          </div>
          <p className="text-2xl font-bold text-primary">{formatRupees(stats.todayValue || 0)}</p>
          <span className="mt-2 flex items-center gap-1 text-xs text-secondary">
            <MaterialIcon name="trending_up" size={14} />
            {formatRupees(stats.totalValue || 0)} all-time
          </span>
        </div>

        <div className="flex flex-col justify-between rounded-xl bg-surface-container-low p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-onsurface-variant">Total Orders</span>
            <MaterialIcon name="shopping_bag" size={20} className="text-primary" />
          </div>
          <p className="text-2xl font-bold text-onsurface">{stats.totalOrders || 0}</p>
          <span className="mt-2 flex items-center gap-1.5 text-xs font-medium text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
            {stats.pendingConfirmations || 0} awaiting confirmation
          </span>
        </div>

        <div className="flex flex-col justify-between rounded-xl bg-errorcontainer p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-onerrorcontainer">Low Stock</span>
            <MaterialIcon name="warning" size={20} className="text-error" />
          </div>
          <p className="text-2xl font-bold text-onerrorcontainer">{stats.lowStockProducts || 0} SKUs</p>
          <p className="mt-2 text-xs text-onerrorcontainer">Immediate reorder required</p>
        </div>

        <div className="flex flex-col justify-between rounded-xl bg-surface-container-low p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-onsurface-variant">Active Catalog</span>
            <MaterialIcon name="checkroom" size={20} className="text-onsurface-variant" />
          </div>
          <p className="text-2xl font-bold text-onsurface">{stats.totalProducts || 0}</p>
          <p className="mt-2 text-xs text-onsurface-variant">Men, Women, Kids</p>
        </div>
      </div>

      {/* Recent orders */}
      <div className="mt-2">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg text-onsurface">Recent Orders</h2>
            <span className="rounded-full bg-secondarycontainer px-2 py-0.5 text-xs font-medium text-onsecondarycontainer">
              Live (Trichy Dispatch)
            </span>
          </div>
          <button onClick={() => (window.location.href = "/admin?tab=orders")} className="text-sm font-medium text-secondary hover:underline">
            View All
          </button>
        </div>
        {!data?.recentOrders || data.recentOrders.length === 0 ? (
          <p className="text-sm text-onsurface-variant">No orders yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {data.recentOrders.map((o) => (
              <OrderCard key={o._id} order={o} onUpdated={refetch} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, onUpdated }) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const [status, setStatus] = useState(order.orderStatus);
  const [tracking, setTracking] = useState(order.trackingNumber || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const city = order.shippingAddress?.city || "Trichy";
  const state = order.shippingAddress?.state || "TN";
  const first = order.items?.[0];
  const itemCount = order.items?.reduce((s, i) => s + i.quantity, 0) || order.items?.length || 0;
  const paid = order.payment?.status === "paid";
  const isWhatsapp = (order.source || order.payment?.provider) === "whatsapp";

  const saveStatus = async () => {
    setBusy(true);
    setMsg("");
    try {
      const res = await api.put(`/orders/admin/${order._id}/status`, { status });
      client.setQueryData(["admin-dashboard"], (prev) => prev);
      onUpdated?.();
      setMsg("Status updated");
    } catch (e) {
      setMsg(e.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const saveTracking = async () => {
    setBusy(true);
    setMsg("");
    try {
      await api.put(`/orders/admin/${order._id}/tracking`, { trackingNumber: tracking });
      client.setQueryData(["admin-dashboard"], (prev) => prev);
      onUpdated?.();
      setMsg("Tracking saved");
    } catch (e) {
      setMsg(e.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <LinkButton to={`/admin?tab=orders`}>
              <span className="font-bold text-primary">#{order.orderNumber}</span>
            </LinkButton>
            <span className="rounded-full bg-surface-container-highest px-2 py-0.5 text-xs text-onsurface-variant">
              {isWhatsapp ? "WhatsApp" : order.payment?.provider || "Store"}
            </span>
          </div>
          <p className="mt-0.5 text-sm font-medium text-onsurface">
            {order.customerSnapshot?.name || "Customer"}{" "}
            <span className="font-normal text-outline">· {city}, {state}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-primary">{formatRupees(order.total)}</p>
          <span
            className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
              paid
                ? "bg-secondarycontainer text-onsecondarycontainer"
                : isWhatsapp
                  ? "bg-secondarycontainer/60 text-onsecondarycontainer"
                  : "bg-errorcontainer text-onerrorcontainer"
            }`}
          >
            {paid ? "Payment Verified" : isWhatsapp ? "WhatsApp Order" : "Pending"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg bg-surface-container-low p-2">
        {first?.productImage && (
          <img
            src={first.productImage}
            alt={first.productName}
            className="h-14 w-12 shrink-0 rounded-md object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-onsurface">
            {first?.productName || "Item"}
            {first?.size ? ` (${first.size})` : ""}
            {itemCount > 1 ? ` +${itemCount - 1} more` : ""}
          </p>
          <p className="text-xs text-onsurface-variant">
            {itemCount} item{itemCount !== 1 ? "s" : ""} · {STATUS_LABELS[order.orderStatus]}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-start gap-2 pt-1">
        <span className="whitespace-nowrap text-xs text-onsurface-variant">Fulfillment:</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          disabled={order.orderStatus === "delivered" || order.orderStatus === "cancelled"}
          className="max-w-[180px] flex-1 appearance-none rounded-lg bg-surface-container-high px-2.5 py-1.5 text-sm text-onsurface focus:bg-surface-container-highest focus:outline-none"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button
          onClick={saveStatus}
          disabled={busy}
          className="rounded-lg bg-primarycontainer px-3 py-1.5 text-xs font-medium text-onprimary transition-colors hover:bg-primary disabled:opacity-60"
        >
          Update
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg bg-surface-container-low px-3 py-2">
          <MaterialIcon name="local_shipping" size={16} className="text-outline" />
          <input
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="Add BlueDart / Local Courier Tracking"
            className="w-full bg-transparent text-sm text-onsurface placeholder:text-outline focus:outline-none"
          />
        </div>
        <button
          onClick={saveTracking}
          disabled={busy}
          className="rounded-lg bg-primarycontainer px-3 py-2 text-xs font-medium text-onprimary transition-colors hover:bg-primary disabled:opacity-60"
        >
          Save
        </button>
      </div>

      {msg && <p className="text-xs font-medium text-success">{msg}</p>}
    </div>
  );
}

function LinkButton({ to, children }) {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(to)}>
      {children}
    </button>
  );
}