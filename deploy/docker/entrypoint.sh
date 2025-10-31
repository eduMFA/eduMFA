#!/usr/bin/bash
set -e

GEN_PWD="$(openssl rand -base64 42)"
EDUMFA_ADMIN_USER="${EDUMFA_ADMIN_USER:-admin}"
EDUMFA_ADMIN_PASS="${EDUMFA_ADMIN_PASS:-$GEN_PWD}"

# Create enckey if doesn't exist yet
edumfa-manage -q create_enckey || true

# Create audit keys if they don't exist yet
edumfa-manage -q create_audit_keys || true

# Create DB
echo "Creating DB"
# FIXME: this creates a exception trace on every attempt
attempts=10
until edumfa-manage -q create_tables
do
  if [[ $attempts -eq 0 ]]; then
    echo "Exhausted database connection tries. Stopping."
    exit 1
  else
    echo "Cannot connect to database. Trying again..."
    sleep 3
    attempts=$((attempts-1))
  fi
done

# Check and stamp DB
STAMP=$(edumfa-manage -q db current -d /usr/local/lib/edumfa/migrations 2>/dev/null)
if [[ -z "${STAMP//Running online/}" ]]; then
  edumfa-manage -q db stamp head -d /usr/local/lib/edumfa/migrations
fi

# Upgrading DB
echo "Upgrading Database"
edumfa-schema-upgrade /usr/local/lib/edumfa/migrations --skipstamp

# Create admin user
echo "Creating Admin"
edumfa-manage -q admin add "$EDUMFA_ADMIN_USER" -p "$EDUMFA_ADMIN_PASS"

# Execute user scripts
shopt -s nullglob
for script in /opt/edumfa/user-scripts/*.sh; do
  echo "Executing user script $script..."
  bash $script
done

echo "
    You can login with the following credentials:
    username: $EDUMFA_ADMIN_USER
    password: $EDUMFA_ADMIN_PASS
"

echo "Starting Server"
gunicorn --bind 0.0.0.0:8000 --workers 4 app
