rssque = angular.module('rssque', ['ngRoute'])
  .config(function($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: '/partials/feeds.html',
        controller: 'rssqueCtrl'
      }).otherwise({
        redirectTo: '/'
      });
  });