import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/opportunities", "/search", "/support", "/about"],
      disallow: [
        "/admin/",
        "/api/",
        "/favorites/",
        "/profile/",
        "/reports/",
        "/submit-opportunity/",
        "/support/requests/",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/auth/",
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
