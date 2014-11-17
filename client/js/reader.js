/* http://scotch.io/tutorials/javascript/creating-a-single-page-todo-app-with-node-and-angular */

var reader = angular.module('reader', []);

function mainController($scope, $http){
    $scope.formData = {};
    
    $http.get('/api/feeds')
        .success(function(data){
            $scope.feeds = data;
            //Once we have the list of user's feeds, we can set the last feed the user was reading
            $http.get('/api/user/getCurFeed')
                .success(function(data){
                    $scope.feeds.forEach(function(innerFeed){
                        if(innerFeed.feed == data){
                            $scope.curFeed = innerFeed;
                        }
                    });
                })
                .error(function(data){
                    console.log('Error: ' + data);
                });
        })
        .error(function(data) {
            console.log('Error: ' + data);
        });
    
    $scope.change = function(){
        //console.log($scope.curFeed);
        
        var params = { feedID: $scope.curFeed.feed };
        var config = { params: params};
        
        $http.put('/api/user/setCurFeed', params)
            .success(function(data){
                console.log('Current Feed is set.');
            })
            .error(function(data){
                console.log('Error: ' + data);
            });
        
        console.log($scope.curFeed.feed);
        console.log(params);
        
        $http.get('/api/feed/getItems', params)
            .success(function(data){
                console.log(data);
                console.log('we got the list of items.');
            })
            .error(function(data){
                console.log('Error: ' + data);
            });
    };
}