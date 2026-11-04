<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Escápate — Frontend

Proyecto académico (UFPS). Este repo es la aplicación **Next.js** (App Router) +
TypeScript + Tailwind v4, un repo hermano de `app-escapate-backend` (FastAPI). Vive
normalmente junto al repo paraguas `app escapate` (workspace: `docs/`, `specs/`, contexto
completo del dominio) — pero **este archivo no depende de que ese repo exista al lado**:
quien clone solo este repo debe poder trabajar seguro con lo que sigue.

## No negociables del proyecto (resumen — la versión completa con el porqué de cada uno
vive en `AGENTS.md` del workspace, si lo tienes al lado)

- **Commits y push: los hace la persona, nunca el agente**, salvo que se pida explícito en
  esa sesión. El agente siempre propone el mensaje de commit.
- **Dos ramas fijas `main`/`dev`.** Ramas de trabajo salen de `dev`, nunca de `main`;
  integran a `dev` por PR con **squash merge**. Nadie hace force-push a ninguna de las dos.
- **Idioma:** nombres en el código (variables, funciones, componentes, tipos) en
  **inglés**; **comentarios de código en español, sin emojis**; mensajes de commit en
  **inglés**, formato Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`,
  `chore:`), resumen conciso ≤ 72 caracteres. El cuerpo del commit **solo** para el porqué
  que el diff no muestra por sí solo — nunca para narrar el qué; si no hay nada así, sin
  cuerpo.
- **Comentarios de código nunca mencionan specs, el repo workspace, ni rutas como
  `specs/003`** — este repo puede vivir clonado solo, sin el workspace al lado, así que esa
  referencia sería un enlace roto. Si hace falta el porqué de una decisión, se escribe
  completo en el comentario mismo.
- **Los comentarios tampoco nombran el proveedor/herramienta de turno** (Railway, Vercel,
  etc.) salvo que el código dependa de un detalle propio de ese proveedor. El mecanismo real
  (variables de entorno, convención 12-factor) es el mismo sin importar el proveedor, y
  nombrarlo de más ata el comentario a una decisión de infraestructura que puede cambiar.
  Un ejemplo con nombre de proveedor sí es válido en `.env.example`, nunca en código.
- **Toda feature con código lleva tests.** Lint/formato limpio antes de commitear (ESLint +
  Prettier, ya configurados con Husky + lint-staged en pre-commit).
- **Nunca commitear secretos** (`.env*`, llaves de API).
- **Seguridad y datos: activa desde el inicio.** Ver "Seguridad y datos" en `AGENTS.md`
  del workspace — este sistema maneja datos personales reales de clientes/viajeros y
  autenticación real de usuarios (administrador, asesores) desde el primer sprint. Nunca
  loggear ni exponer en consola datos personales reales, ni siquiera en desarrollo.

## Específico de este repo

- Si tienes el repo workspace (`app escapate/`) al lado: `docs/CONTEXTO.md` tiene el
  dominio (CRM + cotizaciones + pagos de una agencia de viajes, 36 RF/51 HU) y `specs/`
  tiene las features especificadas — leer antes de construir una pantalla nueva. El
  "Portal de Asesores" (login + módulos por rol: Administrador, Asesor comercial,
  Encargado de proveedores y alianzas, Operativo) es la base de toda la interfaz.

### Stack y estructura

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4, pnpm. TanStack Query (datos
del servidor), `nuqs` (filtros y paginación en la URL), react-hook-form + zod (formularios),
date-fns + `@date-fns/tz` (fechas), shadcn/ui sobre Base UI (componentes). Vitest + Testing
Library + MSW (pruebas). ESLint + Prettier con el plugin de Tailwind, en pre-commit con
Husky + lint-staged.

```
src/
├── app/                  rutas; layout.tsx monta providers.tsx (QueryClient + NuqsAdapter)
│   ├── (auth)/           pantallas sin sesión (/iniciar-sesion, /recuperar-contrasena,
│   │                     /restablecer-contrasena, /crear-contrasena), todas sobre AuthShell
│   ├── (public)/         páginas sin sesión ni guardia: /acerca, /privacidad, /terminos
│   └── (app)/            panel: layout.tsx = SessionGuard + PanelLayout; toda página con
│                         sesión va aquí
├── features/<dominio>/   api.ts, schemas.ts, components/, hooks use-*.ts
│   ├── auth/             sesión, login, recuperar contraseña, guardia y permisos
│   ├── panel/            marco del panel: barra superior, menú lateral (nav-items.ts),
│   │                     menú de cuenta, bienvenida
│   ├── users/            gestión de usuarios: lista, alta, ficha, edición y acciones
│   ├── roles/            roles y permisos: lista, matriz de permisos, alta, edición y borrado
│   ├── clients/          clientes: lista, alta, ficha (con sus viajeros) y edición
│   ├── travelers/        viajeros: lista, alta, ficha y edición
│   ├── suppliers/        proveedores turísticos: lista, alta, ficha, edición, desactivar y activar
│   └── legal/            páginas públicas: marco, "acerca de" y visor del texto legal
├── components/
│   ├── ui/               solo shadcn/ui
│   └── …                 compartidos por más de un dominio (page-header, button-link,
│                         confirm-dialog, search-input, pagination, empty-state,
│                         stale-version-notice, status-badge, international-phone-field,
│                         city-datalist, …)
├── lib/
│   ├── api/              client.ts, errors.ts, form-errors.ts, query-keys.ts,
│   │                     query-string.ts, schema.d.ts
│   ├── format/           dates.ts, money.ts, document.ts, phone.ts
│   ├── validation/       text.ts (reglas de texto), document.ts (reglas por tipo de documento)
│   ├── countries.ts      códigos de país de la API y sus nombres en español
│   ├── city-suggestions.ts  ciudades que se proponen en los campos de ciudad
│   ├── action-feedback.ts   aviso (info o error) tras una acción sobre un registro
│   ├── form-notice.ts    aviso de "faltan N campos" arriba de un formulario
│   ├── page-notice.ts    aviso que una pantalla deja para la siguiente ("Cliente registrado.")
│   ├── query-client.ts   reintentos e invalidación de la sesión ante un 401
│   └── env.ts            NEXT_PUBLIC_API_URL (el build falla si falta en producción)
├── content/legal/       privacidad.md y terminos.md: el texto publicado (fuente única)
└── test/                 render.tsx, server.ts, handlers.ts, session.ts, users.ts, roles.ts,
                          clients.ts, suppliers.ts
```

Rutas visibles en español (`/clientes`, `/cotizaciones/[id]`); código en inglés.

Los tokens de marca (colores, tipografías, tres temas) están en `src/app/globals.css`,
portados de `docs/ui/design-system/tokens.css` y mapeados a las variables de shadcn. La
clase `.dark-surface` aplica los valores oscuros a una sola zona (el login, oscuro en los
tres temas). Las maquetas de `docs/ui/` son la guía visual.

### Capa de API

- `lib/api/client.ts` (`apiFetch`) es el **único** lugar que llama a `fetch`: prefija la
  URL, envía las cookies, agrega `X-CSRF-Token` en mutaciones (lo pide a
  `GET /api/auth/csrf` en cada mutación; las simultáneas comparten una sola petición, y no
  se guarda para después porque otra pestaña puede rotar la cookie) y, ante un `401` de un
  endpoint que usa el token de acceso, renueva la sesión una sola vez y reintenta. Si la
  renovación falla con `authentication_failed`, reintenta igual una vez: otra pestaña pudo
  renovar antes y dejó las cookies nuevas en el navegador. Con `not_authenticated` (sin
  cookie de renovación) no reintenta. El cierre de sesión espera a una renovación en vuelo.
- Todo error sale como `ApiError { status, code, fields, message }`; un 2xx que no es JSON
  da `unexpected_response`, y sin red llega un `TypeError` (`isNetworkFailure`).
- Tipos de la API: solo de `lib/api/schema.d.ts`, generado con `pnpm gen:api` (backend local
  con `DEBUG=true`). Nunca se escriben a mano; se regenera en el mismo PR que cambia la API.
- Por dominio, `features/<dominio>/api.ts`: alias de tipos de `schema.d.ts`, fetchers como
  constantes **fuera** de los hooks (`const fetchClients = () => apiFetch<...>('/api/clients')`),
  hooks `useX` con TanStack Query y claves de `lib/api/query-keys.ts`.
- Un `401` en cualquier consulta o mutación invalida `queryKeys.session()` desde
  `lib/query-client.ts`; la consulta de la sesión no se invalida a sí misma.

### Sesión y permisos (`features/auth`)

- `SessionGuard` protege todo lo que está en `app/(app)/`: mientras carga muestra un
  esqueleto; un `401` manda a `/iniciar-sesion?next=<ruta actual>`; un 500 o la falta de red
  muestran "Reintentar" sin sacar a la persona.
- **Dentro del panel, la sesión solo la consulta la guardia.** Los componentes leen el
  usuario con `useCurrentUser()` (nunca `undefined`), los permisos con
  `useHasPermission(code)` y cierran sesión con `useSignOut()`. No usar `useSession()` ahí:
  el cierre de sesión vacía la caché y cualquier otra consulta de la sesión volvería a
  pedir `/api/auth/me`, recibiría un 401 y provocaría una segunda redirección.
- `useHasPermission` solo decide qué se muestra; la API responde 403 de todas formas.
- **Menú del panel:** cada módulo agrega su entrada en `features/panel/nav-items.ts` (ruta,
  etiqueta, número, ícono, grupo y permiso). Se muestra solo con el permiso; desde `md` va
  en la barra lateral y por debajo dentro del menú de la cuenta.
- **Pantallas con permiso:** el `page.tsx` envuelve la pantalla en
  `<RequirePermission codes={[...]}>` (de `features/auth`), que muestra "Sin permiso" a quien
  entra por la URL sin tenerlo. Un `403` de la consulta también muestra `ForbiddenState`.
- La pantalla de login confía en `session.isSuccess`, no en `session.data`: tras un 401 la
  caché conserva el último usuario.
- **Cuentas de demostración en el login (solo staging):** con `NEXT_PUBLIC_DEMO_ACCOUNTS=true`
  al compilar, el login muestra el menú "Entrar con una cuenta de demostración"
  (`demo-accounts-menu.tsx`, datos en `demo-accounts.ts`): un clic llena el formulario con
  esa cuenta y lo envía, y los errores salen igual que al escribirlos. Son las cuentas
  ficticias que carga el comando `seed-demo` del backend, por eso las contraseñas están en el
  código. Sin la variable, el menú y las contraseñas **no llegan al navegador**: `next.config.ts`
  fija la variable siempre (sin un valor definido Next no descarta el `import()` y publica el
  chunk igual) y `login-screen.tsx` la compara completa para que se descarte la rama. Si se
  toca cualquiera de las dos cosas, comprobarlo con un build sin la variable y
  `grep -r <una contraseña> .next/static .next/server`, que debe dar vacío. La variable se
  define solo en el servicio de staging, nunca en producción.
- **Recuperar contraseña e invitación:** el token del enlace llega después de `#` (el
  navegador no lo envía a ningún servidor); `useResetTokenFromHash` lo lee una sola vez y lo
  quita de la barra de direcciones, y viaja solo en el cuerpo de `check` y `confirm`. El
  documento que el login pasa a `/recuperar-contrasena` va en memoria del módulo
  (`reset-prefill.ts`), nunca en la URL ni en el almacenamiento del navegador. Al crear la
  contraseña la API deja la sesión abierta y el frontend entra al panel.
- Pantallas usables desde 360 px. El quiebre principal es `md` (768 px): por debajo, el
  login oculta el panel de marca y la barra del panel pasa nombre y cierre a un menú.
  Campos con letra de 16 px y áreas táctiles de 44 px como mínimo.

### Datos y formularios

- Formularios con react-hook-form + zod (schemas en `features/<dominio>/schemas.ts`); los
  errores de la API se aplican con `applyApiFormError` (marca los campos y dice si hace
  falta un aviso general y a qué campo llevar el foco). Para un aviso que no muestra el
  texto del servidor, `rateLimitOr(error, genérico)`.
- Filtros y paginación en la URL con `nuqs`. Una pantalla que los lee va dentro de
  `<Suspense>` en su `page.tsx` (sin eso el build no puede prerenderizarla). Al cambiar un
  filtro se borra la página, y un `404` por página fuera de rango vuelve a la primera.
- Búsqueda con `components/search-input.tsx`, que avisa 300 ms después de la última tecla.
  No usar `limitUrlUpdates` de `nuqs` para eso: solo retrasa la URL, el estado cambia al
  instante y la lista se pediría con cada tecla.
- Confirmaciones con `components/confirm-dialog.tsx` (sobre el `alert-dialog` de shadcn): no
  se cierra mientras la acción está en curso y, si falla, muestra el motivo adentro.
- Fechas solo desde `lib/format/dates.ts` y montos solo desde `lib/format/money.ts`: los
  componentes no llaman a `Intl` ni a `new Date()`. Los montos llegan en pesos enteros y el
  frontend no calcula precios (lo hace el backend).

### Pruebas

- `pnpm test` (una vez), `pnpm test:watch`, `pnpm test:coverage`. Cada test vive junto al
  archivo que prueba (`x.test.ts(x)`) e importa `describe`/`it`/`expect` de `vitest`.
- Vitest corre en **UTC** a propósito: un test de fechas que pasa en Bogotá y falla en UTC
  está usando la zona de la máquina.
- MSW simula la API (`src/test/server.ts`); una petición sin handler hace fallar el test.
  Los handlers propios se declaran con `server.use(...)`; `apiUrl(path)` arma la URL.
- `renderWithProviders` (`src/test/render.tsx`) monta QueryClient de pruebas + adaptador de
  `nuqs`; `renderHookWithProviders` hace lo mismo para probar hooks.
- Usuarios de prueba: `buildUserDetail`, `buildUserListItem`, `buildUserPage` y `ROLES`
  (`src/test/users.ts`).
- Clientes y viajeros de prueba: `buildClientDetail`, `buildCompanyDetail`,
  `buildClientListItem`, `buildTravelerDetail`, `buildClientAsTraveler`,
  `buildTravelerListItem` y `buildPage` (`src/test/clients.ts`).
- Proveedores de prueba: `buildSupplierDetail` y `buildSupplierListItem`
  (`src/test/suppliers.ts`).
- Sesión de prueba: `buildSession()` (`src/test/session.ts`), y en `handlers.ts`
  `sessionHandler(session)` (con sesión) y `noSessionHandlers` (`/me` y `refresh` en 401).
  Un componente que usa `useCurrentUser` se prueba dentro de `<SessionGuard>`, con
  `next/navigation` simulado (`vi.mock`).
- Datos inventados (`@example.com`): nunca datos personales reales.

### Reglas de diseño del código

- **Una responsabilidad por archivo**, un componente por archivo (kebab-case), ~150 líneas
  como referencia: si crece, se parte.
- **No duplicar.** La segunda vez que aparece algo se extrae: a `components/` si es
  visual y no depende de un dominio, a `lib/` si es lógica.
- **Páginas delgadas.** Un `page.tsx` monta una pantalla de `features/`; no lleva lógica.
- **Capas en una sola dirección**: `app` → `features` → `components` → `lib`.
- **Dependencias entre dominios en una sola dirección y declaradas.** Un dominio puede
  importar de otro solo si está en la tabla de abajo, si el otro no importa de él (sin
  ciclos) y solo de su capa pública: `api.ts`, `schemas.ts`, hooks y los componentes
  pensados para otros dominios, nunca sus archivos internos. Lo que dos dominios comparten
  sin depender uno del otro sube a `components/` o `lib/`. Cada feature que agrega una
  dependencia agrega su fila en el mismo PR.

  | Dominio | Puede importar de                                      |
  | ------- | ------------------------------------------------------ |
  | `auth`  | —                                                      |
  | `panel` | `auth` (usuario actual, permisos y cierre de sesión)   |
  | `users` | `auth` (usuario actual, permisos, `RequirePermission`, `DocumentFields` y etiquetas de documento); `roles` (`useRoles`, `useRole`, `usePermissionCatalog` y `RoleGrants`) |
  | `roles` | `auth` (usuario actual, permisos y `RequirePermission`)                  |
  | `clients` | `auth` (usuario actual, permisos y `RequirePermission`)                |
  | `travelers` | `auth` (usuario actual, permisos y `RequirePermission`); `clients` (`useClients`, `useClient` y `ClientPicker`) |
  | `suppliers` | `auth` (usuario actual, permisos y `RequirePermission`)                |

- **Elegir la mejor opción, no la librería por defecto.** Ante una necesidad técnica se
  comparan las alternativas reales (lo que trae Next.js, una librería, código propio) y se
  deja escrito en el PR lo elegido y lo descartado.

### Antes de proponer un PR

El agente corre y deja en verde, y si algo falla lo corrige o lo dice en el PR:

1. `pnpm exec prettier --check .`
2. `pnpm lint`
3. `pnpm typecheck` (`next typegen && tsc --noEmit`)
4. `pnpm test`
5. `NEXT_PUBLIC_API_URL=http://localhost:8000 pnpm build` (no hace falta `.env`)
6. Si cambió la API, `pnpm gen:api` con el backend en marcha y `DEBUG=true`.
7. Revisar el diff completo buscando bugs: casos borde, código duplicado, datos personales
   en logs o pruebas, tests que no afirman nada.

### Trampas conocidas

- **No excluir `/api/auth/me` de la renovación de sesión:** es el endpoint que descubre que
  el token de acceso venció; sin renovación la persona saldría cada vez que vence.
- **`cn` viene del paquete `cn`** (`import { cn } from 'cn'`); no existe `src/lib/utils.ts`.
  La versión actual de shadcn ya escribe ese import, pero si algún componente generado trae
  `@/lib/utils`, se corrige el import en vez de recrear el archivo.
- **Un enlace con forma de botón va con `ButtonLink`** (`components/button-link.tsx`), no con
  `className={buttonVariants(...)}` suelto: sin pasar por `cn`, el borde transparente de la
  base le gana al de `outline` y el enlace se ve sin marco.
- **`shadcn add` puede querer sobrescribir `components/ui/button.tsx`** (por ejemplo, al
  agregar `alert-dialog`) con la versión genérica, que pierde las alturas de 44 px y el texto
  navy sobre naranja. Revisar antes con `--view` y responder que no.
- **`pnpm-workspace.yaml` → `allowBuilds`:** pnpm 11 falla el `install` (también en el build
  de despliegue) si una dependencia con script de instalación queda sin decidir. Al agregar
  una así, marcarla `true` o `false` ahí.
- **Windows con `core.autocrlf=true`:** `prettier --check .` marca todos los archivos por
  los finales de línea CRLF; se verifica con `prettier --check --end-of-line auto .`.
- **`typecheck` falla por una ruta que ya no existe:** son tipos viejos de `next dev` en
  `.next/dev/types`; se borra esa carpeta (es generada).

- No leer el texto del error de la API para decidir lógica (cambia con el idioma y la
  redacción): usar el código del error o el status.
- No duplicar el estado del servidor en `useState`: se lee de la consulta. Los únicos
  borradores locales aceptables son lo que la persona está escribiendo y la ficha con la que
  se abre un formulario de edición (fijada al montar, para no pisar con valores viejos lo que
  otra persona guardó).
