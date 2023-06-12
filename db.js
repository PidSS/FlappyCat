const logger=require("./log.js");
var mysql=require('mysql');

var connection = mysql.createConnection({
    host     : 'localhost',
    socketPath : '/tmp/mysql.sock',
    user     : 'webdevelop',
    password : 'Webdevelop$0408',
});

//连接到MySQl
connection.connect((err)=>{
    if (err) throw err;
    logger.safe('DB','连接到MySQL')
})

//保证指定数据库存在
connection.query('CREATE DATABASE IF NOT EXISTS web;',(err)=>{
    if (err) throw err;
})

//连接到指定数据库
connection.query('use web;',(err)=>{
    if (err) throw err;
    logger.safe('DB','连接到数据库web');
})

//连接到指定用户表
connection.query(`CREATE TABLE IF NOT EXISTS users(
    id INT UNSIGNED AUTO_INCREMENT,
    name VARCHAR(15) NOT NULL,
    password CHAR(32) NOT NULL,
    credits INT NOT NULL,
    record INT NOT NULL,
    PRIMARY KEY ( id )
);`,(err,res,fields)=>{
    if (err) throw err;
    logger.safe("DB","连接到用户表")
})

//每隔一段时间ping一下mysql，以防断连
setInterval(()=>{
    connection.ping((err)=>{
	if (err) throw err;
    });
}, 30*60*1000);

//查询用户
checkUser = function(reqUser, callback){
    connection.query(`SELECT * FROM users WHERE name=?;`,reqUser,(err,result)=>{
        if (err) throw err;
        callback(result[0]);
    })
}

//查询用户
getUserById = function(reqId, callback){
    connection.query(`SELECT id, name, credits, record FROM users WHERE id=?;`,reqId,(err,result)=>{
        if (err) throw err;
        callback(result[0]);
    })
}

//添加用户
insertUser = function(params, callback){
    connection.query(
        `INSERT INTO users(name, password, credits, record) VALUES(?,?,?,?)`,
        [params.name, params.password, 0, 0],
        (err,result)=>{
            if (err) throw err;
            if (!("insertId" in result)){
                logger.warn("DB","新增数据失败")
                callback(undefined);
                return;
            }
            else {
                logger.safe("DB","新增数据成功, id:",result.insertId);
                connection.query(`SELECT id, name, record, credits FROM users WHERE id=?;`,result.insertId,(err1,result1)=>{
                    if (err1) throw err1;
                    callback(result1[0]);
                })
            }
    })
}

//完成一次游戏后更新积分和得分
updateRC = function(params, callback){
    connection.query(
        `UPDATE users SET credits = ? , record = ? WHERE id = ? ;`,
        [params.credits, params.record, params.id], (err,result)=>{
            if (err) throw err;
            if (result.affectedRows!=1){
                logger.warn("DB","更新指令未按预期执行，实际影响了",result.affectedRows, "行");
            }
            callback();
        })
}

//按照得分排序
listByRecords = function(callback){
    connection.query(`SELECT id, name, record FROM users ORDER BY record DESC LIMIT 10;`, (err,result)=>{
        if (err) throw err;
        callback(result);
    });
}

module.exports={
    checkUser: checkUser,
    insertUser: insertUser,
    listByRecords: listByRecords,
    updateRC: updateRC,
    getUserById: getUserById
}
