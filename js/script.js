// Game settings

const BOARD_SIZE = 4;

let board = [];
let score = 0;
let isGameOver = false;
let undoState = null;


const gameBoard = document.getElementById('game-board');
const scoreElement = document.getElementById('score');
const bestScoreElement = document.getElementById('best-score');
const gameOverElement = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const mobileControls = document.getElementById('mobile-controls');
const undoButton = document.getElementById('undo-button');

function createBoard() {
    gameBoard.innerHTML = '';

    board = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
        const boardRow = [];

        for (let col = 0; col < BOARD_SIZE; col++) {
            const tile = document.createElement('div');

            tile.classList.add('tile');
            tile.setAttribute('role', 'gridcell');

            gameBoard.appendChild(tile);
            boardRow.push(0);
        }

        board.push(boardRow);
    }
}

// Render game board

function renderBoard() {
    const tiles = gameBoard.children;

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const tile = tiles[row * BOARD_SIZE + col];
            const value = board[row][col];

            tile.className = 'tile';
            tile.textContent = '';

            if (value !== 0) {
                tile.classList.add(`tile-${value}`);
                tile.textContent = value;
                tile.setAttribute('aria-label', `Плитка ${value}`);
            } else {
                tile.setAttribute('aria-label', 'Пустая клетка');
            }
        }
    }
}

// Generate random tile

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

        let line = [...originalLine];

        if (direction === 'right') {
            line.reverse();
        }

        line = mergeLine(line);

        if (direction === 'right') {
            line.reverse();
        }

        if (line.some((value, index) => value !== originalLine[index])) {
            moved = true;
        }

        board[row] = line;
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

        let line = [...originalLine];

        if (direction === 'down') {
            line.reverse();
        }

        line = mergeLine(line);

        if (direction === 'down') {
            line.reverse();
        }

        if (line.some((value, index) => value !== originalLine[index])) {
            moved = true;
        }

        for (let row = 0; row < BOARD_SIZE; row++) {
            board[row][col] = line[row];
        }
    }

    return moved;
}

// Check available moves

function canMove() {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const currentTile = board[row][col];

            if (currentTile === 0) {
                return true;
            }

            if (
                col < BOARD_SIZE - 1 &&
                currentTile === board[row][col + 1]
            ) {
                return true;
            }

            if (
                row < BOARD_SIZE - 1 &&
                currentTile === board[row + 1][col]
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
}

// Move tiles

function moveTiles(direction) {
    if (isGameOver) {
        return false;
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
    } else {
        return false;
    }

    if (moved) {
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
        }
    }

    return moved;
}

// Undo last move

function undoMove() {
    if (isGameOver || !undoState) {
        return;
    }

    board = undoState.board.map(row => [...row]);
    score = undoState.score;

    undoState = null;

    updateScore();
    renderBoard();
    updateUndoButton();
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

// Undo button

undoButton.addEventListener('click', undoMove);

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
}

startGame();
