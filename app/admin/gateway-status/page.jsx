"use client";

import { useEffect, useState } from "react";

import Loading from "@/components/Loading";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { retryGatewaySync } from "@/services/subscriptionService";
import { getProfile } from "@/services/userService";

function GatewayStatusContent() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [userId, setUserId] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (profileError) {
        setError((current) => current || profileError.message);
      } finally {
        setIsProfileLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccess("");
    setError("");
    setIsSubmitting(true);

    try {
      const response = await retryGatewaySync(userId);
      setSuccess(
        response?.message || "User successfully pushed to BRADSafe wg0.",
      );
    } catch (submitError) {
      setError(submitError?.data?.lastSyncError || submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isProfileLoading) {
    return <Loading label="Checking admin access..." />;
  }

  const effectiveRole = profile?.role || user?.role || "user";

  if (effectiveRole !== "admin") {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-rose-200 bg-white p-8 shadow-xl shadow-rose-100/40">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Admin access required
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-600">
            This emergency gateway sync tool is available to admin accounts only.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--accent-strong)]">
            Admin Gateway Status
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            Emergency manual sync to BRADSafe wg0
          </h1>
          <p className="max-w-2xl text-lg text-slate-600">
            This page provides the retry endpoint until a full admin user list API is
            available in this frontend codebase.
          </p>
        </div>

        <div className="rounded-[2rem] border border-amber-200 bg-white p-8 shadow-xl shadow-amber-100/40">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="userId" className="text-sm font-medium text-slate-700">
                User ID
              </label>
              <input
                id="userId"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                required
                className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--accent)]"
                placeholder="Paste the user ID to sync"
              />
            </div>

            {success ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Error: {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Syncing..." : "Sync to Gateway"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default function GatewayStatusPage() {
  return (
    <ProtectedRoute>
      <GatewayStatusContent />
    </ProtectedRoute>
  );
}
