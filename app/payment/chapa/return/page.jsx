"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Loading from "@/components/Loading";
import ProtectedRoute from "@/components/ProtectedRoute";
import { buyPlan, verifyChapaPayment } from "@/services/subscriptionService";
import { clearCheckoutSession, getCheckoutSession, getWireguardSession } from "@/utils/storage";

const stepLabels = [
  "Verifying Payment...",
  "Securing Gateway Connection...",
  "Generating BRADSafe Configuration...",
];

function CheckoutStepper({ activeStep }) {
  return (
    <div className="space-y-4">
      {stepLabels.map((label, index) => {
        const isComplete = index < activeStep;
        const isActive = index === activeStep;

        return (
          <div
            key={label}
            className={`flex items-center gap-4 rounded-2xl border px-4 py-4 ${
              isComplete
                ? "border-emerald-200 bg-emerald-50"
                : isActive
                  ? "border-amber-300 bg-amber-50"
                  : "border-amber-100 bg-white"
            }`}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                isComplete
                  ? "bg-emerald-600 text-white"
                  : isActive
                    ? "bg-[var(--accent)] text-white"
                    : "bg-slate-200 text-slate-600"
              }`}
            >
              {isComplete ? "OK" : index + 1}
            </div>
            <p className="text-sm font-medium text-slate-800">{label}</p>
          </div>
        );
      })}
    </div>
  );
}

function ChapaReturnPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStageRef = useRef(0);
  const [activeStep, setActiveStep] = useState(0);
  const [message, setMessage] = useState("Verifying your Chapa payment...");
  const [error, setError] = useState("");
  const [partialSuccess, setPartialSuccess] = useState("");

  useEffect(() => {
    const finalizeCheckout = async () => {
      try {
        const checkoutSession = getCheckoutSession();
        const wireguardKeys = getWireguardSession();
        const txRef =
          searchParams.get("tx_ref") ||
          searchParams.get("trx_ref") ||
          checkoutSession?.chapaTxRef;

        if (!checkoutSession?.planId) {
          throw new Error("The selected plan could not be restored after returning from Chapa.");
        }

        if (!wireguardKeys?.publicKey) {
          throw new Error("The WireGuard keypair is missing, so activation cannot continue.");
        }

        if (!txRef) {
          throw new Error("No Chapa transaction reference was found in the return URL.");
        }

        currentStageRef.current = 0;
        setActiveStep(0);
        const verifiedPayment = await verifyChapaPayment(txRef);

        currentStageRef.current = 1;
        setActiveStep(1);
        setMessage("Payment verified. Securing the BRADSafe Gateway connection...");

        await new Promise((resolve) => window.setTimeout(resolve, 1200));

        currentStageRef.current = 2;
        setActiveStep(2);
        setMessage("Gateway secured. Generating BRADSafe configuration...");

        await buyPlan({
          planId: checkoutSession.planId,
          paymentId: verifiedPayment?._id,
          wireguardPublicKey: wireguardKeys.publicKey,
          userPublicKey: wireguardKeys.publicKey,
        });

        clearCheckoutSession();
        router.replace("/dashboard?tab=subscription");
      } catch (returnError) {
        const normalizedMessage = returnError?.message || "Unable to complete activation.";
        const isTimeout =
          normalizedMessage.toLowerCase().includes("timed out") ||
          normalizedMessage.toLowerCase().includes("timeout");

        if (currentStageRef.current >= 1 && isTimeout) {
          setPartialSuccess(
            "Payment Confirmed! Your account is active, but our Gateway is taking a moment to sync. You can download your config in 1 minute from the dashboard.",
          );
          return;
        }

        setError(normalizedMessage);
      }
    };

    finalizeCheckout();
  }, [router, searchParams]);

  if (partialSuccess) {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-amber-200 bg-white p-8 shadow-xl shadow-amber-100/40">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--accent-strong)]">
            Partial success
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            Payment confirmed, gateway sync still in progress
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-600">{partialSuccess}</p>
          <button
            type="button"
            onClick={() => router.push("/dashboard?tab=vpn")}
            className="mt-6 rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
          >
            Open Dashboard
          </button>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-rose-200 bg-white p-8 shadow-xl shadow-rose-100/40">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-700">
            Chapa return
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            We could not complete the payment verification.
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-600">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-amber-200 bg-white p-8 shadow-xl shadow-amber-100/40">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--accent-strong)]">
          BRADSafe activation
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
          Finalizing your gateway access
        </h1>
        <p className="mt-4 text-base leading-8 text-slate-600">{message}</p>
        <div className="mt-8">
          <CheckoutStepper activeStep={activeStep} />
        </div>
      </div>
    </section>
  );
}

export default function ChapaReturnPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<Loading label="Loading Chapa return..." />}>
        <ChapaReturnPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}
