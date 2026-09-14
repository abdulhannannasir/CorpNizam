import type { MetadataRoute } from "next";

const BASE_URL = "https://corpnizam.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/signup"],
      // Everything else requires a session and redirects logged-out
      // crawlers to /login anyway — no reason to let it be indexed.
      disallow: ["/dashboard", "/companies", "/onboarding", "/audit", "/ask", "/settings", "/tasks"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
