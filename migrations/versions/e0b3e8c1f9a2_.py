"""store timestamps as timezone-aware UTC

Revision ID: e0b3e8c1f9a2
Revises: 9cad6f046bd2
Create Date: 2026-05-12 00:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "e0b3e8c1f9a2"
down_revision = "9cad6f046bd2"


UTC_COLUMNS = {
    "passwordreset": [("timestamp", True), ("expiration", True)],
    "jwt_blacklist": [("expiration", True)],
    "challenge": [("timestamp", True), ("expiration", True)],
    "clientapplication": [("lastseen", True)],
    "subscription": [("date_from", True), ("date_till", True)],
    "mfa_audit": [("date", True), ("startdate", True)],
    "usercache": [("timestamp", True)],
    "authcache": [("first_auth", True), ("last_auth", True)],
    "periodictask": [("last_update", False)],
    "periodictasklastrun": [("timestamp", False)],
    "monitoringstats": [("timestamp", False)],
}


def _alter_timestamp_columns(timezone):
    bind = op.get_bind()
    if bind.dialect.name == "sqlite":
        return

    for table_name, columns in UTC_COLUMNS.items():
        for column_name, nullable in columns:
            kwargs = {}
            if bind.dialect.name == "postgresql":
                kwargs["postgresql_using"] = f"{column_name} AT TIME ZONE 'UTC'"
            op.alter_column(
                table_name,
                column_name,
                existing_type=sa.DateTime(timezone=not timezone),
                type_=sa.DateTime(timezone=timezone),
                existing_nullable=nullable,
                **kwargs,
            )


def upgrade():
    _alter_timestamp_columns(timezone=True)


def downgrade():
    _alter_timestamp_columns(timezone=False)
