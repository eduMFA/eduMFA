# -*- coding: utf-8 -*-
#
# License:  AGPLv3
# This file is part of eduMFA. eduMFA is a fork of privacyIDEA which was forked from LinOTP.
# Copyright (c) 2024 eduMFA Project-Team
# Previous authors by privacyIDEA project:
#
# 2017 Cornelius Kölbel <cornelius.koelbel@netknights.it>
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
from urllib.parse import quote
from edumfa.models import eduMFAServer as eduMFAServerDB
import logging
from edumfa.lib.log import log_with
from edumfa.lib.utils import fetch_one_resource, to_unicode
from edumfa.lib.error import ConfigAdminError
from edumfa.lib.utils.export import (register_import, register_export)
import json
import requests

__doc__ = """
This is the library for creating, listing and deleting remote eduMFA
server objects in the Database.

It depends on the eduMFA Server in the database model models.py. This
module can be tested standalone without any webservices.
This module is tested in tests/test_lib_edumfaserver.py
"""

log = logging.getLogger(__name__)


class eduMFAServer:
    """
    eduMFA Server object with configuration. The eduMFA Server object
    contains a test functionality so that the configuration can be tested.
    """

    def __init__(self, db_edumfaserver_object):
        """
        Create a new eduMFA Server instance from a DB eduMFA object

        :param db_edumfaserver_object: The database object
        :return: A eduMFA Server object
        """
        self.config = db_edumfaserver_object

    def validate_check(self, user, password, serial=None, realm=None,
                       transaction_id=None, resolver=None):
        """
        Perform an HTTP validate/check request to the remote eduMFA
        Server.

        :param serial: The serial number of a token
        :param user: The username
        :param password: The password
        :param realm: an optional realm, if it is not contained in the username
        :param transaction_id:  an optional transaction_id.
        :return: Tuple (HTTP response object, JSON response content)
        """
        data = {"pass": quote(password)}
        if user:
            data["user"] = quote(user)
        if serial:
            data["serial"] = serial
        if realm:
            data["realm"] = realm
        if transaction_id:
            data["transaction_id"] = transaction_id
        if resolver:
            data["resolver"] = resolver
        response = requests.post(self.config.url + "/validate/check",
                                 data=data,
                                 verify=self.config.tls,
                                 timeout=60)

        return response

    @staticmethod
    def request(config, user, password):
        """
        Perform an HTTP test request to the eduMFA server.
        The eduMFA configuration contains the URL and the TLS verify.

        * config.url
        * config.tls

        :param config: The eduMFA configuration
        :type config: eduMFA Database Model
        :param user: the username to test
        :param password: the password/OTP to test
        :return: True or False. If any error occurs, an exception is raised.
        """
        response = requests.post(config.url + "/validate/check",
                                 data={"user": quote(user), "pass": quote(password)},
                                 verify=config.tls,
                                 timeout=60
                          )
        log.debug("Sent request to eduMFA server. status code returned: "
                  "{0!s}".format(response.status_code))
        if response.status_code != 200:
            log.warning("The request to the remote eduMFA server {0!s} "
                        "returned a status code: {1!s}".format(config.url,
                                                               response.status_code))
            return False

        j_response = json.loads(to_unicode(response.content))
        result = j_response.get("result")
        return result.get("status") and result.get("value")


@log_with(log)
def list_edumfaservers(identifier=None, id=None):
    res = {}
    server_list = get_edumfaservers(identifier=identifier, id=id)
    for server in server_list:
        res[server.config.identifier] = {"id": server.config.id,
                                         "url": server.config.url,
                                         "tls": server.config.tls,
                                         "description": server.config.description}
    return res


@log_with(log)
def get_edumfaserver(identifier=None, id=None):
    """
    This returns the eduMFA Server object of the eduMFA Server definition
    "identifier".
    In case the identifier does not exist, an exception is raised.

    :param identifier: The name of the eduMFA Server definition
    :param id: The database ID of the eduMFA Server definition
    :return: A eduMFAServer Object
    """
    server_list = get_edumfaservers(identifier=identifier, id=id)
    if not server_list:
        raise ConfigAdminError("The specified eduMFA Server configuration "
                               "does not exist.")
    return server_list[0]


@log_with(log)
def get_edumfaservers(identifier=None, url=None, id=None):
    """
    This returns a list of all eduMFA Servers matching the criterion.
    If no identifier or url is provided, it will return a list of all 
    eduMFA server definitions.

    :param identifier: The identifier or the name of the eduMFA Server
        definition.
        As the identifier is unique, providing an identifier will return a
        list with either one or no eduMFA Server
    :type identifier: basestring
    :param url: The FQDN or IP address of the eduMFA Server
    :type url: basestring
    :param id: The database id of the server
    :type id: integer
    :return: list of eduMFA Server Objects.
    """
    res = []
    sql_query = eduMFAServerDB.query
    if id is not None:
        sql_query = sql_query.filter(eduMFAServerDB.id == id)
    elif identifier:
        sql_query = sql_query.filter(eduMFAServerDB.identifier == identifier)
    elif url:
        sql_query = sql_query.filter(eduMFAServerDB.server == url)

    for row in sql_query.all():
        res.append(eduMFAServer(row))

    return res


@log_with(log)
def add_edumfaserver(identifier, url=None, tls=True, description=""):
    """
    This adds a eduMFA server to the edumfa database table.

    If the "identifier" already exists, the database entry is updated.

    :param identifier: The identifier or the name of the eduMFA Server
        definition.
        As the identifier is unique, providing an identifier will return a
        list with either one or no radius server
    :type identifier: basestring
    :param url: The url of the eduMFA server
    :type url: basestring
    :param tls: whether the certificate of the server should be checked
    :type tls: bool
    :param description: Human readable description of the RADIUS server
        definition
    :return: The Id of the database object
    """
    r = eduMFAServerDB(identifier=identifier, url=url, tls=tls,
                            description=description).save()
    return r


@log_with(log)
def delete_edumfaserver(identifier):
    """
    Delete the given server from the database.
    Raise ResourceNotFoundError if it couldn't be found.
    :param identifier: The identifier/name of the server
    :return: The ID of the database entry, that was deleted
    """
    return fetch_one_resource(eduMFAServerDB, identifier=identifier).delete()


@register_export('edumfaserver')
def export_edumfaservers(name=None):
    """ Export given or all edumfaservers configuration """
    # remove the id from the resulting objects
    pids_list = list_edumfaservers(identifier=name)
    for _, pids in pids_list.items():
        pids.pop('id')
    return pids_list


@register_import('edumfaserver')
def import_edumfaservers(data, name=None):
    """Import edumfaservers configuration"""
    log.debug('Import edumfaservers config: {0!s}'.format(data))
    for res_name, res_data in data.items():
        if name and name != res_name:
            continue
        rid = add_edumfaserver(res_name, **res_data)
        log.info('Import of edumfaservers "{0!s}" finished,'
                 ' id: {1!s}'.format(res_name, rid))
