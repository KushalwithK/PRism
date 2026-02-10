"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { NAV_LINKS, PRODUCTS_CONFIG } from "@/lib/constants";
import { ProductsMenu } from "./products-menu";
import { cn } from "@/lib/utils";

function useScrolled(threshold = 50) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > threshold);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

function useIsLoggedIn() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  useEffect(() => {
    fetch("/api/auth/refresh", { method: "POST" })
      .then((res) => setLoggedIn(res.ok))
      .catch(() => setLoggedIn(false));
  }, []);
  return loggedIn;
}

export function Navbar() {
  const pathname = usePathname();
  const scrolled = useScrolled();
  const isLoggedIn = useIsLoggedIn();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  const closeProducts = useCallback(() => setProductsOpen(false), []);

  // Detect product page for breadcrumb mode
  const productMatch = pathname.match(/^\/products\/([^/]+)/);
  const productSlug = productMatch?.[1];
  const product = productSlug
    ? PRODUCTS_CONFIG.find((p) => p.slug === productSlug)
    : null;
  const isBreadcrumb = !!product;

  // Hero pages get transparent navbar
  const isHeroPage = pathname === "/" || isBreadcrumb;
  const showSolid = scrolled || !isHeroPage;

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        showSolid
          ? "bg-background/60 backdrop-blur-xl border-b border-border/30"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-1">
          {isBreadcrumb ? (
            /* Breadcrumb mode */
            <div className="flex items-center gap-1.5 text-sm">
              <Logo size="sm" />
              <ChevronRight size={14} className="text-muted-foreground" />
              <Link
                href={`/products/${product.slug}`}
                className="font-semibold text-foreground hover:text-primary transition-colors"
              >
                {product.name}
              </Link>
            </div>
          ) : (
            <Logo size="md" />
          )}
        </div>

        {/* Desktop nav center */}
        <div className="hidden items-center gap-1 md:flex">
          {isBreadcrumb ? (
            /* Product sub-nav tabs */
            product.subNav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-foreground",
                  pathname === link.href
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))
          ) : (
            /* Main nav links */
            <>
              {NAV_LINKS.map((link) =>
                link.isMenu ? (
                  <div key={link.label}>
                    <button
                      onClick={() => setProductsOpen(!productsOpen)}
                      className={cn(
                        "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-foreground cursor-pointer",
                        productsOpen
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {link.label}
                      <ChevronDown
                        size={14}
                        className={cn(
                          "transition-transform",
                          productsOpen && "rotate-180"
                        )}
                      />
                    </button>
                    <ProductsMenu open={productsOpen} onClose={closeProducts} />
                  </div>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-foreground",
                      pathname === link.href
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                )
              )}
            </>
          )}
        </div>

        {/* Desktop right side */}
        <div className="hidden items-center gap-3 md:flex">
          {isLoggedIn === null ? (
            <div className="w-24" /> /* Placeholder while loading */
          ) : isLoggedIn ? (
            <Button size="sm" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border/50 bg-background px-6 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            {isBreadcrumb ? (
              product.subNav.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "text-foreground bg-secondary"
                      : "text-muted-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))
            ) : (
              <>
                {/* Products list in mobile */}
                <p className="px-3 pt-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Products
                </p>
                {PRODUCTS_CONFIG.map((p) => (
                  <Link
                    key={p.slug}
                    href={
                      p.status === "available"
                        ? `/products/${p.slug}`
                        : "#"
                    }
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      p.status === "available"
                        ? "text-muted-foreground"
                        : "text-muted-foreground/50"
                    )}
                  >
                    <p.icon size={16} />
                    {p.name}
                    {p.status === "coming-soon" && (
                      <span className="ml-auto text-[10px] text-muted-foreground/50">
                        Soon
                      </span>
                    )}
                  </Link>
                ))}
                <hr className="my-2 border-border/50" />
                {NAV_LINKS.filter((l) => !l.isMenu).map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      pathname === link.href
                        ? "text-foreground bg-secondary"
                        : "text-muted-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </>
            )}
            <hr className="my-2 border-border/50" />
            {isLoggedIn ? (
              <Button size="sm" asChild>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                  Dashboard
                </Link>
              </Button>
            ) : isLoggedIn === false ? (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground"
                >
                  Log in
                </Link>
                <Button size="sm" asChild>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                  >
                    Get Started
                  </Link>
                </Button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}
