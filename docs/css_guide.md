# CSS for Svelte — Practical Guide

A focused guide on the CSS patterns you'll actually use building this app — written for someone who knows the basics but hasn't used variables, transitions, or thought much about structure.

---

## 1. CSS Variables (Custom Properties)

The single most impactful thing you can learn. Instead of repeating color values everywhere, you define them once and reference them by name.

### Defining variables

Variables go on the `:root` selector, making them available everywhere in the app:

```css
/* src/app.css */
:root {
  --bg: #0f0f13;
  --surface: #1a1a24;
  --primary: #6c63ff;
  --text: #f0f0f5;
  --text-muted: #8888a8;
  --success: #22c55e;
  --error: #ef4444;
  --radius: 12px;
  --radius-sm: 8px;
}
```

### Using variables

```css
.card {
  background: var(--surface);
  color: var(--text);
  border-radius: var(--radius);
  border: 1px solid var(--border);
}

.btn-primary {
  background: var(--primary);
  color: white;
}
```

### Why this matters

If you want to change your primary color across the whole app, you change **one line**. Without variables, you'd hunt through dozens of files.

You can also override variables in a local scope:

```css
.card.danger {
  --surface: #2a1a1a; /* just this card gets a red tint */
  background: var(--surface);
}
```

---

## 2. Transitions

Transitions make a CSS property change animate smoothly instead of jumping instantly.

### Basic syntax

```css
transition: <property> <duration> <timing-function>;
```

```css
.btn {
  background: var(--primary);
  transition: background 0.2s ease;
}

.btn:hover {
  background: #5a52e0; /* slightly darker */
}
```

Now hovering the button fades the background over 200ms instead of snapping.

### Transition multiple properties

```css
.card {
  transform: translateY(0);
  box-shadow: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-4px);     /* lifts up */
  box-shadow: 0 8px 24px #0006;   /* shadow appears */
}
```

### Timing functions (the feel of the animation)

| Value | Feel |
|---|---|
| `ease` | Starts fast, ends slow. Good default. |
| `ease-in-out` | Slow start, slow end. Feels natural. |
| `linear` | Constant speed. Good for spinners. |
| `cubic-bezier(...)` | Custom curve. Use [cubic-bezier.com](https://cubic-bezier.com) to preview. |

### What to transition in this app

| Element | Property to transition |
|---|---|
| Buttons | `background`, `transform` |
| Cards | `transform`, `box-shadow` |
| Progress bar fill | `width` |
| Correct/wrong feedback | `background-color` |
| Sidebar/modal | `opacity`, `transform` |

> **Rule of thumb:** Keep transitions between 150ms–400ms. Shorter feels snappy, longer feels sluggish. 200–250ms is the sweet spot for most UI interactions.

---

## 3. CSS Animations (`@keyframes`)

For things that need to animate on their own (not just on hover), use `@keyframes`.

### XP pop-up animation

```css
@keyframes pop-up {
  0%   { transform: translateY(0);    opacity: 1; }
  80%  { transform: translateY(-40px); opacity: 1; }
  100% { transform: translateY(-50px); opacity: 0; }
}

.xp-popup {
  animation: pop-up 1s ease forwards;
}
```

`forwards` means the element stays in its final state after the animation ends.

### Pulse feedback (correct/wrong)

```css
@keyframes pulse-success {
  0%, 100% { background: var(--surface); }
  50%       { background: #1a3a2a; }  /* brief green tint */
}

.exercise-card.correct {
  animation: pulse-success 0.6s ease;
}
```

### Flashcard flip (CSS 3D)

```css
.card-scene {
  perspective: 800px;  /* needed for 3D effect */
}

.card-inner {
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.5s ease;
}

.card-inner.flipped {
  transform: rotateY(180deg);
}

.card-front,
.card-back {
  position: absolute;
  inset: 0;
  backface-visibility: hidden; /* hides the back of each face */
}

.card-back {
  transform: rotateY(180deg);
}
```

Toggling the `flipped` class with Svelte triggers the flip animation automatically.

---

## 4. Layout — Flexbox & Grid

These are the two modern layout tools. Know both.

### Flexbox — for rows and columns of items

```css
.nav {
  display: flex;
  align-items: center;    /* vertical centering */
  justify-content: space-between; /* push items to edges */
  gap: 1rem;              /* space between items */
}
```

Common `justify-content` values:
- `flex-start` — pack to the left
- `flex-end` — pack to the right
- `center` — center everything
- `space-between` — first and last item at edges, equal gaps between

### Grid — for 2D layouts (like the unit card grid)

```css
.unit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}
```

`auto-fill` + `minmax` is the magic combo: as many columns as fit, each at least 240px wide, growing to fill available space. This is automatically responsive — no media queries needed for the column count.

---

## 5. Responsive Design (Media Queries)

Media queries apply styles at specific screen sizes.

```css
.card {
  padding: 1.5rem;
}

@media (max-width: 640px) {
  .card {
    padding: 1rem;  /* less padding on small screens */
  }
}
```

### Common breakpoints

| Name | Width | Use for |
|---|---|---|
| Mobile | `< 640px` | Phones |
| Tablet | `640px – 1024px` | Tablets, small laptops |
| Desktop | `> 1024px` | Laptops, monitors |

### Mobile-first approach (recommended)

Write your default styles for mobile, then add `min-width` queries to expand for larger screens:

```css
/* mobile: 1 column */
.unit-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

/* tablet+ */
@media (min-width: 640px) {
  .unit-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* desktop */
@media (min-width: 1024px) {
  .unit-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

## 6. Svelte-Specific Patterns

### Scoped styles (the default)

Every `<style>` block in a `.svelte` file is automatically scoped to that component. You don't need to worry about clashing class names:

```svelte
<div class="card">Hello</div>

<style>
  /* This .card rule ONLY applies to this component */
  .card {
    background: var(--surface);
  }
</style>
```

### Global styles

To style something globally from a component (like a class added dynamically to `body`), use `:global()`:

```css
:global(body) {
  background: var(--bg);
  color: var(--text);
}
```

### Svelte transitions (built-in)

Svelte has built-in JS transition directives that pair with CSS:

```svelte
<script>
  import { fade, fly, scale } from 'svelte/transition';
  let show = $state(true);
</script>

{#if show}
  <div transition:fade={{ duration: 200 }}>
    I fade in and out
  </div>
{/if}
```

Use these for things that appear/disappear: modals, notifications, the XP popup, exercise feedback overlays.

---

## 7. Good Practices Summary

| Practice | Why |
|---|---|
| Use CSS variables for all colors and radii | Change the whole theme in one place |
| Never hard-code hex values in components | Makes theming impossible later |
| Use `rem` for font sizes, `px` for borders/shadows | `rem` scales with user's font preferences |
| Keep transitions under 400ms | Longer feels laggy |
| Use `gap` instead of `margin` for spacing between flex/grid items | Simpler and no margin-collapse issues |
| Write mobile styles first, then expand with `min-width` queries | Forces you to think about small screens |
| Keep component styles scoped (in `<style>`) | No unintended side-effects |
| Only use `:global()` when absolutely necessary | Global styles are harder to reason about |

---

## 8. Useful Resources

- **[CSS Tricks — Flexbox Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)** — the definitive visual reference
- **[CSS Tricks — Grid Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)** — same for grid
- **[cubic-bezier.com](https://cubic-bezier.com)** — preview and tune animation curves
- **[MDN Web Docs — CSS](https://developer.mozilla.org/en-US/docs/Web/CSS)** — the authoritative reference for any property
- **[Josh Comeau's CSS Reset](https://www.joshwcomeau.com/css/custom-css-reset/)** — a modern reset to start every project with
