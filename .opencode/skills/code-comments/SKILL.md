---
name: code-comments
description: Always write production-quality code comments following modern web development industry standards. Use this skill whenever creating, editing, or refactoring source code in JavaScript, TypeScript, React, Next.js, Node.js, NestJS, Phaser, HTML, CSS, or similar projects.
---

# Production Code Commenting Standard

## Goal

Produce code that is understandable months later by another experienced developer.

Comments must explain **WHY**, not **WHAT**.

Assume the reader already understands the programming language.

Never generate unnecessary comments.

---

# Golden Rule

Good code explains **what**.

Comments explain **why**.

Example:

GOOD

```ts
// Cache avatar URLs to avoid hundreds of identical CDN requests.
const avatarCache = new Map();
```

BAD

```ts
// Create cache
const avatarCache = new Map();
```

---

# NEVER comment obvious code

Never write comments like:

```ts
// Increment counter
counter++;

// Return user
return user;

// Loop through array
items.forEach(...)
```

These comments lower code quality.

---

# ALWAYS comment

Write comments before:

- complex algorithms
- non-obvious math
- game mechanics
- physics calculations
- coordinate transformations
- optimization tricks
- browser hacks
- WebGL tricks
- Phaser rendering logic
- collision systems
- networking
- concurrency
- caching
- memoization
- custom serialization
- binary operations
- bit masks
- recursion
- state machines
- procedural generation
- AI logic
- interpolation
- easing
- pathfinding
- unusual edge cases
- security checks

---

# Function comments

Every public function should start with a short explanation.

Example

```ts
/**
 * Smoothly interpolates camera movement to avoid visible jitter.
 */
```

If parameters are obvious, do NOT describe every parameter.

Instead explain the behavior.

GOOD

```ts
/**
 * Rebuilds the spatial grid after objects move.
 * This keeps collision checks O(n) instead of O(n²).
 */
```

BAD

```ts
/**
 * @param x
 * @param y
 * @param width
 * @param height
 */
```

Only use full JSDoc when generating a reusable public API or library.

---

# Inline comments

Use inline comments sparingly.

Example

```ts
// Keep one frame of overlap.
// Without this the player can occasionally tunnel through thin walls.
```

---

# Block comments

Use block comments to divide logical sections.

Example

```ts
// --------------------------------
// Physics update
// --------------------------------
```

or

```ts
// Update soft-body constraints.
```

---

# Business logic

Always explain business rules.

Example

```ts
// Premium users may exceed the normal upload limit.
```

---

# Performance

Always explain optimizations.

Example

```ts
// Reuse vectors to avoid unnecessary allocations every frame.
```

---

# Game development

For Phaser or games always explain:

- why an interpolation value exists
- why a physics constant was chosen
- why a timer exists
- why a collision offset exists
- why rendering order matters

GOOD

```ts
// Render the shadow first so the cube appears grounded.
```

GOOD

```ts
// Apply a small bounce to make impacts feel less robotic.
```

---

# React

Comment:

- unusual hooks
- memoization
- dependency arrays
- render optimizations

GOOD

```ts
// Memoized because this component re-renders hundreds of times per second.
```

---

# Next.js

Explain:

- server/client boundaries
- caching
- ISR
- SSR
- hydration decisions

---

# NestJS

Comment:

- transactions
- guards
- interceptors
- decorators
- authorization
- database consistency

Example

```ts
// Execute balance updates inside one transaction
// to prevent partially applied transfers.
```

---

# Database

Explain:

- indexes
- constraints
- migrations
- locks
- transactions

---

# Formatting

Keep comments:

- short
- precise
- professional
- grammatically correct

Maximum:

2–3 lines.

---

# Language

Write comments in the same language as the project.

If the project already contains English comments,
continue in English.

If comments are Russian,
continue in Russian.

Never mix languages.

---

# Tone

Professional.

No jokes.

No emojis.

No conversational language.

---

# Refactoring

When editing existing code:

- preserve useful comments
- improve outdated comments
- delete redundant comments
- delete comments that only repeat the code

---

# Final Review

Before finishing any code generation:

1. Remove obvious comments.
2. Add comments explaining complex logic.
3. Ensure every remaining comment explains WHY.
4. Ensure comments are concise.
5. Ensure comments follow production-level standards.
6. Never exceed the amount of comments typically found in mature open-source projects.

If uncertain whether a comment is necessary, remove it.