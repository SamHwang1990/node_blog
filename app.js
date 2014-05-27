var fs = require('fs');
var accessLog = fs.createWriteStream('access.log',{flags:'a'});
var errorLog = fs.createWriteStream('error.log',{flags:'a'});
var express = require('express');
var path = require('path');
var connect = require('connect');
var MongoStore = require('connect-mongo')(connect);
var settings = require('./settings');
var flash = require('connect-flash');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');

var routes = require('./routes/index');

var app = express();
var passport = require('passport'),
    GithubStrategy = require('passport-github').Strategy;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(flash());

app.use(favicon());
app.use(logger('dev'));
app.use(logger({stream:accessLog}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(session({
    secret:settings.cookieSecret,
    key:settings.db,
    cookie:{maxAge:1000 * 60 * 24 * 30},//30 days
    store:new MongoStore({
        db:settings.db
    })
}))
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(err, req, res, next){
    var meta = '[' + new Date() + ']' + req.url + '\n';
    errorLog.write(meta + err.stack + '\n');
    next();
})

app.use(passport.initialize()); //初始化 Passport

/* Set router */
routes(app);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

passport.use(new GithubStrategy({
    clientID:"40ebd8a743c312f81e41",
    clientSecret:"9ecd251f7a84a7ae4591640df0d329eeffcb4230",
    callbackURL:"http://localhost:3000/login/github/callback"
},function(accessToken, refreshToken, profile, done){
    done(null, profile);
}))

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
