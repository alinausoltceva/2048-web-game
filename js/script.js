// Game settings

const BOARD_SIZE = 4;
const STORAGE_KEY = '2048-game-state';
const LEADERBOARD_STORAGE_KEY = '2048-leaderboard';
const BEST_SCORE_STORAGE_KEY = '2048-best-score';

let board = [];
let score = 0;
let isGameOver = false;
let undoState = null;
let tileCells = [];

const gameBoard = document.getElementById('game-board');
const scoreElement = document.getElementById('score');
const bestScoreElement = document.getElementById('best-score');

const newGameButton = document.getElementById('new-game-button');
const undoButton = document.getElementById('undo-button');
const mobileControls = document.getElementById('mobile-controls');

const gameOverElement = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');

const gameOverMessageElement = document.getElementById('game-over-message');
const recordForm = document.getElementById('record-form');
const playerNameInput = document.getElementById('player-name');

const leaderboardElement = document.getElementById('leaderboard');
const leaderboardBody = document.getElementById('leaderboard-body');
const leaderboardButton = document.getElementById('leaderboard-button');
const closeLeaderboardButton = document.getElementById('close-leaderboard-button');

function createBoard() {
    board = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
        board.push([0, 0, 0, 0]);
    }
}

// Board rendering
function renderBoard(animation = null) {
    if (tileCells.length === 0) {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const tile = document.createElement('div');

                tile.classList.add('tile');

                gameBoard.appendChild(tile);
                tileCells.push(tile);
            }
        }
    }

    // Update existing cells
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const index = row * BOARD_SIZE + col;
            const tile = tileCells[index];
            const value = board[row][col];

            tile.className = 'tile';
            tile.textContent = value === 0 ? '' : value;

            if (value !== 0) {
                tile.classList.add(`tile-${value}`);

                if (animation) {
                    const position = `${row}-${col}`;

                    if (animation.newPositions.includes(position)) {
                        tile.classList.add('tile-new');
                    } else if (animation.mergedPositions.includes(position)) {
                        tile.classList.add('tile-merged');
                    }
                }
            }
        }
    }

    // Animate tile movement
    if (animation) {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const position = `${row}-${col}`;
                const index = row * BOARD_SIZE + col;
                const tile = tileCells[index];

                if (
                    board[row][col] === 0 ||
                    animation.newPositions.includes(position)
                ) {
                    continue;
                }

                const sourcePosition = animation.moveSources[position];

                if (!sourcePosition) {
                    continue;
                }

                const [sourceRow, sourceCol] = sourcePosition
                    .split('-')
                    .map(Number);

                const sourceIndex = sourceRow * BOARD_SIZE + sourceCol;
                const sourceTile = tileCells[sourceIndex];

                const sourceRect = sourceTile.getBoundingClientRect();
                const targetRect = tile.getBoundingClientRect();

                const deltaX = sourceRect.left - targetRect.left;
                const deltaY = sourceRect.top - targetRect.top;

                if (deltaX === 0 && deltaY === 0) {
                    continue;
                }

                tile.animate(
                    [
                        {
                            transform: `translate(${deltaX}px, ${deltaY}px)`
                        },
                        {
                            transform: 'translate(0, 0)'
                        }
                    ],
                    {
                        duration: 420,
                        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
                    }
                );
            }
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
    return randomCell;
}

// Update score

function updateScore() {
    scoreElement.textContent = score;

    let bestScore = Number(localStorage.getItem(BEST_SCORE_STORAGE_KEY)) || 0;

    if (score > bestScore) {
        bestScore = score;

        localStorage.setItem(
            BEST_SCORE_STORAGE_KEY,
            bestScore
        );
    }

    bestScoreElement.textContent = bestScore;
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


// Find merged tile positions
function getMergedPositions(previousBoard, direction) {
    const mergedPositions = [];

    for (let line = 0; line < BOARD_SIZE; line++) {
        const tiles = [];

        for (let position = 0; position < BOARD_SIZE; position++) {
            let row;
            let col;

            if (direction === 'left' || direction === 'right') {
                row = line;
                col = direction === 'left'
                    ? position
                    : BOARD_SIZE - 1 - position;
            } else {
                row = direction === 'up'
                    ? position
                    : BOARD_SIZE - 1 - position;
                col = line;
            }

            const value = previousBoard[row][col];

            if (value !== 0) {
                tiles.push({ value });
            }
        }

        let targetPosition = 0;

        for (let i = 0; i < tiles.length; i++) {
            if (
                tiles[i].value === tiles[i + 1]?.value
            ) {
                let row;
                let col;

                if (direction === 'left' || direction === 'right') {
                    row = line;
                    col = direction === 'left'
                        ? targetPosition
                        : BOARD_SIZE - 1 - targetPosition;
                } else {
                    row = direction === 'up'
                        ? targetPosition
                        : BOARD_SIZE - 1 - targetPosition;
                    col = line;
                }

                mergedPositions.push(`${row}-${col}`);

                i++;
            }

            targetPosition++;
        }
    }

    return mergedPositions;
}

// Find source positions of moved tiles
function getMoveSources(previousBoard, direction) {
    const moveSources = {};

    for (let line = 0; line < BOARD_SIZE; line++) {
        const tiles = [];

        for (let position = 0; position < BOARD_SIZE; position++) {
            let row;
            let col;

            if (direction === 'left' || direction === 'right') {
                row = line;
                col = direction === 'left'
                    ? position
                    : BOARD_SIZE - 1 - position;
            } else {
                row = direction === 'up'
                    ? position
                    : BOARD_SIZE - 1 - position;
                col = line;
            }

            const value = previousBoard[row][col];

            if (value !== 0) {
                tiles.push({
                    row: row,
                    col: col,
                    value: value
                });
            }
        }

        let targetPosition = 0;

        for (let i = 0; i < tiles.length; i++) {
            const sourceTile = tiles[i];

            let targetRow;
            let targetCol;

            if (direction === 'left' || direction === 'right') {
                targetRow = line;
                targetCol = direction === 'left'
                    ? targetPosition
                    : BOARD_SIZE - 1 - targetPosition;
            } else {
                targetRow = direction === 'up'
                    ? targetPosition
                    : BOARD_SIZE - 1 - targetPosition;
                targetCol = line;
            }

            const targetKey = `${targetRow}-${targetCol}`;
            const sourceKey = `${sourceTile.row}-${sourceTile.col}`;

            moveSources[targetKey] = sourceKey;

            if (sourceTile.value === tiles[i + 1]?.value) {
                i++;
            }

            targetPosition++;
        }
    }

    return moveSources;
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

    const mergedPositions = getMergedPositions(
        previousState.board,
        direction
    );

    const moveSources = getMoveSources(
        previousState.board,
        direction
    );

    undoState = previousState;

    const newPositions = [];
    const newTilesCount = Math.floor(Math.random() * 2) + 1;

    for (let i = 0; i < newTilesCount; i++) {
        const newTile = spawnTile();

        if (newTile) {
            newPositions.push(`${newTile.row}-${newTile.col}`);
        }
    }

    updateScore();

    renderBoard({
        moveSources: moveSources,
        mergedPositions: mergedPositions,
        newPositions: newPositions
    });

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

    recordForm.hidden = false;
    gameOverMessageElement.textContent = 'Игра окончена!';
    playerNameInput.value = '';

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

// Load leaderboard from localStorage
function loadLeaderboard() {
    const savedLeaderboard = localStorage.getItem(LEADERBOARD_STORAGE_KEY);

    if (!savedLeaderboard) {
        return [];
    }

    try {
        const records = JSON.parse(savedLeaderboard);

        if (!Array.isArray(records)) {
            return [];
        }

        return records.filter(record =>
            record &&
            typeof record.name === 'string' &&
            Number.isFinite(record.score) &&
            typeof record.date === 'string'
        );
    } catch (error) {
        return [];
    }
}

// Render leaderboard
function renderLeaderboard() {
    const records = loadLeaderboard()
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

    while (leaderboardBody.firstChild) {
        leaderboardBody.removeChild(leaderboardBody.firstChild);
    }

    if (records.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');

        cell.colSpan = 4;
        cell.textContent = 'Пока нет рекордов';

        row.appendChild(cell);
        leaderboardBody.appendChild(row);

        return;
    }

    records.forEach((record, index) => {
        const row = document.createElement('tr');

        const placeCell = document.createElement('td');
        const nameCell = document.createElement('td');
        const scoreCell = document.createElement('td');
        const dateCell = document.createElement('td');

        placeCell.textContent = index + 1;
        nameCell.textContent = record.name;
        scoreCell.textContent = record.score;
        dateCell.textContent = new Date(record.date).toLocaleDateString('ru-RU');

        row.appendChild(placeCell);
        row.appendChild(nameCell);
        row.appendChild(scoreCell);
        row.appendChild(dateCell);

        leaderboardBody.appendChild(row);
    });
}

// Save record
function saveRecord(event) {
    event.preventDefault();

    const name = playerNameInput.value.trim();

    if (!name) {
        return;
    }

    const records = loadLeaderboard();

    records.push({
        name: name,
        score: score,
        date: new Date().toISOString()
    });

    records.sort((a, b) => b.score - a.score);

    const topRecords = records.slice(0, 10);

    localStorage.setItem(
        LEADERBOARD_STORAGE_KEY,
        JSON.stringify(topRecords)
    );

    renderLeaderboard();

    recordForm.hidden = true;
    gameOverMessageElement.textContent = 'Ваш рекорд сохранен';
}

// Open and close leaderboard
function openLeaderboard() {
    renderLeaderboard();

    leaderboardElement.hidden = false;
    mobileControls.hidden = true;
}

function closeLeaderboard() {
    leaderboardElement.hidden = true;

    if (!isGameOver) {
        mobileControls.hidden = false;
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

leaderboardButton.addEventListener('click', openLeaderboard);
closeLeaderboardButton.addEventListener('click', closeLeaderboard);
recordForm.addEventListener('submit', saveRecord);

// Initialize game
if (!loadGame()) {
    startGame();
}

renderLeaderboard();
