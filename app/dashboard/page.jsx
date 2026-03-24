"use client";

import { useEffect, useState } from "react";

import Loading from "@/components/Loading";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getDashboard } from "@/services/userService";

const getSubscriptionLabel = (dashboard) =>
  dashboard?.plan ||
  dashboard?.subscription?.plan ||
  dashboard?.subscription?.name ||
  "No active protection tier";

const getDaysRemaining = (dashboard) =>
  dashboard?.daysRemaining ??
  dashboard?.subscription?.daysRemaining ??
  dashboard?.remainingDays ??
  "N/A";

function DashboardContent() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await getDashboard();
        setDashboard(data);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (isLoading) {
    return <Loading label="Loading BRADSafe defense telemetry..." />;
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
            Defense Overview
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            Live BRADSafe command snapshot
          </h1>
          <p className="max-w-2xl text-lg text-slate-600">
            Review your active protection tier, service continuity window, and the current
            readiness posture of the AI Security Gateway.
          </p>
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 px-6 py-5 text-rose-200">
            {error}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-950/90 p-8 shadow-xl shadow-slate-950/30 backdrop-blur-xl xl:col-span-2">
              <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Active protection tier</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-100">
                {getSubscriptionLabel(dashboard)}
              </h2>
              <p className="mt-4 text-slate-400">
                This tier determines whether the gateway remains in Monitor Only mode or
                can escalate to Autonomous Prevention when threat confidence spikes.
              </p>
            </div>

            <div className="rounded-[2rem] border border-amber-400/30 bg-amber-500/10 p-8 shadow-xl shadow-amber-500/10">
              <p className="text-sm uppercase tracking-[0.25em] text-amber-200">
                Coverage window
              </p>
              <h2 className="mt-4 text-5xl font-semibold text-slate-950">
                {getDaysRemaining(dashboard)}
              </h2>
              <p className="mt-4 text-slate-700">
                Days remaining before the current protection tier requires renewal.
              </p>
            </div>

            <div className="rounded-[2rem] border border-emerald-500/30 bg-emerald-500/10 p-8 shadow-xl shadow-emerald-500/10">
              <p className="text-sm uppercase tracking-[0.25em] text-emerald-700">
                AI Confidence Index
              </p>
              <h2 className="mt-4 text-5xl font-semibold text-slate-950">98.4%</h2>
              <p className="mt-4 text-slate-700">
                Model certainty is high enough to justify rapid mitigation when hostile
                behavior is confirmed.
              </p>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-950/90 p-8 shadow-xl shadow-slate-950/30 backdrop-blur-xl md:col-span-2 xl:col-span-4">
              <p className="text-sm uppercase tracking-[0.25em] text-amber-300">
                Why the AI Acts
              </p>
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
                  <p className="text-sm font-semibold text-slate-100">Packet Inspection</p>
                  <p className="mt-2 text-sm leading-7 text-slate-400">
                    Ingress flow behavior is compared against learned Random Forest signals
                    to isolate DDoS bursts and insider-driven anomalies.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
                  <p className="text-sm font-semibold text-slate-100">Active Mitigation</p>
                  <p className="mt-2 text-sm leading-7 text-slate-400">
                    Response policy escalates when attack probability crosses the automated
                    threshold, reducing dwell time and preserving benign sessions.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
                  <p className="text-sm font-semibold text-slate-100">WireGuard Inspection</p>
                  <p className="mt-2 text-sm leading-7 text-slate-400">
                    Encrypted tunneling is being inspected at the termination point for
                    behavioral anomalies before traffic re-enters the protected network.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
