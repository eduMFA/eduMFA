#
# License:  AGPLv3
# This file is part of eduMFA. eduMFA is a fork of privacyIDEA which was forked from LinOTP.
# Copyright (c) 2024 eduMFA Project-Team
# Previous authors by privacyIDEA project:
#
# 2021 Paul Lettich <paul.lettich@netknights.it>
#
# (c) Cornelius Kölbel
#
# This code is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# any later version.
#
# This code is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

"""
This module provides the functionality to register export or import functions
for separate parts of the eduMFA server configuration.
"""

import sys

EXPORT_FUNCTIONS = {}
IMPORT_FUNCTIONS = {}


def register_export(name=None):
    """
    This decorator is supposed to decorate a function that exports the
    configuration data from a given module like resolvers, realms, events, ...

    The decorated exporter function needs to return a dictionary which contains
    all the necessary data to (re-)create that module.

    :param name: The name with which the function will be registered.
                 If omitted, the name of the module will be used.
    :type name: str

    ** Usage**:

        .. sourcecode:: python

            @register_export
            def export_events():
                # implement export functionality here
                return dict

    """

    def wrapped(func):
        exp_name = name
        if not exp_name:
            exp_name = func.__module__.split(".")[-1]
        if exp_name in EXPORT_FUNCTIONS:
            print(
                f"Exporter function with name '{exp_name}' already exists! "
                f"Overwriting {EXPORT_FUNCTIONS[exp_name]} with {func}",
                file=sys.stderr,
            )
        EXPORT_FUNCTIONS[exp_name] = func
        return func

    return wrapped


def register_import(name=None, prio=99):
    """
    This decorator is supposed to decorate a function that imports the
    configuration data for a given module like resolvers, realms, events, ...

    The decorated importer function takes a dictionary which contains
    the data necessary to (re-)create that module.

    Some modules require that other modules already exists (like realms need
    existing resolvers). To ensure the order of the import, a priority can be
    assigned to the registered importer function (lower comes first).

    :param name: The name with which the function will be registered.
                 If omitted, the name of the module will be used.
    :type name: str
    :param prio: The priority of the importer function, default is 99.
    :type prio: int

    ** Usage**:

        .. sourcecode:: python

            @register_import(prio=10)
            def import_events(dict):
                # implement import functionality here

    """

    def wrapped(func):
        imp_name = name
        if not imp_name:
            imp_name = func.__module__.split(".")[-1]
        if imp_name in IMPORT_FUNCTIONS:
            print(
                f"Importer function with name '{imp_name}' already exists! "
                f"Overwriting {IMPORT_FUNCTIONS[imp_name]} with {func}",
                file=sys.stderr,
            )
        IMPORT_FUNCTIONS[imp_name] = {"prio": prio, "func": func}
        return func

    return wrapped
