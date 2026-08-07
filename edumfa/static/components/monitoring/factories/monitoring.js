myApp.factory("MonitoringFactory", ["AuthFactory", "$http", "monitoringUrl", "$q",
    function (AuthFactory, $http, monitoringUrl, $q) {
        /**
         Each service - just like this service factory - is a singleton.
         */

        var cancelers = {};

        return {

            get_stats_keys: function (callback) {
                $http.get(monitoringUrl + "/", {
                    headers: { 'Authorization': AuthFactory.getAuthToken() },
                }).then(function (response) { callback(response.data) },
                    function (error) { AuthFactory.authError(error.data) });
            },

            get_monitored: function (stats_key, params, cacheKey, callback) {
                if (cancelers[cacheKey]) {
                    cancelers[cacheKey].resolve();
                }
                cancelers[cacheKey] = $q.defer();

                $http.get(monitoringUrl + "/" + stats_key, {
                    headers: { 'Authorization': AuthFactory.getAuthToken() },
                    params: params,
                    timeout: cancelers[cacheKey].promise,
                }).then(function (response) {
                    delete cancelers[cacheKey];
                    callback(response.data)
                },
                    function (error) { AuthFactory.authError(error.data) });
            },
            cancelAll: function () {
                Object.keys(cancelers).forEach(function (key) {
                    cancelers[key].resolve();
                });
                cancelers = {};
            }
        }
    }]);

myApp.directive('timelineChart', function () {
    return {
        restrict: 'E',
        scope: {
            tokenTimeline: '=',
        },
        template: `
            <div class="chartOuter" style="width:100%; overflow-x:auto; overflow-y:hidden; position:relative;">
                <div class="chartWrapper" style="position:relative; height:400px;">
                    <canvas class="chartCanvas"></canvas>
                </div>
            </div>
        `,
        link: function (scope, element) {
            var root = element[0];
            var outer = root.querySelector('.chartOuter');
            var wrapper = root.querySelector('.chartWrapper');
            var canvas = root.querySelector('canvas');
            function setWidth(datasets) {
                var maxPoints = 0;
                (datasets || []).forEach(function (ds) {
                    if (ds.data && ds.data.length > maxPoints) maxPoints = ds.data.length;
                });

                var pxPerPoint = 15;
                var outerWidth = outer.clientWidth;
                var neededWidth = maxPoints * pxPerPoint;
                var dpr = window.devicePixelRatio || 1;
                var browserMax = 30000;
                var maxAllowedWidth = Math.floor(browserMax / dpr);
                var width = Math.max(outerWidth, Math.min(neededWidth, maxAllowedWidth));

                wrapper.style.width = width + 'px';
                canvas.style.width = width + 'px';
                canvas.style.height = '400px';

                chart.resize();
                chart.update();
            }
            var chart = new Chart(element.find('canvas')[0], {
                type: 'line',
                data: {
                    datasets: []
                },
                options: {
                    animation: false,
                    parsing: false,
                    normalized: true,
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        decimation: {
                            algorithm: 'lttb',
                            enabled: true,
                            samples: 500,
                            threshold: 500
                        },
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                tooltipFormat: 'dd.MM.yyyy HH:mm:ss',
                            },
                            ticks: {
                                callback: function (value) {
                                    const d = new Date(value);
                                    const pad = n => String(n).padStart(2, '0');
                                    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
                                },
                                autoSkip: true,
                            },
                        },
                        y: { beginAtZero: false, ticks: { precision: 0 } }
                    },
                }
            }
            );
            scope.$watch('tokenTimeline', function (c) {
                if (!c) return;
                chart.data.datasets = c.data.datasets;
                setWidth(c.data.datasets);
            }, true);
            scope.$on('$destroy', function () { chart.destroy(); });
        }
    };
});