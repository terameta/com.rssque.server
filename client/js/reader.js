/* http://scotch.io/tutorials/javascript/creating-a-single-page-todo-app-with-node-and-angular */

var reader = angular.module('reader', ['ngRoute', 'readerControllers','infinite-scroll']);
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

reader.directive('resize', function($window){
    return function (scope, element) {
        var w = angular.element($window);
        scope.getWindowDimensions = function () {
            return {
                'h': w.height(),
                'w': w.width()
            };
        };
        scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
            scope.windowHeight = newValue.h;
            scope.windowWidth = newValue.w;
            
            scope.fixContentsNoCheck();

            scope.style = function () {
                return {
                    'height': (newValue.h - 100) + 'px',
                        'width': (newValue.w - 100) + 'px'
                };
            };

        }, true);

        w.bind('resize', function () {
            scope.$apply();
        });
    };
});

var readerControllers = angular.module('readerControllers', []);

readerControllers.controller('mainController', ['$scope', '$http', function ($scope, $http){
	$scope.formData = {};
	$scope.curFeedItems = [];
	$scope.curFeedReadItems = [];
	$scope.isAddingFeed = false;
	$scope.itemDisplayModeShowAll = false;
	$scope.curVisibleItemCount = 0;
	$scope.noMoreItems = false;
	$scope.curActiveItem = '';
	
	$scope.isbringnextPageBusy = false;
	
	$scope.bringnextPage = function(){
	    $scope.isbringnextPageBusy = true;
	    if($scope.curFeedItems.length > 0 && !$scope.noMoreItems){
    	    $http.get('/api/feed/getItems/'+$scope.curFeed.feed+'/'+$scope.curFeedItems.length).
                success(function(data){
                    $scope.curFeedItems.push.apply($scope.curFeedItems, data);
                    $scope.isbringnextPageBusy = false;
                    $scope.curVisibleItemCount = $scope.curFeedItems.length;
                    
                    $scope.curFeedReadItems.forEach(function(curReadItem){
                        $scope.curFeedItems.forEach(function(curFeedItem){
                        	if(curFeedItem.linkhash === curReadItem){
                        		curFeedItem.wasread = true;
                        	}
                        });
                    });
                    
                    $scope.curFeedItems.forEach(function(curVItem){
                        if(curVItem.wasread){
                            --$scope.curVisibleItemCount;
                        }
                    });
                    if(data.length == 0){
                        $scope.noMoreItems = true;
                    }
                    if($scope.curVisibleItemCount < 100 && !$scope.noMoreItems){
                        $scope.bringnextPage();
                    }
                }).
                error(function(data){
                    $scope.isbringnextPageBusy = false;
                    $scope.noMoreItems = true;
                });
	    } else {
	        $scope.isbringnextPageBusy = false;
	    }
	};
	
	$http.get('/api/feeds').
	    success(function(data){
			$scope.feeds = data;
			angular.forEach($scope.feeds, function(feedToGetTitle) {
				//console.log(feedToGetTitle.title);
				if(!feedToGetTitle.title){
					$http.get('/api/feed/getTitle/'+feedToGetTitle.feed).
					    success(function(data){
							feedToGetTitle.title = urldecode(data);
						}).
						error(function(data){
							console.log('Error: ' + data);
						});
				}
			});
            //Once we have the list of user's feeds, we can set the last feed the user was reading
            $http.get('/api/user/getCurFeed').
                success(function(data){
                    $scope.feeds.forEach(function(innerFeed){
                        if(innerFeed.feed == data){
                            $scope.curFeed = innerFeed;
                        }
                    });
                }).
                error(function(data){
                    console.log('Error: ' + data);
                });
        }).
        error(function(data) {
            console.log('Error: ' + data);
        });
    
    $scope.$watch( 'itemDisplayModeShowAll', function(newCurFeed, oldCurFeed){
        $('#main').scrollTop(0);
    });
    
    $scope.$watch( 'curFeed', function(newCurFeed, oldCurFeed){
        //console.log('curFeed Changed');
        if(newCurFeed){
            $scope.noMoreItems = false;
            $('#main').scrollTop(0);
            $scope.curFeedItems = [];
            //console.log("Feed has changed");
            var params = { feedID: $scope.curFeed.feed };
            var config = { params: params};
            
            $http.put('/api/user/setCurFeed', params).
                success(function(data){
                    //console.log('Current Feed is set.');
                }).
                error(function(data){
                    console.log('Error: ' + data);
                });
            
            $scope.isbringnextPageBusy = true;
            $http.get('/api/feed/getItems/'+$scope.curFeed.feed+'/0').
                success(function(data){
                    //console.log(data);
                    $scope.curFeedItems = data;
                    //if no items are received, it means no more items
                    $scope.noMoreItems = (data.length === 0);

					$http.get('/api/user/getReadItems/'+$scope.curFeed.feed).
					    success(function(data){
					        if(data){
					            if(data.userfeeds){
					                if(data.userfeeds[0]){
					                    if(data.userfeeds[0].readitems){
					                        //console.log(data.userfeeds[0].readitems);
					                        $scope.curFeedReadItems = data.userfeeds[0].readitems;
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
					        $scope.isbringnextPageBusy = false;
	                        $scope.bringnextPage();
					    }).
					    error(function(data){
					        $scope.isbringnextPageBusy = false;
					    });
                }).
                error(function(data){
                    $scope.isbringnextPageBusy = false;
                });
        }
    });
    
    $scope.fixContentsNoCheck = function(){
        if($scope.curActiveItem){
            var widthToSet = $("#feed-item-content-inner-"+fixableItem).parent().width();
            var fixableItem = $scope.curActiveItem;
            $("#feed-item-content-inner-"+fixableItem).css('maxWidth', widthToSet);
            $("#feed-item-content-inner-"+fixableItem).find('*').each(function(theIndex){$(this).removeClass().addClass('force-wrap');});
            $("#feed-item-content-inner-"+fixableItem).find('*').each(function(theIndex){$(this).css('maxWidth', $(this).parent().width());});
            $("#feed-item-content-inner-"+fixableItem).find('*').each(function(theIndex){$(this).attr('onclick','').unbind('click');});
            $("#feed-item-content-inner-"+fixableItem).find('*').each(function(theIndex){if($(this)[0].tagName == 'SCRIPT')$(this).remove();});
            $("#feed-item-content-inner-"+fixableItem).find('*').each(function(theIndex){if($(this)[0].tagName == 'RSSQUEBLOCKEDCONTENT')$(this).remove();});
        }
        return true;
    };
    
    $scope.fixContents = function(fixableItem, dataToFix, widthToSet){
        //console.log(fixableItem);
        //console.log(dataToFix);
        //console.log($("#feed-item-content-inner-"+fixableItem).html());
        if( dataToFix != $("#feed-item-content-inner-"+fixableItem).html() ){
            setTimeout(function() { $scope.fixContents(fixableItem, dataToFix, widthToSet);}, 500);
            return true;
        }
        $("#feed-item-content-inner-"+fixableItem).find('a').attr('target', "_blank");
        $("#feed-item-content-inner-"+fixableItem).css('maxWidth', widthToSet);
        $("#feed-item-content-inner-"+fixableItem).find('*').each(function(theIndex){$(this).removeClass().addClass('force-wrap');});
        $("#feed-item-content-inner-"+fixableItem).find('*').each(function(theIndex){$(this).css('maxWidth', $(this).parent().width());});
        $("#feed-item-content-inner-"+fixableItem).find('*').each(function(theIndex){$(this).attr('onclick','').unbind('click');});
        $("#feed-item-content-inner-"+fixableItem).find('*').each(function(theIndex){if($(this)[0].tagName == 'SCRIPT')$(this).remove();});
        $("#feed-item-content-inner-"+fixableItem).find('*').each(function(theIndex){if($(this)[0].tagName == 'RSSQUEBLOCKEDCONTENT')$(this).remove();});
        $('#main').scrollTop(0).scrollTop($('#feed-item-header-'+fixableItem).offset().top-48);
        
        return true;
    };
	
	$scope.toggleFeedItem = function(toggledItem){
		id = toggledItem.linkhash;
		link = toggledItem.link;
		$scope.curActiveItem = id;
		//console.log(toggledItem);
		if(!toggledItem.content || toggledItem.content == 'Item content is not available.'){
			$http.get('/api/item/'+$scope.curFeed.feed+'/'+id).
			    success(function(data){
			        var widthToSet = $("#feed-item-content-inner-"+id).parent().width();
					data = data.replace(/<script/g, '<rssqueblockedcontent');
					data = data.replace(/<\/script/g, '</rssqueblockedcontent');
					$scope.fixContents(id, data, widthToSet);
					//console.log(data);
					toggledItem.content = data;
					
					$('#main').scrollTop(0).scrollTop($('#feed-item-header-'+id).offset().top-48);
					//console.log("setting tags");
					//$("#feed-item-content-"+id).find('a').attr('target', "_blank");
					//$(toggledItem.content).find('a').attr('target', "_blank");
					
					
		        }).
		        error(function(data){
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
		$http.put('/api/user/itemchangestate', params).
		    success(function(data){
			    //console.log(data);
            }).
            error(function(data){
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