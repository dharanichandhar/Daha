import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "~/lib/api";
import { MaterialIcon } from "./MaterialIcon";

export function Footer() {
  const { data } = useQuery({
    queryKey: ["footer-settings"],
    queryFn: () => api.get("/settings"),
    enabled: typeof window !== "undefined",
    staleTime: 5 * 60 * 1000,
  });

  const settings = data?.settings || {};
  const instagram = settings.socialLinks?.instagram || "";
  const hasInstagram = instagram && !String(instagram).includes("YOUR_");

  return (
    <footer className="border-t border-hairline bg-surface-container-low px-4 pb-24 pt-9 text-onsurface md:pb-9">
      <div className="container-daha grid gap-7 px-0 md:grid-cols-[1.2fr_0.8fr_1fr]">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold tracking-[0.16em] text-primary">DAHA</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-onsurface-variant">Trichy</span>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-6 text-onsurface-variant">
            Clothing for men, women and kids with a simple online-to-WhatsApp ordering experience.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-bold text-onsurface">Quick Links</h2>
          <ul className="mt-3 space-y-2 text-sm text-onsurface-variant">
            <li><Link to="/" className="hover:text-primary">Home</Link></li>
            <li><Link to="/products" className="hover:text-primary">All Products</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold text-onsurface">Store</h2>
          <div className="mt-3 space-y-2 text-sm text-onsurface-variant">
            <p className="flex items-start gap-2">
              <MaterialIcon name="location_on" size={17} className="mt-0.5 text-primary" />
              <span>
                {settings.address && !String(settings.address).includes("YOUR_")
                  ? `${settings.address}, ${settings.city || "Trichy"}, ${settings.state || "Tamil Nadu"}`
                  : "Trichy, Tamil Nadu"}
              </span>
            </p>
            <p className="flex items-center gap-2">
              <MaterialIcon name="call" size={17} className="text-primary" />
              <span>{settings.phone || "YOUR_STORE_PHONE"}</span>
            </p>
            {hasInstagram && (
              <a href={instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-semibold text-primary">
                Instagram
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="container-daha mt-7 border-t border-hairline px-0 pt-4 text-xs text-onsurface-variant">
        © 2026 DAHA Clothing Store. All rights reserved.
      </div>
    </footer>
  );
}
