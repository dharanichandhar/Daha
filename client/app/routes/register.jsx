import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAuthStore } from "~/store/useAuthStore";
import { useToastStore } from "~/store/useToastStore";
import { MaterialIcon } from "~/components/MaterialIcon";

export default function Register() {
  const register = useAuthStore((state) => state.register);
  const pushToast = useToastStore((state) => state.push);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      const message = "Passwords do not match.";
      setError(message);
      pushToast(message, "error");
      return;
    }
    if (form.password.length < 8) {
      const message = "Use at least 8 characters for your password.";
      setError(message);
      pushToast(message, "error");
      return;
    }

    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      pushToast("Your DAHA account is ready.", "success");
      navigate(searchParams.get("redirect") || "/");
    } catch (err) {
      const message = err.message || "Could not create your account.";
      setError(message);
      pushToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-daha flex items-start justify-center py-4 sm:py-6 md:min-h-[70vh] md:items-center md:py-10">
      <div className="w-full max-w-lg rounded-2xl border border-hairline bg-surface-container-lowest p-6 shadow-[0_14px_40px_rgba(58,16,48,0.08)] sm:p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-secondarycontainer/60 text-primary">
            <MaterialIcon name="person_add" size={22} />
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.02em] text-onsurface">Create your DAHA account</h1>
          <p className="mt-1 text-sm text-onsurface-variant">Create an account when you are ready to add products to your cart.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          {error && <p className="sm:col-span-2 rounded-lg bg-errorcontainer px-3 py-2.5 text-sm text-onerrorcontainer">{error}</p>}

          <Field label="Full name" className="sm:col-span-2">
            <input required value={form.name} onChange={(event) => set("name", event.target.value)} autoComplete="name" placeholder="Your name" />
          </Field>
          <Field label="Email" className="sm:col-span-2">
            <input type="email" required value={form.email} onChange={(event) => set("email", event.target.value)} autoComplete="email" placeholder="you@example.com" />
          </Field>
          <Field label="Password">
            <span className="relative block">
              <input type={showPassword ? "text" : "password"} required value={form.password} onChange={(event) => set("password", event.target.value)} autoComplete="new-password" placeholder="Minimum 8 characters" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-onsurface-variant hover:bg-surface-container-low" aria-label="Toggle password visibility">
                <MaterialIcon name={showPassword ? "visibility_off" : "visibility"} size={18} />
              </button>
            </span>
          </Field>
          <Field label="Confirm password">
            <input type={showPassword ? "text" : "password"} required value={form.confirm} onChange={(event) => set("confirm", event.target.value)} autoComplete="new-password" placeholder="Repeat password" />
          </Field>

          <button type="submit" disabled={loading} className="sm:col-span-2 mt-1 w-full rounded-lg bg-primary py-3.5 text-sm font-bold text-onprimary shadow-sm transition-transform active:scale-[0.99] disabled:opacity-60">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-onsurface-variant">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-semibold text-onsurface">{label}</span>
      <span className="[&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-hairline [&_input]:bg-surface [&_input]:px-3.5 [&_input]:py-3 [&_input]:text-sm [&_input]:text-onsurface [&_input]:outline-none [&_input]:transition-colors focus-within:[&_input]:border-primary">
        {children}
      </span>
    </label>
  );
}
