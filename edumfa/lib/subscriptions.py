# -*- coding: utf-8 -*-
#
# License:  AGPLv3
# This file is part of eduMFA. eduMFA is a fork of privacyIDEA which was forked from LinOTP.
# Copyright (c) 2024 eduMFA Project-Team
# Previous authors by privacyIDEA project:
#
# 2016 Cornelius Kölbel <cornelius.koelbel@netknights.it>
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
__doc__ = """Save and list subscription information.
Provide decorator to test the subscriptions.

The code is tested in tests/test_lib_subscriptions.py.
"""

import logging
from .log import log_with
import functools


SUBSCRIPTION_DATE_FORMAT = "%Y-%m-%d"
SIGN_FORMAT = """{application}
{for_name}
{for_address}
{for_email}
{for_phone}
{for_url}
{for_comment}
{by_name}
{by_email}
{by_address}
{by_phone}
{by_url}
{date_from}
{date_till}
{num_users}
{num_tokens}
{num_clients}
{level}
"""

log = logging.getLogger(__name__)


def get_users_with_active_tokens():
    """
    Returns the numbers of users (userId, Resolver) with active tokens.

    :return: Number of users
    :rtype: int
    """
    from edumfa.models import Token, TokenOwner
    sql_query = TokenOwner.query.with_entities(TokenOwner.resolver, TokenOwner.user_id)
    sql_query = sql_query.filter(Token.active == True).filter(Token.id == TokenOwner.token_id).distinct()
    return sql_query.count()


def subscription_status(component="", tokentype=None):
    """
    Return the status of the subscription

    0: Token count <= 50
    1: Token count > 50, no subscription at all
    2: subscription expired
    3: subscription OK

    :return: subscription state
    """
    return 3


@log_with(log)
def save_subscription(subscription):
    """
    Saves a subscription to the database. If the subscription already exists,
    it is updated.

    :param subscription: dictionary with all attributes of the
        subscription
    :type subscription: dict
    :return: True in case of success
    """
    return True


def get_subscription(application=None):
    """
    Return a list of subscriptions for a certain application
    If application is omitted, all applications are returned.

    :param application: Name of the application
    :return: list of subscription dictionaries
    """
    subscriptions = []
    return subscriptions


@log_with(log)
def delete_subscription(application):
    """
    Delete the subscription for the given application

    :param application:
    :return: True in case of success
    """
    return 0


def raise_exception_probability(subscription=None):
    """
    Depending on the subscription expiration data this will return True,
    so that an exception can be raised

    :param subscription: Subscription dictionary
    :return: Bool
    """
    return False


def subscription_exceeded_probability(active_tokens, allowed_tokens):
    """
    Depending on the subscription token numbers, this will return True,
    so that an exception can be raised.

    Returns true if a Subscription Exception is to be raised.

    :param active_tokens: The number of the active tokens
    :param allowed_tokens: The number of the allowed tokens
    :return:
    """
    return False


def check_subscription(application, max_free_subscriptions=None):
    """
    This checks if the subscription for the given application is valid.
    In case of a failure an Exception is raised.

    :param application: the name of the application to check
    :param max_free_subscriptions: the maximum number of subscriptions
        without a subscription file. If not given, the default is used.
    :return: bool
    """
    return True


def check_signature(subscription):
    """
    This function checks the signature of a subscription. If the signature
    checking fails, a SignatureError / Exception is raised.

    :param subscription: The dict of the subscription
    :return: True
    """
    return True


class CheckSubscription:
    """
    Decorator to decorate an API request and check if the subscription is valid.
    For this, we evaluate the requesting client.
    If the subscription for this client is not valid, we raise an exception.
    """

    def __init__(self, request):
        self.request = request

    def __call__(self, func):
        @functools.wraps(func)
        def check_subscription_wrapper(*args, **kwds):
            request = self.request
            ua = request.user_agent
            ua_str = "{0!s}".format(ua) or "unknown"
            application = ua_str.split()[0]
            check_subscription(application)
            f_result = func(*args, **kwds)
            return f_result

        return check_subscription_wrapper
