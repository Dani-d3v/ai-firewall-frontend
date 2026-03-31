"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Loading from "@/components/Loading";
import ProtectedRoute from "@/components/ProtectedRoute";
import { buyPlan, verifyChapaPayment } from "@/services/subscriptionService";
import { clearCheckoutSession, getCheckoutSession, getWireguardSession } from "@/utils/storage";

function ChapaReturnPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Verifying your Chapa payment...");
  const [error, setError] = useState("");

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

        const verifiedPayment = await verifyChapaPayment(txRef);
        setMessage("Payment verified. Activating your subscription and VPN access...");

        await buyPlan({
          planId: checkoutSession.planId,
          paymentId: verifiedPayment?._id,
          wireguardPublicKey: wireguardKeys.publicKey,
        });

        clearCheckoutSession();
        router.replace("/dashboard?tab=subscription");
      } catch (returnError) {
        setError(returnError.message);
      }
    };

    finalizeCheckout();
  }, [router, searchParams]);

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

  return <Loading label={message} />;
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
