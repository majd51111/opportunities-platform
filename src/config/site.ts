const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
const appUrl = configuredUrl && !/localhost|127\.0\.0\.1/i.test(configuredUrl)
  ? configuredUrl
  : "https://www.gitopp.com";

export const siteConfig = {
  name: "Opportunities Platform",
  description:
    "Discover opportunities, manage profiles, save favorites, and access admin tools.",
  url: appUrl,
} as const;
