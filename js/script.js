// Game settings

const BOARD_SIZE = 4;
const STORAGE_KEY = '2048-game-state';
let board = [];
let score = 0;
let isGameOver = false;
let undoState = null;


const gameBoard = document.getElementById('game-board');
const scoreElement = document.getElementById('score');
const bestScoreElement = document.getElementById('best-score');

const newGameButton = document.getElementById('new-game-button');
const undoButton = document.getElementById('undo-button');
const mobileControls = document.getElementById('mobile-controls');

const gameOverElement = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');


function createBoard() {
    board = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
        board.push([0, 0, 0, 0]);
    }
}

// Board rendering
function renderBoard() {
    gameBoard.innerHTML = '';

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const tile = document.createElement('div');
            const value = board[row][col];

            tile.classList.add('tile');

            if (value !== 0) {
                tile.textContent = value;
                tile.classList.add(`tile-${value}`);
            }

            gameBoard.appendChild(tile);
        }
    }
}

// Random tile spawning
function spawnTile() {
    const emptyCells = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === 0) {
                emptyCells.push({ row, col });
            }
        }
    }

    if (emptyCells.length === 0) {
        return;
    }

    const randomCell = emptyCells[
        Math.floor(Math.random() * emptyCells.length)
    ];

    const value = Math.random() < 0.9 ? 2 : 4;

    board[randomCell.row][randomCell.col] = value;
}

// Update score

function updateScore() {
    scoreElement.textContent = score;
}

// Update undo button

function updateUndoButton() {
    undoButton.disabled = !undoState || isGameOver;
}

// Game over check
function canMove() {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === 0) {
                return true;
            }

            if (
                col < BOARD_SIZE - 1 &&
                board[row][col] === board[row][col + 1]
            ) {
                return true;
            }

            if (
                row < BOARD_SIZE - 1 &&
                board[row][col] === board[row + 1][col]
            ) {
                return true;
            }
        }
    }

    return false;
}

// Game over
function endGame() {
    isGameOver = true;
    undoState = null;

    finalScoreElement.textContent = score;
    gameOverElement.hidden = false;
    mobileControls.hidden = true;

    updateUndoButton();
    saveGame();
}

// Merge tiles in one line

function mergeLine(line) {
    const tiles = line.filter(value => value !== 0);
    const mergedLine = [];

    for (let i = 0; i < tiles.length; i++) {
        if (tiles[i] === tiles[i + 1]) {
            const mergedValue = tiles[i] * 2;

            mergedLine.push(mergedValue);
            score += mergedValue;

            i++;
        } else {
            mergedLine.push(tiles[i]);
        }
    }

    while (mergedLine.length < BOARD_SIZE) {
        mergedLine.push(0);
    }

    return mergedLine;
}

// Move tiles horizontally 

function moveHorizontal(direction) {
    let moved = false;

    for (let row = 0; row < BOARD_SIZE; row++) {
        const originalLine = [...board[row]];

        if (direction === 'left') {
            board[row] = mergeLine(board[row]);
        } else {
            board[row] = mergeLine([...board[row]].reverse()).reverse();
        }

        if (originalLine.join(',') !== board[row].join(',')) {
            moved = true;
        }
    }

    return moved;
}

// Move tiles vertically

function moveVertical(direction) {
    let moved = false;

    for (let col = 0; col < BOARD_SIZE; col++) {
        const originalLine = [];

        for (let row = 0; row < BOARD_SIZE; row++) {
            originalLine.push(board[row][col]);
        }

        let newLine;

        if (direction === 'up') {
            newLine = mergeLine(originalLine);
        } else {
            newLine = mergeLine([...originalLine].reverse()).reverse();
        }

        for (let row = 0; row < BOARD_SIZE; row++) {
            if (board[row][col] !== newLine[row]) {
                moved = true;
            }

            board[row][col] = newLine[row];
        }
    }

    return moved;
}

// Move tiles

function moveTiles(direction) {
    if (isGameOver) {
        return;
    }

    const previousState = {
        board: board.map(row => [...row]),
        score: score
    };

    let moved = false;

    if (direction === 'left' || direction === 'right') {
        moved = moveHorizontal(direction);
    } else if (direction === 'up' || direction === 'down') {
        moved = moveVertical(direction);
    }

    if (!moved) {
        return;
    }

    undoState = previousState;

    const newTilesCount = Math.floor(Math.random() * 2) + 1;

    for (let i = 0; i < newTilesCount; i++) {
        spawnTile();
    }

    updateScore();
    renderBoard();

    if (!canMove()) {
        endGame();
    } else {
        updateUndoButton();
        saveGame();
    }
}

// Undo last move

function undoMove() {
    if (!undoState || isGameOver) {
        return;
    }

    board = undoState.board.map(row => [...row]);
    score = undoState.score;

    undoState = null;

    updateScore();
    renderBoard();
    updateUndoButton();
    saveGame();
}

// Start new game
function startGame() {
    score = 0;
    isGameOver = false;
    undoState = null;

    gameOverElement.hidden = true;
    mobileControls.hidden = false;

    createBoard();

    const initialTilesCount = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < initialTilesCount; i++) {
        spawnTile();
    }

    updateScore();
    renderBoard();
    updateUndoButton();

    saveGame();
}

// Save game to localStorage
function saveGame() {
    const gameState = {
        board: board,
        score: score,
        isGameOver: isGameOver,
        undoState: undoState
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
}

// Load game from localStorage
function loadGame() {
    const savedGame = localStorage.getItem(STORAGE_KEY);

    if (!savedGame) {
        return false;
    }

    try {
        const gameState = JSON.parse(savedGame);

        if (
            !Array.isArray(gameState.board) ||
            gameState.board.length !== BOARD_SIZE ||
            !gameState.board.every(
                row => Array.isArray(row) &&
                    row.length === BOARD_SIZE &&
                    row.every(value =>
                        Number.isInteger(value) && value >= 0
                    )
            ) ||
            !Number.isFinite(gameState.score) ||
            gameState.score < 0 ||
            typeof gameState.isGameOver !== 'boolean'
        ) {
            return false;
        }

        board = gameState.board.map(row => [...row]);
        score = gameState.score;
        isGameOver = gameState.isGameOver;

        if (
            gameState.undoState &&
            Array.isArray(gameState.undoState.board) &&
            gameState.undoState.board.length === BOARD_SIZE &&
            gameState.undoState.board.every(
                row => Array.isArray(row) &&
                    row.length === BOARD_SIZE &&
                    row.every(value =>
                        Number.isInteger(value) && value >= 0
                    )
            ) &&
            Number.isFinite(gameState.undoState.score) &&
            gameState.undoState.score >= 0
        ) {
            undoState = {
                board: gameState.undoState.board.map(row => [...row]),
                score: gameState.undoState.score
            };
        } else {
            undoState = null;
        }

        updateScore();
        renderBoard();

        if (isGameOver) {
            finalScoreElement.textContent = score;
            gameOverElement.hidden = false;
            mobileControls.hidden = true;
        } else {
            gameOverElement.hidden = true;
            mobileControls.hidden = false;
        }

        updateUndoButton();

        return true;
    } catch (error) {
        return false;
    }
}

// Keyboard controls

document.addEventListener('keydown', (event) => {
    const directions = {
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ArrowUp: 'up',
        ArrowDown: 'down'
    };

    const direction = directions[event.key];

    if (!direction || isGameOver) {
        return;
    }

    if (event.target.matches('input, textarea')) {
        return;
    }

    event.preventDefault();

    moveTiles(direction);
});

// Mobile controls

mobileControls.addEventListener('click', (event) => {
    const button = event.target.closest('.direction-button');

    if (!button) {
        return;
    }

    const direction = button.dataset.direction;

    moveTiles(direction);
});

// Button event listeners
undoButton.addEventListener('click', undoMove);
newGameButton.addEventListener('click', startGame);

document.getElementById('restart-button')
    .addEventListener('click', startGame);

// Initialize game
if (!loadGame()) {
    startGame();
}