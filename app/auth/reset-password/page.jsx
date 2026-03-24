"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import Loading from "@/components/Loading";
import { resetPassword } from "@/services/authService";
import { clearPendingReset, getPendingReset } from "@/utils/storage";

function ResetPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const emailFromQuery = searchParams.get("email");
    const pendingReset = getPendingReset();

    setFormData((previous) => ({
      ...previous,
      email: emailFromQuery || pendingReset?.email || "",
    }));
  }, [searchParams]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword({
        email: formData.email,
        otp: formData.otp,
        password: formData.password,
      });
      clearPendingReset();
      setSuccess("Password reset successful. Redirecting to login...");
      setTimeout(() => {
        router.push("/auth/login");
      }, 1200);
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
            Reset Password
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Set a new password with your OTP
          </h1>
          <p className="text-slate-600">
            Complete the recovery flow by providing the reset OTP and your new password.
          </p>
        </div>

        <form className="mt-8 grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--accent)]"
              placeholder="you@company.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="otp" className="text-sm font-medium text-slate-700">
              OTP
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              value={formData.otp}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--accent)]"
              placeholder="123456"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              New Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--accent)]"
              placeholder="Enter a new password"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--accent)]"
              placeholder="Confirm your new password"
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 md:col-span-2">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 md:col-span-2">
              {success}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
          >
            {isSubmitting ? "Updating..." : "Reset Password"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-500">
          Back to{" "}
          <Link href="/auth/login" className="font-semibold text-[var(--accent-strong)]">
            login
          </Link>
        </p>
      </div>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Loading label="Loading reset form..." />}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
