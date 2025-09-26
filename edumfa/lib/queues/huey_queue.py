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

import logging

from huey import RedisHuey

from edumfa.lib.queues.base import BaseQueue, QueueError

log = logging.getLogger(__name__)


class HueyQueue(BaseQueue):
    def __init__(self, options):
        BaseQueue.__init__(self, options)
        self._huey = RedisHuey(results=False, store_none=False, **options)
        self._jobs = {}

    @property
    def huey(self):
        return self._huey

    @property
    def jobs(self):
        return self._jobs

    def register_job(self, name, func):
        if name in self._jobs:
            raise QueueError(f"Job function {name!r} already exists")
        self._jobs[name] = self._huey.task(name=name)(func)

    def enqueue(self, name, args, kwargs):
        if name not in self._jobs:
            raise QueueError(f"Unknown job: {name!r}")
        log.info(f"Sending {name!r} job to the queue ...")
        # We do not care about results
        self._jobs[name](*args, **kwargs)
