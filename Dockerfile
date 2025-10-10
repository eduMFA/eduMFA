# Build stage
FROM python:3.13.7-slim-bookworm@sha256:adafcc17694d715c905b4c7bebd96907a1fd5cf183395f0ebc4d3428bd22d92d AS builder
WORKDIR /tmp
COPY . .
RUN pip install --no-cache-dir build && \
    python -m build --sdist --wheel --outdir dist/

# Final stage
FROM python:3.13.7-slim-bookworm@sha256:adafcc17694d715c905b4c7bebd96907a1fd5cf183395f0ebc4d3428bd22d92d
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

EXPOSE 8000
HEALTHCHECK --interval=5s --timeout=3s --start-period=60s --retries=2 CMD curl --fail http://localhost:8000/ || exit 1
WORKDIR /opt/edumfa

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/edumfa:$PATH"

USER edumfa

CMD ["./entrypoint.sh"]
