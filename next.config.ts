import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La landing depende de cookies y headers en cada request, y la bitácora lee
  // la base en cada visita: no hay nada que precachear acá.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
