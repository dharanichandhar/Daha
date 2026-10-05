import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import stylesheet from "./styles/app.css?url";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { AppProviders } from "~/providers/AppProviders";
import { FloatingInstagram } from "~/components/FloatingInstagram";

export const links = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Outfit:wght@100;200;300;400;500;600;700;800;900&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200",
  },
  { rel: "stylesheet", href: stylesheet },
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
  { rel: "icon", href: "/favicon.ico", sizes: "any" },
];

export function Layout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <AppProviders>
          <div className="flex min-h-screen flex-col pb-16 md:pb-0">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <FloatingInstagram />
          </div>
        </AppProviders>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}