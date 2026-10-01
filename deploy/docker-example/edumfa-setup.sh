#!/usr/bin/bash

edumfa-manage -q resolver create_internal testresolver
edumfa-manage -q realm create testrealm testresolver

edumfa-manage -q config importer -i /opt/edumfa/policy.py

