var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/profile', function(req, res, next) {
  if(req.session.signedIn){
    res.render('userprofile', {title: '五行牌牌組管理器', userName: req.session.userName});
  }else{
    res.redirect('/');
  }
});

module.exports = router;
