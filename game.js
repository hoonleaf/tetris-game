// 게임 상수
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BASE_DROP_INTERVAL = 1000; // 기본 낙하 간격 (밀리초)
const SCORE_PER_LEVEL = 1000; // 레벨당 필요한 점수

// 백엔드 API 설정
const API_BASE_URL = 'http://127.0.0.1:8000';

// 테트로미노 블록 정의
const TETROMINOES = {
    I: {
        shape: [[1, 1, 1, 1]],
        color: 'I'
    },
    O: {
        shape: [
            [1, 1],
            [1, 1]
        ],
        color: 'O'
    },
    T: {
        shape: [
            [0, 1, 0],
            [1, 1, 1]
        ],
        color: 'T'
    },
    S: {
        shape: [
            [0, 1, 1],
            [1, 1, 0]
        ],
        color: 'S'
    },
    Z: {
        shape: [
            [1, 1, 0],
            [0, 1, 1]
        ],
        color: 'Z'
    },
    J: {
        shape: [
            [1, 0, 0],
            [1, 1, 1]
        ],
        color: 'J'
    },
    L: {
        shape: [
            [0, 0, 1],
            [1, 1, 1]
        ],
        color: 'L'
    }
};

// 게임 상태
let board = [];
let currentPiece = null;
let score = 0;
let level = 1;
let gameRunning = false;
let gamePaused = false;
let dropTimer = null;
let lastDropTime = 0;

// 인증/점수 상태
let accessToken = null;
let currentUserEmail = null;

// DOM 요소
const gameBoard = document.getElementById('gameBoard');
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const gameOverDiv = document.getElementById('gameOver');
const finalScoreDisplay = document.getElementById('finalScore');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const currentUserEmailSpan = document.getElementById('currentUserEmail');
const globalBestScoreSpan = document.getElementById('globalBestScore');

// 인증/점수 관련 함수
function updateAuthUI() {
    if (currentUserEmail) {
        currentUserEmailSpan.textContent = `로그인: ${currentUserEmail}`;
    } else {
        currentUserEmailSpan.textContent = '로그인되지 않음';
    }
}

async function registerUser(email, password) {
    try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            alert(data.detail || '회원가입에 실패했습니다.');
            return;
        }

        alert('회원가입이 완료되었습니다. 이제 로그인해 주세요.');
    } catch (err) {
        console.error(err);
        alert('회원가입 요청 중 오류가 발생했습니다.');
    }
}

async function loginUser(email, password) {
    try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            alert(data.detail || '로그인에 실패했습니다.');
            return;
        }

        const data = await res.json();
        accessToken = data.access_token;
        currentUserEmail = email;
        updateAuthUI();
        alert('로그인에 성공했습니다.');
    } catch (err) {
        console.error(err);
        alert('로그인 요청 중 오류가 발생했습니다.');
    }
}

async function submitScoreToServer(scoreValue) {
    if (!accessToken) {
        // 로그인하지 않은 경우 서버에 저장하지 않음
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/scores/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ score: scoreValue }),
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            console.warn('점수 전송 실패:', data.detail || res.statusText);
            return;
        }

        // 사용자 최고 점수는 필요하면 사용
        await res.json().catch(() => ({}));

        // 전역 최고 점수 갱신
        await fetchGlobalBestScore();
    } catch (err) {
        console.error(err);
    }
}

async function fetchGlobalBestScore() {
    try {
        const res = await fetch(`${API_BASE_URL}/scores/global-best`);
        if (!res.ok) {
            globalBestScoreSpan.textContent = '-';
            return;
        }
        const data = await res.json();
        if (data.best_score === null || data.best_score === undefined) {
            globalBestScoreSpan.textContent = '-';
        } else {
            globalBestScoreSpan.textContent = data.best_score;
        }
    } catch (err) {
        console.error(err);
        globalBestScoreSpan.textContent = '-';
    }
}

// 보드 초기화
function initBoard() {
    board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
    createBoardCells();
}

// 보드 셀 생성
function createBoardCells() {
    gameBoard.innerHTML = '';
    for (let row = 0; row < BOARD_HEIGHT; row++) {
        for (let col = 0; col < BOARD_WIDTH; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            gameBoard.appendChild(cell);
        }
    }
}

// 랜덤 블록 생성
function createPiece() {
    const types = Object.keys(TETROMINOES);
    const type = types[Math.floor(Math.random() * types.length)];
    const tetromino = TETROMINOES[type];
    
    return {
        shape: tetromino.shape.map(row => [...row]),
        x: Math.floor(BOARD_WIDTH / 2) - Math.floor(tetromino.shape[0].length / 2),
        y: 0,
        color: tetromino.color
    };
}

// 블록 회전
function rotatePiece(piece) {
    const rotated = piece.shape[0].map((_, i) =>
        piece.shape.map(row => row[i]).reverse()
    );
    return {
        ...piece,
        shape: rotated
    };
}

// 충돌 감지
function isCollision(piece, dx = 0, dy = 0) {
    const newX = piece.x + dx;
    const newY = piece.y + dy;
    
    for (let row = 0; row < piece.shape.length; row++) {
        for (let col = 0; col < piece.shape[row].length; col++) {
            if (piece.shape[row][col]) {
                const boardX = newX + col;
                const boardY = newY + row;
                
                // 벽 충돌
                if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
                    return true;
                }
                
                // 바닥 충돌은 이미 위에서 체크
                // 다른 블록과 충돌
                if (boardY >= 0 && board[boardY][boardX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

// 블록을 보드에 고정
function lockPiece() {
    for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
            if (currentPiece.shape[row][col]) {
                const boardX = currentPiece.x + col;
                const boardY = currentPiece.y + row;
                
                if (boardY >= 0) {
                    board[boardY][boardX] = currentPiece.color;
                }
            }
        }
    }
}

// 레벨에 따른 낙하 속도 계산
function getDropInterval() {
    // 레벨이 올라갈수록 속도가 빨라짐 (최소 50ms까지)
    return Math.max(50, BASE_DROP_INTERVAL - (level - 1) * 50);
}

// 레벨 업데이트 (점수 기반)
function updateLevel() {
    // 점수 기반으로 레벨 계산: 1000점마다 레벨 1 증가
    const newLevel = Math.floor(score / SCORE_PER_LEVEL) + 1;
    
    if (newLevel > level) {
        level = newLevel;
        levelDisplay.textContent = level;
    }
}

// 가득 찬 줄 찾기 및 제거
function clearLines() {
    let linesCleared = 0;
    
    for (let row = BOARD_HEIGHT - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== 0)) {
            board.splice(row, 1);
            board.unshift(Array(BOARD_WIDTH).fill(0));
            linesCleared++;
            row++; // 같은 줄 다시 체크
        }
    }
    
    // 점수 계산
    if (linesCleared > 0) {
        const points = [0, 100, 300, 500, 800];
        score += points[linesCleared] || 0;
        scoreDisplay.textContent = score;
        
        // 레벨 업데이트 (점수 기반)
        updateLevel();
    }
}

// 게임 오버 체크
function isGameOver() {
    if (!currentPiece) return false;
    
    return isCollision(currentPiece, 0, 0);
}

// 보드 렌더링
function render() {
    // 보드 초기화
    const cells = gameBoard.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.classList.remove('filled');
        cell.className = 'cell';
    });
    
    // 고정된 블록 렌더링
    for (let row = 0; row < BOARD_HEIGHT; row++) {
        for (let col = 0; col < BOARD_WIDTH; col++) {
            if (board[row][col]) {
                const cell = gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (cell) {
                    cell.classList.add('filled', `color-${board[row][col]}`);
                }
            }
        }
    }
    
    // 현재 블록 렌더링
    if (currentPiece) {
        for (let row = 0; row < currentPiece.shape.length; row++) {
            for (let col = 0; col < currentPiece.shape[row].length; col++) {
                if (currentPiece.shape[row][col]) {
                    const boardX = currentPiece.x + col;
                    const boardY = currentPiece.y + row;
                    
                    if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
                        const cell = gameBoard.querySelector(`[data-row="${boardY}"][data-col="${boardX}"]`);
                        if (cell) {
                            cell.classList.add('filled', `color-${currentPiece.color}`);
                        }
                    }
                }
            }
        }
    }
}

// 블록 이동
function movePiece(dx, dy) {
    if (!currentPiece || !gameRunning || gamePaused) return;
    
    if (!isCollision(currentPiece, dx, dy)) {
        currentPiece.x += dx;
        currentPiece.y += dy;
        render();
        return true;
    }
    return false;
}

// 블록 회전
function rotateCurrentPiece() {
    if (!currentPiece || !gameRunning || gamePaused) return;
    
    const rotated = rotatePiece(currentPiece);
    if (!isCollision(rotated, 0, 0)) {
        currentPiece = rotated;
        render();
    } else {
        // 벽 킥 (wall kick) - 좌우로 이동해보면서 회전 시도
        for (let offset of [-1, 1, -2, 2]) {
            if (!isCollision(rotated, offset, 0)) {
                currentPiece = rotated;
                currentPiece.x += offset;
                render();
                return;
            }
        }
    }
}

// 블록 즉시 낙하
function hardDrop() {
    if (!currentPiece || !gameRunning || gamePaused) return;
    
    while (movePiece(0, 1)) {
        // 계속 낙하
    }
    
    lockPiece();
    clearLines();
    spawnNewPiece();
}

// 새 블록 생성
function spawnNewPiece() {
    currentPiece = createPiece();
    
    if (isGameOver()) {
        endGame();
    } else {
        render();
    }
}

// 게임 루프
function gameLoop(currentTime) {
    if (!gameRunning || gamePaused) return;
    
    const dropInterval = getDropInterval();
    
    if (currentTime - lastDropTime >= dropInterval) {
        if (!movePiece(0, 1)) {
            // 더 이상 내려갈 수 없으면 고정
            lockPiece();
            clearLines();
            spawnNewPiece();
        }
        lastDropTime = currentTime;
    }
    
    requestAnimationFrame(gameLoop);
}

// 게임 시작
function startGame() {
    initBoard();
    score = 0;
    level = 1;
    scoreDisplay.textContent = score;
    levelDisplay.textContent = level;
    gameRunning = true;
    gamePaused = false;
    gameOverDiv.classList.add('hidden');
    
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    
    spawnNewPiece();
    lastDropTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// 게임 일시정지
function pauseGame() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    pauseBtn.textContent = gamePaused ? '재개' : '일시정지';
    
    if (!gamePaused) {
        lastDropTime = performance.now();
        requestAnimationFrame(gameLoop);
    }
}

// 게임 종료
function endGame() {
    gameRunning = false;
    gamePaused = false;
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = '일시정지';
    
    finalScoreDisplay.textContent = score;
    gameOverDiv.classList.remove('hidden');

    // 로그인된 경우 서버에 점수 전송
    submitScoreToServer(score);
}

// 키보드 이벤트
document.addEventListener('keydown', (e) => {
    if (!gameRunning || gamePaused) return;
    
    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            movePiece(-1, 0);
            break;
        case 'ArrowRight':
            e.preventDefault();
            movePiece(1, 0);
            break;
        case 'ArrowDown':
            e.preventDefault();
            movePiece(0, 1);
            break;
        case 'ArrowUp':
            e.preventDefault();
            rotateCurrentPiece();
            break;
        case ' ':
            e.preventDefault();
            hardDrop();
            break;
    }
});

// 버튼 이벤트
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', pauseGame);
restartBtn.addEventListener('click', () => {
    gameOverDiv.classList.add('hidden');
    startGame();
});

registerBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!email || !password) {
        alert('이메일과 비밀번호를 모두 입력해 주세요.');
        return;
    }
    registerUser(email, password);
});

loginBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!email || !password) {
        alert('이메일과 비밀번호를 모두 입력해 주세요.');
        return;
    }
    loginUser(email, password);
});

// 초기화
initBoard();
updateAuthUI();
fetchGlobalBestScore();