import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAuthStore } from "~/store/useAuthStore";
import { useToastStore } from "~/store/useToastStore";
import { MaterialIcon } from "~/components/MaterialIcon";

export default function Login() {
  const login = useAuthStore((state) => state.login);
  const pushToast = useToastStore((state) => state.push);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login({ email, password });
      const redirect = searchParams.get("redirect") || (data.user?.role === "admin" ? "/admin" : "/");
      pushToast(`Welcome back${data.user?.name ? `, ${data.user.name}` : ""}.`, "success");
      navigate(redirect);
    } catch (err) {
      const message = err.message || "Login failed. Please try again.";
      setError(message);
      pushToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-daha flex items-start justify-center py-4 sm:py-6 md:min-h-[70vh] md:items-center md:py-10">
      <div className="w-full max-w-md rounded-2xl border border-hairline bg-surface-container-lowest p-6 shadow-[0_14px_40px_rgba(58,16,48,0.08)] sm:p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-secondarycontainer/60 text-primary">
            <MaterialIcon name="person" size={22} />
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.02em] text-onsurface">Welcome back</h1>
          <p className="mt-1 text-sm text-onsurface-variant">Sign in only when you are ready to shop or manage your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p className="rounded-lg bg-errorcontainer px-3 py-2.5 text-sm text-onerrorcontainer">{error}</p>
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-onsurface">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-hairline bg-surface px-3.5 py-3 text-sm text-onsurface outline-none transition-colors focus:border-primary"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-onsurface">Password</span>
            <span className="relative block">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-hairline bg-surface px-3.5 py-3 pr-11 text-sm text-onsurface outline-none transition-colors focus:border-primary"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-onsurface-variant hover:bg-surface-container-low"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <MaterialIcon name={showPassword ? "visibility_off" : "visibility"} size={18} />
              </button>
            </span>
          </label>

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm font-semibold text-primary hover:underline">Forgot password?</Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-3.5 text-sm font-bold text-onprimary shadow-sm transition-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-onsurface-variant">
          New to DAHA?{" "}
          <Link to="/register" className="font-bold text-primary hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
