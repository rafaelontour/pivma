## Context

See [proposal.md](../proposal.md). A user directory currently receives a compact account record and global permission profiles. Process roles belong to distinct composition data, and the existing external contracts do not expose a single, authorized user profile with account creation and role-assignment dates. The submissions area already uses internal routes, but its sections must remain accurate after a correction begins.

## Goals / Non-Goals

**Goals:**

- Provide an authorized, localized profile view that keeps account, global-access and process-participation data distinct.
- Preserve the internal-route boundary for all new browser requests.
- Make submission lists immediately reflect the start of a correction and refresh safely from server data.

**Non-Goals:**

- Edit account information, global profiles, or process roles from the profile page.
- Infer unavailable assignment dates or reconstruct historical memberships in the browser.
- Change the lifecycle rules decided by the external API.

## Decisions

### Use a dedicated aggregated internal profile route

The browser will request `GET /api/users/{userId}/profile`. The route will require the same administrative authorization as user management and return a typed view model with account metadata, global profiles and local process roles. This avoids sending credentials or API URLs to the browser and prevents multiple client requests from producing an inconsistent view.

The preferred external contract is a single authorized profile endpoint that supplies `created_at`, global assignments and process-role assignments with `assigned_at`. If the existing APIs can provide some portions individually, aggregation remains server side. Values absent from the external service remain explicitly unavailable in the view model. A browser-side composition of `/access` plus process APIs was rejected because it broadens exposure and multiplies authorization checks.

### Present global and local access in separate sections

The profile page will show an account summary, global access profiles and process participations as separate sections. Process rows will include the process identifier and title when supplied, the technical role resolved through localized labels, current status where available, and assignment date. Dates will use the active locale; backend role identifiers stay unchanged.

### Keep return classification server-backed and transition state locally

The submitted-process listing will carry an explicit `returned_by_bracvam` marker derived from the authoritative return-review/triage data. The UI will use this marker plus a correction-pending fallback for the returned section. This removes dependence on a stale compact process status.

After the proponent selects and confirms the action that starts a correction, the dialog will update its owning catalog state: remove the process from returned submissions, place it in drafts, then refresh both collections. This produces immediate feedback while server refresh remains the final source of truth. Requiring a manual page refresh was rejected because it leaves the card in the wrong section after the user has changed workflow state.

### Describe sections with localized static copy

The Enviados and Retornados pelo BraCVAM selectors will include concise localized descriptions and circular count badges. Labels use “pelo BraCVAM” in Portuguese. The descriptions clarify that Enviados are under analysis or otherwise not awaiting correction, while Retornados require proponent action.

## Risks / Trade-offs

- [External API lacks creation or assignment dates] → Mark only affected values as unavailable and document the endpoint fields required for full data.
- [A process role becomes inactive or historical] → Render the status delivered by the API; do not delete it from the profile response.
- [Return-review lookup fails during list enrichment] → Preserve a known correction-pending signal and surface refresh failures instead of classifying a failed lookup as sent.
- [Optimistic transition disagrees with backend state] → Refresh submitted and draft collections after the successful correction-start response.

## Migration Plan

1. Publish or confirm the external authorized profile contract and normalize it behind the internal route.
2. Release the profile page and the directory action behind existing user-management authorization.
3. Release the returned-submission marker and client transition together.
4. Roll back by removing the new directory action and sections; existing user listing and submission endpoints remain compatible.

## Open Questions

- Which external endpoint will provide complete account creation and role-assignment timestamps, and does it include inactive or historical process roles?
