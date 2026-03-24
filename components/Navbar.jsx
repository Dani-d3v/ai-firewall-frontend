"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  const isAuthRoute = authRoutes.includes(pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-amber-200/60 bg-[rgba(255,250,242,0.86)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)] text-sm font-bold text-[var(--primary-contrast)] shadow-lg shadow-amber-500/20">
            AF
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--accent-strong)]">
              AI Firewall
            </p>
            <p className="text-xs text-[var(--muted)]">Secure SaaS control center</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {!isAuthRoute && isAuthenticated ? (
            <>
              <nav className="hidden items-center gap-2 rounded-full border border-amber-200/70 bg-white/90 p-1 md:flex">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        isActive
                          ? "bg-[var(--primary)] text-[var(--primary-contrast)]"
                          : "text-slate-700 hover:bg-[var(--accent-soft)] hover:text-[var(--primary)]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-900">
                  {user?.name || user?.email || "Authenticated"}
                </p>
                <p className="text-xs text-[var(--muted)]">Protected session</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--primary)]"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="rounded-full border border-transparent px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-amber-200 hover:bg-white hover:text-[var(--primary)]"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition hover:bg-[var(--accent-strong)]"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
