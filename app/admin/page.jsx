"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Loading from "@/components/Loading";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  deleteAdminUser,
  getAdminGatewayStatus,
  getAdminLogs,
  getAdminUsers,
  revokeAdminGatewayUser,
  syncAdminGatewayUser,
  updateAdminUserRole,
} from "@/services/adminService";
import { getProfile } from "@/services/userService";

const adminTabs = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "gateway", label: "Gateway Activity" },
];

const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const formatRelativeTime = (value) => {
  if (!value) {
    return "Never";
  }

  const target = typeof value === "number" ? value * 1000 : new Date(value).getTime();
  const diffMs = target - Date.now();
  const absMs = Math.abs(diffMs);

  if (absMs < 60_000) {
    return relativeFormatter.format(Math.round(diffMs / 1000), "seconds");
  }

  if (absMs < 3_600_000) {
    return relativeFormatter.format(Math.round(diffMs / 60_000), "minutes");
  }

  if (absMs < 86_400_000) {
    return relativeFormatter.format(Math.round(diffMs / 3_600_000), "hours");
  }

  return relativeFormatter.format(Math.round(diffMs / 86_400_000), "days");
};

const formatBytes = (value) => {
  if (value === null || value === undefined) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = Number(value);
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const getStatusBadgeClass = (tone) => {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (tone === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (tone === "danger") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
};

const getSubscriptionTone = (subscription) => {
  if (subscription?.isActive || subscription?.status === "active") {
    return "success";
  }

  if (subscription?.status === "expired" || subscription?.status === "cancelled") {
    return "warning";
  }

  return "default";
};

const getVpnTone = (vpn) => {
  if (vpn?.lastSyncError) {
    return "danger";
  }

  if (vpn?.status === "active") {
    return "success";
  }

  if (vpn?.status === "pending") {
    return "warning";
  }

  if (vpn?.status === "revoked") {
    return "danger";
  }

  return "default";
};

const getActionMessage = (action, fallback) => {
  if (action === "sync") {
    return fallback || "Gateway sync completed.";
  }

  if (action === "revoke") {
    return fallback || "Gateway revoke completed.";
  }

  if (action === "role") {
    return fallback || "User role updated successfully.";
  }

  if (action === "delete") {
    return fallback || "User deleted successfully.";
  }

  return fallback || "Action completed successfully.";
};

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
  const [profile, setProfile] = useState(null);
  const [users, setUsers] = useState([]);
  const [gatewayStatus, setGatewayStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [isGatewayLoading, setIsGatewayLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    role: "all",
    subscriptionStatus: "all",
    vpnStatus: "all",
    syncErrorOnly: false,
  });
  const [pendingAction, setPendingAction] = useState("");
  const [confirmState, setConfirmState] = useState(null);

  useEffect(() => {
    const requestedTab = searchParams.get("tab");

    if (requestedTab && adminTabs.some((tab) => tab.id === requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadAdminData = async () => {
      setIsLoading(true);

      try {
        const [profileResult, usersResult, gatewayResult, logsResult] = await Promise.allSettled([
          getProfile(),
          getAdminUsers(),
          getAdminGatewayStatus(),
          getAdminLogs(),
        ]);

        if (profileResult.status === "fulfilled") {
          setProfile(profileResult.value);

          if (profileResult.value?.role !== "admin") {
            router.replace("/dashboard");
            return;
          }
        } else {
          throw profileResult.reason;
        }

        if (usersResult.status === "fulfilled") {
          setUsers(Array.isArray(usersResult.value) ? usersResult.value : []);
        }

        if (gatewayResult.status === "fulfilled") {
          setGatewayStatus(gatewayResult.value || null);
        }

        if (logsResult.status === "fulfilled") {
          setLogs(Array.isArray(logsResult.value) ? logsResult.value : []);
        }

        if (
          usersResult.status === "rejected" &&
          gatewayResult.status === "rejected" &&
          logsResult.status === "rejected"
        ) {
          throw usersResult.reason;
        }
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadAdminData();
  }, [router]);

  const refreshUsers = async () => {
    setIsUsersLoading(true);

    try {
      const data = await getAdminUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (refreshError) {
      setError(refreshError.message);
    } finally {
      setIsUsersLoading(false);
    }
  };

  const refreshGatewayAndLogs = async () => {
    setIsGatewayLoading(true);

    try {
      const [gatewayResult, logsResult] = await Promise.allSettled([
        getAdminGatewayStatus(),
        getAdminLogs(),
      ]);

      if (gatewayResult.status === "fulfilled") {
        setGatewayStatus(gatewayResult.value || null);
      }

      if (logsResult.status === "fulfilled") {
        setLogs(Array.isArray(logsResult.value) ? logsResult.value : []);
      }

      if (gatewayResult.status === "rejected" && logsResult.status === "rejected") {
        throw gatewayResult.reason;
      }
    } catch (refreshError) {
      setError(refreshError.message);
    } finally {
      setIsGatewayLoading(false);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const nextSearch = new URLSearchParams(searchParams.toString());
    nextSearch.set("tab", tabId);
    router.replace(`/admin?${nextSearch.toString()}`);
  };

  const handleRoleChange = async (userId, role) => {
    const actionKey = `role-${userId}`;
    setPendingAction(actionKey);
    setError("");

    const previousUsers = users;
    setUsers((current) =>
      current.map((item) => (item._id === userId ? { ...item, role } : item)),
    );

    try {
      const response = await updateAdminUserRole({ userId, role });
      setToast({
        tone: "success",
        message: getActionMessage("role", response?.message),
      });
      await Promise.all([refreshUsers(), refreshGatewayAndLogs()]);
    } catch (actionError) {
      setUsers(previousUsers);
      setError(actionError.message);
      setToast({
        tone: "danger",
        message: actionError.message,
      });
    } finally {
      setPendingAction("");
    }
  };

  const runConfirmedAction = async () => {
    if (!confirmState) {
      return;
    }

    const { action, userId } = confirmState;
    const actionKey = `${action}-${userId}`;
    setPendingAction(actionKey);
    setError("");

    try {
      let response = null;

      if (action === "sync") {
        response = await syncAdminGatewayUser(userId);
      }

      if (action === "revoke") {
        response = await revokeAdminGatewayUser(userId);
      }

      if (action === "delete") {
        response = await deleteAdminUser(userId);
      }

      setToast({
        tone: "success",
        message: getActionMessage(action, response?.message || response?.data?.message),
      });

      setConfirmState(null);
      await Promise.all([refreshUsers(), refreshGatewayAndLogs()]);
    } catch (actionError) {
      setError(actionError.message);
      setToast({
        tone: "danger",
        message: actionError.message,
      });
    } finally {
      setPendingAction("");
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchTarget = `${user?.name || ""} ${user?.email || ""}`.toLowerCase();
      const matchesSearch =
        !filters.search || searchTarget.includes(filters.search.trim().toLowerCase());
      const matchesRole = filters.role === "all" || user?.role === filters.role;
      const matchesSubscription =
        filters.subscriptionStatus === "all" ||
        user?.subscription?.status === filters.subscriptionStatus;
      const matchesVpn = filters.vpnStatus === "all" || user?.vpn?.status === filters.vpnStatus;
      const hasSyncError = Boolean(user?.lastSyncError || user?.vpn?.lastSyncError);
      const matchesSyncError = !filters.syncErrorOnly || hasSyncError;

      return (
        matchesSearch &&
        matchesRole &&
        matchesSubscription &&
        matchesVpn &&
        matchesSyncError
      );
    });
  }, [filters, users]);

  const overviewStats = useMemo(() => {
    const totalUsers = users.length;
    const activeSubscriptions = users.filter(
      (user) => user?.subscription?.isActive || user?.subscription?.status === "active",
    ).length;
    const vpnPendingSync = users.filter((user) => user?.vpn?.status === "pending").length;
    const usersWithSyncErrors = users.filter(
      (user) => user?.lastSyncError || user?.vpn?.lastSyncError,
    ).length;
    const peerCount = Array.isArray(gatewayStatus?.peers) ? gatewayStatus.peers.length : 0;

    return {
      totalUsers,
      activeSubscriptions,
      vpnPendingSync,
      usersWithSyncErrors,
      peerCount,
    };
  }, [gatewayStatus?.peers, users]);

  const latestLogs = useMemo(() => logs.slice(0, 10), [logs]);

  if (isLoading) {
    return <Loading label="Loading admin dashboard..." />;
  }

  if (profile?.role !== "admin") {
    return <Loading label="Redirecting..." />;
  }

  return (
    <section className="mx-auto w-full max-w-[96rem] px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div className="flex flex-col gap-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              Admin Operations
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
              BRADSafe Control Center
            </h1>
            <p className="max-w-3xl text-base leading-8 text-slate-600">
              Operational visibility for users, gateway state, and admin actions using the
              existing protected backend.
            </p>
          </div>
        </div>

        {toast ? (
          <div
            className={`rounded-2xl border px-5 py-4 text-sm ${
              toast.tone === "danger"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {toast.message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {adminTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-slate-950 text-white shadow-lg shadow-slate-900/20"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" ? (
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/30">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total Users</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">
                    {overviewStats.totalUsers}
                  </p>
                </div>
                <div className="rounded-[1.75rem] border border-emerald-200 bg-white p-5 shadow-lg shadow-slate-200/30">
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">
                    Active Subs
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">
                    {overviewStats.activeSubscriptions}
                  </p>
                </div>
                <div className="rounded-[1.75rem] border border-amber-200 bg-white p-5 shadow-lg shadow-slate-200/30">
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-700">
                    VPN Pending Sync
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">
                    {overviewStats.vpnPendingSync}
                  </p>
                </div>
                <div className="rounded-[1.75rem] border border-rose-200 bg-white p-5 shadow-lg shadow-slate-200/30">
                  <p className="text-xs uppercase tracking-[0.2em] text-rose-700">
                    Sync Errors
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">
                    {overviewStats.usersWithSyncErrors}
                  </p>
                </div>
                <div className="rounded-[1.75rem] border border-sky-200 bg-white p-5 shadow-lg shadow-slate-200/30">
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-700">
                    Gateway Peers
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">
                    {overviewStats.peerCount}
                  </p>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/30">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                      Gateway Health
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                      WireGuard interface summary
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={refreshGatewayAndLogs}
                    disabled={isGatewayLoading}
                    className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isGatewayLoading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Interface Public Key
                    </p>
                    <p
                      className="mt-2 break-all text-sm font-medium text-slate-900"
                      title={gatewayStatus?.interface?.publicKey || ""}
                    >
                      {gatewayStatus?.interface?.publicKey || "Unavailable"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Listen Port
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-950">
                      {gatewayStatus?.interface?.listenPort || "N/A"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Peer Count</p>
                    <p className="mt-2 text-xl font-semibold text-slate-950">
                      {overviewStats.peerCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/30">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Activity Feed
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    Latest admin actions
                  </h2>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                  Latest 10
                </span>
              </div>
              <div className="mt-6 space-y-4">
                {latestLogs.length ? (
                  latestLogs.map((log) => (
                    <article
                      key={log?._id || `${log?.action}-${log?.createdAt}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                    >
                      <p className="text-sm font-semibold text-slate-900">{log?.action}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {log?.adminEmail || "Unknown admin"} acted on{" "}
                        {log?.targetUserEmail || log?.targetUserId || "unknown target"}
                      </p>
                      <p
                        className="mt-2 text-xs text-slate-500"
                        title={formatDate(log?.createdAt)}
                      >
                        {formatRelativeTime(log?.createdAt)}
                      </p>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                    No admin logs available yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "users" ? (
          <div className="space-y-6">
            <div className="grid gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/30 lg:grid-cols-[1.2fr_repeat(4,0.7fr)_auto]">
              <input
                value={filters.search}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, search: event.target.value }))
                }
                placeholder="Search by name or email"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              />
              <select
                value={filters.role}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, role: event.target.value }))
                }
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              >
                <option value="all">All roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <select
                value={filters.subscriptionStatus}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    subscriptionStatus: event.target.value,
                  }))
                }
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              >
                <option value="all">All subscriptions</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
              <select
                value={filters.vpnStatus}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, vpnStatus: event.target.value }))
                }
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              >
                <option value="all">All VPN</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="revoked">Revoked</option>
                <option value="unassigned">Unassigned</option>
              </select>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={filters.syncErrorOnly}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      syncErrorOnly: event.target.checked,
                    }))
                  }
                />
                Sync errors only
              </label>
              <button
                type="button"
                onClick={refreshUsers}
                disabled={isUsersLoading}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUsersLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-lg shadow-slate-200/30">
              {filteredUsers.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-5 py-4 font-medium">Name</th>
                        <th className="px-5 py-4 font-medium">Email</th>
                        <th className="px-5 py-4 font-medium">Role</th>
                        <th className="px-5 py-4 font-medium">Subscription</th>
                        <th className="px-5 py-4 font-medium">Plan</th>
                        <th className="px-5 py-4 font-medium">VPN</th>
                        <th className="px-5 py-4 font-medium">Assigned IP</th>
                        <th className="px-5 py-4 font-medium">Last Synced</th>
                        <th className="px-5 py-4 font-medium">Sync Error</th>
                        <th className="px-5 py-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => {
                        const syncError = user?.lastSyncError || user?.vpn?.lastSyncError || "";
                        const retryVisible = syncError || user?.vpn?.status === "pending";

                        return (
                          <tr key={user?._id} className="border-t border-slate-200 align-top">
                            <td className="px-5 py-4">
                              <div>
                                <p className="font-semibold text-slate-900">{user?.name || "Unknown"}</p>
                                <p className="mt-1 text-xs text-slate-500" title={formatDate(user?.createdAt)}>
                                  Created {formatRelativeTime(user?.createdAt)}
                                </p>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-slate-700">{user?.email || "Unknown"}</td>
                            <td className="px-5 py-4">
                              <select
                                value={user?.role || "user"}
                                onChange={(event) => handleRoleChange(user?._id, event.target.value)}
                                disabled={pendingAction === `role-${user?._id}`}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 disabled:opacity-60"
                              >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                                  getSubscriptionTone(user?.subscription),
                                )}`}
                              >
                                {user?.subscription?.status || "inactive"}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-700">
                              {user?.subscription?.plan || "No plan"}
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                                  getVpnTone(user?.vpn),
                                )}`}
                              >
                                {user?.vpn?.status || "unassigned"}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-700">
                              {user?.vpn?.assignedIp || "Not assigned"}
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className="text-slate-700"
                                title={formatDate(user?.vpn?.lastSyncedAt || user?.lastSyncedAt)}
                              >
                                {formatRelativeTime(user?.vpn?.lastSyncedAt || user?.lastSyncedAt)}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              {syncError ? (
                                <div className="max-w-xs rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-800">
                                  {syncError}
                                </div>
                              ) : (
                                <span className="text-slate-400">None</span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex min-w-[15rem] flex-wrap gap-2">
                                {retryVisible ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setConfirmState({
                                        action: "sync",
                                        userId: user?._id,
                                        label: user?.email,
                                      })
                                    }
                                    disabled={pendingAction === `sync-${user?._id}`}
                                    className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60"
                                  >
                                    Retry Sync
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmState({
                                      action: "sync",
                                      userId: user?._id,
                                      label: user?.email,
                                    })
                                  }
                                  disabled={pendingAction === `sync-${user?._id}`}
                                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                                >
                                  Sync Gateway
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmState({
                                      action: "revoke",
                                      userId: user?._id,
                                      label: user?.email,
                                    })
                                  }
                                  disabled={pendingAction === `revoke-${user?._id}`}
                                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                                >
                                  Revoke Gateway
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmState({
                                      action: "delete",
                                      userId: user?._id,
                                      label: user?.email,
                                    })
                                  }
                                  disabled={pendingAction === `delete-${user?._id}`}
                                  className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
                                >
                                  Delete User
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-10 text-sm text-slate-500">
                  No users match the current filters.
                </div>
              )}
            </div>
          </div>
        ) : null}

        {activeTab === "gateway" ? (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/30">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                      Gateway Summary
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                      WireGuard interface and peers
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={refreshGatewayAndLogs}
                    disabled={isGatewayLoading}
                    className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isGatewayLoading ? "Refreshing..." : "Manual Refresh"}
                  </button>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Public Key
                    </p>
                    <p
                      className="mt-2 break-all text-sm font-medium text-slate-900"
                      title={gatewayStatus?.interface?.publicKey || ""}
                    >
                      {gatewayStatus?.interface?.publicKey || "Unavailable"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Listen Port
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-950">
                      {gatewayStatus?.interface?.listenPort || "N/A"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Fwmark</p>
                    <p className="mt-2 text-xl font-semibold text-slate-950">
                      {gatewayStatus?.interface?.fwmark || "off"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-lg shadow-slate-200/30">
                {gatewayStatus?.peers?.length ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-5 py-4 font-medium">Public Key</th>
                          <th className="px-5 py-4 font-medium">Endpoint</th>
                          <th className="px-5 py-4 font-medium">Allowed IPs</th>
                          <th className="px-5 py-4 font-medium">Latest Handshake</th>
                          <th className="px-5 py-4 font-medium">Rx</th>
                          <th className="px-5 py-4 font-medium">Tx</th>
                          <th className="px-5 py-4 font-medium">Keepalive</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gatewayStatus.peers.map((peer, index) => (
                          <tr
                            key={peer?.publicKey || `${peer?.endpoint}-${index}`}
                            className="border-t border-slate-200 align-top"
                          >
                            <td className="px-5 py-4">
                              <span
                                className="break-all text-slate-800"
                                title={peer?.publicKey || ""}
                              >
                                {peer?.publicKey || "Unavailable"}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-700">
                              {peer?.endpoint || "No endpoint"}
                            </td>
                            <td className="px-5 py-4 text-slate-700">
                              {Array.isArray(peer?.allowedIps) && peer.allowedIps.length
                                ? peer.allowedIps.join(", ")
                                : "None"}
                            </td>
                            <td
                              className="px-5 py-4 text-slate-700"
                              title={peer?.latestHandshake ? formatDate(peer.latestHandshake * 1000) : ""}
                            >
                              {peer?.latestHandshake
                                ? formatRelativeTime(peer.latestHandshake)
                                : "No handshake"}
                            </td>
                            <td className="px-5 py-4 text-slate-700">
                              {formatBytes(peer?.transferRx)}
                            </td>
                            <td className="px-5 py-4 text-slate-700">
                              {formatBytes(peer?.transferTx)}
                            </td>
                            <td className="px-5 py-4 text-slate-700">
                              {peer?.persistentKeepalive ?? "None"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-6 py-10 text-sm text-slate-500">
                    No gateway peers were returned by the server.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/30">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Admin Logs
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    Gateway activity trail
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={refreshGatewayAndLogs}
                  disabled={isGatewayLoading}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGatewayLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>
              <div className="mt-6 space-y-4">
                {logs.length ? (
                  logs.map((log) => (
                    <article
                      key={log?._id || `${log?.action}-${log?.createdAt}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {log?.action || "Unknown action"}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {log?.adminEmail || "Unknown admin"}
                          </p>
                        </div>
                        <span
                          className="text-xs text-slate-500"
                          title={formatDate(log?.createdAt)}
                        >
                          {formatRelativeTime(log?.createdAt)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-600">
                        Target: {log?.targetUserEmail || log?.targetUserId || "Unknown target"}
                      </p>
                      {log?.details ? (
                        <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                    No admin logs returned yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
      {confirmState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/20">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
              Confirm Action
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">
              {confirmState.action === "delete"
                ? "Delete user?"
                : confirmState.action === "revoke"
                  ? "Revoke gateway access?"
                  : "Sync gateway now?"}
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Target: {confirmState.label || confirmState.userId}
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              {confirmState.action === "delete"
                ? "This permanently removes the user record."
                : confirmState.action === "revoke"
                  ? "This removes or disables the user peer from the gateway."
                  : "This manually retries pushing the user to the BRADSafe gateway."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={runConfirmedAction}
                disabled={Boolean(pendingAction)}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  confirmState.action === "delete" || confirmState.action === "revoke"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-slate-950 hover:bg-slate-800"
                }`}
              >
                {pendingAction ? "Working..." : "Confirm"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmState(null)}
                disabled={Boolean(pendingAction)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<Loading label="Loading admin dashboard..." />}>
        <AdminDashboardContent />
      </Suspense>
    </ProtectedRoute>
  );
}
