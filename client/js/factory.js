rssque.factory('feedFactory', function($http) {
	var urlBase = '/api/feeds';
	var _feedService = {};

	_feedService.getFeeds = function() {
		return $http.get(urlBase);
	};

	_feedService.saveFeed = function(feed) {
		return $http.post(urlBase, feed);
	};

	_feedService.updateFeed = function(feed) {
		return $http.put(urlBase, feed);
	};

	_feedService.deleteFeed = function(id) {
		return $http.delete(urlBase + '/' + id);
	};

	return _feedService;
});