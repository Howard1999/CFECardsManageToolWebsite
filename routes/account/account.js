var express = require('express');
var account = express.Router();
var ServerLog = require('../../model/ServerLog');

// temp
account.get('/sign-in', (req, res, next)=>{
    res.redirect('/account/google-oauth2/sign-in');
});
account.get('/sign-up', (req, res, next)=>{
    res.redirect('/account/google-oauth2/sign-up');
});
account.get('/sign-out', (req, res, next)=> {
    ServerLog.create({'recordBy': 'account',
                      'type': 'sign out',
                      'requestIP': req.connection.remoteAddress,
                      'content': req.session.email});
    req.session.signedIn = false;
    req.session.email = undefined;
    req.session.userName = undefined;
    res.redirect('/');
});

// bind google oauth module
var googleOAuth2 = require('./google-oauth2/google-oauth2');
account.use('/google-oauth2', googleOAuth2);

module.exports = account;