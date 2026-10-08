# Design system — panel interno

Capa de aplicación del sistema de marca de Escápate (tres temas, dos slots de sección)
a patrones de dashboard: navegación, tablas, formularios y estados.

## Archivos

| Archivo | Qué es |
|---|---|
| `tokens.css` | Variables CSS de los 3 temas. Es lo único que hay que importar. |
| `accesibilidad.md` | Ratios de contraste medidos y checklist. |
| `componentes.md` | Especificación de cada componente con sus valores. |

## La idea en una frase

El sistema define dos *slots* de sección (A y B) y tres temas que solo
cambian qué color toma cada slot. El panel reusa eso sin tocarlo:

- **el chrome** (sidebar) toma el slot **B**
- **el área de trabajo** (topbar, tablas, formularios) toma el slot **A**

Los tres temas:

| Tema | Sidebar | Área de trabajo |
|---|---|---|
| `default` (marca) | navy-950 | crema-50 |
| `theme-light` | crema-100 | crema-50 |
| `theme-dark` | navy-950 | navy-800 |

El login se queda oscuro en los tres.

## Cómo se activa un tema

Una clase en `<html>`.

```html
<html>                      <!-- default: tema de marca -->
<html class="theme-light">  <!-- todo claro -->
<html class="theme-dark">   <!-- todo oscuro -->
```

## Los alfas no son arbitrarios

Hay un solo token de "tinta" por superficie (`--panel-line`, `--panel-chrome-line`)
y cuatro opacidades fijas sobre él. Están calculadas para cumplir 4.5:1; usar
otras rompe el contraste en alguno de los tres temas.

```css
color:  rgb(var(--panel-line) / 0.70);  /* texto secundario */
border: 1px solid rgb(var(--panel-line) / 0.16);
border-top: 1px solid rgb(var(--panel-line) / 0.10);  /* regla de tabla */
background: rgb(var(--panel-line) / 0.08);            /* relleno de chip */
```

## Lo único que se añadió a la paleta

Un par semántico, porque la marca no define verde ni rojo de sistema y el verde
`#25D366` está reservado al canal de WhatsApp:

```
--ok      #05773B (claro) / #5EBC7B (oscuro)
--danger  #A92227 (claro) / #EB8D86 (oscuro)
```

Derivados del naranja en oklch conservando croma y luminosidad, y separados a
propósito del verde de WhatsApp. Todos los pares cumplen 4.5:1 sobre las
superficies donde se usan. Ver `accesibilidad.md`.

## Contraste

Los botones naranjas y el de WhatsApp llevan texto navy-950, no blanco (3.0:1 y 2.0:1 no pasan AA).
