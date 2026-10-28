# Informe · Laboratorio 01

**Taller Norte · Una landing, dos mensajes, una sola URL indexable**
Programación Avanzada · 2026

## 1. Qué ve una persona asignada a B

Ve el mismo producto con otro mensaje:

- **Titular:** «El curso empieza el 14 de abril. El cupo, no.»
- **Llamado a la acción:** «Reservar mi lugar».
- **Title:** «Abril abre cupos: cursos de oficio en grupos de 12» (50 caracteres).
- **Description:** «El 14 de abril empiezan grupos de doce. En la cohorte anterior,
  ocho de cada diez consiguieron trabajo en el rubro antes de los noventa días.»
  (141 caracteres).

Lo que **no** cambió es la oferta: inicio el 14 de abril, duración de 8 semanas,
cupo de 12 personas y los mismos oficios (carpintería, electricidad y cocina). Los
cuatro datos salen de una sola fuente compartida, así que no pueden diferir entre
variantes. A habla del método («ocho semanas para un oficio que se puede cobrar»);
B apura la decisión con fecha y cupo. Las dos venden lo mismo.

## 2. Qué debería ver un crawler

La variante de control (A), siempre, en `/practica`.

Un crawler no conserva cookies entre visitas. Si cada request sin cookie sorteara
un mensaje, el buscador podría indexar un texto distinto en cada pasada y quedarse
con el último que vio; el título que aparece en los resultados cambiaría según el
día. Por eso la asignación por hash no alcanza para el bot: el proxy reconoce el
user-agent de crawler y le sirve A, sin escribirle cookies y sin contarle una
impresión (un bot no es una persona).

Los metadatos se resuelven en el servidor, así que el `title` y la `description`
de la variante están en el HTML del primer response, no escritos después con
JavaScript. Lo que se indexa es exactamente el texto de la variante publicada.

Servirle el control a un crawler no es cloaking: se hace en la misma URL, con el
mismo canonical y con la misma oferta, y A es uno de los dos mensajes que ve
cualquier persona real. No se le oculta contenido al buscador ni se le muestra
algo distinto para manipular el ranking; se fija una variante estable para que la
indexación no dependa de una cookie que el crawler no tiene. El cloaking sería
mostrarle al bot un texto que ninguna persona puede ver.

## 3. Por qué el canonical no cambia

Porque las dos variantes son la misma página. Cambia el mensaje, no el producto:
la oferta, el cupo y la fecha son idénticos. El canonical apunta siempre a
`/practica`, sin query, y las dos variantes se sirven desde esa única dirección.

Si la variante viviera en la URL —publicando `/variante-a` y `/variante-b`, o
canonizando `?variant=b`— habría dos páginas indexables con el mismo contenido y
el mismo negocio. El buscador repartiría señales entre las dos, competirían entre
sí y la indexación se diluiría. Tampoco cambia nada el preview: `?preview=a|b` es
un instrumento de revisión, lleva `noindex` y no escribe cookies, así que esas
URLs no compiten por la indexación.

**Hash usado:** FNV-1a de 32 bits sobre los bytes UTF-8 del identificador; la
variante es el hash módulo 2. Es determinístico: no usa `Math.random()` ni la
fecha. Prueba estable: `lab-visitor-demo-01` → `0xe13ebb3b` → `3778984763` → módulo
2 = 1 → **variante B**. Repetido tres veces da lo mismo.
