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
    $scope.selectedTimeFrame = $scope.timeFrame[0];

    var datasetCache = {};
    var datasetStatusMap = {};
    var requestSeq = {};
    var statsKeysSeq = 0;

    function keyToHash(key) {
      const enc = new TextEncoder();
      const bytes = enc.encode(key.normalize("NFC"));
      let h = 0x811c9dc5;
      for (const b of bytes) {
        h ^= b;
        h = Math.imul(h, 0x01000193);
      }
      h ^= h >>> 16;
      h = Math.imul(h, 0x85ebca6b);
      h ^= h >>> 13;
      h = Math.imul(h, 0xc2b2ae35);
      h ^= h >>> 16;
      return (h >>> 0) >>> 26;
    }

    function getStyle(sk) {
      var hash = keyToHash(sk);
      var colorIndex = hash % colorScheme.length;
      var dashIndex = Math.floor(hash / colorScheme.length) % dashStyles.length;
      return {
        color: colorScheme[colorIndex],
        ...dashStyles[dashIndex],
      };
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
        delete datasetStatusMap[key];
      } else {
        datasetStatusMap[key] = { state: state, detail: detail || "" };
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

    $scope.isSelected = function (sk) {
      return sk.selected;
    };

    $scope.getStatus = function (name) {
      return datasetStatusMap[statusKey(name)] || null;
    };

    function getAvailableStatsKeys() {
      var seq = ++statsKeysSeq;
      var isCurrent = function () {
        return seq === statsKeysSeq;
      };
      $scope.statsKeysState = STATUS.LOADING;
      $scope.availableStatsKeys = [];
      MonitoringFactory.getStatsKeys(
        function (data) {
          if (!isCurrent()) return;
          try {
            var d = ((data && data.result && data.result.value) || []).sort();
            var newList = d.map(function (sk) {
              var style = getStyle(sk) || {};
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
        function (error, meta) {
          if (!isCurrent()) return;
          if (meta && meta.cancelled) return;
          $scope.statsKeysState = STATUS.ERROR;
        },
      );
    }

    function getDataset(sk, callback) {
      var startTime = getStartTime($scope.selectedTimeFrame);
      var key = statusKey(sk.name);
      if (datasetCache[key]) {
        callback(datasetCache[key]);
        return;
      }
      var current = datasetStatusMap[key];
      if (current && current.state === STATUS.LOADING) {
        return;
      }
      var seq = (requestSeq[key] = (requestSeq[key] || 0) + 1);
      var isCurrent = function () {
        return requestSeq[key] === seq;
      };
      setStatus(key, STATUS.LOADING);
      MonitoringFactory.getMonitored(
        sk.name,
        { start: startTime, max_points: 500 },
        key,
        function (data) {
          if (!isCurrent()) return;
          var d = data.result.value;
          var points = d
            .map((e) => ({ x: new Date(e[0]).getTime(), y: e[1] }))
            .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
            .sort((a, b) => a.x - b.x);
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
            pointRadius: 2.5,
            pointHoverRadius: 5,
            pointHitRadius: 6,
            borderWidth: 2,
          };
          if (dataset.data.length === 0) {
            setStatus(key, STATUS.EMPTY);
          } else {
            datasetCache[key] = dataset;
            setStatus(key, null);
          }
          callback(dataset);
        },
        function (error, meta) {
          if (!isCurrent()) return;
          if (meta && meta.cancelled) {
            setStatus(key, null);
            return;
          }
          setStatus(key, STATUS.ERROR, extractDetail(error));
        },
      );
    }

    function addToTimeline(sk) {
      var timeFrame = $scope.selectedTimeFrame.label;
      getDataset(sk, function (dataset) {
        if (isStillRelevant(sk, timeFrame)) {
          applyVisibility(sk, dataset);
          if (dataset.data.length !== 0) {
            $scope.tokenTimeline.data.datasets.push(dataset);
          }
        }
      });
    }

    function removeFromTimeline(ds) {
      var index = $scope.tokenTimeline.data.datasets.findIndex(
        (d) => d.label === ds.label,
      );
      if (index > -1) {
        $scope.tokenTimeline.data.datasets.splice(index, 1);
      }
    }

    $scope.syncSelection = function () {
      $scope.availableStatsKeys.forEach(function (sk) {
        var key = statusKey(sk.name);
        var dataset = $scope.tokenTimeline.data.datasets.find(
          (ds) => ds.label === sk.name,
        );
        if (sk.selected) {
          if (!dataset && !datasetStatusMap[key]) {
            addToTimeline(sk);
          }
        } else {
          requestSeq[key] = (requestSeq[key] || 0) + 1;
          MonitoringFactory.cancel(key);
          setStatus(key, null);
          if (dataset) {
            removeFromTimeline(dataset);
          }
        }
      });
    };

    $scope.onTimeFrameChange = function () {
      MonitoringFactory.cancelAll();
      $scope.tokenTimeline.data.datasets = [];
      $scope.availableStatsKeys.forEach((sk) => {
        if (sk.selected) {
          addToTimeline(sk);
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
      getAvailableStatsKeys();
    }

    $scope.$on("piReload", function () {
      if (AuthFactory.checkRight("statistics_read")) {
        MonitoringFactory.cancelAll();
        datasetCache = {};
        datasetStatusMap = {};
        $scope.selectedTimeFrame = $scope.timeFrame[0];
        $scope.tokenTimeline = angular.copy(emptyDefaultTimeline);
        getAvailableStatsKeys();
      }
    });

    $scope.$on("$destroy", function () {
      MonitoringFactory.cancelAll();
    });
  },
]);
