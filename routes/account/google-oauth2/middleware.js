var fs = require('fs');
var jwt = require('jsonwebtoken');
var User = require('../../../model/User');

const secrets = JSON.parse(fs.readFileSync('./routes/account/google-oauth2/secret/secrets.json'));
const jwtSignSecret = secrets.jwt_sign_secret;

function verifyToken(req){
    try{
        // get token
        var token = req.signedCookies.authToken;
        // verify token
        var payload = jwt.verify(token, jwtSignSecret);
        return payload;
    }
    catch(err){
        return null;
    }
}

function signInStatus(req, res, next){
    if(req.account===undefined)req.account = {};
    var payload = verifyToken(req);
    if(payload!=null){
        req.account.signedIn = true;
        req.account.payload = payload;
    }else{
        req.account.signedIn = false;
    }
    
    next();
}

function mustSignOut(req, res, next){
    if(req.account.signedIn)res.status(409).json({status: 'error', type:'ALREADY_SIGN_IN'});
    else next();
}

function mustSignIn(req, res, next){
    if(req.account.signedIn)next();
    else res.status(401).json({status: 'error', type: 'DID_NOT_SIGN_IN'});
}

module.exports = {
    signInStatus,
    mustSignOut,
    mustSignIn
}