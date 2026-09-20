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

- Stack instalado hoy: Next.js + React + TypeScript + Tailwind v4 + ESLint + Prettier
  (Husky + lint-staged en pre-commit), pnpm. Aún **sin** librería de estado de
  servidor/formularios/validación — se añaden cuando la primera feature real las necesite,
  no antes.
- Estructura: App Router en `src/app/`.
- Si tienes el repo workspace (`app escapate/`) al lado: `docs/CONTEXTO.md` tiene el
  dominio (CRM + cotizaciones + pagos de una agencia de viajes, 36 RF/51 HU) y `specs/`
  tiene las features especificadas — leer antes de construir una pantalla nueva. El
  "Portal de Asesores" (login + módulos por rol: Administrador, Asesor comercial,
  Encargado de proveedores y alianzas, Operativo) es la base de toda la interfaz.
