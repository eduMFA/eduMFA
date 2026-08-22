#
# License:  AGPLv3
# This file is part of eduMFA. eduMFA is a fork of privacyIDEA which was forked from LinOTP.
# Copyright (c) 2026 eduMFA Project-Team
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
"""
Test the unauthenticated health endpoints.
"""
from .base import MyTestCase


class APIHealthTestCase(MyTestCase):

    def test_00_live_health_is_unauthenticated(self):
        with self.app.test_request_context("/health/live", method="GET"):
            res = self.app.full_dispatch_request()
            self.assertEqual(200, res.status_code, res.data)
            self.assertEqual({"status": "ok"}, res.json)

    def test_01_ready_health_checks_database(self):
        with self.app.test_request_context("/health/ready", method="GET"):
            res = self.app.full_dispatch_request()
            self.assertEqual(200, res.status_code, res.data)
            self.assertEqual("ok", res.json["status"])
