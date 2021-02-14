var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    var signedIn = req.session.signedIn==true;
    var userData = req.session.userData;
    res.render('index', { 'title': '五行牌牌組管理器', 'signedIn': signedIn, 'userData': userData});
});

module.exports = router;
