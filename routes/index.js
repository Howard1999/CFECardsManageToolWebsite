var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  if(req.session.signedIn){
    const mail = req.session.email;
    const name = req.session.userName;
    res.render('index', { title: '五行牌牌組管理器', signedIn: true, gmail:mail, userName:name});
  }
  else{
    res.render('index', { title: '五行牌牌組管理器', signedIn: false, gmail:null, userName:null});
  }
});

module.exports = router;
