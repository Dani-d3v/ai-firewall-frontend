"use client";

import { useEffect, useState } from "react";

import Loading from "@/components/Loading";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  buyPlan,
  cancelSubscription,
  downloadWireguardConfig,
  getCurrentSubscription,
  getPlans,
  getSubscriptionHistory,
  getVpnAccessState,
  simulatePayment,
} from "@/services/subscriptionService";
import {
  clearWireguardSession,
  getWireguardSession,
  setWireguardSession,
} from "@/utils/storage";
import {
  buildWireguardConfig,
  downloadTextFile,
  formatWireguardConfigFromAccessState,
  generateWireguardKeyPair,
} from "@/utils/wireguard";

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.plans)) {
    return value.plans;
  }

  if (Array.isArray(value?.subscriptions)) {
    return value.subscriptions;
  }

  if (Array.isArray(value?.history)) {
    return value.history;
  }

  return [];
};

const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

function SubscriptionsContent() {
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [history, setHistory] = useState([]);
  const [vpnAccess, setVpnAccess] = useState(null);
  const [wireguardKeys, setWireguardKeys] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeAction, setActiveAction] = useState("");

  const fetchSubscriptionData = async () => {
    setIsLoading(true);
    setError("");

    try {
      const [plansResponse, currentResponse, historyResponse, vpnAccessResponse] =
        await Promise.allSettled([
          getPlans(),
          getCurrentSubscription(),
          getSubscriptionHistory(),
          getVpnAccessState(),
        ]);

      if (plansResponse.status === "fulfilled") {
        setPlans(normalizeList(plansResponse.value));
      }

      if (currentResponse.status === "fulfilled") {
        setCurrentPlan(currentResponse.value);
      } else {
        setCurrentPlan(null);
      }

      if (historyResponse.status === "fulfilled") {
        setHistory(normalizeList(historyResponse.value));
      }

      if (vpnAccessResponse.status === "fulfilled") {
        setVpnAccess(vpnAccessResponse.value);
      } else {
        setVpnAccess(null);
      }

      if (
        plansResponse.status === "rejected" &&
        currentResponse.status === "rejected" &&
        historyResponse.status === "rejected" &&
        vpnAccessResponse.status === "rejected"
      ) {
        setError(plansResponse.reason.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setWireguardKeys(getWireguardSession());
    fetchSubscriptionData();
  }, []);

  const ensureWireguardKeys = async () => {
    if (wireguardKeys?.publicKey && wireguardKeys?.privateKey) {
      return wireguardKeys;
    }

    const generatedKeys = await generateWireguardKeyPair();
    setWireguardSession(generatedKeys);
    setWireguardKeys(generatedKeys);

    return generatedKeys;
  };

  const handleAction = async (action, plan) => {
    setError("");
    setSuccess("");
    setActiveAction(`${action}-${plan?._id || plan?.id || plan?.name || "global"}`);

    try {
      if (action === "generate-keys") {
        await ensureWireguardKeys();
        setSuccess("A WireGuard keypair was generated locally for this device.");
      }

      if (action === "simulate") {
        const payment = await simulatePayment({
          planId: plan?._id || plan?.id,
          paymentMethod: "telebirr",
        });
        setSuccess(
          `Payment simulation completed for ${plan?.name || "the selected tier"} with transaction ${payment?.transactionId || "created"}.`,
        );
      }

      if (action === "buy") {
        const keys = await ensureWireguardKeys();
        const payment = await simulatePayment({
          planId: plan?._id || plan?.id,
          paymentMethod: "telebirr",
        });
        const purchase = await buyPlan({
          planId: plan?._id || plan?.id,
          paymentId: payment?._id,
          wireguardPublicKey: keys.publicKey,
        });

        setCurrentPlan(purchase?.subscription || null);
        setVpnAccess(purchase?.vpn || null);
        setSuccess(
          `${plan?.name || "Selected tier"} is active and VPN access has been provisioned for this device.`,
        );
      }

      if (action === "cancel") {
        await cancelSubscription();
        setCurrentPlan(null);
        setVpnAccess(null);
        clearWireguardSession();
        setWireguardKeys(null);
        setSuccess("Active protection tier withdrawn successfully.");
      }

      if (action === "download-config") {
        if (!wireguardKeys?.privateKey) {
          throw new Error("Generate or restore a WireGuard keypair before downloading the config.");
        }

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
            throw new Error("VPN access is not active yet, so there is no configuration to download.");
          }

          downloadTextFile({
            content: formatWireguardConfigFromAccessState(vpnAccess, wireguardKeys.privateKey),
            fileName: "vectraflow.conf",
          });
        }

        setSuccess("WireGuard configuration downloaded with your locally stored private key inserted.");
      }

      await fetchSubscriptionData();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setActiveAction("");
    }
  };

  if (isLoading) {
    return <Loading label="Loading subscriptions..." />;
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--accent-strong)]">
            Protection Tiers
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            Manage your BRADSafe subscription and VPN access
          </h1>
          <p className="max-w-3xl text-lg text-slate-600">
            Review the three BRADSafe tiers, provision VPN access, and download the
            WireGuard config generated for your active subscription.
          </p>
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

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-amber-200 bg-white p-6 shadow-xl shadow-amber-100/50 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">
                    Current plan
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                    {currentPlan?.plan || currentPlan?.name || "No active subscription"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleAction("cancel")}
                  disabled={!currentPlan?.isActive || activeAction === "cancel-global"}
                  className="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {activeAction === "cancel-global" ? "Cancelling..." : "Cancel"}
                </button>
              </div>
              <div className="mt-5 grid gap-3 text-sm text-slate-600">
                <p>Status: {currentPlan?.status || "N/A"}</p>
                <p>Active: {currentPlan?.isActive ? "Yes" : "No"}</p>
                <p>Ends on: {formatDate(currentPlan?.validUntil || currentPlan?.endDate)}</p>
                <p>Transaction ID: {currentPlan?.transactionId || "Not available"}</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-white p-6 shadow-xl shadow-amber-100/40">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">WireGuard keys</p>
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-amber-100 bg-[var(--surface-soft)] px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">Public key</p>
                  <p className="mt-2 break-all text-sm text-slate-600">
                    {wireguardKeys?.publicKey || "No local keypair generated yet."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAction("generate-keys")}
                  disabled={activeAction === "generate-keys-global"}
                  className="w-full rounded-2xl border border-amber-300 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {activeAction === "generate-keys-global" ? "Generating..." : "Generate local keypair"}
                </button>
                <button
                  type="button"
                  onClick={() => handleAction("download-config")}
                  disabled={!currentPlan?.isActive || activeAction === "download-config-global"}
                  className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {activeAction === "download-config-global" ? "Preparing..." : "Download WireGuard config"}
                </button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-white p-6 shadow-xl shadow-amber-100/40">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">VPN access</p>
              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <p>Status: {vpnAccess?.status || "Unavailable"}</p>
                <p>Active: {vpnAccess?.isActive ? "Yes" : "No"}</p>
                <p>Valid until: {formatDate(vpnAccess?.validUntil)}</p>
                <p>Address: {vpnAccess?.clientConfiguration?.address || "Not assigned"}</p>
                <p>Endpoint: {vpnAccess?.gatewayConfiguration?.endpoint || "Not available"}</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-white p-6 shadow-xl shadow-amber-100/40">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
                Protection history
              </p>
              <div className="mt-5 space-y-3">
                {history.length ? (
                  history.map((item, index) => (
                    <div
                      key={item?._id || item?.id || `${item?.plan || "history"}-${index}`}
                      className="rounded-2xl border border-amber-100 bg-[var(--surface-soft)] px-4 py-4"
                    >
                      <p className="font-semibold text-slate-900">
                        {item?.plan || item?.name || "Protection tier"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item?.status || "Status unavailable"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    The backend currently exposes the history array, but it may still be empty
                    even after a purchase or cancellation.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {plans.length ? (
              plans.map((plan, index) => {
                const planId = plan?._id || plan?.id || index;
                const buyActionKey = `buy-${planId}`;
                const simulateActionKey = `simulate-${planId}`;
                const durationLabel = plan?.name?.split(" - ").at(-1) || `${plan?.duration} days`;
                const isCurrentPlan = currentPlan?.planId === plan?._id;

                return (
                  <article
                    key={planId}
                    className="rounded-[2rem] border border-amber-200 bg-white p-6 shadow-xl shadow-amber-100/50 backdrop-blur-xl"
                  >
                    <div className="space-y-3">
                      <p className="text-sm uppercase tracking-[0.25em] text-emerald-700">
                        BRADSafe tier
                      </p>
                      <h2 className="text-2xl font-semibold text-slate-950">
                        {plan?.name || `Plan ${index + 1}`}
                      </h2>
                      <p className="text-slate-600">
                        {durationLabel} of BRADSafe access with VPN Access, Download Config,
                        and AI Shield features.
                      </p>
                    </div>
                    <div className="mt-6">
                      <p className="text-4xl font-semibold text-slate-950">
                        ${plan?.price ?? "0"}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Duration: {plan?.duration || "N/A"} days
                      </p>
                    </div>
                    <div className="mt-6 rounded-2xl border border-amber-100 bg-[var(--surface-soft)] px-4 py-4">
                      <p className="text-sm font-medium text-slate-700">
                        {plan?.features?.join(" | ")}
                      </p>
                    </div>
                    <div className="mt-6 flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleAction("simulate", plan)}
                        disabled={activeAction === simulateActionKey}
                        className="flex-1 rounded-2xl border border-amber-300 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {activeAction === simulateActionKey ? "Processing..." : "Simulate payment"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction("buy", plan)}
                        disabled={activeAction === buyActionKey || isCurrentPlan}
                        className="flex-1 rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {activeAction === buyActionKey
                          ? "Provisioning..."
                          : isCurrentPlan
                            ? "Current plan"
                            : "Buy and activate"}
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-[2rem] border border-dashed border-amber-200 bg-white p-8 text-slate-500 md:col-span-2">
                No protection tiers are available from the backend yet. Once provisionable
                offerings are exposed, they will appear here for operator review.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function SubscriptionsPage() {
  return (
    <ProtectedRoute>
      <SubscriptionsContent />
    </ProtectedRoute>
  );
}
