/**
 * Dominio del experimento A/B de Taller Norte.
 *
 * Acá no hay I/O: copy, oferta, caso de prueba, hash, tasas y validación del
 * log son funciones puras. Cualquiera de estos números se puede reproducir a
 * mano, que es justamente lo que pide la consigna.
 */

export const VARIANTES = ["a", "b"] as const;
export type Variante = (typeof VARIANTES)[number];

export const EXPERIMENTO = {
  nombre: "Taller Norte",
  ruta: "/practica",
  bitacora: "/bitacora",
  parametroPreview: "preview",
  /** Una impresión por sesión: 30 minutos. */
  sesionMinutos: 30,
  /** El visitante dura 30 días en la cookie. */
  visitanteDias: 30,
} as const;

/** Nombres de las cookies. Path siempre "/", httpOnly y SameSite según contexto. */
export const COOKIES = {
  visitante: "tn_visitante",
  variante: "tn_variante",
  sesion: "tn_sesion",
} as const;

/**
 * Cabecera interna que el proxy escribe en el request para que la página sepa
 * qué mensaje renderizar. Nunca llega al cliente como dato del query.
 */
export const CABECERA_VARIANTE = "x-tn-variante";

export type Mensaje = {
  variante: Variante;
  etiqueta: string;
  title: string;
  description: string;
  titular: string;
  bajada: string;
  cta: string;
  notaCta: string;
};

// El copy está medido: no se reescribe. Sólo cambia el mensaje, nunca la oferta.
const DESCRIPCION_A =
  "Aprendé carpintería, electricidad o cocina en ocho semanas. Grupos de doce personas y práctica real, con una salida laboral que se puede cobrar.";
const DESCRIPCION_B =
  "El 14 de abril empiezan grupos de doce. En la cohorte anterior, ocho de cada diez consiguieron trabajo en el rubro antes de los noventa días.";

export const MENSAJES: Record<Variante, Mensaje> = {
  a: {
    variante: "a",
    etiqueta: "Control",
    title: "Cursos de oficio en ocho semanas, con salida laboral",
    description: DESCRIPCION_A,
    titular: "Ocho semanas para un oficio que se puede cobrar.",
    bajada: DESCRIPCION_A,
    cta: "Ver cupos de abril",
    notaCta: "Empieza el 14 de abril · Grupos de 12",
  },
  b: {
    variante: "b",
    etiqueta: "Tratamiento",
    title: "Abril abre cupos: cursos de oficio en grupos de 12",
    description: DESCRIPCION_B,
    titular: "El curso empieza el 14 de abril. El cupo, no.",
    bajada: DESCRIPCION_B,
    cta: "Reservar mi lugar",
    notaCta: "Empieza el 14 de abril · Grupos de 12",
  },
};

/**
 * La oferta es una sola y sale de una única fuente para las dos variantes.
 * Si cambia acá, deja de ser el mismo experimento.
 */
export const OFERTA = {
  inicio: "14 de abril",
  duracion: "8 semanas",
  cupo: 12,
  oficios: ["carpintería", "electricidad", "cocina"],
} as const;

export const OFERTA_FILAS = [
  { etiqueta: "Inicio", valor: OFERTA.inicio },
  { etiqueta: "Duración", valor: OFERTA.duracion },
  { etiqueta: "Cupo", valor: `${OFERTA.cupo} personas` },
  { etiqueta: "Oficios", valor: "carpintería, electricidad y cocina" },
] as const;

export const LIMITES_SEO = {
  title: { min: 50, max: 60 },
  description: { min: 140, max: 160 },
} as const;

export type AuditoriaMensaje = {
  variante: Variante;
  title: number;
  description: number;
  enRango: boolean;
};

/** Control de longitudes: 50–60 para title y 140–160 para description. */
export function auditarMensajes(): AuditoriaMensaje[] {
  return VARIANTES.map((variante) => {
    const { title, description } = MENSAJES[variante];
    const enRango =
      title.length >= LIMITES_SEO.title.min &&
      title.length <= LIMITES_SEO.title.max &&
      description.length >= LIMITES_SEO.description.min &&
      description.length <= LIMITES_SEO.description.max;
    return { variante, title: title.length, description: description.length, enRango };
  });
}

/* -------------------------------------------------------------------------- */
/* Asignación                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Hash FNV-1a de 32 bits sobre los bytes UTF-8 del identificador.
 *
 * Es determinístico: el mismo identificador devuelve siempre el mismo número,
 * así que la misma persona ve siempre el mismo mensaje. No usa Math.random()
 * ni la fecha, y no depende de la URL.
 */
export function hashVisitante(visitante: string): number {
  const bytes = new TextEncoder().encode(visitante);
  let hash = 0x811c9dc5;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Variante = hash módulo 2. Estable, reproducible y documentado. */
export function varianteParaVisitante(visitante: string): Variante {
  return hashVisitante(visitante) % 2 === 0 ? "a" : "b";
}

export function varianteValida(valor: unknown): valor is Variante {
  return valor === "a" || valor === "b";
}

/** `?preview=a` o `?preview=b`. Cualquier otro valor no es preview. */
export function varianteDePreview(valor: string | string[] | null | undefined): Variante | null {
  const plano = Array.isArray(valor) ? valor[0] : valor;
  if (plano === "a" || plano === "b") return plano;
  return null;
}

const PATRON_VISITANTE = /^[A-Za-z0-9._-]{4,64}$/;

/** Valida el identificador que viene de la cookie antes de confiar en él. */
export function parseVisitante(valor: string | null | undefined): string | null {
  if (!valor || !PATRON_VISITANTE.test(valor)) return null;
  return valor;
}

/**
 * Cookie de sesión con forma `<uuid>.<epoch ms>`.
 * No se confía en el valor: si no matchea, se trata como sesión nueva.
 */
export function parseCookieSesion(
  valor: string | null | undefined,
): { id: string; inicio: number } | null {
  if (!valor) return null;
  const [id, inicio] = valor.split(".");
  if (!id || !/^[A-Za-z0-9-]{8,64}$/.test(id)) return null;
  const desde = Number(inicio);
  if (!Number.isFinite(desde) || desde <= 0) return null;
  return { id, inicio: desde };
}

export function sesionVigente(
  sesion: { id: string; inicio: number } | null,
  ahora: number,
): boolean {
  if (!sesion) return false;
  const transcurrido = ahora - sesion.inicio;
  return transcurrido >= 0 && transcurrido < EXPERIMENTO.sesionMinutos * 60_000;
}

/* -------------------------------------------------------------------------- */
/* Conteos y tasas                                                             */
/* -------------------------------------------------------------------------- */

export type Conteos = { impresiones: number; conversiones: number };

/**
 * Tasa = conversiones / impresiones, en puntos porcentuales.
 * Sin impresiones no hay tasa: devuelve null (no 0%).
 */
export function tasa(conteos: Conteos): number | null {
  if (!Number.isFinite(conteos.impresiones) || conteos.impresiones <= 0) return null;
  if (!Number.isFinite(conteos.conversiones) || conteos.conversiones < 0) return null;
  return (conteos.conversiones / conteos.impresiones) * 100;
}

/** Diferencia en puntos porcentuales (tratamiento − control). */
export function diferenciaPp(control: Conteos, tratamiento: Conteos): number | null {
  const base = tasa(control);
  const variante = tasa(tratamiento);
  if (base === null || variante === null) return null;
  return variante - base;
}

/** Dos decimales, con coma. */
export function formatoNumero(valor: number, decimales = 2): string {
  const factor = 10 ** decimales;
  const redondeado = Math.round((valor + Number.EPSILON) * factor) / factor;
  return redondeado.toFixed(decimales).replace(".", ",").replace(/^-/, "−");
}

export function formatoPct(valor: number | null): string {
  return valor === null ? "—" : `${formatoNumero(valor)}%`;
}

export function formatoPp(valor: number | null): string {
  return valor === null ? "—" : `${formatoNumero(valor)} pp`;
}

/** Cociente truncado (no redondeado), para mostrar la división cruda. */
export function formatoCociente(numerador: number, denominador: number): string {
  if (!Number.isFinite(numerador) || !Number.isFinite(denominador) || denominador <= 0) {
    return "—";
  }
  const truncado = Math.trunc((numerador / denominador) * 1_000_000) / 1_000_000;
  return truncado.toFixed(6).replace(/0+$/, "").replace(/\.$/, "").replace(".", ",");
}

/** Trunca (no redondea) para mostrar el valor antes del redondeo final. */
export function formatoRecorte(valor: number, decimales = 4): string {
  const factor = 10 ** decimales;
  return (Math.trunc(valor * factor) / factor).toFixed(decimales).replace(".", ",");
}

/** Caso fijo de la consigna: no sale de la sesión, se puede recalcular a mano. */
export const CASO_PRUEBA: Record<Variante, Conteos> = {
  a: { impresiones: 240, conversiones: 18 },
  b: { impresiones: 236, conversiones: 31 },
};

export const CASO_PRUEBA_VISITANTE = "lab-visitor-demo-01";

/* -------------------------------------------------------------------------- */
/* Log de eventos                                                              */
/* -------------------------------------------------------------------------- */

export type TipoEvento = "impresion" | "conversion";

export type Evento = {
  id: number;
  tipo: TipoEvento;
  visitante: string;
  variante: Variante;
  sesion: string;
  creadoEn: string;
};

export type ResultadoValidacion = {
  validos: Evento[];
  descartados: number;
  conteos: Record<Variante, Conteos>;
};

const TIPOS: readonly TipoEvento[] = ["impresion", "conversion"];
const PATRON_SESION = /^[A-Za-z0-9-]{8,64}$/;
const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

/**
 * Convierte una fila cruda de la base en un evento confiable.
 * Lo que no pasa esta validación no se cuenta.
 */
export function parseEvento(crudo: unknown, ahora = Date.now()): Evento | null {
  if (typeof crudo !== "object" || crudo === null) return null;
  const fila = crudo as Record<string, unknown>;

  const id = Number(fila.id);
  if (!Number.isInteger(id) || id <= 0) return null;

  const tipo = fila.tipo;
  if (tipo !== "impresion" && tipo !== "conversion") return null;
  if (!TIPOS.includes(tipo)) return null;

  const variante = fila.variante;
  if (!varianteValida(variante)) return null;

  const visitante = parseVisitante(
    typeof fila.visitante === "string" ? fila.visitante : null,
  );
  if (!visitante) return null;

  const sesion = typeof fila.sesion === "string" ? fila.sesion : "";
  if (!PATRON_SESION.test(sesion)) return null;

  const creadoEn = typeof fila.creadoEn === "string" ? fila.creadoEn : "";
  if (!PATRON_FECHA.test(creadoEn)) return null;
  const momento = Date.parse(creadoEn);
  if (!Number.isFinite(momento)) return null;
  // Un evento con fecha futura (más de 5 minutos de reloj) no es confiable.
  if (momento > ahora + 5 * 60_000) return null;

  return { id, tipo, visitante, variante, sesion, creadoEn };
}

/**
 * Valida y agrega el log. Además de validar cada fila, descarta duplicados:
 * una impresión por visitante y sesión, una conversión por visitante, y un
 * visitante no puede aparecer en dos variantes distintas.
 */
export function validarEventos(crudos: unknown[], ahora = Date.now()): ResultadoValidacion {
  const conteos: Record<Variante, Conteos> = {
    a: { impresiones: 0, conversiones: 0 },
    b: { impresiones: 0, conversiones: 0 },
  };
  const validos: Evento[] = [];
  const varianteDelVisitante = new Map<string, Variante>();
  const impresionesVistas = new Set<string>();
  const convertidos = new Set<string>();
  let descartados = 0;

  const ordenados = [...crudos].sort((a, b) => {
    const idA = Number((a as { id?: unknown })?.id);
    const idB = Number((b as { id?: unknown })?.id);
    return (Number.isFinite(idA) ? idA : 0) - (Number.isFinite(idB) ? idB : 0);
  });

  for (const crudo of ordenados) {
    const evento = parseEvento(crudo, ahora);
    if (!evento) {
      descartados += 1;
      continue;
    }

    const varianteConocida = varianteDelVisitante.get(evento.visitante);
    if (varianteConocida && varianteConocida !== evento.variante) {
      descartados += 1;
      continue;
    }
    varianteDelVisitante.set(evento.visitante, evento.variante);

    if (evento.tipo === "impresion") {
      const clave = `${evento.visitante}|${evento.sesion}`;
      if (impresionesVistas.has(clave)) {
        descartados += 1;
        continue;
      }
      impresionesVistas.add(clave);
      conteos[evento.variante].impresiones += 1;
    } else {
      if (convertidos.has(evento.visitante)) {
        descartados += 1;
        continue;
      }
      convertidos.add(evento.visitante);
      conteos[evento.variante].conversiones += 1;
    }

    validos.push(evento);
  }

  return { validos, descartados, conteos };
}
