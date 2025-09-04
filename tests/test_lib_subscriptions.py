"""
This test file tests the lib.subscriptions.py
"""

from .base import MyTestCase
from edumfa.lib.subscriptions import (
    save_subscription,
    get_subscription,
    raise_exception_probability,
    check_subscription,
)

# 100 users
SUBSCRIPTION1 = {
    "by_address": "provider-address",
    "for_email": "customer@example.com",
    "num_tokens": 100,
    "num_users": 100,
    "level": "Gold",
    "for_comment": "comment",
    "date_from": "2016-10-24",
    "for_address": "customer-address",
    "signature": "24287419543134291932335914280232067571967865893672677932354574121521748844689122490399903572722627692437421759860332653860825381771420923865100775095168810778157750122430333094307912014590689769228979527735405954705615614505247995506136338010930079794077541100403759754392432809967862978004604278914337052409517895998984832947211907032852653171723886377329563223486623362230032551555536271158219094006763746441282022250783412321241299993657761512776112262708235357995055119379697774465205945934356687189514600830870353192115780195534680601265109038104466390286558785622582056183085321696667197925775161589029048460315",
    "for_phone": "12345",
    "by_email": "provider@example.com",
    "date_till": "2026-10-22",
    "by_name": "NetKnights GmbH",
    "application": "demo_application",
    "by_url": "http://provider",
    "for_name": "customer",
    "by_phone": "12345",
    "for_url": "http://customer",
    "num_clients": 100,
}


class SubscriptionApplicationTestCase(MyTestCase):
    def test_01_subscriptions(self):
        r = save_subscription(SUBSCRIPTION1)
        self.assertTrue(r)

        # Get
        subs = get_subscription()
        self.assertEqual(len(subs), 0)

    def test_02_exception_propability(self):
        s = raise_exception_probability()
        # do not raise
        self.assertFalse(s)

    def test_03_check_subscription(self):
        s = check_subscription("demo_application")
        self.assertTrue(s)
