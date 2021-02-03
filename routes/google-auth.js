var express = require('express');
var fs = require('fs');
var {google} = require('googleapis');
var dbAPIs = require('../utils/dbAPIs');

var authAPI = express.Router();
const OAuthConfig = JSON.parse(fs.readFileSync('./auth/oauth2_client.json'));

/* functions */
function createConnection(){
  return new google.auth.OAuth2(
      OAuthConfig.client_id,
      OAuthConfig.client_secret,
      OAuthConfig.redirect
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
async function getGoogleAccount(code, callback) {
  const oauth2Client = createConnection();
  const {tokens} = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  var oauth2 = await google.oauth2({
        auth: oauth2Client,
        version: 'v2'
  });
  oauth2.userinfo.v2.me.get(function(err, res) {
    if (err) {
        callback(false);
    } else {
        callback(res["data"]);
    }
  });
}

/* apis */
authAPI.get('/sign-in', function(req, res, next) { // login
  req.session.destroy();
  auth = createConnection();
  res.redirect(getConnectionUrl(auth)); // redirect to google login page
});

authAPI.get('/signed', function(req, res, next){ // verify user
  const code = req.query.code;
  getGoogleAccount(code, function(account){
    if(account!=false){
      const gmail = account["email"];
      const userName = account["name"]
        
      /*verify user in database*/
      dbAPIs.userExsist(gmail).then((exsist)=>{ 
        if(exsist){
          req.session.gmail = gmail;
          req.session.userName = userName;
          res.redirect("/user/");
        }
        else{res.redirect("/?error=userNotRegist");} // user not exsist
      }).catch((err)=>{res.redirect("/");}); // database error
    }
    else{res.redirect("/");} // oauth2 error
  });
});

authAPI.get('/sign-out', function(req, res, next){ // logout
  req.session.destroy();
  res.redirect("/");
});

module.exports = authAPI;