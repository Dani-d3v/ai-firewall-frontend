import api, { extractApiData } from "@/services/api";

export const requestRegisterOtp = async (payload) => {
  const response = await api.post("/api/auth/register/request-otp", payload);
  return extractApiData(response);
};

export const registerUser = async (payload) => {
  const response = await api.post("/api/auth/register", payload);
  return extractApiData(response);
};

export const loginUser = async (payload) => {
  const response = await api.post("/api/auth/login", payload);
  return extractApiData(response);
};

export const requestPasswordReset = async (payload) => {
  const response = await api.post("/api/auth/forgot-password", payload);
  return extractApiData(response);
};

export const resetPassword = async (payload) => {
  const response = await api.post("/api/auth/reset-password", payload);
  return extractApiData(response);
};
