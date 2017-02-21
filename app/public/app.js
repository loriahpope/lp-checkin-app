angular.module('checkInApp', ['ngRoute'])
    .config(function($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'partials/main.html',
                controller: 'mainCtrl'
            })
            .when('/login', {
                templateUrl: 'partials/login.html',
                controller: 'loginCtrl'
            })
            .when('/checkIns', {
                templateUrl: "partials/checkIns.html",
                controller: 'checkInsCtrl'
            })
            .when('/checkIns/:checkin_id', {
                templateUrl: 'partials/checkInDetails.html',
                controller: 'checkInDetailsCtrl'
            })
    })
    .controller('mainCtrl', function($scope, $http, $window, $location) {
        $scope.headline = 'How was your day?';
        $scope.tagline = 'Track your mood in 160 characters per day!';
        $scope.maxlength = 160;

        $scope.formData = {};

        $scope.createCheckIn = function() {

            console.log('data:' + $scope.formData);

            $http.post('http://lp-checkin-app.herokuapp.com/api/checkIns', $scope.formData)
                .success(function(data) {
                    $scope.formData = {};
                    $scope.checkIns = data;
                    console.log(data);
                    $window.location.href = '/#/checkIns'
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                })
        };

        $scope.isActive = function (viewLocation) {
            return viewLocation === $location.path();
        };

    })
    .controller('checkInsCtrl', function($scope, $http) {

        $http.get('http://lp-checkin-app.herokuapp.com/api/checkIns')
            .success(function(data) {
                $scope.checkIns = data;
                console.log(data);
                $scope.checkInSentiments = [];
                $scope.checkInDates = [];
                $scope.checkInSentimentRatings = [];
                $scope.positiveCheckins = 0;
                $scope.neutralCheckins = 0;
                $scope.negativeCheckins = 0;

                angular.forEach($scope.checkIns, function (item) {
                    $scope.checkInSentiments.push(item.sentimentScore);

                    var date = new Date(item.created_at);
                    $scope.checkInDates.push(date.toLocaleDateString());

                    if(item.sentimentRating =='Positive') {
                        $scope.positiveCheckins++;
                    }

                    if(item.sentimentRating =='Neutral') {
                        $scope.neutralCheckins++;
                    }

                    if(item.sentimentRating =='Negative') {
                        $scope.negativeCheckins++;
                    }
                });

                $scope.checkInSentimentRatings.push(
                    {
                        name: 'Positive',
                        y: $scope.positiveCheckins
                    }, {
                        name: 'Neutral',
                        y: $scope.neutralCheckins
                    }, {
                        name: 'Negative',
                        y: $scope.negativeCheckins
                    });

                console.log($scope.checkInSentiments);
                console.log($scope.checkInSentimentRatings);


                Highcharts.chart('sentimentChart', {
                    title: {
                        align: 'left',
                        margin: 50,
                        text: 'Check In Sentiment'
                    },

                    subtitle: {
                        align: 'left',
                        text: 'Check In Sentiment over Time'
                    },

                    legend: {
                        enabled: false
                    },

                    yAxis: {
                      max: 5,
                      min: -5,
                      title: {
                          text: 'Sentiment Values'
                      }
                    },

                    xAxis: {
                        type: 'datetime',
                        categories: $scope.checkInDates,
                        dateTimeLabelFormats: {
                            day: '%e of %b'
                        }
                    },

                    series: [{
                        data: $scope.checkInSentiments,
                        name: 'Sentiment Score',
                        color: '#8087e8',
                        lineWidth: 3
                    }]
                });

                new Highcharts.Chart('sentimentChartRatings',{
                    chart: {
                        renderTo: 'container',
                        type: 'pie'
                    },
                    title: {
                        text: 'Sentiment Ratings',
                        margin: 50,
                        align: 'left'
                    },
                    subtitle: {
                        align: 'left',
                        text: 'Distribution of Sentiment'
                    },
                    plotOptions: {
                        pie: {
                            shadow: false
                        }
                    },
                    tooltip: {
                        pointFormat: '<b>{point.percentage:.1f}%</b>'
                    },
                    series: [{
                        name: 'Sentiment Ratings',
                        data: [["Positive",$scope.positiveCheckins],["Neutral",$scope.neutralCheckins],["Negative",$scope.negativeCheckins]],
                        colors:['#66BB6A','#5C6BC0','#ef5350'],
                        size: '110%',
                        innerSize: '40%',
                        showInLegend:true,
                        dataLabels: {
                            enabled: false
                        }
                    }]
                });
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });

    })
    .controller('checkInDetailsCtrl', function($scope, $http, $routeParams, $window) {

        $http.get('http://lp-checkin-app.herokuapp.com/api/checkIns/' + $routeParams.checkin_id)
            .success(function(data) {
                $scope.checkIn = data;
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });

        $scope.deleteCheckIn = function() {
            $http.delete('http://lp-checkin-app.herokuapp.com/api/checkIns/' + $routeParams.checkin_id)
                .success(function(data) {
                    $scope.checkIns = data;
                    console.log(data);
                    $window.location.href = '/#/checkIns'
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                })
        };
    })
    .controller('loginCtrl', function ($scope, $http) {
        $scope.title = 'Check In';
        $scope.tagline = 'This is how you\'ve really been doing.';
    });