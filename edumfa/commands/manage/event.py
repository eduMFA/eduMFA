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
import sys

import click
from flask.cli import AppGroup

from edumfa.commands.manage.config import import_cli, export_cli
from edumfa.commands.manage.helper import conf_export, conf_import, get_conf_event, import_conf_event
from edumfa.lib.event import delete_event, set_event

event_cli = AppGroup("event", help="Manage events")

@event_cli.command("list")
def list_events():
    """
    List events
    """
    from edumfa.lib.event import EventConfiguration
    conf = EventConfiguration()
    events = conf.events
    click.echo("{0:7} {4:4} {1:30}\t{2:20}\t{3}".format("Active", "Name", "Module", "Action", "ID"))
    click.echo(90 * "=")
    for event in events:
        click.echo("[{0!s:>5}] {4:4} {1:30}\t{2:20}\t{3}".format(event.get("active"), event.get("name")[0:30],
                                                                 event.get("handlermodule"), event.get("action"),
                                                                 event.get("id"), ))


@event_cli.command("enable")
@click.argument("eid", type=int, required=True)
def enable(eid: int):
    """
    enable en event by ID
    """
    from edumfa.lib.event import enable_event
    r = enable_event(eid)
    click.echo(r)


@event_cli.command("disable")
@click.argument("eid", type=int, required=True)
def disable(eid):
    """
    disable an event by ID
    """
    from edumfa.lib.event import enable_event
    r = enable_event(eid, enable=False)
    click.echo(r)


@event_cli.command("delete")
@click.argument("eid", type=int, required=True)
def delete(eid):
    """
    delete an event by ID
    """
    from edumfa.lib.event import delete_event
    r = delete_event(eid)
    click.echo(r)


@export_cli.command("event")
@click.option("-f", "filename", type=click.File('w'), default=sys.stdout, help="filename to export")
@click.option("-n", "name", help="event to export")
def e_export(filename, name):
    """
    Export the specified event or all events to a file.
    If the filename is omitted, the event configurations are written to stdout.
    """
    conf_export({"event": get_conf_event(name)}, filename)


@import_cli.command("event")
@click.option("-f", "filename", help="filename to import", required=True, type=click.File('r'))
@click.option("-c", "cleanup", help="cleanup configuration before import", is_flag=True)
@click.option("-u", "update", help="update configuration during import", is_flag=True)
@click.option(
    "--purge",
    "-p",
    "purge",
    is_flag=True,
    help="Purge not existing items and keep old (update can be enabled using -u).",
)
def e_import(filename, cleanup, update, purge):
    """
    Import the events from a file.
    If 'cleanup' is specified the existing events are deleted before the
    events from the file are imported.
    """
    data = conf_import(conftype="event", file=filename)
    import_conf_event(data["event"], cleanup=cleanup, update=update, purge=purge)


event_cli.add_command(e_export, "e_export")
event_cli.add_command(e_export, "export")
event_cli.add_command(e_import, "e_import")
event_cli.add_command(e_import, "import")