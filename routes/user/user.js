var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  if(req.session.gmail&&req.session.userName){
    res.render('userprofile', {title: '五行牌牌組管理器', userName: req.session.userName});
  }else{
    res.redirect('/');
  }
});

module.exports = router;
