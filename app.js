var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var mongoose = require('mongoose');
var logger = require('morgan');

var authMiddleware = require('./routes/account/google-oauth2/middleware');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/user/user');
var accountRouter = require('./routes/account/account');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

/* load secret for cookie and session here*/
var secrets = {cookieSecret: 'temp', sessionSecret: 'temp'};

// cookie setup
app.use(cookieParser(secrets.cookieSecret));

// session setup
app.use(session({
    name: 'skey',
    secret: secrets.sessionSecret,
    saveUninitialized: false,
    store: new MongoStore({url:"mongodb://localhost:27017/session"}),
    resave: true,
    rolling:true,
    cookie: {
        maxAge: 10 * 60 * 1000 // 10分鐘
    }
}));
// mongoose setup
var mongoDB = 'mongodb://localhost:27017/CFECardsManageToolDatabase';
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.connect(mongoDB,{useUnifiedTopology: true});
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// sign in status
app.use(authMiddleware.signInStatus);

// route setup
app.use('/', indexRouter);
app.use('/user', usersRouter);
app.use('/account', accountRouter);
app.use('/test', (req, res, next)=>{res.render('test',{});});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
