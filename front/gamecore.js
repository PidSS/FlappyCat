var stage, w, h, loader, pipe1height, pipe2height, pipe3height, startX, startY, wiggleDelta, topFill;
var background, bird, ground, pipe, bottomPipe, pipes, rotationDelta, counter, counterOutline, highScore, highScoreOutline, notice, noticeOutline;
var outerPadding = 0;
var started = false;
var startJump = false;
var jumpAmount = 120;
var jumpTime = 266;
var dead = false;
var KEYCODE_SPACE = 32;
var gap = 250;
var masterPipeDelay = 1.5;
var pipeDelay = masterPipeDelay;
var restartable = false;
var rd = 0;
var token;
var counterShow = false;

//初始化
function init() {
    document.onkeydown = handleKeyDown;
    stage = new createjs.Stage("testCanvas");
    createjs.Touch.enable(stage);
    w = stage.canvas.width;
    h = stage.canvas.height;
    //载入资源
    manifest = [{
        src: "/resources/gameplay/banana_cat.png",
        id: "bird"
    }, {
        src: "/resources/gameplay/background.png",
        id: "background"
    }, {
        src: "/resources/gameplay/ground.png",
        id: "ground"
    }, {
        src: "/resources/gameplay/pipe.png",
        id: "pipe"
    }, {
        src: "/resources/gameplay/restart.png",
        id: "start"
    }, {
        src: "/resources/gameplay/score.png",
        id: "score"
    }, {
        src: "/resources/fonts/FB.eot"
    }, {
        src: "/resources/fonts/FB.svg"
    }, {
        src: "/resources/fonts/FB.ttf"
    }, {
        src: "/resources/fonts/FB.woff"
    }, {
        src: "/resources/fonts/HYYuanLongHei90W.ttf"
    }];
    loader = new createjs.LoadQueue(false);
    loader.addEventListener("complete", handleComplete);
    loader.loadManifest(manifest);
}

//加载完成后的初始化
function handleComplete() {
    background = new createjs.Shape();
    background.graphics.beginBitmapFill(loader.getResult("background")).drawRect(0, 0, w, h);
    background.y = 0 + outerPadding;
    var groundImg = loader.getResult("ground");
    ground = new createjs.Shape();
    ground.graphics.beginBitmapFill(groundImg).drawRect(0, 0, w + groundImg.width, groundImg.height);
    ground.tileW = groundImg.width;
    ground.y = h - groundImg.height - outerPadding;
    var data = new createjs.SpriteSheet({
        "images": [loader.getResult("bird")],
        "frames": {
            "width": 91,
            "height": 64,
            "regX": 45,
            "regY": 32,
            "count": 3
        },
        "animations": {
            "fly": [1, 2, "fly", 0.15],
            "dive": [0, 0, "dive", 1]
        }
    });
    bird = new createjs.Sprite(data,"fly");
    startX = (w / 2) - (92 / 2);
    startY = 512 + outerPadding;
    wiggleDelta = 18;
    bird.setTransform(startX, startY, 1, 1);
    bird.framerate = 30;
    createjs.Tween.get(bird, {
        loop: true
    }).to({
        y: startY + wiggleDelta
    }, 380, createjs.Ease.sineInOut).to({
        y: startY
    }, 380, createjs.Ease.sineInOut);
    stage.addChild(background);
    topFill = new createjs.Graphics();
    topFill.beginFill("#70c5ce").rect(0, 0, w, outerPadding);
    topFill = new createjs.Shape(topFill);
    stage.addChild(topFill);
    pipes = new createjs.Container();
    stage.addChild(pipes);
    stage.addChild(bird, ground);
    stage.addEventListener("stagemousedown", handleJumpStart);
    bottomFill = new createjs.Graphics();
    bottomFill.beginFill("#ded895").rect(0, h - outerPadding, w, outerPadding);
    bottomFill = new createjs.Shape(bottomFill);
    stage.addChild(bottomFill);
    counter = createText(false, "#ffffff", 1, '86px');
    counterOutline = createText(true, "#000000", 1, '86px');
    notice = createText(false, "#ffffff", 0, '40px');
    notice.font = '40px "YLHei"';
    noticeOutline = createText(true, "#000000", 0, '40px');
    noticeOutline.font = '40px "YLHei"';
    highScore = createText(false, "#ffffff", 0, '60px');
    highScoreOutline = createText(true, "#000000", 0, '60px');
    stage.addChild(counter, counterOutline);
    createjs.Ticker.timingMode = createjs.Ticker.RAF;
    createjs.Ticker.setInterval(100);
    createjs.Ticker.addEventListener("tick", tick);
    if (supports_html5_storage()) {
        var storage = localStorage.getItem("highScore");
        if (storage) {
            highScore.text = storage;
            highScoreOutline.text = storage;
        } else {
            localStorage.setItem("highScore", 0);
        }
    } else {
        var myCookie = document.cookie.replace(/(?:(?:^|.*;\s*)highScore\s*\=\s*([^;]*).*$)|^.*$/, "$1");
        if (myCookie) {
            highScore.text = myCookie;
            highScoreOutline.text = myCookie;
        } else {
            document.cookie = "highScore=0";
        }
    }
}

//按键事件
function handleKeyDown(e) {
    if (!e) {
        var e = window.event;
    }
    if (e.keyCode == KEYCODE_SPACE) {
        spacebar();
        return false;
    }
}

//空格处理
function spacebar() {
    handleJumpStart();
    if (dead && restartable) {
        restart();
        restartable = false;
    }
    return false;
}

//跳跃动作
function handleJumpStart() {
    if (!dead) {
        createjs.Tween.removeTweens(bird);
        bird.gotoAndPlay("fly");
        if (bird.y < -200) {
            bird.y = -200;
        }
        if (bird.roation < 0) {
            rotationDelta = (-bird.rotation - 20) / 5;
        } else {
            rotationDelta = (bird.rotation + 20) / 5;
        }
        createjs.Tween.get(bird).to({
            y: bird.y - rotationDelta,
            rotation: -20
        }, rotationDelta, createjs.Ease.linear).to({
            y: bird.y - jumpAmount,
            rotation: -20
        }, jumpTime - rotationDelta, createjs.Ease.quadOut).to({
            y: bird.y
        }, jumpTime, createjs.Ease.quadIn).to({
            y: bird.y + 200,
            rotation: 90
        }, (380) / 1.5, createjs.Ease.linear).call(diveBird).to({
            y: ground.y - 30
        }, (h - (bird.y + 200)) / 1.5, createjs.Ease.linear);
        if (!started) {
            started = true;
            counterShow = true;
            bird.framerate = 60;
        }
    }
}

//视觉坠落
function diveBird() {
    bird.gotoAndPlay("dive");
}

//重新开始游戏
function restart() {
    $("canvas").trigger("gameRestart");
    pipes.removeAllChildren();
    createjs.Tween.get(start).to({
        y: start.y + 10
    }, 50).call(removeStart);
    counter.text = 0;
    counterOutline.text = 0;
    counterOutline.alpha = 0;
    counter.alpha = 0;
    counter.font = "86px 'FB'";
    counterOutline.font = counter.font;
    counter.y = 150 + outerPadding;
    counterOutline.y = counter.y;
    counterShow = false;
    highScore.alpha = 0;
    highScoreOutline.alpha = 0;
    pipeDelay = masterPipeDelay;
    dead = false;
    started = false;
    startJump = false;
    createjs.Tween.removeTweens(bird);
    bird.x = startX;
    bird.y = startY;
    bird.rotation = 0;
    rd = 0;
    createjs.Tween.get(bird, {
        loop: true
    }).to({
        y: startY + wiggleDelta
    }, 380, createjs.Ease.sineInOut).to({
        y: startY
    }, 380, createjs.Ease.sineInOut);
}

//死掉了 进行结算
function die() {
    $("canvas").trigger("gameEnd");
    dead = true;
    bird.gotoAndPlay("dive");
    submitScore(counter.text,
        (newHighScore, broke)=>{
            console.log("into success callback");
            highScore.text = newHighScore;
            highScoreOutline.text = newHighScore;
            if (supports_html5_storage()) {
                localStorage.setItem("highScore", counter.text);
            } else {
                document.cookie = "highScore=" + counter.text;
            }
            if (broke) {
                notice.text = "新纪录！";
                noticeOutline.text = "新纪录！";
                notice.y = 150;
                noticeOutline.y = 150;
                stage.addChild(noticeOutline);
                stage.addChild(notice);
                dropIn(noticeOutline);
                dropIn(notice);
            }
        },(warnText)=>{
            console.log("into error callback, text is ", warnText);
            notice.text = warnText;
            noticeOutline.text = warnText;
            notice.y = 150;
            noticeOutline.y = 150;
            stage.addChild(noticeOutline);
            stage.addChild(notice);
            dropIn(noticeOutline);
            dropIn(notice);
        });
    createjs.Tween.removeTweens(bird);
    createjs.Tween.get(bird).wait(0).to({
        y: bird.y + 200,
        rotation: 90
    }, (380) / 1.5, createjs.Ease.linear).call(diveBird).to({
        y: ground.y - 30
    }, (h - (bird.y + 200)) / 1.5, createjs.Ease.linear);
    createjs.Tween.get(stage).to({
        alpha: 0
    }, 100).to({
        alpha: 1
    }, 100);
    score = addImageAtCenter('score', 0, -150);
    start = addImageAtCenter('start', 0, 80);
    stage.removeChild(counter, counterOutline);
    stage.addChild(score);
    stage.addChild(start);
    counter.y = counter.y + 160;
    counter.font = "60px 'FB'";
    counterOutline.y = counter.y;
    counterOutline.font = "60px 'FB'";
    counter.alpha = 0;
    counterOutline.alpha = 0;
    highScore.y = counter.y + 80;
    highScoreOutline.y = highScore.y;
    stage.addChild(counter, counterOutline, highScore, highScoreOutline);
    dropIn(score);
    dropIn(start);
    dropIn(counter);
    dropIn(counterOutline);
    dropIn(highScore);
    dropIn(highScoreOutline);
    addClickToStart();
}

//重新开始时去除无关信息
function removeStart() {
    stage.removeChild(start);
    stage.removeChild(score);
    stage.removeChild(notice);
    stage.removeChild(noticeOutline);
}

//监听点击重新开始
function addClickToStart(item) {
    start.addEventListener("click", restart);
    restartable = true;
}

//元素出现动画
function dropIn(item) {
    createjs.Tween.get(item).to({
        alpha: 1,
        y: item.y + 50
    }, 400, createjs.Ease.sineIn);
}

//添加图片元素
function addImageAtCenter(id, xOffset, yOffset) {
    var image = new createjs.Bitmap(loader.getResult(id));
    image.alpha = 0;
    image.x = w / 2 - image.image.width / 2 + xOffset;
    image.y = h / 2 - image.image.height / 2 + yOffset;
    return image;
}

//添加文本
function createText(isOutline, color, alpha, fontSize) {
    var text = new createjs.Text(0,fontSize + " 'FB'",color);
    if (isOutline) {
        text.outline = 5;
    }
    text.color = color;
    text.textAlign = 'center';
    text.x = w / 2;
    text.y = 150 + outerPadding;
    text.alpha = alpha;
    return text;
}

//h5存储信息
function supports_html5_storage() {
    try {
        localStorage.setItem("test", "foo");
        return 'localStorage'in window && window.localStorage !== null;
    } catch (e) {
        return false;
    }
}

//运行时帧
function tick(event) {
    var deltaS = event.delta / 1000;
    var l = pipes.getNumChildren();
    if (bird.y > (ground.y - 40)) {
        if (!dead) {
            die();
        }
        if (bird.y > (ground.y - 30)) {
            createjs.Tween.removeTweens(bird);
        }
    }
    if (!dead) {
        ground.x = (ground.x - deltaS * 300) % ground.tileW;
    }
    if (started && !dead) {
        rd = rd + deltaS;
        if (pipeDelay < 0) {
            pipe = new createjs.Bitmap(loader.getResult("pipe"));
            pipe.x = w + 600;
            pipe.y = (ground.y - gap * 2) * Math.random() + gap * 1.5;
            pipes.addChild(pipe);
            pipe2 = new createjs.Bitmap(loader.getResult("pipe"));
            pipe2.scaleX = -1;
            pipe2.rotation = 180;
            pipe2.x = pipe.x;
            pipe2.y = pipe.y - gap;
            pipes.addChild(pipe2);
            pipeDelay = masterPipeDelay;
        } else {
            pipeDelay = pipeDelay - 1 * deltaS;
        }
        for (var i = 0; i < l; i++) {
            pipe = pipes.getChildAt(i);
            if (pipe) {
                if (true) {
                    var collision = ndgmr.checkRectCollision(pipe, bird, 1, true);
                    if (collision) {
                        if (collision.width > 8 && collision.height > 8) {
                            die();
                        }
                    }
                }
                pipe.x = (pipe.x - deltaS * 300);
                if (pipe.x <= 338 && pipe.rotation === 0 && pipe.name != "counted") {
                    pipe.name = "counted";
                    counter.text = counter.text + 1;
                    counterOutline.text = counterOutline.text + 1;
                }
                if (pipe.x + pipe.image.width <= -pipe.w) {
                    pipes.removeChild(pipe);
                }
            }
        }
        if (counterShow) {
            counter.alpha = 1;
            counterOutline.alpha = 1;
            counterShow = false;
        }
    }
    stage.update(event);
}

//提交分数
function submitScore(mark, then, except) {
    console.log("submitting");
    $.ajax({
        url: "/settlement",
        method: "GET",
        data: { mark },
        success: (res)=>{
            console.log(res);
            then(res.record, res.broke);
        },
        error: (xhr,status,code)=>{
            console.log(xhr);
            switch (xhr.status){
                case(400):
                    except("不要对我进行渗透测试啊！");
                    break;
                case(401):
                    except("登录后才能上传成绩哦！");
                    break;
                default:
                    except("发生未知错误，可能无法连接到服务器QAQ");z
            }

        }
    })
}