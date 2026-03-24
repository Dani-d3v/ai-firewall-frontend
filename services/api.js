import axios from "axios";

import { getToken } from "@/utils/storage";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "/backend";

const getErrorMessage = (error) => {
  if (error.code === "ERR_NETWORK") {
    return "Unable to reach the backend service. Check the backend URL or CORS/proxy settings.";
  }

  if (error.code === "ECONNABORTED") {
    return "The request timed out. Please try again.";
  }

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
};

export const extractApiData = (response) => response?.data?.data ?? response?.data;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalizedError = new Error(getErrorMessage(error));

    normalizedError.status = error.response?.status || null;
    normalizedError.success = false;
    normalizedError.data = error.response?.data || null;

    if (typeof window !== "undefined" && error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }

    return Promise.reject(normalizedError);
  },
);

export default api;
