import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "~/lib/api";
import { formatRupees } from "~/lib/format";
import { MaterialIcon } from "~/components/MaterialIcon";
import { useToastStore } from "~/store/useToastStore";

const EMPTY_FORM = {
  name: "",
  category: "",
  subcategory: "",
  sku: "",
  sellingPrice: "",
  mrpPrice: "",
  costPrice: "",
  publishStatus: "draft",
  shortDescription: "",
  fullDescription: "",
  material: "",
  fit: "",
  careInstructions: "",
  sizeGuide: "",
  isNew: false,
  isFeatured: false,
  isBestSeller: false,
};

export function ProductsTab() {
  const { data, refetch } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => api.get("/products/admin/all?limit=100"),
    retry: false,
  });
  const products = data?.products || data?.data || [];
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const pushToast = useToastStore((state) => state.push);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (p) => {
    setEditing(p);
    setShowForm(true);
  };

  const toggleArchive = async (p) => {
    try {
      await api.put(`/products/${p._id}/archive`);
      await refetch();
      pushToast(p.publishStatus === "archived" ? "Product restored." : "Product archived.", "success");
    } catch (e) {
      pushToast(e.message || "Could not update product.", "error");
    }
  };

  const remove = async (p) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await api.del(`/products/${p._id}`);
      await refetch();
      pushToast("Product deleted.", "success");
    } catch (e) {
      pushToast(e.message || "Could not delete product.", "error");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-onsurface">
          Products ({data?.pagination?.total ?? products.length})
        </h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-1 rounded bg-primary px-4 py-2 text-sm font-semibold text-onprimary shadow-sm"
        >
          <MaterialIcon name="add" size={18} /> Add Product
        </button>
      </div>

      {products.length === 0 && (
        <p className="py-8 text-center text-sm text-onsurface-variant">No products found.</p>
      )}

      <div className="mt-3 space-y-2">
        {products.map((p) => {
          const catName =
            typeof p.category === "object" && p.category ? p.category.name : p.category || "";
          return (
            <div
              key={p._id}
              className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3 shadow-sm"
            >
              {p.images?.[0]?.url && (
                <img src={p.images[0].url} alt="" className="h-14 w-12 rounded object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-onsurface">{p.name}</p>
                <p className="truncate text-xs text-onsurface-variant">
                  {catName} · {p.sku} · {formatRupees(p.sellingPrice)}
                  {p.variants?.length ? ` · ${p.variants.length} variants` : ""}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                  p.publishStatus === "active"
                    ? "bg-[#e8f5e9] text-[#2E7D32]"
                    : p.publishStatus === "archived"
                    ? "bg-surface-container text-onsurface-variant"
                    : "bg-[#fff8e1] text-[#F9A825]"
                }`}
              >
                {p.publishStatus}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => openEdit(p)}
                  className="flex h-8 w-8 items-center justify-center rounded text-onsurface hover:bg-surface"
                  aria-label="Edit"
                >
                  <MaterialIcon name="edit" size={18} />
                </button>
                <button
                  onClick={() => toggleArchive(p)}
                  className="flex h-8 w-8 items-center justify-center rounded text-onsurface hover:bg-surface"
                  aria-label={p.publishStatus === "archived" ? "Unarchive" : "Archive"}
                >
                  <MaterialIcon
                    name={p.publishStatus === "archived" ? "unarchive" : "archive"}
                    size={18}
                  />
                </button>
                <button
                  onClick={() => remove(p)}
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
        <ProductForm
          product={editing}
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

function ProductForm({ product, onClose, onSaved }) {
  const { data: catsData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories"),
    retry: false,
  });
  const categories = catsData?.categories || catsData?.data || [];

  const [form, setForm] = useState(() => {
    if (!product) return { ...EMPTY_FORM };
    return {
      name: product.name || "",
      category:
        typeof product.category === "object" && product.category
          ? product.category._id
          : product.category || "",
      subcategory: product.subcategory || "",
      sku: product.sku || "",
      sellingPrice: product.sellingPrice?.toString() || "",
      mrpPrice: product.mrpPrice?.toString() || "",
      costPrice: product.costPrice?.toString() || "",
      publishStatus: product.publishStatus || "draft",
      shortDescription: product.shortDescription || "",
      fullDescription: product.fullDescription || "",
      material: product.material || "",
      fit: product.fit || "",
      careInstructions: product.careInstructions || "",
      sizeGuide: product.sizeGuide || "",
      isNew: Boolean(product.isNew),
      isFeatured: Boolean(product.isFeatured),
      isBestSeller: Boolean(product.isBestSeller),
    };
  });

  const [variants, setVariants] = useState(
    product?.variants?.length
      ? product.variants.map((v) => ({
          color: v.color,
          colorHex: v.colorHex || "#000000",
          size: v.size,
          sku: v.sku,
          stock: v.stock,
          priceOverride: v.priceOverride || null,
          active: v.active,
        }))
      : [{ color: "", colorHex: "#3a1030", size: "", sku: "", stock: 0, priceOverride: null, active: true }]
  );

  const [images, setImages] = useState(
    product?.images?.length
      ? product.images.map((im) => ({
          url: im.secureUrl || im.url,
          secureUrl: im.secureUrl || im.url,
          publicId: im.publicId || "",
          alt: im.alt || "",
          sourceType: im.sourceType || (im.publicId ? "cloudinary" : "upload"),
        }))
      : []
  );

  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const pushToast = useToastStore((state) => state.push);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const uploadImages = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("image", file);
        const result = await api.post("/upload/image", fd);
        uploaded.push({
          url: result.secureUrl || result.url,
          secureUrl: result.secureUrl || result.url,
          publicId: result.publicId || "",
          alt: form.name ? `${form.name} - DAHA Clothing Store` : file.name,
          sourceType: "cloudinary",
        });
      }
      setImages((current) => [...current, ...uploaded]);
      pushToast(`${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded.`, "success");
    } catch (err) {
      pushToast(err.message || "Image upload failed.", "error");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const payload = {
      name: form.name,
      category: form.category,
      subcategory: form.subcategory,
      sku: form.sku,
      sellingPrice: parseFloat(form.sellingPrice) || 0,
      mrpPrice: parseFloat(form.mrpPrice) || 0,
      costPrice: form.costPrice ? parseFloat(form.costPrice) : 0,
      publishStatus: form.publishStatus,
      shortDescription: form.shortDescription,
      fullDescription: form.fullDescription,
      material: form.material,
      fit: form.fit,
      careInstructions: form.careInstructions,
      sizeGuide: form.sizeGuide,
      isNew: form.isNew,
      isFeatured: form.isFeatured,
      isBestSeller: form.isBestSeller,
      images: images
        .filter((i) => i.url)
        .map((i, idx) => ({
          url: i.url,
          secureUrl: i.secureUrl || i.url,
          publicId: i.publicId || "",
          alt: i.alt,
          sortOrder: idx,
          sourceType: i.sourceType || (i.publicId ? "cloudinary" : "upload"),
        })),
      variants: variants
        .filter((v) => v.color && v.size)
        .map((v) => ({
          color: v.color,
          colorHex: v.colorHex,
          size: v.size,
          sku: v.sku || `${form.sku}-${v.color.substring(0, 3).toUpperCase()}-${v.size}`,
          stock: Number(v.stock) || 0,
          priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
          active: v.active,
        })),
    };
    try {
      if (product) {
        await api.put(`/products/${product._id}`, payload);
      } else {
        await api.post("/products", payload);
      }
      pushToast(product ? "Product updated." : "Product created.", "success");
      await onSaved();
    } catch (err) {
      const message = err.message || "Could not save product";
      setError(message);
      pushToast(message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <form
        onSubmit={submit}
        className="daha-form mt-4 w-full max-w-2xl rounded-2xl bg-surface p-5 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg text-onsurface">
            {product ? "Edit Product" : "Add Product"}
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
          <Field label="Name *" className="col-span-2">
            <input value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </Field>
          <Field label="Category *">
            <select value={form.category} onChange={(e) => set("category", e.target.value)} required>
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Subcategory">
            <input value={form.subcategory} onChange={(e) => set("subcategory", e.target.value)} />
          </Field>
          <Field label="SKU *">
            <input
              value={form.sku}
              onChange={(e) => set("sku", e.target.value)}
              required
              disabled={!!product?.seedSource}
            />
          </Field>
          <Field label="Publish Status">
            <select value={form.publishStatus} onChange={(e) => set("publishStatus", e.target.value)}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
          <Field label="Selling Price (₹) *">
            <input
              type="number"
              value={form.sellingPrice}
              onChange={(e) => set("sellingPrice", e.target.value)}
              required
            />
          </Field>
          <Field label="MRP (₹) *">
            <input
              type="number"
              value={form.mrpPrice}
              onChange={(e) => set("mrpPrice", e.target.value)}
              required
            />
          </Field>
          <Field label="Cost Price (₹)">
            <input
              type="number"
              value={form.costPrice}
              onChange={(e) => set("costPrice", e.target.value)}
            />
          </Field>
          <Field label="Material">
            <input value={form.material} onChange={(e) => set("material", e.target.value)} />
          </Field>
          <Field label="Fit">
            <input value={form.fit} onChange={(e) => set("fit", e.target.value)} />
          </Field>
          <Field label="Short Description" className="col-span-2">
            <textarea
              rows={2}
              value={form.shortDescription}
              onChange={(e) => set("shortDescription", e.target.value)}
            />
          </Field>
          <Field label="Full Description" className="col-span-2">
            <textarea
              rows={3}
              value={form.fullDescription}
              onChange={(e) => set("fullDescription", e.target.value)}
            />
          </Field>
          <Field label="Care Instructions" className="col-span-2">
            <textarea
              rows={2}
              value={form.careInstructions}
              onChange={(e) => set("careInstructions", e.target.value)}
            />
          </Field>
          <Field label="Size Guide" className="col-span-2">
            <textarea
              rows={2}
              value={form.sizeGuide}
              onChange={(e) => set("sizeGuide", e.target.value)}
            />
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          {[
            ["isNew", "New"],
            ["isFeatured", "Featured"],
            ["isBestSeller", "Best Seller"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-onsurface">
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => set(key, e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-onsurface">Product Images</p>
              <p className="text-xs text-onsurface-variant">Upload real product photos to Cloudinary.</p>
            </div>
            <label className="cursor-pointer rounded-lg bg-surface-container px-3 py-2 text-xs font-bold text-primary ring-1 ring-hairline">
              {uploading ? "Uploading..." : "Upload Images"}
              <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={uploadImages} />
            </label>
          </div>
          {images.length === 0 ? (
            <div className="rounded-lg border border-dashed border-hairline p-5 text-center text-xs text-onsurface-variant">
              No images yet. Upload at least one clear product image.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {images.map((img, i) => (
                <div key={`${img.url}-${i}`} className="rounded-lg bg-surface-container-low p-2">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-surface-container">
                    <img src={img.url} alt={img.alt || form.name || "Product"} className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setImages(images.filter((_, ri) => ri !== i))} className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-surface/90 text-onsurface shadow-sm" aria-label="Remove image">
                      <MaterialIcon name="close" size={16} />
                    </button>
                  </div>
                  <input value={img.alt || ""} onChange={(e) => setImages(images.map((row, ri) => (ri === i ? { ...row, alt: e.target.value } : row)))} placeholder="Image alt text" className="mt-2 w-full" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-bold text-onsurface">Variants</p>
          {variants.map((v, i) => (
            <div key={i} className="mb-2 grid grid-cols-6 gap-2">
              <input
                value={v.color}
                onChange={(e) =>
                  setVariants(variants.map((r, ri) => (ri === i ? { ...r, color: e.target.value } : r)))
                }
                placeholder="Color"
              />
              <input
                type="color"
                value={v.colorHex}
                onChange={(e) =>
                  setVariants(variants.map((r, ri) => (ri === i ? { ...r, colorHex: e.target.value } : r)))
                }
                className="p-1"
              />
              <input
                value={v.size}
                onChange={(e) =>
                  setVariants(variants.map((r, ri) => (ri === i ? { ...r, size: e.target.value } : r)))
                }
                placeholder="Size"
              />
              <input
                value={v.sku}
                onChange={(e) =>
                  setVariants(variants.map((r, ri) => (ri === i ? { ...r, sku: e.target.value } : r)))
                }
                placeholder="Variant SKU"
              />
              <input
                type="number"
                value={v.stock}
                onChange={(e) =>
                  setVariants(variants.map((r, ri) => (ri === i ? { ...r, stock: Number(e.target.value) } : r)))
                }
                placeholder="Stock"
              />
              {variants.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setVariants(variants.filter((_, ri) => ri !== i))}
                  className="text-onsurface-variant"
                >
                  <MaterialIcon name="close" size={18} />
                </button>
              ) : (
                <span />
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setVariants([
                ...variants,
                { color: "", colorHex: "#3a1030", size: "", sku: "", stock: 0, priceOverride: null, active: true },
              ])
            }
            className="text-sm text-primary"
          >
            + Add variant
          </button>
          <p className="mt-2 text-xs text-onsurface-variant">
            Order: Color · Hex · Size · Variant SKU · Stock
          </p>
        </div>

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
            {busy ? "Saving…" : product ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-onsurface-variant">{label}</label>
      {children}
    </div>
  );
}