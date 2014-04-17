"use strict";

var app = angular.module("PUCA", ["ngRoute", "ngSanitize", "bootstrap-tagsinput"])

    .config(["$routeProvider", function ($routeProvider) {

    $routeProvider

    /* post */

    .when("/pages", {
        templateUrl: 'html/pagelist.html',
        controller: pageListController
    })
    
    .when("/pages/edit/:title", {
        templateUrl: 'html/page.html',
        controller: pageController
    })

    .when("/pages/create", {
        templateUrl: 'html/page.html',
        controller: pageController
    })

    .when("/upload", {
        templateUrl: 'html/upload.html',
        controller: uploadController
    })

    .when("/settings", {
        templateUrl: 'html/settings.html',
        controller: settingsController
    })

    .otherwise({redirectTo: "/settings"});

}]);

var navController = ["$scope", "$route", function ($scope, $route) {
    $scope.coreItems = [
        {name: "Page", link: "#/pages", isActive: function () { return testRoute(pageListController) || testRoute(pageController); } },
        {name: "Upload", link: "#/upload", isActive: function () { return testRoute(uploadController); } },
        {name: "Settings", link: "#/settings", isActive: function () { return testRoute(settingsController); } }
    ];
    
    function testRoute(controller) {
        try {
            return $route.current.controller == controller;
        } catch (err) {
            return false;
        }
    }
    
    $scope.getClassName = function (plugin) {
        return (plugin.isActive()) ? "active" : "";
    };
}];
