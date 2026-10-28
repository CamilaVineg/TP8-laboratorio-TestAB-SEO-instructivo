import type { Metadata } from "next";

import { BotonCta } from "@/components/boton-cta";
import { BloqueMensaje } from "@/components/mensaje";
import { Oferta } from "@/components/oferta";
import { leerAsignacion, resolverRender } from "@/lib/assignment";
import { hayConversion } from "@/lib/db";
import { EXPERIMENTO, MENSAJES, type Variante } from "@/lib/experiment";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { variante, preview } = await resolverRender(searchParams);
  const mensaje = MENSAJES[variante];

  return {
    // Título absoluto: el de la variante, sin sufijo del layout.
    title: { absolute: mensaje.title },
    description: mensaje.description,
    // Una sola URL indexable, sin query, para las dos variantes.
    alternates: { canonical: EXPERIMENTO.ruta },
    // El preview es un instrumento de revisión, no una página del sitio.
    robots: preview ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: EXPERIMENTO.nombre,
      locale: "es_AR",
      url: EXPERIMENTO.ruta,
      title: mensaje.title,
      description: mensaje.description,
    },
  };
}

export default async function PaginaPractica({ searchParams }: Props) {
  const { variante, preview } = await resolverRender(searchParams);
  const mensaje = MENSAJES[variante];

  // En preview no se consulta ni se escribe nada del experimento.
  const asignacion = preview ? null : await leerAsignacion();
  const yaConvirtio = asignacion ? hayConversion(asignacion.visitante) : false;

  return (
    <main className="flex-1">
      {preview && <AvisoPreview variante={variante} />}

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-20">
        <BloqueMensaje mensaje={mensaje} preview={preview}>
          {preview ? (
            <CtaEnPreview cta={mensaje.cta} />
          ) : yaConvirtio ? (
            <Confirmacion />
          ) : (
            <BotonCta cta={mensaje.cta} />
          )}
        </BloqueMensaje>

        <Oferta />
      </section>
    </main>
  );
}

function AvisoPreview({ variante }: { variante: Variante }) {
  return (
    <div className="border-b border-amber-300 bg-amber-100/70">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-6 py-3 text-sm text-amber-950">
        <span className="rounded-full bg-amber-900 px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-amber-50">
          Vista previa
        </span>
        <span>
          Variante{" "}
          <strong>
            {variante.toUpperCase()} · {MENSAJES[variante].etiqueta}
          </strong>
          . Esta URL lleva <code className="font-mono">noindex</code>, no escribe
          cookies y no cuenta como visita ni como conversión.
        </span>
      </div>
    </div>
  );
}

function CtaEnPreview({ cta }: { cta: string }) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled
        className="inline-flex cursor-not-allowed items-center gap-3 rounded-full bg-amber-800 px-6 py-3 text-sm font-semibold text-amber-50 opacity-60"
      >
        {cta}
        <span aria-hidden>→</span>
      </button>
      <p className="max-w-md text-xs text-stone-500">
        En vista previa el botón no envía nada: las conversiones se registran sólo
        desde la landing asignada.
      </p>
    </div>
  );
}

function Confirmacion() {
  return (
    <div className="max-w-md rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
        <span aria-hidden>✓</span> Ya reservaste tu lugar.
      </p>
      <p className="mt-1 text-sm leading-relaxed text-emerald-800">
        El curso empieza el 14 de abril. La conversión se cuenta una sola vez por
        visitante.
      </p>
    </div>
  );
}
