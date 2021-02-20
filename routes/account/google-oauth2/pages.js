var express = require('express');
var fs = require('fs');

const secrets = JSON.parse(fs.readFileSync('./secrets.json'));
const CLIENT_ID = secrets.client_id;

var authPages = express.Router();

authPages.get('/sign-in', (req, res, next)=>{
    if (req.account.signedIn) {res.redirect('/');}
    else{res.render('account/google-oauth2/sign_in', {'CLIENT_ID': CLIENT_ID});}
});

authPages.get('/sign-up', (req, res, next)=>{
    if (req.account.signedIn) {res.redirect('/');}
    else {res.render('account/google-oauth2/sign_up', {'CLIENT_ID': CLIENT_ID});}
});

authPages.get('/sign-out', (req, res, next)=>{
    if (!req.account.signedIn) {res.redirect('/');}
    else{res.render('account/google-oauth2/sign_out', {});}
});

module.exports = authPages;
