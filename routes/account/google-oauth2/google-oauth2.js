var express = require('express');
var fs = require('fs');
var {google} = require('googleapis');
var accountMiddleware = require('../middleware');
var User = require('../../../model/User');

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
async function getGoogleAccount(code, loc, callback) {
  const oauth2Client = createConnection(loc);
  const {tokens} = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  var oauth2 = await google.oauth2({
        auth: oauth2Client,
        version: 'v2'
  });
  oauth2.userinfo.v2.me.get(function(err, res) {
    if (err) {
        callback(undefined);
    } else {
        callback(res["data"]);
    }
  });
}

/* apis */
authAPI.get('/sign-in', accountMiddleware.multiSignInPrevent, function(req, res, next) { // sign in
  const code = req.query.code;
  if(code===undefined){
    auth = createConnection('sign-in');
    res.redirect(getConnectionUrl(auth)); // redirect to google login page
  }
  else{
    getGoogleAccount(code, 'sign-in', function(data){
      if(data!=undefined){
        var gmail = data['email'];
        var userName = data['name'];
        User.findOne({'email':gmail, 'account_type':'gmail'}, function(err, user){
          if(err)res.redirect("/?err=DBERR");
          if(user){
            // success sign-in
            req.session.signIn = true;
            req.session.email = gmail;
            req.session.userName = name;
            res.redirect('/user/profile');
          }
          else{
            req.session.signUpConfig = {
              'account_type': 'gmail',
              'name': name,
              'email': gmail};
            res.redirect("/account/google-oauth2/sign-up"); // user not exsist
          }
        });
      }
      else{res.redirect("/account/sign-in?err=GOOGLEOAUTHERR");} // oauth2 error
    }).catch(()=>{res.redirect("/account/sign-in?err=GOOGLEOAUTHERR")});
  }
});

authAPI.get('/sign-up', accountMiddleware.multiSignInPrevent, function(req, res, next){ // sign up page
  const signUpConfig = req.session.signUpConfig;
  const code = req.query.code;
  if(signUpConfig!=undefined){
    if(signUpConfig['account_type']==='gmail'){
      var name = signUpConfig['name'];
      var gmail = signUpConfig['email'];
      res.render('google-oauth2/sign-up', {'name': name, 'gmail': gmail});
    }
    else{
      req.session.signUpConfig = undefined;
      auth = createConnection('sign-up');
      res.redirect(getConnectionUrl(auth));
    }
  }
  else if(code!=undefined){
    getGoogleAccount(code, 'sign-up', (data)=>{
      if(data!=undefined){
        var gmail = data['email'];
        req.session.signUpConfig = {
          'account_type': 'gmail',
          'name': data['name'],
          'email': gmail};
        res.redirect("/account/google-oauth2/sign-up");
      }
      else{res.redirect("/account/sign-up?err=GOOGLEOAUTHERR");}
    }).catch(()=>{res.redirect("/account/sign-up?err=GOOGLEOAUTHERR")});
  }
  else{
    auth = createConnection('sign-up');
    res.redirect(getConnectionUrl(auth)); // redirect to google login page
  }
});

authAPI.post('/sign-up', accountMiddleware.multiSignInPrevent, function(req, res, next){ // sign up
  var signUp = req.body.signUp;
  const contactString = "If error continously happen please contact with web manager.";

  if(signUp=='true'){
    var signUpConfig = req.session.signUpConfig;
    var account_type = signUpConfig['account_type'];
    if(account_type != 'gmail'){
      req.session.signUpConfig = undefined;
      res.json({'sign up': 'error',
                'err': "Sign up api doesn't match please try again."+contactString});
    }
    else{
      var name = signUpConfig['name'];
      var gmail = signUpConfig['email'];
      req.session.signUpConfig = undefined;
      User.findOne({'account_type': 'gmail', 'email': gmail}, (err, user)=>{
        if(err)res.json({'sign up': 'error',
                         'err': "Database error"+contactString});
        else if(user)res.json({'sign up': 'error',
                               'err': 'Account has been used.'});
        else{
          User.create({'account_type': 'gmail',
                       'name': name,
                       'email': gmail,
                       'cardSets': []});
          res.json({'sign up': 'success'});
        }
      });
    }
  }
  else{
    req.session.signUpConfig = undefined;
    res.json({'sign up': 'cancel'});
  }
});

module.exports = authAPI;