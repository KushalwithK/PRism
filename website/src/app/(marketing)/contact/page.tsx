import type { Metadata } from "next";
import { Mail, HelpCircle, CreditCard, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the Lucent team for support and inquiries.",
};

const contactReasons = [
  {
    icon: HelpCircle,
    title: "General Inquiries",
    description:
      "Questions about our products, features, or anything else — we're happy to help.",
  },
  {
    icon: CreditCard,
    title: "Billing Support",
    description:
      "Issues with subscriptions, payments, refunds, or plan changes.",
  },
  {
    icon: Shield,
    title: "Privacy Concerns",
    description:
      "Requests for data deletion, data export, or questions about our data practices.",
  },
];

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
        Contact Us
      </h1>
      <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
        Have a question, issue, or feedback? We&apos;d love to hear from you.
      </p>

      <div className="mt-10 rounded-xl border border-border/50 bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email us at</p>
            <a
              href="mailto:support@getlucent.dev"
              className="text-lg font-semibold text-primary underline-offset-4 hover:underline"
            >
              support@getlucent.dev
            </a>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          We typically respond within 24–48 hours.
        </p>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold">How can we help?</h2>
        <div className="mt-4 grid gap-4">
          {contactReasons.map((reason) => (
            <div
              key={reason.title}
              className="flex gap-4 rounded-xl border border-border/50 bg-card p-5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <reason.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium">{reason.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {reason.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 rounded-xl border border-border/50 bg-card p-6">
        <h2 className="text-xl font-semibold">Business Information</h2>
        <div className="mt-3 space-y-1 text-sm text-muted-foreground">
          <p><strong className="text-foreground">Company:</strong> Lucent</p>
          <p><strong className="text-foreground">Location:</strong> India</p>
          <p>
            <strong className="text-foreground">Email:</strong>{" "}
            <a
              href="mailto:support@getlucent.dev"
              className="text-primary underline-offset-4 hover:underline"
            >
              support@getlucent.dev
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
