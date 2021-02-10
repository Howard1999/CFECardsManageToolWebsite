window.onload = ()=>{
    var signUpButton = document.getElementById("signup_button");
    var cancleSignUpButton = document.getElementById("cancle_signup_button");

    signUpButton.onclick = ()=>{
        console.log(123456);
        $.post("/account/google-oauth2/sign-up",{'signUp': true}, function(data, status){
            if(data['sign up']=='error')alert(data['err']);
            window.location.replace("/account/google-oauth2/sign-in");
        });
    };
    cancleSignUpButton.onclick = ()=>{
        $.post("/account/google-oauth2/sign-up",{'signUp': false}, function(data, status){
            window.location.replace("/account/sign-up");
        });
    };  
}
