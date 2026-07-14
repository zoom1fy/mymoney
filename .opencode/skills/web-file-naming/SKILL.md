---
name: web-file-naming
description: Enforce consistent production-grade file naming conventions for TypeScript web projects including NestJS, Next.js, React and Node.js. Apply this skill whenever creating, renaming or refactoring files and directories.
---

# Production File Naming Standard

## Goal

Every filename should immediately communicate its responsibility.

A developer should understand what a file contains before opening it.

File names must be predictable across the entire project.

---

# General Rules

Always use

- lowercase
- kebab-case
- descriptive names

Never use

- PascalCase
- camelCase
- snake_case
- spaces
- numbered filenames
- temporary names

GOOD

```
user-profile.service.ts
```

BAD

```
UserProfile.ts
User_Profile.ts
userProfile.ts
temp.ts
new.ts
file.ts
```

---

# Responsibility First

File names describe what they contain.

Avoid names like

```
utils.ts
helpers.ts
common.ts
shared.ts
manager.ts
processor.ts
handler.ts
base.ts
misc.ts
index2.ts
```

Instead use

```
password.utils.ts
currency.utils.ts
date.utils.ts
jwt.utils.ts
avatar.service.ts
```

---

# NestJS

## Modules

```
users.module.ts
```

## Controllers

```
users.controller.ts
```

## Services

```
users.service.ts
```

## DTOs

Use action-based names.

GOOD

```
create-user.dto.ts
update-user.dto.ts
login.dto.ts
refresh-token.dto.ts
pagination.dto.ts
```

BAD

```
user.dto.ts
request.dto.ts
dto.ts
```

---

## Entities

```
user.entity.ts
```

---

## Repositories

```
user.repository.ts
```

---

## Guards

```
jwt.guard.ts
roles.guard.ts
permissions.guard.ts
```

---

## Pipes

```
validation.pipe.ts
parse-id.pipe.ts
```

---

## Interceptors

```
logging.interceptor.ts
cache.interceptor.ts
```

---

## Middleware

```
logger.middleware.ts
```

---

## Filters

```
http-exception.filter.ts
```

---

## Decorators

```
public.decorator.ts
roles.decorator.ts
```

---

## Strategies

```
jwt.strategy.ts
local.strategy.ts
```

---

## Validators

```
password.validator.ts
```

---

## Factories

```
user.factory.ts
```

---

## Mappers

```
user.mapper.ts
```

---

## Interfaces

```
jwt-payload.interface.ts
```

---

## Types

```
request-user.type.ts
```

---

## Enums

```
user-role.enum.ts
payment-status.enum.ts
```

---

## Constants

```
jwt.constants.ts
```

---

# Next.js

## Route Files

Never rename framework files.

Always keep

```
page.tsx
layout.tsx
loading.tsx
error.tsx
template.tsx
route.ts
default.tsx
not-found.tsx
global-error.tsx
middleware.ts
instrumentation.ts
```

These names are required by Next.js.

---

## Components

Use descriptive kebab-case filenames.

GOOD

```
user-card.tsx
profile-header.tsx
dashboard-sidebar.tsx
payment-form.tsx
```

Avoid

```
Card.tsx
Component.tsx
Test.tsx
New.tsx
```

---

## Hooks

Always

```
use-auth.ts
use-user.ts
use-pagination.ts
use-theme.ts
```

---

## Context

```
auth-context.tsx
theme-context.tsx
```

---

## Providers

```
theme-provider.tsx
query-provider.tsx
```

---

## API

```
route.ts
```

inside

```
app/api/users/
```

Never invent names like

```
users-api.ts
```

---

## Server Actions

Describe the action.

```
create-user.ts
delete-user.ts
update-profile.ts
```

---

# React

Components should represent the UI they render.

GOOD

```
login-form.tsx
navigation-menu.tsx
transaction-table.tsx
settings-dialog.tsx
```

Avoid

```
component.tsx
modal.tsx
button.tsx
item.tsx
```

unless the directory already defines the context.

---

# Utilities

Utility files should describe their domain.

GOOD

```
jwt.utils.ts
password.utils.ts
date.utils.ts
string.utils.ts
```

Avoid

```
utils.ts
helpers.ts
functions.ts
```

---

# Configuration

```
database.config.ts
jwt.config.ts
cache.config.ts
mail.config.ts
```

Avoid

```
config.ts
```

---

# Tests

Mirror production filenames.

GOOD

```
user.service.spec.ts
user-card.test.tsx
login-form.test.tsx
```

---

# Directories

Directory names should describe business domains.

GOOD

```
users/
payments/
analytics/
notifications/
dashboard/
settings/
```

Avoid

```
common/
misc/
temp/
new/
files/
stuff/
```

---

# Acronyms

Treat acronyms as normal words.

GOOD

```
jwt.service.ts
api-client.ts
http.interceptor.ts
```

BAD

```
JWT.service.ts
APIClient.ts
HTTP.ts
```

---

# File Length

Avoid splitting files only because they become moderately large.

Create new files only when they introduce a new responsibility.

---

# Final Review

Before creating or renaming any file:

- Use lowercase.
- Use kebab-case.
- Choose descriptive names.
- Avoid generic names.
- Include the proper suffix where applicable.
- Follow framework conventions.
- Preserve required framework filenames.
- Prefer consistency over creativity.
- If a filename could refer to multiple responsibilities, rename it to be more specific.