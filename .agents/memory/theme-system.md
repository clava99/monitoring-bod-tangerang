---
name: Theme system
description: Dark/light theme implementation — custom context, CSS variables, toggle component
---

# Theme System

## Why custom context, not next-themes
`next-themes` causes "Invalid hook call" in the pnpm monorepo due to duplicate React instances. A custom `ThemeContext` toggling `.dark` on `document.documentElement` is the reliable approach here.

## How to apply
- `src/contexts/ThemeContext.tsx` — `ThemeProvider` + `useTheme()` hook. Persists to `localStorage` key `sigmon-theme`.
- `src/components/ThemeToggle.tsx` — two variants: `"sidebar"` (pill toggle with stars/sun animation) and `"floating"` (circular button with emoji). Import `useTheme` from ThemeContext, never from next-themes.
- `src/index.css` — `.dark { ... }` block overrides all CSS variables. `@custom-variant dark (&:is(.dark *))` enables `dark:` Tailwind prefix.
- `App.tsx` wraps with `<ThemeProvider>` as outermost provider.
- Login page: inline styles use `hsl(var(--background))`, `hsl(var(--foreground))`, `hsl(var(--border))`, `hsl(var(--input))`, `hsl(var(--muted-foreground))` so dark mode adapts automatically.
- Sidebar and Login both mount ThemeToggle.

**Why:** next-themes uses its own React context which conflicts with the monorepo's shared React singleton, causing hook errors.
