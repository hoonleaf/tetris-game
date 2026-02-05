(() => {
    // ===== Config =====
    const COLS = 10;
    const ROWS = 20;
    const BLOCK = 30; // canvas pixel size per cell (must match canvas width/height in index.html)
  
    const canvas = document.getElementById("board");
    const ctx = canvas.getContext("2d");
  
    const elScore = document.getElementById("score");
    const elLines = document.getElementById("lines");
    const elLevel = document.getElementById("level");
    const elStatus = document.getElementById("status");
    const btnStart = document.getElementById("btnStart");
    const btnPause = document.getElementById("btnPause");
  
    // Fit logical grid to canvas
    canvas.width = COLS * BLOCK;
    canvas.height = ROWS * BLOCK;
  
    // ===== Tetrominoes =====
    // Matrices are minimal bounding boxes
    const TETROMINOES = {
      I: {
        color: "#46d5ff",
        shapes: [
          [
            [0,0,0,0],
            [1,1,1,1],
            [0,0,0,0],
            [0,0,0,0],
          ],
          [
            [0,0,1,0],
            [0,0,1,0],
            [0,0,1,0],
            [0,0,1,0],
          ],
        ],
      },
      O: {
        color: "#ffd54a",
        shapes: [
          [
            [1,1],
            [1,1],
          ],
        ],
      },
      T: {
        color: "#b47bff",
        shapes: [
          [
            [0,1,0],
            [1,1,1],
            [0,0,0],
          ],
          [
            [0,1,0],
            [0,1,1],
            [0,1,0],
          ],
          [
            [0,0,0],
            [1,1,1],
            [0,1,0],
          ],
          [
            [0,1,0],
            [1,1,0],
            [0,1,0],
          ],
        ],
      },
      S: {
        color: "#6dff8f",
        shapes: [
          [
            [0,1,1],
            [1,1,0],
            [0,0,0],
          ],
          [
            [0,1,0],
            [0,1,1],
            [0,0,1],
          ],
        ],
      },
      Z: {
        color: "#ff5c7a",
        shapes: [
          [
            [1,1,0],
            [0,1,1],
            [0,0,0],
          ],
          [
            [0,0,1],
            [0,1,1],
            [0,1,0],
          ],
        ],
      },
      J: {
        color: "#5c85ff",
        shapes: [
          [
            [1,0,0],
            [1,1,1],
            [0,0,0],
          ],
          [
            [0,1,1],
            [0,1,0],
            [0,1,0],
          ],
          [
            [0,0,0],
            [1,1,1],
            [0,0,1],
          ],
          [
            [0,1,0],
            [0,1,0],
            [1,1,0],
          ],
        ],
      },
      L: {
        color: "#ff9b4a",
        shapes: [
          [
            [0,0,1],
            [1,1,1],
            [0,0,0],
          ],
          [
            [0,1,0],
            [0,1,0],
            [0,1,1],
          ],
          [
            [0,0,0],
            [1,1,1],
            [1,0,0],
          ],
          [
            [1,1,0],
            [0,1,0],
            [0,1,0],
          ],
        ],
      },
    };
  
    const PIECE_KEYS = Object.keys(TETROMINOES);
  
    // ===== Game State =====
    let board = createBoard();
    let current = null; // {key, rot, x, y}
    let nextKey = randomPieceKey();
  
    let score = 0;
    let lines = 0;
    let level = 1;
  
    let running = false;
    let paused = false;
    let gameOver = false;
  
    // timing
    let lastTime = 0;
    let dropCounter = 0;
    let dropInterval = levelToInterval(level);
  
    // input throttling for soft drop
    let softDropHeld = false;
  
    // ===== Helpers =====
    function createBoard() {
      // null = empty; otherwise string color
      return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    }
  
    function randomPieceKey() {
      // MVP random; (bag system optional)
      return PIECE_KEYS[(Math.random() * PIECE_KEYS.length) | 0];
    }
  
    function levelToInterval(lv) {
      // faster as level increases, clamp
      const ms = 800 - (lv - 1) * 60;
      return Math.max(120, ms);
    }
  
    function resetGame() {
      board = createBoard();
      score = 0;
      lines = 0;
      level = 1;
      dropInterval = levelToInterval(level);
  
      gameOver = false;
      paused = false;
      running = true;
  
      nextKey = randomPieceKey();
      spawnPiece();
  
      setStatus("Playing");
      renderHUD();
    }
  
    function setStatus(text) {
      elStatus.textContent = text;
    }
  
    function renderHUD() {
      elScore.textContent = String(score);
      elLines.textContent = String(lines);
      elLevel.textContent = String(level);
    }
  
    function spawnPiece() {
      const key = nextKey;
      nextKey = randomPieceKey();
  
      current = {
        key,
        rot: 0,
        x: Math.floor(COLS / 2) - 2,
        y: -1, // start slightly above board
      };
  
      // center adjust for O piece
      const shape = getShape(current);
      const w = shape[0].length;
      current.x = Math.floor((COLS - w) / 2);
  
      if (collides(board, current, 0, 0, current.rot)) {
        running = false;
        gameOver = true;
        setStatus("Game Over — Press R to restart");
      }
    }
  
    function getShape(piece, rotOverride = null) {
      const def = TETROMINOES[piece.key];
      const rot = rotOverride !== null ? rotOverride : piece.rot;
      return def.shapes[rot % def.shapes.length];
    }
  
    function getColor(key) {
      return TETROMINOES[key].color;
    }
  
    function collides(bd, piece, dx, dy, rot) {
      const shape = getShape(piece, rot);
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (!shape[y][x]) continue;
          const nx = piece.x + x + dx;
          const ny = piece.y + y + dy;
  
          if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
          if (ny >= 0 && bd[ny][nx]) return true;
        }
      }
      return false;
    }
  
    function mergePiece(bd, piece) {
      const shape = getShape(piece);
      const color = getColor(piece.key);
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (!shape[y][x]) continue;
          const by = piece.y + y;
          const bx = piece.x + x;
          if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
            bd[by][bx] = color;
          }
        }
      }
    }
  
    function clearLines() {
      let cleared = 0;
  
      for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== null)) {
          board.splice(y, 1);
          board.unshift(Array(COLS).fill(null));
          cleared++;
          y++; // re-check same y after shift
        }
      }
  
      if (cleared > 0) {
        lines += cleared;
  
        // scoring (classic-ish): 1/2/3/4 lines
        const lineScores = [0, 100, 300, 500, 800];
        score += lineScores[cleared] * level;
  
        // level up every 10 lines
        const newLevel = Math.floor(lines / 10) + 1;
        if (newLevel !== level) {
          level = newLevel;
          dropInterval = levelToInterval(level);
        }
  
        renderHUD();
      }
    }
  
    function rotatePiece(dir) {
      const def = TETROMINOES[current.key];
      const len = def.shapes.length;
      const nextRot = (current.rot + dir + len) % len;
  
      // simple wall-kick: try shifts
      const kicks = [0, -1, 1, -2, 2];
      for (const k of kicks) {
        if (!collides(board, current, k, 0, nextRot)) {
          current.rot = nextRot;
          current.x += k;
          return;
        }
      }
    }
  
    function hardDrop() {
      if (!running || paused || gameOver) return;
      let dy = 0;
      while (!collides(board, current, 0, dy + 1, current.rot)) dy++;
      current.y += dy;
      lockPiece();
      // reward for hard drop distance
      score += Math.max(0, dy) * 2;
      renderHUD();
    }
  
    function softDropStep() {
      if (!running || paused || gameOver) return;
      if (!collides(board, current, 0, 1, current.rot)) {
        current.y += 1;
        score += 1; // tiny reward
        renderHUD();
      } else {
        lockPiece();
      }
    }
  
    function move(dx) {
      if (!running || paused || gameOver) return;
      if (!collides(board, current, dx, 0, current.rot)) current.x += dx;
    }
  
    function tickDrop() {
      if (!running || paused || gameOver) return;
      if (!collides(board, current, 0, 1, current.rot)) {
        current.y += 1;
      } else {
        lockPiece();
      }
    }
  
    function lockPiece() {
      mergePiece(board, current);
      clearLines();
      spawnPiece();
    }
  
    // ===== Drawing =====
    function drawCell(x, y, color) {
      const px = x * BLOCK;
      const py = y * BLOCK;
  
      ctx.fillStyle = color;
      ctx.fillRect(px, py, BLOCK, BLOCK);
  
      // subtle border highlight
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, BLOCK - 1, BLOCK - 1);
    }
  
    function drawGrid() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  
      // background grid
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
  
      for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK + 0.5, 0);
        ctx.lineTo(x * BLOCK + 0.5, ROWS * BLOCK);
        ctx.stroke();
      }
      for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK + 0.5);
        ctx.lineTo(COLS * BLOCK, y * BLOCK + 0.5);
        ctx.stroke();
      }
    }
  
    function drawBoard() {
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const cell = board[y][x];
          if (cell) drawCell(x, y, cell);
        }
      }
    }
  
    function drawGhost() {
      if (!current || gameOver) return;
      let dy = 0;
      while (!collides(board, current, 0, dy + 1, current.rot)) dy++;
  
      const shape = getShape(current);
      ctx.globalAlpha = 0.25;
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (!shape[y][x]) continue;
          const gx = current.x + x;
          const gy = current.y + y + dy;
          if (gy >= 0) drawCell(gx, gy, getColor(current.key));
        }
      }
      ctx.globalAlpha = 1.0;
    }
  
    function drawCurrent() {
      if (!current || gameOver) return;
      const shape = getShape(current);
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (!shape[y][x]) continue;
          const bx = current.x + x;
          const by = current.y + y;
          if (by >= 0) drawCell(bx, by, getColor(current.key));
        }
      }
    }
  
    function drawOverlay() {
      if (!paused && !gameOver && running) return;
  
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "700 26px ui-sans-serif, system-ui";
  
      let msg = "Press R to start";
      if (paused) msg = "Paused";
      if (gameOver) msg = "Game Over";
  
      ctx.fillText(msg, canvas.width / 2, canvas.height / 2 - 10);
  
      ctx.font = "500 14px ui-sans-serif, system-ui";
      const hint = paused ? "Press P to resume" : (gameOver ? "Press R to restart" : "Use Arrow Keys / Space");
      ctx.fillStyle = "rgba(255,255,255,0.70)";
      ctx.fillText(hint, canvas.width / 2, canvas.height / 2 + 22);
  
      ctx.restore();
    }
  
    function render() {
      drawGrid();
      drawBoard();
      if (running && !paused && !gameOver) drawGhost();
      if (running && !paused && !gameOver) drawCurrent();
      drawOverlay();
    }
  
    // ===== Main Loop =====
    function update(time = 0) {
      const delta = time - lastTime;
      lastTime = time;
  
      if (running && !paused && !gameOver) {
        dropCounter += delta;
  
        // If holding soft drop, speed it up
        const interval = softDropHeld ? 45 : dropInterval;
        if (dropCounter > interval) {
          if (softDropHeld) softDropStep();
          else tickDrop();
          dropCounter = 0;
        }
      }
  
      render();
      requestAnimationFrame(update);
    }
  
    // ===== Input =====
    window.addEventListener("keydown", (e) => {
      const key = e.key;
  
      if (key === "r" || key === "R") {
        resetGame();
        return;
      }
      if (key === "p" || key === "P") {
        if (!running || gameOver) return;
        paused = !paused;
        setStatus(paused ? "Paused" : "Playing");
        return;
      }
  
      if (!running || paused || gameOver) return;
  
      if (key === "ArrowLeft") {
        move(-1);
      } else if (key === "ArrowRight") {
        move(1);
      } else if (key === "ArrowDown") {
        softDropHeld = true;
      } else if (key === "ArrowUp") {
        rotatePiece(1);
      } else if (key === " ") {
        e.preventDefault();
        hardDrop();
      }
    });
  
    window.addEventListener("keyup", (e) => {
      if (e.key === "ArrowDown") softDropHeld = false;
    });
  
    // Buttons
    btnStart.addEventListener("click", () => resetGame());
    btnPause.addEventListener("click", () => {
      if (!running || gameOver) return;
      paused = !paused;
      setStatus(paused ? "Paused" : "Playing");
    });
  
    // Init
    renderHUD();
    setStatus("Press R to start");
    render();
    requestAnimationFrame(update);
  })();
  