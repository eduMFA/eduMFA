from __future__ import annotations

import importlib.util
from pathlib import Path
from types import ModuleType

import pytest


def load_release_module() -> ModuleType:
    script = Path(__file__).parents[1] / "tools" / "release.py"
    spec = importlib.util.spec_from_file_location("release_tool", script)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.fixture
def release_tool(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> ModuleType:
    module = load_release_module()
    monkeypatch.setattr(module, "ROOT", tmp_path)
    files = {
        "pyproject.toml": '[project]\nname = "edumfa"\nversion = "2.10.0a"\n',
        "uv.lock": '[[package]]\nname = "edumfa"\nversion = "2.10.0a0"\n',
        "doc/conf.py": 'version = "2.10.0"\nrelease = "2.10.0a"\n',
        "doc/changelog.rst": "eduMFA 2.10.0\n----------------\n\nHighlights\n",
        "deploy/ubuntu/changelog": "edumfa (2.9.3{{CODENAME}}) {{CODENAME}}; urgency=high\n",
        "deploy/ubuntu-server/changelog": (
            "edumfa-server (2.9.3{{CODENAME}}) {{CODENAME}}; urgency=high\n"
        ),
    }
    for relative_path, content in files.items():
        destination = tmp_path / relative_path
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(content, encoding="utf-8")

    def refresh_lock() -> None:
        version = module.project_version()
        module.write_text(
            Path("uv.lock"),
            f'[[package]]\nname = "edumfa"\nversion = "{version}"\n',
        )

    monkeypatch.setattr(module, "refresh_lock", refresh_lock)
    return module


def test_prepare_release_updates_every_version(release_tool: ModuleType) -> None:
    release_tool.prepare_release("2.10.0")

    assert release_tool.project_version() == "2.10.0"
    assert release_tool.configured_doc_versions() == ("2.10.0", "2.10.0")
    assert release_tool.read_text(release_tool.UBUNTU_CHANGELOG).startswith(
        "edumfa (2.10.0{{CODENAME}})"
    )
    assert release_tool.read_text(release_tool.UBUNTU_SERVER_CHANGELOG).startswith(
        "edumfa-server (2.10.0{{CODENAME}})"
    )


def test_prepare_release_can_be_repeated_without_duplicate_entries(
    release_tool: ModuleType,
) -> None:
    release_tool.prepare_release("2.10.0")
    release_tool.prepare_release("2.10.0")

    assert (
        release_tool.read_text(release_tool.UBUNTU_CHANGELOG).count(
            "edumfa (2.10.0{{CODENAME}})"
        )
        == 1
    )


def test_prepare_release_requires_changelog_section(release_tool: ModuleType) -> None:
    release_tool.write_text(release_tool.CHANGELOG, "Changelog\n=========\n")

    with pytest.raises(
        release_tool.ReleaseError, match="Add the 'eduMFA 2.10.0' section"
    ):
        release_tool.prepare_release("2.10.0")


@pytest.mark.parametrize("version", ["2.10", "v2.10.0", "2.10.0a"])
def test_final_version_is_strict(release_tool: ModuleType, version: str) -> None:
    with pytest.raises(release_tool.ReleaseError):
        release_tool.require_final_version(version)


def test_development_version_must_be_alpha(release_tool: ModuleType) -> None:
    with pytest.raises(release_tool.ReleaseError):
        release_tool.start_development("2.11.0")


def test_fix_release_must_be_tagged_on_maintenance_branch(
    release_tool: ModuleType, monkeypatch: pytest.MonkeyPatch
) -> None:
    release_tool.write_text(
        release_tool.CHANGELOG,
        "eduMFA 2.10.1\n----------------\n\nBug Fixes\n",
    )
    release_tool.prepare_release("2.10.1")

    def fake_git(arguments: list[str], *, capture_output: bool = False) -> str:
        del capture_output
        if arguments == ["branch", "--show-current"]:
            return "main"
        return ""

    monkeypatch.setattr(release_tool, "run_git", fake_git)

    with pytest.raises(release_tool.ReleaseError, match="must be tagged on v2.10.x"):
        release_tool.tag_release("2.10.1")


def test_create_fix_branch_uses_release_tag(
    release_tool: ModuleType, monkeypatch: pytest.MonkeyPatch
) -> None:
    calls: list[list[str]] = []

    def fake_git(arguments: list[str], *, capture_output: bool = False) -> str:
        del capture_output
        calls.append(arguments)
        if arguments == ["tag", "--list", "v2.10.0"]:
            return "v2.10.0"
        return ""

    monkeypatch.setattr(release_tool, "run_git", fake_git)

    release_tool.create_fix_branch("2.10.0")

    assert ["branch", "v2.10.x", "v2.10.0"] in calls
