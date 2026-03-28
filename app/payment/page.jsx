"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Loading from "@/components/Loading";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getPlans, buyPlan, simulatePayment } from "@/services/subscriptionService";
import {
  clearCheckoutSession,
  getCheckoutSession,
  setCheckoutSession,
  setWireguardSession,
} from "@/utils/storage";
import { generateWireguardKeyPair } from "@/utils/wireguard";

const paymentOptions = [
  {
    value: "telebirr",
    title: "Telebirr",
    description: "Recommended simulated payment method for the current backend flow.",
  },
  {
    value: "card",
    title: "Bank Card",
    description: "Use the same backend simulation with a card-style checkout experience.",
  },
];

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.plans)) {
    return value.plans;
  }

  return [];
};

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("telebirr");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadSelectedPlan = async () => {
      try {
        const planId = searchParams.get("planId") || getCheckoutSession()?.planId;
        const plans = normalizeList(await getPlans());
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

      const payment = await simulatePayment({
        planId: selectedPlan?._id,
        paymentMethod,
      });

      await buyPlan({
        planId: selectedPlan?._id,
        paymentId: payment?._id,
        wireguardPublicKey: keys.publicKey,
      });

      clearCheckoutSession();
      setSuccess("Payment complete and service activated. Opening your dashboard.");
      router.push("/dashboard?tab=subscription");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
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
            Complete payment for your selected BRADSafe plan.
          </h1>

          <div className="mt-6 rounded-[1.75rem] bg-[linear-gradient(145deg,#fff7ed,#ffffff_58%,#fef3c7_100%)] p-6 ring-1 ring-amber-100">
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-700">Chosen plan</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {selectedPlan?.name || "Selected plan"}
            </h2>
            <p className="mt-4 text-5xl font-semibold text-slate-950">${selectedPlan?.price ?? 0}</p>
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
              Checkout
            </p>
            <h2 className="text-3xl font-semibold text-slate-950">Confirm details and pay</h2>
            <p className="text-slate-600">
              The backend uses a simulated payment step, then immediately activates the
              subscription and VPN access for the logged-in user.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">Payment method</label>
              {paymentOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-4 rounded-2xl border px-4 py-4 transition ${
                    paymentMethod === option.value
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-amber-200 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={option.value}
                    checked={paymentMethod === option.value}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">{option.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="rounded-2xl border border-amber-100 bg-white px-4 py-4 text-sm leading-7 text-slate-600">
              Payment will generate a WireGuard keypair on this device, simulate the payment
              request, activate the subscription, and store the returned VPN configuration for
              the customer dashboard.
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
              {isSubmitting ? "Processing payment..." : "Pay And Activate Service"}
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
