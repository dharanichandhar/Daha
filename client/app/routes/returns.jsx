import { MaterialIcon } from "~/components/MaterialIcon";

const STEPS = [
  {
    title: "Initiate a return",
    body: "Within 7 days of delivery, contact us or visit our store with your order number and reason for return.",
  },
  {
    title: "Product condition",
    body: "Items must be unworn, unwashed, with all tags attached and in original packaging. Undergarments and final-sale items are excluded.",
  },
  {
    title: "Receive your refund",
    body: "Once inspected, refunds are processed to the original payment method within 5–7 business days.",
  },
];

export default function Returns() {
  return (
    <div className="container-daha py-8">
      <h1 className="font-display text-2xl text-onsurface">Returns & Exchanges</h1>
      <p className="mt-1 max-w-lg text-sm text-onsurface-variant">
        We want you to love your DAHA pieces. If something isn't right, here's how
        to make it easy.
      </p>

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:gap-4">
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex-1 rounded-xl bg-surface-container-low p-5 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-onprimary">
              {i + 1}
            </div>
            <h2 className="font-display mt-3 text-base text-onsurface">{step.title}</h2>
            <p className="mt-1 text-sm text-onsurface-variant">{step.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-xl bg-secondarycontainer p-5">
        <MaterialIcon name="support_agent" className="mt-0.5 text-secondary" />
        <div>
          <h2 className="text-sm font-bold text-onsurface">Need help with a return?</h2>
          <p className="mt-1 text-sm text-onsurface-variant">
            Call or WhatsApp us, or visit our Trichy store. We're happy to help.
          </p>
        </div>
      </div>
    </div>
  );
}