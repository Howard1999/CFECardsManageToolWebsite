var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    var signedIn = req.account.signedIn;
    res.render('index', {'signedIn': signedIn});
});

module.exports = router;
