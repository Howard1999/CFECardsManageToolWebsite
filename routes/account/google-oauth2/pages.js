var express = require('express');
var fs = require('fs');

const secrets = JSON.parse(fs.readFileSync('./secrets.json'));
const CLIENT_ID = secrets.client_id;

var authPages = express.Router();

authPages.get('/sign-in', (req, res, next)=>{
    res.render('account/google-oauth2/sign_in', {'signedIn': false, 'CLIENT_ID': CLIENT_ID});
});

authPages.get('/sign-up', (req, res, next)=>{
    var signedIn = req.account.signedIn;
    res.render('account/google-oauth2/sign_up', {'signedIn': signedIn, 'CLIENT_ID': CLIENT_ID});
});

authPages.get('/sign-out', (req, res, next)=>{
    res.render('account/google-oauth2/sign_out', {'signedIn': true});
});

module.exports = authPages;
