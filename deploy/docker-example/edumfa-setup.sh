#!/bin/bash

edumfa-manage config import full -f /opt/edumfa/policy.conf
edumfa-manage realm create userless openldap