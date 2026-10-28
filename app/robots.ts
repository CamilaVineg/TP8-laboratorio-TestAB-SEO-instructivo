import type { MetadataRoute } from "next";

import { URL_BASE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${URL_BASE}/sitemap.xml`,
  };
}
