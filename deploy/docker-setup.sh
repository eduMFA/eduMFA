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
echo "Upgrading Database"
edumfa-manage db upgrade -d /usr/local/lib/edumfa/migrations

# Create admin user
echo "Creating Admin"
edumfa-manage admin add $EDUMFA_ADMIN_USER -p $EDUMFA_ADMIN_PASS

echo "Executing User-Scripts"
# Execute user scripts
bash /opt/edumfa/user-scripts/*.sh

echo "Starting Server"
gunicorn --bind 0.0.0.0:8000 --workers 4 app
