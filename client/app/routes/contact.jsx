import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "~/lib/api";
import { MaterialIcon } from "~/components/MaterialIcon";

export default function Contact() {
  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get("/settings"),
    retry: false,
  });
  const contact = data?.settings || {};
  const email = contact.supportEmail || "";

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setSent(true);
    if (email) {
      window.location.href = `mailto:${email}?subject=DAHA contact: ${encodeURIComponent(
        form.name
      )}&body=${encodeURIComponent(form.message + "\n\nFrom: " + form.email)}`;
    }
  };

  return (
    <div className="container-daha py-8">
      <h1 className="font-display text-2xl text-onsurface">Contact Us</h1>
      <p className="mt-1 text-sm text-onsurface-variant">
        We'd love to hear from you — orders, fittings, or feedback.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {[
          { icon: "call", label: "Call us", value: contact.phone || "—" },
          { icon: "mail", label: "Email us", value: contact.supportEmail || "—" },
          { icon: "location_on", label: "Visit us", value: contact.address || "—" },
        ].map((c) => (
          <div key={c.label} className="rounded-xl bg-surface-container-low p-4 shadow-sm">
            <MaterialIcon name={c.icon} className="text-secondary" />
            <p className="mt-2 text-xs font-bold uppercase text-onsurface-variant">{c.label}</p>
            <p className="text-sm text-onsurface">{c.value}</p>
          </div>
        ))}
      </div>

      {sent && (
        <p className="mt-4 rounded bg-secondarycontainer px-3 py-2 text-sm text-primary">
          Opening your email app — thank you for reaching out!
        </p>
      )}

      <form onSubmit={submit} className="mt-6 flex max-w-lg flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded border border-hairline bg-surface px-3 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded border border-hairline bg-surface px-3 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Message</label>
          <textarea
            required
            rows={4}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full rounded border border-hairline bg-surface px-3 py-2.5 focus:border-primary focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded bg-primary py-3 font-semibold text-onprimary md:w-auto md:px-8"
        >
          Send Message
        </button>
      </form>
    </div>
  );
}