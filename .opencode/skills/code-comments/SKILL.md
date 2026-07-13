---
name: code-comments
description: Enforce a modern production-grade commenting style for JavaScript, TypeScript, React, Next.js, NestJS, Phaser and other web projects. Apply this skill whenever generating, editing or refactoring code.
---

# Modern Code Commenting Standard

## Goal

Write comments exactly as they appear in mature production codebases.

Comments should help future developers understand the reasoning behind the implementation.

Every comment must provide information that is not immediately obvious from reading the code.

---

# Primary Rule

Good code explains **what**.

Comments explain **why**.

Never explain syntax.

Never explain language features.

Never explain obvious code.

---

# Responsibilities

Whenever editing existing code, ALWAYS:

- review every existing comment
- rewrite outdated comments
- improve poorly written comments
- remove unnecessary comments
- remove duplicated comments
- add missing comments where complex logic exists

Do not preserve comments simply because they already exist.

Comments are part of the code and must be refactored together with it.

---

# Normalize Existing Comments

Replace inconsistent commenting styles with a single professional style.

Remove comments like:

```ts
// ==============================

// ------------------------------

// ###########

// 1.

// 2.

// Step 1

// Section

// REGION

// END REGION
```

Replace them with a normal sentence only if a comment is actually useful.

Example:

BAD

```ts
// ====================
// Physics
// ====================
```

GOOD

```ts
// Update the physics state before rendering.
```

If the separator adds no value, remove it completely.

---

# Comment Placement

Comments belong immediately before the code they describe.

Never place comments far away from the related logic.

---

# Functions

Every exported function, public method or complex private function should begin with a short description.

Example

```ts
/**
 * Rebuilds the spatial grid after objects move to keep collision checks efficient.
 */
```

Avoid documenting every parameter unless generating a reusable library API.

---

# Comment Logical Blocks

Inside functions, comments should separate logical operations, not every statement.

Example

```ts
// Skip inactive entities to avoid unnecessary collision checks.
for (...) {

}

// Resolve overlapping bodies before applying velocity.
...

// Notify listeners only after the final state is stable.
...
```

Functions longer than roughly 20–30 lines should usually contain comments describing major logical stages whenever those stages are not immediately obvious.

---

# Complex Logic

Always comment:

- algorithms
- mathematical formulas
- interpolation
- easing
- procedural generation
- AI
- physics
- rendering
- coordinate transformations
- collision resolution
- optimization
- caching
- memoization
- networking
- concurrency
- asynchronous flows
- recursion
- binary operations
- state machines
- browser workarounds
- security decisions
- business rules

Explain the reason behind the implementation.

---

# Performance

Always explain optimizations.

GOOD

```ts
// Reuse the existing vector to avoid creating thousands of temporary objects every frame.
```

---

# Edge Cases

Always explain unusual conditions.

GOOD

```ts
// Clamp the value because floating-point precision may occasionally produce numbers slightly above 1.
```

---

# Game Development

For Phaser or game projects explain:

- why constants exist
- why interpolation values were chosen
- why timers exist
- why delays exist
- why rendering order matters
- why collision offsets exist
- why physics values differ from real-world values

Never explain what a sprite or body is doing.

Explain why.

---

# React

Comment:

- memoization
- dependency arrays
- render optimizations
- unusual hooks
- hydration workarounds

---

# Next.js

Comment:

- server/client boundaries
- SSR
- ISR
- caching
- hydration decisions

---

# NestJS

Comment:

- transactions
- authorization
- guards
- interceptors
- decorators
- validation
- consistency guarantees

---

# Database

Comment:

- indexes
- migrations
- transactions
- locks
- constraints

---

# Formatting

Use only single-line comments.

Preferred style:

```ts
// Explain why this block exists.
```

Avoid decorative formatting.

Do NOT use:

```ts
// =====================

// ----------

// ##########
```

Do NOT number sections.

Do NOT write titles surrounded by separators.

Keep comments short.

Maximum three lines.

---

# Language

Use the language already used by the project.

Never mix languages.

---

# Tone

Professional.

Technical.

Concise.

No jokes.

No emojis.

No conversational language.

---

# Final Review Checklist

Before finishing code generation:

- Remove decorative separators.
- Remove numbered section comments.
- Remove redundant comments.
- Rewrite weak comments.
- Preserve only useful comments.
- Add comments before complex logical blocks inside functions.
- Add comments before algorithms and non-obvious decisions.
- Ensure every remaining comment explains WHY instead of WHAT.
- Ensure all comments follow one consistent style across the project.
- If a comment does not improve understanding, delete it.