var express = require('express');
var account = express.Router();

// bind google oauth module
var googleOAuth2 = require('./google-oauth2/google-oauth2');
account.use('/google-oauth2', googleOAuth2);

module.exports = account;