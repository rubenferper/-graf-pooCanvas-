
"use strict";

// Configuracion del Canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Clase Ball: representa cada pelota
class Ball {
    constructor(x, y, radius, speedX, speedY, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speedX = speedX;
        this.speedY = speedY;
        this.color = color;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(
            this.x,
            this.y,
            this.radius,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    move() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Rebote contra los bordes superior e inferior
        if (this.y - this.radius <= 0) {
            this.y = this.radius;
            this.speedY = Math.abs(this.speedY);
        }

        if (this.y + this.radius >= canvas.height) {
            this.y = canvas.height - this.radius;
            this.speedY = -Math.abs(this.speedY);
        }
    }

    reset() {
        this.x = canvas.width / 2;
        this.y = Math.random() *
            (canvas.height - 2 * this.radius) +
            this.radius;

        // Cambia la direccion horizontal
        this.speedX = -this.speedX;

        // Evita que la pelota quede inmovil
        if (Math.abs(this.speedY) < 1) {
            this.speedY = 2;
        }
    }
}

// Clase Paddle: representa las paletas
class Paddle {
    constructor(
        x, y, width, height, color,
        isPlayerControlled = false
    ) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.isPlayerControlled = isPlayerControlled;
        this.speed = 7;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(
            this.x,
            this.y,
            this.width,
            this.height
        );
    }

    move(direction) {
        if (direction === "up") {
            this.y -= this.speed;
        } else if (direction === "down") {
            this.y += this.speed;
        }

        // La paleta no puede salir del Canvas
        this.y = Math.max(
            0,
            Math.min(
                canvas.height - this.height,
                this.y
            )
        );
    }

    autoMove(ball) {
        const targetY = ball.y - this.height / 2;

        if (this.y + this.height / 2 < ball.y - 10) {
            this.y += this.speed * 0.75;
        } else if (
            this.y + this.height / 2 > ball.y + 10
        ) {
            this.y -= this.speed * 0.75;
        }

        this.y = Math.max(
            0,
            Math.min(
                canvas.height - this.height,
                this.y
            )
        );
    }
}

// Clase Game: administra toda la partida
class Game {
    constructor() {
        // Cinco pelotas con diferente tamano,
        // color y velocidad
        this.balls = [
            new Ball(400, 150, 8, 4, 3, "#ff4757"),
            new Ball(400, 250, 12, -5, 3, "#2ed573"),
            new Ball(400, 350, 15, 4, -5, "#1e90ff"),
            new Ball(400, 450, 10, -6, -4, "#ffa502"),
            new Ball(400, 300, 18, 3, 6, "#e056fd")
        ];

        // Paleta del jugador: 200 de alto,
        // el doble de los 100 originales
        this.paddle1 = new Paddle(
            15, 200, 12, 200, "#00e5ff", true
        );

        // Paleta de la computadora
        this.paddle2 = new Paddle(
            canvas.width - 27,
            250,
            12,
            100,
            "#ff4d6d"
        );

        this.keys = {};
    }

    draw() {
        ctx.clearRect(
            0, 0, canvas.width, canvas.height
        );

        // Linea central decorativa
        ctx.setLineDash([10, 10]);
        ctx.strokeStyle = "#41445f";
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Dibujar todas las pelotas
        this.balls.forEach(ball => ball.draw());

        this.paddle1.draw();
        this.paddle2.draw();
    }

    // Comprueba la colision de una pelota
    // contra una paleta
    checkPaddleCollision(ball, paddle) {
        const overlapsY =
            ball.y + ball.radius >= paddle.y &&
            ball.y - ball.radius <=
                paddle.y + paddle.height;

        const overlapsX =
            ball.x + ball.radius >= paddle.x &&
            ball.x - ball.radius <=
                paddle.x + paddle.width;

        if (!overlapsX || !overlapsY) {
            return;
        }

        // Cambia la direccion solo si la pelota
        // se dirige hacia esa paleta
        if (
            paddle === this.paddle1 &&
            ball.speedX < 0
        ) {
            ball.x = paddle.x + paddle.width +
                ball.radius;
            ball.speedX = Math.abs(ball.speedX);
        } else if (
            paddle === this.paddle2 &&
            ball.speedX > 0
        ) {
            ball.x = paddle.x - ball.radius;
            ball.speedX = -Math.abs(ball.speedX);
        }

        // Modifica un poco la trayectoria vertical
        // dependiendo del punto de impacto
        const relativeImpact =
            (ball.y -
            (paddle.y + paddle.height / 2)) /
            (paddle.height / 2);

        ball.speedY += relativeImpact * 0.8;
        ball.speedY = Math.max(
            -8, Math.min(8, ball.speedY)
        );
    }

    update() {
        // Movimiento de la paleta del jugador
        if (this.keys["ArrowUp"]) {
            this.paddle1.move("up");
        }

        if (this.keys["ArrowDown"]) {
            this.paddle1.move("down");
        }

        // Mover y comprobar cada una de las pelotas
        this.balls.forEach(ball => {
            ball.move();

            // La paleta del jugador detecta
            // las cinco pelotas
            this.checkPaddleCollision(
                ball, this.paddle1
            );

            this.checkPaddleCollision(
                ball, this.paddle2
            );

            // Reiniciar la pelota si sale del campo
            if (
                ball.x + ball.radius < 0 ||
                ball.x - ball.radius > canvas.width
            ) {
                ball.reset();
            }
        });

        // La computadora sigue la pelota
        // que se encuentra mas cerca de ella
        const approachingBalls = this.balls.filter(
            ball => ball.speedX > 0
        );

        if (approachingBalls.length > 0) {
            const targetBall = approachingBalls.reduce(
                (nearest, ball) =>
                    ball.x > nearest.x ? ball : nearest
            );

            this.paddle2.autoMove(targetBall);
        }
    }

    handleInput() {
        window.addEventListener("keydown", event => {
            if (
                event.key === "ArrowUp" ||
                event.key === "ArrowDown"
            ) {
                event.preventDefault();
            }

            this.keys[event.key] = true;
        });

        window.addEventListener("keyup", event => {
            this.keys[event.key] = false;
        });

        window.addEventListener("blur", () => {
            this.keys = {};
        });
    }

    run() {
        this.handleInput();

        const gameLoop = () => {
            this.update();
            this.draw();
            requestAnimationFrame(gameLoop);
        };

        gameLoop();
    }
}

// Iniciar el juego
const game = new Game();
game.run();
