import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "~/lib/api";
import { MaterialIcon } from "~/components/MaterialIcon";
import { useToastStore } from "~/store/useToastStore";

export function InventoryTab() {
  const { data, refetch } = useQuery({
    queryKey: ["admin-inventory"],
    queryFn: () => api.get("/admin/inventory?limit=200"),
    retry: false,
  });
  const inventory = data?.inventory || data?.data || [];
  const [adjust, setAdjust] = useState(null);
  const [busy, setBusy] = useState(false);
  const pushToast = useToastStore((state) => state.push);

  const saveAdjust = async () => {
    if (!adjust) return;
    setBusy(true);
    try {
      await api.put("/admin/inventory/adjust", {
        productId: adjust.productId,
        variantId: adjust.variantId,
        stock: parseInt(adjust.value, 10) || 0,
      });
      await refetch();
      setAdjust(null);
      pushToast("Inventory updated.", "success");
    } catch (e) {
      pushToast(e.message || "Could not adjust stock.", "error");
    } finally {
      setBusy(false);
    }
  };

  if (inventory.length === 0) {
    return <p className="py-8 text-center text-sm text-onsurface-variant">No inventory data.</p>;
  }

  return (
    <div className="space-y-2">
      {inventory.map((item) => {
        const productId = item.productId || "";
        const variantId = item.variantId || item._id || "";
        const status =
          item.stock === 0 ? "Out" : item.stock <= 3 ? "Low" : "In stock";
        const color =
          item.stock === 0
            ? "bg-errorcontainer text-onerrorcontainer"
            : item.stock <= 3
            ? "bg-[#fff3e0] text-[#E65100]"
            : "bg-[#e8f5e9] text-[#2E7D32]";
        const isAdjusting = adjust?.variantId === variantId;
        return (
          <div
            key={variantId}
            className="flex items-center justify-between gap-2 rounded-xl bg-surface-container-low p-3 shadow-sm"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-onsurface">
                {item.productName || item.name || item.sku || "—"}
              </p>
              <p className="text-xs text-onsurface-variant">
                {item.productSku || item.sku} · {item.color} · {item.size} · stock {item.stock}
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${color}`}>{status}</span>
            {isAdjusting ? (
              <div className="flex shrink-0 items-center gap-1">
                <input
                  type="number"
                  value={adjust.value}
                  onChange={(e) =>
                    setAdjust({ productId, variantId, value: e.target.value })
                  }
                  className="w-20 rounded border border-hairline bg-surface px-2 py-1 text-sm"
                />
                <button
                  disabled={busy}
                  onClick={saveAdjust}
                  className="rounded bg-primary px-2 py-1 text-xs font-semibold text-onprimary"
                >
                  Save
                </button>
                <button
                  onClick={() => setAdjust(null)}
                  className="rounded px-2 py-1 text-xs text-onsurface-variant"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAdjust({ productId, variantId, value: String(item.stock) })}
                className="flex shrink-0 items-center gap-1 rounded bg-surface px-2.5 py-1.5 text-xs text-onsurface ring-1 ring-hairline"
              >
                <MaterialIcon name="edit" size={14} /> Adjust
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}