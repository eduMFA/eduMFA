# Build stage
FROM python:3.12-slim-bookworm AS builder
WORKDIR /tmp
COPY . .
RUN pip install --no-cache-dir build && \
    python -m build --sdist --wheel --outdir dist/

# Final stage
FROM python:3.12-slim-bookworm

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
COPY ./deploy/logging.cfg /etc/edumfa/logging.cfg
COPY ./deploy/docker-setup.sh /opt/edumfa/docker-setup.sh

# Create directory for user scripts
RUN mkdir -p /opt/edumfa/user-scripts

EXPOSE 8000
WORKDIR /opt/edumfa

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/edumfa:$PATH"

CMD ["./docker-setup.sh"]