import type { Metadata } from "next";
import { InstallContent } from "./install-content";

export const metadata: Metadata = {
  title: "Install PRism",
  description: "Install the PRism browser extension for Chrome or Firefox.",
};

export default function InstallPage() {
  return <InstallContent />;
}
