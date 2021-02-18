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
    popover = new bootstrap.Popover($('#name').get(0),
        {container:'body', content:'最少兩個字', trigger:'manual'});
    $('#signUpCheckModal').get(0).addEventListener('shown.bs.modal', (event)=>{
        nameCheck();
    });
    $('#signUpCheckModal').get(0).addEventListener('hide.bs.modal', (event)=>{
        popover.hide();
        $('#postButton').attr('disabled', false);
    });
}

var popover;
function nameCheck(){
    var postButton = $('#postButton');
    var name = $('#name');
    var strlen = name.val().length;

    if(strlen<2){
        postButton.attr('disabled', true);
        popover.show();
    }
    else {
        postButton.attr('disabled', false);
        popover.hide();
    }
}

var id_token;
function onSignIn(googleUser) {
    id_token = googleUser.getAuthResponse().id_token;
    var profile = googleUser.getBasicProfile();

    $('#avatar').attr("src", profile.getImageUrl());
    $('#email').val(profile.getEmail());
    $('#name').val(profile.getName());

    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {});

    $('#signUpCheckModal').modal('show');
}

function signUp(){
    var name = $('#name').val();
    var inviteCode = $('#inviteCode').val();
    if(name.length<=10&&inviteCode.length<=11)
    $.post('/account/google-oauth2/sign-up',
        {'token': id_token, 'name': name, 'inviteCode': inviteCode},
        (retData, status)=>{
            id_token = undefined;
            if(status=='success'){
                if(retData.status=='success'){
                    $('#successModal').modal('show');
                }
                else{
                    if(retData.type=='DB_ERROR'){
                        $('#alertText').html('資料庫查詢發生錯誤，請稍後重新嘗試或聯絡管理員。');
                        $('#alertModal').modal('show');
                    }
                    else if(retData.type=='TOKEN_VERIFY_ERROR'){
                        $('#alertText').html('Token驗證發生錯誤，請稍後重新嘗試或聯絡管理員。');
                        $('#alertModal').modal('show');
                    }
                    else if(retData.type=='ACCOUNT_USED'){
                        $('#alertText').html('此Google帳號已註冊於本站。');
                        $('#alertModal').modal('show');
                    }
                    else if(retData.type=='INVITE_CODE_NOT_EXSIST'){
                        $('#alertText').html('邀請碼不存在。');
                        $('#alertModal').modal('show');
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

function gotoSignIn(){
    window.location.href = '/account/google-oauth2/sign-in';
}