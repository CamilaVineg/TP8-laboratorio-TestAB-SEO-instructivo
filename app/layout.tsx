import type { Metadata } from "next";
import Link from "next/link";

import { EXPERIMENTO } from "@/lib/experiment";
import { URL_BASE } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(URL_BASE),
  title: "Taller Norte · Escuela de oficios",
  description:
    "Cursos de oficio de ocho semanas, en grupos de doce. Carpintería, electricidad y cocina.",
  applicationName: "Taller Norte",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full">
      <body className="flex min-h-full flex-col bg-stone-50 font-sans text-stone-900 antialiased">
        <header className="border-b border-stone-200">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
            <Link href="/" className="inline-flex items-baseline gap-2">
              <span className="font-serif text-lg font-semibold tracking-tight text-stone-900">
                Taller Norte
              </span>
              <span className="text-[0.7rem] uppercase tracking-[0.16em] text-stone-500">
                Escuela de oficios
              </span>
            </Link>

            {/* Anclas comunes a propósito: la impresión se cuenta en el request
                del documento, no en un prefetch del router. */}
            <nav aria-label="Secciones" className="flex items-center gap-5 text-sm">
              <a
                href={EXPERIMENTO.ruta}
                className="text-stone-600 underline-offset-4 transition-colors hover:text-stone-900 hover:underline"
              >
                Práctica
              </a>
              <a
                href={EXPERIMENTO.bitacora}
                className="text-stone-600 underline-offset-4 transition-colors hover:text-stone-900 hover:underline"
              >
                Bitácora
              </a>
            </nav>
          </div>
        </header>

        {children}

        <footer className="border-t border-stone-200">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-6 py-6 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
            <p>Taller Norte es una escuela ficticia. La oferta es la del enunciado.</p>
            <p>Programación Avanzada · 2026</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
