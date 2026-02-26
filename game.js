const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const playerScoreEl = document.querySelector("#player-score");
const cpuScoreEl = document.querySelector("#cpu-score");
const statusEl = document.querySelector("#status");
const overlay = document.querySelector("#overlay");
const overlayTitle = document.querySelector("#overlay-title");
const overlayText = document.querySelector("#overlay-text");
const startBtn = document.querySelector("#start-btn");

const paddle = { width: 14, height: 96, speed: 7 };
const ball = { size: 14, baseSpeed: 6.2, maxSpeed: 12 };
const maxScore = 7;

let gameState;
let playerY;
let cpuY;
let ballX;
let ballY;
let ballVX;
let ballVY;
let playerScore;
let cpuScore;
let upPressed;
let downPressed;
let winner;

init();
startBtn.addEventListener("click", onStartButton);
document.addEventListener("keydown", onKeyDown);
document.addEventListener("keyup", onKeyUp);

function init() {
  resetMatch();
  render();
}

function resetMatch() {
  playerScore = 0;
  cpuScore = 0;
  winner = null;
  resetPositions();
  gameState = "ready";
  updateHud();
  showOverlay("Press Space to Start", "Move with W/S or Arrow keys. First to 7 wins.", "Start Match");
}

function resetPositions(direction = Math.random() > 0.5 ? 1 : -1) {
  playerY = canvas.height / 2 - paddle.height / 2;
  cpuY = canvas.height / 2 - paddle.height / 2;
  ballX = canvas.width / 2 - ball.size / 2;
  ballY = canvas.height / 2 - ball.size / 2;

  const launchAngle = (Math.random() * 0.8 - 0.4) * Math.PI;
  ballVX = Math.cos(launchAngle) * ball.baseSpeed * direction;
  ballVY = Math.sin(launchAngle) * ball.baseSpeed;

  upPressed = false;
  downPressed = false;
}

function onStartButton() {
  if (gameState === "ready") {
    startRound();
  } else if (gameState === "paused") {
    resume();
  } else if (gameState === "won") {
    resetMatch();
    startRound();
  }
}

function startRound() {
  if (gameState === "won") {
    resetMatch();
  }
  gameState = "running";
  hideOverlay();
  updateHud();
  requestAnimationFrame(loop);
}

function pause() {
  if (gameState !== "running") return;
  gameState = "paused";
  updateHud();
  showOverlay("Paused", "Press Space or click resume to continue.", "Resume");
}

function resume() {
  if (gameState !== "paused") return;
  gameState = "running";
  hideOverlay();
  updateHud();
  requestAnimationFrame(loop);
}

function onKeyDown(event) {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

  if (key === " " || key === "Spacebar") {
    event.preventDefault();
    if (gameState === "running") pause();
    else if (gameState === "paused") resume();
    else if (gameState === "ready" || gameState === "won") startRound();
    return;
  }

  if (key === "r") {
    resetMatch();
    return;
  }

  if (key === "w" || key === "ArrowUp") upPressed = true;
  if (key === "s" || key === "ArrowDown") downPressed = true;
}

function onKeyUp(event) {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (key === "w" || key === "ArrowUp") upPressed = false;
  if (key === "s" || key === "ArrowDown") downPressed = false;
}

function loop() {
  if (gameState !== "running") return;
  update();
  render();
  requestAnimationFrame(loop);
}

function update() {
  if (upPressed) playerY -= paddle.speed;
  if (downPressed) playerY += paddle.speed;
  playerY = clamp(playerY, 0, canvas.height - paddle.height);

  const cpuCenter = cpuY + paddle.height / 2;
  const targetY = ballY + ball.size / 2;
  const cpuStep = 5.6;
  if (cpuCenter < targetY - 10) cpuY += cpuStep;
  if (cpuCenter > targetY + 10) cpuY -= cpuStep;
  cpuY = clamp(cpuY, 0, canvas.height - paddle.height);

  ballX += ballVX;
  ballY += ballVY;

  if (ballY <= 0 || ballY + ball.size >= canvas.height) {
    ballY = clamp(ballY, 0, canvas.height - ball.size);
    ballVY *= -1;
  }

  const playerRect = { x: 28, y: playerY, width: paddle.width, height: paddle.height };
  const cpuRect = { x: canvas.width - 28 - paddle.width, y: cpuY, width: paddle.width, height: paddle.height };
  const ballRect = { x: ballX, y: ballY, width: ball.size, height: ball.size };

  if (intersects(ballRect, playerRect) && ballVX < 0) {
    bounceFromPaddle(playerRect, 1);
  } else if (intersects(ballRect, cpuRect) && ballVX > 0) {
    bounceFromPaddle(cpuRect, -1);
  }

  if (ballX + ball.size < 0) {
    cpuScore += 1;
    onPoint(-1);
  } else if (ballX > canvas.width) {
    playerScore += 1;
    onPoint(1);
  }
}

function bounceFromPaddle(paddleRect, directionSign) {
  const relative = (ballY + ball.size / 2 - (paddleRect.y + paddleRect.height / 2)) / (paddleRect.height / 2);
  const bounceAngle = relative * (Math.PI / 3);

  const speed = Math.min(Math.hypot(ballVX, ballVY) + 0.28, ball.maxSpeed);
  ballVX = Math.cos(bounceAngle) * speed * directionSign;
  ballVY = Math.sin(bounceAngle) * speed;

  if (directionSign > 0) {
    ballX = paddleRect.x + paddleRect.width;
  } else {
    ballX = paddleRect.x - ball.size;
  }
}

function onPoint(lastDirection) {
  updateHud();
  if (playerScore >= maxScore || cpuScore >= maxScore) {
    winner = playerScore > cpuScore ? "You" : "CPU";
    gameState = "won";
    updateHud();
    showOverlay(`${winner} Win!`, "Press R for a fresh match or Space to play again.", "Play Again");
    return;
  }

  resetPositions(-lastDirection);
}

function updateHud() {
  playerScoreEl.textContent = String(playerScore);
  cpuScoreEl.textContent = String(cpuScore);

  if (gameState === "running") statusEl.textContent = "Playing";
  else if (gameState === "paused") statusEl.textContent = "Paused";
  else if (gameState === "won") statusEl.textContent = `${winner} won`;
  else statusEl.textContent = "Ready";
}

function render() {
  drawCourt();
  drawPaddles();
  drawBall();
}

function drawCourt() {
  ctx.fillStyle = "#070b18";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(120, 180, 245, 0.25)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

  ctx.setLineDash([10, 12]);
  ctx.strokeStyle = "rgba(154, 211, 255, 0.35)";
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 64, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(154, 211, 255, 0.22)";
  ctx.stroke();
}

function drawPaddles() {
  drawNeonRect(28, playerY, paddle.width, paddle.height, "rgba(80, 255, 226, 0.95)");
  drawNeonRect(canvas.width - 28 - paddle.width, cpuY, paddle.width, paddle.height, "rgba(255, 106, 210, 0.95)");
}

function drawBall() {
  drawNeonRect(ballX, ballY, ball.size, ball.size, "rgba(44, 238, 255, 0.95)", 11);
}

function drawNeonRect(x, y, w, h, color, radius = 7) {
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function intersects(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function showOverlay(title, text, buttonLabel) {
  overlay.classList.remove("hidden");
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  startBtn.textContent = buttonLabel;
}

function hideOverlay() {
  overlay.classList.add("hidden");
}
