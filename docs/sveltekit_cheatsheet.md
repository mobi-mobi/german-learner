# Svelte 5 & SvelteKit Cheatsheet

A quick-reference guide covering project structure, file types, runes, directives, and server patterns.

---

## Project Structure

```
my-app/
├── src/
│   ├── app.css              ← global CSS (imported in +layout.svelte)
│   ├── app.d.ts             ← global TypeScript types (App.Locals etc.)
│   ├── app.html             ← root HTML shell (don't usually touch this)
│   ├── hooks.server.ts      ← server-side request middleware
│   │
│   ├── lib/                 ← shared code, importable as $lib/...
│   │   ├── components/      ← reusable UI components
│   │   ├── server/          ← server-only utilities (never sent to browser)
│   │   ├── auth.ts          ← example: auth config
│   │   └── db.ts            ← example: database client
│   │
│   └── routes/              ← file-based routing (URL = folder path)
│       ├── +layout.svelte   ← wraps ALL pages (nav, footer, providers)
│       ├── +layout.server.ts← load data for ALL pages, server-side
│       ├── +page.svelte     ← the / route
│       ├── +page.server.ts  ← load data for /, server-side
│       │
│       └── unit/
│           └── [id]/        ← dynamic route parameter
│               ├── +page.svelte
│               └── +page.server.ts
│
├── prisma/
│   └── schema.prisma
├── static/                  ← public files (favicon, images)
├── svelte.config.js
└── vite.config.ts
```

### The `+` file naming convention

| File | Purpose |
|---|---|
| `+page.svelte` | The page UI component |
| `+page.server.ts` | Runs on server only — load data, handle form actions |
| `+page.ts` | Runs on server + client — universal load function |
| `+layout.svelte` | Wraps all child routes with shared UI |
| `+layout.server.ts` | Load data shared across all child routes |
| `+error.svelte` | Custom error page for this route |
| `+server.ts` | API endpoint — handles GET, POST etc. directly |

> Files prefixed with `+` are special SvelteKit files. Everything else in `routes/` is just a regular component.

---

## Data Flow: Load → Page

The most important pattern to understand:

```
+page.server.ts  →  exports load()  →  returns data
+page.svelte     →  receives data   →  renders UI
```

**`+page.server.ts`**
```ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const unit = await db.unit.findUnique({ where: { id: +params.id } });
  return { unit }; // ← this becomes `data` in the page
};
```

**`+page.svelte`**
```svelte
<script lang="ts">
  let { data } = $props(); // ← receives what load() returned
</script>

<h1>{data.unit.title}</h1>
```

---

## Runes (Svelte 5 Reactivity)

Runes are the new reactive primitives in Svelte 5. They replace the old `let`, `$:`, and `export let` patterns.

### `$state` — reactive variable

```svelte
<script lang="ts">
  let count = $state(0);       // reactive, any change re-renders
  let name = $state("Alice");
  let items = $state<string[]>([]);
</script>

<button onclick={() => count++}>{count}</button>
```

Use `$state` for anything the UI needs to react to.

### `$derived` — computed value

```svelte
<script lang="ts">
  let items = $state([1, 2, 3, 4]);

  let total = $derived(items.length);
  let evens = $derived(items.filter(n => n % 2 === 0));
</script>

<p>Total: {total}, Evens: {evens.join(', ')}</p>
```

`$derived` recalculates automatically when its dependencies change. Never mutate derived values directly.

### `$effect` — side effects

Runs after renders, re-runs when its dependencies change.

```svelte
<script lang="ts">
  let userId = $state("abc");

  $effect(() => {
    console.log("userId changed to:", userId);
    // runs when userId changes
  });

  $effect(() => {
    const timer = setInterval(() => console.log("tick"), 1000);
    return () => clearInterval(timer); // ← cleanup function
  });
</script>
```

Use for: syncing to localStorage, calling external APIs when state changes, setting up/tearing down subscriptions.

### `$props` — component inputs

Replaces `export let` from Svelte 4.

```svelte
<!-- Card.svelte -->
<script lang="ts">
  let { title, xp = 0, onclick } = $props<{
    title: string;
    xp?: number;
    onclick?: () => void;
  }>();
</script>

<div class="card" {onclick}>{title} — {xp} XP</div>
```

### `$bindable` — two-way prop binding

When a child component needs to update a parent's value:

```svelte
<!-- InputField.svelte -->
<script lang="ts">
  let { value = $bindable() } = $props();
</script>
<input bind:value />
```

```svelte
<!-- Parent -->
<script lang="ts">
  let name = $state("");
</script>
<InputField bind:value={name} />
<p>{name}</p>
```

---

## Template Syntax

### Conditionals

```svelte
{#if user}
  <p>Hello, {user.name}</p>
{:else if loading}
  <p>Loading...</p>
{:else}
  <p>Not logged in</p>
{/if}
```

### Loops

```svelte
{#each items as item (item.id)}
  <Card {item} />
{:else}
  <p>No items found.</p>
{/each}
```

The `(item.id)` is a **key** — tells Svelte how to track items when the list changes. Always include it when items can be reordered or removed.

### Async (await blocks)

```svelte
{#await promise}
  <Spinner />
{:then data}
  <Result {data} />
{:catch error}
  <p>Error: {error.message}</p>
{/await}
```

---

## Element Directives (the `:` and `on:` stuff)

### Event handlers

```svelte
<!-- Svelte 5 style (preferred) -->
<button onclick={() => count++}>Click</button>
<input oninput={(e) => name = e.target.value} />
<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>

<!-- You can also use handler references -->
<button onclick={handleClick}>Click</button>
```

Common events: `onclick`, `oninput`, `onchange`, `onsubmit`, `onkeydown`, `onmouseover`, `onfocus`, `onblur`

### `bind:` — two-way data binding

Syncs a variable with an element's property:

```svelte
<script lang="ts">
  let name = $state("");
  let checked = $state(false);
  let selected = $state("option1");
</script>

<input bind:value={name} />          <!-- text input -->
<input type="checkbox" bind:checked />   <!-- checkbox -->
<select bind:value={selected}>           <!-- select -->
  <option value="option1">One</option>
</select>

<!-- Shorthand when variable name matches: -->
<input bind:value />  <!-- same as bind:value={value} -->
```

Special binds:
```svelte
<div bind:clientWidth={width} bind:clientHeight={height}>
<input bind:this={inputEl} />  <!-- reference to DOM element -->
```

### `class:` — conditional classes

```svelte
<div class:active={isActive} class:error={hasError}>
```

Equivalent to:
```svelte
<div class={isActive ? 'active' : ''}>
```

Much cleaner for toggling multiple classes.

### `style:` — inline style binding

```svelte
<div style:color={textColor} style:font-size="{size}px">
```

### `use:` — actions (reusable DOM directives)

```svelte
<script>
  function clickOutside(node, callback) {
    const handle = (e) => { if (!node.contains(e.target)) callback(); };
    document.addEventListener('click', handle);
    return { destroy: () => document.removeEventListener('click', handle) };
  }
</script>

<div use:clickOutside={() => open = false}>...</div>
```

### `transition:` / `in:` / `out:`

```svelte
<script>
  import { fade, fly, scale, slide } from 'svelte/transition';
  let show = $state(true);
</script>

{#if show}
  <div transition:fade>fades in and out</div>
  <div transition:fly={{ y: 20, duration: 300 }}>flies in from below</div>
  <div in:scale out:fade>different in/out</div>
{/if}
```

---

## Server Patterns

### Form Actions (the Svelte way to handle POST)

Instead of an API endpoint, handle form submissions directly in `+page.server.ts`:

```ts
// +page.server.ts
import type { Actions } from './$types';

export const actions: Actions = {
  // handles POST to ?/createWord
  createWord: async ({ request, locals }) => {
    const data = await request.formData();
    const german = data.get('german') as string;

    await db.word.create({ data: { german, ... } });
    return { success: true };
  }
};
```

```svelte
<!-- +page.svelte -->
<form method="POST" action="?/createWord">
  <input name="german" />
  <button type="submit">Add</button>
</form>
```

### API Endpoints (`+server.ts`)

For JSON APIs (used by `fetch` from `auth-client.ts` etc.):

```ts
// src/routes/api/units/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  const units = await db.unit.findMany();
  return json(units);
};

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const unit = await db.unit.create({ data: body });
  return json(unit, { status: 201 });
};
```

### `locals` — passing data through the request

Set in `hooks.server.ts`, available in all `load()` functions and actions:

```ts
// hooks.server.ts
export async function handle({ event, resolve }) {
  const session = await auth.getSession(event);
  event.locals.user = session?.user ?? null;
  return resolve(event);
}
```

```ts
// +page.server.ts
export const load = async ({ locals }) => {
  if (!locals.user) redirect(302, '/auth/login');
  return { user: locals.user };
};
```

### `redirect` and `error`

```ts
import { redirect, error } from '@sveltejs/kit';

// In a load function or action:
redirect(302, '/auth/login');      // redirect (throws)
error(404, 'Unit not found');      // show error page (throws)
error(403, 'Forbidden');
```

---

## The `$lib` Alias

Anything inside `src/lib/` can be imported with `$lib/` instead of relative paths:

```ts
// Instead of:
import db from '../../../lib/db';

// You write:
import db from '$lib/db';
```

Also available: `$env/dynamic/private` (server env vars), `$env/static/public` (public env vars), `$app/environment` (e.g. `building`, `browser`).

---

## Quick Reference Card

```
$state(val)          → reactive variable
$derived(expr)       → computed from other state
$effect(() => {})    → side effect when state changes
$props()             → receive component inputs
$bindable()          → allow parent to bind to this prop

{#if condition}      → conditional rendering
{#each list as item (key)} → loop
{#await promise}     → async rendering

onclick={fn}         → event handler (Svelte 5)
bind:value={x}       → two-way binding
class:name={bool}    → conditional class
style:prop={val}     → inline style
use:action           → attach custom DOM behavior
transition:fade      → animate in/out

load()               → fetch data server-side, return to page
actions: {}          → handle form POST server-side
locals               → request-scoped server data (user, session)
redirect(302, url)   → redirect from server
error(404, msg)      → show error page
```
