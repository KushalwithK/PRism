import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how Lucent collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="February 10, 2026">
      <h2>1. Introduction</h2>
      <p>
        Lucent (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the
        PRism browser extension and web platform. This Privacy Policy explains
        how we collect, use, and protect your personal information when you use
        our services.
      </p>

      <h2>2. Information We Collect</h2>
      <p>We collect the following categories of information:</p>
      <ul>
        <li>
          <strong>Account data:</strong> name, email address, and password
          (stored as a bcrypt hash — we never store plain-text passwords)
        </li>
        <li>
          <strong>Usage data:</strong> generation history including PR titles,
          descriptions, diff summaries, and repository URLs
        </li>
        <li>
          <strong>Custom templates:</strong> template names and body text you
          create
        </li>
        <li>
          <strong>Subscription and billing data:</strong> plan type, subscription
          status, usage count, billing period, and Razorpay customer and
          subscription identifiers
        </li>
      </ul>
      <p>
        We do <strong>not</strong> collect your full source code, use analytics
        or tracking cookies, or perform device fingerprinting.
      </p>

      <h2>3. How We Use Your Information</h2>
      <ul>
        <li>Provide, maintain, and improve the PRism service</li>
        <li>Process subscription payments through Razorpay</li>
        <li>Improve AI generation quality over time</li>
        <li>
          Communicate important service updates, billing notifications, and
          security alerts
        </li>
      </ul>

      <h2>4. Third-Party Services</h2>
      <p>We share limited data with the following third-party services:</p>
      <ul>
        <li>
          <strong>Razorpay</strong> (payment processing): your name and email
          address are shared with Razorpay to process subscription payments.
          Razorpay&apos;s handling of your data is governed by their{" "}
          <a
            href="https://razorpay.com/privacy/"
            target="_blank"
            rel="noopener noreferrer"
          >
            privacy policy
          </a>
          .
        </li>
        <li>
          <strong>Google Gemini API</strong> (AI generation): code diff content
          is sent to generate PR descriptions. No user identity or personal
          information is included in these requests.
        </li>
      </ul>

      <h2>5. Data Retention</h2>
      <ul>
        <li>
          Account data is retained for as long as your account remains active
        </li>
        <li>
          Generation history is retained so you can access your past generations
        </li>
        <li>
          All data is deleted upon account deletion request — see &quot;Your
          Rights&quot; below
        </li>
      </ul>

      <h2>6. Data Security</h2>
      <p>We implement the following security measures to protect your data:</p>
      <ul>
        <li>Passwords are hashed using bcrypt before storage</li>
        <li>
          Authentication is handled via JWT tokens with short-lived access tokens
          (15 minutes) and rotating refresh tokens
        </li>
        <li>All data is transmitted over HTTPS encryption</li>
        <li>No plain-text passwords are ever stored or logged</li>
      </ul>

      <h2>7. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>
          <strong>Delete your account:</strong> email us at{" "}
          <a href="mailto:support@getlucent.dev">support@getlucent.dev</a> to
          request full account and data deletion
        </li>
        <li>
          <strong>Export your data:</strong> email us to request a copy of the
          personal data we hold about you
        </li>
        <li>
          <strong>Update your information:</strong> you can update your profile
          information directly from your dashboard
        </li>
      </ul>

      <h2>8. Children&apos;s Privacy</h2>
      <p>
        Our service is not directed at children under the age of 13. We do not
        knowingly collect personal information from children under 13. If we
        become aware that we have collected data from a child under 13, we will
        take steps to delete that information promptly.
      </p>

      <h2>9. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. When we do, we will
        revise the &quot;Last updated&quot; date at the top of this page. We
        encourage you to review this policy periodically for any changes.
      </p>

      <h2>10. Contact</h2>
      <p>
        If you have any questions or concerns about this Privacy Policy or our
        data practices, please contact us at{" "}
        <a href="mailto:support@getlucent.dev">support@getlucent.dev</a>.
      </p>
    </LegalPage>
  );
}
