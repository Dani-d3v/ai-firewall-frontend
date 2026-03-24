"use client";

import { useEffect, useState } from "react";

import Loading from "@/components/Loading";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getDashboard } from "@/services/userService";

const getSubscriptionLabel = (dashboard) =>
  dashboard?.plan ||
  dashboard?.subscription?.plan ||
  dashboard?.subscription?.name ||
  "No active plan";

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
    return <Loading label="Loading dashboard..." />;
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-600">
            Dashboard
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            Your account snapshot
          </h1>
          <p className="max-w-2xl text-lg text-slate-600">
            Review your active subscription and how long the current plan remains valid.
          </p>
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-5 text-rose-600">
            {error}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xl shadow-slate-200/50 backdrop-blur-xl">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Current plan</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-950">
                {getSubscriptionLabel(dashboard)}
              </h2>
              <p className="mt-4 text-slate-600">
                Stay ahead of renewal cycles and keep your coverage active.
              </p>
            </div>

            <div className="rounded-[2rem] border border-cyan-200 bg-cyan-50 p-8 shadow-xl shadow-cyan-100/70">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-700">
                Days remaining
              </p>
              <h2 className="mt-4 text-5xl font-semibold text-slate-950">
                {getDaysRemaining(dashboard)}
              </h2>
              <p className="mt-4 text-slate-600">
                This value is pulled directly from the backend dashboard endpoint.
              </p>
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
