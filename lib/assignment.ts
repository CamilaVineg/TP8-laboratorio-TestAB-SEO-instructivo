/**
 * Lectura de la asignación del lado del servidor (cookies y cabecera interna).
 *
 * El proxy es el único que asigna y escribe cookies. Acá sólo se lee lo que el
 * proxy dejó para este request.
 */
import { cookies, headers } from "next/headers";

import {
  CABECERA_VARIANTE,
  COOKIES,
  EXPERIMENTO,
  parseVisitante,
  varianteDePreview,
  varianteValida,
  type Variante,
} from "./experiment";

export type Asignacion = { visitante: string; variante: Variante };

/** Lo que quedó persistido en cookies. Si falta algo, no hay asignación. */
export async function leerAsignacion(): Promise<Asignacion | null> {
  const store = await cookies();
  const visitante = parseVisitante(store.get(COOKIES.visitante)?.value);
  const variante = store.get(COOKIES.variante)?.value;

  if (!visitante || !varianteValida(variante)) return null;
  return { visitante, variante };
}

/**
 * Variante de este render. El proxy ya la resolvió (hash, crawler o preview);
 * si no llegó la cabecera, se usa la cookie y, en última instancia, el control.
 */
export async function varianteDelRender(): Promise<Variante> {
  const cabeceras = await headers();
  const desdeCabecera = cabeceras.get(CABECERA_VARIANTE);
  if (varianteValida(desdeCabecera)) return desdeCabecera;

  const asignacion = await leerAsignacion();
  return asignacion?.variante ?? "a";
}

export type Render = { variante: Variante; preview: boolean };

/** `?preview=` manda; si no, se usa la asignación real. */
export async function resolverRender(
  searchParams: Promise<Record<string, string | string[] | undefined>>,
): Promise<Render> {
  const params = await searchParams;
  const preview = varianteDePreview(params[EXPERIMENTO.parametroPreview]);

  if (preview) return { variante: preview, preview: true };
  return { variante: await varianteDelRender(), preview: false };
}
