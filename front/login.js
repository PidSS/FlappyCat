$(function () {
    //监听登录事件
    $('#form_login').on('submit', function (e) {
        e.preventDefault();
        var form = document.querySelector("#form_login");
        //前端加密
        let fd = new FormData(form);
        let name = fd.get("username");
        let pwd0 = fd.get("password"); //原始密码
        const salt = "6d8fc80ae8d10ce7d179d9bef28df666"; //盐值
        let pwd1 = md5(pwd0 + salt, name); //加盐后哈希

        $.ajax({
            url: '/login',
            method: 'GET',
            data: { name: name, password: pwd1 },
            //成功返回用户相关信息
            success: function (res) {
                alert(`欢迎您，${res.name}\n登录成功！`);
                window.location.href="/game.html";
            },
            error: (xhr, status, error)=>{
                switch(xhr.status){
                    case(401):
                        alert("用户名或密码错误，登陆失败");
                        break;
                    default:
                        alert(xhr.responseText);
                }
            }
        })
    })

    //监听注册表单的提交事件
    $('#form_reg').on('submit', function (e) {
        e.preventDefault();
        var form = document.querySelector("#form_reg");
        //前端加密
        let fd = new FormData(form);
        let name = fd.get("username");
        let pwd0 = fd.get("password"); //原始密码
        let repwd = fd.get("confirmPassword");
        const salt = "6d8fc80ae8d10ce7d179d9bef28df666"; //盐值
        let pwd1 = md5(pwd0 + salt, name); //加盐后哈希
        if (precheck(name,pwd0,repwd)){
            $.ajax({
                url: "/register",
                type: "GET",
                data: { name: name, password: pwd1 },
                //成功返回用户相关信息
                success: function (res) {
                    alert(`欢迎您，${res.name}\n注册成功！`);
                    window.location.href="/game.html";
                },
                error: (xhr, status, error)=>{
                    switch(xhr.status){
                        case(401):
                            alert("用户名重复，注册失败");
                            break;
                        default:
                            alert(xhr.responseText);
                    }
                }
            })
        }else{
            alert("输入内容有误，可能是：\n有表项为空/密码与确认密码不一致\n请检查");
        }

    })
})

function precheck(name,pwd,repwd){
    const t1 = (name!=undefined)&&(pwd!=undefined)&&(repwd!=undefined);
    const t2 = (pwd===repwd)
    return (t1&&t2)
}