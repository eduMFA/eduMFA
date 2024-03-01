"""
This test file tests the lib/edumfaserver.py
"""
from .base import MyTestCase
from edumfa.lib.error import ConfigAdminError
from edumfa.lib.edumfaserver import (add_edumfaserver,
                                               delete_edumfaserver,
                                               get_edumfaserver,
                                               get_edumfaservers,
                                               eduMFAServer)
import responses
from responses import matchers


class eduMFAServerTestCase(MyTestCase):

    def test_01_create_radius(self):
        r = add_edumfaserver(identifier="myserver",
                                  url="https://pi/pi",
                                  description="Hallo")
        self.assertTrue(r > 0)
        r = add_edumfaserver(identifier="myserver2",
                                  url="https://pi2/pi",
                                  tls=False,
                                  description="Hallo")
        r = add_edumfaserver(identifier="myserver3",
                                  url="https://pi3/pi",
                                  tls=True,
                                  description="Hallo")

        server_list = get_edumfaservers()
        self.assertTrue(server_list)
        self.assertEqual(len(server_list), 3)
        server_list = get_edumfaservers(identifier="myserver")
        self.assertEqual(server_list[0].config.identifier, "myserver")
        self.assertTrue(server_list[0].config.tls)
        self.assertEqual(server_list[0].config.description, "Hallo")
        self.assertEqual(server_list[0].config.url, "https://pi/pi")

        for server in ["myserver", "myserver2", "myserver3"]:
            r = delete_edumfaserver(server)
            self.assertTrue(r > 0)

        server_list = get_edumfaservers()
        self.assertEqual(len(server_list), 0)

    def test_02_updateserver(self):
        r = add_edumfaserver(identifier="myserver", url="https://pi/pi",
                                  tls=False)
        self.assertTrue(r > 0)
        server = get_edumfaserver("myserver")
        self.assertEqual(server.config.url, "https://pi/pi")
        self.assertFalse(server.config.tls)
        r = add_edumfaserver(identifier="myserver", url="https://pi/",
                                  tls=True, description="Hallo")
        self.assertTrue(r > 0)
        server = get_edumfaserver("myserver")
        self.assertEqual(server.config.url, "https://pi/")
        self.assertEqual(server.config.tls, True)
        self.assertEqual(server.config.description, "Hallo")

    def test_03_missing_configuration(self):
        self.assertRaises(ConfigAdminError, get_edumfaserver, "notExisting")

    @responses.activate
    def test_04_edumfa_request(self):
        responses.add(responses.POST, "https://edumfa/pi/validate/check",
                      body="""{
            "jsonrpc": "2.0",
            "signature": "8714492288983608958721372435263469282038130269793819687538718333085851022315074567013564786433032592569773009757668260857150988825993253128403096686276017572870299270974318705442428477018018734211619614135162719525545735285162164985627482472020309913143284756699606758573589339750891246114721488327919685939018812698986042837837048205963507243718362073386749929275433723467277740468538209437683755941724140343215877868596281187733952567488886126455218397004400817126119660003078762499546137083926344365458736163867631154552432520453852071998486914168310985851091111203094188983006153929089352703802214328258347608348",
            "detail": null,
            "version": "eduMFA 2.20.dev2",
            "result": {
              "status": true,
              "value": true},
            "time": 1503561105.028947,
            "id": 1
                }""",
                      content_type="application/json")

        responses.add(responses.POST, "https://edumfa/pi2/validate/check",
                      body="""{
        "jsonrpc": "2.0",
        "signature": "8714492288983608958721372435263469282038130269793819687538718333085851022315074567013564786433032592569773009757668260857150988825993253128403096686276017572870299270974318705442428477018018734211619614135162719525545735285162164985627482472020309913143284756699606758573589339750891246114721488327919685939018812698986042837837048205963507243718362073386749929275433723467277740468538209437683755941724140343215877868596281187733952567488886126455218397004400817126119660003078762499546137083926344365458736163867631154552432520453852071998486914168310985851091111203094188983006153929089352703802214328258347608348",
        "detail": null,
        "version": "eduMFA 2.20.dev2",
        "result": {
          "status": false},
        "time": 1503561105.028947,
        "id": 1
        }""",
                      content_type="application/json",
                      status=404)

        responses.add(responses.POST, "https://edumfa/pi3/validate/check",
                      body="""{
                "jsonrpc": "2.0",
                "signature": "8714492288983608958721372435263469282038130269793819687538718333085851022315074567013564786433032592569773009757668260857150988825993253128403096686276017572870299270974318705442428477018018734211619614135162719525545735285162164985627482472020309913143284756699606758573589339750891246114721488327919685939018812698986042837837048205963507243718362073386749929275433723467277740468538209437683755941724140343215877868596281187733952567488886126455218397004400817126119660003078762499546137083926344365458736163867631154552432520453852071998486914168310985851091111203094188983006153929089352703802214328258347608348",
                "detail": null,
                "version": "eduMFA 2.20.dev2",
                "result": {
                  "status": true,
                  "value": false},
                "time": 1503561105.028947,
                "id": 1
                }""",
                      content_type="application/json",
                      status=404)

        # successful authentication
        r = add_edumfaserver(identifier="pi", url="https://edumfa/pi", tls=False)
        self.assertTrue(r > 0)
        pi = get_edumfaserver("pi")
        r = eduMFAServer.request(pi.config, "user", "password")
        self.assertTrue(r)

        # failed  authentication 404
        r = add_edumfaserver(identifier="pi2", url="https://edumfa/pi2", tls=False)
        self.assertTrue(r > 0)
        pi = get_edumfaserver("pi2")
        r = eduMFAServer.request(pi.config, "user", "password")
        self.assertFalse(r)

        # failed  authentication value=false
        r = add_edumfaserver(identifier="pi3",
                                  url="https://edumfa/pi3",
                                  tls=False)
        self.assertTrue(r > 0)
        pi = get_edumfaserver("pi3")
        r = eduMFAServer.request(pi.config, "user", "password")
        self.assertFalse(r)

        # check for correct percent encoding
        responses.add(responses.POST, "https://edumfa/pi4/validate/check",
                      body="""{
            "detail": null,
            "result": {
              "status": true,
              "value": true},
            "id": 1
            }""",
                      content_type="application/json",
                      match=[matchers.urlencoded_params_matcher({"user": "user",
                                                                 "pass": "pw_w_%25123"})])
        r = add_edumfaserver(identifier="pi4",
                                  url="https://edumfa/pi4",
                                  tls=False)
        self.assertTrue(r > 0)
        pi = get_edumfaserver("pi4")
        r = eduMFAServer.request(pi.config, "user", "pw_w_%123")
        self.assertTrue(r)

    @responses.activate
    def test_05_edumfa_validate_check(self):
        responses.add(responses.POST, "https://edumfa/pi/validate/check",
                      body="""{
            "jsonrpc": "2.0",
            "signature": "8714492288983608958721372435263469282038130269793819687538718333085851022315074567013564786433032592569773009757668260857150988825993253128403096686276017572870299270974318705442428477018018734211619614135162719525545735285162164985627482472020309913143284756699606758573589339750891246114721488327919685939018812698986042837837048205963507243718362073386749929275433723467277740468538209437683755941724140343215877868596281187733952567488886126455218397004400817126119660003078762499546137083926344365458736163867631154552432520453852071998486914168310985851091111203094188983006153929089352703802214328258347608348",
            "detail": null,
            "version": "eduMFA 2.20.dev2",
            "result": {
              "status": true,
              "value": true},
            "time": 1503561105.028947,
            "id": 1
                }""",
                      content_type="application/json")

        responses.add(responses.POST, "https://edumfa/pi2/validate/check",
                      body="""{
        "jsonrpc": "2.0",
        "signature": "8714492288983608958721372435263469282038130269793819687538718333085851022315074567013564786433032592569773009757668260857150988825993253128403096686276017572870299270974318705442428477018018734211619614135162719525545735285162164985627482472020309913143284756699606758573589339750891246114721488327919685939018812698986042837837048205963507243718362073386749929275433723467277740468538209437683755941724140343215877868596281187733952567488886126455218397004400817126119660003078762499546137083926344365458736163867631154552432520453852071998486914168310985851091111203094188983006153929089352703802214328258347608348",
        "detail": null,
        "version": "eduMFA 2.20.dev2",
        "result": {
          "status": false},
        "time": 1503561105.028947,
        "id": 1
        }""",
                      content_type="application/json",
                      status=404)

        responses.add(responses.POST, "https://edumfa/pi3/validate/check",
                      body="""{
                "jsonrpc": "2.0",
                "signature": "8714492288983608958721372435263469282038130269793819687538718333085851022315074567013564786433032592569773009757668260857150988825993253128403096686276017572870299270974318705442428477018018734211619614135162719525545735285162164985627482472020309913143284756699606758573589339750891246114721488327919685939018812698986042837837048205963507243718362073386749929275433723467277740468538209437683755941724140343215877868596281187733952567488886126455218397004400817126119660003078762499546137083926344365458736163867631154552432520453852071998486914168310985851091111203094188983006153929089352703802214328258347608348",
                "detail": null,
                "version": "eduMFA 2.20.dev2",
                "result": {
                  "status": true,
                  "value": false},
                "time": 1503561105.028947,
                "id": 1
                }""",
                      content_type="application/json",
                      status=404)

        # successful authentication
        r = add_edumfaserver(identifier="pi", url="https://edumfa/pi",
                                  tls=False)
        self.assertTrue(r > 0)
        pi = get_edumfaserver("pi")
        r = pi.validate_check("user", "password")
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.json().get("result").get("value"))

        # failed  authentication 404
        r = add_edumfaserver(identifier="pi2",
                                  url="https://edumfa/pi2",
                                  tls=False)
        self.assertTrue(r > 0)
        pi = get_edumfaserver("pi2")
        r = pi.validate_check("user", "password", realm="realmA")
        self.assertEqual(r.status_code, 404)
        self.assertFalse(r.json().get("result").get("value"))

        # failed  authentication value=false
        r = add_edumfaserver(identifier="pi3",
                                  url="https://edumfa/pi3",
                                  tls=False)
        self.assertTrue(r > 0)
        pi = get_edumfaserver("pi3")
        r = pi.validate_check("user", "password", transaction_id=102)
        self.assertEqual(404, r.status_code)
        self.assertFalse(r.json().get("result").get("value"))

        # check for correct percent encoding
        responses.add(responses.POST, "https://edumfa/pi4/validate/check",
                      body="""{
            "detail": null,
            "result": {
              "status": true,
              "value": true},
            "id": 1
            }""",
                      content_type="application/json",
                      match=[matchers.urlencoded_params_matcher({"user": "user",
                                                                 "pass": "pw_w_%25123"})])
        r = add_edumfaserver(identifier="pi4",
                                  url="https://edumfa/pi4",
                                  tls=False)
        self.assertTrue(r > 0)
        pi = get_edumfaserver("pi4")
        r = pi.validate_check("user", "pw_w_%123")
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.json().get("result").get("value"))
