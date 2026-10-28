import { NextResponse, type NextRequest } from "next/server";

import { registrarEvento } from "@/lib/db";
import {
  CABECERA_VARIANTE,
  COOKIES,
  EXPERIMENTO,
  parseCookieSesion,
  parseVisitante,
  sesionVigente,
  varianteDePreview,
  varianteParaVisitante,
  varianteValida,
  type Variante,
} from "@/lib/experiment";

/**
 * Asignación del experimento.
 *
 * Reglas que se sostienen acá:
 *  - La variante vive en una cookie, nunca en la URL indexable.
 *  - El hash del visitante es determinístico: recargar no cambia el mensaje.
 *  - Una impresión por sesión de 30 minutos, no una por recarga.
 *  - `?preview=` es un instrumento: no asigna, no cuenta y no escribe cookies.
 *  - Un crawler ve siempre el control, en la misma URL y con el mismo canonical.
 */

const SEGUNDOS_SESION = EXPERIMENTO.sesionMinutos * 60;
const SEGUNDOS_VISITANTE = EXPERIMENTO.visitanteDias * 24 * 60 * 60;

const UA_CRAWLER =
  /(googlebot|google-inspectiontool|bingbot|bingpreview|adidxbot|yandex|baiduspider|duckduckbot|applebot|slurp|petalbot|semrushbot|ahrefsbot|mj12bot|dotbot|seznambot|screaming ?frog|siteauditbot|bytespider)/i;

function esCrawler(request: NextRequest): boolean {
  const userAgent = request.headers.get("user-agent");
  // Sin user-agent no hay una persona del otro lado.
  if (!userAgent) return true;
  return UA_CRAWLER.test(userAgent);
}

/**
 * Sólo una navegación de documento es una visita. El POST del CTA, los
 * prefetch del router y las peticiones RSC no suman impresiones.
 */
function esNavegacionDeDocumento(request: NextRequest): boolean {
  if (request.method !== "GET") return false;

  const cabeceras = request.headers;
  if (cabeceras.get("rsc") === "1") return false;
  if (cabeceras.get("next-router-prefetch") === "1") return false;
  if (cabeceras.get("purpose") === "prefetch") return false;

  const destino = cabeceras.get("sec-fetch-dest");
  if (destino && destino !== "document" && destino !== "iframe") return false;

  return true;
}

function opcionesCookie(request: NextRequest, segundos: number) {
  // En la vista previa embebida (iframe) la cookie tiene que ser Secure y
  // SameSite=None, si no el navegador la descarta. En una pestaña normal,
  // SameSite=Lax alcanza.
  const enIframe = request.headers.get("sec-fetch-dest") === "iframe";

  return {
    httpOnly: true,
    path: "/",
    maxAge: segundos,
    sameSite: enIframe ? ("none" as const) : ("lax" as const),
    secure: enIframe || request.nextUrl.protocol === "https:",
  };
}

/** Propaga la variante al render y la deja visible en la respuesta para depurar. */
function responderConVariante(request: NextRequest, variante: Variante) {
  const cabeceras = new Headers(request.headers);
  cabeceras.set(CABECERA_VARIANTE, variante);

  const respuesta = NextResponse.next({ request: { headers: cabeceras } });
  respuesta.headers.set(CABECERA_VARIANTE, variante);
  return respuesta;
}

export function proxy(request: NextRequest) {
  // 1. Preview: muestra un copy sin tocar la asignación ni los conteos.
  const preview = varianteDePreview(
    request.nextUrl.searchParams.get(EXPERIMENTO.parametroPreview),
  );
  if (preview) return responderConVariante(request, preview);

  // 2. Lo que no es una navegación no asigna ni cuenta: sólo hereda la cookie.
  if (!esNavegacionDeDocumento(request)) {
    const guardada = request.cookies.get(COOKIES.variante)?.value;
    return responderConVariante(request, varianteValida(guardada) ? guardada : "a");
  }

  // 3. Crawler: control fijo, sin cookie y sin impresión.
  if (esCrawler(request)) return responderConVariante(request, "a");

  // 4. Persona: visitante estable y variante derivada del hash.
  const ahora = Date.now();
  const visitante =
    parseVisitante(request.cookies.get(COOKIES.visitante)?.value) ?? crypto.randomUUID();
  const guardada = request.cookies.get(COOKIES.variante)?.value;
  const variante = varianteValida(guardada) ? guardada : varianteParaVisitante(visitante);

  // 5. Sesión de 30 minutos. La cookie se renueva en cada visita, pero la
  //    impresión se anota sólo cuando la sesión es nueva.
  const sesionPrevia = parseCookieSesion(request.cookies.get(COOKIES.sesion)?.value);
  const vigente = sesionVigente(sesionPrevia, ahora);
  const sesion =
    vigente && sesionPrevia
      ? sesionPrevia
      : { id: crypto.randomUUID(), inicio: ahora };

  const respuesta = responderConVariante(request, variante);

  respuesta.cookies.set(
    COOKIES.visitante,
    visitante,
    opcionesCookie(request, SEGUNDOS_VISITANTE),
  );
  respuesta.cookies.set(
    COOKIES.variante,
    variante,
    opcionesCookie(request, SEGUNDOS_VISITANTE),
  );
  respuesta.cookies.set(
    COOKIES.sesion,
    `${sesion.id}.${sesion.inicio}`,
    opcionesCookie(request, SEGUNDOS_SESION),
  );

  if (!vigente) {
    try {
      registrarEvento({
        tipo: "impresion",
        visitante,
        variante,
        sesion: sesion.id,
      });
    } catch (error) {
      console.error("[experimento] no se pudo anotar la impresión", error);
    }
  }

  return respuesta;
}

export const config = {
  // Sólo la landing del experimento: /bitacora y los assets no pasan por acá.
  matcher: "/practica",
};
