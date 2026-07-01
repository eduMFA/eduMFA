/**
 * License:  AGPLv3
 * This file is part of eduMFA. eduMFA is a fork of privacyIDEA.
 *
 * 2015 - 2018 Cornelius Kölbel <cornelius.koelbel@netknights.it>
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

myApp.factory("StatsFactory", ["AuthFactory", "$http", "$state", "$rootScope",
    "statsUrl", "inform",
    function (AuthFactory, $http, $state, $rootScope,
        statsUrl, inform) {
        /**
         *         Each service - just like this service factory - is a singleton.
         */
        return {
            getCurrentUsersWithTokens: function (params, callback) {
                $http.get(statsUrl + "/current/users_with_token", {
                    headers: { 'Authorization': AuthFactory.getAuthToken() },
                    params: params
                }).then(function (response) { callback(response.data) },
                    function (error) { AuthFactory.authError(error.data) });
            }
        }
    }]);
