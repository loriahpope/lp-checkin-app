// server.js

// BASE SETUP
// =================================

// call the packages we need
var express 	= require('express');	 // call express
var app 		= express();		 // define our app using express
var mongoose 	= require('mongoose');
var mongoURI    = 'mongodb://localhost/checkInApp';
var morgan = require('morgan');
var bodyParser	= require('body-parser');
var methodOverride = require('method-override');
var sentiment = require('sentiment');
var passport = require('passport');
var router = express.Router();

var CheckIn 	= require('./app/models/checkIn');
var User 	= require('./app/models/user');
var Authenticate = require('./app/config/passport');
var Profile = require('./app/controllers/profile');

var options = {
    server: {
        socketOptions: {
            keepAlive: 1,
            connectTimeoutMS: 30000
        },
        auto_reconnect: true
    },
    user: this.connectionParams.username,
    pass: this.connectionParams.password
};
// var connectionString = 'mongodb://localhost/checkInApp';
// var connectionString = 'mongodb://lpope101:testdb123@ds157469.mlab.com:57469/heroku_8bhhl165';

// mongoose.connect(connectionString, options);		 // connect to our database

mongoose.connect(process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || mongoURI);

app.use(express.static(__dirname + '/app/public'));
app.use(morgan('dev'));

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.json({type: 'application/vnd.api+json'}));
app.use(methodOverride());

app.use(passport.initialize());

var jwt = require('express-jwt');
var auth = jwt({
    secret: 'MY_SECRET',
    userProperty: 'payload'
});

var port = process.env.PORT || 8080;	 // set our port

// ROUTES FOR OUR API
// =================================

router.get('/profile', auth, Profile.profileRead);
app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        res.status(401);
        res.json({"message" : err.name + ": " + err.message});
    }
});

app.get('/api/checkIns', function(req, res) {
    CheckIn.find(function(err, checkIns) {
        if (err)
            res.send(err);
        res.json(checkIns);
    })
});

app.post('/api/checkIns', function (req, res) {
    var checkIn = new CheckIn();
    checkIn.title = req.body.title;
    var phrase = checkIn.title;
    sentiment(phrase, function (err, result) {
        if (result.score > 5) {
            result.score = 5;
        }
        checkIn.sentimentScore = result.score;
    });

     function getSentimentRating () {
        if (checkIn.sentimentScore > 2) {
            return 'Positive';
        } else if (checkIn.sentimentScore < -1) {
            return 'Negative';
        } else if (checkIn.sentimentScore <= 2 || checkIn.sentimentScore >= -1) {
            return 'Neutral'
        } else {
            return 'Unable to rate.'
        }
    }

    checkIn.sentimentRating = getSentimentRating();

    //save the checkin and check for errors
    checkIn.save(function(err) {
        if (err)
            res.send(err);

        res.json({ message: 'Checkin created!' })
    });
});

app.get('/api/checkIns/:checkin_id', function(req, res) {
    CheckIn.findById(req.params.checkin_id, function (err, checkIn) {
        if (err)
            res.send(err);
        res.json(checkIn);
    })
});

app.put('/api/checkIns/:checkin_id', function(req, res) {
    CheckIn.findById(req.params.checkin_id, function (err, checkIn) {
        if (err)
            res.send(err);

        checkIn.title = req.body.title;

        //save the checkin and check for errors
        checkIn.save(function(err) {
            if (err)
                res.send(err);

            res.json({ message: 'Checkin updated!' })
        });
    });
});

app.delete('/api/checkIns/:checkin_id', function(req, res) {
    CheckIn.remove({
        _id: req.params.checkin_id
    }, function(err, checkIn) {
        if (err)
            res.send(err);

        res.json({ message: 'Successfully deleted'});
    })
});

// application ----------------
app.all('*', function(req, res) {
	res.sendFile('./app/public/index.html');
});

// START THE SERVER
// ===================================
app.listen(port);
console.log('Magic happens on port ' + port);
