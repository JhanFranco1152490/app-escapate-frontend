# Escápate — UI del panel interno

Maquetas de alta fidelidad y tokens para el panel interno (admin + asesores). Usa la marca
de Escápate: mismos colores, tipografía y sistema de tres temas.

```
design-system/   tokens.css, especificación de componentes y accesibilidad
mockups/         las 4 pantallas iniciales como HTML estático (se abren con doble clic)
mockups/hu/      56 pantallas HTML para las 51 HU (HU-01 a HU-51), con su propia hoja panel.css
png/             (solo local, no se versiona) 51 imágenes PNG exportadas de los HTML
TRAZABILIDAD.md  iteración, HU, RF y pantalla de cada interfaz
guia/            láminas de la guía de estilos (HTML y PNG): paleta, tipografía, componentes, mapa del sitio, flujo y estructura de pantalla
assets/          logo (color y mono blanco) y foto del local (fondo del login)
```

## Prototipo navegable

Abre `mockups/index.html`: reúne siete recorridos y la lista de las 56 pantallas con su HU y RF. El menú lateral, las pestañas de la cotización y los botones principales enlazan con la pantalla siguiente.

## Pantallas

| Archivo | Pantalla |
|---|---|
| `mockups/01-login.html` | Acceso con correo y contraseña (HU-01, RF-01) |
| `mockups/02-shell-cotizaciones.html` | Shell: sidebar, topbar y tabla de cotizaciones (HU-22, RF-15) |
| `mockups/03-nueva-cotizacion.html` | Formulario de cotización: cliente, viaje, ítems, condiciones y precio de venta (HU-22, HU-23, RF-15). Sin IVA, descuentos ni envío: no están en RF-19, RF-20 ni RF-21 |
| `mockups/04-estados.html` | Vacío, sin resultados, error de carga y sin permiso (transversal) |

Sin dependencias ni build; lo único externo son las fuentes de Google Fonts.

Para revisar variantes: el selector **MARCA / CLARO / OSCURO** del topbar (pantallas 02 y 03) o
la barra flotante en las demás (solo sirve para revisar, no es parte del diseño).
`?theme=dark|light` abre directo en ese tema; `?error=1` muestra los errores del login.

## Pantallas por historia de usuario (`mockups/hu/`)

| Archivos | HU |
|---|---|
| `01-login` a `03-login-inactivo` | HU-01 iniciar sesión (campos vacíos, credenciales no válidas, cuenta inactiva) |
| `04-recuperar`, `05-restablecer` | HU-02 recuperar contraseña |
| `06-usuarios`, `07-usuario-form` | HU-03 gestionar usuarios |
| `08-roles-permisos` | HU-04 roles y permisos (matriz) |
| `09-asignar-rol` | HU-05 asignar roles |
| `10-clientes`, `11-cliente-form` | HU-06 gestionar clientes |
| `12-cliente-historial` | HU-07 historial del cliente |
| `13-viajeros` | HU-08 gestionar viajeros |
| `15-solicitud-viajeros` | HU-09 asociar viajeros a la solicitud |
| `14-solicitud-nueva` | HU-10 registrar solicitud |
| `16-solicitudes`, `17-solicitud-detalle` | HU-11 gestionar solicitudes |
| `18-borrador-alternativas` | HU-12 borradores de alternativas |
| `19-pendientes-cotizacion` | HU-13 pendientes de cotización |
| `20-proveedores`, `21-proveedor-form` | HU-14 gestionar proveedores |
| `22-servicio-form` | HU-15 gestionar servicios |
| `23-tarifas` | HU-16 gestionar tarifas |
| `24-oferta-turistica` | HU-17 consultar oferta turística |
| `25-paquetes`, `26-paquete-form`, `27-paquete-precios`, `28-cotizacion-desde-paquete` | HU-18 a HU-21 paquetes y cotización desde paquete |
| `29-cotizacion-general` a `37-cotizacion-duplicar` | HU-22 a HU-32 cotización: general, servicios, alternativas y opcionales, condiciones, costos y precio, documento PDF, versiones y duplicado |
| `38-seguimientos`, `39-seguimiento-form`, `40-alertas` | HU-33 a HU-36 seguimiento comercial y alertas |
| `41-venta-registrar` a `45-reservas` | HU-37 a HU-40 ventas, detalle del viaje, solicitud de reserva y reservas |
| `46-pagos` a `51-ingresos-egresos` | HU-41 a HU-46 pagos, costos reales, rentabilidad, gastos e ingresos y egresos |
| `52-dashboard` a `56-reporte-exportar` | HU-47 a HU-51 dashboard, indicadores, reportes y exportación |

Cada pantalla muestra en la barra superior la etiqueta `HU-xx · RF-xx`. El detalle por
iteración, con el nombre del archivo PNG de cada una, está en [`TRAZABILIDAD.md`](TRAZABILIDAD.md).
Los PNG para el informe se generan con Chromium a 1440 px sobre estos HTML y no se versionan.

Se abren con doble clic y se enlazan entre sí. `panel.css` repite los tokens de
`design-system/tokens.css` y añade las clases de componentes solo para las maquetas: al
implementar se usan los tokens y los valores de `componentes.md`, no estas clases. Los
mismos archivos están en el lienzo de Claude Design (versión editable). Las pantallas se
muestran en el tema de marca y con un wordmark de texto en lugar del logo.

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

- Menús desplegables y confirmaciones (solo hay dos modales: duplicar cotización y exportar reporte).
- El menú lateral de las pantallas 24 a 56 es el del rol de cada una (asesor, proveedores, operativo, administrador); las de HU-01 a HU-16 conservan el suyo.
- Responsive por debajo de 1280 px (las maquetas están a 1440 px).
- Los datos son inventados.
