import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { api } from "~/lib/api";
import { ProductCard } from "~/components/ProductCard";
import { MaterialIcon } from "~/components/MaterialIcon";

const HERO_IMG =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=85";
const ABOUT_IMG =
  "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=82";
const CATEGORY_BACKGROUNDS = ["#fbf0e4", "#edf8f1", "#f8edf4", "#eef3fb", "#fff6d9", "#f3effb"];
const LOCAL_BUSINESS = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  name: "DAHA Clothing Store",
  addressLocality: "Trichy",
  addressRegion: "Tamil Nadu",
  addressCountry: "IN",
  areaServed: "Trichy, Tamil Nadu",
  image: HERO_IMG,
};

export function meta() {
  return [
    { title: "DAHA Clothing Store Trichy | Men, Women & Kids Fashion" },
    {
      name: "description",
      content:
        "Explore clothing for men, women and kids at DAHA Clothing Store in Trichy. Browse new arrivals, everyday styles and shop through WhatsApp.",
    },
  ];
}

function useCategories() {
  return useQuery({
    queryKey: ["home-categories"],
    queryFn: () => api.get("/categories"),
  });
}

function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get("/settings"),
  });
}

function useHomeProducts(category) {
  const query = new URLSearchParams({ limit: "15", page: "1", sort: "newest" });
  if (category) query.set("category", category);

  return useQuery({
    queryKey: ["home-products", category || "all"],
    queryFn: () => api.get(`/products?${query.toString()}`),
  });
}

export default function Home() {
  const categoriesQuery = useCategories();
  const settingsQuery = useSettings();
  const [activeCategory, setActiveCategory] = useState("");
  const productsQuery = useHomeProducts(activeCategory);

  const settings = settingsQuery.data?.settings || {};
  const categories = (categoriesQuery.data?.categories || categoriesQuery.data || []).filter(
    (category) => category.active !== false
  );
  const products = productsQuery.data?.products || [];

  const categoryCards = useMemo(
    () =>
      categories.slice(0, 7).map((category, index) => ({
        ...category,
        href: `/category/${category.slug}`,
        imageUrl: category.image?.url || category.image?.secureUrl || "",
        icon: category.image?.url || category.image?.secureUrl ? "" : "checkroom",
        background: CATEGORY_BACKGROUNDS[index % CATEGORY_BACKGROUNDS.length],
      })),
    [categories]
  );

  const mapUrl = useMemo(() => {
    if (settings.googleMapsEmbedUrl) return settings.googleMapsEmbedUrl;
    const address = [settings.address, settings.city, settings.state, settings.pin]
      .filter(Boolean)
      .join(", ");
    if (!address || address.includes("YOUR_")) return "";
    return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
  }, [settings]);

  const whatsappNumber = String(
    settings.whatsappNumber || settings.socialLinks?.whatsapp || ""
  ).replace(/[^0-9]/g, "");
  const hasWhatsApp = whatsappNumber && !String(settings.whatsappNumber || "").includes("YOUR_");
  const hasMaps = settings.googleMapsUrl && !String(settings.googleMapsUrl).includes("YOUR_");

  return (
    <div className="bg-surface">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_BUSINESS) }}
      />
      {/* Hero inspired by the supplied clean banner reference */}
      <section className="container-daha py-5 md:py-8">
        <div className="relative overflow-hidden rounded-2xl bg-[#101010] shadow-[0_12px_36px_rgba(0,0,0,0.10)]">
          <div className="grid min-h-[430px] md:grid-cols-[0.9fr_1.1fr] lg:min-h-[470px]">
            <div className="relative z-10 flex flex-col justify-center px-6 py-10 text-white sm:px-10 lg:px-16">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#e7c7da]">
                DAHA Clothing Store · Trichy
              </p>
              <h1 className="max-w-lg text-4xl font-extrabold leading-[1.08] tracking-[-0.02em] sm:text-5xl">
                Everyday Style,
                <br />
                Made Easy.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/75 sm:text-base">
                Explore fresh clothing for men, women and kids. Pick your style,
                choose the right size and send your order directly to DAHA on WhatsApp.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  to="/products"
                  className="rounded-lg bg-primary px-6 py-3 text-sm font-bold text-onprimary transition-transform hover:-translate-y-0.5"
                >
                  Shop Now
                </Link>
                <a
                  href="#categories"
                  className="inline-flex items-center gap-2 px-2 py-3 text-sm font-bold text-white transition-colors hover:text-[#e7c7da]"
                >
                  Explore Categories
                  <MaterialIcon name="arrow_forward" size={18} />
                </a>
              </div>
            </div>

            <div className="relative min-h-[300px] overflow-hidden md:min-h-full">
              <img
                src={HERO_IMG}
                alt="Fashion collection at DAHA Clothing Store"
                className="absolute inset-0 h-full w-full object-cover object-center"
                fetchPriority="high"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#101010] via-[#101010]/20 to-transparent md:from-[#101010] md:via-[#101010]/15" />
            </div>
          </div>
        </div>
      </section>

      {/* Category rail */}
      <section id="categories" className="container-daha py-5 md:py-7">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-onsurface">Categories</h2>
            <p className="mt-1 text-sm text-onsurface-variant">Find your collection quickly.</p>
          </div>
        </div>

        {categoryCards.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7">
            {categoryCards.map((category) => (
              <Link
                key={category.slug}
                to={category.href}
                className="group flex min-w-0 flex-col items-center justify-between overflow-hidden rounded-2xl border border-black/[0.03] p-3 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                style={{ backgroundColor: category.background }}
              >
                <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl">
                  {category.imageUrl ? (
                    <img
                      src={category.imageUrl}
                      alt={`${category.name} clothing collection`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-sm">
                      <MaterialIcon name="checkroom" size={34} />
                    </div>
                  )}
                </div>
                <span className="mt-3 line-clamp-1 text-sm font-semibold text-onsurface">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-surface-container-low px-5 py-8 text-center">
            <MaterialIcon name="category" size={30} className="mx-auto text-outline" />
            <p className="mt-2 text-sm font-semibold text-onsurface">Collections are being prepared.</p>
            <p className="mt-1 text-xs text-onsurface-variant">Categories will appear here after they are added in the Admin Panel.</p>
          </div>
        )}
      </section>

      {/* 15-product home catalogue */}
      <section className="container-daha py-7 md:py-10">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">Shop DAHA</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.02em] text-onsurface">All Products</h2>
            <p className="mt-1 text-sm text-onsurface-variant">Showing up to 15 styles at a time.</p>
          </div>
          <Link to={activeCategory ? `/category/${activeCategory}` : "/products"} className="inline-flex items-center gap-1 text-sm font-bold text-primary">
            View more
            <MaterialIcon name="arrow_forward" size={17} />
          </Link>
        </div>

        <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveCategory("")}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              !activeCategory ? "bg-primary text-onprimary" : "bg-surface-container-low text-onsurface"
            }`}
          >
            All
          </button>
          {categories.slice(0, 6).map((category) => (
            <button
              key={category.slug}
              type="button"
              onClick={() => setActiveCategory(category.slug)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                activeCategory === category.slug
                  ? "bg-primary text-onprimary"
                  : "bg-surface-container-low text-onsurface hover:bg-surface-container"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {productsQuery.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="aspect-[3/4] animate-pulse rounded-xl bg-surface-container" />
            ))}
          </div>
        ) : products.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {products.slice(0, 15).map((product) => (
              <ProductCard key={product._id} product={product} variant="grid" />
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-surface-container-low px-5 py-10 text-center text-sm text-onsurface-variant">
            Our catalogue is being updated. New products will appear here soon.
          </div>
        )}
      </section>

      {/* Short shop story */}
      <section className="container-daha py-7 md:py-12">
        <div className="grid items-center gap-7 lg:grid-cols-2 lg:gap-12">
          <div className="relative">
            <div className="overflow-hidden rounded-2xl bg-surface-container">
              <img
                src={ABOUT_IMG}
                alt="Clothing collection inside a fashion store"
                loading="lazy"
                className="aspect-[4/3] h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -right-3 -z-0 h-28 w-28 rounded-2xl bg-secondarycontainer/60 md:-right-5" />
          </div>

          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">About DAHA</p>
            <h2 className="mt-2 max-w-xl text-3xl font-extrabold leading-tight tracking-[-0.025em] text-onsurface md:text-4xl">
              A local clothing store built around simple, everyday style.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-onsurface-variant">
              DAHA Clothing Store brings men, women and kids collections together in one easy place.
              Browse online, choose the size and colour you like, and send the complete order to the shop through WhatsApp for confirmation.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/products" className="rounded-lg bg-primary px-5 py-3 text-sm font-bold text-onprimary">
                Browse Products
              </Link>
              <Link to="/contact" className="rounded-lg border border-hairline px-5 py-3 text-sm font-bold text-onsurface hover:border-primary hover:text-primary">
                Contact Store
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Location / live map */}
      <section className="bg-surface-container-low py-8 md:py-12">
        <div className="container-daha grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-stretch">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">Store Location</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.025em] text-onsurface">Visit DAHA in Trichy</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-onsurface-variant">
              {settings.address && !String(settings.address).includes("YOUR_")
                ? `${settings.address}, ${settings.city || "Trichy"}, ${settings.state || "Tamil Nadu"}${settings.pin ? ` - ${settings.pin}` : ""}`
                : "Add the real DAHA store address in Admin → Store Settings and it will appear here automatically."}
            </p>

            <div className="mt-5 space-y-2 text-sm">
              <InfoRow icon="call" label={settings.phone || "YOUR_STORE_PHONE"} />
              <InfoRow icon="schedule" label={settings.businessHours || "YOUR_BUSINESS_HOURS"} />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {hasMaps && (
                <a
                  href={settings.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-onprimary"
                >
                  <MaterialIcon name="directions" size={18} />
                  Get Directions
                </a>
              )}
              {hasWhatsApp && (
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-surface-container-lowest px-5 py-3 text-sm font-bold text-onsurface"
                >
                  <MaterialIcon name="chat" size={18} />
                  WhatsApp
                </a>
              )}
            </div>
          </div>

          <div className="min-h-[320px] overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm">
            {mapUrl ? (
              <iframe
                src={mapUrl}
                title={`${settings.storeName || "DAHA Clothing Store"} location on Google Maps`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="h-[340px] w-full border-0 lg:h-full lg:min-h-[380px]"
              />
            ) : (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center px-6 text-center">
                <MaterialIcon name="location_on" size={42} className="text-primary" filled />
                <p className="mt-3 font-bold text-onsurface">Google Map will appear here</p>
                <p className="mt-1 max-w-sm text-sm text-onsurface-variant">
                  Enter the real map embed URL in Admin → Store Settings.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Simple ecommerce benefits — no free-delivery claim */}
      <section className="container-daha py-8 md:py-10">
        <div className="grid gap-3 sm:grid-cols-3">
          <Benefit icon="checkroom" title="Easy Product Browsing" text="Explore clothing by category, size and style." />
          <Benefit icon="chat" title="Order on WhatsApp" text="Send your selected cart directly to the DAHA store." />
          <Benefit icon="storefront" title="Local Trichy Store" text="Browse online and contact the shop whenever you need help." />
        </div>
      </section>
    </div>
  );
}

function InfoRow({ icon, label }) {
  return (
    <div className="flex items-center gap-2 text-onsurface-variant">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-sm">
        <MaterialIcon name={icon} size={17} />
      </span>
      <span>{label}</span>
    </div>
  );
}

function Benefit({ icon, title, text }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-hairline bg-surface-container-lowest p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondarycontainer/60 text-primary">
        <MaterialIcon name={icon} size={21} />
      </span>
      <div>
        <h3 className="text-sm font-bold text-onsurface">{title}</h3>
        <p className="mt-1 text-sm leading-5 text-onsurface-variant">{text}</p>
      </div>
    </div>
  );
}
