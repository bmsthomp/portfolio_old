// animation frames
(function() {
    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame; })();

// globals
var canvas = document.getElementById("canvas"),
    ctx = canvas.getContext("2d"),
    width = 1024,
    height = 512,
    keys = [],
    gravity = 0.5,
    volume = true,
    volTimer = 0,
    gameState = true
    smashTimer = 0,
    jumpTimer = 0,
    smashCords = {};

var time = {
    ms: 0,
    s: 0,
    m: 0,
    txt: "00:00:00",
    l: 1
};

time.l = ctx.measureText(time.txt).width;

var player = {
    x: width / 5,
    y: height - 250,
    radius: 11,
    speed: 6,
    velX: 0,
    velY: 0,
    friction: 0.93,
    jumping: false,
    smashing: false,
    orientation: 0,
    contact: false, 
    smash: false,
    jump: false
};

var sun = {
    x: width - 100,
    y: 100,
    radius: 35,
    blur: 100,
    growth: 1
};

var stars = [];

// world objects
var shapes = [];
var worldGrd = height;
shapes.push({ x:width+20, y:height-50, width: 50, height: 50, velX: -3, col: false, bad: false });
shapes.push({ x:width+100, y:height-100, width: 75, height: 75, velX: -3, col: false, bad: false });
shapes.push({ x:width+250, y:height-200, width: 100, height: 100, velX: -3, col: false, bad: false });
shapes.push({ x:width+375, y:height-65, width: 25, height: 25, velX: -3, col: false, bad: true });

// scrolling background
// get the points
var terPoints = terrain(width, height, height / 5, 0.6),
    terPoints2 = terrain(width, height, height / 5, 0.6, {s : terPoints[terPoints.length-1], e : 0}),
    terPoints3 = terrain(width, height, height / 6, 0.6),
    terPoints4 = terrain(width, height, height / 6, 0.6, {s : terPoints3[terPoints.length-1], e : 0}),
    offset = 0;

function update() {

    if (smashTimer < 100){
        smashTimer += 0.5;
    } else if (!player.smash) {
        player.smash = true;
        smashReadyS.play();
    }

    jumpTimer < 75 ? jumpTimer += 0.5 : player.jump = true;

    var gradient = dayNight();

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    genStars();
    drawSun();
    scrollTerrain(terPoints, terPoints2, 1);
    scrollTerrain(terPoints3, terPoints4, 2);
    pushWorld();
    volTimer++;

    // up
    if (keys[38] || keys[87]) {
       if(!player.jumping){
            player.jumping = true;
            player.velY = -player.speed*1.8;
       }
    }
    // right 
    if (keys[39] || keys[68]) {
        if (player.velX < player.speed) {                         
            player.jumping ? player.velX += 0.5 : player.velX += 1.5;                  
        }          
    }  
    // left        
    if (keys[37] || keys[65]) {                               
        if (player.velX > -player.speed) {
            player.jumping ? player.velX -= 0.5 : player.velX -= 1.5;
        }
    }
    // big jump
    if (keys[32]) {
        if(player.jump){
            player.jumping = true;
            player.velY = -player.speed*2.5;
            jumpTimer = 0;
            player.jump = false;
       }
    }
    // smash
    if (keys[16]){
        if (player.smash){
            smashCords = {x: player.x, y: player.y};
            player.velX += 50;
            smashTimer = 0;
            player.smash = false;
            player.smashing = true;
        }
    }
    // volume button suppress
    if (keys[77]) {
        if (volTimer > 10){
            volume = !volume; 
            volume ? loop.start("bg") : loop.stop(); 
            volTimer = 0;           
        }
    }

    // collision
    // and draw environment while we are looping through 
    // the objects.
    ctx.save();
    ctx.strokeStyle = "white";
    ctx.shadowColor = "white";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    var objCuts = 0;
    var colliding = false;
    var rCol = false;

    player.velY += gravity;
    player.velX *= player.friction;

    for (var i = 0; i < shapes.length; i++) {

        var col = playerShapeCol(shapes[i]);
        var objRemoved = false;
        if (col != null && !player.smashing) {

            // game over
            if (shapes[i].bad) { gameState = false; }

            shapes[i].col = true;
            player.contact = true;
            colliding = true;

            if (col === "t"){
                player.y = shapes[i].y - player.radius;
                if (player.velY > 0) { player.velY = 0; }
                player.jumping = false;

            } else if (col === "b") {
                player.y = shapes[i].y + shapes[i].height + player.radius;
                player.velY = -player.velY;

                colSound.play();
                colSound.currentTime = 0;

            } else if (col === "r") {
                player.x = shapes[i].x - player.radius; 
                player.velX += shapes[i].velX;
                rCol = true;

                colSound.play();
                colSound.currentTime = 0;

            } else if (col === "l") {
                player.x = shapes[i].x + shapes[i].width + player.radius;
                player.velX = 0;

                colSound.play();
                colSound.currentTime = 0;
            }
        }
        // player smashing, ignore collision
        else if (col != null && player.smashing){
            shapes.splice(i,1);
            time.s ++;
            objCuts++;
            objRemoved = true;
        }
        // no collision
        else { 
            shapes[i].col = false; 
        }
        // draw shape if it sill exists
        if (!objRemoved){
            // draw
            if ((shapes[i].x + shapes[i].width >= 0) && (shapes[i].x <= width)){
                ctx.beginPath();
                ctx.rect(shapes[i].x,shapes[i].y,shapes[i].width, shapes[i].height);
                ctx.save();
                if (shapes[i].bad){
                    ctx.strokeStyle = "red";
                    ctx.shadowColor = "red";
                    ctx.fillStyle = "red";
                    ctx.fill();
                }
                if (shapes[i].col) { 
                    shapes[i].bad ? ctx.fillStyle = "red" : ctx.fillStyle = "white";
                    ctx.fill();
                }
                ctx.stroke();
                ctx.restore();
            }
            else if(shapes[i].x + shapes[i].width/2 < 0){
                shapes.splice(i, 1);
                objCuts++;
            }
        }
    }
    ctx.restore();

    // player is not colliding with anything
    if (!colliding) {
        player.contact = false;
    }

    // replace objects removed
    while(objCuts > 0){
        objectGenerator();
        objCuts--;
    }

    // add extras
    if (Math.random() > 0.996) { objectGenerator(); }

    // apply physics
    // determine if smashing action is happening
    if (player.velX < 10) { 
        player.smashing = false; 
        player.y += player.velY;
    }
    player.x += player.velX;
    player.orientation += player.velX * 2.5;

    // edge check
    if (player.x >= width - player.radius) {
        player.x = width - player.radius;
    } else if (player.x <= 0 + player.radius) {
        if (rCol && !player.smashing) { gameState = false; }
        player.x = player.radius;  
    }
    if (player.y >= height - player.radius){
        player.velY = -player.velY * 0.3;
        player.y = height - player.radius;
        player.jumping = false;
    }

    /* draw player */
    ctx.save();

    // draw outer circle
    ctx.translate(player.x, player.y);
    ctx.rotate(degToRad(player.orientation - 90));

    if (player.contact) {
        ctx.strokeStyle = "yellow";
        ctx.shadowColor = "yellow";
    } else {
        ctx.strokeStyle = "#3FA5FF";
        ctx.shadowColor = "#3FA5FF";
    }

    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.beginPath();
    ctx.arc(0,0, player.radius, 0, 2 * Math.PI, true);
    ctx.stroke();

    // smash circle
    ctx.save();
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    var smashCir = (smashTimer / 100) * 2;
    ctx.beginPath();
    ctx.arc(0,0, player.radius - 2, 0, smashCir * Math.PI);
    ctx.stroke();

    // jump circle
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    var smashCir = (jumpTimer / 75) * 2;
    ctx.beginPath();
    ctx.arc(0,0, player.radius - 4, 0, smashCir * Math.PI);
    ctx.stroke();
    ctx.restore();

    // draw inside line
    ctx.beginPath();
    ctx.moveTo(0, player.radius);
    ctx.lineTo(0, -player.radius);
    ctx.stroke();

    ctx.restore();

    // draw smash tail
    if (player.smashing){
        ctx.save();
        ctx.lineWidth = 8;
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = "yellow";
        ctx.beginPath();
        ctx.moveTo(smashCords.x, smashCords.y);
        ctx.lineTo(player.x - player.radius, player.y);
        ctx.stroke();
        ctx.restore();
    }

    // draw timer
    ctx.save();
    ctx.font="20px Verdana";
    ctx.fillStyle = "white";
    ctx.fillText(time.txt, (width / 2) - time.l, 25);
    ctx.restore();

    // draw volume control
    volume ? ctx.drawImage(volOn, 8, 8) : ctx.drawImage(volOff, 8, 8);

    if (gameState) { requestAnimationFrame(update); }
    else { 
        gameOver();
        loop.stop();
    }
}

// collision
function playerShapeCol(shape){
    var col = null;

    var x = !(player.x - player.radius > shape.x + shape.width || player.x + player.radius < shape.x);
    var y = !(player.y - player.radius > shape.y + shape.height || player.y + player.radius < shape.y);

    if (x && y) {

        // I found this to be the most precise way to figure out exactly which side the player is colliding with.
        var dT = Math.sqrt(Math.pow((player.x - (shape.x + shape.width/2)),2) + Math.pow((player.y - shape.y), 2));
        var dB = Math.sqrt(Math.pow((player.x - (shape.x + shape.width/2)),2) + Math.pow((player.y - (shape.y + shape.height)), 2));
        var dL = Math.sqrt(Math.pow((player.x - (shape.x + shape.width)),2) + Math.pow((player.y - (shape.y + shape.height/2)), 2));
        var dR = Math.sqrt(Math.pow((player.x - shape.x),2) + Math.pow((player.y - (shape.y + shape.height/2)), 2));

        var result = Math.min(dT, dB, dR, dL);

        if (result == dT) { col = "t"; }
        else if (result === dB) { col = "b"; }
        else if (result === dR) { col = "r"; }
        else if (result === dL) { col = "l"; }

        return col;
    }

    return col;
}

// shifts background from day to night
function dayNight(){
    worldGrd += 0.15;
    var grd = ctx.createLinearGradient(width / 2, worldGrd ,width / 2, 0);

    grd.addColorStop(0,"#FFA294");
    grd.addColorStop(0.25,"#E85B56");
    grd.addColorStop(0.65,"#701627");
    grd.addColorStop(0.85,"#140B21");
    grd.addColorStop(1,"#090514");

    return grd;
}

// draws, generates, removes stars
function genStars(){

    // initialize stars
    if (stars.length === 0){

        for (var i= stars.length; i < 300; i++) {
            stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                v: Math.random() * 0.05,
                s: Math.random() * 2
            });
        };
    }

    // move stars        
    ctx.save();
    ctx.fillStyle = "white";
    for (var i = 0; i < stars.length; i++) {
        stars[i].x -= stars[i].v;
        if (stars[i].x + stars[i].s < 0){
            stars[i].x = width;
        }

        ctx.fillRect(stars[i].x, stars[i].y, stars[i].s, stars[i].s); 
    };
    ctx.restore();
}

// constructs randomized shapes
function objectGenerator(){
    var maxY = height / 3,
        minH = 20,
        maxH = 250,
        minW = 20,
        maxW = 250,
        size = Math.ceil(Math.random() * maxW) + minW,
        bad = Math.random() > .9 ? true : false;

    shapes.push({
        x: width,
        y: Math.random() * maxY + maxY,
        width: bad ? size / 3 : size,
        height: bad ? size / 3 : size,
        velX: Math.random() -5,
        col: false,
        bad: bad
    });
}

// push main world objects
function pushWorld() {
    for (var i = 1; i < shapes.length; i++) {
        shapes[i].x += shapes[i].velX;
    };
}

function gameOver() {
    ctx.save();
    var gameOverT = "Game Over";
    ctx.font="100px Verdana";
    ctx.fillStyle = "white";
    ctx.fillText(gameOverT, (width / 4) -15, 256);
    ctx.restore();
}

// animates the big glowy ball
function drawSun(){
    
    sun.x -= 0.1;
    sun.y += 0.05;

    ctx.save();
    ctx.shadowColor = "#F7FFD2";

    if (sun.blur >= 100) { sun.growth = -0.2; }
    else if (sun.blur <= 25) { sun.growth = 0.2; }

    sun.blur += sun.growth;
    ctx.shadowBlur = sun.blur;
    ctx.fillStyle="#C0E82D";
    ctx.beginPath();
    ctx.arc(sun.x, sun.y, sun.radius, 0, 2 * Math.PI, true);
    ctx.fill();
    ctx.restore();
}

function timer(){
    time.ms += 1;
    if (time.ms == 100){
        time.ms = 0;
        time.s += 1;
    }
    if (time.s == 60){
        time.s = 0;
        time.m += 1;
    }
    time.txt = pad(time.m) + ":" + pad(time.s) + ":" + pad(time.ms);
    
    function pad(n){
        n < 10 ? n = "0" + n : n = n;
        return n;
    }
}

// Terrain Scrolling
// Original code: http://jsfiddle.net/loktar/XDpd3/light/
function terrain(width, height, displace, roughness, seed) {
    var points = [],
        power = Math.pow(2, Math.ceil(Math.log(width) / (Math.log(2)))),
        seed = seed || {
            s: height / 1.5 + (Math.random() * displace * 2) - displace,
            e: height / 1.5 + (Math.random() * displace * 2) - displace
        };

    if(seed.s === 0){
        seed.s = height / 2 + (Math.random() * displace * 2) - displace;
    }
    points[0] = seed.s;
    
    if(seed.e === 0){
        seed.e = height / 2 + (Math.random() * displace * 2) - displace
    }
    points[power] = seed.e;
    
    displace *= roughness;

    for (var i = 1; i < power; i *= 2) {
        for (var j = (power / i) / 2; j < power; j += power / i) {
            points[j] = ((points[j - (power / i) / 2] + points[j + (power / i) / 2]) / 2);
            points[j] += (Math.random() * displace * 2) - displace
        }
        displace *= roughness;
    }
    return points;
}

function scrollTerrain(points, points2, color) {
    offset -= 0.3;
    ctx.save();

    color == 1 ? ctx.fillStyle = "#05004c" : ctx.fillStyle= "#191D4C";
    ctx.beginPath();
    ctx.moveTo(offset, points[0]);
    for (var t = 0; t < points.length; t++) {
        ctx.lineTo(t + offset, points[t]);
    }
    for (t = 0; t < points2.length; t++) {
        ctx.lineTo(width+offset + t, points2[t]);
    }  
    ctx.lineTo(width + offset + t, height);
    ctx.lineTo(offset, height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    if(points2.length-1 + width + offset <= width){
        points = points2;
        points2 = terrain(width, height, height / 5, 0.6, {s : points[points.length-1], e : 0});
        offset = 0;
    }
    
}

// load resources
function resourceLoad(){

    //* Audio credit http://www.joshuahardin.com/free_music_loops.php
    //* SeamlessLoop.js 2.0 - Reproduces seamless loops on HTML5/Javascript
    // https://github.com/Hivenfour/SeamlessLoop
    loop = new SeamlessLoop();
    loop.addUri("audio/evo.wav", 27450, "bg");
    loop.start("bg");

    colSound = new Audio('audio/col1.wav');
    smashReadyS = new Audio('audio/power08.wav');

    volOn = new Image();
    volOn.src = "img/vol_on.png";

    volOff = new Image();
    volOff.src = "img/vol_off.png";
}

// math cheat
function degToRad(deg) {return deg * Math.PI / 180;}

// GAME
window.setInterval(function(){ timer()}, 10);
window.addEventListener("load", function(){ 
    resourceLoad();
    update(); 
});

document.body.addEventListener("keydown", function(e) { keys[e.keyCode] = true; });
document.body.addEventListener("keyup", function(e) { keys[e.keyCode] = false; });