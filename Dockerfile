# Build stage
FROM python:3.14.4-slim-trixie@sha256:2ca02f32b4d9d893863367ce07ec1972819f476dd38d8612f2a9cb6a41cbb727 AS builder
WORKDIR /tmp
COPY . .
RUN pip install --no-cache-dir build && \
    python -m build --sdist --wheel --outdir dist/

# Final stage
FROM python:3.14.4-slim-trixie@sha256:2ca02f32b4d9d893863367ce07ec1972819f476dd38d8612f2a9cb6a41cbb727

# Create an unprivileged user and group with UID/GID 1000
RUN groupadd -g 1000 edumfa && \
    useradd -u 1000 -g edumfa -s /bin/bash -m -d /opt/edumfa edumfa

# Install system dependencies
RUN apt-get update && \
    apt-get install -y curl libpq-dev gcc && \
    apt-get -y autoremove && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir psycopg2 gunicorn

# Copy the wheel file from the builder stage
COPY --from=builder /tmp/dist/*.whl /dist/

# Install the application wheel
RUN pip install --no-cache-dir /dist/*.whl &&  \
    rm -rf /dist/*.whl

# Pre-create the volume directory and set ownership BEFORE declaring the VOLUME
RUN mkdir -p /etc/edumfa && chown edumfa:edumfa /etc/edumfa
VOLUME ["/etc/edumfa"]

# Copy necessary files with the correct ownership
COPY --chown=edumfa:edumfa ./deploy/docker/entrypoint.sh /opt/edumfa/entrypoint.sh
COPY --chown=edumfa:edumfa ./deploy/docker/edumfa_config.py /opt/edumfa/edumfa_config.py
COPY --chown=edumfa:edumfa ./deploy/docker/logging.yml /opt/edumfa/logging.yml
COPY --chown=edumfa:edumfa ./deploy/docker/edumfaapp.py /opt/edumfa/app.py

# Create directory for user scripts and ensure ownership
RUN mkdir -p /opt/edumfa/user-scripts && \
    chown edumfa:edumfa /opt/edumfa/user-scripts

# Link the edumfa package at a predictable position for template overriding
RUN python_package_path="$(python3 -c 'import site; x=site.getsitepackages(); assert len(x) == 1; print(x[0])')" && \
    ln -s "${python_package_path}/edumfa/" "/opt/edumfa/edumfa-package" && \
    chown -h edumfa:edumfa "/opt/edumfa/edumfa-package"

# In order to enable edumfa-manage to automatically detect the correct config
# file in a container image mark the images with an env variable.
# This is checked in /edumfa/app.py
# This is a workaround until 3.0.0.
ENV __EDUMFA_RUNNING_IN_CONTAINER=1

EXPOSE 8000
HEALTHCHECK --interval=5s --timeout=3s --start-period=60s --retries=2 CMD curl --fail http://localhost:8000/ || exit 1

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/edumfa:$PATH"

WORKDIR /opt/edumfa

# Switch to the unprivileged user
USER 1000:1000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "app"]