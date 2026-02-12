const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const scoreEl = document.querySelector("#score");
const bestEl = document.querySelector("#best");
const speedEl = document.querySelector("#speed");
const comboEl = document.querySelector("#combo");
const overlay = document.querySelector("#overlay");
const overlayTitle = document.querySelector("#overlay-title");
const overlayText = document.querySelector("#overlay-text");
const startBtn = document.querySelector("#start-btn");

const gridSize = 20;
const tileCount = canvas.width / gridSize;

const dirMap = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 }
};

let snake;
let direction;
let pendingDirection;
let food;
let gameState;
let score;
let combo;
let best;
let speedLevel;
let lastFoodTime;
let tickTimer;

const baseTick = 120;

init();
startBtn.addEventListener("click", () => {
  if (gameState === "ready" || gameState === "dead") {
    startRound();
  } else if (gameState === "paused") {
    resume();
  }
});

document.addEventListener("keydown", onKeyDown);

function init() {
  best = Number(localStorage.getItem("neonSnakeBest") || 0);
  bestEl.textContent = String(best);
  reset();
  render();
}

function reset() {
  snake = [
    { x: 8, y: 13 },
    { x: 7, y: 13 },
    { x: 6, y: 13 }
  ];
  direction = { x: 1, y: 0 };
  pendingDirection = direction;
  food = randomOpenTile();
  score = 0;
  combo = 0;
  speedLevel = 1;
  lastFoodTime = performance.now();
  gameState = "ready";
  clearTimeout(tickTimer);
  updateHud();
  showOverlay("Press Space to Start", "Use Arrow keys or WASD. Eat quickly to build combo and speed.", "Start Game");
}

function startRound() {
  if (gameState === "dead") {
    reset();
  }
  gameState = "running";
  hideOverlay();
  scheduleTick();
}

function pause() {
  if (gameState !== "running") return;
  gameState = "paused";
  clearTimeout(tickTimer);
  showOverlay("Paused", "Press Space or click resume to jump back in.", "Resume");
}

function resume() {
  if (gameState !== "paused") return;
  gameState = "running";
  hideOverlay();
  scheduleTick();
}

function onKeyDown(event) {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

  if (key === " " || key === "Spacebar") {
    event.preventDefault();
    if (gameState === "running") pause();
    else if (gameState === "paused" || gameState === "ready") startRound();
    else if (gameState === "dead") startRound();
    return;
  }

  if (key === "r") {
    reset();
    return;
  }

  if (gameState !== "running") return;
  if (!dirMap[key]) return;

  const nextDir = dirMap[key];
  if (nextDir.x === -direction.x && nextDir.y === -direction.y) {
    return;
  }

  pendingDirection = nextDir;
}

function scheduleTick() {
  const interval = Math.max(baseTick - (speedLevel - 1) * 10, 55);
  tickTimer = setTimeout(tick, interval);
}

function tick() {
  if (gameState !== "running") return;

  direction = pendingDirection;
  const head = snake[0];
  const nextHead = {
    x: head.x + direction.x,
    y: head.y + direction.y
  };

  if (hitsWall(nextHead) || hitsSelf(nextHead)) {
    return gameOver();
  }

  snake.unshift(nextHead);

  if (nextHead.x === food.x && nextHead.y === food.y) {
    const now = performance.now();
    const elapsed = now - lastFoodTime;

    combo = elapsed < 1900 ? combo + 1 : 1;
    const gained = 10 + Math.min(combo * 2, 30);
    score += gained;

    speedLevel = 1 + Math.min(Math.floor(score / 60), 8);
    lastFoodTime = now;
    food = randomOpenTile();

    if (score > best) {
      best = score;
      localStorage.setItem("neonSnakeBest", String(best));
    }
  } else {
    snake.pop();
    if (combo > 0) combo = Math.max(combo - 0.07, 0);
  }

  updateHud();
  render();
  scheduleTick();
}

function hitsWall(node) {
  return node.x < 0 || node.y < 0 || node.x >= tileCount || node.y >= tileCount;
}

function hitsSelf(node) {
  return snake.some((segment) => segment.x === node.x && segment.y === node.y);
}

function randomOpenTile() {
  const occupied = new Set(snake?.map((s) => `${s.x},${s.y}`));
  let pick;
  do {
    pick = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
  } while (occupied.has(`${pick.x},${pick.y}`));
  return pick;
}

function gameOver() {
  gameState = "dead";
  clearTimeout(tickTimer);
  showOverlay("Game Over", `You scored ${score} points. Press Space to run it back.`, "Play Again");
}

function updateHud() {
  scoreEl.textContent = String(score);
  bestEl.textContent = String(best);
  speedEl.textContent = `${speedLevel}x`;
  comboEl.textContent = String(Math.floor(combo));
}

function drawGrid() {
  ctx.fillStyle = "#070b18";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(120, 180, 245, 0.08)";
  ctx.lineWidth = 1;
  for (let i = 1; i < tileCount; i += 1) {
    const pos = i * gridSize;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(canvas.width, pos);
    ctx.stroke();
  }
}

function drawFood() {
  const x = food.x * gridSize + gridSize / 2;
  const y = food.y * gridSize + gridSize / 2;

  const pulse = (Math.sin(performance.now() / 160) + 1) / 2;
  const radius = gridSize * (0.25 + pulse * 0.08);

  ctx.beginPath();
  ctx.fillStyle = "rgba(43, 236, 255, 0.95)";
  ctx.shadowColor = "rgba(43, 236, 255, 0.8)";
  ctx.shadowBlur = 16;
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const progress = 1 - index / (snake.length + 1);
    const hue = 160 + progress * 45;
    ctx.fillStyle = `hsl(${hue}, 95%, ${40 + progress * 25}%)`;

    const pad = index === 0 ? 2 : 3;
    const size = gridSize - pad * 2;
    const x = segment.x * gridSize + pad;
    const y = segment.y * gridSize + pad;

    ctx.beginPath();
    ctx.roundRect(x, y, size, size, 5);
    ctx.fill();

    if (index === 0) {
      drawEyes(segment, x, y, size);
    }
  });
}

function drawEyes(segment, x, y, size) {
  const eyeOffset = 5;
  let eye1 = { x: x + eyeOffset, y: y + eyeOffset };
  let eye2 = { x: x + size - eyeOffset, y: y + eyeOffset };

  if (direction.x === -1) {
    eye1 = { x: x + eyeOffset, y: y + eyeOffset };
    eye2 = { x: x + eyeOffset, y: y + size - eyeOffset };
  }

  if (direction.x === 1) {
    eye1 = { x: x + size - eyeOffset, y: y + eyeOffset };
    eye2 = { x: x + size - eyeOffset, y: y + size - eyeOffset };
  }

  if (direction.y === 1) {
    eye1 = { x: x + eyeOffset, y: y + size - eyeOffset };
    eye2 = { x: x + size - eyeOffset, y: y + size - eyeOffset };
  }

  if (direction.y === -1) {
    eye1 = { x: x + eyeOffset, y: y + eyeOffset };
    eye2 = { x: x + size - eyeOffset, y: y + eyeOffset };
  }

  [eye1, eye2].forEach((eye) => {
    ctx.beginPath();
    ctx.fillStyle = "#001a20";
    ctx.arc(eye.x, eye.y, 2.1, 0, Math.PI * 2);
    ctx.fill();
  });
}

function render() {
  drawGrid();
  drawFood();
  drawSnake();
  if (gameState === "running") {
    requestAnimationFrame(render);
  }
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
