import type { ReactNode } from "react";

import { leerEventos } from "@/lib/db";
import {
  auditarMensajes,
  CASO_PRUEBA,
  CASO_PRUEBA_VISITANTE,
  diferenciaPp,
  EXPERIMENTO,
  formatoCociente,
  formatoNumero,
  formatoPct,
  formatoPp,
  formatoRecorte,
  hashVisitante,
  LIMITES_SEO,
  MENSAJES,
  tasa,
  validarEventos,
  varianteParaVisitante,
  VARIANTES,
  type Conteos,
  type ResultadoValidacion,
  type Variante,
} from "@/lib/experiment";
import { reiniciarLog } from "./actions";

// La bitácora se lee siempre del log, nunca de una copia cacheada.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bitácora del experimento · Taller Norte",
  description:
    "Impresiones, conversiones y tasa por variante, más el caso de prueba fijo del experimento A/B.",
};

function nombreVariante(variante: Variante): string {
  return `${variante.toUpperCase()} · ${MENSAJES[variante].etiqueta}`;
}

export default function PaginaBitacora() {
  let validacion: ResultadoValidacion | null = null;
  let errorLectura: string | null = null;

  try {
    validacion = validarEventos(leerEventos());
  } catch (error) {
    errorLectura =
      error instanceof Error ? error.message : "No se pudo leer la base de eventos.";
  }

  const tasaControl = tasa(CASO_PRUEBA.a);
  const tasaTratamiento = tasa(CASO_PRUEBA.b);
  const diferenciaCaso = diferenciaPp(CASO_PRUEBA.a, CASO_PRUEBA.b);
  const asignacionDemo = varianteParaVisitante(CASO_PRUEBA_VISITANTE);
  const hashDemo = hashVisitante(CASO_PRUEBA_VISITANTE);
  const enProduccion = process.env.NODE_ENV === "production";

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
        Laboratorio 01
      </p>
      <h1 className="mt-3 font-serif text-4xl text-stone-900">Bitácora</h1>
      <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-stone-600">
        El caso de prueba fijo, el log real del sitio y la asignación. La tasa sale
        de dividir conversiones por impresiones: no está escrita a mano. Acá no se
        declara ganador.
      </p>

      <div className="mt-10 space-y-6">
        <Seccion
          titulo="Caso de prueba fijo"
          descripcion="No sale de tu sesión: tiene que dar lo mismo aunque nadie haya entrado. Sirve para corregir el cálculo sin discutir la muestra."
        >
          <TablaConteos
            conteos={CASO_PRUEBA}
            diferencia={diferenciaCaso}
            etiquetaDiferencia="B − A"
          />

          <dl className="mt-6 grid gap-2 rounded-xl bg-stone-50 p-4 font-mono text-xs leading-relaxed text-stone-700 sm:text-sm">
            <div>
              <dt className="inline text-stone-500">A: </dt>
              <dd className="inline">
                18 / 240 = {formatoCociente(CASO_PRUEBA.a.conversiones, CASO_PRUEBA.a.impresiones)}{" "}
                → {formatoPct(tasaControl)}
              </dd>
            </div>
            <div>
              <dt className="inline text-stone-500">B: </dt>
              <dd className="inline">
                31 / 236 = {formatoCociente(CASO_PRUEBA.b.conversiones, CASO_PRUEBA.b.impresiones)}…{" "}
                → {formatoPct(tasaTratamiento)}
              </dd>
            </div>
            <div>
              <dt className="inline text-stone-500">B − A: </dt>
              <dd className="inline">
                {formatoRecorte(tasaTratamiento ?? 0)}… − {formatoNumero(tasaControl ?? 0)} ={" "}
                {formatoPp(diferenciaCaso)}
              </dd>
            </div>
          </dl>

          <p className="mt-4 text-sm leading-relaxed text-stone-600">
            La diferencia en puntos porcentuales es{" "}
            <strong>{formatoPp(diferenciaCaso)}</strong>. Una diferencia no es una
            prueba: no se declara ganador con estos números.
          </p>
        </Seccion>

        <Seccion
          titulo="Log del sitio"
          descripcion="Lo que se registró en la base con las visitas reales. Sin impresiones no hay tasa: se muestra —, no 0%."
        >
          {errorLectura ? (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">
              No se pudo leer el log: {errorLectura}
            </p>
          ) : validacion ? (
            <>
              <TablaConteos
                conteos={validacion.conteos}
                diferencia={diferenciaPp(validacion.conteos.a, validacion.conteos.b)}
                etiquetaDiferencia="B − A"
              />

              <p className="mt-4 text-sm text-stone-600">
                {validacion.validos.length} evento
                {validacion.validos.length === 1 ? "" : "s"} válido
                {validacion.validos.length === 1 ? "" : "s"} ·{" "}
                {validacion.descartados} descartado
                {validacion.descartados === 1 ? "" : "s"} por validación.
              </p>

              {validacion.validos.length === 0 && (
                <p className="mt-2 text-sm text-stone-500">
                  Todavía no hay visitas registradas. Abrí{" "}
                  <a
                    href={EXPERIMENTO.ruta}
                    className="font-medium text-amber-800 underline-offset-2 hover:underline"
                  >
                    {EXPERIMENTO.ruta}
                  </a>{" "}
                  para generar la primera impresión.
                </p>
              )}
            </>
          ) : null}

          <p className="mt-6 text-xs leading-relaxed text-stone-500">
            Validación aplicada al leer: tipo y variante conocidos, identificadores
            con formato válido, fecha no futura, una impresión por visitante y
            sesión, una conversión por visitante y un solo mensaje por visitante.
            Lo que no pasa, no se cuenta.
          </p>
        </Seccion>

        <Seccion
          titulo="Asignación estable"
          descripcion="FNV-1a de 32 bits sobre los bytes UTF-8 del identificador. La variante es el hash módulo 2: ni Math.random() ni la URL. Repetirlo no cambia el resultado."
        >
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-500">
                  <th className="py-2 pr-4 font-medium">Prueba</th>
                  <th className="py-2 pr-4 font-medium">Identificador</th>
                  <th className="py-2 pr-4 font-medium">Hash</th>
                  <th className="py-2 pr-4 font-medium">Mód. 2</th>
                  <th className="py-2 font-medium">Variante</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs tabular-nums sm:text-sm">
                {[1, 2, 3].map((intento) => (
                  <tr key={intento} className="border-b border-stone-100 last:border-0">
                    <td className="py-2 pr-4 font-sans text-stone-500">
                      Repetición {intento}
                    </td>
                    <td className="py-2 pr-4">{CASO_PRUEBA_VISITANTE}</td>
                    <td className="py-2 pr-4">
                      0x{hashDemo.toString(16).padStart(8, "0")}
                    </td>
                    <td className="py-2 pr-4">{hashDemo % 2}</td>
                    <td className="py-2 font-sans font-medium text-stone-900">
                      {nombreVariante(asignacionDemo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-stone-600">
            {CASO_PRUEBA_VISITANTE} cae siempre en la variante{" "}
            <strong>{asignacionDemo.toUpperCase()}</strong>. El visitante y la
            variante se persisten en cookies de 30 días; la variante nunca viaja en
            la URL canónica.
          </p>
        </Seccion>

        <Seccion
          titulo="Metadatos publicados"
          descripcion="Title y description dependen de la variante y se renderizan en el servidor. El canonical es uno solo: /practica, sin query."
        >
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {auditarMensajes().map((auditoria) => (
              <article
                key={auditoria.variante}
                className="rounded-xl border border-stone-200 p-4"
              >
                <header className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-stone-900">
                    {nombreVariante(auditoria.variante)}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide ${
                      auditoria.enRango
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-red-50 text-red-800"
                    }`}
                  >
                    {auditoria.enRango ? "En rango" : "Fuera de rango"}
                  </span>
                </header>

                <p className="mt-4 text-[0.7rem] font-semibold uppercase tracking-wide text-stone-500">
                  Title · {auditoria.title} caracteres (
                  {LIMITES_SEO.title.min}–{LIMITES_SEO.title.max})
                </p>
                <p className="mt-1 text-sm text-stone-800">
                  {MENSAJES[auditoria.variante].title}
                </p>

                <p className="mt-4 text-[0.7rem] font-semibold uppercase tracking-wide text-stone-500">
                  Description · {auditoria.description} caracteres (
                  {LIMITES_SEO.description.min}–{LIMITES_SEO.description.max})
                </p>
                <p className="mt-1 text-sm leading-relaxed text-stone-600">
                  {MENSAJES[auditoria.variante].description}
                </p>
              </article>
            ))}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-stone-600">
            Canonical: <code className="font-mono text-xs">/practica</code> en las
            dos variantes. <code className="font-mono text-xs">?preview=a</code> y{" "}
            <code className="font-mono text-xs">?preview=b</code> agregan{" "}
            <code className="font-mono text-xs">noindex</code> y no cuentan visitas.
          </p>
        </Seccion>

        {!enProduccion && (
          <Seccion
            titulo="Desarrollo"
            descripcion="La base vive en data/experimento.db. Vaciar el log sirve para volver a probar el circuito desde cero; esta acción no existe en producción."
          >
            <form action={reiniciarLog} className="mt-4">
              <button
                type="submit"
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-800"
              >
                Vaciar log local
              </button>
            </form>
          </Seccion>
        )}
      </div>
    </main>
  );
}

function Seccion({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="font-serif text-2xl text-stone-900">{titulo}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
        {descripcion}
      </p>
      {children}
    </section>
  );
}

function TablaConteos({
  conteos,
  diferencia,
  etiquetaDiferencia,
}: {
  conteos: Record<Variante, Conteos>;
  diferencia: number | null;
  etiquetaDiferencia: string;
}) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[30rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-500">
            <th className="py-2 pr-4 font-medium">Variante</th>
            <th className="py-2 pr-4 text-right font-medium">Impresiones</th>
            <th className="py-2 pr-4 text-right font-medium">Conversiones</th>
            <th className="py-2 text-right font-medium">Tasa</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {VARIANTES.map((variante) => (
            <tr key={variante} className="border-b border-stone-100">
              <td className="py-3 pr-4 font-medium text-stone-900">
                {nombreVariante(variante)}
              </td>
              <td className="py-3 pr-4 text-right">
                {conteos[variante].impresiones}
              </td>
              <td className="py-3 pr-4 text-right">
                {conteos[variante].conversiones}
              </td>
              <td className="py-3 text-right font-medium">
                {formatoPct(tasa(conteos[variante]))}
              </td>
            </tr>
          ))}
          <tr className="border-t-2 border-stone-200">
            <td className="py-3 pr-4 font-medium text-stone-700">
              {etiquetaDiferencia}
            </td>
            <td className="py-3 pr-4 text-right text-stone-400">—</td>
            <td className="py-3 pr-4 text-right text-stone-400">—</td>
            <td className="py-3 text-right font-semibold text-stone-900">
              {formatoPp(diferencia)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
