# Escápate — UI del panel interno

Maquetas de alta fidelidad y tokens para el panel interno (admin + asesores). Usa la marca
de Escápate: mismos colores, tipografía y sistema de tres temas.

```
design-system/   tokens.css, especificación de componentes y accesibilidad
mockups/         las 4 pantallas como HTML estático (se abren con doble clic)
assets/          logo (color y mono blanco) y foto del local (fondo del login)
```

## Pantallas

| Archivo | Pantalla |
|---|---|
| `mockups/01-login.html` | Acceso con correo y contraseña (RF-01) |
| `mockups/02-shell-cotizaciones.html` | Shell: sidebar, topbar y tabla de cotizaciones |
| `mockups/03-nueva-cotizacion.html` | Formulario de alta y edición |
| `mockups/04-estados.html` | Vacío, sin resultados, error de carga y sin permiso |

Sin dependencias ni build; lo único externo son las fuentes de Google Fonts.

Para revisar variantes: el selector **MARCA / CLARO / OSCURO** del topbar (pantallas 02 y 03) o
la barra flotante en las demás (solo sirve para revisar, no es parte del diseño).
`?theme=dark|light` abre directo en ese tema; `?error=1` muestra los errores del login.

## Qué tomar al implementar

1. `design-system/tokens.css`: variables de los 3 temas. Hay que portarlas a `globals.css`
   (Tailwind v4: `@theme inline`), no importarlas tal cual.
2. `design-system/componentes.md`: valores exactos (altos, radios, pesos, tamaños).
3. `design-system/accesibilidad.md`: contrastes medidos y checklist. Los botones naranjas
   y el de WhatsApp llevan texto navy-950, no blanco.
4. El HTML de las maquetas ya trae la semántica (`<label for>`, `aria-invalid`,
   `aria-describedby`, `<th scope>`, `aria-current`) y sirve de referencia para los componentes.

Los iconos son SVG de Lucide inline; al implementar se usa `lucide-react`.

## Lo que todavía no está

- Resumen, clientes, reservas y proveedores (el sidebar ya los contempla).
- Menús desplegables, modales y confirmaciones.
- Responsive por debajo de 1280 px (las maquetas están a 1440 px).
- Los datos son inventados.
