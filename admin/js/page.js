var pageController = ["$scope", "$http", "$routeParams", function ($scope, $http, $routeParams) {
    
    var editor = CKEDITOR.replace("body-editor");
    editor.on("change", function(){
        $scope.page.body = editor.getData();
    });
    
    document.title = ($routeParams.title) ? "Editing: " + $routeParams.title : "Creating New Page";
    
    $scope.plugins = [
        {name: "Edit", isActive: true },
        {name: "History", isActive: false },
        {name: "Comments", isActive: false }
    ];
    
    $scope.templates = [];
    $scope.selectedTemplate = {};
    $scope.page = {};
    $scope.history = [];
    
    var defaultTemplate = {};
    
    $http({
        method: 'GET',
        url: "http://127.0.0.1:3000/puca/api/theme",
        headers: { "X-Requested-With": "XMLHttpRequest" }
    }).
    success(function(data) {
        $scope.templates = data.templates;
        for (var i = 0; i < $scope.templates.length; i++) {
            if ($scope.templates[i].file == data.default) {
                defaultTemplate = $scope.templates[i];
            }
        }
        setTemplateObject();
    }).
    error(function(data, status, headers, config) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
    });
    
    if ($routeParams.title) {
        $http({
            method: 'GET',
            url: "http://127.0.0.1:3000/puca/api/pages/" + $routeParams.title,
            headers: { "X-Requested-With": "XMLHttpRequest" }
        }).
        success(function(data) {
            $scope.page = data;
            setTemplateObject();
            $scope.history = [1];
        }).
        error(function(data, status, headers, config) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    }
    
    function setTemplateObject() {
        if (!$scope.page.template) {
            $scope.selectedTemplate = defaultTemplate;
        } else {
            for (var i = 0; i < $scope.templates.length; i++) {
                if ($scope.templates[i].file == $scope.page.template) {
                    $scope.selectedTemplate = $scope.templates[i];
                }
            }
        }
    }
    
    $scope.getTagClass = function(tag) {
        return "label label-primary uppercase";
    }
    
    $scope.getConfirmKeys = function (tag) {
        return [9, 13];
    };

    $scope.select = function (plugin) {
        /*
        $scope.plugins.forEach(function(plugin){
            plugin.isActive = false;
        });
        
        plugin.isActive = true;
        */
    };
    
    $scope.getClassName = function (plugin) {
        return (plugin.isActive) ? "active" : "";
    };
    
    $scope.publish = function () {
        $scope.page.published = ! $scope.page.published;
        $scope.save();
    };
    
    $scope.save = function () {
        var url = "http://127.0.0.1:3000/puca/api/pages/" + encodeURIComponent($scope.page.title);
        
        var data = {
            title: $scope.page.title,
            body: $scope.page.body,
            tags: $scope.page.tags,
            template: $scope.selectedTemplate.file,
            published: $scope.page.published
        };
        
        var method = ($scope.history.length > 0) ? "POST" : "PUT";
        
        $http({
            method: method,
            url: url,
            data: data
        }).
        success(function(data, status, headers, config) {
            $scope.history = [1];
        }).
        error(function(data, status, headers, config) {
        });
    };
    
    $scope.delete = function () {
        var url = "http://127.0.0.1:3000/puca/api/pages/" + encodeURIComponent($scope.page.title);
        $http.delete(url).
        success(function(data, status, headers, config) {
            // this callback will be called asynchronously
            // when the response is available
        }).
        error(function(data, status, headers, config) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
        window.location.hash = "#/pages";
    };
}];