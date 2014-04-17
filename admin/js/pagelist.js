var pageListController = ["$scope", "$http", function ($scope, $http) {
    $scope.pages = [];
    
    $http({
        method: 'GET',
        url: "http://127.0.0.1:3000/puca/api/pages/all",
        headers: { "X-Requested-With": "XMLHttpRequest" }
    }).
    success(function(data) {
        $scope.pages = data;
    }).
    error(function(data, status, headers, config) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
    });
    
    $scope.prettyDate = function (int) {
        return humaneDate(new Date(int));
    };
    
}];