import type { MetadataRoute } from "next";

import { URL_BASE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      // Una sola URL indexable: el experimento no publica una ruta por variante.
      url: `${URL_BASE}/practica`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
