from edumfa.lib.tokens.pushtoken import PushTokenBaseClass
from edumfa.lib import _


class APP_ACTION(object):
    FIREBASE_CONFIG = "edumfaapp_firebase_configuration"
    REGISTRATION_URL = "edumfaapp_registration_url"
    TTL = "edumfaapp_ttl"
    MOBILE_TEXT = "edumfaapp_text_on_mobile"
    MOBILE_TITLE = "edumfaapp_title_on_mobile"
    SSL_VERIFY = "edumfaapp_ssl_verify"
    WAIT = "edumfaapp_wait"
    ALLOW_POLLING = "edumfaapp_allow_polling"


class EduMFAApplicationToken(PushTokenBaseClass):
    CLASS_TYPE = "edumfaapp"
    CLASS_PREFIX = "EDUA"

    TITLE = _("eduMFA Application")
    DESCRIPTION = _("eduMFA Application: Send a push notification to eduMFA smartphone app.")

    KEY_CLASS = APP_ACTION
