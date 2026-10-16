# Frontend Migration Inventory

This document tracks AngularJS route ownership during the React + TypeScript
migration. Angular remains the default owner unless a route is explicitly listed
as React-owned and enabled by the Flask `EDUMFA_REACT_UI` flag.

## Runtime Shell

- Flask/Jinja renders the application shell from `edumfa/templates/index.html`.
- AngularJS owns the legacy `ui-view` and hash routes by default.
- React mounts into `#react-root` only when enabled by Flask config.
- Angular 1.8 keeps its default `#!` hash prefix, so every address is
  `#!/route`. React uses `app/HashbangRouter.tsx`, which reads and writes that
  form through `window.location`, and every React link is built with
  `hashHref()` from `lib/hashbang.ts`. Plain `#/route` links must not be used:
  Angular rewrites them to `#!#%2Froute`, which neither router matches.
- React takes a route over only when it is both enabled by the Flask allowlist
  and shipped by the bundle (`shouldReactOwnRoute`). A newer Flask default
  with an older `react-dist` bundle therefore falls back to Angular instead of
  showing an empty page. Keep `EDUMFA_REACT_ROUTES` (`config.py`,
  `webui/login.py`), `app/bootstrap.ts` and `app/routes.tsx` in sync.
- The API client ends the React session only on HTTP 401 or the legacy auth
  error codes (403, 4031-4036), like `AuthFactory.authError`. Policy denials
  answer HTTP 403 with code 303 and keep the session.
- React internationalization uses Lingui catalogs and `Trans` macros. Angular
  gettext remains in place for legacy routes until Angular is removed.
- Authentication is still initiated by Angular. React reads the in-memory legacy
  auth bridge when a migrated route calls the same Flask APIs.

## Current Angular Route Ownership

| Hash route                          | Angular state          | Current owner | Migration complexity | Notes                                                                  |
| ----------------------------------- | ---------------------- | ------------- | -------------------- | ---------------------------------------------------------------------- |
| `#/offline`                         | `offline`              | Angular       | Low                  | Static/offline shell.                                                  |
| `#/login`                           | `login`                | Angular       | Medium               | Auth, WebAuthn/U2F, polling, policies.                                 |
| `#/response`                        | `response`             | Angular       | Medium               | Challenge response flow.                                               |
| `#/pinchange`                       | `pinchange`            | Angular       | Medium               | Authenticated form flow.                                               |
| `#/register`                        | `register`             | React         | Low                  | Migrated public form. Calls `POST /register`.                          |
| `#/recovery`                        | `recovery`             | React         | Low                  | Migrated public form. Calls `POST /recover`.                           |
| `#/reset/:user/:recoverycode`       | `reset`                | React         | Low                  | Migrated public form. Calls `POST /recover/reset`.                     |
| `#/dashboard`                       | `dashboard`            | Angular       | Medium               | Aggregated API state.                                                  |
| `#/component/clienttype`            | `component.clienttype` | React         | Low                  | First migrated route. Calls `/client/`.                                |
| `#/audit/log`                       | `audit.log`            | React         | Medium               | Migrated table. Filters, `?serial`/`?user`, CSV.                       |
| `#/user/list`                       | `user.list`            | React         | Medium               | Migrated table. Realm select, client-side paging.                      |
| `#/user/details/:realm/:user`       | `user.details`         | React         | Medium               | Migrated detail view: edit, delete, custom attributes, tokens, assign. |
| `#/user/password`                   | `user.password`        | React         | Medium               | Migrated own-details view with password form.                          |
| `#/user/add`                        | `user.add`             | React         | Medium               | Migrated form. Fields come from the editable resolver's map.           |
| `#/machine/list`                    | `machine.list`         | React         | Medium               | Migrated table. Filters, `?resolver` deep link, client paging.         |
| `#/machine/details/:id/:resolver`   | `machine.details`      | React         | Medium               | Migrated detail view: options editing, attach/detach tokens.           |
| `#/token/list`                      | `token.list`           | Angular       | Medium               | Shared table, action menus, rights checks.                             |
| `#/token/assign`                    | `token.assign`         | Angular       | Medium               | User/token selector directives.                                        |
| `#/token/details/:serial`           | `token.details`        | Angular       | High                 | Many action states, blobs, policy checks.                              |
| `#/token/lost/:serial`              | `token.lost`           | Angular       | High                 | Token lifecycle action flow.                                           |
| `#/token/getserial`                 | `token.getserial`      | Angular       | Medium               | Form + token lookup.                                                   |
| `#/token/enroll/:realm/:user`       | `token.enroll`         | Angular       | High                 | Token type matrix, WebAuthn/U2F, certificates.                         |
| `#/token/rollover/:type/:serial`    | `token.rollover`       | Angular       | High                 | Reuses enroll controller and token metadata.                           |
| `#/token/wizard`                    | `token.wizard`         | Angular       | High                 | Policy-dependent token enrollment.                                     |
| `#/token/import`                    | `token.import`         | Angular       | High                 | Uploads and token format handling.                                     |
| `#/token/challenges`                | `token.challenges`     | Angular       | Medium               | Polling/table state.                                                   |
| `#/token/applications/:application` | `token.applications`   | Angular       | Medium               | Application-specific token details.                                    |
| `#/config/**`                       | `config.*`             | Angular       | High                 | Broad admin surface, policy/event/resolver complexity.                 |

## Current API Factory Ownership

| Angular factory                          | Primary concern                        | React target                           |
| ---------------------------------------- | -------------------------------------- | -------------------------------------- |
| `AuthFactory`                            | Login session, rights, menus, settings | `auth/AuthProvider.tsx`, `api/auth.ts` |
| `PollingAuthFactory`                     | Polling auth responses                 | Auth feature hooks                     |
| `U2fFactory`, WebAuthn factory           | Browser auth hardware flows            | `auth/u2f.ts`, `auth/webauthn.ts`      |
| `TokenFactory`, `ValidateFactory`        | Token lifecycle and validation         | `api/tokens.ts` (done), validate open  |
| `UserFactory`                            | User list/detail/password APIs         | `api/users.ts` (done)                  |
| `MachineFactory`                         | Machine resolver/list/detail APIs      | `api/machines.ts` (done)               |
| `AuditFactory`                           | Audit log and CSV APIs                 | `api/audit.ts` (done)                  |
| `ConfigFactory`, `PolicyTemplateFactory` | Admin config APIs                      | `api/config.ts` (realms, resolvers)    |
| `ComponentFactory`                       | Client application types               | `api/component.ts`                     |
| `RegisterFactory`, `RecoveryFactory`     | Public account flows                   | `api/register.ts`, `api/recovery.ts`   |

## Migrated Public Forms

`#/register`, `#/recovery` and `#/reset/:user/:recoverycode` are React-owned.
They are anonymous flows, so they work without the legacy auth bridge.

- Forms use `react-hook-form` with `mode: "onChange"`; the submit button is
  disabled while the form is invalid, matching the legacy
  `ng-disabled="form.$invalid"` behavior.
- Success and failure feedback renders as inline Bootstrap alerts instead of
  the legacy `inform` growl notifications.
- Deviation from Angular: after a password reset the page shows the result
  message with a "Proceed to login" link instead of navigating to `#/login`
  immediately, because the React shell unmounts on Angular-owned routes and
  would lose the growl-style feedback.
- The route allowlist supports `:param` segments (`app/routes.tsx`,
  `matchesRoutePattern`), which `EDUMFA_REACT_ROUTES` entries such as
  `/reset/:user/:recoverycode` rely on.
- The API client supports `responseType: "text"` for endpoints that do not
  return the JSON envelope (e.g. the audit CSV download); type those calls as
  `get<string>`.

## Migrated Authenticated Tables

`#/audit/log` and `#/user/list` are React-owned. Both require the legacy auth
bridge (login stays Angular-owned) and reuse the shared table components in
`components/tables/` (`Pagination`, `ColumnFilter`, `EmptyState`).

- Audit: server-side pagination and filtering (`*value*` wildcards like the
  legacy `getParams`), columns driven by the `auditcolumns` response field,
  `?serial`/`?user` hash-query deep links, and a CSV download (admin +
  `auditlog_download` right) saved through a Blob object URL.
- User list: realm selector for admins (`GET /realm/`, default realm
  preselected), server-side filters, client-side pagination like the legacy
  controller.
- Cross-links to Angular-owned routes (token details, user details, config
  pages) are plain hash links; the shell hands those routes back to Angular.
- Known limitation: the `audit_page_size` and `user_page_size` WebUI policies
  are delivered with the legacy login response and are not yet readable from
  the auth bridge, so the React pages use the backend defaults (10 and 15)
  until React owns the login flow.

## First React-Owned Route

`#/component/clienttype` is the initial migrated route because it has a small
read-only API surface and a simple Bootstrap table. The route remains hidden
behind the React feature flag until the React bundle is built and deployed.

Parity requirements for this route:

- Keep the hash URL unchanged.
- Call `GET /client/` with the same raw `Authorization` token header.
- Render the same application-type/client grouping.
- Preserve the empty/loading/error states using Bootstrap-compatible markup.
- Keep Angular as fallback when React is disabled or the hash route is not in
  the React allowlist.

## Migrated User and Machine Views

`#/user/details/:realm/:user`, `#/user/add`, `#/user/password`,
`#/machine/list` and `#/machine/details/:id/:resolver` are React-owned. They
share `components/layout/SidebarLayout.tsx`, which ports the legacy
`user.html` / `machine.html` two-column shell, and the feature sidebars
(`UserSidebar`, `MachineSidebar`).

- User details reads `resolver` and `editable` from `GET /user/` instead of
  the legacy `ui-router` state params, so deep links work without the list
  page. Attribute fields come from the resolver configuration
  (`lib/userAttributes.ts`, LDAP `USERINFO` / SQL `Map`); when the resolver
  cannot be read (missing `resolverread` right) a common attribute set is
  shown read-only instead of nothing.
- Editing sends `userid` with the update so renaming a user works like the
  legacy form; the password field is optional on edit because the legacy
  save button never enforced it.
- Deleting uses the React `ConfirmDialog` (no jQuery modal). One-off notices
  such as "User created." travel through `lib/flash.ts` because hash
  navigation cannot carry history state.
- Token assignment and machine attachment use `SerialLookupField`, a native
  `<datalist>` replacement for the `uib-typeahead` directives, and
  `fixSerial()` recovers the serial from the chosen suggestion.
- "Enroll New Token" links to the Angular enrollment route. The legacy
  `$rootScope.returnTo` hand-back is not available from React, so enrollment
  returns to Angular's default route afterwards.
- Sidebar help links point at the latest docs because the running version
  number is only known to the Angular login controller.
- Machine list reads `?resolver=` from the hash query like the legacy state.
  Machine details edits application options per assignment (`mtid` only,
  like the legacy call), excludes the `offline` application from the attach
  form, and shows the machine count the legacy sidebar failed to render.
- Known coexistence cost: Angular still runs the hidden controllers for these
  states, so the legacy views fetch their data in the background as well.

## Design Layer for React-Owned Routes

React pages keep Bootstrap 3 markup but are restyled through
`styles/react.css`, scoped to `.react-migration-shell`, so Angular-owned views
look unchanged while both UIs coexist. The layer defines colour and radius
tokens on the shell, card panels (`components/layout/Card.tsx`), page headers
with actions (`components/layout/PageHeader.tsx`), the two-column
`SidebarLayout`, pill-style status labels (`components/feedback/BooleanPill.tsx`),
flat tables with a separate filter row, rounded form controls and buttons.
Everything inside the shell is opt-in through class names, so the legacy
`components/` CSS is not touched.

## Audit Log Filtering

- Column filters live in a second header row instead of the label cells.
- Text filters are debounced (300 ms); Enter applies immediately. Values are
  sent as `*value*` like the legacy `getParams`, unless the user typed `*`
  wildcards, which are passed through unchanged.
- `success` is a boolean on the backend (`is_true` on the SQL audit module),
  so it is filtered through a yes/no select that sends `1`/`0`, and rendered
  as a check/cross pill instead of the raw integer. `sig_check` and
  `missing_line` use the same pill with their `OK`/`FAIL` labels.
- Applied filters are listed as removable chips with a "Clear all" action; the
  `?serial`/`?user` deep links still seed the filters.
