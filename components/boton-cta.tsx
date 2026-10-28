"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { reservarLugar } from "@/app/practica/actions";
import type { EstadoConversion } from "@/app/practica/actions";

const ESTADO_INICIAL: EstadoConversion = { estado: "inicial", mensaje: "" };

/**
 * El único lugar desde el que se registra una conversión es este formulario.
 * Cargar la página no convierte: hay que hacer clic en el CTA.
 */
export function BotonCta({ cta }: { cta: string }) {
  const [estado, accion] = useActionState(reservarLugar, ESTADO_INICIAL);

  const conError = estado.estado === "invalida" || estado.estado === "error";
  const confirmado = estado.estado === "ok" || estado.estado === "duplicada";

  return (
    <form action={accion} className="space-y-3">
      <input type="hidden" name="intent" value="cta" />
      <Boton>{cta}</Boton>

      {conError && (
        <p role="alert" className="max-w-md text-sm text-red-700">
          {estado.mensaje}
        </p>
      )}

      {confirmado && (
        <p className="max-w-md text-sm text-emerald-800">{estado.mensaje}</p>
      )}

      <p className="sr-only" aria-live="polite">
        {estado.mensaje}
      </p>
    </form>
  );
}

function Boton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-3 rounded-full bg-amber-800 px-6 py-3 text-sm font-semibold text-amber-50 transition-colors hover:bg-amber-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-900 disabled:cursor-progress disabled:opacity-70"
    >
      {pending ? "Registrando…" : children}
      <span aria-hidden className="text-base leading-none">
        →
      </span>
    </button>
  );
}
