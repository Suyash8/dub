// ============================================================
// SELF-HOST CONFIGURATION — edit these two lines for your setup:
//   APP_DOMAIN:  where the Dub dashboard (UI) is served
//   SHORT_DOMAIN: where your short links live
// They must be different hostnames (e.g. app.example.com and
// go.example.com). Run ./set-domains.sh to do this
// automatically across the whole repo.
// ============================================================
export const SHORT_DOMAIN = "go.example.com";

export const API_HOSTNAMES = new Set([
  "api.dub.co",
  "api-staging.dub.co",
  `api.${SHORT_DOMAIN}`,
  "api.localhost:8888",
  "api.localhost",
]);

export const API_DOMAIN =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
    ? `https://${SHORT_DOMAIN}`
    : process.env.NEXT_PUBLIC_VERCEL_ENV === "preview"
      ? `https://${SHORT_DOMAIN}`
      : "http://api.localhost:8888";

export const APP_DOMAIN =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
    ? "https://app.example.com"
    : process.env.NEXT_PUBLIC_VERCEL_ENV === "preview"
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL || "app.example.com"}`
      : "http://localhost:8888";

export const APP_DOMAIN_WITH_NGROK =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
    ? "https://app.example.com"
    : process.env.NEXT_PUBLIC_VERCEL_ENV === "preview"
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL || "preview.dub.co"}`
      : process.env.NEXT_PUBLIC_NGROK_URL || "http://localhost:8888";

export const isAppHostname = (hostname: string) => {
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === "preview") {
    // pattern of our preview URLs are always "dub-<random-string>.dub.co"
    return hostname.startsWith("dub-") && hostname.endsWith(".dub.co");
  }
  return new Set(["app.example.com", "localhost:8888", "localhost"]).has(
    hostname,
  );
};

export const DUB_LOGO = "https://assets.dub.co/logo.png";
export const DUB_LOGO_SQUARE = "https://assets.dub.co/logo-square.png";
export const DUB_QR_LOGO = "https://assets.dub.co/logo.png";
export const DUB_WORDMARK = "https://assets.dub.co/wordmark.png";
export const DUB_THUMBNAIL = "https://assets.dub.co/thumbnail.jpg";

export const DUB_WORKSPACE_ID = "cl7pj5kq4006835rbjlt2ofka";
export const ACME_WORKSPACE_ID = "clrei1gld0002vs9mzn93p8ik";
export const LEGAL_WORKSPACE_ID = "clrflia0j0000vs7sqfhz9c7q";
export const LEGAL_USER_ID = "clqei1lgc0000vsnzi01pbf47";

export const R2_URL = process.env.STORAGE_BASE_URL || "https://dubassets.com";
