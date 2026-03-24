import api, { extractApiData } from "@/services/api";

export const getPlans = async () => {
  const response = await api.get("/subscriptions");
  return extractApiData(response);
};

export const simulatePayment = async (payload) => {
  const response = await api.post("/subscriptions/simulate-payment", payload);
  return extractApiData(response);
};

export const buyPlan = async (payload) => {
  const response = await api.post("/subscriptions/buy", payload);
  return extractApiData(response);
};

export const getCurrentSubscription = async () => {
  const response = await api.get("/subscriptions/current");
  return extractApiData(response);
};

export const getSubscriptionHistory = async () => {
  const response = await api.get("/subscriptions/history");
  return extractApiData(response);
};

export const cancelSubscription = async (payload = {}) => {
  const response = await api.post("/subscriptions/cancel", payload);
  return extractApiData(response);
};
