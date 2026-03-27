import api, { extractApiData } from "@/services/api";

export const getPlans = async () => {
  const response = await api.get("/api/subscriptions");
  return extractApiData(response);
};

export const simulatePayment = async (payload) => {
  const response = await api.post("/api/subscriptions/simulate-payment", payload);
  return extractApiData(response);
};

export const buyPlan = async (payload) => {
  const response = await api.post("/api/subscriptions/buy", payload);
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

export const downloadWireguardConfig = async () => {
  const response = await api.get("/api/subscriptions/download-config", {
    responseType: "text",
  });

  return {
    content: response.data,
    fileName:
      response.headers["content-disposition"]
        ?.match(/filename="?([^"]+)"?/)?.[1] || "vectraflow.conf",
  };
};
