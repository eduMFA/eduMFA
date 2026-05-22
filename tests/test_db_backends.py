import tempfile
from contextlib import contextmanager

import pytest
from sqlalchemy import text

from edumfa.app import create_app
from edumfa.lib.auth import create_db_admin
from edumfa.models import Token, db, save_config_timestamp

pytestmark = pytest.mark.dbcontainer


def _require_docker():
    docker = pytest.importorskip("docker")
    try:
        docker.from_env().ping()
    except docker.errors.DockerException as exc:
        pytest.skip(f"Docker is not available: {exc}")


@contextmanager
def _postgres_container():
    _require_docker()
    PostgresContainer = pytest.importorskip(
        "testcontainers.postgres"
    ).PostgresContainer
    with PostgresContainer("postgres:16-alpine") as postgres:
        database_url = postgres.get_connection_url()
        if database_url.startswith("postgresql+psycopg2://"):
            database_url = database_url.replace(
                "postgresql+psycopg2://", "postgresql+psycopg://", 1
            )
        elif database_url.startswith("postgresql://"):
            database_url = database_url.replace(
                "postgresql://", "postgresql+psycopg://", 1
            )
        yield "postgres", database_url


@contextmanager
def _mariadb_container():
    _require_docker()
    MariaDbContainer = pytest.importorskip("testcontainers.mysql").MariaDbContainer
    with MariaDbContainer("mariadb:11") as mariadb:
        yield "mariadb", mariadb.get_connection_url()


@pytest.fixture(
    scope="module",
    params=[
        _postgres_container,
        _mariadb_container,
    ],
    ids=[
        "postgres",
        "mariadb",
    ],
)
def database_container(request):
    with request.param() as container:
        yield container


@pytest.fixture
def app_with_database(database_container):
    backend, database_url = database_container
    with tempfile.NamedTemporaryFile("w", suffix=".py") as config_file:
        config_file.write(f"SQLALCHEMY_DATABASE_URI = {database_url!r}\n")
        config_file.write("EDUMFA_AUDIT_SQL_TRUNCATE = True\n")
        config_file.write("EDUMFA_LOGFILE = 'edumfa-testcontainer.log'\n")
        config_file.flush()

        app = create_app("testing", config_file=config_file.name, silent=True)
        app_context = app.app_context()
        app_context.push()
        try:
            db.create_all()
            save_config_timestamp()
            create_db_admin("testadmin", "admin@test.tld", "testpw")
            db.session.commit()
            yield app, backend
        finally:
            db.session.remove()
            db.drop_all()
            db.session.remove()
            db.engine.dispose()
            app_context.pop()


def test_schema_can_be_created_on_supported_database_backends(app_with_database):
    app, backend = app_with_database

    with db.engine.connect() as connection:
        row = connection.execute(text("select count(*) from token")).one()

    assert row[0] == 0
    assert db.engine.url.get_backend_name() in {"postgresql", "mysql"}
    assert backend in {"postgres", "mariadb"}


def test_token_roundtrip_on_supported_database_backends(app_with_database):
    token = Token(serial="DB-BACKEND-01", tokentype="hotp", otpkey="313233343536")
    token.set_description("created by testcontainers backend test")
    token.save()

    loaded = Token.query.filter_by(serial="DB-BACKEND-01").one()

    assert loaded.tokentype == "hotp"
    assert loaded.description == "created by testcontainers backend test"
