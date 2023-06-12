const express = require("express");
const db = require("./db");
const chalk = require("chalk");
const logger = require("./log");
let md5 = require("./lib/md5.min");

var router = express.Router();
const salt = "6d8fc80ae8d10ce7d179d9bef28df666";

router.use((req,res,next)=>{
    logger.log(req.method,chalk.bold(req.path),"from:",req.ip);
    next();
})

//检查登录态中间件 checkLogStatus
router.use((req,res,next)=>{ 
    //部分请求无需检查登陆态，直接放行
    const whiteList = ['/','/login','/register','/logout'];
    if (whiteList.includes(req.path)) next();
    else{
        //不在白名单内->检查登陆态，未登录则返回401状态
        let username=req.session.username;
        if (username){
            db.checkUser(username,(dbRes)=>{
                if (dbRes.name===username){
                    res.cookie("username",username); //设置这个是为了前端渲染用
                    next();
                }
                else res.clearCookie("username").status(401).end();
            })
        }else res.clearCookie("username").status(401).end();
    }
});

//检查登陆态（主动）
router.get("/cls", (req,res)=>{
    //能到达这里的request都是已经经过中间件检查的，直接返回true即可
    res.send(true);
})

router.get("/", (req,res)=>{
    res.redirect("/game.html");
})

//注册
router.all("/register", (req,res)=>{
    let params = req.query;
    if (("name" in params) && ("password" in params) && (params.name!="") && (params.password!="") && (params.password!=salt)) {
        let username = params.name;
        let pwd1 = params.password;
        let pwd2 = md5(pwd1);
        db.checkUser(username, (dbres1)=>{
            //用户名查重
            if (dbres1 != undefined){
                //有重复
                res.clearCookie("username").status(401).send("用户名重复，注册失败");
            } else {
                //无重复 执行数据库插入
                db.insertUser(
                    {name:username, password:pwd2},
                    (dbres2)=>{
                        if (dbres2 != undefined){
                            //新增成功
                            //设置cookie-session
                            req.session.username = dbres2.name;
                            req.session.uid = dbres2.id;
                            res.cookie("username",dbres2.name); //设置这个是为了前端渲染用
                            //返回
                            res.send(dbres2);
                        } else {
                            //新增失败
                            res.status(500).send("服务器内部错误，注册失败");
                        }
                    });
            }
        })
    } else {
        res.status(400).send("参数缺失，注册失败\n");
    }
});

//登陆
router.all("/login", (req,res)=>{
    let params = req.query;
    if (("name" in params) && ("password" in params) && (params.name!="") && (params.password!="") && (params.password!=salt)) {
        let username = params.name;
        let pwd1 = params.password; //原密码
        let pwd2 = md5(pwd1); //二次加密的密码
        db.checkUser(username, (dbres)=>{
            if ((dbres!=undefined) && (dbres.password===pwd2)){
                //验证成功
                //设置session-cookie
                req.session.username = dbres.name;
                req.session.uid = dbres.id;
                res.cookie("username",dbres.name); //设置这个是为了前端渲染用
                //向前端返回内容
                dbres.password = undefined; //返回给前端的数据删除掉密码
                res.send(dbres);
            } else {
                res.clearCookie("username").status(401).send("登陆失败");
            }
        });
    } else {
        res.status(400).send("参数缺失\n");
    }
});

//登出
router.all("/logout", (req,res)=>{
    res.clearCookie("username");
    req.session.destroy((err)=>{
        if(err) logger.warn(err);
    })
    res.redirect("/login.html");
})

//游戏结束后分数结算
router.get("/settlement", (req,res)=>{
    const id = req.session.uid;
    const mark = req.query.mark;
    if (mark>=0){
        let thisCredit = 20+(mark/10);
        db.getUserById(id, (dbres1)=>{
            if (dbres1===undefined) res.clearCookie("username").status(401).end();
            else{
                let newRecord = mark > dbres1.record ? mark : dbres1.record;
                let broke = mark > dbres1.record;
                let newCredit = dbres1.credits+thisCredit;
                db.updateRC(
                    {
                        credits: newCredit,
                        record: newRecord,
                        id
                    },
                    ()=>{
                        db.getUserById(id, (dbres2)=>{
                            dbres2.broke = broke;
                            res.send(dbres2);
                        })
                })
            }
        })
    }else{
        res.status(400).send("错误的得分："+mark);
    }
})

//获取排行榜
router.all("/rank", (req,res)=>{
    db.listByRecords((dbres)=>{
        res.send(dbres);
    })
})

module.exports = router;