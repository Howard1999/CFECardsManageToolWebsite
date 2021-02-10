var express = require('express');
var fs = require('fs');
var {google} = require('googleapis');
var accountMiddleware = require('../middleware');
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

/* apis */

authAPI.get('/sign-in', accountMiddleware.multiSignInPrevent, function(req, res, next) { // sign in
  const code = req.query.code;
  const remoteIp = req.connection.remoteAddress;
  if(code===undefined){
    // redirect to google sign in page
    auth = createConnection('sign-in');
    res.redirect(getConnectionUrl(auth));
  }
  else{
    getGoogleAccount(code, 'sign-in')
      .then((data)=>{
        var gmail = data['email'];
        var userName = data['name'];
        // check user exsist
        User.findOne({'email':gmail, 'account_type':'gmail'}, function(err, user){
          if(err){
            // redirect to sign in page
            ServerLog.create({'recordBy': 'google-oauth2-sign-in',
                              'type': 'DB error',
                              'requestIP': remoteIp,
                              'content': 'Database findOne('+gmail+') error:'+err.toString()});
            res.redirect("/account/sign-in?err=DBERROR");
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
            else{
              // if user doesn't exsist, record google account info and redirect to sign up
              req.session.signUpConfig = {
                'account_type': 'gmail',
                'name': userName,
                'email': gmail};
              ServerLog.create({'recordBy': 'google-oauth2-sign-in',
                                'type': 'sign in-user not exsist',
                                'requestIP': remoteIp,
                                'content': gmail});
              res.redirect("/account/google-oauth2/sign-up"); // user not exsist
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
        res.redirect("/account/sign-in?err=GOOGLEOAUTHERR");
      });
  }
});
// sign up page
authAPI.get('/sign-up', accountMiddleware.multiSignInPrevent, function(req, res, next){
  const signUpConfig = req.session.signUpConfig;
  const code = req.query.code;
  const remoteIp = req.connection.remoteAddress;

  if(signUpConfig!=undefined){ // has account info
    var userName = signUpConfig['name'];
    var gmail = signUpConfig['email'];
    res.render('google-oauth2/sign-up', {'title': '註冊', 'name': userName, 'gmail': gmail});
  }
  else if(code!=undefined){ // has code
    // get account info and record
    getGoogleAccount(code, 'sign-up')
      .then((data)=>{
        var gmail = data['email'];
        var userName = data['name'];
        req.session.signUpConfig = {
          'account_type': 'gmail',
          'name': userName,
          'email': gmail};
        res.redirect("/account/google-oauth2/sign-up");
      })
      .catch((err)=>{
        ServerLog.create({'recordBy': 'google-oauth2-sign-up',
                          'type': 'Google OAuth2 error',
                          'requestIP': remoteIp,
                          'content': 'Google oauth2 error:'+err.toString()});
        res.redirect("/account/sign-up?err=GOOGLEOAUTHERR")}
      );
  }
  else{ // has nothing
    auth = createConnection('sign-up');
    res.redirect(getConnectionUrl(auth)); // redirect to google login page
  }
});

authAPI.post('/sign-up', accountMiddleware.multiSignInPrevent, function(req, res, next){ // sign up
  var signUp = req.body.signUp;
  const remoteIp = req.connection.remoteAddress;
  var signUpConfig = req.session.signUpConfig;
  var account_type = signUpConfig['account_type'];
  var userName = signUpConfig['name'];
  var gmail = signUpConfig['email'];
  req.session.signUpConfig = undefined;

  if(signUp=='true'){
    // check signUpConfig exsist
    if(signUpConfig!=undefined){
      // chack account info is gmail type
      if(account_type == 'gmail'){
        // check user doesn't exsist
        User.findOne({'email':gmail, 'account_type':'gmail'}, (err, user)=>{
          if(err){
            ServerLog.create({'recordBy': 'google-oauth2-sign-up',
                              'type': 'DB error',
                              'requestIP': remoteIp,
                              'content': 'Database findOne('+gmail+') error:'+err.toString()});
            res.json({'sign up': 'error', 'err': "Database error: findOne() doesn't execute correctly."});
          }
          else{
            if(user){
              ServerLog.create({'recordBy': 'google-oauth2-sign-up',
                                'type': 'sign up-user exsist',
                                'requestIP': remoteIp,
                                'content': gmail});
              res.json({'sign up': 'error', 'err': "Account has been signed up"});
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
              res.json({'sign up': 'success'});
            }
          }
        });
      }
      else{
        ServerLog.create({'recordBy': 'google-oauth2-sign-up',
                          'type': 'sign up-error',
                          'requestIP': remoteIp,
                          'content': 'Account is not gmail.'});
        res.json({'sign up': 'error', 'err': "API error: Account is not gmail."});
      }
    }
    else{
      ServerLog.create({'recordBy': 'google-oauth2-sign-up',
                        'type': 'sign up-error',
                        'requestIP': remoteIp,
                        'content': 'No sign in account info.'});
      res.json({'sign up': 'error', 'err': "API error: Google account didn't sign in."});
    }
  }
  else{
    req.session.signUpConfig = undefined;
    res.json({'sign up': 'cancel'});
  }
});

module.exports = authAPI;