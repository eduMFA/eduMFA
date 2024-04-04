"""Migrate from privacyIDEA to eduMFA

Revision ID: 0d011e94a8e8
Revises: 5cb310101a1f
Create Date: 2024-02-17 08:50:59.295124

"""
from sqlalchemy import orm
from alembic import op, context
import sqlalchemy as sa

from edumfa.models import Policy, SMSGateway

# revision identifiers, used by Alembic.
revision = '0d011e94a8e8'
down_revision = '5cb310101a1f'


def dialect_supports_sequences():
    migration_context = context.get_context()
    return migration_context.dialect.supports_sequences


def upgrade():

    print("Migrating from privacyIDEA to eduMFA")
    try:
        print(" * Renaming column privacyidea_server to edumfa_server")
        op.alter_column("pidea_audit", "privacyidea_server", new_column_name="edumfa_server", existing_type=sa.String(length=255))
        print(" * Renaming table pidea_audit to mfa_audit")
        op.rename_table("pidea_audit", "mfa_audit")
    except Exception as e:
        print("Renaming table pidea_audit to mfa_audit failed")
        print(e)
    try:
        print(" * Renaming table privacyideaserver to edumfaserver")
        op.rename_table("privacyideaserver", "edumfaserver")
    except Exception as e:
        print("Renaming table privacyideaserver to edumfaserver failed")
        print(e)

    try:
        if dialect_supports_sequences():
            if context.get_context().dialect.name in ['mariadb', 'mysql']:
                print(" * Renaming table privacyideaserver_seq to edumfaserver_seq")
                op.rename_table("privacyideaserver_seq", "edumfaserver_seq")
            else:
                print(" * Renaming sequence privacyideaserver_id_seq to edumfaserver_id_seq")
                op.execute("ALTER SEQUENCE privacyideaserver_id_seq RENAME TO edumfaserver_id_seq")
    except Exception as e:
        print("Renaming sequence for privacyideaserver to edumfaserver failed")
        print(e)

    try:
        print(" * Renaming column pinode to edumfanode")
        op.alter_column("policy", "pinode", new_column_name="edumfanode", existing_type=sa.String(length=256))
    except Exception as e:
        print("Migrating pinode to edumfanode failed")
        print(e)

    bind = op.get_bind()
    session = orm.Session(bind=bind)
    try:
        print(" * Replacing login_mode=privacyIDEA with login_mode=eduMFA")
        for row in session.query(Policy).filter(Policy.action.like("%login_mode=privacyIDEA%")):
            print(f' ** Replacing login_mode in policy {row.name} (id: {row.id}) with existing action {row.action}')
            row.action = row.action.replace("login_mode=privacyIDEA", "login_mode=eduMFA")
        session.commit()
    except Exception as e:
        session.rollback()
        print("Failed to update login modes!")
        print(e)

    session = orm.Session(bind=bind)
    try:
        print(" * Replacing privacyideaserver_read and privacyideaserver_write policies ")
        for row in session.query(Policy).filter(Policy.action.like("%privacyideaserver_read%")):
            print(f' ** Replacing policy for {row.name} ({row.id}) with action {row.action}')
            row.action = row.action.replace("privacyideaserver_read", "edumfaserver_read")
        for row in session.query(Policy).filter(Policy.action.like("%privacyideaserver_write%")):
            print(f' ** Replacing policy for {row.name} ({row.id}) with action {row.action}')
            row.action = row.action.replace("privacyideaserver_write", "edumfaserver_write")
        session.commit()
    except Exception as e:
        session.rollback()
        print("Failed to update admin policy!")
        print(e)

    session = orm.Session(bind=bind)
    try:
        print(" * Replacing providernames for smsgateways")
        for row in session.query(SMSGateway).filter(SMSGateway.providermodule.like("privacyidea.lib.%")):
            print(f' ** Replacing providername for {row.identifier} ({row.id}) with provider {row.providermodule}')
            row.providermodule = row.providermodule.replace("privacyidea.lib.", "edumfa.lib.")
        session.commit()
    except Exception as e:
        session.rollback()
        print("Failed to update SmsGateway providermodules!")
        print(e)



def downgrade():
    try:
        op.alter_column("pidea_audit", "edumfa_server", new_column_name="privacyidea_server", existing_type=sa.String(length=255))
        op.rename_table("mfa_audit", "pidea_audit")
    except Exception as e:
        print("Renaming table pidea_audit to mfa_audit failed")
        print(e)

    try:
        if dialect_supports_sequences():
            if context.get_context().dialect.name in ['mariadb', 'mysql']:
                op.rename_table("edumfaserver_seq", "privacyideaserver_seq")
            else:
                op.execute("ALTER SEQUENCE edumfaserver_id_seq RENAME TO privacyideaserver_id_seq")
    except Exception as e:
        print("Renaming sequence for edumfaserver to privacyideaserver failed")
        print(e)

    try:
        op.rename_table("edumfaserver", "privacyideaserver")
    except Exception as e:
        print("Renaming table edumfaserver to privacyideaserver failed")
        print(e)

    try:
        op.alter_column("policy", "edumfanode", new_column_name="pinode", existing_type=sa.String(length=256))
    except Exception as e:
        print("Migrating edumfanode to pinode failed")
        print(e)

    bind = op.get_bind()
    session = orm.Session(bind=bind)
    try:
        for row in session.query(Policy).filter(Policy.action.like("%login_mode=eduMFA%")):
            row.action = row.action.replace("login_mode=eduMFA", "login_mode=privacyIDEA")
        session.commit()
    except Exception as e:
        session.rollback()
        print("Failed to update login modes!")
        print(e)

    session = orm.Session(bind=bind)
    try:
        for row in session.query(Policy).filter(Policy.action.like("%edumfaserver_read%")):
            row.action = row.action.replace("edumfaserver_read", "privacyideaserver_read")
        for row in session.query(Policy).filter(Policy.action.like("%edumfaserver_write%")):
            row.action = row.action.replace("edumfaserver_write", "privacyideaserver_write")
        session.commit()
    except Exception as e:
        session.rollback()
        print("Failed to update admin policy!")
        print(e)

    session = orm.Session(bind=bind)
    try:
        for row in session.query(SMSGateway).filter(SMSGateway.providermodule.like("edumfa.lib.%")):
            row.providermodule = row.providermodule.replace("edumfa.lib.", "privacyidea.lib.")
        session.commit()
    except Exception as e:
        session.rollback()
        print("Failed to update SmsGateway providermodules!")
        print(e)
