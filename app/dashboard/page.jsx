"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";

import Loading from "@/components/Loading";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { getDashboard } from "@/services/userService";

const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const getDaysRemaining = (value) => {
  if (!value) {
    return "N/A";
  }

  const remainingMs = new Date(value).getTime() - Date.now();

  if (remainingMs <= 0) {
    return 0;
  }

  return Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
};

function DashboardContent() {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [streamStatus, setStreamStatus] = useState("Connecting");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const subscription = dashboard?.subscription || null;
  const vpn = dashboard?.vpn || null;
  const user = dashboard?.user || null;
  const daysRemaining = useMemo(
    () => getDaysRemaining(subscription?.validUntil || subscription?.endDate),
    [subscription?.endDate, subscription?.validUntil],
  );

  const handleIncomingAlert = useEffectEvent((alert) => {
    setAlerts((current) => [alert, ...current].slice(0, 8));
  });

  useEffect(() => {
    const fetchDashboardSummary = async () => {
      try {
        const data = await getDashboard();
        setDashboard(data);
        setAlerts(Array.isArray(data?.recentAlerts) ? data.recentAlerts : []);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardSummary();
  }, []);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    let isActive = true;
    const abortController = new AbortController();

    const openStream = async () => {
      try {
        const response = await fetch("/backend/api/dashboard/stream", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: abortController.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error("Unable to start the live protection stream.");
        }

        setStreamStatus("Connected");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let currentEvent = "message";

        while (isActive) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() || "";

          events.forEach((eventBlock) => {
            const lines = eventBlock.split("\n");
            let dataPayload = "";

            lines.forEach((line) => {
              if (line.startsWith("event:")) {
                currentEvent = line.slice(6).trim();
              }

              if (line.startsWith("data:")) {
                dataPayload += `${line.slice(5).trim()}\n`;
              }
            });

            if (!dataPayload.trim()) {
              currentEvent = "message";
              return;
            }

            try {
              const parsedPayload = JSON.parse(dataPayload.trim());

              if (currentEvent === "alert") {
                handleIncomingAlert(parsedPayload);
              }

              if (currentEvent === "connected") {
                setStreamStatus("Connected");
              }
            } catch {
              setStreamStatus("Connected");
            }

            currentEvent = "message";
          });
        }
      } catch (streamError) {
        if (!abortController.signal.aborted) {
          setStreamStatus("Disconnected");
          setError((current) => current || streamError.message);
        }
      }
    };

    openStream();

    return () => {
      isActive = false;
      abortController.abort();
    };
  }, [token]);

  if (isLoading) {
    return <Loading label="Loading dashboard..." />;
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--accent-strong)]">
            Defense Overview
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            Live BRADSafe command snapshot
          </h1>
          <p className="max-w-2xl text-lg text-slate-600">
            Review your active protection tier, VPN readiness, and live AI mitigation
            alerts from the gateway stream.
          </p>
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-5 text-rose-600">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[2rem] border border-amber-200 bg-white p-8 shadow-xl shadow-amber-100/50 xl:col-span-2">
            <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-strong)]">
              Active protection tier
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950">
              {subscription?.plan || "No active protection tier"}
            </h2>
            <p className="mt-4 text-slate-600">
              Signed in as {user?.name || user?.email || "your account"} with{" "}
              {subscription?.isActive ? "active" : "inactive"} subscription access.
            </p>
          </div>

          <div className="rounded-[2rem] border border-amber-400/30 bg-amber-500/10 p-8 shadow-xl shadow-amber-500/10">
            <p className="text-sm uppercase tracking-[0.25em] text-amber-700">
              Coverage window
            </p>
            <h2 className="mt-4 text-5xl font-semibold text-slate-950">{daysRemaining}</h2>
            <p className="mt-4 text-slate-700">
              Days remaining before the current protection tier requires renewal.
            </p>
          </div>

          <div className="rounded-[2rem] border border-emerald-500/30 bg-emerald-500/10 p-8 shadow-xl shadow-emerald-500/10">
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-700">VPN Status</p>
            <h2 className="mt-4 text-4xl font-semibold text-slate-950">
              {vpn?.status || "Not provisioned"}
            </h2>
            <p className="mt-4 text-slate-700">
              Assigned tunnel: {vpn?.assignedIp || "Unavailable"}.
            </p>
          </div>

          <div className="rounded-[2rem] border border-amber-200 bg-white p-8 shadow-xl shadow-amber-100/50 md:col-span-2">
            <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-strong)]">
              Live Alert Stream
            </p>
            <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-amber-100 bg-[var(--surface-soft)] px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Stream status</p>
                <p className="mt-1 text-sm text-slate-600">
                  {streamStatus} to `/api/dashboard/stream`
                </p>
              </div>
              <p className="text-sm font-medium text-slate-700">Alerts seen: {alerts.length}</p>
            </div>
            <div className="mt-4 space-y-3">
              {alerts.length ? (
                alerts.map((alert, index) => (
                  <article
                    key={alert?._id || `${alert?.mitigatedAt || "alert"}-${index}`}
                    className="rounded-2xl border border-amber-100 bg-white px-5 py-4"
                  >
                    <p className="font-semibold text-slate-900">
                      {alert?.message || "Live mitigation alert received."}
                    </p>
                    <div className="mt-2 space-y-1 text-sm text-slate-600">
                      <p>Attacker IP: {alert?.attackerIp || "Unknown"}</p>
                      <p>Victim VPN IP: {alert?.victimVpnIp || "Unknown"}</p>
                      <p>Mitigated at: {formatDate(alert?.mitigatedAt)}</p>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-amber-200 px-5 py-6 text-sm text-slate-500">
                  No live mitigation alerts yet. New `alert` events will appear here as soon
                  as the gateway pushes them.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-amber-200 bg-white p-8 shadow-xl shadow-amber-100/50 md:col-span-2">
            <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-strong)]">
              Service State
            </p>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-amber-100 bg-[var(--surface-soft)] px-5 py-4">
                <p className="text-sm font-semibold text-slate-900">Subscription</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Status: {subscription?.status || "inactive"}
                  <br />
                  Valid until: {formatDate(subscription?.validUntil || subscription?.endDate)}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-[var(--surface-soft)] px-5 py-4">
                <p className="text-sm font-semibold text-slate-900">VPN Access</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Public key: {vpn?.publicKey || "Unavailable"}
                  <br />
                  Provisioned: {formatDate(vpn?.lastProvisionedAt)}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600">
              Subscription history count reported by the backend:{" "}
              {dashboard?.subscriptionHistoryCount ?? 0}
            </p>
          </div>
        </div>
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
