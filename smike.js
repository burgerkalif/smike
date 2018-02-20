/*
Smike -- a simple SNAKE clone in JavaScript
 */
const GRID_WIDTH = 40;
const GRID_HEIGHT = 30;
const CELL_SIZE = 10;
const HEAD_COLOR = '#fff';
const BODY_COLOR = '#0f0';
const FOOD_COLOR = '#f00';
const TICK_DURATION = 100; // in milliseconds
const KEY = {
  LEFT: 37,
  RIGHT: 39,
  UP: 38,
  DOWN: 40
};

function $(id) {
	return document.getElementById(id); // jquery inspired element selector, it's so damned tedious to write it everytime
}

var snake = [];
var snake_len = 5;
var dir_queue = [];
var neck;
var game_running = true;

var x = 39;
var y = 5;
var dx = -1;
var dy = 0;
var food_x;
var food_y;

var then = 0, acc = 0.0;

var cnv = $("cnv");
cnv.width = GRID_WIDTH * CELL_SIZE;
cnv.height = GRID_HEIGHT * CELL_SIZE;

var ctx = cnv.getContext("2d");
window.addEventListener('keydown', changeDir);

// initialize game
init();

function init() {
	drawSnake();
	drawFood();
	requestAnimationFrame(loop);
}

function loop(now) {
	var delta = now - then;
	acc += delta;
	if (acc > TICK_DURATION) {
		acc = 0;
		drawSnake();
	}

	then = now;
	requestAnimationFrame(loop);
}

/**
 * draw snake
 */
function drawSnake() {
	if (game_running) {
		// check if any direction changes in queue
		if (dir_queue.length) {
			let d = dir_queue.shift();
	
			dx = d.dx;
			dy = d.dy;
		}
	
		// move snake
		x += dx;
		y += dy;
	
		// check if hit walls
		if (x<0 || x>=GRID_WIDTH || y<0 || y>= GRID_HEIGHT) {
			alert("dead!");
			game_running = false;
			return;
		}
	
		// check if self-intersect -> dead!
		// if wanted to avoid having to iterate the snake array
		// but i have to, unless I implement a 'grid' where i can check if some position
		// on the playing field is occupied
		// this is not possible directly on canvas, so i have to iterate snake array instead
		// however, I *do* have to implement a grid if I want to have obstacles, like walls inside
		// the playing ground
		if (isInSnake(x, y)) {
			alert("dead!");
			game_running = false;
			return;
		}
	
		// check if food
		// TODO: this doesn't work properly. tail should stop moving for 5 ticks and then resume,
		// to give the illusion of the snake growing bigger
		// as of know, the tail keeps moving, and only after a while halts (= snake growing)
		// in other words, the snake's growth is delayed by some amount of ticks
		// which is *NOT* what we want !!!!
		// SOLVED: i reverted back to the pop/unshift method, which I kinda resent cuz
		// of performance issue with unshifting a whole array (hmm, over-optimizing perhaps much??!?)
		if (x === food_x && y === food_y) {
			snake_len += 5;
			drawFood();
		}
	
		// clear tail
		if (snake[snake_len - 1] !== undefined) {
			// pop the tail from end of snake
			let tail = snake.pop();
			ctx.clearRect(tail.x * CELL_SIZE, tail.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
		}
	
		// where the head just been, draw body part instead
		if (neck !== undefined) {
			ctx.fillStyle = BODY_COLOR;
			ctx.fillRect(neck.x * CELL_SIZE, neck.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
		}
	
		// put head in front of snake
		var head = { x: x, y: y };
		snake.unshift(head);
	
		// remember where the head just been (neck is just 'below' the head ;-))
		neck = head;
	
		// draw head
		ctx.fillStyle = HEAD_COLOR;
		ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
	}
}

function drawFood() {
	do {
		food_x = ~~(Math.random() * GRID_WIDTH);
		food_y = ~~(Math.random() * GRID_HEIGHT);

	} while (isInSnake(food_x, food_y));

	ctx.fillStyle = FOOD_COLOR;
	ctx.fillRect(food_x * CELL_SIZE, food_y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

}

function isInSnake(x, y) {
	for (let i=0; i<snake.length; i++) {
		if (x === snake[i].x && y === snake[i].y) return true;
	}

	return false;
}

function changeDir(evt) {
	// BUG: it's possible to have the snake change dir back into itself if
	// you press keys fast enough. how is that ?????????
	// if know why:
	// it's bcuz if snake is moving LEFT and you rapidly change dir DOWN->RIGHT
	// then the direction is set to RIGHT, the DOWN move is never rendered
	// so the next render will change direction to RIGHT, not DOWN+RIGHT
	// how to fix this??? i don't know yet
	// 
	// I GOT IT! implement a queue! keypresses are pushed to the queue, like this:
	// every time a key is pressed, the proper dx and dy's are calculated
	// and then pushed to the queue. the draw function should iterate through the queue
	// and add all dx's and dy's to the current x and y
	// in order for this to work I also have to initial check if an arrow key is pressed!!
	// that turned out to be overly complicated, so I'll do something else
	// well that didn't work either
	// no, I'll implement the queue anyway!
	// SOLVED! it works like a charm now :-)

	// evt.preventDefault();
	// console.log(evt.keyCode);
	// 
	// TODO: only push allowed direction changes to the queue
	// now, you can hold down right key (if snake is moving right), which will push
	// a whole lot of unnecessary right's to the queue, thus blocking the queue from
	// any valid dir. change (like pressing arrow dhead 
	// ^^^DONE! i had to add checks for if snakes move horizontally, then no horizontal dirs are allowed,
	// same with vertical

	var key = evt.keyCode;
	if (key === KEY.UP || key === KEY.DOWN || key === KEY.LEFT || key === KEY.RIGHT) {
		switch (key) {
			case KEY.LEFT:
				if (dx) return; // already moving horizontally, so return
				dx = -1; dy = 0;
				break;
			case KEY.UP:
				if (dy) return; // already moving vertically, so return
				dx = 0; dy = -1;
				break;
			case KEY.RIGHT:
				if (dx) return;
				dx = 1; dy = 0;
				break;
			case KEY.DOWN:
				if (dy) return;
				dx = 0; dy = 1;
				// break;
		}

		// push to dir. queue
		dir_queue.push({ dx: dx, dy: dy });

	}
}