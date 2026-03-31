"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import Loading from "@/components/Loading";
import ProtectedRoute from "@/components/ProtectedRoute";
import { initializeChapaCheckout, getPlans } from "@/services/subscriptionService";
import { fallbackPlans, normalizePlans } from "@/utils/plans";
import { getCheckoutSession, setCheckoutSession, setWireguardSession } from "@/utils/storage";
import { generateWireguardKeyPair } from "@/utils/wireguard";

function PaymentPageContent() {
  const searchParams = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadSelectedPlan = async () => {
      try {
        const planId = searchParams.get("planId") || getCheckoutSession()?.planId;
        let plans = fallbackPlans;

        try {
          plans = normalizePlans(await getPlans());
          if (!plans.length) {
            plans = fallbackPlans;
          }
        } catch {
          plans = fallbackPlans;
        }

        const matchedPlan = plans.find((plan) => plan?._id === planId) || null;

        if (!matchedPlan) {
          throw new Error("The selected subscription plan could not be found.");
        }

        setSelectedPlan(matchedPlan);
        setCheckoutSession({
          ...getCheckoutSession(),
          planId: matchedPlan._id,
          name: matchedPlan.name,
          price: matchedPlan.price,
          duration: matchedPlan.duration,
          features: matchedPlan.features,
        });
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadSelectedPlan();
  }, [searchParams]);

  const planFeatures = useMemo(
    () => (Array.isArray(selectedPlan?.features) ? selectedPlan.features : []),
    [selectedPlan],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const keys = await generateWireguardKeyPair();
      setWireguardSession(keys);

      const returnUrl = `${window.location.origin}/payment/chapa/return`;
      const checkout = await initializeChapaCheckout({
        planId: selectedPlan?._id,
        returnUrl,
      });

      setCheckoutSession({
        ...getCheckoutSession(),
        planId: selectedPlan?._id,
        name: selectedPlan?.name,
        price: selectedPlan?.price,
        duration: selectedPlan?.duration,
        features: selectedPlan?.features,
        chapaPaymentId: checkout?.paymentId || null,
        chapaTxRef: checkout?.txRef || null,
        chapaStatus: checkout?.status || "pending",
      });

      setSuccess("Redirecting to Chapa checkout...");
      window.location.assign(checkout.checkoutUrl);
    } catch (submitError) {
      setError(submitError.message);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Loading label="Loading payment..." />;
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-amber-200 bg-white/90 p-6 shadow-xl shadow-amber-100/40">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--accent-strong)]">
            Payment summary
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            Continue to Chapa for your selected BRADSafe plan.
          </h1>

          <div className="mt-6 rounded-[1.75rem] bg-[linear-gradient(145deg,#fff7ed,#ffffff_58%,#fef3c7_100%)] p-6 ring-1 ring-amber-100">
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-700">Chosen plan</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {selectedPlan?.name || "Selected plan"}
            </h2>
            <p className="mt-4 text-5xl font-semibold text-slate-950">
              ETB {selectedPlan?.price ?? 0}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Duration: {selectedPlan?.duration || 0} days
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {planFeatures.map((feature) => (
              <div
                key={feature}
                className="rounded-2xl border border-amber-100 bg-[var(--surface-soft)] px-4 py-4 text-sm text-slate-700"
              >
                {feature}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-amber-200 bg-[var(--surface)] p-8 shadow-xl shadow-amber-100/60">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--accent-strong)]">
              Chapa checkout
            </p>
            <h2 className="text-3xl font-semibold text-slate-950">Pay securely with Chapa</h2>
            <p className="text-slate-600">
              We will initialize a Chapa checkout session, redirect you to the Chapa payment
              page, then verify the transaction when you return before activating the plan.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="rounded-2xl border border-amber-100 bg-white px-4 py-4 text-sm leading-7 text-slate-600">
              Before redirecting, this page generates your WireGuard keypair locally and stores
              it so we can finish activation after Chapa sends you back to the app.
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || !selectedPlan}
              className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Redirecting to Chapa..." : "Continue To Chapa"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default function PaymentPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<Loading label="Loading payment..." />}>
        <PaymentPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}
