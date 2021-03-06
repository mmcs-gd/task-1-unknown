const canvas = document.getElementById("cnvs");

const gameState = {};

function onMouseMove(e) {
    gameState.pointer.x = e.pageX;
    gameState.pointer.y = e.pageY
}

function onMouseClick(e) {
    if(gameState.isStopped)
	{
		const prevScore = gameState.lastGameScore + gameState.gameTime;
		const prevBonus = gameState.lastBonusTime + gameState.bonusTime;
		setup();
		gameState.lastGameScore = prevScore;
		gameState.lastBonusTime = prevBonus;
		run();
	}
}

function queueUpdates(numTicks) {
    for (let i = 0; i < numTicks; i++) {
        gameState.lastTick = gameState.lastTick + gameState.tickLength;
        update(gameState.lastTick);
    }
}

function draw(tFrame) {
    const context = canvas.getContext('2d');
    
    // clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    drawPlatform(context)
    drawBall(context)
    drawScore(context)
    if(gameState.bonus.visible === true)
        drawBonus(context);   
	
	if(gameState.isStopped)
		drawResult(context);
}

function update(tick) {

    const vx = (gameState.pointer.x - gameState.player.x) / 10
    gameState.player.x += vx

    const ball = gameState.ball
    ball.y += ball.vy
    ball.x += ball.vx
	
    if(gameState.bonus.visible)
    {
        gameState.bonus.x += gameState.bonus.vx    
        gameState.bonus.y += gameState.bonus.vy
    }

	checkCollisionCircleRect()
	checkBoundsCollision()
    if(gameState.bonus.visible===true && checkBonusColission())
        gameState.bonusesCatched += 1;
    
	//Our score eq number of seconds from beginning
    if(Math.trunc(gameState.lastTick / 1000) - gameState.lastGameScore > gameState.gameTime)
        gameState.gameTime += 1;
    

    if(Math.trunc(gameState.lastTick / 15000) - gameState.lastBonusTime> gameState.bonusTime)
    {
        createBonus();
        gameState.bonusTime += 1;
    }
    
    if(Math.trunc(gameState.lastTick / 30000)  > gameState.speedUpTime)
    {
        gameState.speedUpTime += 1;
        gameState.ball.vx *= 1.1;
        gameState.ball.vy *= 1.1;
    }    
}

function createBonus() {
    gameState.bonus.x = Math.floor(Math.random() * (canvas.width - gameState.bonus.h_width));
    gameState.bonus.y = Math.floor(Math.random() * canvas.height / 3);
    gameState.bonus.vx = (Math.random() >= 0.5) ? 2*(1 + Math.random()) : -2*(1 + Math.random());
    gameState.bonus.vy = (1+Math.random()) * 2;
    gameState.bonus.visible = true;
}

function deleteBonus() {
    gameState.bonus.visible = false;
}

function checkCollisionCircleRect(){	
	if (gameState.ball.x >= (gameState.player.x - gameState.player.width/2) && gameState.ball.x <=(gameState.player.x + gameState.player.width/2) && (gameState.ball.y + gameState.ball.radius) >= (gameState.player.y - gameState.player.height/2))
		{
			gameState.ball.vy *= -1.005;
			gameState.ball.vx *= 1.005;
			gameState.player.width -= (gameState.player.width >= 100) ? 3 : 0;
		}
}

function checkBoundsCollision(){
    //Vertical walls
	if(gameState.ball.x - gameState.ball.radius <= 0 || gameState.ball.x + gameState.ball.radius >= canvas.width)
		gameState.ball.vx *= -1
    //Horizontal walls
	if(gameState.ball.y - gameState.ball.radius <= 0)
		gameState.ball.vy *= -1
    //Bottom wall
    if(gameState.ball.y + gameState.ball.radius >= canvas.height)
	{
		//drawResult(context)
		stopGame(gameState.stopCycle);
	}
}

function checkBonusColission(){

    if((gameState.player.x - gameState.player.width/2) <= (gameState.bonus.x - gameState.bonus.v_width/2)
    && (gameState.player.x + gameState.player.width/2) >= (gameState.bonus.x - gameState.bonus.v_width/2)
    && (gameState.player.y - gameState.player.height/2) <= (gameState.bonus.y + gameState.bonus.v_height/2))
    {
        deleteBonus();
		gameState.player.width += 10;
        return true;
    }
    //касания бонуса платформы справа
    if((gameState.player.x + gameState.player.width/2) >= (gameState.bonus.x - gameState.bonus.h_width/2)
    && (gameState.player.y + gameState.player.height/2) >= (gameState.bonus.y + gameState.bonus.h_height/2)
    && (gameState.player.y - gameState.player.height/2) <= (gameState.bonus.y + gameState.bonus.h_height/2))
    {
        deleteBonus();
		gameState.player.width += 10;
        return false;
    }

    //касания бонуса платформы слева
    if((gameState.player.x - gameState.player.width/2) <= (gameState.bonus.x + gameState.bonus.h_width/2)
    && (gameState.player.y + gameState.player.height/2) >= (gameState.bonus.y + gameState.bonus.h_height/2)
    && (gameState.player.y - gameState.player.height/2) <= (gameState.bonus.y + gameState.bonus.h_height/2))
    {
        deleteBonus();
		gameState.player.width += 10;
        return false;
    }

    if((gameState.bonus.y + gameState.bonus.v_height) >= canvas.height)
    {
        deleteBonus();
        return false;
    }

    if((gameState.bonus.x + gameState.bonus.h_width) >= canvas.width 
    || (gameState.bonus.x - gameState.bonus.h_width) <= 0)
    {
        gameState.bonus.vx *= -1;
        return false;
    }
    return false;
}

function run(tFrame) {
    gameState.stopCycle = window.requestAnimationFrame(run);

    const nextTick = gameState.lastTick + gameState.tickLength;
    let numTicks = 0;

    if (tFrame > nextTick) {
        const timeSinceTick = tFrame - gameState.lastTick;
        numTicks = Math.floor(timeSinceTick / gameState.tickLength);
    }
    queueUpdates(numTicks);
    draw(tFrame);
    gameState.lastRender = tFrame;
}

function stopGame(handle) {
	gameState.isStopped = true;
    window.cancelAnimationFrame(handle);
}

function drawPlatform(context) {
    const {x, y, width, height} = gameState.player;
    context.beginPath();
    context.rect(x - width / 2, y - height / 2, width, height);
    context.fillStyle = "#0000FF";
    context.fill();
    context.closePath();
}

function drawBall(context) {
    const {x, y, radius} = gameState.ball;
    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI);
    context.fillStyle = "#FF0000";
    context.fill();
    context.closePath();
}

function drawScore(context) {    
	const score = gameState.bonusesCatched * 15 + gameState.gameTime;
    context.font = "italic 30px Arial";
    context.fillStyle = "#000000"
    context.fillText("SCORE:   " + score, 25, 25)    
}

function drawBonus(context) {
    //draw horizontal part of bonus
    context.beginPath();
    const x = gameState.bonus.x
    const y = gameState.bonus.y
    const h_width = gameState.bonus.h_width
    const h_height = gameState.bonus.h_height
    context.rect(x - h_width / 2, y - h_height / 2, h_width, h_height)
    context.fillStyle = "#00FF00"
    context.fill()
    context.closePath()

    //draw vertical part of bonus
    context.beginPath();
    const v_width = gameState.bonus.v_width
    const v_height = gameState.bonus.v_height
    context.rect(x - v_width / 2, y - v_height / 2, v_width, v_height)
    context.fillStyle = "#00FF00"
    context.fill()
    context.closePath()
}

function drawResult(context){
	const score = gameState.bonusesCatched * 15 + gameState.gameTime;
	context.font = "bold 50px Arial";
	context.fillStyle = "#FF0000"
	context.fillText("YOU LOSE!", canvas.width/2 - 50, canvas.height/2-50)
	
	context.font = "30px Arial";
	context.fillStyle = "#000000"
	context.fillText("Score: " + score, canvas.width/2 - 50, canvas.height/2 + 60)
}
	
function setup() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    canvas.addEventListener('mousemove', onMouseMove, false);
	canvas.addEventListener('click', onMouseClick, false);

    gameState.lastTick = performance.now();
    gameState.lastRender = gameState.lastTick;
    gameState.tickLength = 15; //ms
    gameState.score = 0;
    gameState.bonusTime = 0;
    gameState.speedUpTime = 0;
    gameState.gameTime = 0;
	gameState.isStopped = false;
	gameState.lastGameScore = 0;
	gameState.lastBonusTime = 0;
	gameState.bonusesCatched = 0;
	
	
    const platform = {
        width: 400,
        height: 50,
    };

    gameState.player = {
        x: 100,
        y: canvas.height - platform.height / 2,
        width: platform.width,
        height: platform.height
    };

    gameState.pointer = {
        x: 0,
        y: 0,
    };

    gameState.ball = {
        x: canvas.width / 2,
        y: 25,
        radius: 25,
        vx: 3,
        vy: 7
    };
    
    gameState.bonus ={
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        visible: false,
        h_width: (2*gameState.ball.radius),
        h_height: (2*gameState.ball.radius)/3,
        v_width: (2*gameState.ball.radius)/3,
        v_height: (2*gameState.ball.radius)
    }
}

setup();
run();
