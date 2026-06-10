# Stenobar Raycast Extension — Agent Notes

A Raycast extension (TypeScript) that drives the Stenobar macOS app via its
`stenobar://` URL scheme and searches its `index.json` library snapshot.

## Layout

- `src/lib/index.ts` — index types, `loadIndex()`, `useStenobarIndex()` hook,
  `IndexNotFoundError`, and the `indexPath` preference resolution.
- `src/lib/stenobar.ts` — `runDeepLink(url, hud)`: the shared helper behind
  every no-view command (open URL → `showHUD`, errors → `showFailureToast`).
- `src/lib/format.ts` — duration/date formatting and date sort.
- `src/components/index-missing.tsx` — shared empty state when `index.json` is
  absent.
- `src/<command>.ts(x)` — one file per `commands[].name` in `package.json`.

## Conventions

- Each manifest command maps 1:1 to `src/<name>.ts` (no-view) or `.tsx` (view).
- The index schema is external and may change: `project`/`projectSlug` can be
  absent, key order isn't stable, lists can be empty. Parse defensively.
- Reference: `URL-SCHEME.md` documents the full URL scheme and index schema.

## Commands

- `npm run dev` — `ray develop` (hot reload into Raycast).
- `npm run lint` / `npm run fix-lint` — Raycast ESLint (must pass clean).
- `npm run build` — `ray build`.

## Before Store submission

Replace the placeholder `assets/icon.png` with a polished 512×512 icon and add
screenshots.
