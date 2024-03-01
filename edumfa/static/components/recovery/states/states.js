/**
 * License:  AGPLv3
 * This file is part of eduMFA. eduMFA is a fork of privacyIDEA.
 *
 * 2016 Cornelius Kölbel, <cornelius@privacyidea.org>
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

angular.module('eduMfaApp.recoveryStates', ['ui.router', 'eduMfaApp.versioning']).config(
    ['$stateProvider', 'versioningSuffixProviderProvider',
        function ($stateProvider, versioningSuffixProviderProvider) {
            // get the instance, the pathname part
            var instance = window.location.pathname;
            if (instance === "/") {
               instance = "";
            }
            var recoverypath = instance + "/static/components/recovery/views/";
            $stateProvider
                .state('recovery', {
                    url: "/recovery",
                    templateUrl: recoverypath + "recovery.html" + versioningSuffixProviderProvider.$get().$get(),
                    controller: "recoveryController"
                })
                .state('reset', {
                    url: "/reset/{user:.*}/{recoverycode:.*}",
                    templateUrl: recoverypath + "recovery.reset.html" + versioningSuffixProviderProvider.$get().$get(),
                    controller: "recoveryController"
                });
        }]);
