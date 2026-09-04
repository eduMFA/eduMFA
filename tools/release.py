#!/usr/bin/env python3
"""Prepare and validate eduMFA releases."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from collections.abc import Sequence
from datetime import datetime
from pathlib import Path
from typing import NoReturn, cast

ROOT = Path(__file__).resolve().parent.parent
PYPROJECT = Path("pyproject.toml")
DOC_CONFIG = Path("doc/conf.py")
CHANGELOG = Path("doc/changelog.rst")
UBUNTU_CHANGELOG = Path("deploy/ubuntu/changelog")
UBUNTU_SERVER_CHANGELOG = Path("deploy/ubuntu-server/changelog")

FINAL_VERSION = re.compile(
    r"^(?P<major>0|[1-9]\d*)\.(?P<minor>0|[1-9]\d*)\.(?P<patch>0|[1-9]\d*)$"
)
DEVELOPMENT_VERSION = re.compile(
    r"^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)a\d*$"
)


class ReleaseError(Exception):
    """A release precondition was not met."""


def repository_path(relative_path: Path) -> Path:
    return ROOT / relative_path


def read_text(relative_path: Path) -> str:
    return repository_path(relative_path).read_text(encoding="utf-8")


def write_text(relative_path: Path, content: str) -> None:
    repository_path(relative_path).write_text(content, encoding="utf-8")


def run_git(arguments: Sequence[str], *, capture_output: bool = False) -> str:
    result = subprocess.run(
        ["git", *arguments],
        cwd=ROOT,
        check=True,
        text=True,
        capture_output=capture_output,
    )
    return result.stdout.strip() if capture_output else ""


def require_final_version(version: str) -> re.Match[str]:
    match = FINAL_VERSION.fullmatch(version)
    if match is None:
        raise ReleaseError(f"Expected a final version such as 2.10.0, got {version!r}")
    return match


def require_development_version(version: str) -> None:
    if DEVELOPMENT_VERSION.fullmatch(version) is None:
        raise ReleaseError(
            f"Expected an alpha development version such as 2.11.0a, got {version!r}"
        )


def replace_once(relative_path: Path, pattern: str, replacement: str) -> None:
    content = read_text(relative_path)
    updated, count = re.subn(pattern, replacement, content, count=1, flags=re.MULTILINE)
    if count != 1:
        raise ReleaseError(
            f"Could not find exactly one version field in {relative_path}"
        )
    write_text(relative_path, updated)


def set_python_versions(version: str) -> None:
    replace_once(PYPROJECT, r'^version = "[^"]+"$', f'version = "{version}"')
    replace_once(DOC_CONFIG, r'^version = "[^"]+"$', f'version = "{version}"')
    replace_once(
        DOC_CONFIG, r'^release = (?:version|"[^"]+")$', f'release = "{version}"'
    )


def changelog_anchor(version: str) -> str:
    return f"edumfa-{version.replace('.', '-')}"


def require_changelog_section(version: str) -> None:
    heading = f"eduMFA {version}"
    lines = read_text(CHANGELOG).splitlines()
    for index, line in enumerate(lines[:-1]):
        if line == heading and lines[index + 1] and set(lines[index + 1]) == {"-"}:
            return
    raise ReleaseError(
        f"Add the {heading!r} section to {CHANGELOG} before preparing the release"
    )


def debian_timestamp() -> str:
    return datetime.now().astimezone().strftime("%a, %-d %b %Y %H:%M:%S %z")


def prepend_ubuntu_changelogs(version: str) -> None:
    timestamp = debian_timestamp()
    core_entry = (
        f"edumfa ({version}{{{{CODENAME}}}}) {{{{CODENAME}}}}; urgency=high\n\n"
        f"  * See the changelog for the {version} release at:\n"
        f"    https://edumfa.readthedocs.io/en/latest/changelog.html#{changelog_anchor(version)}\n\n"
        f" -- eduMFA <edumfa-dev@listserv.dfn.de>  {timestamp}\n\n"
    )
    server_entry = (
        f"edumfa-server ({version}{{{{CODENAME}}}}) {{{{CODENAME}}}}; urgency=high\n\n"
        "  * Update version number.\n\n"
        f" -- eduMFA <edumfa-dev@listserv.dfn.de>  {timestamp}\n\n"
    )
    write_text(UBUNTU_CHANGELOG, core_entry + read_text(UBUNTU_CHANGELOG))
    write_text(
        UBUNTU_SERVER_CHANGELOG, server_entry + read_text(UBUNTU_SERVER_CHANGELOG)
    )


def refresh_lock() -> None:
    subprocess.run(["uv", "lock"], cwd=ROOT, check=True)


def project_version() -> str:
    match = re.search(r'^version = "([^"]+)"$', read_text(PYPROJECT), re.MULTILINE)
    if match is None:
        raise ReleaseError("project.version is missing from pyproject.toml")
    return match.group(1)


def locked_project_version() -> str:
    match = re.search(
        r'^\[\[package\]\]\nname = "edumfa"\nversion = "([^"]+)"$',
        read_text(Path("uv.lock")),
        re.MULTILINE,
    )
    if match is None:
        raise ReleaseError("The eduMFA package version is missing from uv.lock")
    return match.group(1)


def configured_doc_versions() -> tuple[str, str]:
    content = read_text(DOC_CONFIG)
    version_match = re.search(r'^version = "([^"]+)"$', content, re.MULTILINE)
    release_match = re.search(r'^release = "([^"]+)"$', content, re.MULTILINE)
    if version_match is None or release_match is None:
        raise ReleaseError(
            "doc/conf.py must contain literal version and release values"
        )
    return version_match.group(1), release_match.group(1)


def check_release(version: str) -> None:
    require_final_version(version)
    require_changelog_section(version)
    values = {
        "pyproject.toml": project_version(),
        "uv.lock": locked_project_version(),
        "doc/conf.py version": configured_doc_versions()[0],
        "doc/conf.py release": configured_doc_versions()[1],
    }
    mismatches = [
        f"{name}: {value}" for name, value in values.items() if value != version
    ]
    expected_core = f"edumfa ({version}{{{{CODENAME}}}})"
    expected_server = f"edumfa-server ({version}{{{{CODENAME}}}})"
    if not read_text(UBUNTU_CHANGELOG).startswith(expected_core):
        mismatches.append(f"{UBUNTU_CHANGELOG}: does not start with {expected_core!r}")
    if not read_text(UBUNTU_SERVER_CHANGELOG).startswith(expected_server):
        mismatches.append(
            f"{UBUNTU_SERVER_CHANGELOG}: does not start with {expected_server!r}"
        )
    if mismatches:
        raise ReleaseError(
            "Release versions are inconsistent:\n  " + "\n  ".join(mismatches)
        )
    print(f"Release {version} is consistent.")


def prepare_release(version: str) -> None:
    require_final_version(version)
    require_changelog_section(version)
    expected_core = f"edumfa ({version}{{{{CODENAME}}}})"
    expected_server = f"edumfa-server ({version}{{{{CODENAME}}}})"
    core_prepared = read_text(UBUNTU_CHANGELOG).startswith(expected_core)
    server_prepared = read_text(UBUNTU_SERVER_CHANGELOG).startswith(expected_server)
    if core_prepared != server_prepared:
        raise ReleaseError(
            "Only one Ubuntu changelog contains the release; repair them before continuing"
        )
    set_python_versions(version)
    if not core_prepared:
        prepend_ubuntu_changelogs(version)
    refresh_lock()
    check_release(version)
    print("Review and commit the release changes, then run:")
    print(f"  make tag-release VERSION={version}")


def prepare_fix_release(version: str, commits: Sequence[str]) -> None:
    match = require_final_version(version)
    if int(match.group("patch")) == 0:
        raise ReleaseError("A fix release must have a non-zero patch version")
    expected_branch = f"v{match.group('major')}.{match.group('minor')}.x"
    branch = run_git(["branch", "--show-current"], capture_output=True)
    if branch != expected_branch:
        raise ReleaseError(
            f"Fix release {version} must be prepared on {expected_branch}, not {branch}"
        )
    if not commits:
        raise ReleaseError("At least one commit is required for a fix release")
    if run_git(["status", "--porcelain"], capture_output=True):
        raise ReleaseError("The working tree must be clean before cherry-picking fixes")
    for commit in commits:
        run_git(["merge-base", "--is-ancestor", commit, "main"])
    run_git(["cherry-pick", *commits])
    prepare_release(version)


def start_development(version: str) -> None:
    require_development_version(version)
    set_python_versions(version)
    refresh_lock()
    print(f"Development version changed to {version}.")


def tag_release(version: str) -> None:
    check_release(version)
    match = require_final_version(version)
    branch = run_git(["branch", "--show-current"], capture_output=True)
    expected_branch = (
        "main"
        if int(match.group("patch")) == 0
        else f"v{match.group('major')}.{match.group('minor')}.x"
    )
    if branch != expected_branch:
        raise ReleaseError(
            f"Release {version} must be tagged on {expected_branch}, not {branch}"
        )
    if run_git(["status", "--porcelain"], capture_output=True):
        raise ReleaseError("Commit the release changes before creating the tag")
    head = run_git(["rev-parse", "HEAD"], capture_output=True)
    remote_branch = run_git(
        ["ls-remote", "--heads", "origin", f"refs/heads/{expected_branch}"],
        capture_output=True,
    )
    remote_head = remote_branch.partition("\t")[0]
    if not remote_head:
        raise ReleaseError(f"Branch {expected_branch} does not exist on origin")
    if head != remote_head:
        raise ReleaseError(
            f"HEAD is not the published tip of origin/{expected_branch}; push or update the branch first"
        )
    tag = f"v{version}"
    local_tag = run_git(["tag", "--list", tag], capture_output=True)
    remote_tag = run_git(
        ["ls-remote", "--tags", "origin", f"refs/tags/{tag}"], capture_output=True
    )
    if local_tag or remote_tag:
        raise ReleaseError(f"Tag {tag} already exists")
    run_git(["tag", tag])
    print(f"Created {tag} at the current commit. Review it, then publish with:")
    print(f"  git push origin {tag}")


def create_fix_branch(version: str) -> None:
    match = require_final_version(version)
    if int(match.group("patch")) != 0:
        raise ReleaseError("Create a fix branch from a major or minor X.Y.0 release")
    tag = f"v{version}"
    branch = f"v{match.group('major')}.{match.group('minor')}.x"
    if not run_git(["tag", "--list", tag], capture_output=True):
        raise ReleaseError(f"Release tag {tag} does not exist locally")
    if run_git(["branch", "--list", branch], capture_output=True):
        raise ReleaseError(f"Branch {branch} already exists locally")
    if run_git(
        ["ls-remote", "--heads", "origin", f"refs/heads/{branch}"],
        capture_output=True,
    ):
        raise ReleaseError(f"Branch {branch} already exists on origin")
    run_git(["branch", branch, tag])
    print(f"Created {branch} from {tag}. Review it, then publish with:")
    print(f"  git push origin {branch}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    for command in (
        "prepare",
        "check",
        "tag",
        "create-fix-branch",
        "start-development",
    ):
        command_parser = subparsers.add_parser(command)
        command_parser.add_argument("--version", required=True)
    fix_parser = subparsers.add_parser("prepare-fix")
    fix_parser.add_argument("--version", required=True)
    fix_parser.add_argument("--commits", required=True)
    return parser


def fail(message: str) -> NoReturn:
    print(f"release: error: {message}", file=sys.stderr)
    raise SystemExit(2)


def main(arguments: Sequence[str] | None = None) -> int:
    namespace = build_parser().parse_args(arguments)
    command = cast(str, namespace.command)
    version = cast(str, namespace.version)
    try:
        if command == "prepare":
            prepare_release(version)
        elif command == "prepare-fix":
            prepare_fix_release(version, cast(str, namespace.commits).split())
        elif command == "check":
            check_release(version)
        elif command == "tag":
            tag_release(version)
        elif command == "create-fix-branch":
            create_fix_branch(version)
        elif command == "start-development":
            start_development(version)
        else:
            fail(f"Unknown command {command!r}")
    except (ReleaseError, subprocess.CalledProcessError) as error:
        fail(str(error))
    return 0


if __name__ == "__main__":
    sys.exit(main())
