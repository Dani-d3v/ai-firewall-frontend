"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { loginUser } from "@/services/authService";
import Loading from "@/components/Loading";
import { useAuth } from "@/context/AuthContext";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = searchParams.get("redirect") || "/dashboard";

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
    setIsSubmitting(true);

    try {
      const response = await loginUser(formData);
      login(response);
      router.push(redirectTo);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto flex min-h-[calc(100vh-81px)] w-full max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid w-full gap-10 lg:grid-cols-[1fr_0.95fr]">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--accent-strong)]">
            Login
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            Login to your BRADSafe account.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-slate-600">
            Authenticate to review live detections, inspect AI decisions, and manage
            mitigation policy. Session continuity is enforced by backend token expiry
            controls to reduce unauthorized console persistence.
          </p>
        </div>

        <div className="rounded-[2rem] border border-amber-200 bg-[var(--surface)] p-8 shadow-xl shadow-amber-100/70 backdrop-blur-xl">
          <form className="space-y-5" onSubmit={handleSubmit}>
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
                className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--accent)]"
                placeholder="Enter your password"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Login"}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:justify-between">
            <Link href="/auth/forgot-password" className="font-semibold text-[var(--accent-strong)]">
              Forgot password?
            </Link>
            <p>
              No account yet?{" "}
              <Link href="/auth/register" className="font-semibold text-[var(--accent-strong)]">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Loading label="Loading login..." />}>
      <LoginPageContent />
    </Suspense>
  );
}
