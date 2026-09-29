import type { MetadataRoute } from "next";

// VERCEL_PROJECT_PRODUCTION_URL always points at the project's production
// domain (the custom domain if one is configured), so preview deployments
// don't list themselves — crawlers are meant to only ever see production.
const BASE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "https://corpnizam.vercel.app";

// Only public, unauthenticated routes belong here — everything under the
// (app) route group requires a session and middleware redirects logged-out
// visitors away from it, so it has no business being indexed.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/signup`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.8,
    },
  ];
}
