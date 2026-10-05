import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { api } from "~/lib/api";
import { useToastStore } from "~/store/useToastStore";

export default function ResetPassword() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const pushToast = useToastStore((state) => state.push);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      pushToast("Password updated. Please sign in.", "success");
      navigate("/login");
    } catch (err) {
      const message = err.message || "This reset link is invalid or expired.";
      setError(message);
      pushToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-daha flex items-start justify-center py-4 sm:py-6 md:min-h-[65vh] md:items-center md:py-10">
      <div className="w-full max-w-md rounded-2xl border border-hairline bg-surface-container-lowest p-6 shadow-[0_14px_40px_rgba(58,16,48,0.08)] sm:p-8">
        <h1 className="text-2xl font-extrabold text-onsurface">Choose a new password</h1>
        <p className="mt-1 text-sm text-onsurface-variant">Use a secure password with at least 8 characters.</p>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          {error && <p className="rounded-lg bg-errorcontainer px-3 py-2.5 text-sm text-onerrorcontainer">{error}</p>}
          <label><span className="mb-1.5 block text-sm font-semibold">New password</span><input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-hairline bg-surface px-3.5 py-3 text-sm outline-none focus:border-primary" autoComplete="new-password" /></label>
          <label><span className="mb-1.5 block text-sm font-semibold">Confirm password</span><input type="password" required value={confirm} onChange={(event) => setConfirm(event.target.value)} className="w-full rounded-lg border border-hairline bg-surface px-3.5 py-3 text-sm outline-none focus:border-primary" autoComplete="new-password" /></label>
          <button type="submit" disabled={loading} className="rounded-lg bg-primary py-3.5 text-sm font-bold text-onprimary disabled:opacity-60">{loading ? "Updating..." : "Update Password"}</button>
        </form>
        <p className="mt-5 text-center text-sm"><Link to="/login" className="font-bold text-primary">Back to sign in</Link></p>
      </div>
    </div>
  );
}
