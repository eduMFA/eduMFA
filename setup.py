# -*- coding: utf-8 -*-
from setuptools import setup
import os
import stat

# Taken from kennethreitz/requests/setup.py
package_directory = os.path.realpath(os.path.dirname(__file__))


def get_file_list(file_path):
    full_path = os.path.join(package_directory, file_path)
    file_list = os.listdir(full_path)
    # Filter out __pycache__
    file_list = [x for x in file_list if "__pycache__" not in x]
    # now we need to add the path to the files
    return [file_path + f for f in file_list]


def get_man_pages(dir):
    """
    Get man pages in a directory.
    :param dir:
    :return: list of file names
    """
    files = os.listdir(dir)
    r_files = []
    for file in files:
        if file.endswith(".1"):
            r_files.append(dir + "/" + file)
    return r_files


def get_scripts(dir):
    """
    Get files that are executable
    :param dir:
    :return: list of file names
    """
    files = os.listdir(dir)
    r_files = []
    for file in files:
        if os.stat(dir + "/" + file)[stat.ST_MODE] & stat.S_IEXEC:
            r_files.append(dir + "/" + file)
    return r_files


setup(
    scripts=get_scripts("tools"),
    data_files=[
        ("etc/edumfa/", ["deploy/apache/edumfaapp.wsgi", "deploy/edumfa/dictionary"]),
        ("share/man/man1", get_man_pages("tools")),
        (
            "lib/edumfa/migrations",
            [
                "migrations/alembic.ini",
                "migrations/env.py",
                "migrations/README",
                "migrations/script.py.mako",
            ],
        ),
        ("lib/edumfa/migrations/versions", get_file_list("migrations/versions/")),
        ("lib/edumfa/", ["requirements.txt"]),
    ],
)
