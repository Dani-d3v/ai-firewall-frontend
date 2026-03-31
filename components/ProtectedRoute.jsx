"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import Loading from "@/components/Loading";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const query =
        typeof window !== "undefined" ? window.location.search : "";
      const redirectTarget = query ? `${pathname}${query}` : pathname;
      router.replace(`/auth/login?redirect=${encodeURIComponent(redirectTarget)}`);
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return <Loading label="Checking your session..." />;
  }

  if (!isAuthenticated) {
    return <Loading label="Redirecting to login..." />;
  }

  return children;
}
