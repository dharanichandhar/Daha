import { useState, useCallback } from "react";
import { api } from "~/lib/api";

const STORAGE_KEY = "daha_applied_coupon";

function readStored() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useCoupon(subtotal) {
  const [applied, setApplied] = useState(readStored);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const apply = useCallback(
    async (code) => {
      setMessage("");
      setError("");
      if (!code) {
        setError("Enter a coupon code.");
        return null;
      }
      try {
        const res = await api.post("/coupons/validate", {
          code,
          subtotal,
        });
        const coupon = res?.coupon || res;
        setApplied(coupon);
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(coupon));
        }
        setMessage(`Coupon ${coupon.code} applied`);
        return coupon;
      } catch (e) {
        setApplied(null);
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(STORAGE_KEY);
        }
        setError(e.message || "Invalid coupon.");
        return null;
      }
    },
    [subtotal]
  );

  const remove = useCallback(() => {
    setApplied(null);
    setMessage("");
    setError("");
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const discount = applied?.discount ?? 0;

  return { applied, discount, message, error, apply, remove, setMessage };
}