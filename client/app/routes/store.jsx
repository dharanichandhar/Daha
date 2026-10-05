import { useQuery } from "@tanstack/react-query";
import { api } from "~/lib/api";
import { MaterialIcon } from "~/components/MaterialIcon";

export default function Store() {
  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get("/settings"),
    retry: false,
  });
  const s = data?.settings || data?.data || {};

  const name = s.storeName || "DAHA Clothing Store";
  const tagline = s.tagline || "Style for Every Day, Right Here in Trichy.";
  const social = s.socialLinks || {};

  const rows = [];
  if (s.address) rows.push({ icon: "storefront", label: "Address", value: s.address });
  if (s.phone) rows.push({ icon: "call", label: "Phone / WhatsApp", value: s.phone });
  if (s.supportEmail) rows.push({ icon: "mail", label: "Email", value: s.supportEmail });
  if (social.instagram) rows.push({ icon: "photo_camera", label: "Instagram", value: social.instagram });

  return (
    <div className="container-daha py-8">
      <h1 className="font-display text-2xl text-onsurface">{name}</h1>
      <p className="mt-1 text-sm text-onsurface-variant">
        {tagline} Visit us in the heart of Trichy.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {rows.length === 0 && (
          <p className="text-sm text-onsurface-variant">
            Store contact details are being set up — please check back soon.
          </p>
        )}
        {rows.map((r) => (
          <div key={r.label} className="flex items-start gap-3 rounded-xl bg-surface-container-low p-4 shadow-sm">
            <MaterialIcon name={r.icon} size={22} className="mt-0.5 text-secondary" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-onsurface-variant">
                {r.label}
              </p>
              <p className="break-words text-sm text-onsurface">{r.value}</p>
            </div>
          </div>
        ))}
      </div>

      {s.shippingPolicy && (
        <div className="mt-6 rounded-xl bg-surface-container-low p-4 shadow-sm">
          <h2 className="font-display mb-1 text-lg text-onsurface">Shipping</h2>
          <p className="text-sm text-onsurface-variant">{s.shippingPolicy}</p>
        </div>
      )}

      {s.returnPolicy && (
        <div className="mt-3 rounded-xl bg-surface-container-low p-4 shadow-sm">
          <h2 className="font-display mb-1 text-lg text-onsurface">Returns</h2>
          <p className="text-sm text-onsurface-variant">{s.returnPolicy}</p>
        </div>
      )}

      <div className="mt-8 rounded-xl bg-primary p-6 text-onprimary">
        <h2 className="font-display text-lg">Shop online, confirm with DAHA on WhatsApp</h2>
        <p className="mt-1 text-sm opacity-90">
          Choose your products online, send the cart to the store, and confirm availability, pickup or delivery directly with DAHA.
        </p>
      </div>
    </div>
  );
}