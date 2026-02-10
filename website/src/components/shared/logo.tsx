import { Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  linkToHome?: boolean;
}

const sizeMap = {
  sm: { icon: 18, text: "text-lg" },
  md: { icon: 22, text: "text-xl" },
  lg: { icon: 28, text: "text-2xl" },
} as const;

export function Logo({ className, size = "md", linkToHome = true }: LogoProps) {
  const { icon, text } = sizeMap[size];

  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-bold tracking-tight",
        text,
        className
      )}
    >
      <Sparkles className="text-primary" size={icon} />
      <span>Lucent</span>
    </span>
  );

  if (linkToHome) {
    return (
      <Link href="/" className="hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
