import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description:
    "Learn about our subscription cancellation process and refund policy.",
};

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund & Cancellation Policy"
      lastUpdated="February 10, 2026"
    >
      <h2>1. Cancellation Policy</h2>
      <p>
        You may cancel your PRism subscription at any time. Here&apos;s what
        happens when you cancel:
      </p>
      <ul>
        <li>Your access to paid features continues until the end of your current billing period</li>
        <li>After the billing period ends, your account is automatically downgraded to the Free plan</li>
        <li>No further charges will be made after cancellation</li>
        <li>There is no penalty or fee for cancelling</li>
      </ul>

      <h2>2. Refund Policy</h2>
      <p>
        PRism is a digital subscription service. Refunds are handled on a
        case-by-case basis under the following guidelines:
      </p>
      <ul>
        <li>
          <strong>Within 7 days of initial subscription:</strong> if you are
          unsatisfied with the service, you may request a full refund of your
          first payment
        </li>
        <li>
          <strong>After the 7-day window:</strong> refunds are generally not
          available for partial months or unused portions of a billing period
        </li>
        <li>
          <strong>Plan downgrades:</strong> no refunds are issued for
          mid-cycle plan downgrades. The lower plan takes effect at the start of
          your next billing period
        </li>
      </ul>

      <h2>3. How to Cancel</h2>
      <p>To cancel your subscription, follow these steps:</p>
      <ol>
        <li>Log in to your account at <a href="/login">getlucent.dev/login</a></li>
        <li>Navigate to your <strong>Dashboard</strong></li>
        <li>Go to the <strong>Billing</strong> section</li>
        <li>Click <strong>Cancel</strong> on your active subscription</li>
      </ol>
      <p>
        Your cancellation takes effect immediately, but you retain access to paid
        features until the end of your current billing period.
      </p>

      <h2>4. How to Request a Refund</h2>
      <p>
        To request a refund, email us at{" "}
        <a href="mailto:support@getlucent.dev">support@getlucent.dev</a> with
        the following information:
      </p>
      <ul>
        <li>Your account email address</li>
        <li>Your subscription ID (found in your billing dashboard)</li>
        <li>Reason for the refund request</li>
      </ul>
      <p>
        We will review your request and respond within 3–5 business days. If
        approved, the refund will be processed to your original payment method.
      </p>

      <h2>5. Contact</h2>
      <p>
        For any questions regarding cancellations or refunds, please contact us
        at <a href="mailto:support@getlucent.dev">support@getlucent.dev</a>.
      </p>
    </LegalPage>
  );
}
