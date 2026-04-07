"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import Loading from "@/components/Loading";

export default function LegacyGatewayStatusPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin?tab=gateway");
  }, [router]);

  return <Loading label="Opening admin gateway activity..." />;
}
