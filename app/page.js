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
    return <Loading label="Initializing BRADSafe command environment..." />;
  }

  if (isAuthenticated) {
    return <Loading label="Routing to the active defense console..." />;
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-81px)] w-full max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center rounded-full border border-emerald-500/30 bg-slate-950 px-4 py-2 text-sm font-medium text-emerald-300 shadow-sm">
            SOC-grade AI Security Gateway for autonomous cyber defense
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
              className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400"
            >
              Launch BRADSafe
            </Link>
            <Link
              href="/auth/login"
              className="rounded-full border border-slate-800 bg-slate-950 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-amber-400/50 hover:bg-amber-500/10 hover:text-amber-200"
            >
              Operator access
            </Link>
          </div>
          <div className="grid gap-3">
            {highlights.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/90 px-4 py-4 shadow-sm backdrop-blur"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] font-semibold uppercase text-emerald-300">
                  AI
                </span>
                <p className="text-sm font-medium text-slate-100">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-800 bg-slate-950/90 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="rounded-[1.75rem] bg-[linear-gradient(145deg,#020617,#0f172a_55%,#1e293b_78%,#3f0f1b)] p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
                  Live defense fabric
                </p>
                <h2 className="mt-3 text-2xl font-semibold">BRADSafe operations center</h2>
              </div>
              <div className="rounded-full bg-emerald-500/15 px-4 py-2 text-sm text-emerald-200 ring-1 ring-emerald-400/30">
                Active mitigation
              </div>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-emerald-500/8 p-5 ring-1 ring-emerald-400/15">
                <p className="text-sm text-emerald-200">AI Confidence Index</p>
                <p className="mt-2 text-3xl font-semibold">98.4%</p>
                <p className="mt-3 text-sm text-slate-400">
                  Random Forest consensus indicates a high-probability malicious pattern,
                  so mitigation can be justified before the attack escalates.
                </p>
              </div>
              <div className="rounded-2xl bg-[rgba(190,24,93,0.18)] p-5 ring-1 ring-rose-500/20">
                <p className="text-sm text-rose-200">Ingress Flow Rate</p>
                <p className="mt-2 text-3xl font-semibold">12.8 Gbps</p>
                <p className="mt-3 text-sm text-rose-100/80">
                  Autonomous prevention is throttling a hostile surge while preserving
                  benign sessions at the edge.
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-700/80 bg-slate-950/50 p-5">
              <p className="text-sm text-amber-200">Why the AI acted</p>
              <p className="mt-2 text-sm leading-7 text-slate-300">
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
