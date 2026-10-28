# Laboratorio 01 · Una landing, dos mensajes, una sola URL indexable

Experimento A/B de **Taller Norte** (escuela de oficios ficticia) para Programación
Avanzada 2026.

La oferta es una sola. Lo que cambia es el mensaje. Cada persona ve siempre el
mismo copy y cada buscador encuentra una sola dirección: `/practica`.

| Ruta        | Qué es                                                     |
| ----------- | ---------------------------------------------------------- |
| `/practica` | La landing con la variante asignada (A control / B trata.)   |
| `/bitacora` | Caso de prueba fijo, log real, asignación y metadatos       |

Capturas en [`docs/`](docs): landing A, preview B y bitácora.

## Cómo correrlo

Requiere **Node 22.5 o superior** (usa `node:sqlite`, incluido en Node, sin
dependencias nativas).

```bash
npm install
npm run dev
```

- <http://localhost:3000/practica>
- <http://localhost:3000/bitacora>

La base se crea sola en `data/experimento.db` (ignorada por git). Se puede mover
con la variable `EXPERIMENTO_DB`.

El canonical es absoluto, así que conviene declarar el origen real:

```bash
NEXT_PUBLIC_SITE_URL=https://mi-dominio.com npm run dev
```

Otros comandos: `npm run build`, `npm run lint`, `npm run typecheck`.

## Cómo está resuelto

### 1. Asignación estable (`proxy.ts`)

El proxy corre sólo en `/practica` (`matcher: "/practica"`). En el primer request
sin cookie:

1. genera un **visitante** (`crypto.randomUUID()`),
2. deriva la **variante** con un hash determinístico del visitante,
3. persiste los dos en cookies `httpOnly`, `path=/`, 30 días.

La variante **nunca** viaja en la URL canónica.

| Cookie        | Contenido                | Vida   | Flags                      |
| ------------- | ------------------------ | ------ | -------------------------- |
| `tn_visitante`| uuid del visitante       | 30 días | `HttpOnly`, `Path=/`, `SameSite=Lax` |
| `tn_variante` | `a` o `b`                | 30 días | `HttpOnly`, `Path=/`, `SameSite=Lax` |
| `tn_sesion`   | `<uuid>.<epoch ms>`      | 30 min  | `HttpOnly`, `Path=/`, `SameSite=Lax` |

En un iframe (la vista previa embebida) las cookies salen `Secure` y
`SameSite=None`, como pide el instructivo; si no, el navegador las descarta y
cada recarga parecería un visitante nuevo.

Si la cookie de variante falta o está corrupta pero el visitante existe, la
variante se **vuelve a derivar del hash**: nunca se sortea.

### 2. El hash

`FNV-1a` de 32 bits sobre los bytes UTF-8 del identificador. La variante es
`hash % 2`.

```
lab-visitor-demo-01 → 0xe13ebb3b → 3778984763 → 1 → variante B
lab-visitor-demo-01 → 0xe13ebb3b → 3778984763 → 1 → variante B   (otra vez)
```

Mismo identificador, misma variante, siempre. No hay `Math.random()` ni fecha.

### 3. Los dos mensajes (`lib/experiment.ts`)

|         | A · Control                                            | B · Tratamiento                                        |
| ------- | ------------------------------------------------------ | ------------------------------------------------------ |
| Title   | Cursos de oficio en ocho semanas, con salida laboral (52) | Abril abre cupos: cursos de oficio en grupos de 12 (50) |
| Description | Aprendé carpintería… que se puede cobrar. (144)     | El 14 de abril empiezan grupos de doce… (141)          |
| Titular | Ocho semanas para un oficio que se puede cobrar.        | El curso empieza el 14 de abril. El cupo, no.          |
| CTA     | Ver cupos de abril                                     | Reservar mi lugar                                      |

La oferta (inicio 14 de abril, 8 semanas, cupo 12, carpintería / electricidad /
cocina) sale de **una sola fuente** (`OFERTA`) y es idéntica en las dos variantes.

### 4. Metadatos (`app/practica/page.tsx`)

- `title` y `description` se resuelven en el servidor con `generateMetadata`, así
  que están en el HTML del primer response.
- El `title` usa `{ absolute }`: es el de la variante, **sin sufijo del layout**.
- `canonical` es siempre `/practica`, sin query.
- `?preview=a|b` agrega `noindex, nofollow`.
- `app/sitemap.ts` publica **una sola** URL (`/practica`), no una por variante;
  `app/robots.ts` la declara.

### 5. Eventos (`proxy.ts` + `app/practica/actions.ts`)

**Impresión**: se anota en el proxy, sólo en navegaciones de documento
(`GET` + `sec-fetch-dest` documento/iframe). Una por sesión de 30 minutos; la
cookie se renueva pero la impresión no se repite. Prefetch, RSC y el `POST` del
CTA no cuentan.

**Conversión**: existe únicamente como `action` del formulario del CTA. Cargar la
página no convierte. La base tiene un índice único por visitante, así que un
segundo clic no suma.

**Persistencia**: SQLite (`data/experimento.db`).

```sql
CREATE TABLE eventos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL CHECK (tipo IN ('impresion','conversion')),
  visitante TEXT NOT NULL,
  variante TEXT NOT NULL CHECK (variante IN ('a','b')),
  sesion TEXT NOT NULL,
  creado_en TEXT NOT NULL
);
-- una impresión por visitante y sesión
CREATE UNIQUE INDEX ... ON eventos (visitante, sesion) WHERE tipo = 'impresion';
-- una conversión por visitante
CREATE UNIQUE INDEX ... ON eventos (visitante) WHERE tipo = 'conversion';
```

Los eventos se **validan al leerlos** (`validarEventos`): tipo y variante
conocidos, identificadores con formato válido, fecha no futura, sin duplicados y
un visitante no puede aparecer en dos variantes. Lo que no pasa, no se cuenta.

### 6. Bitácora (`app/bitacora/page.tsx`)

- **Caso de prueba fijo**: 18/240 = 7,50 %, 31/236 = 13,14 %, diferencia 5,64 pp.
  Los porcentajes se calculan, no se escriben.
- **Log del sitio**: impresiones, conversiones y tasa por variante. Sin
  impresiones la tasa es `—`, no `0 %`.
- **Asignación**: el hash de `lab-visitor-demo-01` repetido tres veces.
- **Metadatos**: title/description publicados y largo de cada uno.
- **No declara ganador**: una diferencia no es una prueba.

### 7. Preview

`?preview=a` y `?preview=b` muestran la pieza sin tocar la asignación: no escriben
cookies, no cuentan impresiones, llevan `noindex` y el CTA no envía. Al volver a
`/practica` aparece la variante asignada, no la del query.

## Verificación

| Qué probar                        | Qué tiene que pasar                                   |
| --------------------------------- | ----------------------------------------------------- |
| Recargar `/practica`              | La variante no cambia                                 |
| Borrar cookies y volver           | Puede tocar la otra variante: es otro visitante       |
| Repetir el mismo id               | Cae siempre en la misma variante (FNV-1a)             |
| Abrir `?preview=b`                | Se ve B; no se pisa la cookie ni se cuenta la visita  |
| Salir del preview                 | Vuelve la variante asignada                           |
| Ver el HTML (no la pantalla)      | Title y description de la variante; canonical `/practica` |
| Ver el HTML del preview           | `noindex, nofollow`                                   |
| Recargar dentro de 30 minutos     | No suma otra impresión                                |
| Cargar la página                  | No suma una conversión                                |
| Hacer clic en el CTA              | Suma una; el segundo clic no suma otra                |
| Abrir la bitácora sin sesión      | El caso fijo sigue en 7,50 %, 13,14 % y 5,64 pp       |
| Buscar `localStorage`             | No se usa ni para asignar ni para contar              |
| Pedir `/practica` con UA de bot   | Control (A), sin cookie y sin impresión               |

Comprobaciones hechas en el desarrollo: las tres anteriores con `curl` (cookies,
cabeceras y HTML), el clic del CTA en un navegador real, los índices únicos de la
base y un Lighthouse con SEO, accesibilidad y buenas prácticas en 100.

## Decisiones de SEO

- **Una sola URL indexable.** Publicar `/variante-a` y `/variante-b`, o canonizar
  `?variant=b`, parte el experimento en dos páginas y diluye la indexación.
- **El canonical no cambia** porque las dos variantes son la misma página: cambia
  el mensaje, no el producto ni la oferta.
- **El `title` no se escribe con JavaScript**: viaja en el HTML del primer
  response, que es lo que lee un crawler.
- **Crawler → control.** Un crawler suele no conservar cookies; si cada visita sin
  cookie sorteara un mensaje, el buscador indexaría un texto inestable. Se le
  sirve siempre la variante A, en la misma URL y con el mismo canonical. No es
  cloaking: no se esconde contenido ni se busca manipular el ranking, y el
  control es uno de los dos mensajes que ve una persona real, con la misma
  oferta. Está explicado en el [informe](INFORME.md).
- **El preview no compite**: `noindex` y sin cookies.

## Estructura

```
proxy.ts                    asignación, cookies e impresión
lib/experiment.ts           copy, oferta, caso, hash, tasas, validación (puro)
lib/db.ts                   SQLite: esquema e inserción/lectura de eventos
lib/assignment.ts           lectura de la asignación en el servidor
lib/site.ts                 origen público para canonical, robots y sitemap
app/practica/page.tsx       landing + metadatos por variante
app/practica/actions.ts     conversión (sólo desde el CTA)
app/bitacora/page.tsx       caso fijo + log real
app/robots.ts               robots.txt
app/sitemap.ts              sitemap con una sola URL indexable
components/mensaje.tsx      titular, bajada y CTA
components/oferta.tsx       la oferta, igual en A y en B
components/boton-cta.tsx    formulario del CTA
```

## Entregables

- [x] Proyecto funcionando con la separación de archivos pedida.
- [x] `/practica` y `/bitacora`.
- [x] Informe de una carilla: [`INFORME.md`](INFORME.md).
- [x] Captura del caso de prueba: [`docs/bitacora.png`](docs/bitacora.png)
      (el cálculo a mano al margen queda para la entrega en papel).
- [x] Log de eventos en una base (SQLite), no en el navegador.

## Límites conocidos

- SQLite necesita un disco persistente: en un deploy serverless el log se pierde.
  Para entregar alcanza con correrlo local o en un servidor Node.
- El caso de prueba fijo no se mezcla con el log real: son dos tablas distintas y
  el instructivo lo pide así.
- No se declara ganador. La diferencia de 5,64 pp es una diferencia, no una
  prueba de significancia.
