---
name: typescript-naming
description: Enforce consistent production-grade naming conventions for TypeScript projects including NestJS, Next.js, React and Node.js. Apply this skill whenever generating, editing or refactoring code.
---

# Production Naming Standard

## Goal

Every identifier should clearly communicate its purpose.

A developer should understand what a variable, function, class or type represents without reading its implementation.

Prefer clarity over brevity.

---

# General Rules

Names must be

- descriptive
- specific
- readable
- consistent

Avoid

- abbreviations
- single-letter names
- meaningless words
- generic names

GOOD

```ts
userProfile
totalPrice
isAuthenticated
refreshAccessToken
```

BAD

```ts
data
obj
tmp
res
value
item
test
foo
bar
baz
```

---

# Variable Naming

Variables describe data.

Use camelCase.

GOOD

```ts
currentUser
activeOrders
accessToken
paymentStatus
```

BAD

```ts
CurrentUser
current_user
CURRENT_USER
```

---

# Boolean Variables

Boolean names must answer a question.

Prefer prefixes

- is
- has
- can
- should
- was
- will

GOOD

```ts
isAdmin
hasPermission
canDelete
shouldRetry
isLoading
```

BAD

```ts
admin
permission
loadingFlag
state
```

---

# Arrays

Use plural nouns.

GOOD

```ts
users
transactions
messages
products
```

BAD

```ts
userList
transactionArray
itemsArray
```

---

# Objects

Use singular nouns.

GOOD

```ts
user
transaction
invoice
session
```

---

# Functions

Functions perform actions.

Always begin with a verb.

GOOD

```ts
createUser()
updateProfile()
calculateTax()
loadTransactions()
validateToken()
```

BAD

```ts
user()
profile()
tax()
data()
```

---

# Function Naming

Choose the verb that best describes the behavior.

Creation

```
create
build
generate
```

Retrieval

```
get
find
fetch
load
read
```

Modification

```
update
change
replace
set
```

Deletion

```
delete
remove
clear
destroy
```

Validation

```
validate
verify
check
```

Conversion

```
parse
serialize
deserialize
map
transform
convert
```

Calculation

```
calculate
compute
estimate
```

Initialization

```
initialize
bootstrap
configure
setup
```

---

# Async Functions

Prefer names describing the action.

Do not suffix with

```
Async
```

GOOD

```ts
fetchUsers()
loadProfile()
refreshToken()
```

BAD

```ts
fetchUsersAsync()
```

---

# Event Handlers

Use

```
handle
```

GOOD

```ts
handleSubmit()
handleClick()
handleLogin()
handleResize()
```

---

# React Callbacks

Use

```
on
```

for props.

GOOD

```tsx
onClick
onSubmit
onClose
```

Use

```
handle
```

inside components.

GOOD

```tsx
handleClick()
```

---

# Classes

Use PascalCase.

Classes represent nouns.

GOOD

```ts
UserService
AuthGuard
PaymentProcessor
```

Never prefix with

```
C
```

Never suffix with

```
Class
```

---

# Interfaces

Use PascalCase.

Do NOT prefix with

```
I
```

GOOD

```ts
User
JwtPayload
ApiResponse
```

BAD

```ts
IUser
IResponse
```

---

# Types

Use PascalCase.

GOOD

```ts
UserRole
RequestContext
```

---

# Enums

Use singular PascalCase.

GOOD

```ts
UserRole
PaymentStatus
Theme
```

Members

```ts
enum UserRole {
    Admin,
    User,
    Guest
}
```

---

# Generic Types

Use descriptive generic names.

GOOD

```ts
TUser
TData
TResponse
```

Avoid

```ts
T
U
V
```

unless extremely local.

---

# Constants

Use UPPER_SNAKE_CASE only for true compile-time constants.

GOOD

```ts
MAX_RETRY_COUNT
DEFAULT_TIMEOUT
API_VERSION
```

Configuration objects should remain camelCase.

GOOD

```ts
jwtConfig
cacheOptions
```

---

# Private Variables

Do not prefix with

```
_
```

or

```
m_
```

Use normal camelCase.

---

# DTOs

Use action-based names.

GOOD

```ts
CreateUserDto
UpdateUserDto
LoginDto
RefreshTokenDto
```

Avoid

```ts
UserDto
RequestDto
```

---

# Services

Name after the responsibility.

GOOD

```ts
UserService
NotificationService
```

Avoid

```ts
MainService
BaseService
CommonService
```

---

# Controllers

GOOD

```ts
UsersController
PaymentsController
```

---

# Repositories

GOOD

```ts
UserRepository
TransactionRepository
```

---

# Guards

GOOD

```ts
JwtGuard
RolesGuard
```

---

# Interceptors

GOOD

```ts
LoggingInterceptor
```

---

# Decorators

GOOD

```ts
Public
Roles
CurrentUser
```

---

# Hooks

Always start with

```
use
```

GOOD

```ts
useAuth()
useTheme()
usePagination()
```

---

# Contexts

GOOD

```ts
AuthContext
ThemeContext
```

---

# Providers

GOOD

```ts
ThemeProvider
QueryProvider
```

---

# Components

Use PascalCase.

Component names should describe the UI.

GOOD

```tsx
UserCard
ProfileHeader
TransactionTable
LoginForm
```

Avoid

```tsx
Card
Item
Box
Component
Widget
```

unless they are intentionally generic UI primitives.

---

# Acronyms

Treat acronyms as words.

GOOD

```ts
JwtService
ApiClient
HttpException
```

BAD

```ts
JWTService
APIClient
HTTPException
```

---

# Temporary Variables

Avoid

```ts
tmp
obj
val
res
ret
```

Instead use meaningful names.

GOOD

```ts
cachedUser
parsedToken
validationResult
```

---

# Loop Variables

Prefer descriptive names.

GOOD

```ts
for (const user of users)
```

Avoid

```ts
for (const u of users)
```

Single-letter variables are acceptable only for

- mathematical formulas
- very small callbacks

Example

```ts
numbers.map(n => n * 2)
```

---

# Final Review

Before finishing any code:

- Replace vague names with descriptive ones.
- Remove unnecessary abbreviations.
- Ensure every function begins with a verb.
- Ensure every boolean reads naturally.
- Ensure arrays use plural names.
- Ensure objects use singular names.
- Ensure classes, interfaces, enums and types use PascalCase.
- Ensure variables and functions use camelCase.
- Ensure constants use UPPER_SNAKE_CASE only when truly constant.
- Keep naming consistent across the project.
- If two identifiers are difficult to distinguish, rename them to be more explicit.