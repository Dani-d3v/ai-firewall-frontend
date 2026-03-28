"use client";

const AUTH_STORAGE_KEY = "ai_firewall_auth";
const REGISTER_STORAGE_KEY = "ai_firewall_register";
const RESET_STORAGE_KEY = "ai_firewall_reset";
const WIREGUARD_STORAGE_KEY = "ai_firewall_wireguard";
const CHECKOUT_STORAGE_KEY = "ai_firewall_checkout";

const isBrowser = () => typeof window !== "undefined";

const safeJsonParse = (value, fallback = null) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const getAuthSession = () => {
  if (!isBrowser()) {
    return null;
  }

  return safeJsonParse(localStorage.getItem(AUTH_STORAGE_KEY));
};

export const setAuthSession = ({ token, tokenExpiresAt, user }) => {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      token,
      tokenExpiresAt,
      user,
    }),
  );
};

export const clearAuthSession = () => {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const getToken = () => getAuthSession()?.token || null;

export const getTokenExpiresAt = () => getAuthSession()?.tokenExpiresAt || null;

export const isTokenExpired = (tokenExpiresAt) => {
  if (!tokenExpiresAt) {
    return true;
  }

  return new Date(tokenExpiresAt).getTime() <= Date.now();
};

export const setPendingRegistration = (payload) => {
  if (!isBrowser()) {
    return;
  }

  sessionStorage.setItem(REGISTER_STORAGE_KEY, JSON.stringify(payload));
};

export const getPendingRegistration = () => {
  if (!isBrowser()) {
    return null;
  }

  return safeJsonParse(sessionStorage.getItem(REGISTER_STORAGE_KEY));
};

export const clearPendingRegistration = () => {
  if (!isBrowser()) {
    return;
  }

  sessionStorage.removeItem(REGISTER_STORAGE_KEY);
};

export const setPendingReset = (payload) => {
  if (!isBrowser()) {
    return;
  }

  sessionStorage.setItem(RESET_STORAGE_KEY, JSON.stringify(payload));
};

export const getPendingReset = () => {
  if (!isBrowser()) {
    return null;
  }

  return safeJsonParse(sessionStorage.getItem(RESET_STORAGE_KEY));
};

export const clearPendingReset = () => {
  if (!isBrowser()) {
    return;
  }

  sessionStorage.removeItem(RESET_STORAGE_KEY);
};

export const getWireguardSession = () => {
  if (!isBrowser()) {
    return null;
  }

  return safeJsonParse(localStorage.getItem(WIREGUARD_STORAGE_KEY));
};

export const setWireguardSession = (payload) => {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(WIREGUARD_STORAGE_KEY, JSON.stringify(payload));
};

export const clearWireguardSession = () => {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(WIREGUARD_STORAGE_KEY);
};

export const setCheckoutSession = (payload) => {
  if (!isBrowser()) {
    return;
  }

  sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(payload));
};

export const getCheckoutSession = () => {
  if (!isBrowser()) {
    return null;
  }

  return safeJsonParse(sessionStorage.getItem(CHECKOUT_STORAGE_KEY));
};

export const clearCheckoutSession = () => {
  if (!isBrowser()) {
    return;
  }

  sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
};
