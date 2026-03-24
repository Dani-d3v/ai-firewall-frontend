"use client";

import { useEffect, useState } from "react";

import Loading from "@/components/Loading";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  buyPlan,
  cancelSubscription,
  getCurrentSubscription,
  getPlans,
  getSubscriptionHistory,
  simulatePayment,
} from "@/services/subscriptionService";

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

function SubscriptionsContent() {
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeAction, setActiveAction] = useState("");

  const fetchSubscriptionData = async () => {
    setIsLoading(true);
    setError("");

    try {
      const [plansResponse, currentResponse, historyResponse] = await Promise.allSettled([
        getPlans(),
        getCurrentSubscription(),
        getSubscriptionHistory(),
      ]);

      if (plansResponse.status === "fulfilled") {
        setPlans(normalizeList(plansResponse.value));
      }

      if (currentResponse.status === "fulfilled") {
        setCurrentPlan(currentResponse.value);
      }

      if (historyResponse.status === "fulfilled") {
        setHistory(normalizeList(historyResponse.value));
      }

      if (
        plansResponse.status === "rejected" &&
        currentResponse.status === "rejected" &&
        historyResponse.status === "rejected"
      ) {
        setError(plansResponse.reason.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const handleAction = async (action, plan) => {
    setError("");
    setSuccess("");
    setActiveAction(`${action}-${plan?._id || plan?.id || plan?.name || "global"}`);

    try {
      if (action === "simulate") {
        await simulatePayment({
          planId: plan?._id || plan?.id,
          amount: plan?.price,
        });
        setSuccess(`Plan activation workflow simulated for ${plan?.name || "the selected tier"}.`);
      }

      if (action === "buy") {
        await buyPlan({
          planId: plan?._id || plan?.id,
        });
        setSuccess(`${plan?.name || "Selected tier"} is now provisioned for active defense.`);
      }

      if (action === "cancel") {
        await cancelSubscription({
          subscriptionId: currentPlan?._id || currentPlan?.id,
        });
        setSuccess("Active protection tier withdrawn successfully.");
      }

      await fetchSubscriptionData();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setActiveAction("");
    }
  };

  if (isLoading) {
    return <Loading label="Loading BRADSafe protection tiers..." />;
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">
            Protection Tiers
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            Manage monitoring and autonomous prevention modes
          </h1>
          <p className="max-w-3xl text-lg text-slate-600">
            Review available BRADSafe service tiers, simulate activation flows, provision a
            tier, and inspect your protection history.
          </p>
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-rose-200">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-4 text-emerald-200">
            {success}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">
                    Active protection tier
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-slate-100">
                    {currentPlan?.plan || currentPlan?.name || "No active protection tier"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleAction("cancel")}
                  disabled={!currentPlan || activeAction === "cancel-global"}
                  className="rounded-full border border-rose-500/30 px-4 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {activeAction === "cancel-global" ? "Withdrawing..." : "Withdraw tier"}
                </button>
              </div>
              <div className="mt-5 grid gap-3 text-sm text-slate-400">
                <p>Enforcement mode: {currentPlan?.status || "Not provisioned"}</p>
                <p>
                  Coverage ends: {currentPlan?.expiresAt || currentPlan?.endDate || "Not available"}
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/30">
              <p className="text-sm uppercase tracking-[0.25em] text-amber-300">
                Protection history
              </p>
              <div className="mt-5 space-y-3">
                {history.length ? (
                  history.map((item, index) => (
                    <div
                      key={item?._id || item?.id || `${item?.plan || "history"}-${index}`}
                      className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4"
                    >
                      <p className="font-semibold text-slate-100">
                        {item?.plan || item?.name || "Protection tier"}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {item?.status || "Status unavailable"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">
                    No protection history available yet. Once a tier is activated, its state
                    changes will appear here for operator review.
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
                const isEntryTier = index === 0;

                return (
                  <article
                    key={planId}
                    className={`rounded-[2rem] border p-6 shadow-xl backdrop-blur-xl ${
                      isEntryTier
                        ? "border-amber-400/30 bg-amber-500/10 shadow-amber-500/10"
                        : "border-emerald-500/30 bg-slate-950/90 shadow-slate-950/30"
                    }`}
                  >
                    <div className="space-y-3">
                      <p className={`text-sm uppercase tracking-[0.25em] ${isEntryTier ? "text-amber-200" : "text-emerald-300"}`}>
                        {isEntryTier ? "Monitor Only" : "Autonomous Prevention"}
                      </p>
                      <h2 className={`text-2xl font-semibold ${isEntryTier ? "text-slate-950" : "text-slate-100"}`}>
                        {plan?.name || `Plan ${index + 1}`}
                      </h2>
                      <p className={isEntryTier ? "text-slate-700" : "text-slate-400"}>
                        {plan?.description ||
                          (isEntryTier
                            ? "Observe telemetry, review AI Confidence Index trends, and inspect suspicious events without automatic enforcement."
                            : "Enable autonomous prevention so BRADSafe can escalate from analysis to active mitigation when threat confidence is high.")}
                      </p>
                    </div>
                    <div className="mt-6">
                      <p className={`text-4xl font-semibold ${isEntryTier ? "text-slate-950" : "text-slate-100"}`}>
                        ${plan?.price ?? "0"}
                      </p>
                    </div>
                    <div className="mt-6 rounded-2xl border border-current/10 px-4 py-4">
                      <p className={`text-sm font-medium ${isEntryTier ? "text-slate-800" : "text-slate-200"}`}>
                        {isEntryTier
                          ? "Monitor Only keeps analysts informed while all mitigations remain operator-approved."
                          : "Autonomous Prevention authorizes the gateway to trigger rapid enforcement against confirmed threat actors."}
                      </p>
                    </div>
                    <div className="mt-6 flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleAction("simulate", plan)}
                        disabled={activeAction === simulateActionKey}
                        className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          isEntryTier
                            ? "border-amber-300 text-slate-800 hover:border-slate-950"
                            : "border-slate-700 text-slate-200 hover:border-emerald-400"
                        }`}
                      >
                        {activeAction === simulateActionKey ? "Modeling..." : "Model activation"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction("buy", plan)}
                        disabled={activeAction === buyActionKey}
                        className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          isEntryTier
                            ? "bg-slate-950 text-white hover:bg-slate-800"
                            : "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                        }`}
                      >
                        {activeAction === buyActionKey ? "Provisioning..." : "Provision tier"}
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-[2rem] border border-dashed border-slate-700 bg-slate-950/90 p-8 text-slate-400 md:col-span-2">
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
