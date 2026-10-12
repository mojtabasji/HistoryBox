# AI Coding Agent Guidelines

## 1. Core Rules

1. Read and understand the existing project before making changes.
2. Follow the project's existing architecture, naming conventions, directory structure, libraries, patterns, and coding style.
3. Prefer modifying and reusing existing code over introducing new abstractions.
4. Do not create a new component, utility, hook, service, helper, middleware, model, or module until you have searched the project for an existing implementation that can be reused or extended.
5. Keep changes focused on the requested task. Do not perform unrelated refactoring.
6. Preserve backward compatibility unless the task explicitly requires a breaking change.
7. Do not silently change behavior, APIs, database schemas, authentication mechanisms, dependencies, environment variables, or infrastructure configuration.
8. If an important architectural decision is required, inspect the surrounding code and documentation first and choose the solution that best fits the existing project.
9. Never assume that a file, component, endpoint, dependency, configuration, or feature does not exist without checking.
10. Do not duplicate functionality simply because an existing implementation is not immediately obvious.

---

## 2. Understand Before Editing

Before implementing a feature or fixing a bug:

- Inspect the relevant directory structure.
- Read the files directly related to the requested change.
- Identify existing components, hooks, utilities, services, API clients, validation logic, state management, and shared types.
- Search for similar functionality elsewhere in the project.
- Inspect relevant tests.
- Inspect `DOCUMENT.md` and `API.md` when they exist.
- Check package/dependency configuration before adding a dependency.
- Check environment/configuration conventions before introducing new configuration.
- Understand the data flow before changing it.

For a non-trivial task, first establish:

- Where the feature belongs.
- Which existing modules should be reused.
- Which interfaces/contracts are affected.
- Which API endpoints are involved.
- Which security boundaries are involved.
- Which tests need to be added or updated.

---

## 3. Project Structure

Use one consistent, professional structure throughout the project.

### General principles

- Keep related functionality together.
- Separate concerns clearly.
- Avoid excessively deep directory nesting.
- Avoid placing unrelated functionality in generic folders.
- Keep shared code genuinely shared.
- Keep feature-specific code close to the feature when the project's architecture supports it.
- Do not introduce a new architectural pattern when an established pattern already exists.
- Do not mix multiple architectural styles without a documented reason.

### Naming

Use clear, descriptive, consistent names.

- Components/classes: project-established convention, commonly PascalCase.
- Functions/methods: project-established convention, commonly camelCase.
- Variables: descriptive names rather than abbreviations.
- Constants: follow the existing project convention.
- Files and directories: follow the existing project convention.
- Avoid names such as `data`, `temp`, `thing`, `helper`, or `utils` when a more precise name is possible.
- Avoid unnecessary abbreviations.

Do not rename existing files or symbols merely for personal preference.

---

## 4. Reuse Before Creating

Before creating anything new, search first.

### Components

Before creating a UI component:

1. Search for an existing component with the same or similar purpose.
2. Check shared/common component directories.
3. Check feature-specific components.
4. Check whether an existing component can be extended through props, composition, or configuration.
5. Only create a new component if reuse would make the code less clear or violate an established boundary.

The same rule applies to:

- Hooks
- Utilities
- API clients
- Services
- Validators
- Formatters
- Middleware
- Database helpers
- Types/interfaces
- Constants
- Configuration helpers

Do not create duplicates with slightly different names.

---

## 5. Clean Code

Write code that is easy to understand, test, maintain, and modify.

### General principles

- Follow Single Responsibility Principle.
- Prefer small, focused functions and modules.
- Keep functions cohesive.
- Avoid deeply nested control flow.
- Reduce duplication where practical.
- Prefer explicit code over clever code.
- Avoid premature abstraction.
- Avoid premature optimization.
- Use meaningful names.
- Keep business logic separate from presentation and infrastructure concerns.
- Keep side effects explicit.
- Minimize global state.
- Avoid hidden dependencies.
- Prefer composition over unnecessary inheritance.
- Keep modules loosely coupled.

### Complexity

If code becomes difficult to understand:

- Break large functions into focused functions.
- Extract reusable domain logic.
- Simplify conditional branches.
- Remove unnecessary nesting.
- Use early returns where they improve readability.
- Do not split code into meaningless one-line abstractions.

Do not refactor working code solely to demonstrate a design pattern.

---

## 6. Type Safety and Data Validation

- Use the strongest type system supported by the project.
- Avoid `any`, unsafe casts, or equivalent escape hatches unless there is a documented reason.
- Validate external input at trust boundaries.
- Never assume data received from an API, database, URL, form, file, or user is valid.
- Keep domain types consistent across application layers.
- Avoid duplicated definitions of the same data structure.
- Prefer shared types where appropriate.
- Handle nullable and optional values explicitly.
- Do not suppress compiler/type-checker errors without understanding the cause.

---

## 7. Security

Security must be considered part of implementation, not an afterthought.

### Input

Treat all external input as untrusted.

Validate and sanitize where appropriate:

- Request bodies
- Query parameters
- Path parameters
- Headers
- Cookies
- Form fields
- Uploaded files
- External API responses
- Webhook payloads
- Environment-provided values when their format matters

Use allowlists where practical.

### Authentication and Authorization

- Authentication verifies identity; authorization verifies permissions.
- Never rely solely on client-side authorization checks.
- Enforce authorization on the server for protected operations.
- Follow least privilege.
- Do not expose resources merely because an identifier is known.
- Prevent IDOR/BOLA-style access-control vulnerabilities.
- Do not log credentials, session tokens, access tokens, refresh tokens, or sensitive personal information.
- Use established project authentication mechanisms instead of implementing custom cryptography or authentication unnecessarily.

### Secrets

Never hard-code:

- Passwords
- API keys
- Access tokens
- Private keys
- Database credentials
- Signing secrets
- Encryption keys

Use the project's secure configuration mechanism.

Never commit secrets to source control.

If a secret is accidentally exposed, treat it as compromised and recommend rotation.

### Injection

Protect against:

- SQL injection
- NoSQL injection
- Command injection
- LDAP injection
- Template injection
- XSS
- SSRF
- Path traversal
- Header injection

Use parameterized queries, framework-provided escaping, safe APIs, and strict validation rather than manually constructing unsafe expressions.

Never concatenate untrusted input into shell commands, SQL queries, HTML, templates, or executable expressions.

### Web Security

When applicable, consider:

- CSRF
- CORS
- XSS
- CSP
- Secure cookies
- `HttpOnly`
- `SameSite`
- TLS
- Security headers
- Rate limiting
- Session expiration
- Brute-force protection

Do not weaken a security control merely to make development easier.

### File Uploads

For file uploads:

- Validate file type.
- Validate file size.
- Do not trust the filename or extension.
- Generate safe server-side filenames when appropriate.
- Prevent path traversal.
- Store uploads outside executable paths when possible.
- Restrict allowed formats.
- Consider malware scanning where appropriate.

### Dependencies

Before adding a dependency:

1. Check whether the functionality already exists in the project.
2. Check whether the runtime/framework already provides the capability.
3. Verify that the dependency is maintained and appropriate.
4. Use a compatible version.
5. Avoid unnecessary dependencies.
6. Do not introduce packages with overlapping functionality without a clear reason.

---

## 8. API Design

API behavior must be explicit, consistent, secure, and documented.

### Before changing or creating an endpoint

- Search for an existing endpoint with the same or similar purpose.
- Check routing conventions.
- Check authentication/authorization middleware.
- Check request/response schemas.
- Check error-handling conventions.
- Check API versioning conventions.
- Check validation conventions.
- Check existing API documentation.

### API documentation requirement

**Every API endpoint created or modified must be documented in `API.md`.**

Documentation should include, when applicable:

- HTTP method
- Path
- Purpose
- Authentication requirements
- Authorization requirements
- Path parameters
- Query parameters
- Request headers
- Request body
- Validation rules
- Successful response
- Error responses
- Status codes
- Pagination/filtering/sorting behavior
- Example request
- Example response
- Important side effects
- Rate limits or security requirements

Keep `API.md` synchronized with the actual implementation.

Do not leave API documentation outdated after changing an endpoint.

---

## 9. Project Documentation

**`DOCUMENT.md` is the primary project-level documentation file.**

Keep it updated when architecture, setup, behavior, or important development conventions change.

When applicable, `DOCUMENT.md` should describe:

- Project purpose
- Main features
- Technology stack
- Architecture
- Directory structure
- Major modules
- Data flow
- Authentication and authorization model
- Database architecture
- External services
- Environment configuration
- Local development setup
- Build and deployment process
- Important commands
- Testing strategy
- Background jobs/workers
- Caching
- Storage
- Important design decisions
- Known limitations
- Operational considerations

Do not document trivial implementation details that become obsolete quickly.

Documentation should describe the current system, not what the system was intended to become.

---

## 10. Environment and Configuration

- Never assume environment variables exist.
- Check existing `.env` conventions and configuration modules.
- Never commit secrets.
- Provide safe example configuration when needed.
- Keep environment-specific configuration separate from source code.
- Do not silently change default ports, URLs, credentials, or service configuration.
- Document newly required environment variables in `DOCUMENT.md` or the project's established configuration documentation.

---

## 11. Database and Data Integrity

When changing database-related code:

- Inspect the existing schema and migration system first.
- Use migrations rather than manually modifying production schemas.
- Preserve existing data unless deletion is explicitly required.
- Consider backward compatibility.
- Use transactions for operations that must be atomic.
- Validate foreign-key and relationship assumptions.
- Consider indexes for frequently queried fields.
- Avoid N+1 queries where applicable.
- Do not expose internal database structures directly when an API/domain contract should exist.

For destructive operations:

- Require explicit intent.
- Prefer soft deletion when the project requires recoverability.
- Never silently delete production data.

---

## 12. Error Handling

- Handle expected failures explicitly.
- Use the project's existing error-handling mechanism.
- Return consistent API error structures.
- Do not expose stack traces, internal paths, SQL statements, secrets, or infrastructure details to end users.
- Log sufficient information for debugging without logging sensitive data.
- Do not silently swallow exceptions.
- Do not use empty `catch` blocks unless there is a documented reason.
- Distinguish user/input errors from server/infrastructure errors where appropriate.

---

## 13. Logging and Observability

Logs should help diagnose problems without creating security or privacy risks.

- Use appropriate log levels.
- Include useful contextual information.
- Avoid logging secrets and sensitive personal information.
- Avoid excessive repetitive logging.
- Do not expose tokens, passwords, session identifiers, or authorization headers.
- Use structured logging when the project supports it.
- Preserve correlation/request IDs where the architecture supports them.

When adding a significant background process or external integration, consider appropriate:

- Metrics
- Logs
- Health checks
- Error reporting
- Tracing

---

## 14. Performance

Correctness and maintainability come before premature optimization.

When performance matters:

- Measure or identify the actual bottleneck.
- Avoid unnecessary network requests.
- Avoid unnecessary database queries.
- Avoid N+1 patterns.
- Avoid unnecessary rendering/recomputation.
- Use caching only where justified.
- Consider pagination for large collections.
- Avoid loading unnecessarily large datasets.
- Use asynchronous processing for appropriate long-running work.

Do not add caching or complex optimization without understanding invalidation and consistency requirements.

---

## 15. Frontend Principles

For frontend applications:

- Reuse existing UI components.
- Follow the established design system.
- Keep business logic out of presentational components when practical.
- Keep API communication in the established API/service layer.
- Handle loading, empty, success, and error states.
- Consider accessibility.
- Do not expose secrets in client-side code.
- Validate important security constraints on the server even when the client validates them.
- Avoid unnecessary state.
- Avoid unnecessary effects and re-renders.
- Preserve responsive behavior.
- Follow established routing and state-management conventions.

Do not introduce a new state-management, styling, form, or data-fetching library when the project already has an established solution unless there is a documented reason.

---

## 16. Backend Principles

For backend applications:

- Keep controllers/routes thin where the architecture supports service/domain layers.
- Keep business rules in appropriate domain/service modules.
- Validate requests at the boundary.
- Enforce authorization before protected operations.
- Use transactions where required.
- Keep database access organized and consistent.
- Avoid leaking internal implementation details through APIs.
- Return predictable status codes and response structures.
- Make background jobs idempotent when practical.
- Handle retries carefully to avoid duplicate side effects.

---

## 17. Testing

Every meaningful behavior change should have appropriate test coverage.

Before implementing tests:

- Inspect the existing testing framework and conventions.
- Reuse existing fixtures, factories, helpers, and utilities.
- Follow existing test naming and directory structure.

Tests should cover, where applicable:

- Normal behavior
- Boundary conditions
- Invalid input
- Authentication
- Authorization
- Error handling
- Security-sensitive behavior
- Regression cases

Do not modify tests merely to make failing tests pass unless the test itself is incorrect.

A test failure is evidence that should be investigated.

---

## 18. Changes and Refactoring

Keep each change scoped.

Do not combine an unrelated:

- Formatting overhaul
- Dependency upgrade
- Architecture migration
- Naming cleanup
- File restructuring
- Large refactor

with a feature or bug fix unless it is necessary.

When refactoring:

1. Understand the current behavior.
2. Preserve behavior unless change is intentional.
3. Make incremental changes.
4. Run relevant tests/checks after meaningful steps.
5. Remove dead code only when its removal is safe and relevant.

---

## 19. Dependency Changes

Before changing dependencies:

- Check `package.json`, lockfiles, requirements, manifests, or equivalent.
- Check whether the dependency is already installed.
- Check for an existing package providing the same functionality.
- Verify compatibility with the project's runtime/framework versions.
- Avoid unnecessary upgrades during unrelated work.
- Update the correct lockfile.
- Document important dependency changes when they affect architecture or operation.

Never blindly run a package upgrade to resolve an unrelated error.

---

## 20. Git and Source Control

- Make focused changes.
- Do not overwrite unrelated user changes.
- Inspect the working tree before modifying files when necessary.
- Never reset, revert, or delete user changes without explicit authorization.
- Do not commit generated secrets, credentials, local environment files, or sensitive artifacts.
- Avoid large formatting-only diffs.
- Use clear commit messages when commits are requested.

---

## 21. Backward Compatibility

Before changing a public interface, consider:

- Existing frontend consumers
- Mobile clients
- External integrations
- Background jobs
- Database records
- Cached data
- Existing API clients
- Deployment order

When a breaking change is unavoidable, document it clearly and update all known consumers.

---

## 22. Security and Privacy by Default

Assume the system will eventually be exposed to hostile input.

Default behavior should favor:

- Least privilege
- Deny-by-default authorization
- Secure defaults
- Minimal data exposure
- Minimal permissions
- Explicit validation
- Safe error messages
- Encrypted transport
- Secure secret storage
- Auditable security-sensitive operations

Do not weaken security controls simply because a local development environment does not require them.

---

## 23. AI Agent Behavior

The AI agent must:

1. Inspect before editing.
2. Search before creating.
3. Reuse before duplicating.
4. Follow the existing architecture before introducing a new one.
5. Preserve existing conventions.
6. Keep changes minimal and focused.
7. Validate external input.
8. Protect secrets and sensitive data.
9. Enforce authorization server-side.
10. Document API changes in `API.md`.
11. Keep project documentation current in `DOCUMENT.md`.
12. Add or update tests for meaningful behavior changes.
13. Run relevant validation after changes.
14. Never claim a change was tested if it was not actually tested.
15. Never claim an endpoint, component, dependency, or file exists without verifying it.
16. Never silently ignore errors that affect correctness or security.
17. Never overwrite unrelated work.
18. Never introduce duplicate abstractions without a clear justification.
19. Prefer simple, maintainable solutions over clever or unnecessarily complex solutions.
20. Ask for clarification when requirements materially conflict or a destructive/irreversible decision cannot safely be inferred.

---

## 24. Validation Before Completion

Before declaring a task complete, verify as much as the environment allows:

### Code

- Does the implementation follow the existing architecture?
- Is duplicated functionality avoided?
- Are names clear and consistent?
- Are types correct?
- Are error cases handled?
- Are security boundaries preserved?

### API

- Are all created or modified endpoints documented in `API.md`?
- Do request and response examples match the implementation?
- Are authentication and authorization requirements documented?

### Documentation

- Is `DOCUMENT.md` still accurate?
- Are newly required environment variables documented?
- Are important architectural changes documented?

### Tests

- Were relevant tests run?
- Were lint/type checks run when applicable?
- Were build checks run when applicable?
- If checks could not be run, state that fact rather than claiming success.

### Final review

Check the final diff for:

- Accidental changes
- Debug statements
- Hard-coded secrets
- Temporary code
- Dead imports
- Unused variables
- Incorrect error handling
- Missing documentation
- Missing tests
- Security regressions
- Unrelated modifications

---

## 25. Priority Order

When principles conflict, use this general priority:

1. Security and data integrity
2. Correctness and functional requirements
3. Existing project architecture and contracts
4. Backward compatibility
5. Maintainability and clean code
6. Testability
7. Performance
8. Developer convenience

If an existing project convention conflicts with a security requirement, security takes precedence.

If a requested implementation conflicts with an existing public contract, identify the conflict and preserve compatibility unless a breaking change is explicitly authorized.

---

## 26. Definition of Done

A task is complete only when:

- The requested behavior is implemented.
- Existing functionality has not been unnecessarily broken.
- Existing architecture and conventions are followed.
- Existing functionality was reused where appropriate.
- No unnecessary duplicate components or utilities were introduced.
- Security considerations have been addressed.
- Relevant validation and tests have been performed.
- API changes are documented in `API.md`.
- Relevant project changes are documented in `DOCUMENT.md`.
- No secrets or sensitive information were introduced into source control.
- The final implementation is understandable and maintainable.
- Any known limitations or unverified checks are explicitly stated.
