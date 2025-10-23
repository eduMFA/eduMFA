# Build stage
FROM python:3.14.0-slim-trixie@sha256:4ed33101ee7ec299041cc41dd268dae17031184be94384b1ce7936dc4e5dead3 AS builder
WORKDIR /tmp
COPY . .
RUN pip install --no-cache-dir build && \
    python -m build --sdist --wheel --outdir dist/

# Final stage
FROM python:3.14.0-slim-trixie@sha256:4ed33101ee7ec299041cc41dd268dae17031184be94384b1ce7936dc4e5dead3

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

# Copy necessary files
COPY ./deploy/gunicorn/edumfaapp.py /opt/edumfa/app.py
COPY ./deploy/docker/logging.cfg /etc/edumfa/logging.cfg
COPY ./deploy/docker-setup.sh /opt/edumfa/docker-setup.sh

# Create directory for user scripts
RUN mkdir -p /opt/edumfa/user-scripts

EXPOSE 8000
HEALTHCHECK --interval=5s --timeout=3s --start-period=60s --retries=2 CMD curl --fail http://localhost:8000/ || exit 1
WORKDIR /opt/edumfa

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/edumfa:$PATH"

CMD ["./docker-setup.sh"]
