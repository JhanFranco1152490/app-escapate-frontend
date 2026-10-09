# Componentes — panel interno Escápate

Valores tomados de las maquetas de `mockups/`. Donde dice *token* va la
variable de `tokens.css`, no un hex suelto.

## Botones

| Variante | Relleno | Texto | Borde | Alto | Uso |
|---|---|---|---|---|---|
| Primario | `#E8732A` | `#0C1B2F` | — | 44–54 px | una sola acción principal por pantalla |
| Secundario | transparente | `panel-ink` | `panel-line/16` | 44 px | acciones de apoyo |
| WhatsApp | `#25D366` | `#0C1B2F` | — | 48 px | **solo** el envío por WhatsApp |
| Fantasma punteado | transparente | `panel-ink` | `panel-line/16` punteado | 44 px | "agregar ítem" |
| Ícono solo | transparente | `panel-line/70` | — | 30–44 px | requiere `aria-label` |

Radio 4 px. Peso 600 en el primario, 400–500 en el resto. Transición 150–300 ms.

## Campos

- Alto 46 px (50 px en el login), radio 4 px, padding lateral 14 px (42 px si lleva ícono).
- Fondo `panel-field`, borde `panel-line/16`, texto `panel-ink` a 14 px.
- Etiqueta: JetBrains Mono 10 px, mayúsculas, tracking `0.16em`, color `panel-line/70`.
- Obligatorio: asterisco en `--danger` después de la etiqueta.
- Ayuda: Inter 12 px, `panel-line/70`, debajo del campo.
- Error: borde `--danger`, mensaje con ícono a 12.5 px, `aria-invalid` + `aria-describedby`.
- Solo lectura: mismo campo con `opacity: 0.62` y `readonly`.
- Foco: `outline: 2px solid #E8732A; outline-offset: 2px`.

## Tabla

- Contenedor `panel-surface`, borde `panel-line/16`, radio 6 px, `overflow: hidden`.
- Encabezado: fondo `panel-head`, alto 42 px, etiquetas Mono 9.5 px mayúsculas `panel-line/70`.
- Fila: alto 54 px, separador superior `panel-line/10`.
- Celda primaria Inter 13.5 px peso 500; secundaria Mono 10 px `panel-line/70`.
- Importes: Mono 12.5 px alineados a la derecha.
- `table-layout: fixed` con `<colgroup>`; sin texto truncado salvo nombres largos (`text-overflow: ellipsis`).

## Estados de registro

Punto de 7 px + etiqueta Mono 10 px mayúsculas. El color acompaña, nunca sustituye a la etiqueta.

| Estado | Punto | Etiqueta |
|---|---|---|
| Borrador | hueco, borde `panel-line/70` | `panel-line/70` |
| Enviada | `#E8732A` | `panel-ink` |
| Aprobada | `--ok` | `--ok` |
| Vencida | `--danger` | `--danger` |

## Navegación lateral

- Ancho 252 px, fondo `panel-chrome`, borde derecho `panel-chrome-line/16`.
- Cada ítem: alto 44 px, índice Mono de dos dígitos (01–07) en el canalón, ícono 18 px, etiqueta 14 px.
- Inactivo `panel-chrome-line/72`; activo con fondo `panel-chrome-active`, texto a plena intensidad, índice en `#E8732A` y barra de 3 px a la izquierda (`box-shadow: inset 3px 0 0`).
- Grupos con encabezado Mono 9.5 px. El grupo de administración lleva la marca "SOLO ADMIN".

## Cabecera de página

Eyebrow Mono (`OPERACIÓN / 03`) + título Playfair 38–40 px con tracking `-0.03em` + línea de contexto a 13.5 px.
Nunca tarjetas de KPI: las cifras van en un riel con reglas de 1 px entre ellas, cifra en Playfair 29 px y etiqueta en Mono.

## Filtros

Pestañas en Mono mayúsculas con su conteo al lado. La activa lleva subrayado de 2 px en `#E8732A` y texto a plena intensidad; las demás, `panel-line/70` sin subrayado. Sin píldoras ni cápsulas.

## Estados vacíos y de error

Dentro del mismo contenedor donde iría la tabla. Ilustración de línea en dos colores (traza punteada naranja + contorno en `panel-ink` al 50–65 %), titular Playfair 23 px, cuerpo 13.5 px `panel-line/70` con ancho máximo 400 px, y como mucho dos acciones. El estado de error muestra código y hora en una cápsula Mono para que soporte pueda rastrearlo.
