$(()=>{
    //全局401
    $.ajaxSetup({
        error:function(xhr,status,error){
            if (xhr.status==401) {
                alert("该页面需要登录后访问，请检查您的登录状态！");
                window.location.href="/login.html";
            }
        }
    });

    //右侧浮动窗口
    $.ajax({
        url: "/cls",
        method: "GET",
        success: ()=>{
            const username = getCookie("username");
            $("body").append(`<div class="sidebar">
                    <button style="cursor: default;" class="button">${username}</button>
                    <button onclick=logout() class="button">Log Out</button>
                </div>`);
        },
        error: ()=>{
            const username = getCookie("username");
            $("body").append(`<div class="sidebar">
                    <button style="cursor: default;" class="button">${username}</button>
                    <button onclick=gotoLogin() class="button">Log In</button>
                </div>`);
        } //忽略全局401
    });
    
})

function getCookie(cname){
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) 
    {
        var c = ca[i].trim();
        if (c.indexOf(name)==0) return c.substring(name.length,c.length);
    }
    return "游客";
}

function logout(){
    $.ajax({
        url: "/logout",
        type: "GET",
        success: ()=>{
            window.location.href="/login.html"
        },
        error: (xhr, status, error)=>{
            alert("发生错误\n状态码："+status+"\n"+error);
        }
    })
}

function gotoLogin() {
    window.location.href="/login.html";
}