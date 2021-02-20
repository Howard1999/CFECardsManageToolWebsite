function signOut() {
    $.post('/account/google-oauth2/sign-out', {}, (retData)=>{
        window.location.replace('/');
    });
}