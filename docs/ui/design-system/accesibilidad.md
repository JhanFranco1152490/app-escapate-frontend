# Accesibilidad — panel interno Escápate

Todos los ratios de abajo están medidos sobre los hex reales de la marca con la
fórmula de luminancia relativa de WCAG 2.1. El objetivo es **4.5:1 para texto
normal** y **3:1 desde 24 px**.

## 1. Texto sobre fondo

| Texto | Fondo | Ratio | Uso |
|---|---|---|---|
| `#F5F1E9` crema-50 | `#0C1B2F` navy-950 | **15.4:1** | sidebar, login |
| `#F5F1E9` crema-50 | `#16253F` navy-800 | **13.6:1** | lienzo en modo oscuro |
| `#F5F1E9` crema-50 | `#1E3357` navy-700 | **11.2:1** | tarjetas y tablas en oscuro |
| `#11233E` navy-900 | `#F5F1E9` crema-50 | **14.0:1** | lienzo en modo claro |
| `#11233E` navy-900 | `#FFFFFF` | **15.7:1** | tablas y campos en claro |
| secundario `panel-line/70` → `#556171` | `#F5F1E9` | **5.6:1** | etiquetas, ayudas, celdas secundarias |
| secundario `panel-line/70` → `#AFB1B1` | `#0C1B2F` | **8.0:1** | lo mismo en oscuro |

## 2. El naranja tiene un techo más bajo de lo que parece

| Combinación | Ratio | Veredicto |
|---|---|---|
| `#E8732A` sobre `#0C1B2F` | 5.7:1 | sirve como texto |
| `#E8732A` sobre `#16253F` | 5.1:1 | sirve como texto |
| `#E8732A` sobre `#1E3357` | **4.2:1** | **no** — es la superficie elevada del modo oscuro |
| `#E8732A` sobre `#F5F1E9` | **2.7:1** | **no** — nunca naranja sobre crema |
| `#F0A04B` sobre `#0C1B2F` | 8.1:1 | sirve; es el naranja de las itálicas destacadas |
| `#FFFFFF` sobre relleno `#E8732A` | **3.0:1** | **no** |
| `#0C1B2F` sobre relleno `#E8732A` | **5.7:1** | sí — **así van todos los botones naranjas** |
| `#0C1B2F` sobre relleno `#25D366` | 8.7:1 | sí — botón de WhatsApp |
| `#FFFFFF` sobre relleno `#25D366` | **2.0:1** | **no** |

**Regla corta:** el naranja es relleno, regla de 2 px o ícono. Como texto, solo
sobre navy-950 o navy-800. Sobre crema, jamás.

## 3. Par semántico

Añadido porque la marca no define colores de sistema y `#25D366` está reservado
al canal de WhatsApp. Derivados del naranja en oklch conservando croma y
luminosidad, y separados a propósito del verde de WhatsApp en luminosidad y
saturación.

| Token | Claro | sobre crema-50 | sobre blanco | Oscuro | sobre navy-700 | sobre navy-950 |
|---|---|---|---|---|---|---|
| `--ok` | `#05773B` | 5.0:1 | 5.7:1 | `#5EBC7B` | 5.4:1 | 7.4:1 |
| `--danger` | `#A92227` | 6.3:1 | 7.1:1 | `#EB8D86` | 5.2:1 | 7.2:1 |

El color nunca es la única señal: cada estado lleva además su etiqueta en
JetBrains Mono, y cada error de campo lleva ícono y texto.

## 4. Checklist de la UI

- [x] Iconos SVG (Lucide) dibujados inline. Cero emojis.
- [x] Foco visible en todo elemento interactivo: `outline: 2px solid #E8732A; outline-offset: 2px`.
- [x] Controles reales: `<button>`, `<a href>`, `<input>` con su `<label for>`. Ningún `div` con `role` u `onClick`.
- [x] Botones de solo ícono con `aria-label`.
- [x] Áreas táctiles ≥ 44 px (botones 44–54 px, filas de navegación 44 px).
- [x] Campos con error: `aria-invalid="true"` + `aria-describedby` apuntando al mensaje.
- [x] Tabla semántica: `<caption>` oculta, `<th scope="col">`, `aria-sort` en la columna ordenada.
- [x] Página actual del menú con `aria-current="page"`; paginación con `aria-current="page"`.
- [x] Campo de búsqueda con `<label>` oculto visualmente pero presente.
- [x] Los 3 temas mantienen el contraste: cada token tiene su valor por tema.

## Pendiente de verificar en implementación

- Orden de tabulación una vez haya menús desplegables reales.
- `prefers-reduced-motion` en las transiciones de tema.
- Navegación por teclado del selector de estado y de la tabla con selección múltiple.
