# -*- coding: utf-8 -*-
#
# License:  AGPLv3
# This file is part of eduMFA. eduMFA is a fork of privacyIDEA which was forked from LinOTP.
# Copyright (c) 2024 eduMFA Project-Team
# Previous authors by privacyIDEA project:
#
# 2018 Friedrich Weber <friedrich.weber@netknights.it>
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
__doc__ = """This is the base class for a task module.

Tasks may be run periodically. Upon execution, a task
can be given a set of options.
"""


class BaseTask:
    """
    A BaseTask returns a list of supported options.
    """

    identifier = "BaseTask"
    description = "This is the base class of a task with no functionality"

    def __init__(self, config):
        self.config = config

    @property
    def options(self):
        """
        A task may be given a dictionary of options. The allowed keys, their
        descriptions and types are specified here.

        For each option key, the returned dictionary contains one nested dictionary.
        Each nested dictionary has keys "type", "desc" and "value".

        :return: dict
        """
        return {}

    def do(self, params=None):
        """
        This method executes the task with the given parameters.

        :param params: a dictionary
        :return: a boolean denoting success
        """
        return True
