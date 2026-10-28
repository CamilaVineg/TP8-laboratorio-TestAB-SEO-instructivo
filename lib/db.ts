/**
 * Persistencia del log del experimento en SQLite.
 *
 * La cookie alcanza para el visitante y la variante, no para los conteos: los
 * eventos viven en una base. Se usa `node:sqlite` (incluido en Node 22.5+),
 * así que no hay servicio externo ni dependencia nativa.
 *
 * La base se crea sola en `data/experimento.db` (ignorada por git). Se puede
 * cambiar con la variable EXPERIMENTO_DB.
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import type { TipoEvento, Variante } from "./experiment";

const RUTA_BASE =
  process.env.EXPERIMENTO_DB ?? path.join(process.cwd(), "data", "experimento.db");

const ESQUEMA = `
  CREATE TABLE IF NOT EXISTS eventos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo        TEXT NOT NULL CHECK (tipo IN ('impresion', 'conversion')),
    visitante   TEXT NOT NULL,
    variante    TEXT NOT NULL CHECK (variante IN ('a', 'b')),
    sesion      TEXT NOT NULL,
    creado_en   TEXT NOT NULL
  );

  -- Una impresión por visitante y sesión.
  CREATE UNIQUE INDEX IF NOT EXISTS ux_eventos_impresion
    ON eventos (visitante, sesion) WHERE tipo = 'impresion';

  -- Una conversión por visitante.
  CREATE UNIQUE INDEX IF NOT EXISTS ux_eventos_conversion
    ON eventos (visitante) WHERE tipo = 'conversion';

  CREATE INDEX IF NOT EXISTS ix_eventos_tipo ON eventos (tipo);
`;

// En desarrollo el módulo se recarga con cada cambio: se reutiliza la conexión.
const cacheGlobal = globalThis as typeof globalThis & { __tnBase?: DatabaseSync };

function abrirBase(): DatabaseSync {
  mkdirSync(path.dirname(RUTA_BASE), { recursive: true });
  const base = new DatabaseSync(RUTA_BASE);
  base.exec("PRAGMA journal_mode = WAL");
  base.exec("PRAGMA busy_timeout = 5000");
  base.exec(ESQUEMA);
  return base;
}

function base(): DatabaseSync {
  if (!cacheGlobal.__tnBase) cacheGlobal.__tnBase = abrirBase();
  return cacheGlobal.__tnBase;
}

export type EventoNuevo = {
  tipo: TipoEvento;
  visitante: string;
  variante: Variante;
  sesion: string;
};

/**
 * Inserta un evento y devuelve si entró. Las restricciones únicas de la base
 * son la última defensa: un segundo clic o una recarga no suman de más.
 */
export function registrarEvento(evento: EventoNuevo): boolean {
  const resultado = base()
    .prepare(
      `INSERT OR IGNORE INTO eventos (tipo, visitante, variante, sesion, creado_en)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      evento.tipo,
      evento.visitante,
      evento.variante,
      evento.sesion,
      new Date().toISOString(),
    );

  return Number(resultado.changes) > 0;
}

export function hayConversion(visitante: string): boolean {
  const fila = base()
    .prepare(
      `SELECT 1 AS existe FROM eventos
       WHERE tipo = 'conversion' AND visitante = ?
       LIMIT 1`,
    )
    .get(visitante);

  return Boolean(fila);
}

/** Filas crudas, de la más vieja a la más nueva, para validar antes de contar. */
export function leerEventos(limite = 20_000): unknown[] {
  const filas = base()
    .prepare(
      `SELECT id, tipo, visitante, variante, sesion, creado_en AS creadoEn
       FROM eventos
       ORDER BY id DESC
       LIMIT ?`,
    )
    .all(limite);

  return filas.reverse();
}

/** Sólo para desarrollo: deja el log en cero para volver a probar. */
export function reiniciarEventos(): void {
  base().exec("DELETE FROM eventos");
}

export function rutaBaseDeDatos(): string {
  return RUTA_BASE;
}
