FROM python:3.12-slim-bookworm AS builder
WORKDIR /tmp
COPY . .
RUN pip install --no-cache-dir build && \
    python -m build --sdist --wheel --outdir dist/

FROM python:3.12-slim-bookworm
# Copy the wheel file from the builder stage
COPY --from=builder /tmp/dist/*.whl /dist/


RUN apt-get update &&  \
    apt-get install -y curl libpq-dev gcc && \
    pip install --no-cache-dir psycopg2 && \
    apt-get purge -y gcc &&  \
    apt-get -y autoremove && \
    apt-get clean  && \
    rm -rf /var/lib/apt/lists/*

# Copy necessary files
COPY ./deploy/gunicorn/edumfaapp.py /opt/edumfa/app.py
COPY ./deploy/logging.cfg /etc/edumfa/logging.cfg
COPY ./deploy/docker-setup.sh /opt/edumfa/docker-setup.sh


EXPOSE 8000
WORKDIR /opt/edumfa

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/edumfa:$PATH"

CMD ["./docker-setup.sh"]