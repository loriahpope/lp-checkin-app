var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');

passport.use(new LocalStrategy({
    usernameField: 'email'
},
function (username, password, done) {
    User.findOne({email: username}, function(err, user) {
        if(err) {
            return done(err);
        }
        if(!user) {
            return done(null, false, {
                message: 'User not found'
            });
        }
        if (!user.validPassword(password)) {
            return done(null, false, {
                message: 'Password is wrong'
            });
        }
        return done(null, user);
    })
}));
var mongoose = require('mongoose');
var User = mongoose.model('User');

module.exports.profileRead = function(req, res) {

    // If no user ID exists in the JWT return a 401
    if (!req.payload._id) {
        res.status(401).json({
            "message" : "UnauthorizedError: private profile"
        });
    } else {
        // Otherwise continue
        User
            .findById(req.payload._id)
            .exec(function(err, user) {
                res.status(200).json(user);
            });
    }

};
var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var CheckInSchema   = new Schema({
    title: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date
    },
    sentimentScore: Number,
    sentimentRating: String
});

module.exports = mongoose.model('CheckIn', CheckInSchema);
var mongoose     = require('mongoose');
var crypto       = require('crypto');
var jwt          = require('jsonwebtoken');
var Schema       = mongoose.Schema;

var UserSchema   = new Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    hash: String,
    salt: String
});

UserSchema.methods.setPassword = function(password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
};

UserSchema.methods.validPassword = function(password) {
    var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
    return this.hash === hash;
};

UserSchema.methods.generateJwt = function() {
    var expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);

    return jwt.sign({
        _id: this._id,
        email: this.email,
        name: this.name,
        exp: parseInt(expiry.getTime()/1000)
    }, 'MY_SECRET');
};


module.exports = mongoose.model('User', UserSchema);

module.exports.register = function(req, res) {
    var user = new User();

    user.name = req.body.name;
    user.email = req.body.email;

    user.setPassword(req.body.password);

    user.save(function(err) {
        var token;
        token = user.generateJwt();
        res.status(200);
        res.json({
            "token": token
        });
    });
};

module.exports.login = function(req, res) {
    passport.authenticate('local', function(err, user, info) {
        var token;

        if(err) {
            res.status(404).json(err);
            return;
        }
        if(user) {
            token = user.generateJwt();
            res.status(200);
            res.json({
                "token": token
            });
        } else {
            res.status(401).json(info);
        }
    })(req, res)
};
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

            $http.post('/api/checkIns', $scope.formData)
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

        $http.get('/api/checkIns')
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

        $http.get('/api/checkIns/' + $routeParams.checkin_id)
            .success(function(data) {
                $scope.checkIn = data;
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });

        $scope.deleteCheckIn = function() {
            $http.delete('/api/checkIns/' + $routeParams.checkin_id)
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