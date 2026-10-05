import { useState } from "react";
import { Link } from "react-router";
import { api } from "~/lib/api";
import { useToastStore } from "~/store/useToastStore";
import { MaterialIcon } from "~/components/MaterialIcon";

export default function ForgotPassword() {
  const pushToast = useToastStore((state) => state.push);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const data = await api.post("/auth/forgot-password", { email });
      const text = data?.message || "If that email is registered, a reset link has been sent.";
      setMessage(text);
      pushToast(text, "success");
    } catch (err) {
      pushToast(err.message || "Could not send the reset link.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-daha flex items-start justify-center py-4 sm:py-6 md:min-h-[65vh] md:items-center md:py-10">
      <div className="w-full max-w-md rounded-2xl border border-hairline bg-surface-container-lowest p-6 shadow-[0_14px_40px_rgba(58,16,48,0.08)] sm:p-8">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondarycontainer/60 text-primary">
          <MaterialIcon name="lock_reset" size={21} />
        </span>
        <h1 className="mt-3 text-2xl font-extrabold text-onsurface">Reset password</h1>
        <p className="mt-1 text-sm leading-6 text-onsurface-variant">Enter your email and we will send a secure reset link if the account exists.</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {message && <p className="rounded-lg bg-secondarycontainer/60 px-3 py-2.5 text-sm text-primary">{message}</p>}
          <label>
            <span className="mb-1.5 block text-sm font-semibold">Email</span>
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-hairline bg-surface px-3.5 py-3 text-sm outline-none focus:border-primary" autoComplete="email" />
          </label>
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-primary py-3.5 text-sm font-bold text-onprimary disabled:opacity-60">
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm"><Link to="/login" className="font-bold text-primary hover:underline">Back to sign in</Link></p>
      </div>
    </div>
  );
}
