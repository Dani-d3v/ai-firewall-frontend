import api, { extractApiData } from "@/services/api";

export const getAdminUsers = async () => {
  const response = await api.get("/api/admin/users");
  return extractApiData(response);
};

export const updateAdminUserRole = async ({ userId, role }) => {
  const response = await api.patch(`/api/admin/users/${encodeURIComponent(userId)}/role`, {
    role,
  });
  return extractApiData(response);
};

export const deleteAdminUser = async (userId) => {
  const response = await api.delete(`/api/admin/users/${encodeURIComponent(userId)}`);
  return extractApiData(response);
};

export const getAdminGatewayStatus = async () => {
  const response = await api.get("/api/admin/gateway/status");
  return extractApiData(response);
};

export const syncAdminGatewayUser = async (userId) => {
  const response = await api.post(`/api/admin/gateway/sync/${encodeURIComponent(userId)}`);
  return extractApiData(response);
};

export const revokeAdminGatewayUser = async (userId) => {
  const response = await api.post(`/api/admin/gateway/revoke/${encodeURIComponent(userId)}`);
  return extractApiData(response);
};

export const getAdminLogs = async () => {
  const response = await api.get("/api/admin/logs");
  return extractApiData(response);
};
