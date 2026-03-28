"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import Loading from "@/components/Loading";
import { useAuth } from "@/context/AuthContext";

const capabilities = [
  {
    title: "AI Shield",
    description:
      "Live AI-driven threat detection watches traffic behavior and raises mitigation alerts the moment an attack pattern emerges.",
  },
  {
    title: "VPN Access",
    description:
      "Each active subscription provisions customer-specific WireGuard settings so protected connectivity is ready after purchase.",
  },
  {
    title: "Live Notifications",
    description:
      "The customer dashboard receives real-time security notifications from the backend stream for immediate visibility.",
  },
];

const servicePanels = [
  {
    label: "Detection",
    heading: "Explainable AI mitigation",
    copy:
      "BRADSafe correlates hostile traffic signals, scores the attack, and explains why the system intervened so teams can trust the action.",
  },
  {
    label: "Provisioning",
    heading: "Subscription-based protection",
    copy:
      "Customers choose a plan, create an account, pay, and immediately receive the VPN and subscription state returned by the backend.",
  },
  {
    label: "Operations",
    heading: "A dashboard built for response",
    copy:
      "Notifications, profile data, subscription controls, settings, and VPN configuration all live in one protected workspace.",
  },
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
    return <Loading label="Opening your dashboard..." />;
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-10">
        <div className="grid gap-8 rounded-[2.5rem] border border-amber-200/80 bg-[rgba(255,252,247,0.9)] p-8 shadow-2xl shadow-amber-100/60 lg:grid-cols-[1.15fr_0.85fr] lg:p-12">
          <div className="space-y-6">
            <p className="inline-flex rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-[var(--accent-strong)]">
              Company dashboard
            </p>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
                One dashboard for AI protection, VPN access, and customer security operations.
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-slate-600">
                BRADSafe helps customers subscribe to protected VPN service, monitor live
                mitigation alerts, review their profile and plan details, and manage account
                access from a single secure experience.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/subscriptions"
                className="rounded-full bg-[var(--accent)] px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition hover:bg-[var(--accent-strong)]"
              >
                Get Service Now
              </Link>
              <Link
                href="/auth/login"
                className="rounded-full border border-amber-200 bg-white px-7 py-3 text-sm font-semibold text-slate-900 transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
              >
                Existing customer login
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] bg-[linear-gradient(145deg,#fff7ed,#ffffff_55%,#fef3c7_100%)] p-6 ring-1 ring-amber-200">
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent-strong)]">
                    Customer view
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    What users see after payment
                  </h2>
                </div>
                <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
                  Live protected
                </div>
              </div>
              <div className="grid gap-4">
                <div className="rounded-2xl bg-white p-5 ring-1 ring-amber-100">
                  <p className="text-sm font-semibold text-slate-900">Notifications tab</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Real-time alert events from the dashboard stream explain when BRADSafe
                    mitigates suspicious traffic.
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-5 ring-1 ring-amber-100">
                  <p className="text-sm font-semibold text-slate-900">Subscription tab</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Customers can see their active plan, billing status, validity period, and
                    cancellation flow with confirmation.
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-5 ring-1 ring-amber-100">
                  <p className="text-sm font-semibold text-slate-900">VPN config tab</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    WireGuard details, config download, public key, assigned address, and
                    gateway connection settings are available in one place.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {capabilities.map((capability) => (
            <article
              key={capability.title}
              className="rounded-[2rem] border border-amber-200 bg-white/90 p-6 shadow-xl shadow-amber-100/40"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--accent-strong)]">
                {capability.title}
              </p>
              <p className="mt-4 text-base leading-8 text-slate-600">{capability.description}</p>
            </article>
          ))}
        </div>

        <div className="rounded-[2.5rem] border border-amber-200 bg-[rgba(255,255,255,0.82)] p-8 shadow-xl shadow-amber-100/40 lg:p-10">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--accent-strong)]">
              What we provide
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
              The entire customer journey is built around the backend API flow.
            </h2>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {servicePanels.map((panel) => (
              <article
                key={panel.heading}
                className="rounded-[2rem] border border-amber-100 bg-[var(--surface-soft)] p-6"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">
                  {panel.label}
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-950">{panel.heading}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">{panel.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
