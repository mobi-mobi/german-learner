# German Learning Web App — Implementation Plan

## Overview

A structured German learning platform tied to a specific school textbook, featuring interactive exercises, gamification, and admin tooling. Content is organized into **20 units** matching the textbook structure.

**Stack:** SvelteKit · Prisma · Neon (PostgreSQL) · Better Auth · TypeScript

## Confirmed Decisions

| Decision | Choice |
|---|---|
| Unit locking | All 20 units unlocked from day one |
| Vocabulary import format | JSON |
| Leaderboard | Global only |
| Exercise content source | Admin-provided (AI-assisted by you) |
| Language direction | Slovak → German only (may revisit) |

---

## My Recommendations & Opinions

> [!TIP]
> **Vocabulary import strategy.** Since you're scanning vocabulary from a physical book, I recommend building a private `/admin/import` page where you paste raw text (e.g. GPT-extracted word lists) and the app parses + inserts them into the DB. This is faster than building a dedicated OCR pipeline. Claude/GPT output in CSV or JSON is very clean to work with.

> [!TIP]
> **Exercise types to prioritize.** Based on what you described, I'd suggest this priority order: (1) flashcard vocabulary, (2) fill-in-the-gap, (3) multiple choice, (4) translation input, (5) grammar theory pages. Flashcards and fill-in-the-gap give the best return on time invested for language learning.

> [!TIP]
> **XP design.** Don't tie XP solely to correct answers — reward *streaks*, *speed*, and *revisiting failed words*. This feels much more game-like and drives retention.

> [!NOTE]
> **Grammar theory.** I'd store grammar explanations as rich Markdown/HTML content per unit rather than trying to make them interactive. You can render them with a Svelte markdown component. Keep it simple initially — theory pages are read, not graded.

> [!IMPORTANT]
> **Leaderboard privacy.** Consider letting users set a display name separate from their real name for the leaderboard — some students won't want their real name shown publicly.

---

## Database Schema

New models to add on top of the existing Better Auth models (`User`, `Session`, `Account`, `Verification`):

### Content Models

```prisma
model Unit {
  id          Int          @id @default(autoincrement())
  number      Int          @unique  // 1–20
  title       String
  description String?
  words       Word[]
  grammarTopics GrammarTopic[]
  exercises   Exercise[]
  userProgress UserUnitProgress[]
}

model Word {
  id           Int      @id @default(autoincrement())
  unitId       Int
  unit         Unit     @relation(fields: [unitId], references: [id])
  german       String
  slovak       String
  wordType     WordType // NOUN, VERB, ADJECTIVE, OTHER
  gender       Gender?  // MASCULINE, FEMININE, NEUTER (for nouns only)
  plural       String?  // plural form for nouns
  createdAt    DateTime @default(now())
}

model GrammarTopic {
  id       Int    @id @default(autoincrement())
  unitId   Int
  unit     Unit   @relation(fields: [unitId], references: [id])
  title    String
  content  String // Markdown/HTML content
  order    Int
}

model Exercise {
  id         Int          @id @default(autoincrement())
  unitId     Int
  unit       Unit         @relation(fields: [unitId], references: [id])
  type       ExerciseType
  data       Json         // type-specific payload, see below
  order      Int
}

enum WordType {
  NOUN
  VERB
  ADJECTIVE
  OTHER
}

enum Gender {
  MASCULINE
  FEMININE
  NEUTER
}

enum ExerciseType {
  FILL_GAP
  MULTIPLE_CHOICE
  TRANSLATE
}
```

### Gamification Models

```prisma
model UserUnitProgress {
  id            Int      @id @default(autoincrement())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  unitId        Int
  unit          Unit     @relation(fields: [unitId], references: [id])
  vocabXp       Int      @default(0)
  grammarXp     Int      @default(0)
  exerciseXp    Int      @default(0)
  completed     Boolean  @default(false)
  updatedAt     DateTime @updatedAt

  @@unique([userId, unitId])
}

model UserStats {
  id          String   @id  // same as userId
  user        User     @relation(fields: [id], references: [id], onDelete: Cascade)
  totalXp     Int      @default(0)
  displayName String?  // leaderboard display name
  streak      Int      @default(0)
  lastActive  DateTime @default(now())
}
```

---

## App Routing Structure

```
/                          → Landing / home (unit grid overview)
/unit/[id]                 → Unit detail (pick vocabulary, grammar, exercises)
/unit/[id]/vocab           → Vocabulary flashcard trainer
/unit/[id]/grammar         → Grammar theory page
/unit/[id]/exercises       → Exercise session (fill-gap, translate, MC)
/leaderboard               → Global XP leaderboard
/profile                   → User profile & stats
/auth/login                → Login page
/auth/register             → Register page
/admin                     → Admin dashboard (protected)
/admin/users               → User list + ban controls
/admin/units               → Unit content management
/admin/units/[id]/words    → Word management per unit
/admin/units/[id]/exercises → Exercise management per unit
/admin/import              → AI-assisted vocabulary importer
```

---

## Feature Modules

### 1. Unit Grid (Home)
- 20 unit cards in a grid, each showing:
  - Unit number + title
  - Progress bar (total XP / max XP for that unit)
  - All units accessible from day one

### 2. Vocabulary Trainer (`/unit/[id]/vocab`)
- Flashcard flip UI: Slovak → German
- Modes: **Flashcard**, **Multiple Choice** (4 options), **Write the word**
- XP awarded per correct answer; bonus for streaks
- Words marked as *mastered* once answered correctly 3× in a row
- Session summary screen on completion

### 3. Grammar Theory (`/unit/[id]/grammar`)
- Rendered Markdown/HTML content from DB
- No grading — just reading + optional "Mark as read" for small XP reward

### 4. Exercises (`/unit/[id]/exercises`)
- Mixed session of fill-in-the-gap, multiple choice, and translation prompts
- Timer (optional, adds bonus XP for fast answers)
- Immediate feedback: correct/wrong highlight + show correct answer
- XP granted at end of session, not per question (prevents rage-refreshing)

#### Exercise Storage — How the `data` JSON field works

Instead of having fixed columns per exercise type (which can't cover all types cleanly), the `Exercise` model stores a `data Json` field whose shape is determined by the `type` enum. This is a **type-discriminated JSON** pattern.

**`FILL_GAP`**
```json
{
  "sentence": "Ich ___ jeden Tag Kaffee.",
  "answer": "trinke",
  "hint": "trinken"
}
```
The UI replaces `___` with an input field. The `hint` is the infinitive shown optionally.

**`MULTIPLE_CHOICE`**
```json
{
  "question": "Was bedeutet 'der Hund'?",
  "options": ["die Katze", "der Hund", "das Pferd", "der Vogel"],
  "answer": "der Hund"
}
```
The app renders 4 clickable buttons. `answer` must be one of `options`.

**`TRANSLATE`**
```json
{
  "prompt": "Preložte: 'Ja pijem každý deň kávu.'",
  "answer": "Ich trinke jeden Tag Kaffee.",
  "acceptableAnswers": ["Ich trinke täglich Kaffee."]
}
```
The UI compares the typed input against `answer` and any `acceptableAnswers` (normalized, case-insensitive, trimmed).

> [!NOTE]
> On the TypeScript side, define a union type for each `data` shape and use a type-guard or `switch (exercise.type)` to narrow it. This gives you full type safety when rendering each exercise component.

**JSON Import format (admin → DB)**
```json
[
  {
    "type": "FILL_GAP",
    "order": 1,
    "data": {
      "sentence": "Er ___ Deutsch.",
      "answer": "lernt",
      "hint": "lernen"
    }
  }
]
```

### 5. Gamification System
| Action | XP |
|---|---|
| Flashcard correct answer | +5 XP |
| Flashcard streak (5×) | +15 XP bonus |
| Exercise session complete | +30–60 XP (scaled by score) |
| Grammar topic read | +10 XP |
| All words mastered in unit | +100 XP bonus |
| Daily login | +20 XP |

- **Progress bar** per unit: fills as XP accumulates toward a unit cap
- **Global leaderboard**: ranked by `totalXp`, shows display name + avatar initial

### 6. Admin Dashboard
- User management: view all users, ban/unban, view XP, delete account
- Content management: CRUD for Units, Words, Grammar Topics, Exercises
- **Vocabulary Importer**: paste JSON from AI output → preview table + bulk insert
- **Exercise Importer**: paste JSON array of exercises → validate shape per type + insert
- Basic stats: total users, active users this week, most completed unit

---

### 7. AI Chatbot — Recommendation

You're considering an AI chatbot tuned to help students with German. Here's the tradeoff:

| Approach | Pros | Cons |
|---|---|---|
| **API-based (OpenAI / Gemini)** | No infrastructure, always up to date, very capable | Costs money per request, dependent on external service |
| **Self-hosted model (Ollama + Mistral etc.)** | Free to run, full control, data stays local | Needs a server, slower, harder to tune |

> [!TIP]
> **Recommendation: Use the Gemini API (or OpenAI).** For a school project this size, API costs will be negligible (a few cents per month). You get far better German language quality with GPT-4o or Gemini 1.5 Pro than with any self-hosted model you could realistically run.

**How to make it focused on your content (RAG-lite approach):**
You don't need to fine-tune the model. Instead, build a **system prompt** that:
1. Instructs it to act as a German tutor for Slovak-speaking students
2. Says which unit the student is currently on
3. Injects the current unit's vocabulary list into the context
4. Tells it to only discuss German language topics

This is cheap, simple, and gives the bot accurate context about your textbook content without any ML training.

**Where it fits in the app:**
- Floating chat button on all exercise/vocab pages
- The chatbot knows what unit you're on and can explain grammar rules, give examples, or quiz you conversationally
- Admin can toggle the feature on/off per unit

---

## Phased Delivery

| Phase | Scope |
|---|---|
| **1 — Foundation** | Auth (already done), DB schema, Unit grid home, basic routing |
| **2 — Vocabulary** | Word model + importer, flashcard trainer, XP system |
| **3 — Exercises** | Fill-gap + multiple choice + translate session |
| **4 — Grammar** | Grammar topic model + theory pages |
| **5 — Gamification UI** | Progress bars, leaderboard, UserStats |
| **6 — Admin** | User management, content CRUD, import tool |
| **7 — Polish** | Animations, mobile responsiveness, streaks, daily login bonus |

---

## Design & Frontend

### Overall Feel

The app should feel like a **premium study tool**, not a school assignment. Think Duolingo meets Notion — clean, confident, and slightly gamified. The audience is teenagers, so it has to feel modern and capable, not childish or corporate.

**Tone:** Focused but encouraging. Reward success visibly, soften failure gently.

---

### Inspiration & References

| Source | What to steal |
|---|---|
| [Duolingo](https://duolingo.com) | Progress bars, XP animations, session flow, streak UI |
| [Quizlet](https://quizlet.com) | Flashcard flip animation, clean card layout |
| [Linear.app](https://linear.app) | Dark mode done right, typography, spacing system |
| [Vercel Dashboard](https://vercel.com/dashboard) | Clean data tables, stat cards |
| [Dribbble — "language app"](https://dribbble.com/search/language-app) | Visual ideas, color use, card styles |

> [!TIP]
> Spend 20 minutes on Dribbble searching "flashcard app UI" and "learning dashboard dark mode" before writing a single line of CSS. Screenshot what you like. It's much easier to code toward a reference than to invent from scratch.

---

### Color Palette

Go with a **dark mode first** design. Students study at night, and dark mode reads better for focused sessions.

**Recommended palette:**

| Role | Color | Usage |
|---|---|---|
| Background | `#0f0f13` | Page background |
| Surface | `#1a1a24` | Cards, panels |
| Surface elevated | `#23232f` | Hover states, modals |
| Border | `#2e2e3d` | Subtle dividers |
| Primary | `#6c63ff` | Buttons, progress bars, active states |
| Primary glow | `#6c63ff33` | XP bar glow, success halos |
| Success | `#22c55e` | Correct answer feedback |
| Error | `#ef4444` | Wrong answer feedback |
| Text primary | `#f0f0f5` | Headings, important text |
| Text muted | `#8888a8` | Labels, hints, secondary info |
| XP gold | `#f59e0b` | XP badges, streak counter |

This avoids generic blue/green and gives a distinct identity. The purple primary is modern and not overused in edtech.

---

### Typography

Use **Inter** (from Google Fonts) — it's neutral, highly readable, and works perfectly for both UI labels and reading-heavy content like grammar explanations.

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

body {
  font-family: 'Inter', sans-serif;
}
```

**Type scale to follow:**

| Role | Size | Weight |
|---|---|---|
| Page title | 2rem | 700 |
| Section heading | 1.25rem | 600 |
| Card title | 1rem | 600 |
| Body text | 0.9375rem | 400 |
| Label / hint | 0.8125rem | 500 |
| Badge / tag | 0.75rem | 600 |

---

### Key Components & Their Design

**Unit Card (home grid)**
- Dark surface with subtle border
- Unit number as a large muted label in the corner
- Title + short description
- Progress bar at the bottom that fills with color as XP grows
- Hover: slight lift (`transform: translateY(-2px)`) + border brightens

**Flashcard**
- Large centered card that flips on click (CSS 3D transform)
- Front: Slovak word in large type
- Back: German word + gender/article highlighted in a color (der = blue, die = red, das = green — classic German learning convention)
- Swipe left/right on mobile for skip/know

**Exercise card**
- Full-width centered card, one question at a time
- For fill-gap: clean sentence with a styled `<input>` inline
- For multiple choice: 4 large tappable buttons in a 2×2 grid
- For translate: textarea with a submit button
- Feedback: card background pulses green/red for 800ms, then advances

**Progress bar (unit)**
- Thin (6–8px) bar, rounded ends
- Filled portion uses the primary purple with a subtle glow
- Animated fill on XP change (`transition: width 0.6s ease`)

**Leaderboard**
- Top 3 users get gold/silver/bronze treatment (icon + slightly larger row)
- Current user's row is always pinned/highlighted even if outside top 10
- Avatar is just a colored circle with the first letter of display name

---

### What to Be Wary Of

> [!WARNING]
> **Don't over-animate.** One or two animations per interaction is engaging. Five is chaos. Stick to: card flip, progress bar fill, correct/wrong pulse, XP pop-up. Everything else should be instant or a simple fade.

> [!WARNING]
> **Mobile first, but don't sacrifice desktop.** Students will use both phones and school laptops. Design cards and exercise layouts for mobile widths first, then make sure they look good at 1280px+ too. The unit grid should be 1 column on mobile, 2–3 on tablet, 4–5 on desktop.

> [!WARNING]
> **Don't let the admin UI bleed into the student UI.** Keep admin routes completely separately styled — a basic, functional table-heavy layout is fine for admin. Pour the design effort into the student-facing pages.

> [!CAUTION]
> **Accessibility matters.** Your users might have dyslexia or visual impairments. Use sufficient color contrast (WCAG AA minimum), never rely on color alone to convey correct/wrong (add an icon too), and ensure all interactive elements are keyboard-focusable. This is also just good practice.

> [!NOTE]
> **Avoid placeholder content during development.** Build with real unit titles and real words from day one, even if it's just Unit 1. It'll reveal real design problems (long German words breaking layouts, special characters like ä/ö/ü etc.) much earlier.

---

### CSS Architecture

Since you're using plain Svelte (no Tailwind), define a global CSS file (`src/app.css`) with:
- CSS custom properties (variables) for all colors, radii, and spacing
- Base reset + body defaults
- Reusable utility classes for common patterns (`.card`, `.badge`, `.btn-primary`)
- Component-specific styles stay scoped inside each `.svelte` file

This keeps things maintainable without a framework.

```css
/* src/app.css */
:root {
  --bg: #0f0f13;
  --surface: #1a1a24;
  --surface-elevated: #23232f;
  --border: #2e2e3d;
  --primary: #6c63ff;
  --success: #22c55e;
  --error: #ef4444;
  --text: #f0f0f5;
  --text-muted: #8888a8;
  --xp-gold: #f59e0b;
  --radius: 12px;
  --radius-sm: 8px;
}
```

