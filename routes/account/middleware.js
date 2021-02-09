async function multiSignInPrevent(req, res, next) {
    if(req.session.signIn===true){
        res.redirect('/account/sign-out');
    }
    else next();
}

module.exports = {
    'multiSignInPrevent': multiSignInPrevent
}