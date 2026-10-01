info:
	@echo "make clean        	 	- remove all automatically created files"
	@echo "make translate-frontend	- translate WebUI"
	@echo "make translate-backend 	- translate string in the server code."
	@echo "make update-contrib   	- update JS contrib libraries"


BUN_VERSION := $(shell bun --version 2>/dev/null)
UV_VERSION := $(shell uv --version 2>/dev/null)

clean:
	find . -name \*.pyc -exec rm {} \;
	rm -fr build/
	rm -fr dist/
	rm -fr cover
	rm -f .coverage
	(cd doc; make clean)

setversion:
	vim Makefile
	vim setup.py
	vim doc/conf.py
	vim Changelog
	@echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
	@echo "Please set a tag like:  git tag 3.17"

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
