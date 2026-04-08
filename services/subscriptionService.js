import api, { extractApiData } from "@/services/api";

export const getPlans = async () => {
  const response = await api.get("/api/subscriptions");
  return extractApiData(response);
};

export const initializeChapaCheckout = async (payload) => {
  const response = await api.post("/api/subscriptions/chapa/initialize", payload);
  return extractApiData(response);
};

export const verifyChapaPayment = async (txRef) => {
  const response = await api.get(`/api/subscriptions/chapa/verify/${encodeURIComponent(txRef)}`);
  return extractApiData(response);
};

export const buyPlan = async (payload) => {
  const response = await api.post("/api/subscriptions/buy", payload);
  return extractApiData(response);
};

export const retryGatewaySync = async (userId) => {
  const response = await api.post(`/api/subscriptions/admin/retry-sync/${encodeURIComponent(userId)}`);
  return extractApiData(response);
};

export const getCurrentSubscription = async () => {
  const response = await api.get("/api/subscriptions/my-plan");
  return extractApiData(response);
};

export const getSubscriptionHistory = async () => {
  const response = await api.get("/api/subscriptions/history");
  return extractApiData(response);
};

export const cancelSubscription = async () => {
  const response = await api.patch("/api/subscriptions/cancel", {});
  return extractApiData(response);
};

export const getVpnAccessState = async () => {
  const response = await api.get("/api/subscriptions/vpn-access");
  return extractApiData(response);
};

export const downloadWireguardConfig = async ({ privateKey, token }) => {
  const response = await api.post(
    "/api/subscriptions/download-config",
    { privateKey },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const rawResponse = response.data || {};
  const payload = extractApiData(response) || {};

  if (rawResponse?.success === false) {
    throw new Error(rawResponse.message || "Failed to generate WireGuard config");
  }

  return {
    content: payload.configText || "",
    qrCodeDataUri: payload.qrCodeDataUri || "",
    fileName: payload.fileName || "vectraflow.conf",
    backendMessage: rawResponse.message || payload.message || "",
    rawResponse,
  };
};
