# -*- coding: utf-8 -*-
#
# License:  AGPLv3
# This file is part of eduMFA. eduMFA is a fork of privacyIDEA which was forked from LinOTP.
# Copyright (c) 2024 eduMFA Project-Team
#
# This code is free software; you can redistribute it and/or
# modify it under the terms of the GNU AFFERO GENERAL PUBLIC LICENSE
# License as published by the Free Software Foundation; either
# version 3 of the License, or any later version.
#
# This code is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU AFFERO GENERAL PUBLIC LICENSE for more details.
#
# You should have received a copy of the GNU Affero General Public
# License along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
import ast
import sys

import click
from edumfa.lib.policy import set_policy, delete_policy, PolicyClass

from edumfa.lib.event import set_event, delete_event
from edumfa.lib.resolver import get_resolver_list, save_resolver

DEFAULT_CONFTYPE_LIST = ("policy", "resolver", "event")


def conf_import(file=None, conftype=None):
    """
    import eduMFA configuration from file
    """
    if file is None:
        file = sys.stdin

    contents = file.read()

    contents_var = ast.literal_eval(contents)

    # be backwards-compatible. In old versions of edumfa-manage config were exported to
    # individual files as python list without dict key
    if isinstance(contents_var, list):
        conftype_list = [conftype]
        contents_var = {conftype: contents_var}
    else:
        if conftype:
            conftype_list = [conftype]
        else:
            conftype_list = list(contents_var.keys())

    for conftype in conftype_list:
        click.echo("Importing {0!s} from {1!s}".format(conftype, file.name))
    return contents_var


def conf_export(config, file):
    """
    Export configurations to a file or write them to stdout if no filename is given.
    """
    import pprint
    pp = pprint.PrettyPrinter(indent=4)

    ret_str = pp.pformat(config)
    file.write(ret_str)


def get_conf_policy(name=None):
    """ helper function for conf_export """
    pol_cls = PolicyClass()
    return pol_cls.list_policies(name=name)


def import_conf_policy(config_list, cleanup=False, update=False, purge=False):
    """
    import policy configuration from a policy list
    """

    cls = PolicyClass()

    if cleanup:
        click.echo("Cleanup old policies.")
        policies = cls.list_policies()
        for policy in policies:
            name = policy.get("name")
            r = delete_policy(name)
            click.echo(f"Deleted policy {name!s} with result {r!s}")
    if purge:
        if cleanup:
            click.echo("Cleanup was performed before - nothing to purge here.")
        else:
            stored_names = [x.get("name") for x in cls.list_policies()]
            import_names = [x.get("name") for x in config_list]

            for stored in stored_names:
                if stored not in import_names:
                    try:
                        r = delete_policy(stored)
                        click.echo(f"Purged policy {stored!s} with result {r!s}")
                    except Exception as ex:
                        click.echo(f"Purged policy {stored!s} failed with error {ex}")

    for policy in config_list:
        action_str = "Added"
        name = policy.get("name")
        exists = cls.list_policies(name=name)
        if exists:
            if not update:
                click.echo("Policy {0!s} exists and -u is not specified, skipping import.".format(name))
                continue
            else:
                action_str = "Updated"
        r = set_policy(name, action=policy.get("action"), active=policy.get("active", True),
                       adminrealm=policy.get("adminrealm"), adminuser=policy.get("adminuser"),
                       check_all_resolvers=policy.get("check_all_resolvers", False), client=policy.get("client"),
                       conditions=policy.get("conditions"), edumfanode=policy.get("edumfanode"),
                       priority=policy.get("priority"), realm=policy.get("realm"), resolver=policy.get("resolver"),
                       scope=policy.get("scope"), time=policy.get("time"), user=policy.get("user"))
        click.echo("{0!s} policy {1!s} with result {2!s}".format(action_str, name, r))


# conf export menu
def get_conf_event(name=None):
    """ helper function for conf_export """
    from edumfa.lib.event import EventConfiguration
    event_cls = EventConfiguration()
    if name:
        conf = [e for e in event_cls.events if (e.get("name") == name)]
    else:
        conf = event_cls.events
    return conf


def import_conf_event(config_list, cleanup=False, update=False, purge=False):
    """
    import event configuration from an event list
    """
    from edumfa.lib.event import EventConfiguration
    cls = EventConfiguration()
    if cleanup:
        click.echo("Cleanup old events.")
        events = cls.events
        for event in events:
            name = event.get("name")
            r = delete_event(event.get("id"))
            click.echo("Deleted event '{0!s}' with result {1!s}".format(name, r), file=sys.stderr)

    if purge:
        if cleanup:
            click.echo("Cleanup was performed before - nothing to purge here.")
        else:
            events = cls.events
            stored_names = [x.get("name") for x in events]
            import_names = [x.get("name") for x in config_list]

            for stored in stored_names:
                if stored not in import_names:
                    try:
                        r = delete_event([e for e in cls.events if (stored == e.get("name"))][0].get("id"))
                        click.echo(f"Purged event {stored!s} with result {r!s}")
                    except Exception as ex:
                        click.echo(f"Purged event {stored!s} failed with error {ex}")

    for event in config_list:
        action_str = "Added"
        # Todo: This check does not work properly. The event is created nevertheless
        name = event.get("name")
        events_with_name = [e for e in cls.events if (name == e.get("name"))]
        if events_with_name:
            exists = True
            event_id = events_with_name[0].get("id")
        else:
            exists = False
            event_id = None
        if exists:
            if not update:
                click.echo("Event {0!s} exists and -u is not specified, skipping import.".format(name))
                continue
            else:
                action_str = "Updated"
        r = set_event(name, event.get("event"), event.get("handlermodule"), event.get("action"),
                      conditions=event.get("conditions"), ordering=event.get("ordering"), options=event.get("options"),
                      active=event.get("active"), position=event.get("position", "post"), id=event_id)
        click.echo("{0!s} event {1!s} with result {2!s}".format(action_str, name, r))


def import_conf_resolver(config_list, cleanup=False, update=False, purge=False):
    """
    import resolver configuration from a resolver list
    """
    if cleanup:
        click.echo("Cleanup old resolvers not implemented right now.")
    if purge:
        from edumfa.lib.resolver import delete_resolver
        for resolver in get_resolver_list():
            name = resolver
            if name not in [r.get("resolvername") for r in config_list]:
                r = delete_resolver(name, force=True)
                click.echo("Purged resolver '{0!s}' with result {1!s}".format(name, r))
        
    for config in config_list:
        action_str = "Added"

        name = config.get("resolvername")
        exists = get_resolver_list(filter_resolver_name=name)
        if exists:
            if not update:
                click.echo("Resolver {0!s} exists and -u is not specified, skipping import.".format(name))
                continue
            else:
                action_str = "Updated"

        resolvertype = config.get("type")
        data = config.get("data")
        # now we can create the resolver
        params = {'resolver': name, 'type': resolvertype}
        for key in data.keys():
            params.update({key: data.get(key)})
        r = save_resolver(params)
        click.echo("{0!s} resolver {1!s} with result {2!s}".format(action_str, name, r))


def get_conf_resolver(name=None, print_passwords=False):
    """ helper function for conf_export """
    from edumfa.lib.resolver import get_resolver_list
    resolver_dict = get_resolver_list(filter_resolver_name=name, censor=not print_passwords)
    return list(resolver_dict.values())
