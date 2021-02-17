var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/profile', function(req, res, next) {
    var signedIn = req.account.signedIn;
    if(signedIn){
        var userName = req.account.payload.name;
        res.render('user/profile', {'signedIn': signedIn, 'userName': userName});
    }else{
        res.render('error/didnt_sign_in');
    }
});

module.exports = router;
