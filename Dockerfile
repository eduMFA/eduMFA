# Build stage
FROM python:3.13.7-slim-bookworm@sha256:9b8102b7b3a61db24fe58f335b526173e5aeaaf7d13b2fbfb514e20f84f5e386 AS builder
WORKDIR /tmp
COPY . .
RUN pip install --no-cache-dir build && \
    python -m build --sdist --wheel --outdir dist/

# Final stage
FROM python:3.13.7-slim-bookworm@sha256:9b8102b7b3a61db24fe58f335b526173e5aeaaf7d13b2fbfb514e20f84f5e386

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

# Copy necessary files
COPY ./deploy/docker/entrypoint.sh /opt/edumfa/entrypoint.sh
COPY ./deploy/docker/edumfa.py /etc/edumfa/edumfa.cfg
COPY ./deploy/docker/logging.yml /etc/edumfa/logging.yml
COPY ./deploy/gunicorn/edumfaapp.py /opt/edumfa/app.py

# Create directory for user scripts
RUN mkdir -p /opt/edumfa/user-scripts

EXPOSE 8000
HEALTHCHECK --interval=5s --timeout=3s --start-period=60s --retries=2 CMD curl --fail http://localhost:8000/ || exit 1
WORKDIR /opt/edumfa

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/edumfa:$PATH"

CMD ["./entrypoint.sh"]
