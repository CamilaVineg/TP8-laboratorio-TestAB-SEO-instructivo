"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { registrarEvento } from "@/lib/db";
import {
  COOKIES,
  EXPERIMENTO,
  parseCookieSesion,
  parseVisitante,
  varianteValida,
} from "@/lib/experiment";

export type EstadoConversion = {
  estado: "inicial" | "ok" | "duplicada" | "invalida" | "error";
  mensaje: string;
};

/**
 * Una conversión por visitante, y sólo desde el CTA.
 *
 * No hay efecto al cargar la página: la acción únicamente existe como
 * `action` del formulario del botón. La base tiene además un índice único por
 * visitante, así que un segundo clic no suma otra conversión.
 */
export async function reservarLugar(
  _estado: EstadoConversion,
  formData: FormData,
): Promise<EstadoConversion> {
  if (formData.get("intent") !== "cta") {
    return {
      estado: "invalida",
      mensaje: "La conversión sólo se registra desde el botón.",
    };
  }

  const store = await cookies();
  const visitante = parseVisitante(store.get(COOKIES.visitante)?.value);
  const variante = store.get(COOKIES.variante)?.value;

  if (!visitante || !varianteValida(variante)) {
    return {
      estado: "invalida",
      mensaje: "No encontramos tu asignación. Recargá la página y volvé a intentar.",
    };
  }

  const sesion = parseCookieSesion(store.get(COOKIES.sesion)?.value)?.id ?? "sin-sesion";

  try {
    const registrada = registrarEvento({
      tipo: "conversion",
      visitante,
      variante,
      sesion,
    });

    revalidatePath(EXPERIMENTO.ruta);

    return registrada
      ? { estado: "ok", mensaje: "Listo: registramos tu lugar." }
      : {
          estado: "duplicada",
          mensaje: "Ya teníamos una reserva tuya. No se cuenta dos veces.",
        };
  } catch (error) {
    console.error("[experimento] no se pudo registrar la conversión", error);
    return {
      estado: "error",
      mensaje: "No pudimos registrar la reserva. Probá de nuevo en un momento.",
    };
  }
}
