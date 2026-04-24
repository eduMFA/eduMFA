#!/usr/bin/bash
set -e

# In eduMFA v2.9.0, the config and logging file were suggested to be put into a
# volume. This would lead to them not getting updated. This is a workaround to
# handle this unfortunate situation:
# If they are the same as in that release, delete them.
# If both were changed, the operator should be aware of the situation.
# If only one of the files was changed, the situation is ambiguous.
# This workaround will be deleted in v3.0.0.
config_equal="false"
logging_equal="false"
if [ -e "/etc/edumfa/edumfa.cfg" ]; then
  config_hash="$(sha256sum /etc/edumfa/edumfa.cfg | cut -d " " -f 1 )"
  if [ "$config_hash" == "a87cf5f96a5eb1ceb0f6d59c9083814e2c55bf7c3b85ca8ecdb532dc059fa064" ]; then
    config_equal="true"
  fi
fi
if [ -e "/etc/edumfa/logging.yml" ]; then
  logging_hash="$(sha256sum /etc/edumfa/logging.yml | cut -d " " -f 1 )"
  if [ "$logging_hash" == "447d9ab4f18505e6acc441a94a68e2a3410125c37b6bc942ad0c5523a1caf6f9" ]; then
    logging_equal="true"
  fi
fi
if [[ "$config_equal" == "true" && "$logging_equal" == "true" ]]; then
  # No changes to either file. This should be the most common scenario, since
  # the example compose file relied on environment variables to configure
  # eduMFA.
  rm -f "/etc/edumfa/edumfa.cfg"
  rm -f "/etc/edumfa/logging.yml"
elif [[ "$config_equal" != "true" && "$logging_equal" != "true" ]]; then
  # Both files were edited and/or already deleted.
  true
else
  # Only one file was edited, the situation is ambigious.
  echo "=======================================================================
  Due to an error in v2.9.0, the following files were moved:
  /etc/edumfa/edumfa.cfg ==> /opt/edumfa/edumfa.cfg
  /etc/edumfa/logging.yml ==> /opt/edumfa/logging.yml
  Please update your deployments if necessary.
  This warning will disappear in eduMFA 3.0.0."
  echo "======================================================================="
fi

# Decide which config file to use. The hierarchy is as follows:
# 0. Use $EDUMFA_CONFIGFILE if it is set.
# 1. Use /etc/edumfa/edumfa.cfg if it exists.
# 2. Use this container's /opt/edumfa/edumfa_config.py.
if [ -v EDUMFA_CONFIGFILE ]; then
  export EDUMFA_CONFIGFILE
elif [ -e "/etc/edumfa/edumfa.cfg" ]; then
  export EDUMFA_CONFIGFILE="/etc/edumfa/edumfa.cfg"
else
  export EDUMFA_CONFIGFILE="/opt/edumfa/edumfa_config.py"
fi
# Make sure the config is working by executing it once.
python3 "$EDUMFA_CONFIGFILE"

if [ -n "$EDUMFA_ADMIN_USER_FILE" ]; then
  EDUMFA_ADMIN_USER=$(cat "$EDUMFA_ADMIN_USER_FILE")
fi
EDUMFA_ADMIN_USER="${EDUMFA_ADMIN_USER:-admin}"
# Check if password is set, otherwise generate one.
GENERATED_PASSWORD=0
if [ -n "$EDUMFA_ADMIN_PASS_FILE" ]; then
  EDUMFA_ADMIN_PASS=$(cat "$EDUMFA_ADMIN_PASS_FILE")
fi
if [ -z "$EDUMFA_ADMIN_PASS" ]; then
  echo "No EDUMFA_ADMIN_PASS set, a random password will be generated and printed when initialization finishes."
  EDUMFA_ADMIN_PASS="$(openssl rand -base64 42)"
  GENERATED_PASSWORD=1
fi

# Create enckey if doesn't exist yet
edumfa-manage -q create_enckey || true

# Create audit keys if they don't exist yet
edumfa-manage -q create_audit_keys || true

# Wait for DB to be available
edumfa-manage -q wait_for_db || exit 1

# Create DB tables if the DB is unstamped.
edumfa-manage -q create_tables

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
  bash "$script"
done

if [ $GENERATED_PASSWORD -eq 1 ]; then
  echo "
      You can login with the following credentials:
      username: $EDUMFA_ADMIN_USER
      password: $EDUMFA_ADMIN_PASS
  "
fi

echo "Starting Server"
gunicorn --bind 0.0.0.0:8000 --workers 4 app
