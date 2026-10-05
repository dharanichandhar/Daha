import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "~/lib/api";
import { MaterialIcon } from "~/components/MaterialIcon";
import { useToastStore } from "~/store/useToastStore";

const EMPTY = {
  name: "",
  description: "",
  imageUrl: "",
  imageAlt: "",
  displayOrder: "0",
  parentCategory: "",
  active: true,
  seoTitle: "",
  seoDescription: "",
};

export function CategoriesTab() {
  const { data, refetch } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api.get("/categories/admin/all"),
    retry: false,
  });
  const categories = data?.categories || [];
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const pushToast = useToastStore((state) => state.push);

  const toggleActive = async (c) => {
    try {
      await api.put(`/categories/${c._id}`, { active: !c.active });
      await refetch();
      pushToast(c.active ? "Category deactivated." : "Category activated.", "success");
    } catch (e) {
      pushToast(e.message || "Could not update category.", "error");
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    try {
      await api.del(`/categories/${c._id}`);
      await refetch();
      pushToast("Category deleted.", "success");
    } catch (e) {
      pushToast(e.message || "Could not delete category.", "error");
    }
  };

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg text-onsurface">
            Categories ({categories.filter((c) => c.active).length} active)
          </h2>
          <p className="text-xs text-onsurface-variant">
            Shown in the store navigation automatically. Deactivate instead of deleting when a category has products.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1 rounded bg-primary px-4 py-2 text-sm font-semibold text-onprimary shadow-sm"
        >
          <MaterialIcon name="add" size={18} /> New Category
        </button>
      </div>

      {categories.length === 0 && (
        <p className="py-8 text-center text-sm text-onsurface-variant">No categories yet.</p>
      )}

      <div className="mt-3 space-y-2">
        {categories.map((c) => (
          <div
            key={c._id}
            className="flex items-center justify-between gap-2 rounded-xl bg-surface-container-low p-3 shadow-sm"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {c.image?.url && (
                <img src={c.image.url} alt={c.image.alt || ""} className="h-12 w-10 rounded object-cover" />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-bold text-onsurface">{c.name}</span>
                  {!c.active && (
                    <span className="rounded bg-surface-container px-2 py-0.5 text-xs text-onsurface-variant">
                      inactive
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-onsurface-variant">
                  /category/{c.slug} · Order {c.displayOrder}
                  {c.seo?.title ? " · SEO set" : ""}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => toggleActive(c)}
                className="flex h-8 w-8 items-center justify-center rounded text-onsurface hover:bg-surface"
                aria-label="Toggle active"
              >
                <MaterialIcon name={c.active ? "toggle_on" : "toggle_off"} size={20} className={c.active ? "text-secondary" : ""} />
              </button>
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
        <CategoryForm
          category={editing}
          categories={categories}
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

function CategoryForm({ category, categories, onClose, onSaved }) {
  const [form, setForm] = useState(() =>
    category
      ? {
          name: category.name,
          description: category.description || "",
          imageUrl: category.image?.url || "",
          imageAlt: category.image?.alt || "",
          displayOrder: (category.displayOrder ?? 0).toString(),
          parentCategory: category.parentCategory || "",
          active: category.active ?? true,
          seoTitle: category.seo?.title || "",
          seoDescription: category.seo?.description || "",
        }
      : { ...EMPTY }
  );
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const pushToast = useToastStore((state) => state.push);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await api.post("/upload/image", fd);
      set("imageUrl", res.secureUrl || res.url || "");
    } catch (err) {
      pushToast(err.message || "Upload failed.", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const payload = {
      ...(category ? { active: form.active, displayOrder: parseInt(form.displayOrder, 10) || 0 } : { displayOrder: parseInt(form.displayOrder, 10) || 0 }),
      name: form.name,
      description: form.description,
      image: {
        url: form.imageUrl,
        secureUrl: form.imageUrl,
        publicId: "",
        alt: form.imageAlt,
      },
      parentCategory: form.parentCategory || null,
      seo: { title: form.seoTitle, description: form.seoDescription },
    };
    try {
      if (category) {
        await api.put(`/categories/${category._id}`, payload);
      } else {
        await api.post("/categories", payload);
      }
      pushToast(category ? "Category updated." : "Category created.", "success");
      await onSaved();
    } catch (err) {
      const message = err.message || "Could not save category";
      setError(message);
      pushToast(message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <form onSubmit={submit} className="daha-form mt-4 w-full max-w-lg rounded-2xl bg-surface p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg text-onsurface">
            {category ? "Edit Category" : "New Category"}
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
          <p className="mb-3 rounded bg-errorcontainer px-3 py-2 text-sm text-onerrorcontainer">{error}</p>
        )}

        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-onsurface-variant">Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-onsurface-variant">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              className="daha-input w-full resize-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-onsurface-variant">Image URL</label>
            <div className="flex flex-col gap-2">
              <input
                value={form.imageUrl}
                onChange={(e) => set("imageUrl", e.target.value)}
                placeholder="https://…"
                className="w-full"
              />
              <label className="flex cursor-pointer items-center justify-center gap-1 rounded bg-surface-container-high px-3 py-2 text-sm font-medium text-onsurface hover:bg-surface-container-highest">
                <MaterialIcon name="cloud_upload" size={16} />
                {uploading ? "Uploading…" : "Upload image to Cloudinary"}
                <input type="file" accept="image/*" onChange={uploadImage} className="hidden" disabled={uploading} />
              </label>
              {form.imageUrl && (
                <img src={form.imageUrl} alt="" className="h-20 w-16 rounded border border-hairline object-cover" />
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-onsurface-variant">Image Alt Text</label>
            <input
              value={form.imageAlt}
              onChange={(e) => set("imageAlt", e.target.value)}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-onsurface-variant">Display Order</label>
              <input
                type="number"
                value={form.displayOrder}
                onChange={(e) => set("displayOrder", e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-onsurface-variant">Parent Category</label>
              <select
                value={form.parentCategory || ""}
                onChange={(e) => set("parentCategory", e.target.value)}
                className="w-full"
              >
                <option value="">None (Main)</option>
                {categories
                  .filter((c) => !category || c._id !== category._id)
                  .map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-onsurface-variant">SEO Title</label>
            <input
              value={form.seoTitle}
              onChange={(e) => set("seoTitle", e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-onsurface-variant">SEO Description</label>
            <textarea
              value={form.seoDescription}
              onChange={(e) => set("seoDescription", e.target.value)}
              rows={2}
              className="daha-input w-full resize-none"
            />
          </div>

          {category && (
            <label className="flex cursor-pointer items-center gap-2 rounded bg-surface-container px-3 py-2 text-sm text-onsurface">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => set("active", e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Active (shown in store navigation)
            </label>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-1 flex items-center justify-center gap-2 rounded bg-primary py-3 text-sm font-semibold text-onprimary shadow-md disabled:opacity-60"
          >
            <MaterialIcon name="save" size={18} />
            {busy ? "Saving…" : category ? "Save Changes" : "Create Category"}
          </button>
        </div>
      </form>
    </div>
  );
}