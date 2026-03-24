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
        setSuccess(`Payment simulated for ${plan?.name || "selected plan"}.`);
      }

      if (action === "buy") {
        await buyPlan({
          planId: plan?._id || plan?.id,
        });
        setSuccess(`Successfully purchased ${plan?.name || "plan"}.`);
      }

      if (action === "cancel") {
        await cancelSubscription({
          subscriptionId: currentPlan?._id || currentPlan?.id,
        });
        setSuccess("Subscription cancelled successfully.");
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
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-600">
            Subscriptions
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            Manage plans, purchases, and billing actions
          </h1>
          <p className="max-w-3xl text-lg text-slate-600">
            Review available plans, simulate payment flows, buy a subscription, and
            inspect your subscription history.
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
            <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl shadow-slate-200/50 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
                    Current plan
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                    {currentPlan?.plan || currentPlan?.name || "No active subscription"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleAction("cancel")}
                  disabled={!currentPlan || activeAction === "cancel-global"}
                  className="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {activeAction === "cancel-global" ? "Cancelling..." : "Cancel"}
                </button>
              </div>
              <div className="mt-5 grid gap-3 text-sm text-slate-600">
                <p>Status: {currentPlan?.status || "N/A"}</p>
                <p>
                  Ends on: {currentPlan?.expiresAt || currentPlan?.endDate || "Not available"}
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-[var(--border)] bg-white p-6 shadow-xl shadow-slate-200/40">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
                Subscription history
              </p>
              <div className="mt-5 space-y-3">
                {history.length ? (
                  history.map((item, index) => (
                    <div
                      key={item?._id || item?.id || `${item?.plan || "history"}-${index}`}
                      className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
                    >
                      <p className="font-semibold text-slate-900">
                        {item?.plan || item?.name || "Subscription"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item?.status || "Unknown status"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No subscription history available yet.</p>
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

                return (
                  <article
                    key={planId}
                    className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl shadow-slate-200/50 backdrop-blur-xl"
                  >
                    <div className="space-y-3">
                      <p className="text-sm uppercase tracking-[0.25em] text-cyan-700">
                        {plan?.tier || "Plan"}
                      </p>
                      <h2 className="text-2xl font-semibold text-slate-950">
                        {plan?.name || `Plan ${index + 1}`}
                      </h2>
                      <p className="text-slate-600">
                        {plan?.description || "Subscription plan details from the backend."}
                      </p>
                    </div>
                    <div className="mt-6">
                      <p className="text-4xl font-semibold text-slate-950">
                        ${plan?.price ?? "0"}
                      </p>
                    </div>
                    <div className="mt-6 flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleAction("simulate", plan)}
                        disabled={activeAction === simulateActionKey}
                        className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {activeAction === simulateActionKey ? "Simulating..." : "Simulate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction("buy", plan)}
                        disabled={activeAction === buyActionKey}
                        className="flex-1 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {activeAction === buyActionKey ? "Buying..." : "Buy Plan"}
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-slate-500 md:col-span-2">
                No plans available from the subscriptions endpoint yet.
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
