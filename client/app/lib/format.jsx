const viteApiUrl = import.meta.env?.VITE_API_URL || "/api";

export const API_URL =
  typeof window !== "undefined"
    ? window.__API_URL__ || viteApiUrl
    : process.env.DAHA_API_URL || process.env.SERVER_API_URL || "http://localhost:5000/api";

export const SERVER_URL =
  typeof window !== "undefined"
    ? (window.__API_URL__ || viteApiUrl).replace(/\/api\/?$/, "")
    : process.env.DAHA_SERVER_URL || process.env.SERVER_URL || "http://localhost:5000";

export const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export const formatRupees = (value) =>
  `\u20B9${Number(value || 0).toLocaleString("en-IN")}`;

export const discountPercent = (mrp, selling) => {
  if (!mrp || mrp <= selling) return 0;
  return Math.round(((mrp - selling) / mrp) * 100);
};

export const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
