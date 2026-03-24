"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/context/AuthContext";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/subscriptions", label: "Subscriptions" },
  { href: "/profile", label: "Profile" },
];

const authRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/verify-otp",
  "/auth/forgot-password",
  "/auth/reset-password",
];

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, logout, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isAuthRoute = authRoutes.includes(pathname);
  const primaryIdentity = user?.name || user?.email || "Signed in";

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
  };

  const handleMobileMenuToggle = () => {
    setIsMenuOpen((current) => !current);
  };

  const closeMobileMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-amber-200/70 bg-[rgba(255,250,242,0.92)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href={isAuthenticated ? "/dashboard" : "/"}
          className="group flex min-w-0 items-center gap-3 transition"
          onClick={closeMobileMenu}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)] text-sm font-bold text-[var(--primary-contrast)] shadow-md shadow-amber-500/20 transition group-hover:-translate-y-0.5 group-hover:shadow-lg">
            BS
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--accent-strong)]">
              BRADSafe
            </p>
            <p className="truncate text-xs text-slate-500">
              AI Security Gateway for live packet inspection and threat mitigation
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {!isAuthRoute && isAuthenticated ? (
            <>
              <nav className="hidden items-center gap-2 rounded-full border border-amber-200 bg-white/95 p-1 shadow-md md:flex">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobileMenu}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        isActive
                          ? "bg-[var(--accent)] text-white shadow-sm"
                          : "text-slate-700 hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="hidden rounded-2xl border border-amber-200 bg-white/90 px-4 py-2 text-right shadow-sm lg:block">
                <p className="max-w-48 truncate text-sm font-semibold text-slate-900">
                  {primaryIdentity}
                </p>
                <p className="text-xs text-slate-500">Protected session active</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60 sm:inline-flex"
              >
                Logout
              </button>
              <button
                type="button"
                onClick={handleMobileMenuToggle}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-amber-200 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)] md:hidden"
                aria-expanded={isMenuOpen}
                aria-controls="mobile-navigation"
                aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              >
                {isMenuOpen ? "Close" : "Menu"}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="rounded-full border border-transparent px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-amber-200 hover:bg-white hover:text-[var(--accent-strong)]"
                onClick={closeMobileMenu}
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white shadow-md shadow-amber-500/25 transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)]"
                onClick={closeMobileMenu}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
      {!isAuthRoute && isAuthenticated && isMenuOpen ? (
        <div
          id="mobile-navigation"
          className="border-t border-amber-200 bg-[rgba(255,250,242,0.98)] px-4 py-4 shadow-md md:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-3">
            <div className="rounded-2xl border border-amber-200 bg-white px-4 py-3 shadow-sm">
              <p className="truncate text-sm font-semibold text-slate-900">{primaryIdentity}</p>
              <p className="text-xs text-slate-500">Protected session active</p>
            </div>
            <nav className="grid gap-2">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-[var(--accent)] text-white shadow-sm"
                        : "border border-amber-200 bg-white text-slate-700 shadow-sm hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
            >
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
