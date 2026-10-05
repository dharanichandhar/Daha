import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "~/lib/api";
import { MaterialIcon } from "~/components/MaterialIcon";
import { useToastStore } from "~/store/useToastStore";

const EMPTY = {
  title: "",
  subtitle: "",
  imageUrl: "",
  ctaLabel: "",
  ctaUrl: "",
  displayOrder: "0",
  active: true,
};

export function BannersTab() {
  const { data, refetch } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: () => api.get("/banners/admin/all"),
    retry: false,
  });
  const banners = data?.banners || [];
  const [showForm, setShowForm] = useState(false);
  const pushToast = useToastStore((state) => state.push);
  const [editing, setEditing] = useState(null);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (b) => {
    setEditing(b);
    setShowForm(true);
  };

  const remove = async (b) => {
    if (!confirm(`Delete banner "${b.title}"?`)) return;
    try {
      await api.del(`/banners/${b._id}`);
      await refetch();
      pushToast("Banner deleted.", "success");
    } catch (e) {
      pushToast(e.message || "Could not delete banner.", "error");
    }
  };

  const toggle = async (b) => {
    try {
      await api.put(`/banners/${b._id}`, { active: !b.active });
      await refetch();
      pushToast("Banner updated.", "success");
    } catch (e) {
      pushToast(e.message || "Could not update banner.", "error");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-onsurface">Banners ({banners.length})</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-1 rounded bg-primary px-4 py-2 text-sm font-semibold text-onprimary shadow-sm"
        >
          <MaterialIcon name="add" size={18} /> New Banner
        </button>
      </div>

      {banners.length === 0 && (
        <p className="py-8 text-center text-sm text-onsurface-variant">
          No banners. Add a promotion banner.
        </p>
      )}

      <div className="mt-3 space-y-2">
        {banners.map((b) => {
          const imgUrl = b.image?.url || b.image?.secureUrl || "";
          return (
            <div
              key={b._id}
              className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3 shadow-sm"
            >
              <div className="relative w-24 shrink-0 overflow-hidden rounded-lg bg-surface-container">
                {imgUrl ? (
                  <img src={imgUrl} alt={b.title} className="aspect-video w-full object-cover" />
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center text-onsurface-variant">
                    <MaterialIcon name="image" size={24} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-onsurface">{b.title}</p>
                <p className="truncate text-xs text-onsurface-variant">
                  {b.subtitle || "—"} · order {b.displayOrder}
                  {b.ctaUrl ? ` · ${b.ctaUrl}` : ""}
                </p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${
                    b.active ? "bg-[#e8f5e9] text-[#2E7D32]" : "bg-surface-container text-onsurface-variant"
                  }`}
                >
                  {b.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => toggle(b)}
                  className="flex h-8 w-8 items-center justify-center rounded text-onsurface hover:bg-surface"
                  aria-label="Toggle active"
                >
                  <MaterialIcon name={b.active ? "toggle_on" : "toggle_off"} size={20} />
                </button>
                <button
                  onClick={() => openEdit(b)}
                  className="flex h-8 w-8 items-center justify-center rounded text-onsurface hover:bg-surface"
                  aria-label="Edit"
                >
                  <MaterialIcon name="edit" size={18} />
                </button>
                <button
                  onClick={() => remove(b)}
                  className="flex h-8 w-8 items-center justify-center rounded text-onsurface hover:bg-errorcontainer"
                  aria-label="Delete"
                >
                  <MaterialIcon name="delete_outline" size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <BannerForm
          banner={editing}
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

function BannerForm({ banner, onClose, onSaved }) {
  const [form, setForm] = useState(() =>
    banner
      ? {
          title: banner.title,
          subtitle: banner.subtitle || "",
          imageUrl: banner.image?.url || banner.image?.secureUrl || "",
          ctaLabel: banner.ctaLabel || "",
          ctaUrl: banner.ctaUrl || "",
          displayOrder: (banner.displayOrder || 0).toString(),
          active: banner.active ?? true,
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
      title: form.title,
      subtitle: form.subtitle,
      image: {
        url: form.imageUrl,
        secureUrl: form.imageUrl,
        publicId: "",
      },
      ctaLabel: form.ctaLabel,
      ctaUrl: form.ctaUrl,
      displayOrder: parseInt(form.displayOrder, 10) || 0,
      active: form.active,
    };
    try {
      if (banner) {
        await api.put(`/banners/${banner._id}`, payload);
      } else {
        await api.post("/banners", payload);
      }
      await onSaved();
    } catch (err) {
      setError(err.message || "Could not save banner");
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
            {banner ? "Edit Banner" : "New Banner"}
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
            <label className="mb-1 block text-xs font-medium text-onsurface-variant">Title *</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} required />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-onsurface-variant">Subtitle</label>
            <input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-onsurface-variant">Image URL</label>
            <input
              value={form.imageUrl}
              onChange={(e) => set("imageUrl", e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-onsurface-variant">CTA Label</label>
            <input value={form.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-onsurface-variant">CTA URL</label>
            <input value={form.ctaUrl} onChange={(e) => set("ctaUrl", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-onsurface-variant">Display order</label>
            <input
              type="number"
              value={form.displayOrder}
              onChange={(e) => set("displayOrder", e.target.value)}
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
            {busy ? "Saving…" : banner ? "Save Changes" : "Create Banner"}
          </button>
        </div>
      </form>
    </div>
  );
}