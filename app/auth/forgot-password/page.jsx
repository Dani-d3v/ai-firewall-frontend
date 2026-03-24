"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { requestPasswordReset } from "@/services/authService";
import { setPendingReset } from "@/utils/storage";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      await requestPasswordReset({ email });
      setPendingReset({ email });
      setSuccess("Reset instructions sent. Continue to the reset screen with your OTP.");
      router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
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
            Forgot Password
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Request a secure password reset
          </h1>
          <p className="text-slate-600">
            Enter your account email and we will start the recovery flow.
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--accent)]"
              placeholder="you@company.com"
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
            {isSubmitting ? "Submitting..." : "Send Reset OTP"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-500">
          Remembered it?{" "}
          <Link href="/auth/login" className="font-semibold text-[var(--accent-strong)]">
            Back to login
          </Link>
        </p>
      </div>
    </section>
  );
}
