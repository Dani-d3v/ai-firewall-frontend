import api, { extractApiData } from "@/services/api";

export const getDashboard = async () => {
  const response = await api.get("/api/dashboard");
  return extractApiData(response);
};

export const getProfile = async () => {
  const response = await api.get("/api/users/profile");
  return extractApiData(response);
};
