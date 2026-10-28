/**
 * Origen público del sitio. Se usa para el canonical, el sitemap y robots.
 * En local alcanza con el default; en un deploy conviene declararlo.
 */
export const URL_BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
