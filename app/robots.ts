import type { MetadataRoute } from "next";

// See app/sitemap.ts — same reasoning for resolving the production origin.
const BASE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "https://corpnizam.vercel.app";

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
