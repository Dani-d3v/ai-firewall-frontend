"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import Loading from "@/components/Loading";
import { useAuth } from "@/context/AuthContext";
import { getPlans } from "@/services/subscriptionService";
import { fallbackPlans, normalizePlans } from "@/utils/plans";
import { setCheckoutSession } from "@/utils/storage";

const getDisplayPlanName = (plan) => {
  const duration = plan?.duration;

  if (duration === 30) {
    return "BRADSafe Sentinel";
  }

  if (duration === 180) {
    return "BRADSafe Shield";
  }

  if (duration === 365) {
    return "BRADSafe Fortress";
  }

  return plan?.name || "BRADSafe Plan";
};

const getPlanSummary = (plan) => {
  const duration = plan?.duration;

  if (duration === 30) {
    return "Best for individuals or small teams starting protected VPN access.";
  }

  if (duration === 180) {
    return "Balanced long-term protection with stronger value over time.";
  }

  if (duration === 365) {
    return "The most complete yearly coverage for uninterrupted secure operations.";
  }

  return "Protection plan with secure VPN access and AI shield coverage.";
};

export default function SubscriptionsPage() {
  const { isAuthenticated } = useAuth();
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await getPlans();
        const normalizedPlans = normalizePlans(data);
        setPlans(normalizedPlans.length ? normalizedPlans : fallbackPlans);
      } catch (fetchError) {
        setPlans(fallbackPlans);
        setError(`${fetchError.message} Showing the default BRADSafe plans instead.`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const orderedPlans = useMemo(
    () => [...plans].sort((left, right) => (left?.duration || 0) - (right?.duration || 0)),
    [plans],
  );

  const buildPlanLink = (plan) => {
    const planId = encodeURIComponent(plan?._id || "");

    if (isAuthenticated) {
      return `/payment?planId=${planId}`;
    }

    return `/auth/register?planId=${planId}`;
  };

  if (isLoading) {
    return <Loading label="Loading subscriptions..." />;
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--accent-strong)]">
            Subscription plans
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Choose the BRADSafe service plan that fits your protection window.
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-slate-600">
            Each plan includes AI Shield, VPN access, and configuration delivery after
            activation. Pick a plan below, create your account, then continue to payment.
          </p>
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-5 text-rose-600">
            {error}
          </div>
        ) : null}

        <div className="space-y-5">
          {orderedPlans.length ? (
            orderedPlans.map((plan) => {
              const href = buildPlanLink(plan);
              const displayName = getDisplayPlanName(plan);
              const features = Array.isArray(plan?.features) ? plan.features : [];
              const checkoutPayload = {
                planId: plan?._id || null,
                name: plan?.name || "",
                displayName,
                price: plan?.price ?? null,
                duration: plan?.duration ?? null,
                features,
              };

              return (
                <article
                  key={plan?._id || plan?.name}
                  className="grid gap-6 rounded-[2rem] border border-amber-200 bg-white/90 p-6 shadow-xl shadow-amber-100/40 lg:grid-cols-[1.15fr_0.85fr]"
                >
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">
                        {displayName}
                      </p>
                      <h2 className="mt-2 text-3xl font-semibold text-slate-950">
                        {plan?.name || "BRADSafe plan"}
                      </h2>
                    </div>
                    <p className="max-w-2xl text-base leading-8 text-slate-600">
                      {getPlanSummary(plan)}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {features.map((feature) => (
                        <div
                          key={feature}
                          className="rounded-2xl border border-amber-100 bg-[var(--surface-soft)] px-4 py-4 text-sm font-medium text-slate-700"
                        >
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between rounded-[1.75rem] bg-[linear-gradient(145deg,#fff7ed,#ffffff_58%,#fef3c7_100%)] p-6 ring-1 ring-amber-100">
                    <div className="space-y-3">
                      <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-strong)]">
                        Plan difference
                      </p>
                      <p className="text-5xl font-semibold text-slate-950">${plan?.price ?? 0}</p>
                      <p className="text-sm text-slate-600">
                        {plan?.duration || 0} days of active protection and provisioning.
                      </p>
                    </div>
                    <Link
                      href={href}
                      onClick={() => setCheckoutSession(checkoutPayload)}
                      className="mt-8 inline-flex items-center justify-center rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition hover:bg-[var(--accent-strong)]"
                    >
                      Get This Plan
                    </Link>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-[2rem] border border-dashed border-amber-200 bg-white p-8 text-slate-500">
              No plans are available from the backend yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
