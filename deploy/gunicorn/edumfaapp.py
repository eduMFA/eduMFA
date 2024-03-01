import sys

sys.stdout = sys.stderr
from edumfa.app import create_app

# Now we can select the config file:
application = create_app(config_name="production", config_file="/etc/edumfa/edumfa.cfg")
