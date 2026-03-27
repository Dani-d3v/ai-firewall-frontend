"use client";

import { useEffect, useState } from "react";

import Loading from "@/components/Loading";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getProfile } from "@/services/userService";

const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

function ProfileContent() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (isLoading) {
    return <Loading label="Loading profile..." />;
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--accent-strong)]">
            Profile
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            Your account information
          </h1>
          <p className="max-w-2xl text-lg text-slate-600">
            Review the identity, subscription, and VPN details returned by the protected
            profile endpoint for the current session.
          </p>
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-5 text-rose-600">
            {error}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[2rem] border border-amber-200 bg-white p-8 shadow-xl shadow-amber-100/50 backdrop-blur-xl">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Name</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-950">
                {profile?.name || "Not available"}
              </h2>
            </div>
            <div className="rounded-[2rem] border border-amber-200 bg-white p-8 shadow-xl shadow-amber-100/50 backdrop-blur-xl">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Email</p>
              <h2 className="mt-4 break-all text-3xl font-semibold text-slate-950">
                {profile?.email || "Not available"}
              </h2>
            </div>
            <div className="rounded-[2rem] border border-amber-200 bg-white p-8 shadow-xl shadow-amber-100/40">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Subscription</p>
              <h2 className="mt-4 text-2xl font-semibold text-slate-950">
                {profile?.subscription?.plan || "No active plan"}
              </h2>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>Status: {profile?.subscription?.status || "Inactive"}</p>
                <p>Active: {profile?.subscription?.isActive ? "Yes" : "No"}</p>
                <p>Valid until: {formatDate(profile?.subscription?.validUntil)}</p>
              </div>
            </div>
            <div className="rounded-[2rem] border border-amber-200 bg-white p-8 shadow-xl shadow-amber-100/40">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">VPN Access</p>
              <h2 className="mt-4 text-2xl font-semibold text-slate-950">
                {profile?.vpn?.status || "Not provisioned"}
              </h2>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>Assigned IP: {profile?.vpn?.assignedIp || "Not assigned"}</p>
                <p>Public key: {profile?.vpn?.publicKey || "Not available"}</p>
                <p>Provisioned: {formatDate(profile?.vpn?.lastProvisionedAt)}</p>
              </div>
            </div>
            <div className="rounded-[2rem] border border-amber-200 bg-white p-8 shadow-xl shadow-amber-100/40 md:col-span-2">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
                Raw profile data
              </p>
              <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-5 text-sm text-slate-100">
                {JSON.stringify(profile, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
