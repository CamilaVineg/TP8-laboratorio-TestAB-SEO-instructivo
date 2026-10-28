import { OFERTA_FILAS } from "@/lib/experiment";

/**
 * La oferta es idéntica en las dos variantes porque sale de una sola fuente.
 * El experimento cambia el mensaje, nunca estos cuatro datos.
 */
export function Oferta() {
  return (
    <aside
      aria-labelledby="oferta-titulo"
      className="h-fit rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
        La oferta
      </p>
      <h2
        id="oferta-titulo"
        className="mt-2 font-serif text-2xl leading-snug text-stone-900"
      >
        Cuatro datos, iguales en las dos variantes
      </h2>

      <dl className="mt-6 border-y border-stone-100">
        {OFERTA_FILAS.map((fila, indice) => (
          <div
            key={fila.etiqueta}
            className={`flex items-baseline justify-between gap-6 py-3 ${
              indice > 0 ? "border-t border-stone-100" : ""
            }`}
          >
            <dt className="text-sm text-stone-500">{fila.etiqueta}</dt>
            <dd className="text-right text-sm font-medium tabular-nums text-stone-900">
              {fila.valor}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-6 text-xs leading-relaxed text-stone-500">
        Si cambia alguno de estos datos, ya no es el mismo experimento. Se leen de
        una sola fuente compartida por A y por B.
      </p>
    </aside>
  );
}
