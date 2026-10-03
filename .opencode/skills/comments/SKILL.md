---
name: comments
description: Enforce concise, meaningful and production-grade comments across software projects, source code, configuration and infrastructure files. Apply this skill whenever generating, editing, refactoring or reviewing code, YAML, Dockerfiles, Docker Compose, Kubernetes manifests, CI/CD pipelines, Terraform, configuration files, scripts and infrastructure definitions, especially when documenting non-obvious logic, business rules, constraints, workarounds, edge cases, security considerations, concurrency, networking, deployment behavior and performance-sensitive configuration.
---

# Project Comments

Write comments only when they provide meaningful information that cannot be clearly understood from the code or configuration itself.

Comments must explain **why a decision exists, what constraint it addresses, or what behavior must be preserved**.

Do not use comments as a replacement for readable code, clear naming or proper documentation.

## Core Principles

- Prefer self-explanatory code and configuration over comments.
- Explain **why**, not **what**.
- Never add comments that simply describe the next line or configuration property.
- Keep comments concise, precise and maintainable.
- Never invent context, requirements, historical reasons, issue numbers or external constraints.
- Preserve useful existing comments.
- Update comments when the implementation or configuration changes.
- Remove comments that are redundant, obsolete or misleading.
- Match the language, terminology and style already used in the project.
- Never document secrets, credentials, tokens or sensitive values.
- Prefer comments that explain a constraint or decision over comments that explain syntax.

## Supported File Types

Apply these rules to all relevant project files, including:

- TypeScript, JavaScript, Python, Go, Java, Kotlin, Rust, PHP, Ruby, C#, C, C++, Swift and similar source files.
- YAML and JSON configuration files.
- Dockerfiles.
- Docker Compose files.
- Kubernetes manifests.
- Helm templates and Helm values.
- CI/CD configuration.
- GitHub Actions.
- GitLab CI.
- Jenkins configuration.
- Terraform.
- Ansible.
- Shell scripts.
- Makefiles.
- Nginx and other server configuration.
- `.env.example` and environment configuration.
- Build and deployment configuration.

The exact comment syntax must always match the file format.

## When to Add Comments

Add comments when the code or configuration contains information that is important but not obvious from the implementation.

### Business Logic

Explain non-obvious business rules and domain-specific behavior.

```ts
// Suspended users can keep existing sessions,
// but cannot create new sessions.
if (user.status === 'active') {
  createSession(user);
}
```

### Non-Obvious Decisions

Explain why an unusual implementation or design decision is necessary.

```ts
// Use the cached configuration here because this method
// is called for every request.
const config = configCache.get(key);
```

Only make such claims when they can be established from the project context.

### Workarounds

Explain temporary or compatibility-related code when the reason is known.

```ts
// Keep the legacy response shape for clients using API v1.
return transformToLegacyResponse(data);
```

Do not describe code as a workaround if the reason is unknown.

### Edge Cases

Explain behavior that could otherwise appear incorrect or accidental.

```ts
// An empty array means the user has no permissions.
// `undefined` means permissions have not been loaded yet.
```

### Invariants

Document assumptions that must remain true for the code to work correctly.

```ts
// Items must remain sorted by priority because processing
// stops after the first matching item.
```

### Security

Document important security boundaries and assumptions.

```ts
// Check ownership before loading the resource to prevent
// exposing whether another user's resource exists.
```

Never include secrets, credentials, tokens or sensitive user data in comments.

### Concurrency

Explain locking, ordering, idempotency, retries or race-condition prevention when they are not obvious.

```ts
// This operation must be idempotent because the queue
// may deliver the same event more than once.
```

### Performance

Document meaningful performance considerations when they are supported by the implementation or project context.

```ts
// Use one batch query instead of querying inside the loop
// because this path can process thousands of records.
```

# Configuration and Infrastructure Comments

Comments in configuration and infrastructure files are especially important when a value is not self-explanatory.

Do not comment every configuration property.

Comment the **reason behind a configuration choice**, especially when changing the value could break deployment, networking, security, compatibility or runtime behavior.

## YAML

For YAML files, use comments to explain:

- non-obvious values;
- environment-specific behavior;
- compatibility constraints;
- deployment requirements;
- networking assumptions;
- resource limits;
- health-check behavior;
- ordering requirements;
- security settings;
- why a value differs from the default;
- why a seemingly unnecessary property must remain.

Good:

```yaml
services:
  api:
    # Keep this port internal. Public traffic is terminated
    # by the reverse proxy before reaching the application.
    expose:
      - "3000"
```

Good:

```yaml
resources:
  limits:
    # Keep the memory limit above the application's peak startup
    # usage to prevent Kubernetes from restarting the container.
    memory: 512Mi
```

Good:

```yaml
healthcheck:
  # The API may need several seconds to initialize migrations
  # before it can accept health-check requests.
  start_period: 30s
```

Bad:

```yaml
services:
  # API service
  api:
```

Bad:

```yaml
ports:
  # Port 3000
  - "3000:3000"
```

The configuration already makes these statements obvious.

## Dockerfile

Use comments to explain:

- why a specific base image is required;
- why a package is installed;
- why layers are ordered in a particular way;
- why a build stage exists;
- compatibility requirements;
- security decisions;
- architecture-specific behavior;
- caching considerations.

Good:

```dockerfile
# Copy dependency manifests first so dependency installation
# remains cached when application source files change.
COPY package.json package-lock.json ./
RUN npm ci
```

Good:

```dockerfile
# Run as a non-root user because the application does not
# require elevated privileges at runtime.
USER node
```

Avoid:

```dockerfile
# Install dependencies.
RUN npm ci
```

Avoid:

```dockerfile
# Copy application.
COPY . .
```

## Docker Compose

Use comments to explain:

- service dependencies that are not obvious;
- health-check requirements;
- networking decisions;
- persistent volume requirements;
- development-only behavior;
- environment-specific overrides;
- compatibility settings.

Good:

```yaml
services:
  api:
    depends_on:
      db:
        condition: service_healthy

    # The API performs database queries during startup,
    # so starting before PostgreSQL is healthy causes failures.
```

Do not comment obvious service names, ports or image declarations.

## Kubernetes

For Kubernetes manifests, comment non-obvious operational decisions such as:

- replica counts;
- resource requests and limits;
- probes;
- termination behavior;
- affinity and anti-affinity;
- tolerations;
- security contexts;
- network policies;
- ingress behavior;
- service exposure;
- rollout strategy;
- persistent storage requirements.

Good:

```yaml
spec:
  terminationGracePeriodSeconds: 60

  # Allow active requests to finish before the pod is terminated.
  # The application can take up to 60 seconds to drain connections.
```

Good:

```yaml
strategy:
  rollingUpdate:
    maxUnavailable: 0
    # Keep at least the current capacity available during deployment
    # because this service cannot tolerate reduced capacity.
```

Do not write comments that merely repeat Kubernetes terminology.

Bad:

```yaml
replicas: 3
# Number of replicas
```

## Helm

For Helm templates and values:

- Explain non-obvious defaults.
- Explain why a value is configurable.
- Explain compatibility requirements.
- Explain environment-specific behavior.
- Do not comment template syntax that is already obvious.

Good:

```yaml
# Keep this disabled by default because public ingress is only
# enabled in production environments.
ingress:
  enabled: false
```

## CI/CD

For GitHub Actions, GitLab CI and similar systems, comment:

- non-obvious ordering;
- cache decisions;
- deployment gates;
- permissions;
- environment restrictions;
- compatibility workarounds;
- security-sensitive configuration;
- why a job must run on a specific runner.

Good:

```yaml
# Run integration tests against the same Node.js version
# used by the production runtime.
strategy:
  matrix:
    node-version: [22]
```

Avoid:

```yaml
steps:
  # Install dependencies
  - run: npm ci
```

## Terraform

For Terraform, comments should explain:

- infrastructure decisions;
- security restrictions;
- unusual resource settings;
- dependency requirements;
- lifecycle behavior;
- compatibility constraints;
- environment-specific infrastructure choices.

Good:

```hcl
# Prevent accidental deletion because this bucket contains
# production state that cannot be recreated safely.
lifecycle {
  prevent_destroy = true
}
```

Do not comment obvious resource declarations.

Bad:

```hcl
# Create an S3 bucket.
resource "aws_s3_bucket" "app" {
}
```

## Environment Configuration

For `.env.example` and similar files:

- Explain non-obvious variables.
- Explain allowed values when necessary.
- Explain whether a value is required for a particular environment.
- Never include real secrets.
- Never document secret values.
- Never copy production credentials into examples.

Good:

```dotenv
# Public URL used by the frontend for OAuth callback generation.
APP_PUBLIC_URL=http://localhost:3000
```

Bad:

```dotenv
# Database URL
DATABASE_URL=
```

if the variable name already makes the meaning obvious.

## Shell Scripts and Makefiles

Use comments for:

- dangerous operations;
- required ordering;
- environment assumptions;
- non-obvious flags;
- compatibility behavior;
- cleanup requirements.

Good:

```bash
# Remove generated files before rebuilding because stale artifacts
# can otherwise be included in the deployment package.
rm -rf dist
```

Do not comment every shell command.

# When NOT to Add Comments

Do not add comments for obvious code or configuration.

Bad:

```ts
// Increment counter.
counter++;
```

Bad:

```ts
// Return user.
return user;
```

Bad:

```ts
// Iterate over users.
for (const user of users) {
  // ...
}
```

Bad:

```yaml
# API service
api:
```

Bad:

```yaml
# Port 3000
ports:
  - "3000:3000"
```

Bad:

```dockerfile
# Install dependencies
RUN npm ci
```

Bad:

```yaml
# Three replicas
replicas: 3
```

Do not add comments merely to increase documentation or comment coverage.

## Explain Why, Not What

Prefer:

```yaml
# Keep the transaction timeout below the load balancer timeout
# so failed requests do not remain open after the client disconnects.
timeout: 25s
```

Avoid:

```yaml
# Set timeout to 25 seconds.
timeout: 25s
```

Prefer:

```dockerfile
# Copy manifests first so Docker can reuse the dependency layer
# when only application source files change.
COPY package.json package-lock.json ./
```

Avoid:

```dockerfile
# Copy package files.
COPY package.json package-lock.json ./
```

Prefer:

```yaml
# Do not expose PostgreSQL publicly. The API accesses it
# through the internal Docker network.
expose:
  - "5432"
```

Avoid:

```yaml
# Expose PostgreSQL.
expose:
  - "5432"
```

## Configuration Defaults

Do not comment every default value.

Add a comment when the configured value intentionally differs from:

- the framework default;
- the tool default;
- the platform default;
- the commonly expected value.

Explain why the project uses the custom value.

## Environment-Specific Configuration

When configuration differs between environments, comments may explain the reason.

Good:

```yaml
# Production uses the external Redis cluster.
# Local development uses the containerized Redis service.
redis:
  host: ${REDIS_HOST}
```

Do not duplicate comments across every environment file when the same explanation can be documented once.

## Existing Comments

Before adding a new comment, inspect nearby comments.

For existing comments:

- Keep accurate and useful comments.
- Rewrite unclear comments.
- Update comments that no longer match the implementation.
- Remove redundant comments.
- Remove comments that describe deleted or changed behavior.
- Never preserve an incorrect comment just because it already exists.

Do not perform broad comment cleanup unrelated to the requested task.

## TODO Comments

Use `TODO` only when there is a concrete unfinished task.

Bad:

```ts
// TODO: Improve this later.
```

Good:

```ts
// TODO: Remove the compatibility branch when API v2 becomes mandatory.
```

The same rule applies to infrastructure and configuration:

```yaml
# TODO: Remove the legacy ingress configuration after all clients
# migrate to the new endpoint.
```

Do not invent issue numbers or ticket references.

If the project already uses issue references, follow the existing convention.

## Accuracy

Never make unsupported claims in comments.

Do not write:

```ts
// Required by production.
```

```ts
// Fixes issue #123.
```

```ts
// This is faster.
```

```ts
// Required by the external API.
```

```ts
// Prevents a race condition.
```

unless the repository or relevant project documentation provides evidence.

The same applies to infrastructure:

Do not write:

```yaml
# Required by Kubernetes.
```

```yaml
# Needed for production.
```

```yaml
# This improves performance.
```

```yaml
# Required by AWS.
```

unless this is actually supported by the project context or relevant documentation.

When the reason is uncertain, prefer no comment over a speculative comment.

## Language and Style

Follow the language used by the surrounding file.

If the file uses English comments, use English.

If the project consistently uses another language, follow that convention.

Do not introduce a different comment language without a clear reason.

Follow existing conventions for:

- punctuation;
- capitalization;
- terminology;
- JSDoc;
- TODO/FIXME markers;
- documentation comments;
- inline comments;
- YAML comments;
- Dockerfile comments;
- infrastructure comments.

## Scope

When generating or editing code or configuration:

- Add comments only where they provide real value.
- Do not refactor code solely to add comments.
- Do not change behavior to make commenting easier.
- Do not reformat unrelated code.
- Do not add comments to every function, class, resource or configuration property automatically.

When reviewing a project:

- Identify misleading comments.
- Identify comments that explain obvious behavior.
- Identify important non-obvious behavior that lacks documentation.
- Fix only comments that are relevant to the requested scope.

## Comment Quality Check

Before adding a comment, verify:

1. Is the behavior or configuration non-obvious?
2. Does the code or configuration already communicate this information?
3. Does the comment explain why, rather than what?
4. Is the explanation supported by repository evidence?
5. Will the comment remain useful if the implementation changes slightly?
6. Is the comment concise?
7. Does it match the project's existing style?
8. Does it avoid duplicating documentation that belongs elsewhere?
9. Does it avoid exposing sensitive information?

If the answer is no, do not add the comment.

## Final Verification

After modifying comments:

- Review the diff.
- Ensure no application behavior changed unintentionally.
- Ensure no infrastructure behavior changed unintentionally.
- Ensure comments describe the current implementation or configuration.
- Remove redundant comments.
- Check spelling and grammar.
- Verify consistency with surrounding comments.
- Verify YAML and configuration syntax remains valid.
- Do not modify unrelated files.