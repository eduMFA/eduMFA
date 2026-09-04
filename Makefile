info:
	@echo "make clean        	 	- remove all automatically created files"
	@echo "make translate-frontend	- translate WebUI"
	@echo "make translate-backend 	- translate string in the server code."
	@echo "make update-contrib   	- update JS contrib libraries"
	@echo "make prepare-release VERSION=X.Y.Z"
	@echo "make prepare-fix-release VERSION=X.Y.Z COMMITS='sha1 sha2'"
	@echo "make check-release VERSION=X.Y.Z"
	@echo "make tag-release VERSION=X.Y.Z"
	@echo "make create-fix-branch VERSION=X.Y.0"
	@echo "make start-development VERSION=X.Y.Za"


BUN_VERSION := $(shell bun --version 2>/dev/null)
UV_VERSION := $(shell uv --version 2>/dev/null)

clean:
	find . -name \*.pyc -exec rm {} \;
	rm -fr build/
	rm -fr dist/
	rm -fr cover
	rm -f .coverage
	(cd doc; make clean)

.PHONY: prepare-release prepare-fix-release check-release tag-release create-fix-branch start-development

prepare-release: check-uv
	@test -n "$(VERSION)" || (echo "VERSION is required, for example VERSION=2.10.0"; exit 2)
	uv run --no-sync python tools/release.py prepare --version "$(VERSION)"

prepare-fix-release: check-uv
	@test -n "$(VERSION)" || (echo "VERSION is required, for example VERSION=2.9.4"; exit 2)
	@test -n "$(COMMITS)" || (echo "COMMITS is required, for example COMMITS='abc123 def456'"; exit 2)
	uv run --no-sync python tools/release.py prepare-fix --version "$(VERSION)" --commits "$(COMMITS)"

check-release: check-uv
	@test -n "$(VERSION)" || (echo "VERSION is required, for example VERSION=2.10.0"; exit 2)
	uv run --no-sync python tools/release.py check --version "$(VERSION)"

tag-release: check-uv
	@test -n "$(VERSION)" || (echo "VERSION is required, for example VERSION=2.10.0"; exit 2)
	uv run --no-sync python tools/release.py tag --version "$(VERSION)"

create-fix-branch: check-uv
	@test -n "$(VERSION)" || (echo "VERSION is required, for example VERSION=2.10.0"; exit 2)
	uv run --no-sync python tools/release.py create-fix-branch --version "$(VERSION)"

start-development: check-uv
	@test -n "$(VERSION)" || (echo "VERSION is required, for example VERSION=2.11.0a"; exit 2)
	uv run --no-sync python tools/release.py start-development --version "$(VERSION)"

doc-man:
	(cd doc; make man)

doc-html:
	(cd doc; make html)


check-uv:
ifeq ($(UV_VERSION),)
	@echo "uv is not installed. Follow https://docs.astral.sh/uv/getting-started/installation/ to install it."
	@exit 1
endif

translate-backend: check-uv
	(cd edumfa; uv run pybabel extract --add-location=file -F babel.cfg -o translations/messages.pot .)
	# Normalize POT-Creation-Date after update (cross-platform sed)
	(cd edumfa/translations; sed -i.bak 's/^"POT-Creation-Date:.*"/"POT-Creation-Date: 1970-01-01 00:00+0000\\n"/' messages.pot && rm -f messages.pot.bak)
	# pybabel init -i messages.pot -d translations -l de
	(cd edumfa; uv run pybabel update -i translations/messages.pot -d translations)
	# create the .mo file
	(cd edumfa; uv run pybabel compile -d translations)

translate-frontend:
ifdef BUN_VERSION
	(cd edumfa/static && bun install && bun run translate)
else
	@echo "Bun is not installed. Follow https://bun.com/docs/installation to install it."
	@echo "Skipping frontend translation."
endif

update-contrib:
ifdef BUN_VERSION
	(cd edumfa/static && bun install && ./update_contrib.sh)
else
	@echo "Bun is not installed. Follow https://bun.com/docs/installation to install it."
	@echo "Skipping update of JS contrib libraries."
endif
