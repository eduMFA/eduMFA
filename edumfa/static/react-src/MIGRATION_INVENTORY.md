# Frontend Migration Inventory

This document tracks the React + TypeScript rewrite and retains notes from the
earlier AngularJS coexistence phase.

## Legacy UI versus React UI

Both interfaces talk to the same REST API (`/auth`, `/token`, `/policy`, ...),
use the same rights and policies, and keep the `#!/` URL prefix. The backend does
not distinguish between them; only the page served at `/` differs.

### At a glance

| Aspect        | Legacy UI (AngularJS)                                            | React UI                                                            |
| ------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------- |
| Availability  | Default                                                          | Opt-in via `EDUMFA_REACT_UI = True`                                 |
| Framework     | AngularJS 1.8 (end of life), jQuery, Bootstrap 3                 | React 19, TypeScript, Mantine 9                                     |
| Source        | `static/app.js`, `static/components/**`                          | `static/react-src/**`                                               |
| Delivery      | Individual scripts and HTML templates loaded at runtime          | Bundle built by Vite into `static/react-dist` and committed         |
| Page template | `templates/legacy.html`                                          | `templates/index.html`                                              |
| Server state  | `$http` calls in factories, shared mutable `$scope`/`$rootScope` | TanStack Query (cache, refetch, invalidation)                       |
| Forms         | Two-way `ng-model` bindings                                      | Controlled components; explicit state and validation                |
| Routing       | `ui-router` states                                               | React Router, same URLs                                             |
| Translations  | `angular-gettext` and `.po` files in `static/translations`       | Lingui catalogs in `react-src/locales` (`en`, `de`)                 |
| Customization | `EDUMFA_CUSTOMIZATION` menu and baseline templates               | Not applied; see "Behavior changes"                                 |
| Tests         | Python API tests only                                            | Vitest and Testing Library for components, payloads and permissions |

### Architecture

- **Page bootstrap.** The legacy page renders configuration into hidden
  `<input id="...">` elements that scripts read at load time. The React page emits
  one JSON block (`#edumfa-ui-config`) that is parsed in
  `react-src/lib/uiConfig.ts`. The legacy page additionally needs
  `EDUMFA_VERSION_NUMBER` for cache-busting template URLs. The React page
  preloads the chunks `main.js` imports, so the browser does not discover
  them one round trip late.
- **State and data flow.** AngularJS controllers share data through scope
  inheritance and watchers. The React UI keeps server data in TanStack Query
  (`react-src/api/*`, one typed module per endpoint group) and local form state in
  the component that owns the form. Saving invalidates the matching query keys.
- **Types.** API responses and requests are typed in `react-src/api`. The legacy
  code is untyped, so many payload quirks only lived in controller code (see
  "Behavior changes").
- **Session.** The React UI owns its session (`react-src/auth`): login, idle lock,
  logout and rights come from one provider. The legacy UI keeps this in the
  `AuthFactory` and `$rootScope`, so an F5 there signs the user out. The React
  session survives a reload (see "Behavior changes").
- **Components.** Shared building blocks replace copy-pasted templates, for example
  `DataTable`, `CheckboxPickList` (replaces `isteven-multi-select`),
  `TypedOptionInput` and `useDeleteConfirmation`.

### Behavior changes

- **Interface switching.** The switch (`?ui=react` or `?ui=legacy`) reloads the
  page and requires signing in again; no tokens are shared between the clients.
  The React UI drops its stored session when you leave for the legacy UI. The
  choice is stored in an instance-scoped, `HttpOnly` cookie.
- **Reload (F5) keeps the React login.** Unlike the legacy UI, the React session
  (token, user, rights, WebUI settings and the lock state) is kept in
  `sessionStorage` (`auth/sessionStore.ts`) and restored when the page loads.
  Details and trade-offs:
  - It is per tab and per installation path; closing the tab ends it. Nothing
    goes to `localStorage` or a cookie.
  - Logout, an authentication error (HTTP 401 and the legacy auth codes) and the
    switch to the legacy UI remove it. An expired JWT (`exp`) is discarded on load
    without a request.
  - The idle lock survives a reload: a locked session comes back locked, without
    a token. The idle timer restarts on load, so a reload counts as activity.
  - Pending challenge-response and PIN-change steps are not stored; they start
    over after a reload.
  - The token is readable by scripts of the page, exactly like the in-memory
    copy before, so XSS exposure is unchanged. Deployments that must not keep a
    token across reloads can use the `timeout_action = logout` policy and a short
    `logout_time`.
- **Customization.** Legacy deployments can replace menu and baseline templates
  with `EDUMFA_CUSTOMIZATION`. The React UI does not load those templates. Custom
  CSS (`EDUMFA_CUSTOM_CSS`) and the theme (`EDUMFA_CSS`) still apply.
  `EDUMFA_INDEX_HTML` still takes precedence over both interfaces.
- **Event handlers and periodic tasks.** Changing the handler or task module
  clears options that no longer apply, as in the legacy editors. Stored options
  unknown to the module are kept on ordinary edits instead of being dropped.
- **Policies.** `active` is sent as the string `"true"` or `"false"` because
  `set_policy_api` treats a JSON `false` as `True`. Multi-value actions are space
  separated. Renaming a policy creates a copy, like the legacy editor.
- **Multi-selects.** Dropdown multi-selects are checkbox lists; entries that the
  stored value holds but the backend no longer offers stay visible, so saving does
  not silently drop them.
- **Required and integer options.** `required` and `int` option specs are
  validated before saving. The legacy template had no input for `int` options.
- **Accessibility.** Inputs carry accessible names, errors use `role="alert"`, and
  navigation and action buttons combine icons with text labels.
- **Confirmations.** Deletes honor the `deletion_confirmation` WebUI policy in both
  interfaces; React uses one shared hook instead of per-controller dialogs.

### Not yet at parity

Every AngularJS state now has a React counterpart (see "Route coverage" below).
What the React UI still does not do:

- **Customization templates.** `EDUMFA_CUSTOMIZATION` menu and baseline templates
  (`customize/`) are only rendered by the legacy page. Custom CSS and the theme are
  shared.
- **Legacy-only plumbing.** The AngularJS auth bridge and route allowlist are gone
  from the runtime; the React UI has its own session. `config.machines` is
  commented out in the legacy states and has no React route either.
- **Production soak time.** The React forms are covered by unit tests, but have
  seen far less real-world use than the legacy ones. Keep the legacy UI as the
  default until that has changed.

### Working on either UI

- Legacy changes: edit `static/components/**` and `templates/legacy.html`; no build.
- React changes: edit `static/react-src/**`, run `bun run typecheck`,
  `bun run lint`, `bun run test`, then `bun run react:build` and commit the result in
  `static/react-dist`. Update translations with the `intl:*` scripts.

## Current implementation (October 2026)

When `EDUMFA_REACT_UI` is enabled, users can opt into the React application with
`?ui=react`; the legacy AngularJS interface remains the default. React owns its
session, login, navigation, idle lock and welcome dialogs. A visible switch returns
to AngularJS with `?ui=legacy`, and the legacy interface links back to React. The
selected interface is remembered in an instance-scoped cookie. Switching reloads
the page and requires signing in again. Neither client stores authentication tokens
for the switch. The React session itself survives a reload through
`sessionStorage` (see "Behavior changes"). URLs retain the `#!/` prefix.

The configuration route table now mounts these existing areas:

- System settings and documentation; SMTP, RADIUS, eduMFA and SMS gateway servers.
- CA connectors, service IDs and token groups.
- Realms, hosts/LDAP machine resolvers, and all five user resolver editors
  (passwd, LDAP, SQL, SCIM and HTTP).
- Token settings for all 13 types in `tokenConfigTypeKeys`, including questionnaire
  entries and Yubikey API keys. Only changed settings are saved; writes and deletes
  respect their respective rights and the deletion-confirmation policy.
- Policy listing, creation and editing at the legacy `/config/policies` URLs.
  The list filters and sorts policies, updates priorities on blur/Enter, toggles
  active state and confirms deletions according to the WebUI policy. The editor
  uses the backend action definitions for boolean, integer, text, selection and
  multiple-selection actions. It includes realm/resolver/admin/node restrictions,
  users, clients, time and additional five-field conditions. Unknown stored actions
  and unavailable selection entries are retained. Public policy templates load
  only on request and receive no session credentials.
- Event handlers: lists, ordering, activation and confirmed deletion; editors
  load action, position, option and grouped condition definitions per module.
  Conditional options and comma-separated multi-value conditions are supported.
- Periodic tasks: lists, ordering, activation and confirmed deletion; editors
  include cron schedules, nodes (including `select_manually`), retries, typed
  module options, last runs and definition timestamps. Changing modules clears
  obsolete options; ordinary edits preserve unknown stored values.

The new user resolver editors preserve stored keys and censored passwords.
Connection tests include the original resolver name so the backend can recover
stored secrets. LDAP tests override the size limit only for the test request;
anonymous tests clear bind credentials. LDAP and SQL presets match the legacy
controllers. HTTP mappings are validated as JSON objects. Saving and testing
require `resolverwrite`, matching the backend endpoint policy.

Policy writes serialize `active` as the string `"true"` or `"false"` because
`set_policy_api` defaults a JSON `false` to `True`. This prevents edits and priority
changes from accidentally reactivating a disabled policy. Actions with multiple
values use spaces, as expected by the backend. A changed policy name creates a
copy, like the legacy editor; the original policy is not renamed or removed.

Policy action descriptions wrap independently of the Help link. Navigation and
editor controls use icons alongside their text labels. All current React messages
have German translations, with interpolation and rich-text placeholders retained.

Validation: `bun run typecheck`, `bun run lint`, `bun run test` and
`bun run react:build`. Configuration tests cover application routing, resolver
payloads, secrets, permissions, token settings, policy actions and conditions,
templates, inactive-state preservation, event handlers, periodic tasks and
confirmed deletions. Flask tests cover selecting and remembering both UIs,
mount paths, custom templates and disabled-UI behavior. Extract
catalogs with `bun run intl:extract` before building; ship `react-dist` together
with the sources.

## Historical coexistence notes

The sections below describe the earlier migration stages. References to the
Angular auth bridge, route allowlists, Bootstrap coexistence and feature flag
are historical and do not describe the current runtime.

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
- Imports from other directories use the `@/` alias (`paths` in
  `tsconfig.json`, `resolve.alias` in `vite.config.mts`, shared by Vitest);
  only sibling files are imported as `./name`. Relative `../` imports are not
  used.
- React internationalization uses Lingui catalogs and `Trans` macros. Angular
  gettext remains in place for legacy routes until Angular is removed.
- Vite (Rolldown) emits `react-dist/assets/main.js` plus the library chunks
  `react.js`, `mantine.js`, `vendor.js` and `rolldown-runtime.js`
  (`codeSplitting` groups in `vite.config.mts`). `templates/footer.html` loads
  `main.js` as an ES module and `main.js` imports the chunks statically, so the
  template never changes with the chunk layout. The groups leave stylesheets
  out so everything lands in `main.css`, the only sheet `templates/header.html`
  links. Commit new chunk files together with `main.js`.
- The login page is React-owned, but the session still lives in Angular:
  the React page posts `/auth` and hands the envelope to
  `window.eduMfaLegacyAuth.login()`, which runs the legacy `do_login_stuff`
  (see "Login"). React reads the in-memory legacy auth bridge when a
  migrated route calls the same Flask APIs. The bridge also hands over the
  WebUI policy values of the login response
  (`AuthFactory.setWebUiSettings` in `login/factories/auth.js`, read as
  `settings` from `useAuth()`): `token_page_size`, `user_page_size`,
  `audit_page_size`, `user_details`, `search_on_enter`, `token_wizard_2nd`,
  `hide_buttons` and `token_rollover` (the policy dict, exposed as a list of
  token types). Missing values fall back to the backend defaults
  (`auth/AuthProvider.tsx`).
- The API client's `responseType: "envelope"` returns the whole success
  envelope for the few endpoints that put data next to the value in
  `detail` (`/token/setrandompin` → `detail.pin`, `/validate/check` →
  `detail.message`).

## Route coverage

The table lists every AngularJS state and its React counterpart. The title is
historical: all routes are now implemented in React. Which interface serves them
is decided per browser (see "Current implementation"); the allowlist and auth
bridge mentioned in the notes below no longer exist.

| Hash route                          | Angular state          | Current owner | Migration complexity | Notes                                                                                                                                     |
| ----------------------------------- | ---------------------- | ------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `#/offline`                         | `offline`              | React         | Low                  | Migrated. Static alert.                                                                                                                   |
| `#/login`                           | `login`                | React         | Medium               | Migrated. Session handed to Angular through the bridge.                                                                                   |
| `#/response`                        | `response`             | React         | Medium               | Migrated. OTP input, polling, U2F/WebAuthn sign.                                                                                          |
| `#/pinchange`                       | `pinchange`            | React         | Medium               | Migrated. Serial kept in the login flow store.                                                                                            |
| `#/register`                        | `register`             | React         | Low                  | Migrated public form. Calls `POST /register`.                                                                                             |
| `#/recovery`                        | `recovery`             | React         | Low                  | Migrated public form. Calls `POST /recover`.                                                                                              |
| `#/reset/:user/:recoverycode`       | `reset`                | React         | Low                  | Migrated public form. Calls `POST /recover/reset`.                                                                                        |
| `#/dashboard`                       | `dashboard`            | React         | Medium               | Migrated. Token counts, audit summaries, policies, events.                                                                                |
| `#/component/clienttype`            | `component.clienttype` | React         | Low                  | First migrated route. Calls `/client/`.                                                                                                   |
| `#/audit/log`                       | `audit.log`            | React         | Medium               | Migrated table. Filters, `?serial`/`?user`, CSV.                                                                                          |
| `#/user/list`                       | `user.list`            | React         | Medium               | Migrated table. Realm select, client-side paging.                                                                                         |
| `#/user/details/:realm/:user`       | `user.details`         | React         | Medium               | Migrated detail view: edit, delete, custom attributes, tokens, assign.                                                                    |
| `#/user/password`                   | `user.password`        | React         | Medium               | Migrated own-details view with password form.                                                                                             |
| `#/user/add`                        | `user.add`             | React         | Medium               | Migrated form. Fields come from the editable resolver's map.                                                                              |
| `#/machine/list`                    | `machine.list`         | React         | Medium               | Migrated table. Filters, `?resolver` deep link, client paging.                                                                            |
| `#/machine/details/:id/:resolver`   | `machine.details`      | React         | Medium               | Migrated detail view: options editing, attach/detach tokens.                                                                              |
| `#/token/list`                      | `token.list`           | React         | Medium               | Migrated table. Server paging/sorting/filters, enable/disable, reset.                                                                     |
| `#/token/assign`                    | `token.assign`         | React         | Medium               | Migrated form. Serial lookup + PIN, calls `POST /token/assign`.                                                                           |
| `#/token/details/:serial`           | `token.details`        | React         | High                 | Migrated. Properties, functions, user, machines; delete confirmation.                                                                     |
| `#/token/lost/:serial`              | `token.lost`           | React         | High                 | Migrated. Calls `POST /token/lost/:serial`, shows the password once.                                                                      |
| `#/token/getserial`                 | `token.getserial`      | React         | Medium               | Migrated form. Count step, then `GET /token/getserial/:otp`.                                                                              |
| `#/token/enroll/:realm/:user`       | `token.enroll`         | React         | High                 | Migrated. Every token type, two-step, U2F/WebAuthn, verify, polling.                                                                      |
| `#/token/rollover/:type/:serial`    | `token.rollover`       | React         | High                 | Migrated. Same page with a fixed type and `rollover=1`.                                                                                   |
| `#/token/wizard`                    | `token.wizard`         | React         | High                 | Migrated. Same page without type select; logout through the bridge.                                                                       |
| `#/token/import`                    | `token.import`         | React         | High                 | Migrated. Multipart upload to `POST /token/load/:filename`.                                                                               |
| `#/token/challenges`                | `token.challenges`     | React         | Medium               | Migrated table. Server paging/sorting, serial filter in the path.                                                                         |
| `#/token/applications/:application` | `token.applications`   | React         | Medium               | Migrated. ssh/offline tables from `GET /machine/token`.                                                                                   |
| `#/config/**`                       | `config.*`             | React         | High                 | Migrated: system, policies, events, periodic tasks, resolvers, realms, servers, CA connectors, service IDs, token groups, token settings. |

## Current API Factory Ownership

| Angular factory                          | Primary concern                        | React target                                                                                                                                                                                   |
| ---------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AuthFactory`                            | Login session, rights, menus, settings | `auth/AuthProvider.tsx`, `api/auth.ts` (session in Angular)                                                                                                                                    |
| `PollingAuthFactory`                     | Polling auth responses                 | `features/login/usePollTransaction.ts` (done)                                                                                                                                                  |
| `U2fFactory`, WebAuthn factory           | Browser auth hardware flows            | `auth/u2f.ts`, `auth/webauthn.ts` (done)                                                                                                                                                       |
| `TokenFactory`, `ValidateFactory`        | Token lifecycle and validation         | `api/tokens.ts`, `api/validate.ts`                                                                                                                                                             |
| `UserFactory`                            | User list/detail/password APIs         | `api/users.ts` (done)                                                                                                                                                                          |
| `MachineFactory`                         | Machine resolver/list/detail APIs      | `api/machines.ts` (done)                                                                                                                                                                       |
| `AuditFactory`                           | Audit log and CSV APIs                 | `api/audit.ts` (done)                                                                                                                                                                          |
| `ConfigFactory`, `PolicyTemplateFactory` | Admin config APIs                      | `api/system.ts`, `policies.ts`, `events.ts`, `periodicTasks.ts`, `realms.ts`, `resolvers.ts`, `machineResolvers.ts`, `caConnectors.ts`, `servers.ts`, `serviceIds.ts`, `tokengroups.ts` (done) |
| `ComponentFactory`                       | Client application types               | `api/component.ts`                                                                                                                                                                             |
| `RegisterFactory`, `RecoveryFactory`     | Public account flows                   | `api/register.ts`, `api/recovery.ts`                                                                                                                                                           |

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
  immediately (kept after the login page moved to React).
- The route allowlist supports `:param` segments (`app/routes.tsx`,
  `matchesRoutePattern`), which `EDUMFA_REACT_ROUTES` entries such as
  `/reset/:user/:recoverycode` rely on.
- The API client supports `responseType: "text"` for endpoints that do not
  return the JSON envelope (e.g. the audit CSV download); type those calls as
  `get<string>`.

## Migrated Authenticated Tables

`#/audit/log` and `#/user/list` are React-owned. Both require a session from
the legacy auth bridge and reuse the shared table components in
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
- The `audit_page_size` and `user_page_size` WebUI policies come from the auth
  bridge settings (see Runtime Shell). With `search_on_enter` the filters wait
  for the Enter key (`useDebouncedState` with `liveApply: false`) instead of
  querying while typing.

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
- "Enroll New Token" opens the React enrollment page with realm and user
  preset through the route (`#!/token/enroll/<realm>/<user>`).
- Sidebar help links point at the latest docs because the running version
  number is only known to the Angular login controller.
- Machine list reads `?resolver=` from the hash query like the legacy state.
  Machine details edits application options per assignment (`mtid` only,
  like the legacy call), excludes the `offline` application from the attach
  form, and shows the machine count the legacy sidebar failed to render.
- Known coexistence cost: Angular still runs the hidden controllers for these
  states, so the legacy views fetch their data in the background as well.

## UI Framework: Mantine

React-owned routes are built with [Mantine](https://mantine.dev) (`@mantine/core`,
`@mantine/hooks`, `@mantine/notifications`) and Tabler icons. Angular-owned
views keep Bootstrap 3 until the last route is migrated.

- `app/theme.ts` holds the brand colour (derived from the legacy link blue),
  radius, font and `cursorType: "pointer"` (badges inside buttons, checkboxes
  and selects show the pointer like the Bootstrap `[ng-click]` elements). It sets `scale: 1.6` because Bootstrap 3 fixes
  `html { font-size: 10px }` while Mantine sizes everything in `rem` for a
  16px root; without it every Mantine size renders at 62.5%. `MantineProvider` and `Notifications` wrap the React tree in
  `app/App.tsx`; the test render helper does the same.
- The bundle is one entry (`main.js`) plus three stable library chunks
  (`react`, `mantine`, `vendor`). Route-level code splitting with per-feature
  chunks and a lazy catalog was tried in Oct 2026 and reverted: the extra
  chunks made the coexistence setup hard to debug. The `.vite/manifest.json`
  is written but not consumed by Flask.
- Styles are imported per component in `main.tsx`. `@mantine/core/styles/baseline.css`
  is deliberately not loaded because it restyles `body`, which still belongs to
  the Angular views. The CSS variables land on `:root`; they are inert without
  Mantine class names. `styles/react.css` only hides the inactive shell and
  neutralises the few Bootstrap element rules (`label`, checkboxes, `table`)
  that would leak into `#react-root`. The checkbox/radio reset is limited to
  native inputs: Mantine's `Checkbox`/`Radio` size themselves through
  `--checkbox-size`, and an id-scoped `height: auto` collapses them to a line.
- Mantine's `MantineProvider` injects one `<style>` tag with the theme variables.
  Deployments with a strict `style-src` can pass a nonce through
  `getStyleNonce`; component styles themselves are static CSS.
- Shared building blocks: `components/layout` (`SidebarLayout`, `PageHeader`,
  `Card`, `SidebarSection`), `components/tables` (`DataTable`, `ColumnFilter`,
  `Pagination`, `EmptyState`), `components/forms` (`TextField`, `FieldValue`,
  `SerialLookupField` on `Autocomplete`), `components/feedback` (`ErrorAlert`,
  `LoginRequiredAlert`, `LoadingIndicator`, `BooleanPill`, `ConfirmDialog` on
  `Modal`). One-off success notices use `lib/notify.ts` (Mantine notifications);
  the legacy growl equivalent across a navigation is still `lib/flash.ts`.
- `DataTable` is a thin column-config table on Mantine's `Table`; all paging,
  sorting and filtering stay server-side. A column with a `sortKey` renders
  its label as a sort toggle (`aria-sort` on the `th`) when the table gets
  `sort`/`onSortChange`; `toggleSort` replaces the legacy `pi-sort-by`
  directive. Column filters are rendered in the
  header cell under the label; the `th` gets `font-weight: 400` because the
  browser default bold would otherwise leak into the inputs. TanStack Table was evaluated but its
  v9 feature-object API adds little for static columns; revisit it for the token
  list if client-side sorting or column visibility is needed.
- Native `<select>` elements (`NativeSelect`) are used instead of Mantine's
  custom `Select`, so keyboard, browser autofill and the existing tests keep
  working. Mantine appends an asterisk to required labels; tests match labels
  with `tests/labels.ts` (`fieldLabel("Resolver")`).
- `vitest.setup.ts` stubs `matchMedia`, `ResizeObserver` and `scrollIntoView`
  for Mantine and clears the notification store after each test.

## Migrated Token Views

`#/token/list`, `#/token/assign`, `#/token/getserial` and `#/token/challenges`
are React-owned. They share `features/tokens/TokenSidebar.tsx`, the port of
the `token.html` navigation. The parameterless enroll entry links to
`#!/token/enroll//`, which is how ui-router addresses the `token.enroll`
state without realm and user; the allowlist therefore carries both
`/token/enroll` (the normalised form) and `/token/enroll/:realmname/:username`.

- Token list: server-side paging (`token_page_size`), sorting (`sortby`,
  `sortdir`, default `serial` ascending) and `*value*` filters for serial,
  type, description, rollout state and token realm. The active and fail
  counter badges are buttons ("Disable token", "Enable token", "Reset
  Failcounter") when the session has the matching right; the legacy list
  made the labels clickable without checking rights. The user, realm and
  token realm columns are admin-only; `user_details` adds user id and
  resolver like the legacy template. Serial links go to the Angular token
  details view.
- Assign: `SerialLookupField` with unassigned tokens only, PIN plus repeat.
  Like the legacy controller only `serial` and `pin` are sent; the backend
  assigns to the authenticated user. Success notifies through `lib/flash.ts`
  on the token list.
- Get serial: the form first asks the backend for the number of candidate
  tokens (`count=1`) and shows the legacy warning with "Run search" and
  "Cancel" before the real lookup. The token type list is the hard-coded one
  from the legacy controller, with an added "Any token type" entry for the
  blank option Angular rendered implicitly. Editing after a result returns to
  the form, like the legacy `newOtp` flag.
- Challenges: 15 per page like the legacy template, sortable columns, the
  serial filter is sent as `GET /token/challenges/*value*`; without a filter
  `GET /token/challenges/` is called instead of the legacy `**` pattern.
- `FailCounterBadge` (`features/tokens/tokenBadges.tsx`) is shared with the
  user details token table.
- Known coexistence cost: Angular's `tokenController` still runs for these
  states and fetches the token list in the background.

### Token details, lost token and applications

`#/token/details/:serial`, `#/token/lost/:serial` and
`#/token/applications/:application` are React-owned as well.

- The details view (`features/tokens/details/`) is split into cards:
  `TokenPropertiesCard` (status actions, editable counters and description
  through `EditableValueRow`, the port of the `token-data-edit` directive,
  token info with the validity period editor, realms and token groups),
  `TokenFunctionsCard` (resync, set PIN, random PIN, test token),
  `TokenUserCard` (assigned user, unassign, assign form with
  `UserLookupField`) and `TokenMachinesCard` (attached machines with option
  editing, attach form with `MachineLookupField`). The page header carries
  the audit link, the delete button and the rollover link (Angular route,
  offered when `token_rollover` lists the type and the token is software).
- Rights follow the legacy pattern: a button without the right is disabled,
  and hidden altogether under the `hide_buttons` policy. Locked tokens show
  no editing controls at all.
- Deleting a hardware token (`info.tokenkind`) asks for confirmation; the
  page then returns to the token list, because the legacy "previous state"
  is not known to React. A user who unassigns their own token is sent to
  the list as well, like the legacy controller did.
- Validity periods are stored as `YYYY-MM-DDTHH:mm+HHMM`; `lib/dates.ts`
  parses and formats them (`parseValidityPeriod`, `formatValidityPeriod`)
  and the editor uses Mantine's `DateTimePicker`.
- The test-token placeholder depends on the `PrependPin` system config, read
  through `GET /system/` like the legacy controller.
- Certificate and PKCS12 info entries are offered as downloads through Blob
  object URLs; other info values are truncated to 35 characters with the
  full value in the tooltip.
- Applications: the application is part of the route (`ssh` or `offline`);
  filters and sorting go to `GET /machine/token`, paging stays client-side
  because the endpoint returns the whole list.
- Import (`TokenImportPage`): the file is uploaded as soon as it is picked
  (`FileButton`), like the legacy `ngf-select`, as multipart form data with
  `type`, `tokenrealms` and the PSKC options. Deviation: `fetch` offers no
  upload progress, so the legacy percentage is replaced by the button's
  loading state. PGP keys from `GET /system/gpgkeys` are listed in an
  accordion.

## Dashboard

`#/dashboard` (`features/dashboard/DashboardPage.tsx`) is React-owned. It is
the start route when the `admin_dashboard` policy is set; the redirect itself
still happens in the Angular login controller. Each panel is gated by the
legacy right (`tokenlist`, `auditlog`, `policyread`, `eventhandling_read`).
Token counts use `GET /token/?pagesize=0` per kind, authentications and the
administration list come from `GET /audit/` with `timelimit=1d` (the failed
users are grouped client-side like the legacy controller, `summarizeFailures`),
policies and events from `GET /policy/` and `GET /event/`. Links to policy
and event details point at the Angular config routes.

## Audit Log Filtering

- Column filters render inside the header cell under the column label
  (`DataTable`), so the header is one band instead of a label row stacked on
  an input row. `startdate` and `enddate` use Mantine date pickers; a picked
  day is sent as `*YYYY-MM-DD*` because the backend matches ISO strings.
- Text filters are debounced (300 ms); Enter applies immediately. Values are
  sent as `*value*` like the legacy `getParams`, unless the user typed `*`
  wildcards, which are passed through unchanged.
- `success` is a boolean on the backend (`is_true` on the SQL audit module),
  so it is filtered through a yes/no select that sends `1`/`0`, and rendered
  as a check/cross badge instead of the raw integer. `sig_check` and
  `missing_line` use the same badge with their `OK`/`FAIL` labels.
- Applied filters are listed as removable badges with a "Clear all" action; the
  `?serial`/`?user` deep links still seed the filters.

## Token Enrollment

`#/token/enroll/:realm/:user`, `#/token/rollover/:type/:serial` and
`#/token/wizard` are React-owned and share `features/tokens/enroll/
EnrollTokenPage.tsx`, the port of `token.enroll.html` and
`tokenEnrollController`. The page gets its mode from the route.

- Route handling: React Router matches `/token/enroll/*` and splits the
  splat into realm and user, because ui-router emits `#!/token/enroll//`
  for the parameterless state and `/token/enroll/realm/user` from the user
  details view.
- Form model (`enrollForm.ts`): fields the legacy controller preset from
  policies, the system config or the selected user are `null` until typed,
  and `resolveEnrollForm` fills the defaults from the current context. That
  replaces the `$watch`/`changeTokenType` presets without effects.
  `buildEnrollRequest` sends the common OTP settings with every type like
  the legacy form did, plus the type's own keys; `otpkey` is omitted when
  the server generates the key (the backend rejects both), the 4eyes realms
  go as the documented `realm:count,...` string, and validity dates use
  `formatValidityPeriod`.
- `TokenTypeFields.tsx` and `EnrolledTokenResult.tsx` are thin dispatchers
  over `enroll/fields/*` (inputs per topic: OTP key, contact, hardware,
  forwarding, certificate, secrets, questionnaire) and `enroll/results/*`
  (QR, OTP list with print, links, codes, certificate, FIDO). The page itself
  keeps the state and the mutations; the type-specific lookups
  (`useTypeLookups`), the `clientwait` polling (`useRolloutState`), the FIDO
  error texts (`useFidoErrorMessage`) and the smaller sections
  (`UserAssignmentFields`, `PinFields`, `ExtendedAttributesFields`,
  `EnrollmentSummary`) are their own modules.
- `TokenTypeHelp.tsx` is table-driven: the intro paragraphs are Lingui
  `msg` descriptors per type, the admin config hints a small table with the
  system config key that silences them. Message texts in `msg` templates
  must stay on one line, otherwise the extracted id changes and the German
  translation is lost.
- Second steps: the client part (`otpkeyformat=base32check`), the verify
  answer and the FIDO attestation all go through `POST /token/init` with the
  session's user/realm/PIN. `auth/webauthn.ts` ports
  `edumfa-webauthn.js`'s `register` (base64url helpers in `lib/base64url.ts`);
  `auth/u2f.ts` wraps the callback API of `contrib/js/u2f-api.js` in a
  promise. A token in `clientwait` is polled every 2.5 s through React
  Query's `refetchInterval` instead of `$timeout`.
- Bridge additions: the login response now also hands over
  `default_tokentype`, `require_description`, `show_seed`, `token_wizard`,
  the indexed secret policies and the authenticator app QR images
  (`useAuth().settings`), and `window.eduMfaLegacyAuth.logout()` runs the
  Angular logout for the wizard's "Logout" button.
- `GET /auth/rights` is typed as the `{type: description}` dict the
  backend actually returns; `enrollToken` reads the whole envelope because
  the enrollment data lives in `detail`.
- Deviations: the customizable wizard includes
  (`customize/views/includes/token.enroll.*.html`) are not in this
  repository and have no counterpart; certificate downloads use data URLs
  instead of Blob object URLs; the paper/TAN print window is filled through
  the DOM instead of `document.write`, and the OTP table rounds the row
  count up so no values are dropped; the unavailable default token type is
  reported as an inline alert instead of a growl.
- Lingui/ICU pitfall: an apostrophe directly before a placeholder
  (`'{0}'`) is ICU quoting and swallows the variable, so messages quote
  values with double quotes.

## Login

`#/login` (and the empty hash, ui-router's `initial_login` state),
`#/response`, `#/pinchange` and `#/offline` are React-owned
(`features/login/`). The session itself stays with Angular during
coexistence, because the still-Angular config routes, the idle lock, the
logout redirect and the welcome dialogs all live on the `mainController`.

- Handover: the React page posts `/auth` and gives the whole envelope to
  `window.eduMfaLegacyAuth.login()` (`AuthFactory.setLoginHandler` in
  `login/factories/auth.js`), which runs the legacy `do_login_stuff`: it
  stores the user, starts the idle timer, opens the dialogs and navigates to
  `/token` or `/dashboard`; the hidden `tokenController` then still moves on
  to the wizard or `/pinchange`. Without a bridge (tests, standalone) the
  React session is set from the response and `getStartRoute` picks the
  target (`features/login/loginFlow.ts`).
- Page settings (`REMOTE_USER`, `FORCE_REMOTE_USER`, `PASSWORD_RESET`,
  `HSM_READY`, `REALMS`, `LOGO`, `LOGIN_TEXT`) are read from the hidden
  inputs `webui/login.py` renders into `index.html`
  (`features/login/loginPageConfig.ts`), like the legacy controller did.
- Challenge response: `derivePendingChallenge` ports the `multi_challenge`
  handling (interactive input, polling, image, U2F/WebAuthn sign requests).
  The pending challenge and the PIN change notice live in a small external
  store (`loginFlowStore.ts`), because the legacy kept them on the
  `mainController` scope and the React pages are mounted per route.
  `/response` without a pending challenge points back to the login.
- Out-of-band tokens are polled through `GET /validate/polltransaction`
  every second (`usePollTransaction`, the `PollingAuthFactory` port); U2F
  and WebAuthn tokens are signed as soon as the response page mounts and
  again after a rejected answer (`auth/u2f.ts` `signU2fChallenge`,
  `auth/webauthn.ts` `signWebAuthnChallenge`, ports of
  `U2fFactory.sign_request` and `edumfa_webauthn.sign`). The FIDO error
  texts moved to `auth/useFidoErrorMessage.ts` with a ceremony parameter.
- PIN change: `setpin` with `otppin`, then the Angular logout through the
  bridge; the success notice travels through `lib/flash.ts` to the login
  page.
- Deviations: follow-up `/auth` posts (OTP, polled, FIDO) include the realm
  chosen in the dropdown, which the legacy controller dropped; the challenge
  message is shown as text (the legacy only used it as placeholder);
  WebAuthn assertion extensions are not sent (the legacy read a property
  browsers never set). The lock screen dialog and its unlock stay Angular.
- `LoginRequiredAlert` now links to `#!/login` instead of asking for the
  legacy UI.
