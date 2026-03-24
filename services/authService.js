import api, { extractApiData } from "@/services/api";

export const requestRegisterOtp = async (payload) => {
  const response = await api.post("/auth/register/request-otp", payload);
  return extractApiData(response);
};

export const registerUser = async (payload) => {
  const response = await api.post("/auth/register", payload);
  return extractApiData(response);
};

export const loginUser = async (payload) => {
  const response = await api.post("/auth/login", payload);
  return extractApiData(response);
};

export const requestPasswordReset = async (payload) => {
  const response = await api.post("/auth/forgot-password", payload);
  return extractApiData(response);
};

export const resetPassword = async (payload) => {
  const response = await api.post("/auth/reset-password", payload);
  return extractApiData(response);
};
