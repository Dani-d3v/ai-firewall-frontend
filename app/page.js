"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import Loading from "@/components/Loading";
import { useAuth } from "@/context/AuthContext";

const highlights = [
  "Secure onboarding with OTP verification",
  "Protected subscription and billing management",
  "Token persistence with automatic session expiry handling",
];

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <Loading label="Preparing your workspace..." />;
  }

  if (isAuthenticated) {
    return <Loading label="Opening dashboard..." />;
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-81px)] w-full max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 shadow-sm">
            SaaS security frontend powered by Next.js App Router
          </div>
          <div className="space-y-5">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
              Secure subscriptions, onboarding, and user control in one clean dashboard.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              AI Firewall gives teams a polished client experience for authentication,
              subscription operations, and account management without compromising on
              clarity or resilience.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/auth/register"
              className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition hover:bg-[var(--accent-strong)]"
            >
              Create account
            </Link>
            <Link
              href="/auth/login"
              className="rounded-full border border-amber-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
            >
              Sign in
            </Link>
          </div>
          <div className="grid gap-3">
            {highlights.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 shadow-sm backdrop-blur"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[11px] font-semibold uppercase text-[var(--accent-strong)]">
                  OK
                </span>
                <p className="text-sm font-medium text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl shadow-amber-100/60 backdrop-blur-xl">
          <div className="rounded-[1.75rem] bg-[linear-gradient(145deg,#111827,#1f2937_60%,#7c2d12)] p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
                  Live account
                </p>
                <h2 className="mt-3 text-2xl font-semibold">Security command center</h2>
              </div>
              <div className="rounded-full bg-white/10 px-4 py-2 text-sm text-amber-100">
                Active
              </div>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/5 p-5">
                <p className="text-sm text-slate-300">Session policy</p>
                <p className="mt-2 text-3xl font-semibold">Auto Logout</p>
                <p className="mt-3 text-sm text-slate-400">
                  Expired tokens are cleared automatically to keep access safe.
                </p>
              </div>
              <div className="rounded-2xl bg-amber-500/15 p-5">
                <p className="text-sm text-amber-200">Billing workflows</p>
                <p className="mt-2 text-3xl font-semibold">Integrated</p>
                <p className="mt-3 text-sm text-amber-100/80">
                  Plans, purchase actions, and subscription history from one place.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
