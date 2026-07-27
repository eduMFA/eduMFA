/**
 *
 * 2020 Cornelius Kölbel, <cornelius.koelbel@netknights.it>
 *
 * This code is free software; you can redistribute it and/or
 * modify it under the terms of the GNU AFFERO GENERAL PUBLIC LICENSE
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or any later version.
 *
 * This code is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU AFFERO GENERAL PUBLIC LICENSE for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */


myApp.controller("dashboardController", ["ConfigFactory", "TokenFactory",
    "AuditFactory", "MonitoringFactory",
    "$scope", "$location", "AuthFactory",
    function (ConfigFactory, TokenFactory,
        AuditFactory, MonitoringFactory,
        $scope, $location, AuthFactory) {

        $scope.tokens = { "total": 0, "hardware": 0 };
        $scope.policies = {
            "active": [], "num_active": 0,
            "inactive": [], "num_inactive": 0
        };
        $scope.events = {
            "active": [], "num_active": 0,
            "inactive": [], "num_inactive": 0
        };
        $scope.authentications = { "success": 0, "fail": 0 };

        $scope.get_total_token_number = function () {
            // We call getTokens with pagesize=0, so that we do
            // not need any user resolving.
            TokenFactory.getTokensNoCancel(function (data) {
                if (data) {
                    $scope.tokens.total = data.result.value.count;
                }
            }, { "pagesize": 0 });
        };

        $scope.get_token_hardware = function () {
            TokenFactory.getTokensNoCancel(function (data) {
                if (data) {
                    $scope.tokens.hardware = data.result.value.count;
                }
            }, { "pagesize": 0, "infokey": "tokenkind", "infovalue": "hardware" });
            TokenFactory.getTokensNoCancel(function (data) {
                if (data) {
                    $scope.tokens.unassigned_hardware = data.result.value.count;
                }
            }, { "pagesize": 0, "infokey": "tokenkind", "infovalue": "hardware", "assigned": "False" });
        };

        $scope.get_token_software = function () {
            TokenFactory.getTokensNoCancel(function (data) {
                if (data) {
                    $scope.tokens.software = data.result.value.count;
                }
            }, { "pagesize": 0, "infokey": "tokenkind", "infovalue": "software" });
            TokenFactory.getTokensNoCancel(function (data) {
                if (data) {
                    $scope.tokens.unassigned_software = data.result.value.count;
                }
            }, { "pagesize": 0, "infokey": "tokenkind", "infovalue": "software", "assigned": "False" });
        };

        $scope.get_policies = function () {
            ConfigFactory.getPolicies(function (data) {
                $scope.policies = {
                    "active": [], "num_active": 0,
                    "inactive": [], "num_inactive": 0
                };
                var policies = data.result.value;
                angular.forEach(policies, function (policy) {
                    if (policy.active) {
                        $scope.policies.active.push(policy.name);
                        $scope.policies.num_active += 1;
                    } else {
                        $scope.policies.inactive.push(policy.name);
                        $scope.policies.num_inactive += 1;
                    }
                });
            });
        };

        $scope.get_events = function () {
            $scope.events = {
                "active": [], "num_active": 0,
                "inactive": [], "num_inactive": 0
            };
            ConfigFactory.getEvents(function (data) {
                var events = data.result.value;
                angular.forEach(events, function (event) {
                    if (event.active) {
                        $scope.events.active.push(event);
                        $scope.events.num_active += 1;
                    } else {
                        $scope.events.inactive.push(event);
                        $scope.events.num_inactive += 1;
                    }
                });
            });
        };

        $scope.getAuthentication = function () {
            $scope.authentications = { "success": 0, "fail": 0 };
            AuditFactory.get({ "timelimit": "1d", "action": "*validate/*check", "success": "1" },
                function (data) {
                    $scope.authentications.success = data.result.value.count;
                });
            AuditFactory.get({ "timelimit": "1d", "action": "*validate/*check", "success": "0" },
                function (data) {
                    $scope.authentications.fail = data.result.value.count;
                    $scope.authentications.users = {}; // Declare the users object as a dictionary
                    $scope.authentications.serials = Array();
                    angular.forEach(data.result.value.auditdata, function (auditentry) {
                        if (auditentry.user) {
                            // Check if the user already exists in the dictionary
                            if (!$scope.authentications.users[auditentry.user + "-" + auditentry.realm]) {
                                // Add the user to the dictionary with a count of 1 and the latest error date
                                $scope.authentications.users[auditentry.user + "-" + auditentry.realm] = { "user": auditentry.user, "realm": auditentry.realm, "fails": 1, "latestError": auditentry.date };
                            } else {
                                // Increment the number of fails for the existing user and update the latest error date
                                $scope.authentications.users[auditentry.user + "-" + auditentry.realm].fails++;
                                if (auditentry.date > $scope.authentications.users[auditentry.user + "-" + auditentry.realm].latestError) {
                                    $scope.authentications.users[auditentry.user + "-" + auditentry.realm].latestError = auditentry.date;
                                }
                            }
                        } else {
                            $scope.authentications.serials.push(auditentry.serial);
                        }
                    });
                    // Convert the dictionary to an array and sort it by the latest error date
                    $scope.authentications.users = Object.values($scope.authentications.users);
                    $scope.authentications.users.sort(function (a, b) {
                        return b.latestError - a.latestError;
                    });
                });
        };

        $scope.getAdministration = function () {
            $scope.administration = [];
            angular.forEach(["system", "resolver", "realm", "policy", "event"],
                function (adminaction) {
                    AuditFactory.get({ "timelimit": "1d", "action": "POST /" + adminaction + "*" },
                        function (data) {
                            angular.forEach(data.result.value.auditdata, function (auditentry) {
                                $scope.administration.push(auditentry);
                            });
                            // reverse sort it by date
                            $scope.administration.sort($scope.compare_auditentries);
                            // only return the last 5 entries
                            $scope.administration = $scope.administration.slice(0, 5);
                        });
                });
        };

        $scope.compare_auditentries = function (a, b) {
            if (a.date < b.date) return 1;
            if (b.date < a.date) return -1;
            return 0;
        };

        const emptyDefaultTimeline = {
            data: { datasets: [] },
            options: {
                plugins: {
                    decimation: {
                        enabled: true,
                        algorithm: "lttb",
                        samples: 500,
                        threshold: 500
                    }
                }
            }
        };
        $scope.tokenTimeline = angular.copy(emptyDefaultTimeline)
        $scope.pendingRequests = {};
        $scope.datasetCache = {};

        $scope.timeFrame = [
            { label: "24 hours", unit: "hour", amount: 24 },
            { label: "1 Week", unit: "day", amount: 7 },
            { label: "1 Month", unit: "month", amount: 1 },
            { label: "3 Months", unit: "month", amount: 3 },
            { label: "6 Months", unit: "month", amount: 6 },
            { label: "1 Year", unit: "year", amount: 1 },
            { label: "All", unit: "year", amount: 100 }
        ];
        $scope.selectedTimeFrame = $scope.timeFrame[0]

        const colorMap = {
            hardware_tokens: '#4e79a7',
            software_tokens: '#f28e2b',
            total_tokens: '#e15759',
            user_with_token: '#76b7b2',
            assigned_tokens: '#59a14f',
            unassigned_hardware_tokens: '#edc948'
        };

        function generateColor() {
            const chars = '0123456789ABCDEF';
            let color = '#';
            for (let i = 0; i < 6; i++) {
                color += chars[Math.floor(Math.random() * 16)];
            }
            return color
        };

        $scope.getAvailableStatsKeys = function () {
            $scope.selectedStatsKeys = []
            $scope.availableStatsKeys = []
            MonitoringFactory.get_stats_keys(function (data) {
                var newList = [];
                data.result.value.forEach(function (sk) {
                    newList.push({
                        id: sk,
                        name: sk,
                        color: colorMap[sk] || generateColor(),
                        selected: false,
                        checked: true
                    })
                })
                $scope.availableStatsKeys = newList
            })
        };

        function getStartTime(selectedTimeFrame) {
            var today = new Date()
            var day = today.getDate()
            var month = today.getMonth()
            var year = today.getFullYear()
            var hours = today.getHours()
            var minutes = today.getMinutes()

            if (selectedTimeFrame.unit === "hour") {
                hours = hours - selectedTimeFrame.amount
                return new Date(year, month, day, hours, minutes)
            }
            if (selectedTimeFrame.unit === "day") {
                day = day - selectedTimeFrame.amount
            }
            if (selectedTimeFrame.unit === "month") {
                month = month - selectedTimeFrame.amount
            }
            if (selectedTimeFrame.unit === "year") {
                year = year - selectedTimeFrame.amount
            }
            return new Date(year, month, day)
        };

        $scope.changeHidden = function (sk) {
            var dataset = $scope.tokenTimeline.data.datasets.find(ds => ds.label === sk.name)
            if (dataset) {
                dataset.hidden = !sk.checked
            }
        };

        $scope.resetHidden = function (sk) {
            sk.checked = true
            $scope.changeHidden(sk)
        };

        $scope.clearTimeLine = function () {
            $scope.tokenTimeline.data.datasets = []
        };

        $scope.resetTimeline = function () {
            $scope.selectedTimeFrame = $scope.timeFrame[0]
            $scope.tokenTimeline = angular.copy(emptyDefaultTimeline)
        };

        $scope.resetAll = function () {
            $scope.pendingRequests = {};
            $scope.datasetCache = {};
            $scope.getAvailableStatsKeys()
            $scope.resetTimeline()
        };

        $scope.getDataset = function (sk, callback) {
            var startTime = getStartTime($scope.selectedTimeFrame)
            var key = sk.name + "|" + $scope.selectedTimeFrame.label
            // Todo: pendingRequests -> gleiche keys abfangen
            if ($scope.datasetCache[key]) {
                callback($scope.datasetCache[key])
                return
            }
            if ($scope.pendingRequests[key]) {
                $scope.pendingRequests[key].push({ callback: callback});
                return;
            }
            $scope.pendingRequests[key] = [{ callback: callback}];

            MonitoringFactory.get_monitored(sk.name, { start: startTime }, function (data) {
                var d = data.result.value;
                var color = sk.color;
                var points = d
                    .map(e => ({ x: new Date(e[0]).getTime(), y: e[1] }))
                    .filter(p => Number.isFinite(p.x) && Number.isFinite(p.y))
                    .sort((a, b) => a.x - b.x);
                var dataset = {
                    label: sk.name,
                    data: points,
                    borderColor: color,
                    backgroundColor: color,
                    pointBackgroundColor: color,
                    hidden: false
                }
                $scope.datasetCache[key] = dataset
                var waiters = $scope.pendingRequests[key];
                delete $scope.pendingRequests[key];
                waiters.forEach(function (w) {
                    w.callback(dataset); 
                });
            })
        };

        function isStillRelevant(sk, timeFrame) {
            var stillSelected = $scope.selectedStatsKeys.some(key => key.name === sk.name)
            var sameTimeFrame = timeFrame === $scope.selectedTimeFrame.label
            var NotInDataset = !$scope.tokenTimeline.data.datasets.some(ds => ds.label === sk.name);
            return stillSelected && sameTimeFrame && NotInDataset
        };

        $scope.addToTimeline = function (sk) {
            var timeFrame = $scope.selectedTimeFrame.label
            $scope.getDataset(sk, function (dataset) {
                if (isStillRelevant(sk, timeFrame))
                    $scope.tokenTimeline.data.datasets.push(dataset)
            })
        };

        $scope.removeFromTimeline = function (ds) {
            var index = $scope.tokenTimeline.data.datasets.indexOf(ds)
            if (index > -1) {
                $scope.tokenTimeline.data.datasets.splice(index, 1)
            }
        };

        $scope.toggleStatsKey = function (sk) {
            var exists = $scope.tokenTimeline.data.datasets.find(ds => ds.label === sk.name);
            if (exists) {
                $scope.removeFromTimeline(exists)
            } else {
                $scope.addToTimeline(sk)
            }
        };

        $scope.onTimeFrameChange = function () {
            $scope.clearTimeLine()
            $scope.selectedStatsKeys.forEach(sk => {
                $scope.addToTimeline(sk)
                $scope.resetHidden(sk)
            })
        };

        $scope.addAllToTimeline = function () {
            $scope.availableStatsKeys.forEach(sk => {
                var needed = !$scope.tokenTimeline.data.datasets.some(ds => ds.label === sk.name);
                if (needed) {
                    $scope.addToTimeline(sk)
                }
                $scope.resetHidden(sk)
            })
        };

        if (AuthFactory.checkRight('tokenlist')) {
            $scope.get_total_token_number();
            $scope.get_token_hardware();
            $scope.get_token_software();
        }
        if (AuthFactory.checkRight('policyread')) {
            $scope.get_policies();
        }
        if (AuthFactory.checkRight('eventhandling_read')) {
            $scope.get_events();
        }
        if (AuthFactory.checkRight('auditlog')) {
            $scope.getAuthentication();
            $scope.getAdministration();
        }
        if (AuthFactory.checkRight('statistics_read')) {
            $scope.getAvailableStatsKeys();
        }

        // listen to the reload broadcast
        $scope.$on("piReload", function () {
            if (AuthFactory.checkRight('tokenlist')) {
                $scope.get_total_token_number();
                $scope.get_token_hardware();
                $scope.get_token_software();
            }
            if (AuthFactory.checkRight('policyread')) {
                $scope.get_policies();
            }
            if (AuthFactory.checkRight('eventhandling_read')) {
                $scope.get_events();
            }
            if (AuthFactory.checkRight('auditlog')) {
                $scope.getAuthentication();
                $scope.getAdministration();
            }
            if (AuthFactory.checkRight('statistics_read')) {
                $scope.resetAll();
            }
        });
    }]);
