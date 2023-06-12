const express = require("express");
const cors = require("cors");
const logger = require("./log");
const router = require("./route");
const session = require('express-session');
const path = require("path");

const app = express();

app.use(cors());

app.use(session({ //设置session
    secret: "SAc79_23gBise",
    resave: true,
    saveUninitialized: true,
    name: "session_id",
    rolling: true,
    cookie: {
        domain: '47.94.159.16',
        path: '/',
        httpOnly: true,
        secure: false,
        maxAge: 30*60*1000 //生命周期30min
    }
}))

app.use('/',express.static(path.join(__dirname,'/front'))) //静态托管资源
app.use('/lib',express.static(path.join(__dirname,'/lib'))) //静态托管资源（框架）
app.use('/docs',express.static(path.join(__dirname,'/docs'))) //静态托管资源（文档）

app.use(router);

var server = app.listen( 4396, "0.0.0.0", ()=>{
    var link = "http://"+server.address().address+":"+server.address().port;
    logger.safe("SERVER","后端服务在",link,"运行");
})
