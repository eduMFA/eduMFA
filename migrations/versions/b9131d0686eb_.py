"""Add a generic admin policy for tokenlist

Revision ID: b9131d0686eb
Revises: 849170064430
Create Date: 2019-06-28 07:37:59.224088

"""

# revision identifiers, used by Alembic.
revision = "b9131d0686eb"
down_revision = "849170064430"

import sqlalchemy as sa
from alembic import op
from sqlalchemy import orm
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.schema import Sequence

from edumfa.lib.policy import ACTION, SCOPE

Base = declarative_base()

# dashes are not allowed, when creating policies in the WebUI
# or via the library. So we are sure, that in normal operation
# this policy can never be created.
POLICYNAME = "edumfa-update-policy-b9131d0686eb"


class Policy(Base):
    """
    The policy table contains policy definitions which control
    the behaviour during
     * enrollment
     * authentication
     * authorization
     * administration
     * user actions
    """

    __tablename__ = "policy"
    __table_args__ = {"mysql_row_format": "DYNAMIC"}
    id = sa.Column(sa.Integer, Sequence("policy_seq"), primary_key=True)
    active = sa.Column(sa.Boolean, default=True)
    check_all_resolvers = sa.Column(sa.Boolean, default=False)
    name = sa.Column(sa.Unicode(64), unique=True, nullable=False)
    scope = sa.Column(sa.Unicode(32), nullable=False)
    action = sa.Column(sa.Unicode(2000), default="")
    realm = sa.Column(sa.Unicode(256), default="")
    adminrealm = sa.Column(sa.Unicode(256), default="")
    resolver = sa.Column(sa.Unicode(256), default="")
    user = sa.Column(sa.Unicode(256), default="")
    client = sa.Column(sa.Unicode(256), default="")
    time = sa.Column(sa.Unicode(64), default="")
    condition = sa.Column(sa.Integer, default=0, nullable=False)
    # If there are multiple matching policies, choose the one
    # with the lowest priority number. We choose 1 to be the default priotity.
    priority = sa.Column(sa.Integer, default=1, nullable=False)


def upgrade():
    """
    During upgrade we check, if admin policies exist.
    If so, we add a generic policy for all admins, that allows "tokenlist".
    This mimicks the pervious behaviour.
    :return:
    """
    bind = op.get_bind()
    session = orm.Session(bind=bind)
    if (
        session.query(Policy.id)
        .filter(Policy.scope == f"{SCOPE.ADMIN}", Policy.active.is_(True))
        .all()
    ):
        # add policy if it does not exist yet
        if session.query(Policy.id).filter_by(name=POLICYNAME).first() is None:
            tokenlist_pol = Policy(
                name=POLICYNAME,
                scope=f"{SCOPE.ADMIN}",
                action=f"{ACTION.TOKENLIST}",
            )
            session.add(tokenlist_pol)
            print(f"Added '{ACTION.TOKENLIST}' action for admin policies.")
        else:
            print(f"Policy {POLICYNAME} already exists.")
    else:
        print(f"No admin policy active. No need to create '{ACTION.TOKENLIST}' action.")

    try:
        session.commit()
    except Exception as exx:
        print(f"Could not create policy {POLICYNAME}: {exx!r}")
        print(exx)


def downgrade():
    # Delete the policy, if it still exists
    bind = op.get_bind()
    session = orm.Session(bind=bind)
    session.query(Policy).filter(Policy.name == f"{POLICYNAME}").delete()
    session.commit()
