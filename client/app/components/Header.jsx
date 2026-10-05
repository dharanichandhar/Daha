import { Link, NavLink, useNavigate } from "react-router";
import { useEffect } from "react";
import { MaterialIcon } from "./MaterialIcon";
import { useAuthStore } from "~/store/useAuthStore";
import { useCartStore } from "~/store/useCartStore";

export function Header() {
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const cart = useCartStore((s) => s.cart);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (user) fetchCart();
    else useCartStore.getState().clearCart();
  }, [user, fetchCart]);

  const cartCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const navLink = ({ isActive }) =>
    `px-3 py-2 text-sm font-semibold transition-colors ${
      isActive ? "text-primary" : "text-onsurface hover:text-primary"
    }`;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-hairline bg-surface/95 backdrop-blur-xl">
        <div className="container-daha flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-baseline gap-1.5" aria-label="DAHA home">
            <span className="text-2xl font-extrabold tracking-[0.16em] text-primary">DAHA</span>
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-onsurface-variant sm:inline">
              Trichy
            </span>
          </Link>

          <nav className="hidden items-center md:flex" aria-label="Primary navigation">
            <NavLink to="/" className={navLink} end>
              Home
            </NavLink>
            <NavLink to="/products" className={navLink}>
              All Products
            </NavLink>
            <NavLink to="/contact" className={navLink}>
              Contact
            </NavLink>
          </nav>

          <div className="flex items-center gap-1">
            <Link
              to="/search"
              className="flex h-10 w-10 items-center justify-center rounded-full text-onsurface transition-colors hover:bg-surface-container-low hover:text-primary"
              aria-label="Search products"
            >
              <MaterialIcon name="search" size={22} />
            </Link>
            <Link
              to={user ? (user.role === "admin" ? "/admin" : "/account") : "/login"}
              className="flex h-10 w-10 items-center justify-center rounded-full text-onsurface transition-colors hover:bg-surface-container-low hover:text-primary"
              aria-label={user ? "Account" : "Login"}
            >
              <MaterialIcon name={user ? "person" : "person_outline"} size={22} />
            </Link>
            <button
              type="button"
              onClick={() => navigate("/cart")}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-onsurface transition-colors hover:bg-surface-container-low hover:text-primary"
              aria-label="Shopping cart"
            >
              <MaterialIcon name="shopping_bag" size={22} />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-onprimary">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 z-50 w-full border-t border-hairline bg-surface/95 pb-safe backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
        <div className="grid grid-cols-5">
          <BottomLink to="/" icon="home" label="Home" end />
          <BottomLink to="/products" icon="grid_view" label="Products" />
          <BottomLink to="/contact" icon="call" label="Contact" />
          <BottomLink to="/cart" icon="shopping_bag" label="Cart" badge={cartCount} />
          <BottomLink
            to={user ? (user.role === "admin" ? "/admin" : "/account") : "/login"}
            icon="person_outline"
            label="Account"
          />
        </div>
      </nav>
    </>
  );
}

function BottomLink({ to, icon, label, end, badge }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center py-2.5 transition-colors ${
          isActive ? "text-primary" : "text-onsurface-variant"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className="relative">
            <MaterialIcon name={icon} size={23} filled={isActive && icon === "home"} />
            {badge > 0 && (
              <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-onprimary">
                {badge}
              </span>
            )}
          </span>
          <span className="mt-0.5 text-[10px] font-medium tracking-wide">{label}</span>
        </>
      )}
    </NavLink>
  );
}
