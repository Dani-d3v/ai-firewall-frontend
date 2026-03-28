export const fallbackPlans = [
  {
    _id: "fallback-plan-1m",
    name: "BRADSafe Autonomous - 1 Month",
    price: 9.99,
    duration: 30,
    features: ["VPN Access", "Download Config", "AI Shield"],
  },
  {
    _id: "fallback-plan-6m",
    name: "BRADSafe Autonomous - 6 Months",
    price: 49.99,
    duration: 180,
    features: ["VPN Access", "Download Config", "AI Shield"],
  },
  {
    _id: "fallback-plan-12m",
    name: "BRADSafe Autonomous - 12 Months",
    price: 89.99,
    duration: 365,
    features: ["VPN Access", "Download Config", "AI Shield"],
  },
];

export const normalizePlans = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.plans)) {
    return value.plans;
  }

  if (Array.isArray(value?.subscriptions)) {
    return value.subscriptions;
  }

  return [];
};
