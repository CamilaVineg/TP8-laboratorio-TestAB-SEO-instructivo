"use server";

import { revalidatePath } from "next/cache";

import { reiniciarEventos } from "@/lib/db";
import { EXPERIMENTO } from "@/lib/experiment";

/**
 * Sólo para desarrollo: deja el log en cero para volver a probar el circuito.
 * En producción no se expone.
 */
export async function reiniciarLog(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("El log de producción no se vacía desde la bitácora.");
  }

  reiniciarEventos();
  revalidatePath(EXPERIMENTO.bitacora);
}
