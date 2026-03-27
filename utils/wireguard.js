"use client";

const base64UrlToBase64 = (value) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;

  if (!padding) {
    return normalized;
  }

  return `${normalized}${"=".repeat(4 - padding)}`;
};

export const isWireguardSupported = () =>
  typeof window !== "undefined" &&
  typeof window.crypto?.subtle?.generateKey === "function";

export const generateWireguardKeyPair = async () => {
  if (!isWireguardSupported()) {
    throw new Error("WireGuard key generation is not supported in this browser.");
  }

  const cryptoKeyPair = await window.crypto.subtle.generateKey(
    {
      name: "X25519",
    },
    true,
    ["deriveBits"],
  );

  const exportedPrivateKey = await window.crypto.subtle.exportKey("jwk", cryptoKeyPair.privateKey);
  const exportedPublicKey = await window.crypto.subtle.exportKey("jwk", cryptoKeyPair.publicKey);

  if (!exportedPrivateKey.d || !exportedPublicKey.x) {
    throw new Error("Unable to export the generated WireGuard keys.");
  }

  return {
    privateKey: base64UrlToBase64(exportedPrivateKey.d),
    publicKey: base64UrlToBase64(exportedPublicKey.x),
  };
};

export const buildWireguardConfig = ({ template, privateKey }) =>
  template.replace("PrivateKey = <YOUR_PRIVATE_KEY>", `PrivateKey = ${privateKey}`);

export const downloadTextFile = ({ content, fileName, contentType = "text/plain;charset=utf-8" }) => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  anchor.click();

  URL.revokeObjectURL(url);
};

export const formatWireguardConfigFromAccessState = (vpnAccess, privateKey) => {
  const clientConfiguration = vpnAccess?.clientConfiguration || {};
  const gatewayConfiguration = vpnAccess?.gatewayConfiguration || {};

  return [
    "[Interface]",
    `PrivateKey = ${privateKey}`,
    `Address = ${clientConfiguration.address || ""}`,
    `DNS = ${clientConfiguration.dns || ""}`,
    "",
    "[Peer]",
    `PublicKey = ${gatewayConfiguration.hostPublicKey || ""}`,
    `Endpoint = ${gatewayConfiguration.endpoint || ""}`,
    `AllowedIPs = ${gatewayConfiguration.allowedIps || ""}`,
    `PersistentKeepalive = ${gatewayConfiguration.persistentKeepalive || ""}`,
  ].join("\n");
};
