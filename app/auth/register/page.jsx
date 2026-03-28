"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Loading from "@/components/Loading";
import { requestRegisterOtp } from "@/services/authService";
import { getCheckoutSession, setCheckoutSession, setPendingRegistration } from "@/utils/storage";

const initialForm = {
  name: "",
  email: "",
  password: "",
};

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState(initialForm);
  const [checkout, setCheckout] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedCheckout = getCheckoutSession();
    const planId = searchParams.get("planId");

    if (storedCheckout) {
      setCheckout(storedCheckout);
    } else if (planId) {
      const fallbackCheckout = { planId };
      setCheckout(fallbackCheckout);
      setCheckoutSession(fallbackCheckout);
    }
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
    setIsSubmitting(true);

    try {
      await requestRegisterOtp(formData);
      setPendingRegistration({
        ...formData,
        planId: checkout?.planId || searchParams.get("planId") || null,
      });
      setSuccess("OTP sent successfully. Confirm your email to continue to payment.");

      const query = new URLSearchParams();
      query.set("email", formData.email);

      if (checkout?.planId || searchParams.get("planId")) {
        query.set("planId", checkout?.planId || searchParams.get("planId"));
      }

      router.push(`/auth/verify-otp?${query.toString()}`);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto flex min-h-[calc(100vh-81px)] w-full max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid w-full gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--accent-strong)]">
            Account creation
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            Create your customer account before payment.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-slate-600">
            The plan is selected first, then we register the customer, verify the OTP, and
            move straight into payment and service activation.
          </p>
          <div className="rounded-[2rem] border border-amber-200 bg-white/90 p-6 shadow-lg shadow-amber-100/40">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">
              Selected plan
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">
              {checkout?.displayName || checkout?.name || "BRADSafe subscription"}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {checkout?.price ? `$${checkout.price}` : "Plan pricing will appear on the payment page."}
            </p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-amber-200 bg-[var(--surface)] p-8 shadow-xl shadow-amber-100/70 backdrop-blur-xl">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-700">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--accent)]"
                placeholder="Daniel Bekele"
              />
            </div>
            <div className="space-y-2">
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
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
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
                placeholder="At least 6 characters"
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
              {isSubmitting ? "Sending OTP..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold text-[var(--accent-strong)]">
              Login
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<Loading label="Loading registration..." />}>
      <RegisterPageContent />
    </Suspense>
  );
}
