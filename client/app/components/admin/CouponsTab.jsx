import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "~/lib/api";
import { formatRupees } from "~/lib/format";
import { MaterialIcon } from "~/components/MaterialIcon";
import { useToastStore } from "~/store/useToastStore";

const EMPTY = {
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  minOrderAmount: "0",
  maxDiscount: "0",
  usageLimit: "0",
  perUserLimit: "1",
  startDate: "",
  expiryDate: "",
  active: true,
};

export function CouponsTab() {
  const { data, refetch } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: () => api.get("/coupons"),
    retry: false,
  });
  const coupons = data?.coupons || [];
  const [showForm, setShowForm] = useState(false);
  const pushToast = useToastStore((state) => state.push);
  const [editing, setEditing] = useState(null);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (c) => {
    setEditing(c);
    setShowForm(true);
  };

  const remove = async (c) => {
    if (!confirm(`Delete coupon ${c.code}?`)) return;
    try {
      await api.del(`/coupons/${c._id}`);
      await refetch();
      pushToast("Coupon deleted.", "success");
    } catch (e) {
      pushToast(e.message || "Could not delete coupon.", "error");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-onsurface">Coupons ({coupons.length})</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-1 rounded bg-primary px-4 py-2 text-sm font-semibold text-onprimary shadow-sm"
        >
          <MaterialIcon name="add" size={18} /> New Coupon
        </button>
      </div>

      {coupons.length === 0 && (
        <p className="py-8 text-center text-sm text-onsurface-variant">
          No coupons yet. Create one to offer discounts.
        </p>
      )}

      <div className="mt-3 space-y-2">
        {coupons.map((c) => (
          <div
            key={c._id}
            className="flex items-center justify-between gap-2 rounded-xl bg-surface-container-low p-3 shadow-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded bg-primary px-2 py-0.5 font-mono text-xs font-bold text-onprimary">
                  {c.code}
                </span>
                {!c.active && (
                  <span className="rounded bg-surface-container px-2 py-0.5 text-xs text-onsurface-variant">
                    inactive
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-xs text-onsurface-variant">
                {c.discountType === "percentage" ? `${c.discountValue}% off` : `${formatRupees(c.discountValue)} off`}
                {c.minOrderAmount ? ` · min ${formatRupees(c.minOrderAmount)}` : ""}
                {c.maxDiscount && c.discountType === "percentage"
                  ? ` · max ${formatRupees(c.maxDiscount)}`
                  : ""}
                {" · "}
                {c.usageCount || 0}/{c.usageLimit || "∞"} used
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => openEdit(c)}
                className="flex h-8 w-8 items-center justify-center rounded text-onsurface hover:bg-surface"
                aria-label="Edit"
              >
                <MaterialIcon name="edit" size={18} />
              </button>
              <button
                onClick={() => remove(c)}
                className="flex h-8 w-8 items-center justify-center rounded text-onsurface hover:bg-errorcontainer"
                aria-label="Delete"
              >
                <MaterialIcon name="delete_outline" size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <CouponForm
          coupon={editing}
          onClose={() => setShowForm(false)}
          onSaved={async () => {
            await refetch();
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}

function CouponForm({ coupon, onClose, onSaved }) {
  const [form, setForm] = useState(() =>
    coupon
      ? {
          code: coupon.code,
          description: coupon.description || "",
          discountType: coupon.discountType,
          discountValue: String(coupon.discountValue),
          minOrderAmount: coupon.minOrderAmount?.toString() || "0",
          maxDiscount: coupon.maxDiscount?.toString() || "0",
          usageLimit: coupon.usageLimit?.toString() || "0",
          perUserLimit: coupon.perUserLimit?.toString() || "1",
          startDate: coupon.startDate ? coupon.startDate.slice(0, 10) : "",
          expiryDate: coupon.expiryDate ? coupon.expiryDate.slice(0, 10) : "",
          active: coupon.active ?? true,
        }
      : { ...EMPTY }
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const payload = {
      code: form.code,
      description: form.description,
      discountType: form.discountType,
      discountValue: parseFloat(form.discountValue) || 0,
      minOrderAmount: parseFloat(form.minOrderAmount) || 0,
      maxDiscount: parseFloat(form.maxDiscount) || 0,
      usageLimit: parseInt(form.usageLimit, 10) || 0,
      perUserLimit: parseInt(form.perUserLimit, 10) || 1,
      startDate: form.startDate ? new Date(form.startDate) : undefined,
      expiryDate: form.expiryDate ? new Date(form.expiryDate) : undefined,
      active: form.active,
    };
    try {
      if (coupon) {
        await api.put(`/coupons/${coupon._id}`, payload);
      } else {
        await api.post("/coupons", payload);
      }
      await onSaved();
    } catch (err) {
      setError(err.message || "Could not save coupon");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <form
        onSubmit={submit}
        className="daha-form mt-4 w-full max-w-lg rounded-2xl bg-surface p-5 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg text-onsurface">
            {coupon ? "Edit Coupon" : "New Coupon"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-container"
          >
            <MaterialIcon name="close" size={20} />
          </button>
        </div>

        {error && (
          <p className="mb-3 rounded bg-errorcontainer px-3 py-2 text-sm text-onerrorcontainer">
            {error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-onsurface-variant">Code *</label>
            <input
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              required
              placeholder="e.g. DAHA10"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-onsurface-variant">Description</label>
            <input
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-onsurface-variant">Type</label>
            <select
              value={form.discountType}
              onChange={(e) => set("discountType", e.target.value)}
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed (₹)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-onsurface-variant">Value *</label>
            <input
              type="number"
              value={form.discountValue}
              onChange={(e) => set("discountValue", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-onsurface-variant">Min order (₹)</label>
            <input
              type="number"
              value={form.minOrderAmount}
              onChange={(e) => set("minOrderAmount", e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-onsurface-variant">Max discount (₹)</label>
            <input
              type="number"
              value={form.maxDiscount}
              onChange={(e) => set("maxDiscount", e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-onsurface-variant">Usage limit</label>
            <input
              type="number"
              value={form.usageLimit}
              onChange={(e) => set("usageLimit", e.target.value)}
              placeholder="0 = unlimited"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-onsurface-variant">Per-user limit</label>
            <input
              type="number"
              value={form.perUserLimit}
              onChange={(e) => set("perUserLimit", e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-onsurface-variant">Start date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-onsurface-variant">Expiry date *</label>
            <input
              type="date"
              value={form.expiryDate}
              onChange={(e) => set("expiryDate", e.target.value)}
              required
            />
          </div>
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm text-onsurface">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => set("active", e.target.checked)}
          />
          Active
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-5 py-2.5 text-sm font-medium text-onsurface ring-1 ring-hairline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded bg-primary px-6 py-2.5 text-sm font-semibold text-onprimary disabled:opacity-60"
          >
            {busy ? "Saving…" : coupon ? "Save Changes" : "Create Coupon"}
          </button>
        </div>
      </form>
    </div>
  );
}