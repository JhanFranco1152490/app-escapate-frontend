# Trazabilidad de interfaces: iteración, historia de usuario y requerimiento

Fuente: Documento Ingenieril (tabla 1.3, iteraciones 1 a 10) y Charter del 25 oct 2026. Cada pantalla
lleva en la barra superior una etiqueta `HU-xx · RF-xx`. Los PNG están en `docs/ui/png/` (1440 px de ancho),
el HTML editable en `docs/ui/mockups/`. Datos inventados.

**Cobertura:** 51 de 51 historias de usuario y 36 de 36 requerimientos funcionales tienen al menos una interfaz; 51 imágenes en total (una por pantalla distinta; cuando una imagen muestra varias HU, lleva todas en el nombre).

## Iteración 1 · Acceso y administración de usuarios

| HU | RF | Pantalla | PNG | HTML |
| -- | -- | -------- | --- | ---- |
| HU-01 | RF-01 | Inicio de sesión (alta fidelidad) | `HU-01_RF-01_ini-01-login.png` | [`01-login.html`](mockups/01-login.html) |
| HU-02 | RF-01 | Recuperar contraseña | `HU-02_RF-01_04-recuperar.png` | [`hu/04-recuperar.html`](mockups/hu/04-recuperar.html) |
| HU-02 | RF-01 | Restablecer contraseña | `HU-02_RF-01_05-restablecer.png` | [`hu/05-restablecer.html`](mockups/hu/05-restablecer.html) |
| HU-03 | RF-02 | Lista de usuarios | `HU-03_RF-02_06-usuarios.png` | [`hu/06-usuarios.html`](mockups/hu/06-usuarios.html) |
| HU-03 | RF-02 | Registrar y editar usuario | `HU-03_RF-02_07-usuario-form.png` | [`hu/07-usuario-form.html`](mockups/hu/07-usuario-form.html) |
| HU-04 | RF-03 | Roles y permisos (matriz) | `HU-04_RF-03_08-roles-permisos.png` | [`hu/08-roles-permisos.html`](mockups/hu/08-roles-permisos.html) |
| HU-05 | RF-03 | Asignar rol a un usuario | `HU-05_RF-03_09-asignar-rol.png` | [`hu/09-asignar-rol.html`](mockups/hu/09-asignar-rol.html) |

## Iteración 2 · Clientes y viajeros

| HU | RF | Pantalla | PNG | HTML |
| -- | -- | -------- | --- | ---- |
| HU-06 | RF-04 | Lista de clientes | `HU-06_RF-04_10-clientes.png` | [`hu/10-clientes.html`](mockups/hu/10-clientes.html) |
| HU-06 | RF-04 | Registrar y editar cliente | `HU-06_RF-04_11-cliente-form.png` | [`hu/11-cliente-form.html`](mockups/hu/11-cliente-form.html) |
| HU-07 | RF-05 | Historial del cliente | `HU-07_RF-05_12-cliente-historial.png` | [`hu/12-cliente-historial.html`](mockups/hu/12-cliente-historial.html) |
| HU-08 | RF-06 | Gestionar viajeros | `HU-08_RF-06_13-viajeros.png` | [`hu/13-viajeros.html`](mockups/hu/13-viajeros.html) |
| HU-09 | RF-06 | Asociar viajeros a la solicitud | `HU-09_RF-06_15-solicitud-viajeros.png` | [`hu/15-solicitud-viajeros.html`](mockups/hu/15-solicitud-viajeros.html) |

## Iteración 3 · Solicitudes de viaje

| HU | RF | Pantalla | PNG | HTML |
| -- | -- | -------- | --- | ---- |
| HU-10 | RF-07 | Registrar solicitud de viaje | `HU-10_RF-07_14-solicitud-nueva.png` | [`hu/14-solicitud-nueva.html`](mockups/hu/14-solicitud-nueva.html) |
| HU-11 | RF-07 | Lista de solicitudes | `HU-11_RF-07_16-solicitudes.png` | [`hu/16-solicitudes.html`](mockups/hu/16-solicitudes.html) |
| HU-11 | RF-07 | Detalle y edición de una solicitud | `HU-11_RF-07_17-solicitud-detalle.png` | [`hu/17-solicitud-detalle.html`](mockups/hu/17-solicitud-detalle.html) |
| HU-12 | RF-08 | Borrador de alternativas | `HU-12_RF-08_18-borrador-alternativas.png` | [`hu/18-borrador-alternativas.html`](mockups/hu/18-borrador-alternativas.html) |
| HU-13 | RF-07 | Solicitudes pendientes de cotización | `HU-13_RF-07_19-pendientes-cotizacion.png` | [`hu/19-pendientes-cotizacion.html`](mockups/hu/19-pendientes-cotizacion.html) |

## Iteración 4 · Proveedores, servicios y tarifas

| HU | RF | Pantalla | PNG | HTML |
| -- | -- | -------- | --- | ---- |
| HU-14 | RF-09 | Lista de proveedores | `HU-14_RF-09_20-proveedores.png` | [`hu/20-proveedores.html`](mockups/hu/20-proveedores.html) |
| HU-14 | RF-09 | Registrar y editar proveedor | `HU-14_RF-09_21-proveedor-form.png` | [`hu/21-proveedor-form.html`](mockups/hu/21-proveedor-form.html) |
| HU-15 | RF-10 | Registrar servicio turístico | `HU-15_RF-10_22-servicio-form.png` | [`hu/22-servicio-form.html`](mockups/hu/22-servicio-form.html) |
| HU-16 | RF-11 | Tarifas de un servicio | `HU-16_RF-11_23-tarifas.png` | [`hu/23-tarifas.html`](mockups/hu/23-tarifas.html) |
| HU-17 | RF-09, RF-10, RF-11 | Consultar oferta turística | `HU-17_RF-09+RF-10+RF-11_24-oferta-turistica.png` | [`hu/24-oferta-turistica.html`](mockups/hu/24-oferta-turistica.html) |

## Iteración 5 · Paquetes turísticos

| HU | RF | Pantalla | PNG | HTML |
| -- | -- | -------- | --- | ---- |
| HU-19 | RF-12 | Catálogo de paquetes | `HU-19_RF-12_25-paquetes.png` | [`hu/25-paquetes.html`](mockups/hu/25-paquetes.html) |
| HU-18, HU-19 | RF-12 | Crear y configurar paquete | `HU-18+HU-19_RF-12_26-paquete-form.png` | [`hu/26-paquete-form.html`](mockups/hu/26-paquete-form.html) |
| HU-20 | RF-13 | Precios del paquete | `HU-20_RF-13_27-paquete-precios.png` | [`hu/27-paquete-precios.html`](mockups/hu/27-paquete-precios.html) |
| HU-21 | RF-14 | Generar cotización desde un paquete | `HU-21_RF-14_28-cotizacion-desde-paquete.png` | [`hu/28-cotizacion-desde-paquete.html`](mockups/hu/28-cotizacion-desde-paquete.html) |

## Iteración 6 · Cotizaciones

| HU | RF | Pantalla | PNG | HTML |
| -- | -- | -------- | --- | ---- |
| HU-22, HU-23 | RF-15 | Nueva cotización: cliente, viaje, ítems y condiciones | `HU-22+HU-23_RF-15_ini-03-nueva-cotizacion.png` | [`03-nueva-cotizacion.html`](mockups/03-nueva-cotizacion.html) |
| HU-24 | RF-16 | Cotización: configurar servicios | `HU-24_RF-16_30-cotizacion-servicios.png` | [`hu/30-cotizacion-servicios.html`](mockups/hu/30-cotizacion-servicios.html) |
| HU-25, HU-26 | RF-17 | Cotización: alternativas y opcionales | `HU-25+HU-26_RF-17_31-cotizacion-alternativas.png` | [`hu/31-cotizacion-alternativas.html`](mockups/hu/31-cotizacion-alternativas.html) |
| HU-27 | RF-18 | Cotización: condiciones comerciales | `HU-27_RF-18_32-cotizacion-condiciones.png` | [`hu/32-cotizacion-condiciones.html`](mockups/hu/32-cotizacion-condiciones.html) |
| HU-28, HU-29 | RF-19, RF-20 | Cotización: costos, margen y precio de venta | `HU-28+HU-29_RF-19+RF-20_33-cotizacion-costos-precio.png` | [`hu/33-cotizacion-costos-precio.html`](mockups/hu/33-cotizacion-costos-precio.html) |
| HU-30 | RF-21 | Documento PDF de la cotización | `HU-30_RF-21_34-cotizacion-documento.png` | [`hu/34-cotizacion-documento.html`](mockups/hu/34-cotizacion-documento.html) |
| HU-31 | RF-22 | Versiones de la cotización | `HU-31_RF-22_36-cotizacion-versiones.png` | [`hu/36-cotizacion-versiones.html`](mockups/hu/36-cotizacion-versiones.html) |
| HU-22, HU-32 | RF-15 | Lista de cotizaciones y duplicado de una cotización | `HU-22+HU-32_RF-15_37-cotizacion-duplicar.png` | [`hu/37-cotizacion-duplicar.html`](mockups/hu/37-cotizacion-duplicar.html) |

## Iteración 7 · Seguimiento comercial

| HU | RF | Pantalla | PNG | HTML |
| -- | -- | -------- | --- | ---- |
| HU-35, HU-33 | RF-23 | Lista de seguimientos comerciales | `HU-35+HU-33_RF-23_38-seguimientos.png` | [`hu/38-seguimientos.html`](mockups/hu/38-seguimientos.html) |
| HU-33, HU-34 | RF-23 | Programar y registrar resultado de seguimiento | `HU-33+HU-34_RF-23_39-seguimiento-form.png` | [`hu/39-seguimiento-form.html`](mockups/hu/39-seguimiento-form.html) |
| HU-36 | RF-24 | Alertas de seguimiento | `HU-36_RF-24_40-alertas.png` | [`hu/40-alertas.html`](mockups/hu/40-alertas.html) |

## Iteración 8 · Ventas, viajes y reservas

| HU | RF | Pantalla | PNG | HTML |
| -- | -- | -------- | --- | ---- |
| HU-37 | RF-25 | Registrar venta desde una cotización aceptada | `HU-37_RF-25_41-venta-registrar.png` | [`hu/41-venta-registrar.html`](mockups/hu/41-venta-registrar.html) |
| HU-38 | RF-25 | Detalle de venta y viaje | `HU-38_RF-25_43-venta-detalle.png` | [`hu/43-venta-detalle.html`](mockups/hu/43-venta-detalle.html) |
| HU-39 | RF-27 | Preparar solicitud de reserva | `HU-39_RF-27_44-solicitud-reserva.png` | [`hu/44-solicitud-reserva.html`](mockups/hu/44-solicitud-reserva.html) |
| HU-40 | RF-26 | Gestionar reservas | `HU-40_RF-26_45-reservas.png` | [`hu/45-reservas.html`](mockups/hu/45-reservas.html) |

## Iteración 9 · Pagos, costos y rentabilidad

| HU | RF | Pantalla | PNG | HTML |
| -- | -- | -------- | --- | ---- |
| HU-42 | RF-28 | Estado e historial de pagos | `HU-42_RF-28_46-pagos.png` | [`hu/46-pagos.html`](mockups/hu/46-pagos.html) |
| HU-41 | RF-28 | Registrar pago de cliente | `HU-41_RF-28_47-pago-registrar.png` | [`hu/47-pago-registrar.html`](mockups/hu/47-pago-registrar.html) |
| HU-43 | RF-29 | Costos reales de los servicios | `HU-43_RF-29_48-costos-reales.png` | [`hu/48-costos-reales.html`](mockups/hu/48-costos-reales.html) |
| HU-44 | RF-30 | Rentabilidad por venta | `HU-44_RF-30_49-rentabilidad.png` | [`hu/49-rentabilidad.html`](mockups/hu/49-rentabilidad.html) |
| HU-45 | RF-31 | Gastos operativos | `HU-45_RF-31_50-gastos.png` | [`hu/50-gastos.html`](mockups/hu/50-gastos.html) |
| HU-46 | RF-32 | Consulta de ingresos y egresos | `HU-46_RF-32_51-ingresos-egresos.png` | [`hu/51-ingresos-egresos.html`](mockups/hu/51-ingresos-egresos.html) |

## Iteración 10 · Dashboard, indicadores y reportes

| HU | RF | Pantalla | PNG | HTML |
| -- | -- | -------- | --- | ---- |
| HU-47 | RF-33 | Dashboard general | `HU-47_RF-33_52-dashboard.png` | [`hu/52-dashboard.html`](mockups/hu/52-dashboard.html) |
| HU-48 | RF-34 | Indicadores comerciales y turísticos | `HU-48_RF-34_53-indicadores-comerciales.png` | [`hu/53-indicadores-comerciales.html`](mockups/hu/53-indicadores-comerciales.html) |
| HU-49 | RF-34 | Indicadores financieros | `HU-49_RF-34_54-indicadores-financieros.png` | [`hu/54-indicadores-financieros.html`](mockups/hu/54-indicadores-financieros.html) |
| HU-50, HU-51 | RF-35, RF-36 | Reporte generado y exportación | `HU-50+HU-51_RF-35+RF-36_56-reporte-exportar.png` | [`hu/56-reporte-exportar.html`](mockups/hu/56-reporte-exportar.html) |

## Variantes que solo existen en HTML (sin PNG)

Misma pantalla que otra ya exportada, en otro estado o con otro nivel de detalle.

| Archivo | HU | RF | Pantalla |
| ------- | -- | -- | -------- |
| [`02-shell-cotizaciones.html`](mockups/02-shell-cotizaciones.html) | HU-22 | RF-15 | Lista de cotizaciones |
| [`04-estados.html`](mockups/04-estados.html) | HU-13 | RF-07 | Estados vacío, sin resultados, error y sin permiso |
| [`hu/01-login.html`](mockups/hu/01-login.html) | HU-01 | RF-01 | Iniciar sesión: campos vacíos |
| [`hu/02-login-credenciales.html`](mockups/hu/02-login-credenciales.html) | HU-01 | RF-01 | Iniciar sesión: credenciales no válidas |
| [`hu/03-login-inactivo.html`](mockups/hu/03-login-inactivo.html) | HU-01 | RF-01 | Iniciar sesión: cuenta inactiva |
| [`hu/29-cotizacion-general.html`](mockups/hu/29-cotizacion-general.html) | HU-22, HU-23 | RF-15 | Cotización: información general |
| [`hu/35-cotizacion-documento-incompleto.html`](mockups/hu/35-cotizacion-documento-incompleto.html) | HU-30 | RF-21 | Documento PDF: información faltante |
| [`hu/57-cotizaciones.html`](mockups/hu/57-cotizaciones.html) | HU-22 | RF-15 | Lista de cotizaciones |
| [`hu/42-ventas.html`](mockups/hu/42-ventas.html) | HU-38 | RF-25 | Lista de ventas y viajes |
| [`hu/55-reportes.html`](mockups/hu/55-reportes.html) | HU-50 | RF-35 | Generar reportes |

## Historias de usuario y su requerimiento

| HU | Nombre | RF (documento) | Pantallas |
| -- | ------ | -------------- | --------- |
| HU-01 | Iniciar sesión | RF-01 | 1 |
| HU-02 | Recuperar contraseña | RF-01 | 2 |
| HU-03 | Gestionar usuarios | RF-02 | 2 |
| HU-04 | Gestionar roles y permisos | RF-03 | 1 |
| HU-05 | Asignar roles a usuarios | RF-03 | 1 |
| HU-06 | Gestionar clientes | RF-04 | 2 |
| HU-07 | Consultar historial del cliente | RF-05 | 1 |
| HU-08 | Gestionar viajeros | RF-06 | 1 |
| HU-09 | Asociar viajeros al proceso de viaje | RF-06 | 1 |
| HU-10 | Registrar solicitud de viaje | RF-07 | 1 |
| HU-11 | Gestionar solicitudes registradas | RF-07 | 2 |
| HU-12 | Gestionar borradores de alternativas | RF-08 | 1 |
| HU-13 | Consultar solicitudes pendientes de cotización | RF-07 | 1 |
| HU-14 | Gestionar proveedores turísticos | RF-09 | 2 |
| HU-15 | Gestionar servicios turísticos | RF-10 | 1 |
| HU-16 | Gestionar tarifas de servicios turísticos | RF-11 | 1 |
| HU-17 | Consultar oferta turística disponible | RF-09, RF-10, RF-11 | 1 |
| HU-18 | Crear y configurar paquete turístico | RF-12 | 1 |
| HU-19 | Gestionar información general del paquete | RF-12 | 2 |
| HU-20 | Gestionar precios del paquete | RF-13 | 1 |
| HU-21 | Generar cotización desde un paquete | RF-14 | 1 |
| HU-22 | Crear cotización | RF-15 | 2 |
| HU-23 | Gestionar información general de la cotización | RF-15 | 1 |
| HU-24 | Configurar servicios turísticos de la cotización | RF-16 | 1 |
| HU-25 | Gestionar alternativas de servicios | RF-17 | 1 |
| HU-26 | Gestionar servicios opcionales | RF-17 | 1 |
| HU-27 | Establecer condiciones comerciales de la cotización | RF-18 | 1 |
| HU-28 | Gestionar costos estimados de la cotización | RF-19 | 1 |
| HU-29 | Configurar margen y precio de venta | RF-19, RF-20 | 1 |
| HU-30 | Generar documento de cotización | RF-21 | 1 |
| HU-31 | Gestionar versiones de cotización | RF-22 | 1 |
| HU-32 | Duplicar cotización | RF-15 | 1 |
| HU-33 | Programar seguimiento comercial | RF-23 | 2 |
| HU-34 | Gestionar seguimiento comercial | RF-23 | 1 |
| HU-35 | Consultar seguimientos comerciales | RF-23 | 1 |
| HU-36 | Recibir alertas de seguimiento | RF-24 | 1 |
| HU-37 | Registrar venta desde una cotización aceptada | RF-25 | 1 |
| HU-38 | Consultar detalle de venta y viaje | RF-25 | 1 |
| HU-39 | Preparar solicitudes de reserva | RF-27 | 1 |
| HU-40 | Gestionar reservas de servicios contratados | RF-26 | 1 |
| HU-41 | Registrar pagos de clientes | RF-28 | 1 |
| HU-42 | Consultar estado e historial de pagos | RF-28 | 1 |
| HU-43 | Registrar costos reales de los servicios | RF-29 | 1 |
| HU-44 | Consultar rentabilidad de una venta | RF-30 | 1 |
| HU-45 | Gestionar gastos operativos | RF-31 | 1 |
| HU-46 | Consultar ingresos y egresos | RF-32 | 1 |
| HU-47 | Consultar dashboard general | RF-33 | 1 |
| HU-48 | Consultar indicadores comerciales y turísticos | RF-34 | 1 |
| HU-49 | Consultar indicadores financieros | RF-34 | 1 |
| HU-50 | Generar reportes | RF-35 | 1 |
| HU-51 | Exportar reportes | RF-36 | 1 |

## Requerimientos funcionales y sus interfaces

| RF | Nombre | HU | Pantallas |
| -- | ------ | -- | --------- |
| RF-01 | Autenticación de usuarios | HU-01, HU-02 | 3 |
| RF-02 | Gestión de usuarios | HU-03 | 2 |
| RF-03 | Roles y permisos | HU-04, HU-05 | 2 |
| RF-04 | Gestión de clientes | HU-06 | 2 |
| RF-05 | Historial del cliente | HU-07 | 1 |
| RF-06 | Gestión de viajeros | HU-08, HU-09 | 2 |
| RF-07 | Gestión de solicitudes de viaje | HU-10, HU-11, HU-13 | 4 |
| RF-08 | Gestión de borradores de alternativas | HU-12 | 1 |
| RF-09 | Gestión de proveedores | HU-14, HU-17 | 3 |
| RF-10 | Gestión de servicios turísticos | HU-15, HU-17 | 2 |
| RF-11 | Gestión de tarifas de servicios turísticos | HU-16, HU-17 | 2 |
| RF-12 | Gestión de paquetes turísticos | HU-18, HU-19 | 2 |
| RF-13 | Gestión de precios de paquetes turísticos | HU-20 | 1 |
| RF-14 | Generación de cotizaciones desde paquetes | HU-21 | 1 |
| RF-15 | Gestión de cotizaciones | HU-22, HU-23, HU-32 | 2 |
| RF-16 | Configuración de servicios de la cotización | HU-24 | 1 |
| RF-17 | Gestión de alternativas y servicios opcionales | HU-25, HU-26 | 1 |
| RF-18 | Gestión de condiciones de la cotización | HU-27 | 1 |
| RF-19 | Gestión de costos, márgenes y comisiones de la cotización | HU-28, HU-29 | 1 |
| RF-20 | Cálculo del precio de la cotización | HU-29 | 1 |
| RF-21 | Generación del documento de cotización | HU-30 | 1 |
| RF-22 | Versionado de cotizaciones | HU-31 | 1 |
| RF-23 | Gestión de seguimientos comerciales | HU-33, HU-34, HU-35 | 2 |
| RF-24 | Alertas de seguimiento | HU-36 | 1 |
| RF-25 | Gestión de ventas y viajes | HU-37, HU-38 | 2 |
| RF-26 | Gestión de reservas | HU-40 | 1 |
| RF-27 | Preparación de solicitudes de reserva | HU-39 | 1 |
| RF-28 | Gestión de pagos de clientes | HU-41, HU-42 | 2 |
| RF-29 | Gestión de costos reales de los servicios | HU-43 | 1 |
| RF-30 | Cálculo de rentabilidad por venta | HU-44 | 1 |
| RF-31 | Gestión de gastos operativos | HU-45 | 1 |
| RF-32 | Consulta consolidada de ingresos y egresos | HU-46 | 1 |
| RF-33 | Dashboard general | HU-47 | 1 |
| RF-34 | Consulta de indicadores | HU-48, HU-49 | 2 |
| RF-35 | Generación de reportes | HU-50 | 1 |
| RF-36 | Exportación de reportes | HU-51 | 1 |

## Alcance de las pantallas de cotización (RF-19, RF-20, RF-21)

- Precio de venta = costos estimados + margen o comisión (RF-19, RF-20). No hay IVA ni descuentos por cliente frecuente: no están en el alcance.
- El documento de cotización solo se **genera en PDF** (RF-21). No hay envío por correo ni WhatsApp desde el sistema.
- RF-27 solo **prepara el texto** de la solicitud de reserva para usarlo en un canal externo; la maqueta ofrece "Copiar contenido".
- RF-36 no define los formatos de exportación: las maquetas muestran PDF, Excel y CSV como supuesto a confirmar.
