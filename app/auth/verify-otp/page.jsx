"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import Loading from "@/components/Loading";
import { registerUser } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";
import { clearPendingRegistration, getPendingRegistration } from "@/utils/storage";

function VerifyOtpPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [otp, setOtp] = useState("");
  const [pendingRegistration, setRegistration] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const cachedRegistration = getPendingRegistration();

    if (!cachedRegistration) {
      setError("Pending operator enrollment not found. Request a fresh verification code to continue.");
      return;
    }

    setRegistration(cachedRegistration);
  }, []);

  const email = searchParams.get("email") || pendingRegistration?.email || "";

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!pendingRegistration) {
      setError("Enrollment context expired. Restart operator registration to generate a new verification code.");
      return;
    }

    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await registerUser({
        ...pendingRegistration,
        otp,
      });

      clearPendingRegistration();
      login(response);
      setSuccess("Identity confirmed. Routing to the BRADSafe defense console...");
      router.push("/dashboard");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto flex min-h-[calc(100vh-81px)] w-full max-w-4xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full rounded-[2rem] border border-slate-800 bg-slate-950/90 p-8 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
            Identity Verification
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-100">
            Confirm the operator before console access is granted.
          </h1>
          <p className="text-slate-400">
            Enter the one-time verification code transmitted to{" "}
            <span className="font-semibold text-slate-100">{email}</span>. This step prevents
            unauthorized enrollment into the live mitigation environment.
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="otp" className="text-sm font-medium text-slate-200">
              Verification Code
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              required
              className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4 text-center tracking-[0.4em] text-2xl font-semibold text-slate-100 outline-none transition focus:border-emerald-400"
              placeholder="123456"
            />
            <p className="text-xs text-slate-400">
              Codes are time-sensitive. If delivery is delayed or the code expires, request a
              new issuance from the enrollment screen.
            </p>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {success}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Validating operator identity..." : "Validate operator identity"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-400">
          Need a fresh code issue?{" "}
          <Link href="/auth/register" className="font-semibold text-amber-300">
            Restart operator enrollment
          </Link>
        </p>
      </div>
    </section>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<Loading label="Loading identity verification checkpoint..." />}>
      <VerifyOtpPageContent />
    </Suspense>
  );
}
