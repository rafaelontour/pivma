## Context

See `proposal.md` for motivation. The submission dialog already receives `section` and `order_index` with every dynamic field. It currently derives unique section names inline, renders every group as a fieldset in one scroll area, stores all inputs in a single map, and validates only the first error before final submission. Draft saving and final submission are coordinated by the dialog component.

The frontend already has manual validation for required fields, supported numeric and text restrictions, selections and file references. This change reorganizes that behavior without changing the API contract. All new domain and interface types must remain in `types/`.

## Goals / Non-Goals

**Goals:**

- Give long dynamic forms a predictable section-by-section flow without losing unsaved input.
- Aggregate simple validation errors by field and use them both for navigation and final submission.
- Keep navigation state independent of persisted form values and operation state.
- Isolate the provisional validator behind a result shape that can later be produced by Zod.
- Preserve accessible navigation on desktop, mobile and keyboard-only use.

**Non-Goals:**

- Add Zod or generate schemas for templates in this change.
- Change the backend, the template editor or the persisted field definition.
- Autosave when the user moves between sections.
- Require a partially completed draft to satisfy every mandatory field.
- Turn sections into separate API requests or separate form instances.

## Decisions

### 1. Derive a stable ordered section model once per loaded form

A shared helper will sort fields by `order_index`, normalize blank section names to `Geral`, and group fields in first-occurrence order. The dialog will consume a typed section model declared in `types/Submissao.ts`, rather than repeatedly filtering the complete field array during rendering.

The active section will be identified by a stable section key derived by the grouping helper and reset to the first section whenever `form_instance_id` changes. Input values remain in the existing form-wide map, so hiding a panel does not unmount or discard the logical value state.

Using the section array index as the only identity was rejected because reordering or normalization can leave the active index pointing at the wrong section. Introducing section identifiers in the backend was rejected because the current field metadata is sufficient for this interface-only change.

### 2. Treat tabs and progression controls as the same navigation state machine

The first editable section exposes `Avançar`, an intermediate section exposes `Voltar` and `Avançar`, and the final section exposes `Voltar` and `Enviar para análise`. A one-section form exposes only the final submission action. `Salvar rascunho` remains a separate secondary action and does not change the active section.

Moving backward is always allowed. Moving forward, whether through `Avançar` or direct selection of a later tab, validates every preceding section needed to reach the destination. The first invalid section becomes active. This prevents direct tab selection from bypassing the same gate enforced by the buttons.

The controls will be disabled while saving or submitting, preserving the existing concurrency guard. A submitted read-only form keeps selectable tabs for consultation but does not expose edit, draft or submission actions.

Allowing unrestricted forward tab jumps was rejected because it would make `Avançar` validation cosmetic. Disabling all direct tab selection was rejected because tabs are expected to be navigable controls and previous sections must remain easy to revisit.

### 3. Use an aggregate provisional validator with explicit modes

The manual validator will return a field-keyed error collection instead of stopping at the first error. It will accept a selected field subset so the same function can validate one section, all prerequisite sections or the complete form. It will also distinguish partial validation from completion validation: optional empty fields are accepted, filled fields are checked, and completion requires every mandatory field.

For this change, forward navigation uses completion semantics for the sections being left, and final submission uses completion semantics for every section. Draft saving retains partial-form behavior; it does not require untouched future sections to be complete. File selection continues to be checked at selection time and its reference is included in navigation validation.

The validator will cover only rules already understood by the frontend. Unknown rule keys will not gain guessed behavior. Unknown required field types remain blocking under the existing safety rule.

Relying only on native browser validation was rejected because the controls are split across hidden panels and some values, such as uploads and typed options, need application-level checks. Adding Zod now was rejected because the user explicitly reserved schema validation for a later change.

### 4. Keep validation orchestration independent from the future engine

The dialog will depend on normalized validation results containing field keys and messages, not on conditionals embedded in the tab component. Rendering, navigation and focus management will consume that result regardless of whether it came from the current manual validator or a future Zod schema.

Errors are stored at dialog level. Each field control receives its current error through typed props, exposes an invalid state and connects the control to its message. A successful revalidation replaces stale errors for the validated scope while leaving unrelated section errors intact until those sections are checked again.

Building a Zod schema implicitly inside each tab was rejected because it would couple navigation to a future validation implementation and recreate schemas on render.

### 5. Implement tabs with accessible semantics and responsive overflow

The section selector will use a `tablist`, one `tab` per section and one associated `tabpanel`. `aria-selected`, `aria-controls`, `aria-labelledby` and stable element identifiers will express the relationship. Arrow keys move tab focus, `Home` and `End` reach the limits, and activation follows the same validation rules as pointer selection.

The `tablist` will be sticky at the top of the dialog's vertical scroll container, with an opaque background and stacking context so form controls do not overlap it. Its existing horizontal overflow remains on the same element for narrow screens.

After a successful advance, focus moves to the new panel heading or first field. After a failed validation, the first invalid field in document order receives focus. The tab strip may scroll horizontally on narrow screens while the current section remains visually identified; error-bearing sections receive a non-color-only indicator.

Rendering every panel and hiding inactive ones was rejected because it enlarges the dialog DOM for long templates. Only the active panel will render, while values and errors remain in parent state.

### 6. Reuse one wide form dialog across submission entry points

The dynamic form dialog will use 90% of the viewport width without a compact maximum width. New submissions and drafts already share this dialog; submitted cards will expose a view action that loads the same form and relies on its submitted state to disable editing and mutation actions. The initial identification form used by a new submission follows the same width convention.

Auxiliary confirmation dialogs that do not present the submission form, such as the direct human review request, remain compact because they contain only a short decision or justification.

Duplicating a separate submitted-form dialog was rejected because it could diverge from the section navigation and read-only behavior already supported by the shared component.

## Risks / Trade-offs

- [Two sections normalize to the same visible name] → Group them as one section, matching the current grouping behavior, and use the grouping helper as the single source of identity.
- [A user expects clicking a distant tab to skip validation] → Apply the same forward rule consistently to tabs and buttons and activate the first section requiring correction.
- [Manual and future Zod validators produce different error shapes] → Define a small normalized validation result in `types/` and keep navigation unaware of the validation engine.
- [Errors in hidden sections are hard to discover] → Mark affected tabs and automatically activate the first invalid section on final submission.
- [Unmounting an inactive panel loses browser-local control state] → Keep canonical input and file-reference state in the dialog, as it is today, and test navigation round trips for every supported control.
- [Horizontal tabs overflow on mobile] → Use a scrollable tab strip with visible focus and keep previous/next controls at the panel footer.

## Migration Plan

1. Introduce typed section grouping and aggregate validation helpers with unit tests while retaining the current single-page rendering.
2. Add active-section and error state to the dialog and connect field-level error presentation.
3. Replace the stacked fieldsets with the accessible tab list, active panel and progressive controls.
4. Route tab selection, `Avançar` and final submission through the new validation orchestration while preserving draft saving.
5. Verify new forms, resumed drafts, uploaded files, a single-section template, read-only submitted forms and responsive keyboard navigation.
6. Expose the shared dialog from submitted cards and verify its wide layout in all three entry points.
7. Roll back by restoring stacked rendering; no API or persisted data migration is required.
