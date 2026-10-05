import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "~/lib/api";
import { MaterialIcon } from "~/components/MaterialIcon";
import { useToastStore } from "~/store/useToastStore";

export function SettingsTab() {
  const { data, refetch } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get("/settings"),
    retry: false,
  });
  const settings = data?.settings || data?.data || {};
  const [busy, setBusy] = useState(false);
  const pushToast = useToastStore((state) => state.push);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState(() => ({
    storeName: settings.storeName || "",
    tagline: settings.tagline || "",
    address: settings.address || "",
    city: settings.city || "Trichy",
    state: settings.state || "Tamil Nadu",
    pin: settings.pin || "",
    country: settings.country || "India",
    phone: settings.phone || "",
    whatsappNumber: settings.whatsappNumber || settings.socialLinks?.whatsapp || "",
    googleMapsUrl: settings.googleMapsUrl || settings.socialLinks?.googleMaps || "",
    googleMapsEmbedUrl: settings.googleMapsEmbedUrl || "",
    latitude: settings.latitude?.toString() || "",
    longitude: settings.longitude?.toString() || "",
    supportEmail: settings.supportEmail || "",
    businessEmail: settings.businessEmail || "",
    businessHours: settings.businessHours || "",
    shippingCharge: settings.shippingCharge || 0,
    freeShippingThreshold: settings.freeShippingThreshold || 999,
    lowStockThreshold: settings.lowStockThreshold || 3,
    shippingPolicy: settings.shippingPolicy || "",
    returnPolicy: settings.returnPolicy || "",
    instagram: settings.socialLinks?.instagram || "",
    facebook: settings.socialLinks?.facebook || "",
    seoTitle: settings.seoDefaults?.title || "",
    seoDescription: settings.seoDefaults?.description || "",
  }));

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    setBusy(true);
    const payload = {
      storeName: form.storeName,
      tagline: form.tagline,
      address: form.address,
      city: form.city,
      state: form.state,
      pin: form.pin,
      country: form.country,
      phone: form.phone,
      whatsappNumber: form.whatsappNumber,
      googleMapsUrl: form.googleMapsUrl,
      googleMapsEmbedUrl: form.googleMapsEmbedUrl,
      latitude: form.latitude ? Number(form.latitude) : undefined,
      longitude: form.longitude ? Number(form.longitude) : undefined,
      supportEmail: form.supportEmail,
      businessEmail: form.businessEmail,
      businessHours: form.businessHours,
      shippingCharge: Number(form.shippingCharge) || 0,
      freeShippingThreshold: Number(form.freeShippingThreshold) || 0,
      lowStockThreshold: Number(form.lowStockThreshold) || 0,
      shippingPolicy: form.shippingPolicy,
      returnPolicy: form.returnPolicy,
      socialLinks: {
        instagram: form.instagram,
        facebook: form.facebook,
        whatsapp: form.whatsappNumber,
        googleMaps: form.googleMapsUrl,
      },
      seoDefaults: {
        title: form.seoTitle,
        description: form.seoDescription,
      },
    };
    try {
      await api.put("/settings", payload);
      setSaved(true);
      pushToast("Store settings saved.", "success");
      await refetch();
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      const message = err.message || "Could not save settings";
      setError(message);
      pushToast(message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-lg text-onsurface">Store Settings</h2>
      <form onSubmit={submit} className="daha-form mt-3 flex flex-col gap-4">
        {error && (
          <p className="rounded bg-errorcontainer px-3 py-2 text-sm text-onerrorcontainer">{error}</p>
        )}
        {saved && (
          <p className="rounded bg-[#e8f5e9] px-3 py-2 text-sm text-[#2E7D32]">
            Settings saved successfully.
          </p>
        )}

        <Section title="Store Identity">
          <div className="grid grid-cols-2 gap-3">
            <F label="Store name">
              <input value={form.storeName} onChange={(e) => set("storeName", e.target.value)} />
            </F>
            <F label="Tagline">
              <input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
            </F>
            <F label="Support email" className="col-span-2">
              <input value={form.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} />
            </F>
            <F label="Business email">
              <input value={form.businessEmail} onChange={(e) => set("businessEmail", e.target.value)} />
            </F>
            <F label="Phone">
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </F>
            <F label="Address" className="col-span-2">
              <input value={form.address} onChange={(e) => set("address", e.target.value)} />
            </F>
            <F label="Business hours">
              <input value={form.businessHours} onChange={(e) => set("businessHours", e.target.value)} />
            </F>
          </div>
        </Section>

        <Section title="Location & Contact">
          <div className="grid grid-cols-3 gap-3">
            <F label="City">
              <input value={form.city} onChange={(e) => set("city", e.target.value)} />
            </F>
            <F label="State">
              <input value={form.state} onChange={(e) => set("state", e.target.value)} />
            </F>
            <F label="PIN code">
              <input value={form.pin} onChange={(e) => set("pin", e.target.value)} />
            </F>
            <F label="WhatsApp number" className="col-span-3">
              <input value={form.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} />
            </F>
            <F label="Google Maps URL (Get Directions)" className="col-span-3">
              <input value={form.googleMapsUrl} onChange={(e) => set("googleMapsUrl", e.target.value)} />
            </F>
            <F label="Google Maps Embed URL (iframe src)" className="col-span-3">
              <input value={form.googleMapsEmbedUrl} onChange={(e) => set("googleMapsEmbedUrl", e.target.value)} />
            </F>
            <F label="Latitude (optional)">
              <input value={form.latitude} onChange={(e) => set("latitude", e.target.value)} />
            </F>
            <F label="Longitude (optional)">
              <input value={form.longitude} onChange={(e) => set("longitude", e.target.value)} />
            </F>
          </div>
        </Section>

        <Section title="Shipping & Stock">
          <div className="grid grid-cols-3 gap-3">
            <F label="Shipping charge (₹)">
              <input
                type="number"
                value={form.shippingCharge}
                onChange={(e) => set("shippingCharge", e.target.value)}
              />
            </F>
            <F label="Free shipping over (₹)">
              <input
                type="number"
                value={form.freeShippingThreshold}
                onChange={(e) => set("freeShippingThreshold", e.target.value)}
              />
            </F>
            <F label="Low stock threshold">
              <input
                type="number"
                value={form.lowStockThreshold}
                onChange={(e) => set("lowStockThreshold", e.target.value)}
              />
            </F>
            <F label="Shipping policy" className="col-span-3">
              <textarea
                rows={2}
                value={form.shippingPolicy}
                onChange={(e) => set("shippingPolicy", e.target.value)}
              />
            </F>
            <F label="Return policy" className="col-span-3">
              <textarea
                rows={2}
                value={form.returnPolicy}
                onChange={(e) => set("returnPolicy", e.target.value)}
              />
            </F>
          </div>
        </Section>

        <Section title="Social Links">
          <div className="grid grid-cols-2 gap-3">
            <F label="Instagram">
              <input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} />
            </F>
            <F label="Facebook">
              <input value={form.facebook} onChange={(e) => set("facebook", e.target.value)} />
            </F>
          </div>
        </Section>

        <Section title="SEO Defaults">
          <div className="grid grid-cols-1 gap-3">
            <F label="Default title">
              <input value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} />
            </F>
            <F label="Default description">
              <textarea
                rows={2}
                value={form.seoDescription}
                onChange={(e) => set("seoDescription", e.target.value)}
              />
            </F>
          </div>
        </Section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={busy}
            className="flex items-center gap-2 rounded bg-primary px-6 py-2.5 text-sm font-semibold text-onprimary disabled:opacity-60"
          >
            <MaterialIcon name="save" size={18} />
            {busy ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl bg-surface-container-low p-4 shadow-sm">
      <p className="mb-3 text-sm font-bold text-onsurface">{title}</p>
      {children}
    </div>
  );
}

function F({ label, children, className = "" }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-onsurface-variant">{label}</label>
      {children}
    </div>
  );
}