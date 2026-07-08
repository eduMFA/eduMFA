# Frontend Migration Inventory

This document tracks AngularJS route ownership during the React + TypeScript
migration. Angular remains the default owner unless a route is explicitly listed
as React-owned and enabled by the Flask `EDUMFA_REACT_UI` flag.

## Runtime Shell

- Flask/Jinja renders the application shell from `edumfa/templates/index.html`.
- AngularJS owns the legacy `ui-view` and hash routes by default.
- React mounts into `#react-root` only when enabled by Flask config.
- React uses `HashRouter` and an allowlist so Flask does not need history-route
  catch-all behavior during coexistence.
- React internationalization uses Lingui catalogs and `Trans` macros. Angular
  gettext remains in place for legacy routes until Angular is removed.
- Authentication is still initiated by Angular. React reads the in-memory legacy
  auth bridge when a migrated route calls the same Flask APIs.

## Current Angular Route Ownership

| Hash route                          | Angular state          | Current owner | Migration complexity | Notes                                                  |
| ----------------------------------- | ---------------------- | ------------- | -------------------- | ------------------------------------------------------ |
| `#/offline`                         | `offline`              | Angular       | Low                  | Static/offline shell.                                  |
| `#/login`                           | `login`                | Angular       | Medium               | Auth, WebAuthn/U2F, polling, policies.                 |
| `#/response`                        | `response`             | Angular       | Medium               | Challenge response flow.                               |
| `#/pinchange`                       | `pinchange`            | Angular       | Medium               | Authenticated form flow.                               |
| `#/register`                        | `register`             | Angular       | Low                  | Good early public-form migration candidate.            |
| `#/recovery`                        | `recovery`             | Angular       | Low                  | Public form and API error handling.                    |
| `#/reset/:user/:recoverycode`       | `reset`                | Angular       | Low                  | Public recovery form.                                  |
| `#/dashboard`                       | `dashboard`            | Angular       | Medium               | Aggregated API state.                                  |
| `#/component/clienttype`            | `component.clienttype` | React         | Low                  | First migrated route. Calls `/client/`.                |
| `#/audit/log`                       | `audit.log`            | Angular       | Medium               | Table filters, query params, CSV/export behavior.      |
| `#/user/list`                       | `user.list`            | Angular       | Medium               | Shared table and permission behavior.                  |
| `#/user/details/:realm/:user`       | `user.details`         | Angular       | Medium               | Detail view, token links, resolver metadata.           |
| `#/user/password`                   | `user.password`        | Angular       | Medium               | Authenticated form and policy behavior.                |
| `#/user/add`                        | `user.add`             | Angular       | Medium               | Form validation and resolver metadata.                 |
| `#/machine/list`                    | `machine.list`         | Angular       | Medium               | Shared list, filters, resolver metadata.               |
| `#/machine/details/:id/:resolver`   | `machine.details`      | Angular       | Medium               | Detail view and assignment flows.                      |
| `#/token/list`                      | `token.list`           | Angular       | Medium               | Shared table, action menus, rights checks.             |
| `#/token/assign`                    | `token.assign`         | Angular       | Medium               | User/token selector directives.                        |
| `#/token/details/:serial`           | `token.details`        | Angular       | High                 | Many action states, blobs, policy checks.              |
| `#/token/lost/:serial`              | `token.lost`           | Angular       | High                 | Token lifecycle action flow.                           |
| `#/token/getserial`                 | `token.getserial`      | Angular       | Medium               | Form + token lookup.                                   |
| `#/token/enroll/:realm/:user`       | `token.enroll`         | Angular       | High                 | Token type matrix, WebAuthn/U2F, certificates.         |
| `#/token/rollover/:type/:serial`    | `token.rollover`       | Angular       | High                 | Reuses enroll controller and token metadata.           |
| `#/token/wizard`                    | `token.wizard`         | Angular       | High                 | Policy-dependent token enrollment.                     |
| `#/token/import`                    | `token.import`         | Angular       | High                 | Uploads and token format handling.                     |
| `#/token/challenges`                | `token.challenges`     | Angular       | Medium               | Polling/table state.                                   |
| `#/token/applications/:application` | `token.applications`   | Angular       | Medium               | Application-specific token details.                    |
| `#/config/**`                       | `config.*`             | Angular       | High                 | Broad admin surface, policy/event/resolver complexity. |

## Current API Factory Ownership

| Angular factory                          | Primary concern                        | React target                           |
| ---------------------------------------- | -------------------------------------- | -------------------------------------- |
| `AuthFactory`                            | Login session, rights, menus, settings | `auth/AuthProvider.tsx`, `api/auth.ts` |
| `PollingAuthFactory`                     | Polling auth responses                 | Auth feature hooks                     |
| `U2fFactory`, WebAuthn factory           | Browser auth hardware flows            | `auth/u2f.ts`, `auth/webauthn.ts`      |
| `TokenFactory`, `ValidateFactory`        | Token lifecycle and validation         | `api/tokens.ts` + feature hooks        |
| `UserFactory`                            | User list/detail/password APIs         | `api/users.ts`                         |
| `MachineFactory`                         | Machine resolver/list/detail APIs      | `api/machines.ts`                      |
| `AuditFactory`                           | Audit log and CSV APIs                 | `api/audit.ts`                         |
| `ConfigFactory`, `PolicyTemplateFactory` | Admin config APIs                      | `api/config.ts`                        |
| `ComponentFactory`                       | Client application types               | `api/component.ts`                     |
| `RegisterFactory`, `RecoveryFactory`     | Public account flows                   | `api/register.ts`, `api/recovery.ts`   |

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
