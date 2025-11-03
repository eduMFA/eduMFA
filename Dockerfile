# Build stage
FROM python:3.14.0-slim-trixie@sha256:4ed33101ee7ec299041cc41dd268dae17031184be94384b1ce7936dc4e5dead3 AS builder
WORKDIR /tmp
COPY . .
RUN pip install --no-cache-dir build && \
    python -m build --sdist --wheel --outdir dist/

# Final stage
FROM python:3.14.0-slim-trixie@sha256:4ed33101ee7ec299041cc41dd268dae17031184be94384b1ce7936dc4e5dead3
USER root

RUN addgroup --gid 2000 edumfa \
  && adduser --disabled-password --disabled-login --gecos "" --uid 2000 --gid 2000 edumfa

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

# Volume for audit- and enckey
VOLUME ["/etc/edumfa"]

# Create directory for user scripts and make sure the edumfa user can create
# files in /etc/edumfa/.
RUN mkdir /etc/edumfa/ && chown -R edumfa:edumfa /etc/edumfa/

# Copy necessary files
COPY ./deploy/docker/entrypoint.sh /opt/edumfa/entrypoint.sh
COPY ./deploy/docker/edumfa.py /etc/edumfa/edumfa.cfg
COPY ./deploy/docker/logging.yml /etc/edumfa/logging.yml
COPY ./deploy/gunicorn/edumfaapp.py /opt/edumfa/app.py

# Create directory for user scripts
RUN mkdir -p /opt/edumfa/user-scripts

# Link the edumfa package at a predicatable position for template overriding.
RUN python_package_path="$(python3 -c 'import site; x=site.getsitepackages(); assert len(x) == 1; print(x[0])')" && \
    ln -s "${python_package_path}/edumfa/" "/opt/edumfa/edumfa-package"

EXPOSE 8000
HEALTHCHECK --interval=5s --timeout=3s --start-period=60s --retries=2 CMD curl --fail http://localhost:8000/ || exit 1
WORKDIR /opt/edumfa

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/edumfa:$PATH"

USER edumfa

CMD ["./entrypoint.sh"]
