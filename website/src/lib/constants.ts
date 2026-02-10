import type { LucideIcon } from "lucide-react";
import { GitPullRequest, Eye, Terminal } from "lucide-react";

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export const SITE_NAME = "Lucent";
export const SITE_DESCRIPTION = "AI tools that illuminate your workflow";

export const NAV_LINKS = [
  { label: "Home", href: "/", isMenu: false as const },
  { label: "Products", href: "#products", isMenu: true as const },
  { label: "Company", href: "/about", isMenu: false as const },
  { label: "Blog", href: "/blog", isMenu: false as const },
  { label: "Changelog", href: "/changelog", isMenu: false as const },
];

export interface ProductConfig {
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
  status: "available" | "coming-soon";
  subNav: { label: string; href: string }[];
}

export const PRODUCTS_CONFIG: ProductConfig[] = [
  {
    slug: "prism",
    name: "PRism",
    description:
      "Generate polished, template-driven PR descriptions from your diffs in one click.",
    icon: GitPullRequest,
    status: "available",
    subNav: [
      { label: "Overview", href: "/products/prism" },
      { label: "Pricing", href: "/products/prism/pricing" },
      { label: "Install", href: "/products/prism/install" },
      { label: "Guide", href: "/products/prism/guide" },
    ],
  },
  {
    slug: "code-lens",
    name: "CodeLens",
    description:
      "AI-powered code review suggestions that catch bugs, security issues, and improvements.",
    icon: Eye,
    status: "coming-soon",
    subNav: [],
  },
  {
    slug: "commit-craft",
    name: "CommitCraft",
    description:
      "Auto-generate meaningful, conventional commit messages from your staged changes.",
    icon: Terminal,
    status: "coming-soon",
    subNav: [],
  },
];

export const PRODUCT_NAV_LINKS = [
  { label: "Overview", href: "/products/prism" },
  { label: "Pricing", href: "/products/prism/pricing" },
  { label: "Install", href: "/products/prism/install" },
  { label: "Guide", href: "/products/prism/guide" },
] as const;
