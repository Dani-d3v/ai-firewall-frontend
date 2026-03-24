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
      setError("Registration details not found. Please request a new OTP.");
      return;
    }

    setRegistration(cachedRegistration);
  }, []);

  const email = searchParams.get("email") || pendingRegistration?.email || "";

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!pendingRegistration) {
      setError("Please restart the registration process.");
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
      setSuccess("Verification complete. Redirecting to your dashboard...");
      router.push("/dashboard");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto flex min-h-[calc(100vh-81px)] w-full max-w-4xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xl shadow-amber-100/60 backdrop-blur-xl">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--accent-strong)]">
            Verify OTP
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Complete your account creation
          </h1>
          <p className="text-slate-600">
            Enter the OTP sent to <span className="font-semibold text-slate-900">{email}</span>.
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="otp" className="text-sm font-medium text-slate-700">
              One-Time Password
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              required
              className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 tracking-[0.4em] text-slate-900 outline-none transition focus:border-[var(--accent)]"
              placeholder="123456"
            />
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
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-500">
          Need a new code?{" "}
          <Link href="/auth/register" className="font-semibold text-[var(--accent-strong)]">
            Restart registration
          </Link>
        </p>
      </div>
    </section>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<Loading label="Loading verification..." />}>
      <VerifyOtpPageContent />
    </Suspense>
  );
}
