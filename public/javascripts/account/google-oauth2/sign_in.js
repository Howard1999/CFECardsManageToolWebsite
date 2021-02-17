window.onload=()=>{
    gapi.signin2.render('g-signin2', {
        'scope': 'profile email',
        'width': 240,
        'height': 50,
        'longtitle': true,
        'theme': 'dark',
        'onsuccess': onSignIn,
        'onfailure': onFailure
    });
}

function onSignIn(googleUser) {
    var id_token = googleUser.getAuthResponse().id_token;
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {});

    $.post('/account/google-oauth2/sign-in',
        {'token': id_token},
        (retData, status)=>{
            if(status=='success'){ // request status
                if(retData.status=='success'){
                    window.location.href = '/';
                }
                else{
                    if(retData.type=='DB_ERROR'){
                        $('#alertText').html('資料庫發生錯誤，請稍後重新嘗試或聯絡管理員。');
                        $('#alertModal').modal('toggle');
                    }
                    else if(retData.type=='TOKEN_VERIFY_ERROR'){
                        $('#alertText').html('Token驗證發生錯誤，請稍後重新嘗試或聯絡管理員。');
                        $('#alertModal').modal('toggle');
                    }
                    else if(retData.type=='ALREADY_SIGN_IN'){
                        $('#alertText').html('重複登入，請先登出。');
                        $('#alertModal').modal('toggle');
                    }
                    else if(retData.type=='USER_NOT_EXSIST'){
                        $('#requestSignUpModal').modal('toggle');
                    }
                    else{
                        $('#alertText').html('未知的錯誤發生，請記錄下操作過程後向管理員回報。');
                        $('#alertModal').modal('toggle');
                    }
                }
            }
            else{
                $('#alertText').html('連線發生錯誤，請稍後重新嘗試或聯絡管理員。');
                $('#alertModal').modal('toggle');
            }
        });
}

function onFailure(err){
    console.log(error);
}

function gotoSignUp(){
    window.location.href = '/account/google-oauth2/sign-up';
}