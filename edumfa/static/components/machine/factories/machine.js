/**
 * License:  AGPLv3
 * This file is part of eduMFA. eduMFA is a fork of privacyIDEA.
 *
 * 2015 Cornelius Kölbel, <cornelius@privacyidea.org>
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

myApp.factory("MachineFactory", ['AuthFactory', '$http', '$state', '$rootScope',
                                 'machineUrl', 'applicationUrl',
                                 function (AuthFactory, $http, $state,
                                           $rootScope, machineUrl,
                                           applicationUrl) {
        return {
            getMachines: function(params, callback) {
                $http.get(machineUrl + "/", {
                    headers: {'Authorization': AuthFactory.getAuthToken() },
                    params: params
                }).then(function(response) { callback(response.data) },
                    function(error) { AuthFactory.authError(error.data) });
            },
            getMachineTokens: function(params, callback) {
                $http.get(machineUrl + "/token", {
                    headers: {'Authorization': AuthFactory.getAuthToken()},
                    params: params
                }).then(function(response) { callback(response.data) },
                    function(error) { AuthFactory.authError(error.data) });
            },
            attachTokenMachine: function(params, callback) {
                $http.post(machineUrl + "/token", params, {
                    headers: {'Authorization': AuthFactory.getAuthToken()}
                }).then(function(response) { callback(response.data) },
                    function(error) { AuthFactory.authError(error.data) });
            },
            detachTokenMachine: function(params, callback) {
                // /token/<serial>/<application>/<ID>
                $http.delete(machineUrl + "/token/" + params.serial + "/" +
                    params.application + "/" + params.mtid,
                    { headers: {'Authorization': AuthFactory.getAuthToken()}
                }).then(function(response) { callback(response.data) },
                    function(error) { AuthFactory.authError(error.data) });
            },
            getApplicationDefinition: function(callback) {
                $http.get(applicationUrl + "/", {
                    headers: {'Authorization': AuthFactory.getAuthToken()}
            }).then(function(response) { callback(response.data) },
                    function(error) { AuthFactory.authError(error.data) });
            },
            saveOptions: function(params, callback) {
                $http.post(machineUrl + "/tokenoption", params, {
                    headers: {'Authorization': AuthFactory.getAuthToken()}
                }).then(function(response) { callback(response.data) },
                    function(error) { AuthFactory.authError(error.data) });
            }
        };

}]);
