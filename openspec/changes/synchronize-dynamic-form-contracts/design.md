## Context

See `proposal.md` for motivation. Today the FastAPI schema exposes `field_type` as `string`, `options` as an unconstrained value, `validation_rules` as an open dictionary, and form values as a dynamic key/value map. The frontend repeats the known field types and rule names in handwritten TypeScript and validation code. This makes both sides compile independently even when they no longer agree.

Templates remain dynamic data: their field keys and ordering cannot become static TypeScript properties. The contract can, however, describe the finite grammar used to build those templates. The persisted `form_fields` representation may remain generic JSON/JSONB, provided values are parsed and validated at the application boundary. A form instance must expose the definition version with which it was created.

The implementation crosses the frontend repository and the sibling backend repository. Backend work must follow that repository's own planning and contribution rules before code is changed there.

## Goals / Non-Goals

**Goals:**

- Make invalid combinations of field type, options and rules visible in the OpenAPI contract and reject them at runtime.
- Derive the frontend's external API types reproducibly from a versioned OpenAPI snapshot.
- Keep a small domain adapter between generated transport types and rendering or validation code.
- Apply equivalent rule semantics in the UI and backend, with the backend remaining authoritative.
- Preserve the rules associated with existing form instances across later template revisions.

**Non-Goals:**

- Generate a distinct React component or static TypeScript object type for every template.
- Replace the dynamic `values` map with compile-time field keys.
- Move business validation exclusively to the browser.
- Redesign the database representation unless the existing version linkage proves insufficient during implementation.
- Implement a general-purpose JSON Schema form engine or allow arbitrary executable validation expressions in templates.

## Decisions

### 1. Model the field grammar as a discriminated Pydantic union

The backend will define one schema variant per supported `field_type`, using a literal discriminator. Each variant will pair the field with only its compatible options and validation rules. Shared metadata such as `field_key`, label, help text, required flag and order remains in a common base.

Pydantic will validate persisted definitions when they enter application logic and publish the union as `oneOf` with an OpenAPI discriminator. Unknown rule properties will be forbidden so spelling errors and unsupported rules do not disappear silently.

This is preferred over retaining `string` plus `dict`, because the latter cannot describe valid combinations to either OpenAPI or TypeScript. A single enum with a universal rule object was also rejected because it would still allow rules that make no sense for a given field type.

### 2. Separate contract shape from dynamic field values

The field definition is statically discriminated, while submitted values remain a map keyed by `field_key`. A backend validator will build an index of the instance's fields, reject unexpected keys according to the chosen endpoint policy, and validate each present value using the matching variant.

Draft saves validate the type and restrictions of values that are present but do not require completeness. Final submission additionally checks required fields. Presence checks use explicit missing/null semantics, so valid falsy values such as `false` and `0` are not treated as absent.

Trying to encode arbitrary template keys in a generated TypeScript type was rejected because templates are runtime data and can be created after the frontend build.

### 3. Keep rule semantics explicit and centralized

The initial variants will cover the field types already supported by the interface: `text`, `textarea`, `integer`, `float`, `boolean`, `select`, `date` and `file_upload`. Their schemas will expose only the rule vocabulary actually implemented, including length, numeric interval, selection options and file extension or size restrictions where applicable.

The backend will own the authoritative validator. The frontend will use a registry keyed by the discriminant to render controls, convert raw input and perform immediate checks from the same returned definition. Domain validation results will use stable rule codes instead of comparing human-readable messages.

Duplicating the small validation execution logic across client and server is accepted because the environments differ; duplicating the contract vocabulary is not. Sharing executable validation code across Python and TypeScript or introducing a full JSON Schema evaluator was rejected as disproportionate to the current grammar.

### 4. Generate transport types from a versioned OpenAPI snapshot

The frontend will store a deterministic snapshot containing the relevant API contract and generate a TypeScript file under `types/` with `openapi-typescript`. Package scripts will regenerate the file and verify that a clean regeneration produces no diff. CI will run that check.

Application code will not import arbitrary generated shapes throughout the component tree. A typed adapter will convert the transport response into domain types, preserve the `field_type` discriminant and explicitly handle an unknown future variant at the trust boundary.

Generating types directly from the deployed API in every build was rejected because it makes builds depend on network availability and may compile the frontend against a server version that has not been deployed with it. Handwritten API types were rejected because they preserve the current drift risk.

### 5. Return a stable, aggregate validation error contract

Backend validation failures will return an array of errors with `field_key` when applicable, a stable rule code and a safe display message. Global form errors will omit the field key or use an explicit global location. Validation will collect all detectable violations in the request rather than stopping at the first field.

The frontend will translate this response into field error state and a separate global summary while preserving all entered values. Parsing arbitrary message strings was rejected because wording changes would break field association.

### 6. Bind validation to the form instance's definition version

Loading, saving and submitting will resolve rules from the version or immutable snapshot referenced by the form instance, never from whichever template version is currently active. New template versions affect only new instances.

If the existing data model already copies immutable form fields into an instance/version, it will be reused. Otherwise, the backend will add the smallest explicit version reference needed. Resolving every draft against the latest template was rejected because it can invalidate or reinterpret persisted user data without action from the proponent.

## Risks / Trade-offs

- [Existing templates contain combinations rejected by the stricter schema] → Add an audit command and correct or explicitly migrate definitions before enforcing the new parser in production.
- [Frontend and backend rule implementations differ at an edge case] → Maintain shared contract fixtures exercised in both test suites, while treating the server result as authoritative.
- [A newer backend sends a variant unknown to an older frontend] → Preserve unknown data at the adapter boundary, show the field as unsupported and block unsafe final submission instead of silently omitting it.
- [Generated types create large or noisy diffs] → Generate only from a normalized, deterministic snapshot and isolate generated code from domain-facing types.
- [Strict rejection of extra rules complicates staged rollout] → Deploy support for the discriminated read contract and audit existing data before enabling strict template writes; coordinate compatible frontend and backend releases.
- [Version linkage is incomplete in current persistence] → Verify instance/template relationships before migration and add an explicit immutable reference only if required.

## Migration Plan

1. Create and approve the corresponding backend planning artifact, then inventory current field types, rules and persisted template definitions.
2. Add discriminated backend schemas and contract fixtures without yet rejecting existing production data; publish a normalized OpenAPI snapshot.
3. Audit and migrate incompatible template definitions, preserving the version used by every existing instance.
4. Add authoritative backend validators and the structured error response, with tests for draft and final-submission semantics.
5. Add frontend type generation, the transport adapter and CI drift verification.
6. Move dynamic rendering and local validation to the discriminated domain model, then enable strict backend enforcement.
7. Roll out backend compatibility before the dependent frontend. If rollback is needed, keep the new response fields additive and revert strict enforcement while retaining audited data and version references.

## Open Questions

- The exact path and name of the normalized OpenAPI snapshot and generated TypeScript file can follow the frontend's naming conventions during implementation.
- The user-facing Portuguese wording for each stable validation code can be finalized with the interface copy review without changing the contract.
