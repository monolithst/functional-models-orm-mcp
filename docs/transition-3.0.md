# Transition to Functional-Models 3.0

## Specification

### 1. Configuration Interface

- Accept a configuration object with:
  - `baseUrl` mapping: `{ default: string, [namespace: string]: string, [namespace/model: string]: string }`
  - Credentials/auth:
    - Either a static object (e.g., `{ apiKey, oauthToken }`)
    - Or a function returning headers (to support dynamic tokens)
    - Allow per-namespace/model overrides if needed
  - Optional: mock mode flag and mock handler
  - Optional: before/after hooks for request/response mutation

### 2. URL and Method Resolution

- For each operation (CRUDS, bulkInsert, bulkDelete):
  - Use the model's `getApiInfo().rest[ApiMethod]` to get the endpoint and HTTP method
  - Prepend the correct `baseUrl` (resolved by namespace/model, with fallback to default)
  - For `bulkDelete`, use `DELETE` to the collection endpoint (no `:id`), with a JSON array of IDs as the payload

### 3. Credential/Authentication Handling

- For each request, inject credentials/auth headers as determined by the config (static or dynamic)
- Support both API key and OAuth2 (bearer token) patterns

### 4. CRUDS and Bulk Operations

- Implement all standard CRUDS operations:
  - `create` (single and bulk)
  - `retrieve`
  - `update`
  - `delete`
  - `search`
- Implement `bulkDelete` as described
- For `bulkInsert`, use the create endpoint with an array payload

### 5. Hooks

- Before each request, call an optional `beforeRequest` hook with the raw request object (can mutate)
- After each response, call an optional `afterResponse` hook with the raw response object (can mutate)

### 6. Mock Mode

- If mock mode is enabled, intercept requests and route to a user-provided mock handler instead of making HTTP calls

### 7. Type Safety

- All operations should be fully generic and type-safe, inferring types from the model

---

## Implementation Checklist

1. Define the new configuration interface for the provider, including `baseUrl` mapping, credentials/auth, hooks, and mock mode.
2. Refactor the provider to remove the old `urlBuilder` and `httpMethodGetter` abstractions.
3. Implement logic to resolve the correct `baseUrl` for a given model/namespace/operation.
4. For each operation, extract the endpoint and HTTP method from the model's `getApiInfo().rest[ApiMethod]`.
5. Implement credential/auth header injection, supporting both static and dynamic (function-based) approaches.
6. Implement all CRUDS operations, using the resolved endpoint/method and injecting credentials as needed.
7. Implement `bulkInsert` using the create endpoint with an array payload.
8. Implement `bulkDelete` as a `DELETE` to the collection endpoint with a JSON array of IDs.
9. Add before/after hooks, calling them at the appropriate points in the request/response lifecycle.
10. Implement mock mode, allowing requests to be intercepted and handled by a user-provided mock handler.
11. Ensure all operations are fully type-safe and generic, matching the model's types.
12. Write or update tests to cover all new behaviors, including custom base URLs, credentials, hooks, and mock mode.
13. Update documentation to reflect the new configuration and usage patterns.
