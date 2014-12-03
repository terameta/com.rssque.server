/* http://scotch.io/tutorials/javascript/creating-a-single-page-todo-app-with-node-and-angular */

var reader = angular.module('reader', ['ngRoute', 'readerControllers']);
reader.filter('urlencode', function() {
    //return window.encodeURIComponent;
    return urlencode;
});

reader.filter('urldecode', function() {
    //return window.decodeURIComponent;
    return urldecode;
});

reader.filter('to_trusted', ['$sce', function($sce){
        return function(text) {
            return $sce.trustAsHtml(text);
        };
    }]);
    
reader.config(['$routeProvider',
	function($routeProvider) {
		$routeProvider
		.when('/', {
			templateUrl: '/partials/reader.html'
			//,controller: 'mainController'
		})
		.when('/addfeed', {
			templateUrl: '/partials/addfeed.html'
			//,controller: 'addfeedController'
		})
		.otherwise({
			redirectTo: '/'
		});
}]);

var readerControllers = angular.module('readerControllers', []);

readerControllers.controller('mainController', ['$scope', '$http', function ($scope, $http){
	$scope.formData = {};
	$scope.isAddingFeed = false;
	$scope.itemDisplayModeShowAll = false;
	
	$http.get('/api/feeds')
		.success(function(data){
			$scope.feeds = data;
			angular.forEach($scope.feeds, function(feedToGetTitle) {
				//console.log(feedToGetTitle.title);
				if(!feedToGetTitle.title){
					$http.get('/api/feed/getTitle/'+feedToGetTitle.feed)
						.success(function(data){
							feedToGetTitle.title = urldecode(data);
						})
						.error(function(data){
							console.log('Error: ' + data);
						});
				}
			});
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
    	//console.log("Change fired");
        //console.log($scope.curFeed);
        
        
    };
    
    $scope.$watch( 'curFeed', function(newCurFeed, oldCurFeed){
        //console.log('curFeed Changed');
        
        if(newCurFeed){
            var params = { feedID: $scope.curFeed.feed };
            var config = { params: params};
            
            $http.put('/api/user/setCurFeed', params)
                .success(function(data){
                    //console.log('Current Feed is set.');
                })
                .error(function(data){
                    console.log('Error: ' + data);
                });
                
            $http.get('/api/feed/getItems/'+$scope.curFeed.feed)
                .success(function(data){
                    $scope.curFeedItems = data;
                    
					$http.get('/api/user/getReadItems/'+$scope.curFeed.feed)
					    .success(function(data){
					        if(data){
					            if(data.userfeeds){
					                if(data.userfeeds[0]){
					                    if(data.userfeeds[0].readitems){
					                        data.userfeeds[0].readitems.forEach(function(curReadItem){
					                            $scope.curFeedItems.forEach(function(curFeedItem){
					                            	if(curFeedItem.linkhash === curReadItem){
					                            		curFeedItem.wasread = true;
					                            	}
					                            });
					                        });
					                    }
					                }
					            }
					        }
					    })
					    .error(function(data){
					        console.log('Error: ' + data);
					    });
                })
                .error(function(data){
                    console.log('Error: ' + data);
                });
        }
    });
	
	$scope.toggleFeedItem = function(toggledItem){
		id = toggledItem.linkhash;
		link = toggledItem.link;
		
		//console.log(toggledItem);
		if(!toggledItem.content || toggledItem.content == 'Item content is not available.'){
			$http.get('/api/item/'+$scope.curFeed.feed+'/'+id)
				.success(function(data){
					toggledItem.content = data;
					$('#main').scrollTop(0).scrollTop($('#feed-item-header-'+id).offset().top-48);
					console.log("setting tags");
					$("#feed-item-content-"+id).find('a').attr('target', "_blank");
					$(toggledItem.content).find('a').attr('target', "_blank");
					console.log($("#feed-item-content-"+id).text());
					console.log(id);
					console.log("done setting tags");
	            })
	            .error(function(data){
	            	toggledItem.content = 'Item content is not available.';
	            	$('#main').scrollTop(0).scrollTop($('#feed-item-header-'+id).offset().top-48);
	            });
		}
		
		if( $("#feed-item-content-"+id).hasClass("feed-item-content-hidden") ){
	        $(".feed-item-content-visible").removeClass('feed-item-content-visible').addClass('feed-item-content-hidden');
	        $("#feed-item-content-"+id).removeClass('feed-item-content-hidden').addClass('feed-item-content-visible');
	        $(".feed-item-footer-visible").removeClass('feed-item-footer-visible').addClass('feed-item-footer-hidden');
	        $("#feed-item-footer-"+id).removeClass('feed-item-footer-hidden').addClass('feed-item-footer-visible');
	        $("#feed-item-content-"+id).find('a').attr('target', "_blank");
	        $('#main').scrollTop(0).scrollTop($('#feed-item-header-'+id).offset().top-48);
	        /*$(".itemHeaderOpen").removeClass('itemHeaderOpen').addClass("itemHeaderRead");
	        $('#item'+id).removeClass('itemHidden').addClass('itemVisible');
	        $('#itemHeader'+id).addClass('itemHeaderOpen');
	        itemMakeRead(id, xFeedID);
	        $('#itemContent'+curItem).html("");
	        curItem = id;
	        curItemOrder = order;
	        $('#itemContent'+id).html(urldecode(curItemContents[order]));
	        
	        
	        $("div.feedContents").scrollTop($("#itemHeader"+id).position().top-70);
	        $("div.feedContents").scrollTop(($("#itemHeader"+id).outerHeight()-1)*(order-1));
	        //console.log($("#itemHeader"+id).offset().top);*/
	        toggledItem.isread = 'read';
	        $scope.itemchangestate(toggledItem);
	    } else {
	        $('#feed-item-content-'+id).removeClass('feed-item-content-visible').addClass('feed-item-content-hidden');
	        $(".feed-item-footer-visible").removeClass('feed-item-footer-visible').addClass('feed-item-footer-hidden');
	        /*$(".itemHeaderOpen").removeClass('itemHeaderOpen').addClass("itemHeaderRead");*/
	    }
	};
	
	$scope.itemchangestate  = function(itemtochange) {
		//console.log(itemtochange.isread);
		//console.log(itemtochange);
		var params = {feed: $scope.curFeed.feed, item: itemtochange.linkhash, state:itemtochange.isread};
		//console.log(params);
		$http.put('/api/user/itemchangestate', params)
			.success(function(data){
				//console.log(data);
            })
            .error(function(data){
                //console.log('Error: ' + data);
            });
	};
}]);

function urldecode(str) {
	return decodeURIComponent((str + '').replace(/%(?![\da-f]{2})/gi, function() {
		return '%25';
	}).replace(/\+/g, '%20'));
}

function urlencode(str) {
	str = (str + '').toString();
	return encodeURIComponent(str)
		.replace(/!/g, '%21')
		.replace(/'/g, '%27')
		.replace(/\(/g, '%28')
		.replace(/\)/g, '%29')
		.replace(/\*/g, '%2A')
		.replace(/%20/g, '+');
}