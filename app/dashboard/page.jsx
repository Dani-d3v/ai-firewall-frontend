"use client";

import { Suspense, useEffect, useEffectEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Loading from "@/components/Loading";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import {
  cancelSubscription,
  downloadWireguardConfig,
  getCurrentSubscription,
  getSubscriptionHistory,
  getVpnAccessState,
} from "@/services/subscriptionService";
import { getDashboard, getProfile } from "@/services/userService";
import { clearWireguardSession, getWireguardSession } from "@/utils/storage";
import { buildWireguardConfig, downloadTextFile, formatWireguardConfigFromAccessState } from "@/utils/wireguard";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "notifications", label: "Notifications" },
  { id: "subscription", label: "Subscription" },
  { id: "profile", label: "Profile" },
  { id: "vpn", label: "VPN Config" },
  { id: "settings", label: "Settings" },
];

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

const normalizeHistory = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.history)) {
    return value.history;
  }

  return [];
};

const fetchDashboardBundle = async () => {
  const [dashboardData, profileData, subscriptionData, historyData, vpnData] =
    await Promise.allSettled([
      getDashboard(),
      getProfile(),
      getCurrentSubscription(),
      getSubscriptionHistory(),
      getVpnAccessState(),
    ]);

  return {
    dashboardData,
    profileData,
    subscriptionData,
    historyData,
    vpnData,
  };
};

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, user: authUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
  const [dashboard, setDashboard] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [history, setHistory] = useState([]);
  const [vpnAccess, setVpnAccess] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [streamStatus, setStreamStatus] = useState("Connecting");
  const [wireguardKeys, setWireguardKeys] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const currentUser = profile || authUser || dashboard?.user || null;
  const vpnStatusRecord = vpnAccess || profile?.vpn || null;
  const lastSyncedAt = vpnStatusRecord?.lastSyncedAt || subscription?.lastSyncedAt || null;
  const lastSyncError = vpnStatusRecord?.lastSyncError || subscription?.lastSyncError || "";
  const isSubscriptionInactive = !subscription?.isActive;
  const daysRemaining = useMemo(
    () => getDaysRemaining(subscription?.validUntil || subscription?.endDate),
    [subscription?.endDate, subscription?.validUntil],
  );

  const refreshData = async () => {
    try {
      const { dashboardData, profileData, subscriptionData, historyData, vpnData } =
        await fetchDashboardBundle();

      if (dashboardData.status === "fulfilled") {
        setDashboard(dashboardData.value);
        setAlerts(Array.isArray(dashboardData.value?.recentAlerts) ? dashboardData.value.recentAlerts : []);
      }

      if (profileData.status === "fulfilled") {
        setProfile(profileData.value);
      }

      if (subscriptionData.status === "fulfilled") {
        setSubscription(subscriptionData.value);
      } else {
        setSubscription(null);
      }

      if (historyData.status === "fulfilled") {
        setHistory(normalizeHistory(historyData.value));
      }

      if (vpnData.status === "fulfilled") {
        setVpnAccess(vpnData.value);
      } else {
        setVpnAccess(null);
      }

      if (
        dashboardData.status === "rejected" &&
        profileData.status === "rejected" &&
        subscriptionData.status === "rejected"
      ) {
        throw dashboardData.reason;
      }
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIncomingAlert = useEffectEvent((alert) => {
    setAlerts((current) => [alert, ...current].slice(0, 8));
  });

  useEffect(() => {
    setWireguardKeys(getWireguardSession());
    refreshData();
  }, []);

  useEffect(() => {
    const requestedTab = searchParams.get("tab");

    if (requestedTab && tabs.some((tab) => tab.id === requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [searchParams]);

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
          throw new Error("Unable to connect to the live notification stream.");
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

  const selectTab = (tabId) => {
    setActiveTab(tabId);
    const nextSearch = new URLSearchParams(searchParams.toString());
    nextSearch.set("tab", tabId);
    router.replace(`/dashboard?${nextSearch.toString()}`);
  };

  const handleCancelSubscription = async () => {
    if (!confirmCancel) {
      setConfirmCancel(true);
      return;
    }

    setError("");
    setSuccess("");
    setIsCancelling(true);

    try {
      await cancelSubscription();
      clearWireguardSession();
      setWireguardKeys(null);
      setConfirmCancel(false);
      setSuccess("Your subscription was cancelled and the VPN state was revoked.");
      await refreshData();
    } catch (cancelError) {
      setError(cancelError.message);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDownloadConfig = async () => {
    if (!wireguardKeys?.privateKey) {
      setError("No local WireGuard private key was found. Payment must be completed from this browser to download the config.");
      return;
    }

    setError("");
    setSuccess("");
    setIsDownloading(true);

    try {
      try {
        const template = await downloadWireguardConfig();
        const config = buildWireguardConfig({
          template: template.content,
          privateKey: wireguardKeys.privateKey,
        });

        downloadTextFile({
          content: config,
          fileName: template.fileName,
        });
      } catch {
        if (!vpnAccess) {
          throw new Error("VPN access is not active yet, so no configuration can be downloaded.");
        }

        downloadTextFile({
          content: formatWireguardConfigFromAccessState(vpnAccess, wireguardKeys.privateKey),
          fileName: "vectraflow.conf",
        });
      }

      setSuccess("WireGuard configuration downloaded successfully.");
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const vpnConfigPreview =
    wireguardKeys?.privateKey && vpnAccess
      ? formatWireguardConfigFromAccessState(vpnAccess, wireguardKeys.privateKey)
      : null;

  if (isLoading) {
    return <Loading label="Loading dashboard..." />;
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div className="grid gap-6 rounded-[2.5rem] border border-amber-200 bg-[rgba(255,252,247,0.92)] p-8 shadow-2xl shadow-amber-100/50 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--accent-strong)]">
              Customer dashboard
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Welcome back, {currentUser?.name || currentUser?.email || "customer"}.
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-slate-600">
              This dashboard combines your live system notifications, subscription plan,
              customer profile, settings, and VPN details in separate tabs.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.75rem] border border-amber-100 bg-white p-5">
              <p className="text-sm uppercase tracking-[0.25em] text-emerald-700">Subscription</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">
                {subscription?.plan || "No active plan"}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Status: {subscription?.status || "inactive"}
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-amber-100 bg-white p-5">
              <p className="text-sm uppercase tracking-[0.25em] text-emerald-700">Days left</p>
              <p className="mt-3 text-4xl font-semibold text-slate-950">{daysRemaining}</p>
              <p className="mt-2 text-sm text-slate-600">
                Stream status: {streamStatus}
              </p>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-4 text-rose-600">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-emerald-700">
            {success}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => selectTab(tab.id)}
              className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-[var(--accent)] text-white shadow-lg shadow-amber-500/20"
                  : "border border-amber-200 bg-white text-slate-700 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-[2rem] border border-amber-200 bg-white p-6 shadow-xl shadow-amber-100/40">
              <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-strong)]">
                Latest protection status
              </p>
              <p className="mt-4 text-3xl font-semibold text-slate-950">
                {vpnStatusRecord?.status || "Not provisioned"}
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Assigned IP: {vpnAccess?.clientConfiguration?.address || profile?.vpn?.assignedIp || "Unavailable"}
              </p>
              {lastSyncError ? (
                <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                  Warning: Connection out of sync. Click to retry when an admin sync option is available.
                </div>
              ) : null}
            </div>
            <div className="rounded-[2rem] border border-amber-200 bg-white p-6 shadow-xl shadow-amber-100/40">
              <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-strong)]">
                Notifications received
              </p>
              <p className="mt-4 text-3xl font-semibold text-slate-950">{alerts.length}</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Live alert events from the backend appear in your notifications tab.
              </p>
            </div>
            <div className="rounded-[2rem] border border-amber-200 bg-white p-6 shadow-xl shadow-amber-100/40">
              <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-strong)]">
                Customer record
              </p>
              <p className="mt-4 text-3xl font-semibold text-slate-950">
                {currentUser?.role || "user"}
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Account updated: {formatDate(profile?.updatedAt)}
              </p>
            </div>
          </div>
        ) : null}

        {activeTab === "notifications" ? (
          <div className="rounded-[2rem] border border-amber-200 bg-white p-6 shadow-xl shadow-amber-100/40">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-strong)]">
                  System notifications
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-950">Live mitigation alerts</h2>
              </div>
              <div className="rounded-full border border-amber-200 bg-[var(--surface-soft)] px-4 py-2 text-sm text-slate-700">
                {streamStatus}
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {alerts.length ? (
                alerts.map((alert, index) => (
                  <article
                    key={alert?._id || `${alert?.mitigatedAt || "alert"}-${index}`}
                    className="rounded-[1.75rem] border border-amber-100 bg-[var(--surface-soft)] px-5 py-5"
                  >
                    <p className="font-semibold text-slate-900">
                      {alert?.message || "Live mitigation alert received."}
                    </p>
                    <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                      <p>Attacker IP: {alert?.attackerIp || "Unknown"}</p>
                      <p>Victim VPN IP: {alert?.victimVpnIp || "Unknown"}</p>
                      <p>Mitigated at: {formatDate(alert?.mitigatedAt)}</p>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[1.75rem] border border-dashed border-amber-200 px-5 py-6 text-sm text-slate-500">
                  No notifications yet. New backend alert events will appear here automatically.
                </div>
              )}
            </div>
          </div>
        ) : null}

        {activeTab === "subscription" ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
            <div className="rounded-[2rem] border border-amber-200 bg-white p-6 shadow-xl shadow-amber-100/40">
              <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-strong)]">
                Active subscription
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">
                {subscription?.plan || "No active plan"}
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-amber-100 bg-[var(--surface-soft)] px-4 py-4 text-sm text-slate-600">
                  Status: {subscription?.status || "inactive"}
                </div>
                <div className="rounded-2xl border border-amber-100 bg-[var(--surface-soft)] px-4 py-4 text-sm text-slate-600">
                  Active: {subscription?.isActive ? "Yes" : "No"}
                </div>
                <div className="rounded-2xl border border-amber-100 bg-[var(--surface-soft)] px-4 py-4 text-sm text-slate-600">
                  Start: {formatDate(subscription?.startDate)}
                </div>
                <div className="rounded-2xl border border-amber-100 bg-[var(--surface-soft)] px-4 py-4 text-sm text-slate-600">
                  Valid until: {formatDate(subscription?.validUntil || subscription?.endDate)}
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                Transaction ID: {subscription?.transactionId || "Not available"}
              </p>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>Last synced to gateway: {formatDate(lastSyncedAt)}</p>
                {lastSyncError ? (
                  <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-4 text-amber-800">
                    Warning: Connection out of sync. Click to retry.
                    <div className="mt-2 text-sm font-medium">Last sync error: {lastSyncError}</div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-white p-6 shadow-xl shadow-amber-100/40">
              <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-strong)]">
                Cancel service
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Cancelling immediately sets the subscription inactive and revokes VPN status in
                the backend.
              </p>
              {confirmCancel ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                  Press the cancel button again to confirm.
                </div>
              ) : null}
              <button
                type="button"
                onClick={handleCancelSubscription}
                disabled={!subscription?.isActive || isCancelling}
                className="mt-6 w-full rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCancelling ? "Cancelling..." : confirmCancel ? "Confirm Cancellation" : "Cancel Subscription"}
              </button>

              <div className="mt-6">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
                  History
                </p>
                <div className="mt-3 space-y-3">
                  {history.length ? (
                    history.map((item, index) => (
                      <div
                        key={item?._id || `${item?.plan || "history"}-${index}`}
                        className="rounded-2xl border border-amber-100 bg-[var(--surface-soft)] px-4 py-4 text-sm text-slate-600"
                      >
                        {item?.plan || item?.name || "Subscription record"} | {item?.status || "Status unavailable"}
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-dashed border-amber-200 px-4 py-4 text-sm text-slate-500">
                      The backend history array may still be empty even after changes.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "profile" ? (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[2rem] border border-amber-200 bg-white p-6 shadow-xl shadow-amber-100/40">
              <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-strong)]">Name</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {profile?.name || currentUser?.name || "Not available"}
              </p>
            </div>
            <div className="rounded-[2rem] border border-amber-200 bg-white p-6 shadow-xl shadow-amber-100/40">
              <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-strong)]">Email</p>
              <p className="mt-3 break-all text-3xl font-semibold text-slate-950">
                {profile?.email || currentUser?.email || "Not available"}
              </p>
            </div>
            <div className="rounded-[2rem] border border-amber-200 bg-white p-6 shadow-xl shadow-amber-100/40">
              <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-strong)]">Role</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{profile?.role || "user"}</p>
            </div>
            <div className="rounded-[2rem] border border-amber-200 bg-white p-6 shadow-xl shadow-amber-100/40">
              <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-strong)]">
                Created at
              </p>
              <p className="mt-3 text-xl font-semibold text-slate-950">{formatDate(profile?.createdAt)}</p>
            </div>
          </div>
        ) : null}

        {activeTab === "vpn" ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
            <div className="rounded-[2rem] border border-amber-200 bg-white p-6 shadow-xl shadow-amber-100/40">
              <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-strong)]">
                VPN configuration
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">
                {vpnAccess?.status || profile?.vpn?.status || "Unavailable"}
              </h2>
              <div className="mt-6 space-y-3 text-sm text-slate-600">
                <p>Assigned IP: {vpnAccess?.clientConfiguration?.address || profile?.vpn?.assignedIp || "Not assigned"}</p>
                <p>DNS: {vpnAccess?.clientConfiguration?.dns || "Not available"}</p>
                <p>Gateway endpoint: {vpnAccess?.gatewayConfiguration?.endpoint || "Not available"}</p>
                <p>Gateway key: {vpnAccess?.gatewayConfiguration?.hostPublicKey || "Not available"}</p>
                <p>User public key: {vpnAccess?.clientConfiguration?.userPublicKey || profile?.vpn?.publicKey || "Not available"}</p>
                <p>Local private key: {wireguardKeys?.privateKey || "Not available in this browser"}</p>
                <p>Last synced to gateway: {formatDate(lastSyncedAt)}</p>
                <p>Provisioned at: {formatDate(profile?.vpn?.lastProvisionedAt)}</p>
              </div>
              {lastSyncError ? (
                <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                  Warning icon: Connection out of sync. Click to retry.
                  <div className="mt-2 font-medium">Error: {lastSyncError}</div>
                </div>
              ) : null}
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-white p-6 shadow-xl shadow-amber-100/40">
              <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-strong)]">
                Download and use
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Download the config template with your locally stored private key inserted.
              </p>
              <div className="mt-4 rounded-2xl border border-amber-100 bg-[var(--surface-soft)] px-4 py-4 text-sm text-slate-600">
                Local public key: {wireguardKeys?.publicKey || "No local keypair stored in this browser"}
              </div>
              <div className="mt-4 rounded-2xl border border-amber-100 bg-slate-950 p-4 text-sm text-slate-100">
                <p className="mb-3 font-semibold text-white">Ready-to-use config</p>
                {vpnConfigPreview ? (
                  <pre className="overflow-x-auto whitespace-pre-wrap break-all">
                    {vpnConfigPreview}
                  </pre>
                ) : (
                  <p className="text-slate-300">
                    The full config with private key can only be shown in the same browser that created the WireGuard keypair during payment.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleDownloadConfig}
                disabled={isDownloading || isSubscriptionInactive}
                title={
                  isSubscriptionInactive
                    ? "Subscription inactive. Access to BRADSafe Gateway revoked."
                    : "Download WireGuard configuration"
                }
                className="mt-6 w-full rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDownloading ? "Preparing config..." : "Download WireGuard Config"}
              </button>
              {isSubscriptionInactive ? (
                <p className="mt-3 text-sm text-slate-500">
                  Subscription inactive. Access to BRADSafe Gateway revoked.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {activeTab === "settings" ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-amber-200 bg-white p-6 shadow-xl shadow-amber-100/40">
              <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-strong)]">
                Session settings
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Your login session is controlled by the backend token and expires automatically
                when the token expires.
              </p>
              <button
                type="button"
                onClick={logout}
                className="mt-6 rounded-2xl border border-amber-200 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
              >
                Logout
              </button>
            </div>
            <div className="rounded-[2rem] border border-amber-200 bg-white p-6 shadow-xl shadow-amber-100/40">
              <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-strong)]">
                Account notes
              </p>
              <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600">
                <p>Protected requests automatically include the bearer token from local storage.</p>
                <p>Live notifications come from the dashboard SSE stream.</p>
                <p>Subscription access is enabled only when `subscription.isActive === true`.</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<Loading label="Loading dashboard..." />}>
        <DashboardContent />
      </Suspense>
    </ProtectedRoute>
  );
}
