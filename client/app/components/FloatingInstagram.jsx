import { useQuery } from "@tanstack/react-query";
import { api } from "~/lib/api";
import { useToastStore } from "~/store/useToastStore";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FloatingInstagram() {
  const pushToast = useToastStore((state) => state.push);
  const { data } = useQuery({
    queryKey: ["floating-instagram-settings"],
    queryFn: () => api.get("/settings"),
    enabled: typeof window !== "undefined",
    staleTime: 5 * 60 * 1000,
  });

  const settings = data?.settings || {};
  const instagram = settings.socialLinks?.instagram || "";
  const usable = instagram && !String(instagram).includes("YOUR_");

  const handleClick = (event) => {
    if (!usable) {
      event.preventDefault();
      pushToast("Instagram link will be available soon.", "info");
    }
  };

  return (
    <a
      href={usable ? instagram : "#"}
      target={usable ? "_blank" : undefined}
      rel={usable ? "noreferrer" : undefined}
      onClick={handleClick}
      className="instagram-float fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-onprimary shadow-lg transition-transform hover:scale-105 md:bottom-6 md:right-6"
      aria-label="Open DAHA on Instagram"
    >
      <InstagramIcon />
    </a>
  );
}
