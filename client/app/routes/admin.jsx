import { useSearchParams } from "react-router";
import { Link } from "react-router";
import { useAuthStore } from "~/store/useAuthStore";
import { MaterialIcon } from "~/components/MaterialIcon";
import { DashboardTab } from "~/components/admin/DashboardTab";
import { ProductsTab } from "~/components/admin/ProductsTab";
import { CategoriesTab } from "~/components/admin/CategoriesTab";
import { OrdersTab } from "~/components/admin/OrdersTab";
import { InventoryTab } from "~/components/admin/InventoryTab";
import { CouponsTab } from "~/components/admin/CouponsTab";
import { BannersTab } from "~/components/admin/BannersTab";
import { SettingsTab } from "~/components/admin/SettingsTab";

const TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "products", label: "Products" },
  { key: "categories", label: "Categories" },
  { key: "orders", label: "Orders" },
  { key: "inventory", label: "Inventory" },
  { key: "coupons", label: "Coupons" },
  { key: "banners", label: "Banners" },
  { key: "settings", label: "Settings" },
];

export default function Admin() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "dashboard";
  const { user, isAdmin } = useAuthStore();

  if (!user || !isAdmin()) {
    return (
      <div className="container-daha py-20 text-center">
        <h1 className="font-display text-2xl text-onsurface">Admin Access</h1>
        <p className="mt-2 text-sm text-onsurface-variant">
          This area is restricted to store administrators.
        </p>
        <Link
          to={user ? "/" : "/login?redirect=/admin"}
          className="mt-6 inline-block rounded bg-primary px-6 py-3 text-sm font-semibold text-onprimary"
        >
          {user ? "Go Home" : "Sign In"}
        </Link>
      </div>
    );
  }

  const current = TABS.find((t) => t.key === tab) || TABS[0];
  const goTab = (key) => setSearchParams({ tab: key });
  const managerId = (user.email || "").split("@")[0] || "ADMIN";

  return (
    <div className="container-daha py-6">
      {/* Welcome banner */}
      <div className="flex flex-col gap-2 rounded-xl bg-surface-container p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primarycontainer text-onprimary">
              <MaterialIcon name="storefront" size={20} />
            </span>
            <div>
              <h1 className="font-display text-xl text-primary">DAHA Store Admin</h1>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
                <p className="text-xs text-onsurface-variant">Trichy Store · Online Orders Active</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-onprimary">Manager</span>
            <span className="mt-0.5 text-xs text-outline">ID: {managerId}</span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="no-scrollbar mt-2 flex items-center gap-2 overflow-x-auto pb-0.5">
          <button
            onClick={() => goTab("products")}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-onprimary shadow-sm transition-transform active:scale-95"
          >
            <MaterialIcon name="add_circle" size={18} />
            + Add Product
          </button>
          {[
            { key: "categories", label: "Manage Categories", icon: "category" },
            { key: "inventory", label: "Inventory Tracker", icon: "inventory_2" },
            { key: "orders", label: "Orders Queue", icon: "receipt_long" },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => goTab(a.key)}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-surface-container-high px-4 py-2.5 text-sm font-medium text-onsurface transition-colors hover:bg-surface-container-highest active:scale-95"
            >
              <MaterialIcon name={a.icon} size={18} />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="no-scrollbar my-4 flex gap-2 overflow-x-auto border-b border-hairline pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => goTab(t.key)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm capitalize ${
              tab === t.key ? "bg-primary text-onprimary" : "text-onsurface hover:bg-surface-container"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {current.key === "dashboard" && <DashboardTab />}
      {current.key === "products" && <ProductsTab />}
      {current.key === "categories" && <CategoriesTab />}
      {current.key === "orders" && <OrdersTab />}
      {current.key === "inventory" && <InventoryTab />}
      {current.key === "coupons" && <CouponsTab />}
      {current.key === "banners" && <BannersTab />}
      {current.key === "settings" && <SettingsTab />}
    </div>
  );
}