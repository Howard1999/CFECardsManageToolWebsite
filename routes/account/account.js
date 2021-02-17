var express = require('express');
var account = express.Router();

// bind google oauth module
var pages = require('./google-oauth2/pages');
var apis = require('./google-oauth2/apis');

account.use('/google-oauth2', pages);
account.use('/google-oauth2', apis);

module.exports = account;