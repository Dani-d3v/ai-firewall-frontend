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
      setError("Access keys do not match. Re-enter both values to continue.");
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
      setSuccess("Access key rotated successfully. Redirecting to operator access...");
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
      <div className="w-full rounded-[2rem] border border-slate-800 bg-slate-950/90 p-8 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">
            Recovery Checkpoint
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-100">
            Rotate your operator access key with the recovery code.
          </h1>
          <p className="text-slate-400">
            Complete credential recovery by providing the issued code and a replacement
            access key for the BRADSafe console.
          </p>
        </div>

        <form className="mt-8 grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-200">
              Command Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-amber-300"
              placeholder="operator@bradsafe.io"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="otp" className="text-sm font-medium text-slate-200">
              Recovery Code
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              value={formData.otp}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-amber-300"
              placeholder="123456"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-200">
              New Access Key
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-amber-300"
              placeholder="Create a replacement access key"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-200">
              Confirm Access Key
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-amber-300"
              placeholder="Confirm the replacement access key"
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 md:col-span-2">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 md:col-span-2">
              {success}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/25 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
          >
            {isSubmitting ? "Rotating access key..." : "Rotate access key"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-400">
          Return to{" "}
          <Link href="/auth/login" className="font-semibold text-emerald-300">
            operator access
          </Link>
        </p>
      </div>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Loading label="Loading credential recovery checkpoint..." />}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
