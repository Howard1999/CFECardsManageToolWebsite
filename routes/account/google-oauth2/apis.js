var express = require('express');
var fs = require('fs');
var jwt = require('jsonwebtoken');
var middleware = require('./middleware');
var {OAuth2Client} = require('google-auth-library');
var mongoose = require('mongoose');
var User = require('../../../model/User');
var InviteCode = require('../../../model/InviteCode');

const secrets = JSON.parse(fs.readFileSync('./secrets.json'));
const CLIENT_ID = secrets.client_id;
const jwtSignSecret = secrets.jwt_sign_secret;
const client = new OAuth2Client(CLIENT_ID);

/* functions */
function verify(token, CLIENT_ID) {
    // error -> reject('TOKEN_VERIFY_ERROR')
    // verify pass -> resolve({id, gmail})
    var promise = client.verifyIdToken({idToken: token, audience: CLIENT_ID});
    return promise.then(
    ticket=>{
        var payload = ticket.getPayload();
        return {id: payload['sub'], gmail: payload['email']};
    },
    err=>{
        throw 'TOKEN_VERIFY_ERROR';
    });
}

function getUser(id){
    // error -> reject('DB_ERROR')
    // user exsist -> resolve(user)
    // user not exsist -> resolve(null)
    return new Promise((resolve, reject)=>{
        User.findById(id, (err, user)=>{
            if(err)reject('DB_ERROR');
            else{
                resolve(user);
            }
        });
    });
}

// function below support transaction
function useInviteCode(code, session){
    // error -> reject('DB_ERROR')
    // code not exsist -> reject('INVITE_CODE_NOT_EXSIST')
    // exsist and delete success -> resolve()
    return new Promise((resolve, reject)=>{
        var callback = (err, code)=>{
            if(err){reject('DB_ERROR');}
            else{
                if(code)resolve();
                else reject('INVITE_CODE_NOT_EXSIST');
            }
        };
        if(session!=undefined){
            InviteCode.findOneAndDelete({code}, {session}, callback);
        }
        else{
            InviteCode.findOneAndDelete({code}, callback);
        }
    });
}

function createAccount(id, gmail, name, session){
    // error -> reject('DB_ERROR');
    // create success -> resolve()
    var promise;
    if(session!=undefined){
        promise = User.create([{_id: id, name: name, gmail: gmail}],
            {session});}
    else{
        promise =  User.create({_id: id, name: name, gmail: gmail});
    }

    return promise.then(
    val=>{
        return;
    },err=>{
        throw 'DB_ERROR';
    });
}

/* apis */
var authApis = express.Router();

authApis.post('/sign-in', middleware.mustSignOut, (req, res, next)=>{
    // recieve:
    //   {token(from google)}
    // response:
    //   {status, type, authToken(temparary save in browser cookie)}
    //   status: [success/error]
    //   type: the reason of error
    //         [DB_ERROR / TOKEN_VERIFY_ERROR / ALREADY_SIGN_IN / USER_NOT_EXSIST]
    //   authToken: jwt token, record id, name and type of signed in user
    var token = req.body.token;
    verify(token, CLIENT_ID)
    .then(data=>{
        id = data['id'];
        return getUser(id); // check user
    }).then(user=>{
        if(user){
            // genarate token
            var payload = {'id': user._id.toString(),
                'name': user.name,
                'type': user.type};
            var token = jwt.sign(payload, jwtSignSecret, {expiresIn: '1 day'});
            // store in cookie
            res.cookie('authToken', token,
                {expires: new Date(Date.now + 24*60*60*1000),
                httpOnly: true,
                signed: true});
            res.json({status: 'success'});
        }
        else{throw 'USER_NOT_EXSIST'}
    }).catch(err_string=>{
        res.json({status: 'error', type: err_string});
    });
});

authApis.post('/sign-up', (req, res, next)=>{
    // recieve:
    //   *Notice* string length check by model schema
    //   {token(from google), name, inviteCode}
    // response:
    //   {status, type}
    //   status: [success/error]
    //   type: the reason of error
    //         [DB_ERROR / TOKEN_VERIFY_ERROR / ACCOUNT_USED / INVITE_CODE_NOT_EXSIST]
    var token = req.body.token;
    var name = req.body.name;
    var inviteCode = req.body.inviteCode;
    var id, gmail;
    var session;

    mongoose.startSession()
    .then(s=>{
        session = s;
        session.startTransaction();
        return verify(token, CLIENT_ID); // verify token
    }).then(data=>{
        id = data['id'];
        gmail = data['gmail'];
        return getUser(id, session); // check user
    }).then(user=>{ 
        if(user){throw 'ACCOUNT_USED';}
        else return useInviteCode(inviteCode, session); // use invite code
    }).then(()=>{
        return createAccount(id, gmail, name, session); // create account
    }).then(async()=>{
            await session.commitTransaction(); // commit
            res.json({status: 'success'});
        },async err_string=>{
            await session.abortTransaction(); // abort
            res.json({status: 'error', type: err_string});
    }).then(()=>{session.endSession();}, // finish
            ()=>{session.endSession();}); // temparory ignore commit/abort failed situation
});

authApis.post('/sign-out', middleware.mustSignIn, (req, res, next)=>{
    res.clearCookie('authToken');
    res.status(200).json({status: 'OK'});
});

module.exports = authApis;