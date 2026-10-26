# Política de Privacidad y Tratamiento de Datos Personales

**Última actualización:** 20 de octubre de 2026

## 1. Quiénes somos

Escápate (la «agencia», «nosotros») es una agencia de viajes con sede en San José de Cúcuta,
Colombia, dedicada a la comercialización de paquetes turísticos nacionales e internacionales.

- **Responsable del tratamiento:** Agencia de Viajes Escapate, NIT 88195671-9.
- **Domicilio:** Autopista Bocono K1 046, San José de Cúcuta, Norte de Santander, Colombia.
- **Contacto para asuntos de datos personales:** soporte@escapate.tours · 310 210 8900.
- **Sitio:** https://escapate.tours

Esta política aplica a la plataforma web de gestión comercial de la agencia (la
«plataforma»), que usamos para administrar clientes, cotizaciones, ventas y pagos. La
plataforma es una herramienta interna: solo la usan las personas que la agencia registra
(administrador y asesores). Los clientes y viajeros no inician sesión en ella.

## 2. A quién aplica y qué datos tratamos

### 2.1 Personas que usan la plataforma (empleados y colaboradores)

| Dato | Para qué lo usamos |
| --- | --- |
| Nombres y apellidos | Identificar a la persona dentro del sistema |
| Correo (Gmail) | Enviar la invitación y la recuperación de contraseña; vincular el ingreso con Google |
| Tipo y número de documento | Identificar a la persona y permitir el ingreso con documento y contraseña |
| Celular | Contacto interno |
| Contraseña | Se guarda cifrada con un algoritmo de un solo sentido (Argon2id); nadie, incluido el administrador, puede verla |
| Rol y permisos | Decidir qué puede ver y hacer cada persona |
| Fecha de la última actividad | Saber cuándo se usó el sistema por última vez |
| Registro de ingresos: fecha, vía de ingreso (documento o Google) y dirección IP | Seguridad y detección de accesos indebidos |
| Intentos fallidos de ingreso: huella cifrada del documento y dirección IP | Bloquear intentos de adivinar contraseñas |

### 2.2 Clientes y viajeros

Los asesores registran en la plataforma datos de los clientes y de las personas que viajan:
nombres, documento de identidad, datos de contacto, fechas y destinos de viaje,
cotizaciones, ventas y pagos. Se tratan solo para cotizar, vender, gestionar el viaje y
cumplir las obligaciones legales y contables de la agencia.

### 2.3 Datos que no tratamos

No recolectamos datos sensibles (salud, origen étnico, orientación política, datos
biométricos) salvo que un cliente los suministre por necesidad del viaje (por ejemplo, una
restricción alimentaria o de movilidad), caso en el que se pide autorización expresa y es
opcional. No recolectamos datos de niños, niñas o adolescentes por fuera de lo necesario para
registrar a un menor como viajero, y en ese caso la autorización la da su representante legal.

## 3. Datos que recibimos de Google

La plataforma ofrece **«Continuar con Google»** como una forma alternativa de iniciar
sesión. Es solo para personas que la agencia ya registró con su correo de Gmail; tener una
cuenta de Google no da acceso a la plataforma.

- **Permisos que solicitamos:** `openid`, `email` y `profile`, los básicos de inicio de
  sesión. No pedimos acceso a Gmail, Drive, Calendar, contactos ni a ningún otro servicio de
  Google.
- **Qué recibimos:** el identificador único de la cuenta de Google, la dirección de correo y
  si Google la verificó, junto con el nombre y la foto de perfil que Google incluye en esa
  respuesta.
- **Qué usamos y guardamos:** solo el correo (que ya tenemos registrado) y el identificador
  único de la cuenta, que guardamos para reconocer a la persona en sus próximos ingresos.
  Aceptamos el ingreso únicamente si Google confirma que el correo está verificado. **No
  guardamos** el nombre ni la foto que envía Google, y no los mostramos.
- **Para qué:** únicamente para comprobar quién es la persona y abrirle sesión. No usamos
  estos datos para publicidad, perfilamiento, ni para entrenar modelos de inteligencia
  artificial.
- **Con quién los compartimos:** con nadie. No vendemos, alquilamos ni cedemos datos de
  Google a terceros.
- **Cómo los protegemos:** la conexión con Google usa el flujo de código de autorización con
  PKCE; validamos la firma del token que Google emite y los datos viajan siempre cifrados
  (HTTPS).
- **Cómo dejar de usarlo:** el administrador puede desvincular la cuenta de Google de una
  persona, que desde entonces ingresa con su documento y contraseña. Además, cualquier
  persona puede revocar el acceso de Escápate desde su cuenta de Google, en
  https://myaccount.google.com/permissions.

El uso y la transferencia a cualquier otra aplicación de la información que recibimos de las
API de Google respetan la
[Política de Datos de Usuario de los Servicios de las API de Google](https://developers.google.com/terms/api-services-user-data-policy),
incluidos los requisitos de Uso Limitado.

## 4. Finalidades

Tratamos los datos para:

1. Crear y administrar las cuentas de acceso y controlar los permisos de cada persona.
2. Autenticar a las personas que ingresan y proteger la plataforma contra accesos indebidos.
3. Enviar mensajes necesarios del servicio: invitación, recuperación de contraseña y avisos
   de seguridad.
4. Gestionar la relación comercial con clientes y viajeros: solicitudes, cotizaciones,
   ventas, reservas, pagos y seguimiento.
5. Cumplir obligaciones legales, contables y tributarias, y atender requerimientos de
   autoridades.

No usamos los datos para finalidades distintas de estas sin pedir antes una nueva
autorización.

## 5. Con quién compartimos los datos

No vendemos datos personales. Los compartimos solo en estos casos:

- **Proveedores que nos prestan infraestructura** (alojamiento de la plataforma y de la base
  de datos, y envío de correos), que los tratan por cuenta nuestra y bajo nuestras
  instrucciones. Algunos pueden tener servidores fuera de Colombia; en ese caso exigimos
  condiciones de seguridad equivalentes.
- **Proveedores turísticos** (aerolíneas, hoteles, operadores), únicamente los datos de los
  viajeros necesarios para emitir reservas y servicios que el cliente contrató.
- **Autoridades**, cuando una norma o una orden judicial o administrativa lo exige.

## 6. Cuánto tiempo los guardamos

| Dato | Plazo |
| --- | --- |
| Registro de ingresos (fecha, vía, IP) | 90 días, luego se borra |
| Sesiones abiertas | 7 días desde su emisión, o hasta que la persona cierre sesión |
| Intentos fallidos de ingreso | Se reinician a los 15 minutos sin nuevos fallos |
| Cuenta de una persona que usa la plataforma | Mientras tenga relación con la agencia; después, la cuenta se desactiva y, a los 12 meses, se anonimizan sus datos personales; se conserva el registro de las operaciones que realizó, sin identificarla, salvo que una norma exija conservar los datos |
| Datos de clientes y viajeros | Mientras dure la relación comercial y el plazo que exijan las normas contables y tributarias, luego se suprimen o anonimizan |

## 7. Cookies

La plataforma usa solo cookies necesarias para funcionar, que el navegador no deja leer a
scripts (`HttpOnly`):

- `escapate_access` y `escapate_refresh`: mantienen la sesión abierta.
- `escapate_oauth`: dura 10 minutos y protege el proceso de ingreso con Google.

No usamos cookies de publicidad ni de analítica de terceros.

## 8. Seguridad

Aplicamos medidas técnicas y organizativas para proteger los datos: conexión cifrada,
contraseñas guardadas con cifrado de un solo sentido, bloqueo temporal tras intentos
fallidos, límite de sesiones por persona, y acceso a la información según el rol de cada
persona. Ningún sistema es infalible; si ocurre un incidente que afecte tus datos, lo
gestionamos y avisamos a los titulares y a la Superintendencia de Industria y Comercio en los
términos que exige la ley.

## 9. Tus derechos

Como titular de los datos, según la Ley 1581 de 2012, puedes:

- Conocer, actualizar y rectificar tus datos.
- Solicitar prueba de la autorización que diste.
- Ser informado del uso que se ha dado a tus datos.
- Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).
- Revocar la autorización y solicitar la supresión de tus datos cuando no se respeten los
  principios y garantías legales o cuando ya no sean necesarios. La supresión no procede si
  tienes un deber legal o contractual de permanecer en la base de datos.
- Acceder gratuitamente a tus datos.

**Cómo ejercerlos:** escribe a soporte@escapate.tours indicando tu nombre, tu documento y lo que
solicitas. Respondemos las consultas en máximo diez (10) días hábiles y los reclamos en máximo
quince (15) días hábiles, prorrogables en los términos de la ley. Para proteger tus datos,
podemos pedirte que confirmes tu identidad.

## 10. Cambios a esta política

Si la actualizamos de forma importante, publicaremos la nueva versión en esta misma
dirección con la fecha de actualización y, cuando la ley lo exija, pediremos de nuevo tu
autorización.

## 11. Contacto

Agencia de Viajes Escapate · Autopista Bocono K1 046 · soporte@escapate.tours · 310 210 8900
