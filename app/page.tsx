import type { Metadata } from "next";

import { EXPERIMENTO, MENSAJES } from "@/lib/experiment";

export const metadata: Metadata = {
  title: "Taller Norte · Una landing, dos mensajes",
  description:
    "Experimento A/B de Taller Norte: la misma oferta y una sola URL indexable, con dos mensajes asignados por cookie.",
};

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
        Laboratorio 01
      </p>

      <h1 className="mt-4 max-w-3xl text-balance font-serif text-4xl leading-[1.05] text-stone-900 sm:text-5xl">
        Una landing, dos mensajes, una sola URL indexable.
      </h1>

      <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-stone-600">
        El experimento cambia el mensaje, no la oferta. Cada persona ve siempre el
        mismo copy; cada buscador encuentra una sola dirección: {" "}
        <code className="font-mono text-base text-stone-800">{EXPERIMENTO.ruta}</code>.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <a
          href={EXPERIMENTO.ruta}
          className="group rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-colors hover:border-amber-300"
        >
          <h2 className="font-serif text-2xl text-stone-900">Práctica</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            La landing con la variante que te tocó. La asignación queda en una cookie
            de 30 días; recargar no cambia el mensaje.
          </p>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-amber-800">
            Ver {EXPERIMENTO.ruta}
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </span>
        </a>

        <a
          href={EXPERIMENTO.bitacora}
          className="group rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-colors hover:border-amber-300"
        >
          <h2 className="font-serif text-2xl text-stone-900">Bitácora</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            Impresiones, conversiones y tasa por variante, más el caso de prueba
            fijo. La tasa sale de la fórmula, no de un número escrito a mano.
          </p>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-amber-800">
            Ver {EXPERIMENTO.bitacora}
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </span>
        </a>
      </div>

      <section className="mt-10 rounded-2xl border border-dashed border-stone-300 p-6">
        <h2 className="text-sm font-semibold text-stone-900">
          Instrumento: ver las dos piezas sin tocar tu asignación
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-stone-600">
          Las URLs de preview llevan <code className="font-mono text-xs">noindex</code>,
          no escriben cookies y no cuentan como visita. Al salir volvés a tu variante.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {(["a", "b"] as const).map((variante) => (
            <a
              key={variante}
              href={`${EXPERIMENTO.ruta}?${EXPERIMENTO.parametroPreview}=${variante}`}
              className="rounded-full border border-stone-300 bg-white px-4 py-2 font-mono text-xs text-stone-700 transition-colors hover:border-amber-400 hover:text-amber-900"
            >
              {EXPERIMENTO.ruta}?preview={variante} · {MENSAJES[variante].etiqueta}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
