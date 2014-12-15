readerControllers.controller('addfeedController', ['$scope', '$http', function ($scope, $http){
    $scope.cancelParseFeedURL = function(){
        $scope.changeRoute('/reader');
    };
    $scope.parseFeedURL = function(){
        $scope.addFeedURLAction = true;
        $scope.curParsedItems = [];
        console.log($scope.addFeedURL);
        if($scope.addFeedURL){
            $http.post('/api/addfeed/parse', {url: $scope.addFeedURL}).
                success(function(data, status, headers, config) {
                    $scope.curParsedItems = data;
                    var curTitle = '';
                    data.forEach(function(theCurItem){
                        curTitle = theCurItem.meta.title;
                    });
                    $http.post('/api/addfeed/assigntouser', {url: $scope.addFeedURL, title: curTitle}).
                        success(function(data, status, headers, config) {
                            if(data){
                                console.log(data);
                                if(data == 'Feed is created, re-run the assignment'){
                                    $http.post('/api/addfeed/assigntouser', {url: $scope.addFeedURL, title: curTitle}).
                                        success(function(data, status, headers, config) {
                                            $scope.changeRoute('/reader');
                                        }).
                                        error(function(data, status, headers, config) {
                                            console.log(data);
                                        });
                                } else {
                                    $scope.changeRoute('/reader');
                                }
                            } else {
                                console.log("We received the result");
                            }
                        }).
                        error(function(data, status, headers, config) {
                            console.log(data);
                        });
                }).
                error(function(data, status, headers, config) {
                    console.log(data);
                });
        }
    };
    
    $scope.changeRoute = function(url, forceReload) {
        $scope = $scope || angular.element(document).scope();
        if(forceReload || $scope.$$phase) { // that's right TWO dollar signs: $$phase
            window.location = url;
        } else {
            $location.path(url);
            $scope.$apply();
        }
    };
}]);