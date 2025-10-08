# -*- coding: utf-8 -*-
#
# License:  AGPLv3
# This file is part of eduMFA. eduMFA is a fork of privacyIDEA which was forked from LinOTP.
# Copyright (c) 2024 eduMFA Project-Team
# Previous authors by privacyIDEA project:
#
# 2018 Cornelius Kölbel <cornelius.koelbel@netknights.it>
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
__doc__ = """This module writes statistics data to the SQL database table "monitoringstats".
"""
import logging
import traceback

from dateutil.tz import tzutc
from sqlalchemy import MetaData, and_, create_engine
from sqlalchemy.orm import scoped_session, sessionmaker

from edumfa.lib.lifecycle import register_finalizer
from edumfa.lib.monitoringmodules.base import Monitoring as MonitoringBase
from edumfa.lib.pooling import get_engine
from edumfa.lib.utils import censor_connect_string, convert_timestamp_to_utc
from edumfa.models import MonitoringStats

log = logging.getLogger(__name__)

metadata = MetaData()


class Monitoring(MonitoringBase):
    def __init__(self, config=None):
        self.name = "sqlstats"
        self.config = config or {}
        self.engine = get_engine(self.name, self._create_engine)
        # create a configured "Session" class. ``scoped_session`` is not
        # necessary because we do not share session objects among threads.
        # We use it anyway as a safety measure.
        Session = scoped_session(sessionmaker(bind=self.engine))
        self.session = Session()
        # Ensure that the connection gets returned to the pool when the request has
        # been handled. This may close an already-closed session, but this is not a problem.
        register_finalizer(self.session.close)
        self.session._model_changes = {}

    def _create_engine(self):
        """
        :return: a new SQLAlchemy engine connecting to the database specified in EDUMFA_MONITORING_SQL_URI.
        """
        # an Engine, which the Session will use for connection
        # resources
        connect_string = self.config.get(
            "EDUMFA_MONITORING_SQL_URI", self.config.get("SQLALCHEMY_DATABASE_URI")
        )
        log.debug(
            "using the connect string {0!s}".format(
                censor_connect_string(connect_string)
            )
        )
        try:
            pool_size = self.config.get("EDUMFA_MONITORING_POOL_SIZE", 20)
            engine = create_engine(
                connect_string,
                pool_size=pool_size,
                pool_recycle=self.config.get("EDUMFA_MONITORING_POOL_RECYCLE", 600),
            )
            log.debug("Using SQL pool size of {}".format(pool_size))
        except TypeError:
            # SQLite does not support pool_size
            engine = create_engine(connect_string)
            log.debug("Using no SQL pool_size.")
        return engine

    def add_value(self, stats_key, stats_value, timestamp, reset_values=False):
        utc_timestamp = convert_timestamp_to_utc(timestamp)
        try:
            ms = MonitoringStats(utc_timestamp, stats_key, stats_value)
            self.session.add(ms)
            self.session.commit()
            if reset_values:
                # Successfully saved the new stats entry, so remove old entries
                self.session.query(MonitoringStats).filter(
                    and_(
                        MonitoringStats.stats_key == stats_key,
                        MonitoringStats.timestamp < utc_timestamp,
                    )
                ).delete()
                self.session.commit()
        except Exception as exx:  # pragma: no cover
            log.error("exception {0!r}".format(exx))
            log.error("DATA: {0!s} -> {1!s}".format(stats_key, stats_value))
            log.debug("{0!s}".format(traceback.format_exc()))
            self.session.rollback()

        finally:
            self.session.close()

    def delete(self, stats_key, start_timestamp, end_timestamp):
        r = None
        conditions = [MonitoringStats.stats_key == stats_key]
        if start_timestamp:
            utc_start_timestamp = convert_timestamp_to_utc(start_timestamp)
            conditions.append(MonitoringStats.timestamp >= utc_start_timestamp)
        if end_timestamp:
            utc_end_timestamp = convert_timestamp_to_utc(end_timestamp)
            conditions.append(MonitoringStats.timestamp <= utc_end_timestamp)
        try:
            r = self.session.query(MonitoringStats).filter(and_(*conditions)).delete()
            self.session.commit()
        except Exception as exx:  # pragma: no cover
            log.error("exception {0!r}".format(exx))
            log.error("could not delete statskeys {0!s}".format(stats_key))
            log.debug("{0!s}".format(traceback.format_exc()))
            self.session.rollback()

        finally:
            self.session.close()

        return r

    def get_keys(self):
        """
        Return a list of all stored keys.
        :return:
        """
        keys = []
        try:
            for monStat in (
                self.session.query(MonitoringStats)
                .with_entities(MonitoringStats.stats_key)
                .distinct()
            ):
                keys.append(monStat.stats_key)
        except Exception as exx:  # pragma: no cover
            log.error("exception {0!r}".format(exx))
            log.error("could not fetch list of keys")
            log.debug("{0!s}".format(traceback.format_exc()))
            self.session.rollback()

        finally:
            self.session.close()
        return keys

    def get_values(
        self, stats_key, start_timestamp=None, end_timestamp=None, date_strings=False
    ):
        values = []

        try:
            conditions = [MonitoringStats.stats_key == stats_key]
            if start_timestamp:
                utc_start_timestamp = convert_timestamp_to_utc(start_timestamp)
                conditions.append(MonitoringStats.timestamp >= utc_start_timestamp)
            if end_timestamp:
                utc_end_timestamp = convert_timestamp_to_utc(end_timestamp)
                conditions.append(MonitoringStats.timestamp <= utc_end_timestamp)
            for ms in (
                self.session.query(MonitoringStats)
                .filter(and_(*conditions))
                .order_by(MonitoringStats.timestamp.asc())
            ):
                aware_timestamp = ms.timestamp.replace(tzinfo=tzutc())
                values.append((aware_timestamp, ms.stats_value))
        except Exception as exx:  # pragma: no cover
            log.error("exception {0!r}".format(exx))
            log.error("could not fetch list of keys")
            log.debug("{0!s}".format(traceback.format_exc()))
            self.session.rollback()

        finally:
            self.session.close()

        return values

    def get_last_value(self, stats_key):
        val = None
        try:
            s = (
                self.session.query(MonitoringStats)
                .filter(MonitoringStats.stats_key == stats_key)
                .order_by(MonitoringStats.timestamp.desc())
                .first()
            )
            if s:
                val = s.stats_value
        except Exception as exx:  # pragma: no cover
            log.error("exception {0!r}".format(exx))
            log.error("could not fetch list of keys")
            log.debug("{0!s}".format(traceback.format_exc()))
            self.session.rollback()

        finally:
            self.session.close()

        return val
