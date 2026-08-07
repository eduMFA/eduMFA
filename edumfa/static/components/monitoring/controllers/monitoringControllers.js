myApp.controller("monitoringController", ["MonitoringFactory",
    "AuthFactory", "$scope",
    function (MonitoringFactory, AuthFactory, $scope) {

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
        const colorScheme = [
            "#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7", "#000000",
        ];
        $scope.timeFrame = [
            { label: "24 hours", unit: "hour", amount: 24 },
            { label: "1 Week", unit: "day", amount: 7 },
            { label: "1 Month", unit: "month", amount: 1 },
            { label: "3 Months", unit: "month", amount: 3 },
            { label: "6 Months", unit: "month", amount: 6 },
            { label: "1 Year", unit: "year", amount: 1 },
            { label: "All", unit: null, amount: null }
        ];

        $scope.tokenTimeline = angular.copy(emptyDefaultTimeline)
        $scope.datasetCache = {}
        $scope.datasetStatusMap = {}
        $scope.selectedTimeFrame = $scope.timeFrame[0]

        function getLineStyle(i) {
            if (i < colorScheme.length) {
                return { borderDash: [], pointStyle: 'circle' }
            } else if (i < colorScheme.length * 2) {
                return { borderDash: [2, 2], pointStyle: 'rect' }
            } else {
                return { borderDash: [8, 4], pointStyle: 'triangle' }
            }
        }

        function calculateDate(year, month, day) {
            var lastDay = new Date(year, month + 1, 0).getDate();
            day = Math.min(day, lastDay)
            return new Date(year, month, day)
        }

        function getStartTime(selectedTimeFrame) {
            var today = new Date()
            var day = today.getDate()
            var month = today.getMonth()
            var year = today.getFullYear()
            var unit = selectedTimeFrame.unit
            var amount = selectedTimeFrame.amount

            if (unit === null) {
                return null
            }
            if (unit === "hour") {
                return new Date(today.getTime() - (amount * 60 * 60 * 1000))
            }
            if (unit === "day") {
                day = day - amount
                return new Date(year, month, day)
            }
            if (unit === "month") {
                month = month - amount
                return calculateDate(year, month, day)
            }
            if (unit === "year") {
                year = year - amount
                return calculateDate(year, month, day)
            }
        };

        function minimalizeValues(values) {
            var maxLength = 10000  // more than that and the chart will be too slow to render.
            if (values.length <= maxLength) {
                return values
            }
            var bucketSize = Math.ceil(values.length / (maxLength / 2))
            var reducedValues = [];
            for (var i = 0; i < values.length; i += bucketSize) {
                var bucket = values.slice(i, i + bucketSize)
                var min = bucket[0]
                var max = bucket[0]
                for (var p of bucket) {
                    if (p.y < min.y) min = p
                    if (p.y > max.y) max = p
                }
                reducedValues.push(min, max)
            }
            return reducedValues
        };

        function isStillRelevant(sk, timeFrame) {
            var stillSelected = sk.selected
            var sameTimeFrame = $scope.selectedTimeFrame.label === timeFrame
            var notInDataset = !$scope.tokenTimeline.data.datasets.some(ds => ds.label === sk.name)
            return stillSelected && sameTimeFrame && notInDataset
        };

        $scope.getAvailableStatsKeys = function () {
            $scope.statsKeysLoadingText = "Loading statistics keys..."
            $scope.selectedStatsKeys = []
            $scope.availableStatsKeys = []
            var i = 0
            MonitoringFactory.get_stats_keys(function (data) {
                var newList = [];
                var d = data.result.value.sort()
                d.forEach(function (sk) {
                    var lineStyle = getLineStyle(i)
                    newList.push({
                        id: sk,
                        name: sk,
                        color: colorScheme[i++ % colorScheme.length],
                        selected: false,
                        checked: true,
                        datasetStatus: "",
                        borderDash: lineStyle.borderDash,
                        pointStyle: lineStyle.pointStyle
                    })
                })
                $scope.availableStatsKeys = newList
                if ($scope.availableStatsKeys.length === 0) {
                    $scope.statsKeysLoadingText = "No statistics keys found. Monitoring may not be set up yet for this instance."
                } else {
                    $scope.statsKeysLoadingText = ""
                }
            }, function (error) {
                $scope.statsKeysLoadingText = "Error loading statistics keys. Please try again later."
            })
        };

        $scope.getStatusText = function (name) {
            var key = name + "|" + $scope.selectedTimeFrame.label
            return $scope.datasetStatusMap[key] || ""
        }

        $scope.getDataset = function (sk, callback) {
            var startTime = getStartTime($scope.selectedTimeFrame)
            var key = sk.name + "|" + $scope.selectedTimeFrame.label
            if ($scope.datasetCache[key]) {
                callback($scope.datasetCache[key])
                return
            }
            $scope.datasetStatusMap[key] = " (loading...)"
            MonitoringFactory.get_monitored(sk.name, { start: startTime }, key, function (data) {
                var d = data.result.value
                var points = d.map(e => ({ x: new Date(e[0]).getTime(), y: e[1] }))
                    .filter(p => Number.isFinite(p.x) && Number.isFinite(p.y))
                points = minimalizeValues(points).sort((a, b) => a.x - b.x)
                var dataset = {
                    label: sk.name,
                    data: points,
                    borderColor: sk.color,
                    backgroundColor: sk.color,
                    pointBackgroundColor: sk.color,
                    pointBorderColor: '#fff',
                    borderDash: sk.borderDash,
                    pointStyle: sk.pointStyle,
                    hidden: false,
                    pointBorderWidth: 0.75,
                    pointRadius: 3.5,
                    borderWidth: 2,
                }
                if (dataset.data.length === 0) {
                    $scope.datasetStatusMap[key] = " (Timeout or no data available for this time frame)"
                } else {
                    $scope.datasetCache[key] = dataset
                    $scope.datasetStatusMap[key] = ""
                }
                callback(dataset);
            }, function (error) {
                    $scope.datasetStatusMap[key] = " (Error loading data)"
            })
        };

        $scope.addToTimeline = function (sk) {
            var timeFrame = $scope.selectedTimeFrame.label
            $scope.getDataset(sk, function (dataset) {
                if (isStillRelevant(sk, timeFrame)) {
                    $scope.tokenTimeline.data.datasets.push(dataset)
                }
            })
        };

        $scope.removeFromTimeline = function (ds) {
            var index = $scope.tokenTimeline.data.datasets.indexOf(ds)
            if (index > -1) {
                $scope.tokenTimeline.data.datasets.splice(index, 1)
            }
        };

        $scope.toggleStatsKey = function (sk) {
            var exists = $scope.tokenTimeline.data.datasets.find(ds => ds.label === sk.name)
            if (exists) {
                $scope.removeFromTimeline(exists)
                resetCheckboxes()
            } else {
                $scope.addToTimeline(sk)
                resetCheckboxes()
            }
        };

        $scope.addAllToTimeline = function () {
            $scope.availableStatsKeys.forEach(sk => {
                var needed = !$scope.tokenTimeline.data.datasets.some(ds => ds.label === sk.name)
                if (needed) {
                    $scope.addToTimeline(sk)
                }
                $scope.resetHidden(sk)
            })
        };

        $scope.clearTimeLine = function () {
            $scope.tokenTimeline.data.datasets = []
        };

        $scope.onTimeFrameChange = function () {
            $scope.clearTimeLine()
            $scope.availableStatsKeys.forEach(sk => {
                if (sk.selected) {
                    $scope.addToTimeline(sk)
                    $scope.resetHidden(sk)
                }
            })
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

        function resetCheckboxes() {
            $scope.selectedStatsKeys.forEach(sk => {
                var dataset = $scope.tokenTimeline.data.datasets.find(ds => ds.label === sk.name)
                if (dataset) {
                    sk.checked = !dataset.hidden
                }
            })
        };

        $scope.resetTimeline = function () {
            $scope.selectedTimeFrame = $scope.timeFrame[0]
            $scope.tokenTimeline = angular.copy(emptyDefaultTimeline)
        };

        $scope.resetAll = function () {
            MonitoringFactory.cancelAll()
            $scope.datasetCache = {};
            $scope.getAvailableStatsKeys()
            $scope.resetTimeline()
        };

        if (AuthFactory.checkRight('statistics_read')) {
            $scope.getAvailableStatsKeys();
        };

        $scope.$on("piReload", function () {
            if (AuthFactory.checkRight('statistics_read')) {
                $scope.resetAll();
                MonitoringFactory.cancelAll()
            }
        });

        $scope.$on('$destroy', function () {
            MonitoringFactory.cancelAll()
        });

    }]);