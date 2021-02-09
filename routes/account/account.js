var express = require('express');
var account = express.Router();

/*
account.get('/sign-in');
account.get('/sign-up');
*/

account.get('/sign-out', function(req, res, next) {
    req.session.signIn = false;
    req.session.email = undefined;
    req.session.userName = undefined;
    res.redirect('/');
});

// bind google oauth module
var googleOAuth2 = require('./google-oauth2/google-oauth2');
account.use('/google-oauth2', googleOAuth2);

module.exports = account;