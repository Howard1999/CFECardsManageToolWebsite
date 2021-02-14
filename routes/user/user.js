var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/profile', function(req, res, next) {
    var userName = req.session.userName
    var signedIn = req.session.signedIn==true;
    if(signedIn){
        res.render('user/profile', {'title': '五行牌牌組管理器', 'signedIn': signedIn, 'userName': userName});
    }else{
        res.render('error/didnt_sign_in');
    }
});

module.exports = router;
