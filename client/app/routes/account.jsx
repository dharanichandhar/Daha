import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router";
import { api } from "~/lib/api";
import { useAuthStore } from "~/store/useAuthStore";
import { formatRupees } from "~/lib/format";

const TABS = [
  { key: "orders", label: "Orders" },
  { key: "profile", label: "Profile" },
  { key: "addresses", label: "Addresses" },
];

export default function Account() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "orders";
  const { user, setUser } = useAuthStore();

  const { data: ordersData } = useQuery({
    queryKey: ["my-orders"],
    enabled: tab === "orders",
    queryFn: () => api.get("/orders/my-orders"),
    retry: false,
  });
  const orders = ordersData?.orders || ordersData?.data || [];

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saved, setSaved] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    const updated = await api.put("/auth/profile", { name, phone });
    if (updated.user) setUser(updated.user);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!user) {
    return (
      <div className="container-daha py-20 text-center">
        <h1 className="font-display text-2xl text-onsurface">My Account</h1>
        <p className="mt-2 text-sm text-onsurface-variant">
          Please sign in to view your account.
        </p>
        <Link
          to={`/login?redirect=/account`}
          className="mt-6 inline-block rounded bg-primary px-6 py-3 text-sm font-semibold text-onprimary"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="container-daha py-6">
      <h1 className="font-display mb-2 text-2xl text-onsurface">
        Hello, {user.name?.split(" ")[0] || "there"}
      </h1>
      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setSearchParams({ tab: t.key })}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm ${
              tab === t.key
                ? "bg-primary text-onprimary"
                : "bg-surface-container text-onsurface"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "orders" && (
        <div className="flex flex-col gap-3">
          {orders.length === 0 && (
            <p className="text-sm text-onsurface-variant">No orders yet.</p>
          )}
          {orders.map((o) => (
            <Link
              key={o._id}
              to={`/order-success`}
              className="rounded-xl bg-surface-container-low p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-onsurface">#{o.orderNumber}</p>
                  <p className="text-xs text-onsurface-variant">
                    {new Date(o.createdAt).toLocaleDateString()} · {o.status}
                  </p>
                </div>
                <span className="font-bold text-onsurface">
                  {formatRupees(o.totalAmount)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === "profile" && (
        <form onSubmit={saveProfile} className="max-w-md flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-hairline bg-surface px-3 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              value={user.email}
              disabled
              className="w-full rounded border border-hairline bg-surface-container px-3 py-2.5 text-onsurface-variant"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded border border-hairline bg-surface px-3 py-2.5 focus:border-primary focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded bg-primary py-3 font-semibold text-onprimary"
          >
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </form>
      )}

      {tab === "addresses" && (
        <p className="text-sm text-onsurface-variant">
          Addresses are captured at checkout. Add a delivery address when placing
          your next order.
        </p>
      )}
    </div>
  );
}