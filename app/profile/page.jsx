"use client";

import { useEffect, useState } from "react";

import Loading from "@/components/Loading";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getProfile } from "@/services/userService";

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
    return <Loading label="Loading operator identity record..." />;
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
            Operator Identity
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            Verified BRADSafe operator record
          </h1>
          <p className="max-w-2xl text-lg text-slate-600">
            Review the identity metadata returned by the profile endpoint for the current
            operator session.
          </p>
        </div>

        {error ? (
          <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 px-6 py-5 text-rose-200">
            {error}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-950/90 p-8 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
              <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">Operator Name</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-100">
                {profile?.name || "Not available"}
              </h2>
            </div>
            <div className="rounded-[2rem] border border-slate-800 bg-slate-950/90 p-8 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
              <p className="text-sm uppercase tracking-[0.25em] text-amber-300">Command Email</p>
              <h2 className="mt-4 break-all text-3xl font-semibold text-slate-100">
                {profile?.email || "Not available"}
              </h2>
            </div>
            <div className="rounded-[2rem] border border-slate-800 bg-slate-950/90 p-8 shadow-xl shadow-slate-950/30 md:col-span-2">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                Identity record payload
              </p>
              <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-900 p-5 text-sm text-slate-100">
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
