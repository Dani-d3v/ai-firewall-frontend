"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import Loading from "@/components/Loading";
import { useAuth } from "@/context/AuthContext";

const highlights = [
  "Random Forest threat detection for DDoS and insider threat activity",
  "Real-time packet inspection with AI-backed mitigation decisions",
  "Operator-grade access control with OTP verification and timed session expiry",
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
    return <Loading label="Loading BRADSafe..." />;
  }

  if (isAuthenticated) {
    return <Loading label="Opening dashboard..." />;
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-81px)] w-full max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-medium text-[var(--accent-strong)] shadow-sm">
            Real-time AI Security Gateway for modern cyber defense
          </div>
          <div className="space-y-5">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
              Detect hostile ingress, explain the threat, and trigger mitigation before impact.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              BRADSafe gives security teams a live operations layer for AI-guided packet
              inspection, threat scoring, operator access, and subscription control.
              Every alert is framed with the reason behind the action so mitigation feels
              immediate, accountable, and unbreakable.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/auth/register"
              className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition hover:bg-[var(--accent-strong)]"
            >
              Register
            </Link>
            <Link
              href="/auth/login"
              className="rounded-full border border-amber-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
            >
              Login
            </Link>
          </div>
          <div className="grid gap-3">
            {highlights.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-white px-4 py-4 shadow-sm backdrop-blur"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] font-semibold uppercase text-emerald-300">
                  AI
                </span>
                <p className="text-sm font-medium text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-amber-200 bg-[var(--surface)] p-6 shadow-2xl shadow-amber-100/60 backdrop-blur-xl">
          <div className="rounded-[1.75rem] bg-[linear-gradient(145deg,#fff7ed,#fffbf5_55%,#fef3c7_100%)] p-6 text-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent-strong)]">
                  Live defense fabric
                </p>
                <h2 className="mt-3 text-2xl font-semibold">BRADSafe operations center</h2>
              </div>
              <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200">
                Active mitigation
              </div>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-5 ring-1 ring-emerald-100">
                <p className="text-sm text-emerald-700">AI Confidence Index</p>
                <p className="mt-2 text-3xl font-semibold">98.4%</p>
                <p className="mt-3 text-sm text-slate-600">
                  Random Forest consensus indicates a high-probability malicious pattern,
                  so mitigation can be justified before the attack escalates.
                </p>
              </div>
              <div className="rounded-2xl bg-white p-5 ring-1 ring-rose-100">
                <p className="text-sm text-rose-700">Ingress Flow Rate</p>
                <p className="mt-2 text-3xl font-semibold">12.8 Gbps</p>
                <p className="mt-3 text-sm text-slate-600">
                  Autonomous prevention is throttling a hostile surge while preserving
                  benign sessions at the edge.
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-amber-200 bg-white/80 p-5">
              <p className="text-sm text-[var(--accent-strong)]">Why the AI acted</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                BRADSafe correlated packet velocity, protocol behavior, and anomaly drift
                against known DDoS and insider threat signatures, then escalated to active
                mitigation because the attack confidence crossed the automated response
                threshold.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
