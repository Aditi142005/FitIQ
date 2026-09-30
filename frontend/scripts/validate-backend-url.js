const { isIP } = require("node:net");
const { readFileSync } = require("node:fs");

const productionEnv = readFileSync(".env.production", "utf8");
const productionBackendUrl = productionEnv
  .split(/\r?\n/)
  .map((line) => line.trim())
  .find((line) => line.startsWith("REACT_APP_BACKEND_URL="))
  ?.slice("REACT_APP_BACKEND_URL=".length)
  .trim();
const value = (
  process.env.REACT_APP_BACKEND_URL ||
  productionBackendUrl ||
  ""
).trim();

if (!value) {
  console.error(
    "Set REACT_APP_BACKEND_URL to the deployed FitIQ HTTPS backend origin before building an Android APK."
  );
  process.exit(1);
}

let backendUrl;

try {
  backendUrl = new URL(value);
} catch {
  console.error("REACT_APP_BACKEND_URL must be a valid HTTPS origin.");
  process.exit(1);
}

const hostname = backendUrl.hostname.toLowerCase();
const ipHostname = hostname.replace(/^\[|\]$/g, "");
const ipVersion = isIP(ipHostname);
const isLocalHostname =
  hostname === "localhost" ||
  hostname.endsWith(".localhost") ||
  hostname.endsWith(".local") ||
  hostname.endsWith(".internal");

if (
  backendUrl.protocol !== "https:" ||
  backendUrl.username ||
  backendUrl.password ||
  backendUrl.pathname !== "/" ||
  backendUrl.search ||
  backendUrl.hash ||
  isLocalHostname ||
  ipVersion !== 0
) {
  console.error(
    "Android APK builds require a public HTTPS hostname; localhost, IP addresses, and URL paths are not allowed."
  );
  process.exit(1);
}

console.log(`Using HTTPS backend origin: ${backendUrl.origin}`);
