rssque.controller('rssqueCtrl', function($rootScope, $scope, feedFactory) {
 
  $scope.feeds = [];
  $scope.isEditable = [];
 
  // get all feeds on Load
  feedFactory.getFeeds().then(function(data) {
    $scope.feeds = data.data;
  });
 
  // Save a Feed to the server
  $scope.save = function($event) {
	console.log("Here");
    if ($event.which == 13 && $scope.feedInput) {
 
      feedFactory.saveFeed({
        "feed": $scope.feedInput,
        "isCompleted": false
      }).then(function(data) {
        $scope.feeds.push(data.data);
      });
      $scope.feedInput = '';
    }
  };
 
  //update the status of the Feed
  $scope.updateStatus = function($event, _id, i) {
    var cbk = $event.target.checked;
    var _t = $scope.feeds[i];
    feedFactory.updateFeed({
      _id: _id,
      isCompleted: cbk,
      feed: _t.feed
    }).then(function(data) {
      if (data.data.updatedExisting) {
        _t.isCompleted = cbk;
      } else {
        alert('Oops something went wrong!');
      }
    });
  };
 
  // Update the edited Feed
  $scope.edit = function($event, i) {
    if ($event.which == 13 && $event.target.value.trim()) {
      var _t = $scope.feeds[i];
      feedFactory.updateFeed({
        _id: _t._id,
        feed: $event.target.value.trim(),
        isCompleted: _t.isCompleted
      }).then(function(data) {
        if (data.data.updatedExisting) {
          _t.feed = $event.target.value.trim();
          $scope.isEditable[i] = false;
        } else {
          alert('Oops something went wrong!');
        }
      });
    }
  };
 
  // Delete a Feed
  $scope.delete = function(i) {
    feedFactory.deleteFeed($scope.feeds[i]._id).then(function(data) {
      if (data.data) {
        $scope.feeds.splice(i, 1);
      }
    });
  };
 
});