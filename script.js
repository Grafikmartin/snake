// script.js - Snake Spiel Logik

document.addEventListener("DOMContentLoaded", () => {
    console.log("Snake Spiel initialisiert.");

    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const gameContainer = document.getElementById("game-container");

    const currentScoreEl = document.getElementById("current-score");
    const highscoreEl = document.getElementById("highscore");
    const fullscreenBtn = document.getElementById("fullscreen-btn");
    const exitFullscreenBtn = document.getElementById("exit-fullscreen-btn");
    const pauseBtn = document.getElementById("pause-btn");
    const resumeBtn = document.getElementById("resume-btn");

    let gridSize = 20; // Größe jeder Zelle im Raster
    let tileCountX, tileCountY; // Anzahl der Zellen in X- und Y-Richtung

    let snake = [{ x: 10, y: 10 }]; // Startposition der Schlange
    let food = { x: 15, y: 15 }; // Startposition des Essens
    let velocity = { x: 0, y: 0 }; // Bewegungsrichtung der Schlange
    let score = 0;
    let highscore = localStorage.getItem("snakeHighscore") || 0;
    let gameInterval;
    let gameSpeed = 150; // Millisekunden pro Frame (langsamer = einfacher)
    let isPaused = false;
    let isGameOver = false;

    // Touch control variables
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    const minSwipeDistance = 30; // Mindestdistanz für einen Swipe

    currentScoreEl.textContent = score;
    highscoreEl.textContent = highscore;

    function resizeCanvas() {
        const containerWidth = gameContainer.clientWidth - 40; // Berücksichtige Padding
        const containerHeight = window.innerHeight * 0.55; // Nutze 55% der Viewport Höhe für Canvas

        tileCountX = Math.floor(containerWidth / gridSize);
        tileCountY = Math.floor(containerHeight / gridSize);

        canvas.width = tileCountX * gridSize;
        canvas.height = tileCountY * gridSize;
        
        canvas.style.marginLeft = `${(containerWidth - canvas.width) / 2}px`;

        if (!isPaused && gameInterval) {
            drawGame();
        }
    }

    window.addEventListener("resize", () => {
        const wasPaused = isPaused;
        if (gameInterval && !isPaused) {
            pauseGame();
        }
        resizeCanvas();
        if (gameInterval && !wasPaused) {
            if (!isGameOver) resumeGame();
            else drawGameOver();
        }
        if (!gameInterval) {
            drawGame();
        }
    });

    function initGame() {
        snake = [{ x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2) }];
        velocity = { x: 0, y: 0 }; // Wichtig: Velocity zurücksetzen, damit das Spiel nicht sofort startet
        score = 0;
        currentScoreEl.textContent = score;
        isGameOver = false;
        isPaused = false;
        resumeBtn.style.display = "none";
        pauseBtn.style.display = "inline-flex";
        placeFood();
        if (gameInterval) clearInterval(gameInterval);
        // Spiel startet erst durch Nutzereingabe (Tastatur oder Swipe)
        // gameInterval = setInterval(gameLoop, gameSpeed); 
        drawGame();
        if (velocity.x === 0 && velocity.y === 0) { // Nur wenn das Spiel noch nicht durch eine Eingabe gestartet wurde
            ctx.font = "20px Arial";
            ctx.fillStyle = "black";
            ctx.textAlign = "center";
            ctx.fillText("Wischen zum Starten", canvas.width / 2, canvas.height / 2);
        }
    }
    
    function startGameLoop() {
        if (!gameInterval && !isGameOver) {
            gameInterval = setInterval(gameLoop, gameSpeed);
        }
    }

    function placeFood() {
        food.x = Math.floor(Math.random() * tileCountX);
        food.y = Math.floor(Math.random() * tileCountY);
        for (let segment of snake) {
            if (segment.x === food.x && segment.y === food.y) {
                placeFood();
                return;
            }
        }
    }

    function drawGame() {
        if (isPaused || isGameOver && !gameInterval) return; // Verhindere Zeichnen wenn pausiert oder Game Over und Intervall gestoppt

        ctx.fillStyle = "#eee";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "green";
        snake.forEach(segment => {
            ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 1, gridSize - 1);
        });

        ctx.fillStyle = "red";
        ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 1, gridSize - 1);
    }
    
    function drawGameOver() {
        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = "30px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = "20px Arial";
        ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText("Zum Neustarten tippen/klicken", canvas.width / 2, canvas.height / 2 + 50);
    }

    function updateGame() {
        if (isPaused || isGameOver) return;
        if (velocity.x === 0 && velocity.y === 0) return; // Spiel nicht updaten, wenn keine Bewegung

        const head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };

        if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) {
            gameOver();
            return;
        }

        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                gameOver();
                return;
            }
        }

        snake.unshift(head);

        if (head.x === food.x && head.y === food.y) {
            score++;
            currentScoreEl.textContent = score;
            if (score > highscore) {
                highscore = score;
                highscoreEl.textContent = highscore;
                localStorage.setItem("snakeHighscore", highscore);
            }
            placeFood();
        } else {
            snake.pop();
        }
    }

    function gameLoop() {
        if (isGameOver) return;
        updateGame();
        if (!isGameOver) drawGame();
    }

    function gameOver() {
        isGameOver = true;
        clearInterval(gameInterval);
        gameInterval = null;
        drawGameOver();
    }

    document.addEventListener("keydown", e => {
        if (isGameOver) return;
        let newVelocitySet = false;
        switch (e.key) {
            case "ArrowUp":
                if (velocity.y === 0) { velocity = { x: 0, y: -1 }; newVelocitySet = true; }
                break;
            case "ArrowDown":
                if (velocity.y === 0) { velocity = { x: 0, y: 1 }; newVelocitySet = true; }
                break;
            case "ArrowLeft":
                if (velocity.x === 0) { velocity = { x: -1, y: 0 }; newVelocitySet = true; }
                break;
            case "ArrowRight":
                if (velocity.x === 0) { velocity = { x: 1, y: 0 }; newVelocitySet = true; }
                break;
            case " ": case "p": case "P":
                togglePause();
                break;
        }
        if (newVelocitySet && !gameInterval && !isGameOver) {
            isPaused = false;
            startGameLoop();
        }
    });
    
    canvas.addEventListener("click", () => {
        if (isGameOver) {
            initGame();
        }
    });

    // Touch Controls
    canvas.addEventListener("touchstart", e => {
        e.preventDefault(); // Verhindert Scrollen etc.
        if (isGameOver) return;
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: false });

    canvas.addEventListener("touchend", e => {
        e.preventDefault();
        if (isGameOver) {
             // Erlaube Neustart durch Tap auch bei Game Over
            initGame();
            return;
        }
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }, { passive: false });

    function handleSwipe() {
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        let newVelocitySet = false;

        if (Math.abs(deltaX) > Math.abs(deltaY)) { // Horizontaler Swipe
            if (Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0 && velocity.x === 0) { // Rechts
                    velocity = { x: 1, y: 0 };
                    newVelocitySet = true;
                } else if (deltaX < 0 && velocity.x === 0) { // Links
                    velocity = { x: -1, y: 0 };
                    newVelocitySet = true;
                }
            }
        } else { // Vertikaler Swipe
            if (Math.abs(deltaY) > minSwipeDistance) {
                if (deltaY > 0 && velocity.y === 0) { // Runter
                    velocity = { x: 0, y: 1 };
                    newVelocitySet = true;
                } else if (deltaY < 0 && velocity.y === 0) { // Hoch
                    velocity = { x: 0, y: -1 };
                    newVelocitySet = true;
                }
            }
        }
        if (newVelocitySet && !gameInterval && !isGameOver) {
            isPaused = false;
            startGameLoop();
        }
    }

    fullscreenBtn.addEventListener("click", () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            gameContainer.requestFullscreen().catch(err => {
                alert(`Vollbildfehler: ${err.message} (${err.name})`);
            });
        }
    });

    document.addEventListener("fullscreenchange", () => {
        if (document.fullscreenElement) {
            fullscreenBtn.style.display = "none";
            exitFullscreenBtn.style.display = "inline-flex";
        } else {
            fullscreenBtn.style.display = "inline-flex";
            exitFullscreenBtn.style.display = "none";
        }
        resizeCanvas();
    });
    exitFullscreenBtn.addEventListener("click", () => {
         if (document.fullscreenElement) {
            document.exitFullscreen();
        }
    });

    function pauseGame() {
        if (!isGameOver && gameInterval) { // Nur pausieren, wenn das Spiel läuft
            isPaused = true;
            clearInterval(gameInterval);
            gameInterval = null;
            pauseBtn.style.display = "none";
            resumeBtn.style.display = "inline-flex";
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.fillRect(0,0, canvas.width, canvas.height);
            ctx.font = "30px Arial";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText("Pausiert", canvas.width / 2, canvas.height / 2);
        }
    }

    function resumeGame() {
        if (!isGameOver && isPaused) { // Nur fortsetzen, wenn pausiert
            isPaused = false;
            startGameLoop(); // Starte den Loop wieder
            resumeBtn.style.display = "none";
            pauseBtn.style.display = "inline-flex";
            gameLoop(); 
        }
    }
    
    function togglePause() {
        if (isGameOver) return;
        if (isPaused) {
            resumeGame();
        } else {
            if (velocity.x !== 0 || velocity.y !== 0) { 
                 pauseGame();
            }
        }
    }

    pauseBtn.addEventListener("click", togglePause); // Geändert zu togglePause
    resumeBtn.addEventListener("click", togglePause); // Geändert zu togglePause

    resizeCanvas();
    initGame(); // Ruft initGame auf, das die Startnachricht anzeigt

});

