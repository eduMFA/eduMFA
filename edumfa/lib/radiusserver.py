# -*- coding: utf-8 -*-
#
# License:  AGPLv3
# This file is part of eduMFA. eduMFA is a fork of privacyIDEA which was forked from LinOTP.
# Copyright (c) 2024 eduMFA Project-Team
# Previous authors by privacyIDEA project:
#
# 2016 - 2017 Cornelius Kölbel <cornelius.koelbel@netknights.it>
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
from edumfa.models import RADIUSServer as RADIUSServerDB
from edumfa.lib.crypto import (
    decryptPassword,
    encryptPassword,
    FAILED_TO_DECRYPT_PASSWORD,
)
from edumfa.lib.config import get_from_config
import logging
from edumfa.lib.log import log_with
from edumfa.lib.error import ConfigAdminError, eduMFAError
import pyrad.packet
from pyrad.client import Client
from pyrad.client import Timeout
from pyrad.dictionary import Dictionary
from edumfa.lib import _
from edumfa.lib.utils import fetch_one_resource, to_bytes
from edumfa.lib.utils.export import register_import, register_export

__doc__ = """
This is the library for creating, listing and deleting RADIUS server objects in
the Database.

It depends on the RADIUSserver in the database model models.py. This module can
be tested standalone without any webservices.
This module is tested in tests/test_lib_radiusserver.py
"""

log = logging.getLogger(__name__)


class RADIUSServer:
    """
    RADIUS Server object with configuration. The RADIUS Server object
    contains a test functionality so that the configuration can be tested.
    """

    def __init__(self, db_radius_object):
        """
        Create a new RADIUSServer instance from a DB RADIUS object

        :param db_radius_object: The database object
        :return: A RADIUS Server object
        """
        self.config = db_radius_object

    def get_secret(self):
        return decryptPassword(self.config.secret)

    @staticmethod
    def request(config, user, password):
        """
        Perform a RADIUS request to a RADIUS server.
        The RADIUS configuration contains the IP address, the port and the
        secret of the RADIUS server.

        * config.server
        * config.port
        * config.secret
        * config.retries
        * config.timeout
        * config.enforce_ma

        :param config: The RADIUS configuration
        :type config: RADIUSServer Database Model
        :param user: the radius username
        :type user: str
        :param password: the radius password
        :type password: str
        :return: True or False. If any error occurs, an exception is raised.
        """
        success = False

        nas_identifier = get_from_config("radius.nas_identifier", "eduMFA")
        r_dict = config.dictionary or get_from_config(
            "radius.dictfile", "/etc/edumfa/" "dictionary"
        )
        log.debug(f"NAS Identifier: {nas_identifier!r}, Dictionary: {r_dict!r}")
        log.debug(
            "constructing client object "
            "with server: %r, port: %r, secret: %r"
            % (config.server, config.port, config.secret)
        )

        srv = Client(
            server=config.server,
            authport=config.port,
            secret=to_bytes(decryptPassword(config.secret)),
            dict=Dictionary(r_dict),
        )

        # Set retries and timeout of the client
        if config.timeout:
            srv.timeout = config.timeout
        if config.retries:
            srv.retries = config.retries

        req = srv.CreateAuthPacket(
            code=pyrad.packet.AccessRequest,
            User_Name=user.encode("utf-8"),
            NAS_Identifier=nas_identifier.encode("ascii"),
        )
        if config.enforce_ma:
            req.add_message_authenticator()

        # PwCrypt encodes unicode strings to UTF-8
        req["User-Password"] = req.PwCrypt(password)
        try:
            response = srv.SendPacket(req)
            if config.enforce_ma:
                # verify_message_authenticator() raised a generic exception
                # if M-A attribute is missing .. check for it before!
                if "Message-Authenticator" in response:
                    success = response.verify_message_authenticator()
                    if not success:
                        log.info(
                            "Radiusserver %s sent broken"
                            "Message-Authenticator" % (config.server)
                        )
                        return False
                else:
                    log.info(
                        "Radiusserver %s sent no "
                        "Message-Authenticator" % (config.server)
                    )
                    return False

            if response.code == pyrad.packet.AccessAccept:
                log.info(
                    "Radiusserver %s granted "
                    "access to user %s." % (config.server, user)
                )
                success = True
            else:
                log.warning(
                    "Radiusserver %s rejected "
                    "access to user %s." % (config.server, user)
                )
        except Timeout:
            log.warning(
                f"Receiving timeout from remote radius server {config.server!s}"
            )

        return success


@log_with(log)
def get_radius(identifier):
    """
    This returns the RADIUSServer object of the RADIUSServer definition
    "identifier".
    In case the identifier does not exist, an exception is raised.

    :param identifier: The name of the RADIUSserver definition
    :return: A RADIUSServer Object
    """
    server_list = get_radiusservers(identifier=identifier)
    if not server_list:
        raise ConfigAdminError(
            "The specified RADIUSServer configuration does " "not exist."
        )
    return server_list[0]


@log_with(log)
def get_radiusservers(identifier=None, server=None):
    """
    This returns a list of all RADIUSServers matching the criterion.
    If no identifier or server is provided, it will return a list of all RADIUS
    server definitions.

    :param identifier: The identifier or the name of the RADIUSServer
        definition.
        As the identifier is unique, providing an identifier will return a
        list with either one or no RADIUSServer
    :type identifier: basestring
    :param server: The FQDN or IP address of the RADIUSServer
    :type server: basestring
    :return: list of RADIUSServer Objects.
    """
    res = []
    sql_query = RADIUSServerDB.query
    if identifier:
        sql_query = sql_query.filter(RADIUSServerDB.identifier == identifier)
    if server:
        sql_query = sql_query.filter(RADIUSServerDB.server == server)

    for row in sql_query.all():
        res.append(RADIUSServer(row))

    return res


@log_with(log)
def list_radiusservers(identifier=None, server=None):
    res = {}
    server_list = get_radiusservers(identifier=identifier, server=server)
    for server in server_list:
        decrypted_password = decryptPassword(server.config.secret)
        # If the database contains garbage, use the empty password as fallback
        if decrypted_password == FAILED_TO_DECRYPT_PASSWORD:
            decrypted_password = ""  # nosec B105 # Reset password in case of error
        res[server.config.identifier] = {
            "server": server.config.server,
            "port": server.config.port,
            "dictionary": server.config.dictionary,
            "description": server.config.description,
            "password": decrypted_password,
            "timeout": server.config.timeout,
            "retries": server.config.retries,
            "enforce_ma": server.config.enforce_ma,
        }

    return res


@log_with(log)
def add_radius(
    identifier,
    server=None,
    secret=None,
    port=1812,
    description="",
    dictionary="/etc/edumfa/dictionary",
    retries=3,
    timeout=5,
    enforce_ma=False,
):
    """
    This adds a RADIUS server to the RADIUSServer database table.

    If the "identifier" already exists, the database entry is updated.

    :param identifier: The identifier or the name of the RADIUSServer
        definition.
        As the identifier is unique, providing an identifier will return a
        list with either one or no radius server
    :type identifier: basestring
    :param server: The FQDN or IP address of the RADIUS server
    :type server: basestring
    :param secret: The RADIUS secret
    :type secret: str
    :param port: the radius port
    :type port: int
    :param description: Human readable description of the RADIUS server
        definition
    :param dictionary: The RADIUS dictionary
    :param enforce_ma: Enforce usage and check of Message-Authenticator
    :type enforce_ma: boolean
    :return: The Id of the database object
    """
    cryptedSecret = encryptPassword(secret)
    if len(cryptedSecret) > 255:
        raise eduMFAError(description=_("The RADIUS secret is too long"), id=2234)
    r = RADIUSServerDB(
        identifier=identifier,
        server=server,
        port=port,
        secret=cryptedSecret,
        description=description,
        dictionary=dictionary,
        retries=retries,
        timeout=timeout,
        enforce_ma=enforce_ma,
    ).save()
    return r


@log_with(log)
def test_radius(
    identifier,
    server,
    secret,
    user,
    password,
    port=1812,
    description="",
    dictionary="/etc/edumfa/dictionary",
    retries=3,
    timeout=5,
    enforce_ma=False,
):
    """
    This tests a RADIUS server configuration by sending an access request.

    :param identifier: The identifier or the name of the RADIUSServer definition
    :type identifier: basestring
    :param server: The FQDN or IP address of the RADIUS server
    :type server: basestring
    :param secret: The RADIUS secret
    :type secret: str
    :param user: the username to send
    :param password: the password to send
    :param port: the radius port
    :type port: int
    :param description: Human readable description of the RADIUS server
        definition
    :param dictionary: The RADIUS dictionary
    :param enforce_ma: Enforce usage and check of Message-Authenticator
    :type enforce_ma: boolean
    :return: The result of the access request
    """
    cryptedSecret = encryptPassword(secret)
    if len(cryptedSecret) > 255:
        raise eduMFAError(description=_("The RADIUS secret is too long"), id=2234)
    s = RADIUSServerDB(
        identifier=identifier,
        server=server,
        port=port,
        secret=cryptedSecret,
        dictionary=dictionary,
        retries=retries,
        timeout=timeout,
        description=description,
        enforce_ma=enforce_ma,
    )
    return RADIUSServer.request(s, user, password)


@log_with(log)
def delete_radius(identifier):
    """
    Delete the given server from the database.
    If no such entry could be found, a ResourceNotFoundError is raised.
    :param identifier: The identifier/name of the server
    :return: The ID of the database entry, that was deleted
    """
    return fetch_one_resource(RADIUSServerDB, identifier=identifier).delete()


@register_export("radiusserver")
def export_radiusserver(name=None):
    """Export given or all radiusserver configuration"""
    return list_radiusservers(identifier=name)


@register_import("radiusserver")
def import_radiusserver(data, name=None):
    """Import radiusserver configuration"""
    log.debug(f"Import radiusserver config: {data!s}")
    for res_name, res_data in data.items():
        if name and name != res_name:
            continue
        res_data["secret"] = res_data.pop("password")
        rid = add_radius(res_name, **res_data)
        log.info(f'Import of radiusserver "{res_name!s}" finished, id: {rid!s}')
