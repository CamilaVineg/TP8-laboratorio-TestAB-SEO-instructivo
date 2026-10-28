import type { ReactNode } from "react";

import { OFERTA, type Mensaje } from "@/lib/experiment";

/**
 * El mensaje: lo único que puede diferir entre variantes.
 * Titular, bajada y llamado a la acción salen del copy de la variante asignada.
 */
export function BloqueMensaje({
  mensaje,
  preview = false,
  children,
}: {
  mensaje: Mensaje;
  preview?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
        Cursos de oficio · Inicio {OFERTA.inicio}
      </p>

      <h1 className="mt-4 max-w-2xl text-balance font-serif text-4xl leading-[1.05] text-stone-900 sm:text-5xl">
        {mensaje.titular}
      </h1>

      <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-stone-600">
        {mensaje.bajada}
      </p>

      <div className="mt-8">{children}</div>

      <p className="mt-4 text-xs text-stone-500">{mensaje.notaCta}</p>

      <p className="mt-10 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-500">
        <span className="size-1.5 rounded-full bg-amber-600" aria-hidden />
        {preview ? "Vista previa" : "Asignación por cookie"} · Variante{" "}
        <strong className="font-semibold text-stone-700">
          {mensaje.variante.toUpperCase()} · {mensaje.etiqueta}
        </strong>
      </p>
    </div>
  );
}
