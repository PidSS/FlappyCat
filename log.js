const chalk = require('chalk') //仅支持chalk 4.1.2及以下版本
const moment = require('moment')

//普通log, 显示灰色
function log(caller,...contents){
    nowTime = '['+moment().format('YY-MM-DD HH:mm:ss')+']';
    nowTime = chalk.grey(nowTime);
    caller = chalk.white.bold.bgBlackBright(' ['+caller+'] ');
    console.log(nowTime,caller,...contents);
}

//警告, 显示红色
function warn(caller,...contents){
    nowTime = '['+moment().format('YY-MM-DD HH:mm:ss')+']';
    nowTime = chalk.grey(nowTime);
    caller = chalk.white.bold.bgRgb(224,117,67)(' ['+caller+' | WARNING] ');
    console.log(nowTime,caller,...contents);
}

//安全（在某一组操作成功完成时使用以提示，例如服务器启动成功）, 显示绿色
function safe(caller,...contents){
    nowTime = '['+moment().format('YY-MM-DD HH:mm:ss')+']';
    nowTime = chalk.grey(nowTime);
    caller = chalk.white.bold.bgRgb(75,201,146)(' ['+caller+'] ');
    console.log(nowTime,caller,...contents);
}

module.exports={
    log: log,
    warn: warn,
    safe: safe
}