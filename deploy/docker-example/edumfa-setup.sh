#!/usr/bin/bash

edumfa-manage -q resolver create_internal testresolver
edumfa-manage -q realm create testrealm testresolver

# Seed missing example policies without overwriting edits on restart.
edumfa-manage -q policy import -f /opt/edumfa/policy.py

