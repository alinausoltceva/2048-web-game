// Game settings

const BOARD_SIZE = 4;

let board = [];
let score = 0;


const gameBoard = document.getElementById('game-board');
const scoreElement = document.getElementById('score');
const bestScoreElement = document.getElementById('best-score');

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

// Merge tiles in one line

function mergeLine(line) {
    const tiles = line.filter(value => value !== 0);
    const mergedLine = [];

    for (let i = 0; i < tiles.length; i++) {
        if (tiles[i] === tiles[i + 1]) {
            mergedLine.push(tiles[i] * 2);
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

// Move tiles

function moveTiles(direction) {
    let moved = false;

    if (direction === 'left' || direction === 'right') {
        moved = moveHorizontal(direction);
    } else if (direction === 'up' || direction === 'down') {
        moved = moveVertical(direction);
    } else {
        return false;
    }

    if (moved) {
        renderBoard();
    }

    return moved;
}

// Start new game

function startGame() {
    score = 0;

    createBoard();

    const initialTilesCount = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < initialTilesCount; i++) {
        spawnTile();
    }

    updateScore();
    renderBoard();
}

startGame();
