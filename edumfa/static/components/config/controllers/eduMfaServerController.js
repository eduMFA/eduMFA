/**
 * License:  AGPLv3
 * This file is part of eduMFA. eduMFA is a fork of privacyIDEA.
 *
 * 2017 Cornelius Kölbel, <cornelius@privacyidea.org>
 *
 * (c) cornelius kölbel, cornelius@privacyidea.org
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
myApp.controller("eduMfaServerController", ["$scope", "$stateParams", "inform",
                                                 "gettextCatalog", "$state",
                                                 "$location", "ConfigFactory",
                                                 function($scope, $stateParams,
                                                          inform, gettextCatalog,
                                                          $state, $location,
                                                          ConfigFactory) {
    // Set the default route
    if ($location.path() === "/config/edumfaserver") {
        $location.path("/config/edumfaserver/list");
    }

    // Get all servers
    $scope.getEduMfaServers = function (identifier) {
        ConfigFactory.getEduMfaServer(function(data) {
            $scope.eduMfaServers = data.result.value;
            //debug: console.log("Fetched all edumfa servers");
            //debug: console.log($scope.edumfaServers);
            // return one single eduMFA server
            if (identifier) {
                $scope.params = $scope.eduMfaServers[identifier];
                $scope.params["identifier"] = identifier;
            }
        });
    };

    if ($location.path() === "/config/edumfaserver/list") {
    // in case of list we fetch all servers
        $scope.getEduMfaServers();
    }

    $scope.identifier = $stateParams.identifier;
    if ($scope.identifier) {
        // We are editing an existing eduMFA Server
        $scope.getEduMfaServers($scope.identifier);
    } else {
        // This is a new eduMFA server
        $scope.params = {
            tls: true
        }
    }

    $scope.delEduMfaServer = function (identifier) {
        ConfigFactory.delEduMfaServer(identifier, function(data) {
            $scope.getEduMfaServers();
        });
    };

    $scope.addEduMfaServer = function (params) {
        ConfigFactory.addEduMfaServer(params, function(data) {
            $scope.getEduMfaServers();
        });
    };

    $scope.testEduMfaServer = function() {
        ConfigFactory.testEduMfaServer($scope.params, function(data) {
           if (data.result.value === true) {
               inform.add(gettextCatalog.getString("Request to remote eduMFA server successful."), {type: "info"});
           }
        });
    };

    $scope.saveEduMfaServer = function() {
        ConfigFactory.addEduMfaServer($scope.params, function(data){
            if (data.result.status === true) {
                inform.add(gettextCatalog.getString("eduMFA Server Config saved."), {type: "info"});
                $state.go('config.edumfaserver.list');
            }
        });
    };

    // listen to the reload broadcast
    $scope.$on("piReload", $scope.getEduMfaServers);

}]);
