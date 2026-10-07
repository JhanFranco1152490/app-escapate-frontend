# app-escapate-frontend

Portal de Escápate. Next.js (App Router) + TypeScript + Tailwind v4, con pnpm.

Ver [`AGENTS.md`](AGENTS.md) para la estructura, la capa de API y las reglas de trabajo.

## Levantar el entorno

```bash
pnpm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL apunta al backend local
pnpm dev
```

## Pruebas y calidad

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm exec prettier --check .
```

## Tipos de la API

Con el backend local en marcha y `DEBUG=true`:

```bash
pnpm gen:api   # regenera src/lib/api/schema.d.ts
```
