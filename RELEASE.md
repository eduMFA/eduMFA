# Making an eduMFA release

This document is the release checklist for eduMFA maintainers. The release
tooling is exposed through `make`; run `make info` to list the available
commands.

The examples use:

- `X.Y.Z` for the release version;
- `vX.Y.Z` for its Git tag;
- `vX.Y.x` for the corresponding fix branch; and
- `PREVIOUS` for the preceding release tag.

## What the tooling does

The Make targets automate repeatable repository changes and reject inconsistent
release state:

| Command | Purpose |
| --- | --- |
| `make prepare-release VERSION=X.Y.Z` | Update release versions, Ubuntu changelogs, and `uv.lock`, then check consistency |
| `make prepare-fix-release VERSION=X.Y.Z COMMITS="sha1 sha2"` | Verify the fix branch, cherry-pick approved commits, and prepare the release |
| `make check-release VERSION=X.Y.Z` | Check the changelog and every release version without changing files |
| `make tag-release VERSION=X.Y.Z` | Check the release and create a local tag at the published branch tip |
| `make create-fix-branch VERSION=X.Y.0` | Create a local `vX.Y.x` branch from the local release tag |
| `make start-development VERSION=X.Y.Za` | Set the next development version and refresh `uv.lock` |

The tooling does **not** write release notes, resolve cherry-pick conflicts,
commit changes, push branches or tags, publish artifacts, or announce a
release. These remain deliberate maintainer actions.

## Before every release

1. Assign all intended issues to the release milestone.
2. Confirm that no release blockers remain and all required migrations are
   included.
3. Add an `eduMFA X.Y.Z` section to `doc/changelog.rst`. Include user-visible
   changes, upgrade warnings, permitted security information, and a comparison
   link from `PREVIOUS` to `vX.Y.Z`.
4. Have another maintainer review the scope and release notes.

The changelog must exist before running a preparation target. For a major or
minor release it may be an uncommitted local change. For a fix release it must
already be committed on `vX.Y.x` or be included in one of the commits selected
for cherry-picking, because fix preparation starts from a clean working tree.

## Major or minor release

Major and minor releases are prepared on `main`.

### 1. Prepare the release

Update local `main`, write the changelog, and run:

```console
$ git switch main
$ git pull --ff-only origin main
$ make prepare-release VERSION=X.Y.0
$ git diff
```

`prepare-release` performs the following changes:

- sets `project.version` in `pyproject.toml`;
- sets `version` and `release` in `doc/conf.py`;
- prepends entries to `deploy/ubuntu/changelog` and
  `deploy/ubuntu-server/changelog`;
- refreshes `uv.lock`; and
- verifies that these versions and the changelog agree.

The `edumfa-radius` Debian package has an independent version. Update
`deploy/ubuntu-radius/changelog` manually only when that package itself is
released.

Review the diff, run the normal lint and test suites, and build and inspect the
documentation and distribution artifacts. Then create a release commit and
push it through the normal review process:

```console
$ git commit -am "chore(release): prepare X.Y.0 release"
$ git push
```

Before tagging, the reviewed release commit must be the tip of `origin/main`.

### 2. Check and tag

```console
$ git switch main
$ git pull --ff-only origin main
$ make check-release VERSION=X.Y.0
$ make tag-release VERSION=X.Y.0
$ git push origin vX.Y.0
```

`tag-release` creates the tag locally. It refuses to tag a dirty tree, the
wrong branch, an unpublished branch tip, inconsistent versions, or an existing
tag. The final `git push` is intentionally manual because it starts publication.

### 3. Create the fix branch

If the release series will receive fixes, create its maintenance branch from
the release tag before changing the version on `main`:

```console
$ make create-fix-branch VERSION=X.Y.0
$ git push origin vX.Y.x
```

### 4. Start the next development cycle

Switch back to `main` and move it to the next minor alpha version. For example,
after releasing `2.9.0`, continue as `2.10.0a`:

```console
$ git switch main
$ make start-development VERSION=2.10.0a
$ git diff
$ git commit -am "chore: start 2.10 development"
$ git push
```

Do not apply the development-version bump to `vX.Y.x`.

## Fix release

Fixes are developed and reviewed on `main`, then selected commits are
cherry-picked into `vX.Y.x`. Only include fixes approved for the release, in
dependency order. Avoid unrelated refactors and dependency updates.

### 1. Prepare the fix branch

Ensure the changelog is committed on the fix branch or included in the selected
commits. Start from a clean and current maintenance branch:

```console
$ git switch vX.Y.x
$ git pull --ff-only origin vX.Y.x
$ git status --short
$ make prepare-fix-release VERSION=X.Y.Z COMMITS="sha1 sha2"
$ git diff
```

The target verifies that `Z` is non-zero, the current branch is `vX.Y.x`, the
working tree is clean, and every selected commit belongs to `main`. It then
cherry-picks the commits in the supplied order and performs the same preparation
and consistency checks as `prepare-release`.

If a cherry-pick conflicts, the command stops. Resolve or abort the cherry-pick
using Git; after resolving it, run `make prepare-release VERSION=X.Y.Z` to
finish the version preparation. Do not repeat `prepare-fix-release`, because
that would attempt to cherry-pick the commits again.

Review and test the complete branch, not only its individual commits. Commit
the generated release changes and push them through the normal review process:

```console
$ git commit -am "chore(release): prepare X.Y.Z release"
$ git push
```

### 2. Check and tag

After the reviewed release commit is the tip of `origin/vX.Y.x`:

```console
$ git switch vX.Y.x
$ git pull --ff-only origin vX.Y.x
$ make check-release VERSION=X.Y.Z
$ make tag-release VERSION=X.Y.Z
$ git push origin vX.Y.Z
```

A fix release does not require a development-version bump on `main`.

## Publication and verification

Pushing `vX.Y.Z` starts the existing GitHub Actions workflows:

| Workflow | Published artifacts |
| --- | --- |
| `publish` | Wheel and source archive on the GitHub release and PyPI |
| `docker` | Multi-architecture image on GHCR |
| `ubuntu` | Ubuntu packages for the supported releases in the package repository |

Do not announce the release until all tag-triggered runs and artifacts have
been checked:

1. Confirm that `publish`, `docker`, and `ubuntu` succeeded for the tag.
2. Review the GitHub release notes and verify both Python distribution files.
3. Confirm that `edumfa==X.Y.Z` can be installed from PyPI.
4. Pull `ghcr.io/edumfa/edumfa:X.Y.Z` and check its application version.
5. Test the Ubuntu packages for every supported repository, including a fresh
   installation and an upgrade from the preceding release.
6. Confirm that Read the Docs built `vX.Y.Z` and rendered the changelog and
   upgrade instructions correctly.
7. Open the [eduMFA documentation landing page](https://edumfa.readthedocs.io/)
   and confirm that it redirects to `/en/vX.Y.Z/` and displays
   `eduMFA X.Y.Z documentation`. If it still points to the previous release,
   update the default version in Read the Docs before announcing the release.
8. Close the milestone and announce the release through the usual channels.

If publication fails transiently, re-run only the failed job and repeat the
verification. PyPI releases and container tags may already be public when a
later job fails. Never move a published tag or replace a published artifact;
fix a release defect with a new fix release.
