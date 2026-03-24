"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { requestRegisterOtp } from "@/services/authService";
import { setPendingRegistration } from "@/utils/storage";

const initialForm = {
  name: "",
  email: "",
  password: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setPendingRegistration(formData);
      setSuccess("OTP sent successfully. Please verify to complete registration.");
      router.push(`/auth/verify-otp?email=${encodeURIComponent(formData.email)}`);
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
            Register
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            Start with a secure OTP-protected account setup.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-slate-600">
            Create your account and we will guide you through a clean verification flow
            before enabling access to the platform.
          </p>
        </div>

        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xl shadow-amber-100/70 backdrop-blur-xl">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--accent)]"
                placeholder="Jane Doe"
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
                placeholder="you@company.com"
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
                placeholder="Create a strong password"
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
              {isSubmitting ? "Sending OTP..." : "Request OTP"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500">
            Already registered?{" "}
            <Link href="/auth/login" className="font-semibold text-[var(--accent-strong)]">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
