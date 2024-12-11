#!/bin/bash
set -e

# MariaDB needs a second
sleep 5

# Create enckey if doesn't exist yet
if [ ! -f /etc/edumfa/enckey ]; then
  edumfa-manage create_enckey
fi

# Create audit keys if they don't exist yet
if [[ ! -f /etc/edumfa/pubkey.pem && ! -f /etc/edumfa/private.pem ]]; then
  edumfa-manage create_audit_keys
fi

# Create DB
echo "Creating DB"
edumfa-manage createdb

# Check and stamp DB
STAMP=$(edumfa-manage db current -d /usr/local/lib/edumfa/migrations 2>/dev/null)
if [[ -z "${STAMP//Running online/}" ]]; then
  edumfa-manage db stamp head -d /usr/local/lib/edumfa/migrations
fi

# Upgrading DB
echo "Upgrading Database"
edumfa-manage db upgrade -d /usr/local/lib/edumfa/migrations

# Create admin user
echo "Creating Admin"
edumfa-manage admin add $EDUMFA_ADMIN_USER -p $EDUMFA_ADMIN_PASS

# Execute user scripts
if compgen -G "/opt/edumfa/user-scripts/*.sh" > /dev/null; then
    echo "Executing User-Scripts"
    bash /opt/edumfa/user-scripts/*.sh
fi

echo "Starting Server"
gunicorn --bind 0.0.0.0:8000 --workers 4 app
