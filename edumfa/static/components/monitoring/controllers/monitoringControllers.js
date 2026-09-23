myApp.controller("monitoringController", [
  "MonitoringFactory",
  "AuthFactory",
  "$scope",
  function (MonitoringFactory, AuthFactory, $scope) {
    const emptyDefaultTimeline = {
      data: { datasets: [] },
    };

    const colorScheme = [
      "#E69F00",
      "#56B4E9",
      "#009E73",
      "#F0E442",
      "#0072B2",
      "#D55E00",
      "#CC79A7",
      "#000000",
    ];

    const dashStyles = [
      { borderDash: [], pointStyle: "circle" },
      { borderDash: [2, 2], pointStyle: "rect" },
      { borderDash: [8, 3, 2, 3], pointStyle: "rectRot" },
      { borderDash: [8, 4], pointStyle: "triangle" },
      { borderDash: [], pointStyle: false },
      { borderDash: [2, 2], pointStyle: false },
      { borderDash: [8, 3, 2, 3], pointStyle: false },
      { borderDash: [8, 4], pointStyle: false },
    ];

    const STATUS = { LOADING: "loading", EMPTY: "empty", ERROR: "error" };

    $scope.timeFrame = [
      { label: "24 hours", unit: "hour", amount: 24 },
      { label: "1 Week", unit: "day", amount: 7 },
      { label: "1 Month", unit: "month", amount: 1 },
      { label: "3 Months", unit: "month", amount: 3 },
      { label: "6 Months", unit: "month", amount: 6 },
      { label: "1 Year", unit: "year", amount: 1 },
      { label: "All", unit: null, amount: null },
    ];

    $scope.tokenTimeline = angular.copy(emptyDefaultTimeline);
    $scope.datasetCache = {};
    $scope.datasetStatusMap = {};
    $scope.selectedTimeFrame = $scope.timeFrame[0];

    function keyToSlot(sk) {
      var hash = 0;
      for (var char of sk) {
        hash = (hash << 5) - hash + char.charCodeAt(0);
      }
      return Math.abs(hash);
    }

    function buildStyleMap(allKeys) {
      var totalSlots = colorScheme.length * dashStyles.length;
      var styleMap = new Map();
      var used = new Set();
      allKeys.forEach((sk) => {
        var slot = keyToSlot(sk) % totalSlots;
        var attempts = 0;
        while (used.has(slot) && attempts < totalSlots) {
          slot = (slot + 1) % totalSlots;
          attempts++;
        }
        used.add(slot);
        var colorIndex = slot % colorScheme.length;
        var dashIndex =
          Math.floor(slot / colorScheme.length) % dashStyles.length;
        styleMap.set(sk, {
          color: colorScheme[colorIndex],
          ...dashStyles[dashIndex],
        });
      });
      return styleMap;
    }

    function calculateDate(year, month, day) {
      var lastDay = new Date(year, month + 1, 0).getDate();
      day = Math.min(day, lastDay);
      return new Date(year, month, day);
    }

    function getStartTime(selectedTimeFrame) {
      var today = new Date();
      var day = today.getDate();
      var month = today.getMonth();
      var year = today.getFullYear();
      var unit = selectedTimeFrame.unit;
      var amount = selectedTimeFrame.amount;

      if (unit === null) {
        return null;
      }
      if (unit === "hour") {
        return new Date(today.getTime() - amount * 60 * 60 * 1000);
      }
      if (unit === "day") {
        day = day - amount;
        return new Date(year, month, day);
      }
      if (unit === "month") {
        month = month - amount;
        return calculateDate(year, month, day);
      }
      if (unit === "year") {
        year = year - amount;
        return calculateDate(year, month, day);
      }
    }

    function minimalizeValues(values) {
      var maxLength = 10000; // more than that and the chart will be too slow to render.
      if (values.length <= maxLength) {
        return values;
      }
      var bucketSize = Math.ceil(values.length / (maxLength / 2));
      var reducedValues = [];
      for (var i = 0; i < values.length; i += bucketSize) {
        var bucket = values.slice(i, i + bucketSize);
        var min = bucket[0];
        var max = bucket[0];
        for (var p of bucket) {
          if (p.y < min.y) min = p;
          if (p.y > max.y) max = p;
        }
        reducedValues.push(min);
        if (max !== min) reducedValues.push(max);
      }
      return reducedValues;
    }

    function isStillRelevant(sk, timeFrame) {
      var stillSelected = sk.selected;
      var sameTimeFrame = $scope.selectedTimeFrame.label === timeFrame;
      var notInDataset = !$scope.tokenTimeline.data.datasets.some(
        (ds) => ds.label === sk.name,
      );
      return stillSelected && sameTimeFrame && notInDataset;
    }

    function statusKey(name, timeFrameLabel) {
      return name + "|" + (timeFrameLabel || $scope.selectedTimeFrame.label);
    }

    function setStatus(key, state, detail) {
      if (!state) {
        delete $scope.datasetStatusMap[key];
      } else {
        $scope.datasetStatusMap[key] = { state: state, detail: detail || "" };
      }
    }

    function extractDetail(error) {
      var res = error && error.data && error.data.result;
      return (
        (res && res.error && res.error.message) ||
        (error && error.statusText) ||
        ""
      );
    }

    $scope.isSelected = function (k) {
      return k.selected;
    };

    $scope.getStatus = function (name) {
      return $scope.datasetStatusMap[statusKey(name)] || null;
    };

    $scope.getAvailableStatsKeys = function () {
      $scope.statsKeysState = STATUS.LOADING;
      $scope.availableStatsKeys = [];
      MonitoringFactory.getStatsKeys(
        function (data) {
          try {
            var d = ((data && data.result && data.result.value) || []).sort();
            var styleMap = buildStyleMap(d);
            var newList = d.map(function (sk) {
              var style = styleMap.get(sk) || {};
              return {
                id: sk,
                name: sk,
                color: style.color,
                visible: true,
                borderDash: style.borderDash,
                pointStyle: style.pointStyle,
              };
            });
            $scope.availableStatsKeys = newList;
            $scope.statsKeysState = newList.length === 0 ? STATUS.EMPTY : null;
          } catch (e) {
            $scope.statsKeysState = STATUS.ERROR;
          }
        },
        function (error) {
          $scope.statsKeysState = STATUS.ERROR;
        },
      );
    };

    $scope.getDataset = function (sk, callback) {
      var startTime = getStartTime($scope.selectedTimeFrame);
      var key = statusKey(sk.name);
      if ($scope.datasetCache[key]) {
        callback($scope.datasetCache[key]);
        return;
      }
      setStatus(key, STATUS.LOADING);
      MonitoringFactory.getMonitored(
        sk.name,
        { start: startTime },
        key,
        function (data) {
          var d = data.result.value;
          var points = d
            .map((e) => ({ x: new Date(e[0]).getTime(), y: e[1] }))
            .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
          points = minimalizeValues(points).sort((a, b) => a.x - b.x);
          if (points.length === 1 && sk.pointStyle === false) {
            sk.pointStyle = "circle";
          }
          var dataset = {
            label: sk.name,
            data: points,
            borderColor: sk.color,
            backgroundColor: sk.color,
            pointBackgroundColor: sk.color,
            pointBorderColor: "#fff",
            borderDash: sk.borderDash,
            pointStyle: sk.pointStyle,
            hidden: false,
            pointBorderWidth: 0.75,
            pointRadius: 3.5,
            borderWidth: 2,
          };
          if (dataset.data.length === 0) {
            setStatus(key, STATUS.EMPTY);
          } else {
            $scope.datasetCache[key] = dataset;
            setStatus(key, null);
          }
          callback(dataset);
        },
        function (error, meta) {
          if (meta && meta.cancelled) {
            setStatus(key, null);
            return;
          }
          setStatus(key, STATUS.ERROR, extractDetail(error));
        },
      );
    };

    $scope.addToTimeline = function (sk) {
      var timeFrame = $scope.selectedTimeFrame.label;
      $scope.getDataset(sk, function (dataset) {
        if (isStillRelevant(sk, timeFrame)) {
          applyVisibility(sk, dataset);
          if (dataset.data.length !== 0) {
            $scope.tokenTimeline.data.datasets.push(dataset);
          }
        }
      });
    };

    $scope.removeFromTimeline = function (ds) {
      var index = $scope.tokenTimeline.data.datasets.findIndex(
        (d) => d.label === ds.label,
      );
      if (index > -1) {
        $scope.tokenTimeline.data.datasets.splice(index, 1);
      }
    };

    $scope.syncSelection = function () {
      $scope.availableStatsKeys.forEach(function (sk) {
        var key = statusKey(sk.name);
        var dataset = $scope.tokenTimeline.data.datasets.find(
          (ds) => ds.label === sk.name,
        );
        if (sk.selected) {
          if (!dataset) {
            $scope.addToTimeline(sk);
          }
        } else {
          MonitoringFactory.cancel(key);
          setStatus(key, null);
          if (dataset) {
            $scope.removeFromTimeline(dataset);
          }
        }
      });
    };

    $scope.onTimeFrameChange = function () {
      MonitoringFactory.cancelAll();
      $scope.tokenTimeline.data.datasets = [];
      $scope.availableStatsKeys.forEach((sk) => {
        if (sk.selected) {
          $scope.addToTimeline(sk);
        }
      });
    };

    function applyVisibility(sk, dataset) {
      if (dataset) {
        dataset.hidden = !sk.visible;
      }
    }

    $scope.changeHidden = function (sk) {
      applyVisibility(
        sk,
        $scope.tokenTimeline.data.datasets.find((ds) => ds.label === sk.name),
      );
    };

    if (AuthFactory.checkRight("statistics_read")) {
      $scope.getAvailableStatsKeys();
    }

    $scope.$on("piReload", function () {
      if (AuthFactory.checkRight("statistics_read")) {
        MonitoringFactory.cancelAll();
        $scope.datasetCache = {};
        $scope.datasetStatusMap = {};
        $scope.selectedTimeFrame = $scope.timeFrame[0];
        $scope.tokenTimeline = angular.copy(emptyDefaultTimeline);
        $scope.getAvailableStatsKeys();
      }
    });

    $scope.$on("$destroy", function () {
      MonitoringFactory.cancelAll();
    });
  },
]);
