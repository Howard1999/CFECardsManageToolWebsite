var express = require('express');
var fs = require('fs');
var {google} = require('googleapis');
var User = require('../../../model/User');
var ServerLog = require('../../../model/ServerLog');

var authAPI = express.Router();
const OAuthConfig = JSON.parse(fs.readFileSync('./routes/account/google-oauth2/secret/oauth2_client.json'));

/* functions */
function createConnection(loc){
  return new google.auth.OAuth2(
      OAuthConfig.client_id,
      OAuthConfig.client_secret,
      OAuthConfig.redirect+loc
  );
}
function getConnectionUrl(oauth2Client){
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/userinfo.email',
              'https://www.googleapis.com/auth/userinfo.profile']
    });
}
async function getGoogleAccount(code, loc) {
  const oauth2Client = createConnection(loc);
  const {tokens} = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  var oauth2 = await google.oauth2({
    auth: oauth2Client,
    version: 'v2'
  });
  var res = await oauth2.userinfo.v2.me.get();
  return res['data'];
}
/* middleware */
async function multiSignInPrevent(req, res, next) {
    if(req.session.signedIn===true){
        res.redirect('/account/google-oauth2/sign-out-page');
    }
    else next();
}
/* pages */
authAPI.get('/sign-in-page', multiSignInPrevent, (req, res, next)=>{
  var signedIn = req.session.signedIn==true;
  var url = getConnectionUrl(createConnection('sign-in'));
  var err = req.query.err;
  res.render('account/google-oauth2/sign_in_page', {'title': '登入', 'signedIn': signedIn, 'auth_url': url, 'err': err});
});
authAPI.get('/sign-up-page', multiSignInPrevent, (req, res, next)=>{
  var signedIn = req.session.signedIn==true;
  var url = getConnectionUrl(createConnection('sign-up-page/confirm'));
  var err = req.query.err;
  res.render('account/google-oauth2/sign_up_page', {'title': '註冊', 'signedIn': signedIn, 'auth_url': url, 'err': err});
});
authAPI.get('/sign-up-page/confirm', multiSignInPrevent, (req, res, next)=>{
  var signedIn = req.session.signedIn==true;
  var code = req.query.code;
  const remoteIp = req.connection.remoteAddress;
  if(code===undefined){
    res.redirect('/account/google-oauth2/sign-up-page');
  }
  else{
    getGoogleAccount(code, 'sign-up-page/confirm')
      .then((data)=>{
        var gmail = data['email'];
        var userName = data['name'];
        var avatarUrl = data['picture'];
        req.session.signUpConfig = {'name': userName,'email': gmail};
        res.render("account/google-oauth2/sign_up_confirm_page", {'title': '註冊', 'signedIn': signedIn, 'name': userName, 'email': gmail, 'avatar_url': avatarUrl});
      })
      .catch((err)=>{
        ServerLog.create({'recordBy': 'google-oauth2-sign-up',
                          'type': 'Google OAuth2 error',
                          'requestIP': remoteIp,
                          'content': 'Google oauth2 error:'+err.toString()});
        res.redirect("/account/google-oauth2/sign-up-page?err=GOOGLE_OAUTH2_ERROR");
      });
  }
});
authAPI.get('/sign-out-page', (req, res, next)=>{
  var signedIn = req.session.signedIn==true;
  res.render('account/google-oauth2/sign_out_page', {'title': '登出',  'signedIn': signedIn});
});
/* apis */
authAPI.get('/sign-in', multiSignInPrevent, (req, res, next)=>{
  const code = req.query.code;
  const remoteIp = req.connection.remoteAddress;
  if(code===undefined){
    res.redirect('/sign-in-page');
  }
  else{
    getGoogleAccount(code, 'sign-in')
      .then((data)=>{
        var gmail = data['email'];
        var userName = data['name'];
        // check user exsist
        User.findOne({'email':gmail}, (err, user)=>{
          if(err){
            // redirect to sign in page
            ServerLog.create({'recordBy': 'google-oauth2-sign-in',
                              'type': 'DB error',
                              'requestIP': remoteIp,
                              'content': 'Database findOne('+gmail+') error:'+err.toString()});
            res.redirect("/account/google-oauth2/sign-in-page?err=DB_ERROR");
          }
          else{
            if(user){
              // success sign-in
              req.session.signedIn = true;
              req.session.email = gmail;
              req.session.userName = userName;
              ServerLog.create({'recordBy': 'google-oauth2-sign-in',
                                'type': 'sign in-success',
                                'requestIP': remoteIp,
                                'content': gmail});
              res.redirect('/user/profile');
            }
            else{ // if user doesn't exsist
              ServerLog.create({'recordBy': 'google-oauth2-sign-in',
                                'type': 'sign in-user not exsist',
                                'requestIP': remoteIp,
                                'content': gmail});
              res.redirect("/account/google-oauth2/sign-in-page?err=USER_DOES_NOT_EXSIST"); // user not exsist
            }
          }
        });
      })
      .catch((err)=>{
        // redirect to sign in page
        ServerLog.create({'recordBy': 'google-oauth2-sign-in',
                          'type': 'Google OAuth2 error',
                          'requestIP': remoteIp,
                          'content': 'Google oauth2 error:'+err.toString()});
        res.redirect("/account/google-oauth2/sign-in-page?err=GOOGLE_OAUTH2_ERROR");
      });
  }
});
authAPI.get('/sign-up', multiSignInPrevent, (req, res, next)=>{
  var confirm = req.query.confirm;
  var remoteIp = req.connection.remoteAddress;
  var signUpConfig = req.session.signUpConfig;

  if(confirm=='true'){
    // check signUpConfig exsist
    if(signUpConfig===undefined){
      res.redirect('/account/google-oauth2/sign-up-page');
    }
    else{
      var userName = signUpConfig['name'];
      var gmail = signUpConfig['email'];

      req.session.signUpConfig = undefined;
      // check user doesn't exsist
      User.findOne({'email':gmail}, (err, user)=>{
          if(err){
            ServerLog.create({'recordBy': 'google-oauth2-sign-up',
                              'type': 'DB error',
                              'requestIP': remoteIp,
                              'content': 'Database findOne('+gmail+') error:'+err.toString()});
            res.redirect('/account/google-oauth2/sign-up-page?err=DB_ERROR');
          }
          else{
            if(user){
              ServerLog.create({'recordBy': 'google-oauth2-sign-up',
                                'type': 'sign up-user exsist',
                                'requestIP': remoteIp,
                                'content': gmail});
              res.redirect('/account/google-oauth2/sign-up-page?err=USER_EXSIST');
            }
            else{
              // create user
              User.create({'account_type': 'gmail',
                         'name': userName,
                         'email': gmail,
                         'cardSets': []});
              ServerLog.create({'recordBy': 'google-oauth2-sign-up',
                                'type': 'sign up-success',
                                'requestIP': remoteIp,
                                'content': gmail});
              res.redirect('/account/google-oauth2/sign-in-page');
            }
          }
        });
    }
  }
  else{
    req.session.signUpConfig = undefined;
    res.redirect('/account/google-oauth2/sign-up-page');
  }
});
authAPI.get('/sign-out', (req, res, next)=>{
  var remoteIp = req.connection.remoteAddress;
  var gmail = req.session.email;
  ServerLog.create({'recordBy': 'google-oauth2-sign-out',
                    'type': 'sign out',
                    'requestIP': remoteIp,
                    'content': gmail});

  req.session.signedIn = undefined;
  req.session.email = undefined;
  req.session.userName = undefined;
  res.redirect('/');
});

module.exports = authAPI;