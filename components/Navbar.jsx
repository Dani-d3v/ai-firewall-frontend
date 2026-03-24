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
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[rgba(2,6,23,0.92)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href={isAuthenticated ? "/dashboard" : "/"}
          className="group flex min-w-0 items-center gap-3 transition"
          onClick={closeMobileMenu}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/30 bg-slate-950 text-sm font-bold text-emerald-300 shadow-md shadow-emerald-950/40 transition group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:shadow-emerald-500/20">
            BS
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
              BRADSafe
            </p>
            <p className="truncate text-xs text-slate-400">
              AI Security Gateway for live packet inspection and threat mitigation
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {!isAuthRoute && isAuthenticated ? (
            <>
              <nav className="hidden items-center gap-2 rounded-full border border-slate-800 bg-slate-900/90 p-1 shadow-md md:flex">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobileMenu}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        isActive
                          ? "bg-emerald-500/15 text-emerald-300 shadow-sm ring-1 ring-emerald-400/30"
                          : "text-slate-300 hover:bg-amber-500/10 hover:text-amber-200"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="hidden rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-right shadow-sm lg:block">
                <p className="max-w-48 truncate text-sm font-semibold text-slate-100">
                  {primaryIdentity}
                </p>
                <p className="text-xs text-emerald-300">Active mitigation console online</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 shadow-sm transition hover:border-amber-400/60 hover:bg-amber-500/10 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-60 sm:inline-flex"
              >
                Secure sign out
              </button>
              <button
                type="button"
                onClick={handleMobileMenuToggle}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-3 text-sm font-medium text-slate-100 shadow-sm transition hover:border-amber-400/60 hover:bg-amber-500/10 hover:text-amber-200 md:hidden"
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
                className="rounded-full border border-transparent px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-900 hover:text-emerald-300"
                onClick={closeMobileMenu}
              >
                Operator access
              </Link>
              <Link
                href="/auth/register"
                className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-md shadow-emerald-500/25 transition hover:-translate-y-0.5 hover:bg-emerald-400"
                onClick={closeMobileMenu}
              >
                Launch BRADSafe
              </Link>
            </div>
          )}
        </div>
      </div>
      {!isAuthRoute && isAuthenticated && isMenuOpen ? (
        <div
          id="mobile-navigation"
          className="border-t border-slate-800 bg-[rgba(2,6,23,0.98)] px-4 py-4 shadow-md md:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 shadow-sm">
              <p className="truncate text-sm font-semibold text-slate-100">{primaryIdentity}</p>
              <p className="text-xs text-emerald-300">Active mitigation console online</p>
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
                        ? "bg-emerald-500/15 text-emerald-300 shadow-sm ring-1 ring-emerald-400/30"
                        : "border border-slate-800 bg-slate-900 text-slate-200 shadow-sm hover:border-amber-400/50 hover:bg-amber-500/10 hover:text-amber-200"
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
              className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-100 shadow-sm transition hover:border-amber-400/60 hover:bg-amber-500/10 hover:text-amber-200"
            >
              Secure sign out
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
