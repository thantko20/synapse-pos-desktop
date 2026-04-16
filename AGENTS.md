# AGENTS.md - Synapse POS Desktop

## Project Overview
Wails desktop POS app with Go backend and React/TypeScript frontend.

## Architecture
- `internal/<feature>/` — Vertical slices per feature (model, repository, service, api, errors, tests)
- `internal/database/` — Database connection, migrations, test helpers
- `internal/shared/` — Shared errors and utilities
- `frontend/src/features/<feature>/` — Feature-foldered frontend (api, types, schemas, queries, columns, components)
- `frontend/src/routes/` — TanStack Router file-based routes
- `frontend/src/components/ui/` — shadcn/ui components
- `main.go` — Entry point, initializes SQLite DB and Wails app, wires Api structs

No DDD enforced. Organize code by feature vertically; be flexible with layering.

## Commands
```bash
# Development
wails dev              # Full app with hot reload
wails dev --port 3000  # Frontend only (Vite dev server)

# Frontend
pnpm install           # Install dependencies
pnpm dev               # Vite dev server (port 3000)
pnpm build             # Production build
pnpm test              # Run Vitest tests

# Go
go mod tidy            # Sync dependencies
go build -tags webkit2_41  # Build Go binary (Linux compat)

# Wails bindings
wails generate module  # Regenerate frontend bindings after Go API changes
```

## Go Backend Conventions
- Format with `gofmt` or `goimports`
- Use standard `error` type; define sentinel errors per feature in `errors.go`
- Each feature vertical slice contains: `model.go`, `repository.go`, `service.go`, `api.go`, `errors.go`, `service_test.go`
- Api layer (`api.go`): Wails-bound struct with `SetContext(ctx)` method; methods take only business input (no `context.Context` param). `NewXxxApi(db)` wires repo + service internally.
- Repository layer: holds `*sql.DB` directly; uses `squirrel` for SELECT queries, raw SQL for INSERT/UPDATE/DELETE
- Service layer: business logic, validation, UUID v7 generation, timestamp handling
- Model layer: domain types, input structs with `json` tags, `validate()` methods, result/pagination structs
- Pagination: service returns `{Items, Total, Page, PageSize}`; repository does offset/limit
- Soft deletes via `is_active` flag; timestamps as `created_at`/`updated_at` Unix milliseconds
- UUID strings (`github.com/google/uuid` v7) for primary keys
- Tests: use `database.NewTestDB(t)` for in-memory SQLite; seed helpers in `database/testdb.go`
- After changing Go Api structs, run `wails generate module` to update frontend bindings

## Frontend Conventions
- Functional components with React hooks
- TypeScript strict mode enabled
- Tailwind CSS v4 + shadcn/ui (base-mira style) — use semantic color tokens (`bg-primary`, `text-muted-foreground`), not raw colors
- Path aliases: `#/*` maps to `./src/*`
- TanStack Router for file-based routing
- TanStack Query with `queryOptions` pattern for data fetching — define query options in `features/<feature>/queries.ts`, use `useQuery`/`useMutation` in components
- TanStack Table for data tables with shadcn Table components
- Feature folders: `frontend/src/features/<feature>/` contains `api.ts` (Wails binding wrappers), `types.ts` (inferred from Wails models), `schemas.ts` (Valibot form schemas, PascalCase names), `queries.ts`, `columns.tsx`, `components/`, `index.ts` (barrel export)
- Forms: TanStack Form with Valibot schemas via Standard Schema (no adapter needed); use `Field`/`FieldGroup`/`FieldLabel`/`FieldError` from `field.tsx` with `data-invalid`/`aria-invalid` for validation states
- Wails bindings auto-generated at `frontend/wailsjs/go/` — never edit manually; run `wails generate module` after Go API changes
- Types inferred from Wails-generated models in `wailsjs/go/models.ts`
- Dialog pattern: shared dialog component for create/edit flows
- Toast notifications: use `toast` from `sonner` for mutation feedback

## Database
- SQLite with `mattn/go-sqlite3`
- Migrations managed by `goose` under `internal/database/migrations`
- Foreign keys enabled via PRAGMA
- Soft deletes via `is_active` flag
- Timestamps as Unix milliseconds (`INTEGER` columns)
- Repositories hold `*sql.DB` directly; transaction support to be added later

## Testing
- Frontend: Vitest with `@testing-library/react`
- Backend: Standard Go testing with `database.NewTestDB(t)`
- Run frontend tests: `pnpm test`
- Run Go tests: `go test ./internal/... -v`

## Important Notes
- Database file: `./test.db` (created in project root, gitignored)
- Wails binds Go methods to frontend via feature Api structs (e.g., `CategoryApi`, `ProductApi`)
- `context.Context` is stored on Api structs via `SetContext()`, called in `OnStartup` — never passed as a method parameter
- Build tags: `webkit2_41` (Linux compatibility)
- Frontend output: `frontend/dist` embedded in Go binary
- App layout uses shadcn `SidebarProvider` in `__root.tsx` with navigation sidebar